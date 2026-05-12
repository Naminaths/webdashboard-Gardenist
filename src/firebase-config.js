import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const fallbackFirebaseConfig = {
    apiKey: "AIzaSyBoPQqYYAf2qjNCNur0IqQMiCj-sLyWvOs",
    authDomain: "webdashboard-gardenist.firebaseapp.com",
    databaseURL: "https://webdashboard-gardenist-default-rtdb.firebaseio.com/",
    projectId: "webdashboard-gardenist",
    storageBucket: "webdashboard-gardenist.firebasestorage.app",
    messagingSenderId: "608799094403",
    appId: "1:608799094403:web:0ac4b0e8ff3b72c660cdb6",
    measurementId: "G-VL7W2Z6ECV"
};

const env = import.meta.env || {};
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL || fallbackFirebaseConfig.databaseURL,
    projectId: env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId
};

let app;
let database;

try {
    if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
        throw new Error("Konfigurasi Firebase belum lengkap: projectId atau databaseURL kosong.");
    }

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
