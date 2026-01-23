import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import axios from "axios";
import { db } from "./firebase";
import { ref, push, query, orderByChild, endAt, get, remove } from "firebase/database";

// =====================
// Error Logger
// =====================
const logError = async (errorObj) => {
  try {
    await push(ref(db, "appErrors"), {
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
    console.error("Failed to log error to Firebase:", e);
  }
};

// =====================
// Cleanup Old Errors (Auto Delete)
// =====================
const cleanupOldErrors = async () => {
  try {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - ONE_WEEK_MS;

    const oldErrorsQuery = query(
      ref(db, "appErrors"),
      orderByChild("timestamp"),
      endAt(cutoff)
    );

    const snap = await get(oldErrorsQuery);
    const oldErrors = snap.val();

    if (!oldErrors) return;

    for (const key of Object.keys(oldErrors)) {
      await remove(ref(db, `appErrors/${key}`));
    }

    console.log("🧹 Old errors cleaned up");
  } catch (e) {
    console.error("Cleanup failed:", e);
  }
};

// Run cleanup on app load
cleanupOldErrors();

// =====================
// Global Error Handling
// =====================

// 1️⃣ uncaught JS errors
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

// 2️⃣ unhandled promise rejections
window.onunhandledrejection = function (event) {
  logError({
    message: event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack,
  });
};

// 3️⃣ console.error override
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);

  // Prevent infinite loops from logging errors about logging errors
  if (args[0] && typeof args[0] === "string" && args[0].includes("Failed to log error")) {
    return;
  }

  logError({
    message: args[0]?.toString() || "Console Error",
    stack: args[1]?.stack || null,
    extra: JSON.stringify(args),
  });
};

// =====================
// Axios Logging (Optional)
// =====================
axios.interceptors.request.use((config) => {
  console.log(
    "🚀 Axios request:",
    config.method.toUpperCase(),
    config.url
  );
  return config;
});

// =====================
// Render App
// =====================
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
