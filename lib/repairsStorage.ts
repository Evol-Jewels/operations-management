import type { Repair } from "./repairs";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("evol-local-repairs", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("repairs", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Local storage is unavailable. Enable browser storage and try again.",
        ),
      );
    request.onblocked = () =>
      reject(new Error("Close other dashboard tabs and try again."));
  });
}

export async function readRepairs(): Promise<Repair[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("repairs", "readonly");
    const request = transaction.objectStore("repairs").getAll();
    transaction.oncomplete = () => {
      database.close();
      const repairs: Repair[] = request.result;
      resolve(
        repairs
          .map((repair) => ({ ...repair, category: repair.category ?? "" }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    };
    transaction.onerror = () => {
      database.close();
      reject(new Error("Could not load local repairs."));
    };
  });
}

export async function saveRepair(repair: Repair): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("repairs", "readwrite");
    transaction.objectStore("repairs").put(repair);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      reject(
        new Error(
          "Could not save the repair. Check available browser storage and try again.",
        ),
      );
    };
  });
}
