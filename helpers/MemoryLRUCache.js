class MemoryLRUCache {
    constructor(maxEntries = 100, defaultTTL = 3600000) {
        this.maxEntries = maxEntries;
        this.defaultTTL = defaultTTL; // Default TTL in milliseconds
        this.cacheMap = new Map(); // In-memory map to track key-value pairs and expiry
    }

    async get(key) {
        const entry = this.cacheMap.get(key);

        if (!entry) {
            return null; // Cache miss
        }

        const { value, expiry } = entry;

        if (Date.now() > expiry) {
            // Cache expired
            this.cacheMap.delete(key);
            return null;
        }

        // Update access time for LRU
        entry.lastAccess = Date.now();
        return value;
    }

    async set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;

        // Add or update the cache entry
        this.cacheMap.set(key, {
            value,
            expiry,
            lastAccess: Date.now(),
        });

        // Enforce LRU policy
        if (this.cacheMap.size > this.maxEntries) {
            this._enforceLRU();
        }
    }

    async put(key, value, ttl) {
        return this.set(key, value, ttl);
    }

    async clear() {
        this.cacheMap.clear();
    }

    _enforceLRU() {
        // Find the least recently used entry
        const oldestKey = [...this.cacheMap.entries()].reduce((oldest, [key, entry]) => {
            return !oldest || entry.lastAccess < this.cacheMap.get(oldest).lastAccess ? key : oldest;
        }, null);

        // Remove the oldest entry
        if (oldestKey !== null) {
            this.cacheMap.delete(oldestKey);
        }
    }
}

module.exports = MemoryLRUCache;
