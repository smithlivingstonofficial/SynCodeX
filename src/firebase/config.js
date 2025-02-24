import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCz8q1M5AY-gbDRw8fwpLYSU1RR8vpNipg",
    authDomain: "miracle-fm.firebaseapp.com",
    databaseURL: "https://miracle-fm-default-rtdb.firebaseio.com",
    projectId: "miracle-fm",
    storageBucket: "miracle-fm.appspot.com",
    messagingSenderId: "586363615394",
    appId: "1:586363615394:web:6a6b8ed728192f7caa7ffb",
    measurementId: "G-2PX140WBY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
        console.log(
            "Firestore: Multiple tabs open, persistence can only be enabled in one tab."
        );
    } else if (err.code === "unimplemented") {
        console.log("Firestore: The current browser does not support all features.");
    }
});

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
