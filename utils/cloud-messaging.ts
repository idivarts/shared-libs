
import { messaging } from "@/shared-libs/utils/firebase/messaging";
import nativeMessaging, { requestPermission } from "@react-native-firebase/messaging";
import { getToken } from "firebase/messaging";
import {
    useEffect
} from "react";
import { Platform } from "react-native";

import { newToken } from "@/shared-libs/utils/token";
import { PermissionsAndroid } from 'react-native';


export const useCloudMessaging = (streamClient: any, userId: any, user: any, updateManager: Function) => {

    const requestUserPermission = async () => {
        if (Platform.OS == "web") {
            const permission = await Notification.requestPermission();
            return permission === "granted"
        } else {
            const authStatus = await requestPermission(messaging);
            const enabled = authStatus === nativeMessaging.AuthorizationStatus.AUTHORIZED || authStatus === nativeMessaging.AuthorizationStatus.PROVISIONAL;
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
        const push_provider = 'firebase';
        const push_provider_name = 'TrendlyFirebase';
        streamClient?.addDevice(token, push_provider, user?.id, push_provider_name);
    };
    const registerPushTokenWithPlatform = async (
        token: string,
    ) => {
        const newNativeToken = Platform.OS === "ios" ? newToken("ios", user, token) :
            (Platform.OS == "android" ? newToken("android", user, token) :
                newToken("web", user, token));

        if (newNativeToken) {
            await updateManager(userId, {
                pushNotificationToken: newNativeToken,
            });
        }
    }

    const getTokenCustom = async () => {
        const token = await getToken(messaging);
        // , Platform.OS == "web" ? {
        //     vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
        // } : {}
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
            nativeMessaging()
                .getInitialNotification()
                .then(async (remoteMessage) => {
                    if (remoteMessage) {
                        console.log("Notification caused app to open from quit state:", remoteMessage);
                    }
                });
    }

    useEffect(() => {
        if (!userId && !user) return;

        initNotification();

        if (Platform.OS != "web") {
            const backgroundSubscription = nativeMessaging().onNotificationOpenedApp((remoteMessage) => {
                console.log("Notification caused app to open from background state:", remoteMessage.notification);
            });

            nativeMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
                console.log("Message handled in the background:", remoteMessage);
            });

            const foregroundSubscription = nativeMessaging().onMessage(async (remoteMessage) => {
                console.log("A new FCM message arrived!", remoteMessage);
            });

            return () => {
                backgroundSubscription();
                foregroundSubscription();
            };
        }
    }, [userId, user]);

    return {
        initNotification,
        requestUserPermission,
        getToken: getTokenCustom
    }
};
