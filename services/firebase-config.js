// Firebase Configuration and Toggle for Real/Mock Database
let config = {
  apiKey: "AIzaSyAIV2lXg-4ZjZcUW9lp_-QV3hwBLZsmUs",
  authDomain: "tdv-football.firebaseapp.com",
  projectId: "tdv-football",
  storageBucket: "tdv-football.firebasestorage.app",
  messagingSenderId: "492634553657",
  appId: "1:492634553657:web:57ad01a633fc4568dd7ce8",
  measurementId: "G-85XEEMZYGC"
};

try {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
    config = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  }
} catch (error) {
  console.error("Error parsing NEXT_PUBLIC_FIREBASE_CONFIG:", error);
}

export const firebaseConfig = config;
export const useRealFirebase = true;
