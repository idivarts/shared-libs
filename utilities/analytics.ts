import { getAnalytics } from "firebase/analytics";
import { FirebaseApp } from "./firebase";

const AnalyticsApp = getAnalytics(FirebaseApp);

export { AnalyticsApp }