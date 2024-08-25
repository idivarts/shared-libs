import { getAuth } from "firebase/auth";
import { FirebaseApp } from "./firebase";

const AuthApp = getAuth(FirebaseApp);

export { AuthApp }
