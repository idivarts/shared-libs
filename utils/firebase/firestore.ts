import { getFirestore } from "firebase/firestore";
import { FirebaseApp } from "./firebase";

const dbId = process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID;
const FirestoreDB = dbId ? getFirestore(FirebaseApp, dbId) : getFirestore(FirebaseApp);

export { FirestoreDB };
