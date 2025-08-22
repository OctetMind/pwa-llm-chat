const DB_NAME = 'llm-chat-db';
const STORE_NAME = 'llm-connections';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, 2); // Increment DB version for schema change

    request.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'friendlyName' });
        // If upgrading from version 1, ensure 'endpoint' can be stored
        // This is handled by the new version, but explicitly adding for clarity
        // No need to create index for endpoint as it's not searched on
      }
      // Ensure PROMPT_STORE_NAME is also created if upgrading from a version before it existed
      if (!db.objectStoreNames.contains(PROMPT_STORE_NAME)) {
        db.createObjectStore(PROMPT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

export interface LLMServiceData {
  friendlyName: string;
  serviceType: string;
  encryptedKey: string;
  endpoint: string | null;
  model: string | null;
}

export async function saveEncryptedKey(data: LLMServiceData): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error saving key: ' + target.error);
    };
  });
}

export async function getEncryptedKey(friendlyName: string): Promise<LLMServiceData | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(friendlyName);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as LLMServiceData);
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

const PROMPT_STORE_NAME = 'user-prompts';

function openPromptsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Increment DB version for new store

    request.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'friendlyName' });
      }
      if (!db.objectStoreNames.contains(PROMPT_STORE_NAME)) {
        db.createObjectStore(PROMPT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest;
      resolve(target.result);
    };

    request.onerror = (event) => {
      const target = event.target as IDBOpenDBRequest;
      reject('IndexedDB error: ' + target.error);
    };
  });
}

export interface LocalPrompt {
  id?: number;
  title: string;
  content: string;
  is_public: boolean; // Although local, keeping for consistency
}

export async function saveLocalPrompt(prompt: LocalPrompt): Promise<number> {
  const database = await openPromptsDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PROMPT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    const request = store.put(prompt);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error saving local prompt: ' + target.error);
    };
  });
}

export async function getLocalPrompts(): Promise<LocalPrompt[]> {
  const database = await openPromptsDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PROMPT_STORE_NAME], 'readonly');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as LocalPrompt[]);
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error getting local prompts: ' + target.error);
    };
  });
}

export async function deleteLocalPrompt(id: number): Promise<void> {
  const database = await openPromptsDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PROMPT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      const target = event.target as IDBRequest;
      reject('Error deleting local prompt: ' + target.error);
    };
  });
}