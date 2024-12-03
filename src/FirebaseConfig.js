// src/FirebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import { getStorage } from 'firebase/storage'; // Import Storage

const firebaseConfig = {
  apiKey: "AIzaSyCLvnhZcV0vQ-u5_Co64PaDovbWXaHym38",
  authDomain: "syncodex.firebaseapp.com",
  projectId: "syncodex",
  storageBucket: "syncodex.appspot.com",
  messagingSenderId: "1054429357028",
  appId: "1:1054429357028:web:4233ddef8c4f3c9771ddf1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Storage

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const githubProvider = new GithubAuthProvider();

// Export the necessary modules
export { auth, googleProvider, facebookProvider, microsoftProvider, githubProvider, db, storage }; // Include db and storage