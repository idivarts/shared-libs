import { getAnalytics, logEvent } from "firebase/analytics";
import { FirebaseApp } from "./firebase";

const analyticsWeb = getAnalytics(FirebaseApp);;

export const analyticsLogEvent = async (
  eventName: string,
  eventParams: Record<string, any>
) => {
  logEvent(analyticsWeb, eventName, eventParams);
};
