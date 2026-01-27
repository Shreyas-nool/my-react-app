import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import axios from "axios";

import {
  ref,
  push,
  query,
  orderByChild,
  endAt,
  get,
  remove,
} from "firebase/database";
import { db } from "./firebase";

/* =====================================================
   🔥 FIREBASE DB ACCESS TRACKING → admin/dbAccessLogs
   ===================================================== */
if (import.meta.env.DEV) {
  const originalRef = ref;

  // We CANNOT patch ref like this in modular API.
  // Instead, create a wrapper function:

  const trackedRef = (path) => {
    const trace = new Error().stack;

    console.groupCollapsed("🔥 Firebase DB Access");
    console.log("📍 Path:", path);
    console.trace("📌 Called from");
    console.groupEnd();

    try {
      push(ref(db, "admin/dbAccessLogs"), {
        path,
        url: window.location.href,
        time: new Date().toISOString(),
        timestamp: Date.now(),
        stack: trace,
        userAgent: navigator.userAgent,
      });
    } catch (e) {
      console.log("Failed to log DB access:", e);
    }

    return originalRef(db, path);
  };

  // Replace your app's ref usage with trackedRef
  // (e.g., use trackedRef instead of ref in your code)
}

/* =====================================================
   🚨 ERROR LOGGER → admin/appErrors
   ===================================================== */
const logError = async (errorObj) => {
  try {
    await push(ref(db, "admin/appErrors"), {
      message: errorObj.message || "Unknown Error",
      stack: errorObj.stack || null,
      url: window.location.href,
      time: new Date().toISOString(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      extra: errorObj.extra || null,
      source: errorObj.source || null,
      line: errorObj.line || null,
      column: errorObj.column || null,
    });
  } catch (e) {
    console.log("Failed to log error:", e);
  }
};

/* =====================================================
   🧹 CLEANUP OLD ERRORS (AUTO)
   ===================================================== */
const cleanupOldErrors = async () => {
  try {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - ONE_WEEK_MS;

    const q = query(
      ref(db, "admin/appErrors"),
      orderByChild("timestamp"),
      endAt(cutoff)
    );

    const snap = await get(q);
    const data = snap.val();

    if (!data) return;

    for (const key of Object.keys(data)) {
      await remove(ref(db, `admin/appErrors/${key}`));
    }

    console.log("🧹 Old errors cleaned up");
  } catch (e) {
    console.log("Cleanup failed:", e);
  }
};

cleanupOldErrors();

/* =====================================================
   🌐 GLOBAL ERROR HANDLERS
   ===================================================== */

// Uncaught JS errors
window.onerror = function (message, source, lineno, colno, error) {
  logError({
    message,
    stack: error?.stack,
    source,
    line: lineno,
    column: colno,
    extra: { source, lineno, colno },
  });
};

// Unhandled promise rejections
window.onunhandledrejection = function (event) {
  logError({
    message: event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack || null,
  });
};

// console.error override
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);

  if (typeof args[0] === "string" && args[0].includes("Failed to log")) {
    return;
  }

  logError({
    message: args[0]?.toString() || "Console Error",
    stack: args[1]?.stack || null,
    extra: JSON.stringify(args),
  });
};

/* =====================================================
   🌐 AXIOS LOGGING
   ===================================================== */
axios.interceptors.request.use((config) => {
  console.log("🚀 Axios:", config.method?.toUpperCase(), config.url);
  return config;
});

/* =====================================================
   ⚛️ RENDER APP
   ===================================================== */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);