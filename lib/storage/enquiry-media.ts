"use client";

const DB_NAME = "evol-order-dash";
const DB_VERSION = 1;
const STORE_NAME = "enquiry-media";

export interface StoredEnquiryMedia {
  id: string;
  enquiryId: string;
  productId: string;
  name: string;
  mimeType: string;
  size: number;
  type: "image" | "video";
  createdAt: string;
  blob: Blob;
}

type StoredEnquiryMediaMeta = Omit<StoredEnquiryMedia, "blob">;

function generateMediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-enquiry", "enquiryId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await handler(store);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    return result;
  } finally {
    db.close();
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEnquiryMedia(input: {
  enquiryId: string;
  productId: string;
  file: File;
  type: "image" | "video";
}): Promise<StoredEnquiryMediaMeta> {
  const record: StoredEnquiryMedia = {
    id: generateMediaId(),
    enquiryId: input.enquiryId,
    productId: input.productId,
    name: input.file.name,
    mimeType: input.file.type,
    size: input.file.size,
    type: input.type,
    createdAt: new Date().toISOString(),
    blob: input.file,
  };

  await withStore("readwrite", async (store) => {
    await requestToPromise(store.put(record));
  });

  const { blob: _blob, ...meta } = record;
  return meta;
}

export async function getEnquiryMedia(mediaId: string) {
  const record = await withStore("readonly", async (store) => {
    return requestToPromise(store.get(mediaId));
  });

  return (record as StoredEnquiryMedia | undefined) ?? null;
}

export async function deleteEnquiryMedia(mediaId: string) {
  await withStore("readwrite", async (store) => {
    await requestToPromise(store.delete(mediaId));
  });
}
