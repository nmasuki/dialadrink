var ls = require('../helpers/LocalStorage').getInstance('cache');
class LocalStorageLRUCache {
    constructor(maxEntries = 100, defaultTTL = 24 * 60 * 60 * 1000) {
        this.maxEntries = maxEntries;
        this.defaultTTL = defaultTTL; // Default TTL in milliseconds
    }

    get(key) {
        const entry = ls.get(key);

        if (!entry)
            return null; // Cache miss
        
        const { value, expiry } = entry;

        if (Date.now() > expiry) {
            // Cache expired
            ls.delete(key);
            return null;
        }

        // Update access time for LRU
        entry.lastAccess = Date.now();

        // Update the cache entry
        return value;
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;

        // Add or update the cache entry
        ls.save({ _id: key,  value, expiry, lastAccess: Date.now(), });
    }

    put(key, value, ttl) {
        return this.set(key, value, ttl);
    }

    async clear() {
        
    }
}

module.exports = LocalStorageLRUCache;
