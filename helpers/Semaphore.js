const { start } = require('keystone');
const MemoryLRUCache = require('./MemoryLRUCache');
const fileCache = new MemoryLRUCache();

const MIN_TIMEOUT = 100;
const DEFAULT_TIMEOUT = 10000; // 10 seconds

class Semaphore {
    constructor(max = 1, name = 'Unnamed', shuffle = false, throwOnTimeout = false, cache = fileCache, options = {}) {
        if (typeof max !== 'number' || max <= 0) {
            throw new Error('Max must be a positive number!');
        }

        this.initialized = false;
        this.max = max;
        this.name = "semaphore:" + (name || 'Unnamed');
        this.shuffle = shuffle;
        this.throwOnTimeout = throwOnTimeout;
        this.cache = cache;
        this.options = {
            maxBackoff: 60000,  // Default max backoff is 60 seconds
            resetMultiplier: 3, // Default reset multiplier for timeout
            retryCount: 3,      // Default retry count for cache operations
            ...options
        };
        
        this.metrics = {
            name: (name || 'Unnamed'),
            currentCount: 0,
            maximum: this.max,
            acquisitions: 0,            
            failures: 0,
            timeouts: 0,
            lockTimeTotal: 0
        };

        this.init();
    }

    async init() {
        try {
            let existing = await this.cache.get(this.name);
            if (existing) existing = parseInt(existing, 10);
            
            if (existing == undefined || isNaN(existing)) {
                // Initialize counter at 0 with a default TTL
                await this.cache.set(this.name, 0, DEFAULT_TIMEOUT);
            } else if (existing >= this.max) {
                // Reset counter after a timeout
                const timeout = DEFAULT_TIMEOUT * this.options.resetMultiplier;
                this._resetTimer = setTimeout(async () => {
                    try {
                        existing = await this.cache.get(this.name);
                        if (existing) existing = parseInt(existing, 10);

                        if (existing >= this.max) {
                            await this.cache.set(this.name, 0, MIN_TIMEOUT);
                            console.warn(`Semaphore '${this.name}' counter reset after ${timeout / 1000} seconds. ${this.getMetricsStr()}`);
                        }
                    } catch (err) {
                        console.error(`Error during semaphore ${this.getMetricsStr()}`, err);
                    }
                }, timeout);
            }

            this.initialized = true;
        } catch (err) {
            console.error(`Failed to initialize semaphore ${this.getMetricsStr()}`, err);
            this.initialized = false;
            throw err;
        }
    }

    async awaitInit() {
        if (!this.initialized) {
            await awaitFor(
                () => this.initialized,
                DEFAULT_TIMEOUT,
                MIN_TIMEOUT,
                `Semaphore '${this.name}' not initialized after ${DEFAULT_TIMEOUT / 1000} seconds waiting...`
            );
        }
    }

    async _aquireLock(lockTimeout) {        
        let currentCount = await this.getCounter();
        if (await this.canAcquire(currentCount)) {
            const acquired = await this.cache.set(this.name, currentCount + 1, lockTimeout);
            if (acquired) {
                //console.debug(`Semaphore '${this.name}' acquired ${this.getMetricsStr()}`);
                return true;
            } else {
                console.warn(`Failed to acquire semaphore ${this.getMetricsStr()}`);
            }
        } else {
            console.warn(`Semaphore '${this.name}' is full, cannot acquire lock! ${this.getMetricsStr()}`);
        }
    }

    async acquire(timeout = DEFAULT_TIMEOUT) {
        await this.awaitInit();

        const startTime = Date.now();
        let counter = 0;
        let lockTimeout = Math.max(MIN_TIMEOUT, timeout - (Date.now() - startTime));
        let currentCount = 0;
        
        while ((Date.now() - startTime) < timeout) {
            currentCount = await this.getCounter();

            if (this.initialized && !isNaN(currentCount) && currentCount < this.max) {
                if (this._resetTimer) {
                    clearTimeout(this._resetTimer);
                    this._resetTimer = null;
                }

                const acquired = await this.cache.set(this.name, currentCount + 1, lockTimeout);
                if (acquired) {
                    //console.debug(`Semaphore '${this.name}' acquired in ${Date.now() - startTime}ms, ${this.getMetricsStr()}`);
                    
                    this.metrics.currentCount = currentCount + 1;
                    this.metrics.acquisitions += 1;
                    this.metrics.lastLockTime = Date.now();
                    this.metrics.lockTimeTotal += Date.now() - startTime;

                    return true;
                } else {
                    this.metrics.failures += 1;
                }
            } else {
                // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms, 6400ms, 12800ms, 25600ms, 51200ms
                const backoff = Math.min(Math.pow(2, ++counter) * 100, this.options.maxBackoff);
                const jitter = Math.random() * 0.2 * backoff; // Add up to 20% jitter
                const randomizedBackoff = this.shuffle ? backoff + jitter : backoff;

                await new Promise(resolve => setTimeout(resolve, randomizedBackoff));
                //console.debug(`Waiting for semaphore '${this.name}' to be released. Timeout: ${(timeout - (Date.now() - startTime)) / 1000} seconds, ${this.getMetricsStr()}`);
            }
        }

        // Update metrics for timeout
        this.metrics.lastLockTime = null;
        this.metrics.failures += 1;
        this.metrics.timeouts += 1;

        if (this.throwOnTimeout) {
            throw new Error(`Timeout acquiring semaphore '${this.name}' after ${timeout}ms, ${this.getMetricsStr()}`);
        } else {
            console.warn(`Timeout acquiring semaphore '${this.name}' after ${timeout}ms, ${this.getMetricsStr()}`);
        }

        return false;
    }

    async release() {
        if (this.metrics.lastLockTime == null) {
            //return console.debug(`Cannot release semaphore '${this.name}' without acquiring it first. ${this.getMetricsStr()}`);
        }

        await this.awaitInit();

        const currentCount = await this.getCounter();
        const lockDuration = this.metrics.lastLockTime ? Date.now() - this.metrics.lastLockTime : 0;
        await this.cache.set(this.name, Math.max(currentCount - 1, 0), DEFAULT_TIMEOUT);
       
        this.metrics.currentCount = currentCount - 1;
        if(currentCount - 1 <= 0)
            this.metrics.lastLockTime = null;
                
        //console.debug(`Semaphore '${this.name}' released after holding for ${lockDuration}ms, ${this.getMetricsStr()}`);
    }

    async getCounter() {
        await this.awaitInit();

        const retryCount = this.options.retryCount;
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                let count = await this.cache.get(this.name);
                
                if (count != undefined) count = parseInt(count, 10);
                if (isNaN(count)) count = 0;

                return count;
            } catch (err) {
                console.error(`Attempt ${attempt}: Error fetching semaphore! ${this.getMetricsStr()}`, err);
                if (attempt === retryCount) {
                    throw err;
                }
            }
        }
    }

    async canAcquire() { 
        var currentCount = Array.from(arguments).find(Number) ?? await this.getCounter();
        return this.initialized && !isNaN(currentCount) && currentCount < this.max;
    }

    isLocked() {
        return this.metrics.lastLockTime != null;
    }

    getLockTime() {
        return this.metrics.lastLockTime ? Date.now() - this.metrics.lastLockTime : 0;
    }

    getMetricsStr(){
        var short = generateShortHand(this.metrics);
        return "(" + Object.keys(short).map(k => `${k}:${short[k]}`).join(",") + ")";
    }
}

function generateShortHand(obj) {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const result = {};
    const usedShorthands = new Set();

    function extractConsonants(str) {
        const cons = [...str].filter(char => consonants.includes(char.toLowerCase()));
        if (cons[0] != str[0]) cons.unshift(str[0]);
        return cons;
    }

    function findUniqueShorthand(key) {
        const cons = extractConsonants(key);
        const combinations = [];

        // Generate shorthand candidates based on the rules
        for (let i = 0; i < cons.length; i++) {
            for (let j = i + 1; j < cons.length; j++) {
                for (let k = j + 1; k < cons.length; k++) {
                    combinations.push(cons[i] + cons[j] + cons[k]);
                }
            }
        }

        // Append additional consonants for fallback
        let fallbackIndex = 0;
        while (combinations.length < 26) {
            const fallback =
                (cons[0] || '') +
                (cons[1] || '') +
                (consonants[fallbackIndex++] || '');
            combinations.push(fallback);
        }

        // Find the first unique shorthand
        for (const shorthand of combinations) {
            if (!usedShorthands.has(shorthand)) {
                usedShorthands.add(shorthand);
                return shorthand;
            }
        }

        throw new Error(`Unable to generate unique shorthand for key: ${key}`);
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const shorthand = findUniqueShorthand(key);
            result[shorthand] = obj[key];
        }
    }

    return result;
}

let intervalId = null; // Shared across all calls
let pendingConditions = []; // List of all condition functions across calls
let currentCheckInterval = null; // The currently active check interval (lowest interval)

function awaitFor(
    checkCondition,                   // Function to check if condition is met
    timeoutInterval = 10 * 60 * 1000, // Default: 10 minutes
    checkInterval = 1000,             // Default: 1 second
    timeoutError = 'Timeout waiting for condition!'
) {
    return new Promise((resolve, reject) => {
        // Sanitize input values
        timeoutInterval = Math.max(0, timeoutInterval); // Allow Infinity as is
        checkInterval = Math.max(10, checkInterval);    // Minimum 10ms to avoid rapid spamming

        // Randomize the check interval slightly
        checkInterval *= (1 + Math.floor(Math.random() * .2)); // Add random delay of up to 20%

        const startTime = Date.now(); // Record the start time
        const thisCondition = {
            func: () => {
                thisCondition.lastExecute = Date.now(); // Update last execute time
                return checkCondition(); // Call the condition function
            },
            resolve, reject,
            resolved: false,
            lastExecute: Date.now() - timeoutInterval,
            get nextExecute() {
                return thisCondition.lastExecute + checkInterval;
            },
            get canExecute() {
                return Date.now() >= thisCondition.nextExecute;
            }
        }

        // Add the new condition to the shared list
        pendingConditions.push(thisCondition);

        // Check if the current checkInterval is lower than the previous one
        if (intervalId == null || currentCheckInterval === null || checkInterval < currentCheckInterval) {
            // If so, reset the shared interval to this new lower checkInterval
            if (intervalId !== null)
                clearInterval(intervalId); // Clear existing interval

            // Set the new lowest check interval
            currentCheckInterval = checkInterval;

            // Reinitiate the interval to check conditions at the new interval rate
            intervalId = setInterval(checkConditions, currentCheckInterval);

            // Check conditions immediately
            checkConditions();
        }

        // Function to check conditions periodically
        async function checkConditions() {
            const elapsedTime = Date.now() - startTime; // Calculate elapsed time

            // Reject if timeout interval has elapsed (only triggers for finite timeout)
            if (elapsedTime >= timeoutInterval) {
                clearInterval(intervalId); // Stop periodic checks if timeout
                intervalId = null;          // Reset the shared timer state
                reject(new Error(`${timeoutError}! awaitFor(..) timeout after ${elapsedTime / 1000} secs`));
                return;
            }

            // Iterate through each condition function and check if it's resolved
            for (const condition of pendingConditions) {
                // Skip already resolved conditions
                if (condition.resolved)
                    continue;

                // Skip conditions that are not ready to execute
                if (!condition.canExecute)
                    continue;

                try {
                    const conditionMet = await condition.func();
                    if (conditionMet) {
                        condition.resolved = true;          // Mark condition as resolved
                        condition.resolve(conditionMet);    // Resolve the condition function
                    }
                } catch (error) {
                    // If one condition throws an error, send a reject and continue checking others
                    condition.reject(error);     // Reject this condition with the error
                }
            }

            // If all conditions have been resolved, stop checking
            if (pendingConditions.every(c => c.resolved)) {
                clearInterval(intervalId); // Stop periodic checks if all resolved
                intervalId = null;          // Reset the shared timer state
                resolve(true);              // Resolve when all conditions are met
            }

            // Remove resolved conditions after each check
            pendingConditions = pendingConditions.filter(c => !c.resolved);
        }
    });
}

module.exports = Semaphore;