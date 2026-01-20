import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { firebaseConfig } from "./config.js";

let database = null;
try {
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (e) {
    console.error("Firebase Init Error", e);
}

export { database };
