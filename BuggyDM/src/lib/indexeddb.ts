export interface OfflineAction {
  id?: number;
  action_type: "pick_item" | "pack_finish" | "scan_inventory" | "returns";
  payload: unknown;
  timestamp: number;
}

export class IndexedDbService {
  private static DB_NAME = "buggyops_db";
  private static DB_VERSION = 2;

  private static getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Store cached orders lists
        if (!db.objectStoreNames.contains("orders_cache")) {
          db.createObjectStore("orders_cache", { keyPath: "id" });
        }

        // Store sync transaction actions
        if (!db.objectStoreNames.contains("offline_action_queue")) {
          db.createObjectStore("offline_action_queue", {
            keyPath: "id",
            autoIncrement: true
          });
        }

        // Store barcode lookup lists
        if (!db.objectStoreNames.contains("inventory_cache")) {
          db.createObjectStore("inventory_cache", { keyPath: "barcode" });
        }

        // Store dynamic navigation tree
        if (!db.objectStoreNames.contains("navigation_cache")) {
          db.createObjectStore("navigation_cache", { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Set order list
  static async cacheOrder<T extends { id: IDBValidKey }>(order: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("orders_cache", "readwrite");
      tx.objectStore("orders_cache").put(order);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get single order from cache
  static async getCachedOrder<T = unknown>(orderId: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("orders_cache", "readonly");
      const req = tx.objectStore("orders_cache").get(orderId);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  // Get all cached orders
  static async getCachedOrders<T = unknown>(): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("orders_cache", "readonly");
      const req = tx.objectStore("orders_cache").getAll();
      req.onsuccess = () => resolve((req.result || []) as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  // Queue an offline action
  static async queueAction(action: Omit<OfflineAction, "timestamp">): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_action_queue", "readwrite");
      const store = tx.objectStore("offline_action_queue");
      const req = store.add({ ...action, timestamp: Date.now() });
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  // Get action queue
  static async getActionQueue(): Promise<OfflineAction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_action_queue", "readonly");
      const req = tx.objectStore("offline_action_queue").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Remove action from sync queue
  static async removeAction(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_action_queue", "readwrite");
      tx.objectStore("offline_action_queue").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Cache navigation tree
  static async cacheNavigationTree<T>(tree: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("navigation_cache", "readwrite");
      tx.objectStore("navigation_cache").put({ key: "active_tree", data: tree, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get cached navigation tree
  static async getCachedNavigationTree<T = unknown>(): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("navigation_cache", "readonly");
      const req = tx.objectStore("navigation_cache").get("active_tree");
      req.onsuccess = () => resolve((req.result?.data || []) as T[]);
      req.onerror = () => reject(req.error);
    });
  }
}
