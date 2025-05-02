import { deleteToken, getMessaging, getToken } from "firebase/messaging";
import { FirebaseApp } from "./firebase";

const messaging = getMessaging(FirebaseApp);

export { deleteToken, getToken, messaging };
