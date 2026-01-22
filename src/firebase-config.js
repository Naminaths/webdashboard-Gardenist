import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBoPQqYYAf2qjNCNur0IqQMiCj-sLyWvOs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "webdashboard-gardenist.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://webdashboard-gardenist-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "webdashboard-gardenist",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "webdashboard-gardenist.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "608799094403",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:608799094403:web:0ac4b0e8ff3b72c660cdb6",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VL7W2Z6ECV"
};

let app;
let database;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp(); // Use existing app if already initialized
    }
    database = getDatabase(app);
} catch (e) {
    console.error("Firebase Init Error", e);
    // Suppress alert for common "already exists" error in HMR if it somehow slips through
    if (!e.message.includes("already exists")) {
        alert("Gagal koneksi Firebase: " + e.message);
    }
}

export { database };
