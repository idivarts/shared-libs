import analytics from "@react-native-firebase/analytics";

export const analyticsLogEvent = async (
  eventName: string,
  eventParams: Record<string, any>
) => {
  await analytics().logEvent(eventName, eventParams);
};
