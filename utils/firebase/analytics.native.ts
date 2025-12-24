export const analyticsLogEvent = async (
    eventName: string,
    eventParams: Record<string, any>
) => {
    console.log("Analytics Events", eventName, eventParams);
};
