import {
  deleteToken,
  getToken,
  messaging,
} from "@/shared-libs/utils/firebase/messaging";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { newToken, removeToken } from "@/shared-libs/utils/token";
import * as Notifications from "expo-notifications";
import { Console } from "./console";
import { useMyNavigation } from "./router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
  }),
});

export const useCloudMessaging = (
  streamClient: any,
  uid: any,
  userOrManager: any,
  updateUserOrManager: Function
) => {
  const [token, setToken] = useState("");

  const router = useMyNavigation();
  const updatedTokens = async () => {
    try {
      if (!userOrManager) return null;
      // let p = await requestUserPermission()
      // if (!p) return null;

      let newUpdatedTokens: {
        ios?: string[];
        android?: string[];
        web?: string[];
      } | null = null;

      if (!token) return;

      if (Platform.OS === "ios") {
        newUpdatedTokens = removeToken("ios", userOrManager, token);
      } else if (Platform.OS === "android") {
        newUpdatedTokens = removeToken("android", userOrManager, token);
      } else {
        newUpdatedTokens = removeToken("web", userOrManager, token);
      }

      streamClient.removeDevice(token);
      await updateUserOrManager(uid, {
        pushNotificationToken: newUpdatedTokens,
      });

      await Notifications.setBadgeCountAsync(0);

      if (Platform.OS === "web") {
        await deleteToken(messaging);
      } else {
        // await messaging().deleteToken()
      }

      Console.log("Token removed successfully", newUpdatedTokens);
    } catch (e) {
      Console.error(e, "Error in updatedTokens");
    }
  };

  const requestUserPermission = async () => {
    if (Platform.OS == "web") {
      try {
        // Check if Notification API is supported
        if (!("Notification" in window)) {
          Console.log("Browser does not support notifications");
          return false;
        }

        // If permission is already denied, don't request again
        if (Notification.permission === "denied") {
          Console.log("Notification permission already denied");
          return false;
        }

        // If already granted, return true
        if (Notification.permission === "granted") {
          return true;
        }

        // Request permission only if not set
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (error) {
        Console.error("Error requesting notification permission", error);
        return false;
      }
    } else {
      // const authStatus = await messaging().requestPermission().catch((e) => { Console.log("Cloud Authorization Error", e) });
      // const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      // if (enabled && Platform.OS === 'android') {
      //     const perm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      //     return perm == "granted"
      // }
      // return enabled
    }
  };

  const registerPushTokenWithStream = async (token: string) => {
    if (!token) {
      Console.log("Token is invalid");
      return;
    }
    Console.log("Got Token to register", token);

    const push_provider = "firebase";
    const push_provider_name = "TrendlyFirebase";
    try {
      const x = await streamClient?.addDevice(
        token,
        push_provider,
        userOrManager?.id,
        push_provider_name
      );
      Console.log("Stream Device Added", x);
    } catch (e) {
      Console.log("Stream Error", e);
    }
  };
  const registerPushTokenWithPlatform = async (token: string) => {
    const newNativeToken =
      Platform.OS === "ios"
        ? newToken("ios", userOrManager, token)
        : Platform.OS == "android"
        ? newToken("android", userOrManager, token)
        : newToken("web", userOrManager, token);

    if (newNativeToken) {
      await updateUserOrManager(uid, {
        pushNotificationToken: newNativeToken,
      });
    }
  };

  const getTokenCustom = async () => {
    // If token already exists, simply return the token
    if (token) return token;

    try {
      const tokenVal =
        Platform.OS == "web"
          ? await getToken(messaging, {
              vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
            }).catch((error) => {
              Console.error("Error getting FCM token on web", error);
              return null;
            })
          : // await messaging().getToken({})
            "";

      if (tokenVal) {
        setToken(tokenVal);
      }
      return tokenVal;
    } catch (error) {
      Console.error("Error in getTokenCustom", error);
      return null;
    }
  };

  const initNotification = async () => {
    const accessGranted = await requestUserPermission();
    if (!accessGranted) return;

    const token = await getTokenCustom();

    await registerPushTokenWithPlatform(token);
    await registerPushTokenWithStream(token);
  };

  const redirectionLogic = (data: any) => {
    const cid = data?.stream?.cid || "";
    const groupId = data?.groupId || "";
    const collaborationId = data?.collaborationId || "";
    if (cid) {
      router.push(`/channel/${cid}`);
    } else if (groupId) {
      router.push(`/contract-details/:${groupId}`);
    } else if (collaborationId) {
      router.push(`/collaboration-details/${collaborationId}`);
    }
  };

  useEffect(() => {
    if (!uid || !userOrManager) return;

    initNotification();

    if (Platform.OS != "web") {
      // messaging().getInitialNotification().then(async (remoteMessage) => {
      //     if (remoteMessage) {
      //         Console.log("Notification caused app to open from quit state:", remoteMessage);
      //         const data = remoteMessage.data || {};
      //         redirectionLogic(data);
      //     }
      // });
      // const backgroundSubscription = messaging().onNotificationOpenedApp((remoteMessage) => {
      //     Console.log("Notification caused app to open from background state:", remoteMessage.notification);
      //     if (remoteMessage.notification?.ios?.badge !== undefined)
      //         Notifications.setBadgeCountAsync(remoteMessage.notification?.ios?.badge as any);
      // });
      // messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      //     Console.log("Message handled in the background:", remoteMessage);
      //     if (remoteMessage.notification?.ios?.badge !== undefined)
      //         Notifications.setBadgeCountAsync(remoteMessage.notification?.ios?.badge as any);
      // });
      // const foregroundSubscription = messaging().onMessage(async (remoteMessage) => {
      //     Console.log("A new FCM message arrived!", remoteMessage);
      //     Notifications.scheduleNotificationAsync({
      //         content: {
      //             title: remoteMessage.notification?.title || "New Notification",
      //             body: remoteMessage.notification?.body || "You have a new notification",
      //             data: remoteMessage.data || {},
      //             sound: "default",
      //         },
      //         trigger: null,
      //     });
      //     if (remoteMessage.notification?.ios?.badge !== undefined)
      //         Notifications.setBadgeCountAsync(remoteMessage.notification?.ios?.badge as any);
      // });
      // const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      //     const data = response.notification.request.content.data;
      //     redirectionLogic(data);
      // });
      // return () => {
      //     backgroundSubscription();
      //     foregroundSubscription();
      //     subscription.remove();
      // };
    }
  }, [uid, userOrManager]);

  return {
    initNotification,
    requestUserPermission,
    updatedTokens,
    getToken: getTokenCustom,
    registerPushTokenWithPlatform,
    registerPushTokenWithStream,
  };
};
