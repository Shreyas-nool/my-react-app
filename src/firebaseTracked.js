import * as rtdb from "firebase/database";
import { db } from "./firebase";

// wrap ref()
export function trackedRef(dbInstance, path) {
  console.groupCollapsed("🔥 DB ACCESS");
  console.log("Path:", path);
  console.log("Operation: REF");
  console.log("Time:", new Date().toISOString());
  console.trace(); // 👈 shows where it was called
  console.groupEnd();

  return rtdb.ref(dbInstance, path);
}

// re-export everything else
export const {
  onValue,
  set,
  update,
  push,
  remove,
  off,
} = rtdb;

export { db };