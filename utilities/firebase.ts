// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.CROWDY_CHAT_API_KEY,
  authDomain: process.env.CROWDY_CHAT_AUTH_DOMAIN,
  projectId: process.env.CROWDY_CHAT_PROJECT_ID,
  storageBucket: process.env.CROWDY_CHAT_STORAGE_BUCKET,
  messagingSenderId: process.env.CROWDY_CHAT_MESSAGING_SENDER_ID,
  appId: process.env.CROWDY_CHAT_APP_ID,
  measurementId: process.env.CROWDY_CHAT_MEASUREMENT_ID,
};

// Initialize Firebase
const FirebaseApp = initializeApp(firebaseConfig);

export { FirebaseApp };
