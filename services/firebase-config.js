// Firebase Configuration and Toggle for Real/Mock Database
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Set to true when you want to connect to a real Firebase Firestore instance
// Ensure you have initialized Firebase in your project before setting to true.
export const useRealFirebase = false;
