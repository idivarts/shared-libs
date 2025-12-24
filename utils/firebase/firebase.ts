import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = require("../../../firebase-config.js").firebaseConfig;

const FirebaseApp = (!getApps().length
    ? initializeApp(firebaseConfig)
    : getApp())

export { FirebaseApp, firebaseConfig };

