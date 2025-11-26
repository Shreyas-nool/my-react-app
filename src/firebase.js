// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // import Realtime DB

const firebaseConfig = {
  apiKey: "AIzaSyCFD74RiLa8nyR9h9ic6YfQleOxJde0TE0",
  authDomain: "sr-enterprises-d287b.firebaseapp.com",
  databaseURL: "https://sr-enterprises-d287b-default-rtdb.firebaseio.com", // Add this
  projectId: "sr-enterprises-d287b",
  storageBucket: "sr-enterprises-d287b.appspot.com",
  messagingSenderId: "596370637358",
  appId: "1:596370637358:web:13ee329ca7fbcd8542d5bf",
};

const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);

export default app;