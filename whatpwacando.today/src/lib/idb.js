export const IDBConfig = {
  name: "pwa-db",
  version: 1,
  store: {
    name: `pwa-store`,
    keyPath: "timestamp",
  },
};

export const createIndexedDB = ({ name, version, store }) => {
  const request = self.indexedDB.open(name, version);

  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(store.name)) {
        db.createObjectStore(store.name, { keyPath: store.keyPath });
      }

      [...db.objectStoreNames]
        .filter((name) => name !== store.name)
        .forEach((name) => db.deleteObjectStore(name));
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getStoreFactory =
  (dbName, version) =>
  ({ name }, mode = "readonly") => {
    return new Promise((resolve, reject) => {
      const request = self.indexedDB.open(dbName, version);

      request.onsuccess = (e) => {
        const db = request.result;
        const transaction = db.transaction(name, mode);
        const store = transaction.objectStore(name);

        return resolve(store);
      };

      request.onerror = (e) => reject(request.error);
    });
  };

const openStore = getStoreFactory(IDBConfig.name, IDBConfig.version);

export const getStore = () => openStore(IDBConfig.store, "readwrite");

createIndexedDB(IDBConfig);
