import analytics from "@react-native-firebase/analytics";

export const analyticsLogEvent = async (
  eventName: string,
  eventParams: Record<string, any>
) => {
  try {
    await analytics().logEvent(eventName, eventParams);
  } catch (e) { console.log("Analytics Error", e) }
};
