const DB_NAME = 'llm-chat-db';
const STORE_NAME = 'llm-connections';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'friendlyName' });
      }
    };

    request.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest;
      db = target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      const target = event.target as IDBOpenDBRequest;
      reject('IndexedDB error: ' + target.error);
    };
  });
}

export async function saveEncryptedKey(friendlyName: string, serviceType: string, encryptedKey: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ friendlyName, serviceType, encryptedKey });

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error saving key: ' + target.error);
    };
  });
}

export async function getEncryptedKey(friendlyName: string): Promise<{ serviceType: string, encryptedKey: string } | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(friendlyName);

    request.onsuccess = () => {
      if (request.result) {
        resolve({ serviceType: request.result.serviceType, encryptedKey: request.result.encryptedKey });
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error getting key: ' + target.error);
    };
  });
}

export async function deleteEncryptedKey(friendlyName: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(friendlyName);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error deleting key: ' + target.error);
    };
  });
}

export async function getAllFriendlyNames(): Promise<string[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error getting all friendly names: ' + target.error);
    };
  });
}