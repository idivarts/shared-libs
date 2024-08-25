// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA5gnQrMolevPZLp5ZQkJk6Howz9BWiP60",
    authDomain: "crowdy-chat.firebaseapp.com",
    projectId: "crowdy-chat",
    storageBucket: "crowdy-chat.appspot.com",
    messagingSenderId: "14145115952",
    appId: "1:14145115952:web:4d11d64d9ddd9225dbdaf5",
    measurementId: "G-NCS8Q59G2S"
};

// Initialize Firebase
const FirebaseApp = initializeApp(firebaseConfig);

export { FirebaseApp };
