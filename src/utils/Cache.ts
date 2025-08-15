import moment from "moment";
import { openDB } from 'idb';

const STORE_NAME = 'CardStatsStore'
const DB_NAME = 'CardStatsDB'
const CACHE_EXPIRATION_TIME = 1 * 60 * 60 * 1000;

const getDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};
export const setCache = async <T>(data: T, dbName: string): Promise<void> => {
  const db = await getDB();
  const timestamp = Date.now();
  await db.put(STORE_NAME, { data, timestamp }, dbName);
};

export const getCache = async <T>(dbName: string): Promise<{ data: T; timestamp: number } | undefined> => {
  const db = await getDB();
  return db.get(STORE_NAME, dbName);
};

export const clearCache = async (dbName: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE_NAME, dbName);
};
export const isCacheExpired = (timestamp: number, partial: number = 1.0): boolean => {
  const cacheDate = moment(timestamp);
  const currentDate = moment();
  return currentDate.diff(cacheDate) > (CACHE_EXPIRATION_TIME * partial);
};