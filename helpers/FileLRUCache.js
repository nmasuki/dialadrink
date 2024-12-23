const fs = require("fs").promises;
const path = require("path");
const os = require("os");

class FileLRUCache {
  constructor(maxEntries = 100) {
    this.cacheDir = path.join(os.tmpdir(), "file_lru_cache");
    this.maxEntries = maxEntries;
    this.cacheMap = new Map(); // In-memory map to track file usage
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const key = path.basename(file, ".json");
          this.cacheMap.set(key, stats.mtimeMs); // Store modification time
        }
      }
    } catch (err) {
      console.error("Failed to initialize cache directory:", err);
    }
  }

  async get(key) {
    const filePath = this._getFilePath(key);

    try {
      const data = await fs.readFile(filePath, "utf-8");
      const { value, expiry } = JSON.parse(data);

      if (Date.now() > expiry) {
        await fs.unlink(filePath);
        this.cacheMap.delete(key);
        return null; // Cache expired
      }

      // Update access time for LRU
      this.cacheMap.set(key, Date.now());
      return value;
    } catch (err) {
      if (err.code === "ENOENT") {
        return null; // Cache miss
      }
      throw err; // Propagate other errors
    }
  }

  async put(key, value, ttl) {
    const filePath = this._getFilePath(key);
    const expiry = Date.now() + ttl;

    const data = JSON.stringify({ value, expiry });
    await fs.writeFile(filePath, data, "utf-8");

    // Update access time for LRU
    this.cacheMap.set(key, Date.now());

    // Enforce LRU policy
    if (this.cacheMap.size > this.maxEntries) {
      await this._enforceLRU();
    }
  }

  async set() {
    return this.put(...arguments);
  }

  async clear() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        await fs.unlink(filePath);
      }
      this.cacheMap.clear();
    } catch (err) {
      console.error("Failed to clear cache directory:", err);
    }
  }

  async _enforceLRU() {
    const oldestKey = [...this.cacheMap.entries()].sort((a, b) => a[1] - b[1])[0][0];
    const filePath = this._getFilePath(oldestKey);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`Failed to delete expired cache file: ${filePath}`, err);
    }

    this.cacheMap.delete(oldestKey);
  }

  _getFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }
}

module.exports = FileLRUCache;
