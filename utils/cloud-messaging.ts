
import { getToken, messaging } from "@/shared-libs/utils/firebase/messaging";
import { requestPermission } from "@react-native-firebase/messaging";
import {
    useEffect
} from "react";
import { Platform } from "react-native";

import { newToken } from "@/shared-libs/utils/token";
import { PermissionsAndroid } from 'react-native';


export const useCloudMessaging = (streamClient: any, uid: any, userOrManager: any, updateUserOrManager: Function) => {

    const requestUserPermission = async () => {
        if (Platform.OS == "web") {
            const permission = await Notification.requestPermission();
            return permission === "granted"
        } else {
            const authStatus = await requestPermission(messaging);
            const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            if (enabled && Platform.OS === 'android') {
                const perm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                return perm == "granted"
            }
            return enabled
        }
    }

    const registerPushTokenWithStream = async (
        token: string,
    ) => {
        if (!token) {
            console.log("Token is invalid");
            return
        }
        console.log("Got Token to register", token);

        const push_provider = 'firebase';
        const push_provider_name = 'TrendlyFirebase';
        try {
            const x = await streamClient?.addDevice(token, push_provider, userOrManager?.id, push_provider_name);
            console.log("Stream Device Added", x);
        } catch (e) {
            console.log("Stream Error", e);
        }
    };
    const registerPushTokenWithPlatform = async (
        token: string,
    ) => {
        const newNativeToken = Platform.OS === "ios" ? newToken("ios", userOrManager, token) :
            (Platform.OS == "android" ? newToken("android", userOrManager, token) :
                newToken("web", userOrManager, token));

        if (newNativeToken) {
            await updateUserOrManager(uid, {
                pushNotificationToken: newNativeToken,
            });
        }
    }

    const getTokenCustom = async () => {
        const token = await getToken(messaging, Platform.OS == "web" ? {
            vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
        } : {});
        return token
    }

    const initNotification = async () => {
        const accessGranted = await requestUserPermission();
        if (!accessGranted)
            return;

        const token = await getTokenCustom();

        await registerPushTokenWithPlatform(token)
        await registerPushTokenWithStream(token);

        if (Platform.OS != "web")
            messaging()
                .getInitialNotification()
                .then(async (remoteMessage) => {
                    if (remoteMessage) {
                        console.log("Notification caused app to open from quit state:", remoteMessage);
                    }
                });
    }

    useEffect(() => {
        if (!uid && !userOrManager) return;

        initNotification();

        if (Platform.OS != "web") {
            const backgroundSubscription = messaging().onNotificationOpenedApp((remoteMessage) => {
                console.log("Notification caused app to open from background state:", remoteMessage.notification);
            });

            messaging().setBackgroundMessageHandler(async (remoteMessage) => {
                console.log("Message handled in the background:", remoteMessage);
            });

            const foregroundSubscription = messaging().onMessage(async (remoteMessage) => {
                console.log("A new FCM message arrived!", remoteMessage);
            });

            return () => {
                backgroundSubscription();
                foregroundSubscription();
            };
        }
    }, [uid, userOrManager]);

    return {
        initNotification,
        requestUserPermission,
        getToken: getTokenCustom,
        registerPushTokenWithPlatform,
        registerPushTokenWithStream
    }
};
