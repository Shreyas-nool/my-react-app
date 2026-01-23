// src/utils/errorLogger.js
import { db } from "../firebase";
import { ref, push } from "firebase/database";

const logError = async (errorObj) => {
  try {
    await push(ref(db, "appErrors"), {
      message: errorObj.message || "Unknown Error",
      stack: errorObj.stack || null,
      url: window.location.href,
      time: new Date().toISOString(),
      userAgent: navigator.userAgent,
      extra: errorObj.extra || null,
    });
  } catch (e) {
    console.error("Failed to log error to Firebase:", e);
  }
};

export default logError;
