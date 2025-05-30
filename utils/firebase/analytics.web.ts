import { Analytics, getAnalytics, logEvent } from "firebase/analytics";
import { FirebaseApp } from "./firebase";

let analyticsWeb: Analytics = getAnalytics(FirebaseApp);;

export const analyticsLogEvent = async (
  eventName: string,
  eventParams: Record<string, any>
) => {
  logEvent(analyticsWeb as Analytics, eventName, eventParams);
};
