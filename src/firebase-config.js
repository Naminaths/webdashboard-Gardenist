import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Use environment variables if available, otherwise fallback to hardcoded values
// This ensures the app works even if .env is missing or not searching correctly
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let database;

try {
    // Singleton Pattern: Prevent "App already exists" errors during Hot Reload
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp(); // Use existing app
    }
    database = getDatabase(app);
    console.log("Firebase Connected Successfully", firebaseConfig.projectId);
} catch (e) {
    console.error("Firebase Init Error", e);
    if (!e.message.includes("already exists")) {
        alert("Gagal koneksi Firebase: " + e.message);
    }
}

export { database };
