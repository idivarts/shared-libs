//@ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { Platform } from "react-native";
import { FirebaseApp } from "./firebase";

if (!FirebaseApp) {
  throw new Error("Firebase app is not initialized");
}

// const AuthApp = initializeAuth(FirebaseApp, {
//   persistence:
//     Platform.OS === "web" ? "LOCAL" : getReactNativePersistence(AsyncStorage),
// });

const AuthApp =
  Platform.OS === "web"
    ? initializeAuth(FirebaseApp, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver
    })
    : initializeAuth(FirebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export { AuthApp };
