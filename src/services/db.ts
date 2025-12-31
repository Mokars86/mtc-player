import { openDB } from 'idb';
import { MediaItem } from '../types';

const DB_NAME = 'mtc-player-db';
const STORE_NAME = 'local-media';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveMediaToDB = async (item: MediaItem, file: Blob) => {
    const db = await initDB();
    await db.put(STORE_NAME, { ...item, fileBlob: file });
};

export const saveBatchMediaToDB = async (items: { item: MediaItem, file: Blob }[]) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await Promise.all(items.map(({ item, file }) => store.put({ ...item, fileBlob: file })));
    await tx.done;
};

export const loadMediaFromDB = async (): Promise<MediaItem[]> => {
    const db = await initDB();
    const storedItems = await db.getAll(STORE_NAME);

    return storedItems.map((stored: any) => {
        // Recreate Object URL from the stored Blob
        const { fileBlob, ...itemData } = stored;
        if (fileBlob) {
            const newUrl = URL.createObjectURL(fileBlob);
            return { ...itemData, mediaUrl: newUrl };
        }
        return itemData;
    });
};

export const clearMediaDB = async () => {
    const db = await initDB();
    await db.clear(STORE_NAME);
};

export const removeMediaFromDB = async (id: string) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
