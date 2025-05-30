
import { deleteToken, getToken, messaging } from "@/shared-libs/utils/firebase/messaging";
import {
    useEffect
} from "react";
import { Platform } from "react-native";

import { newToken, removeToken } from "@/shared-libs/utils/token";
import { User } from "firebase/auth";
import { PermissionsAndroid } from 'react-native';
import { Console } from "./console";


export const useCloudMessaging = (streamClient: any, uid: any, userOrManager: any, updateUserOrManager: Function) => {

    const updatedTokens = async (user: User | null) => {
        if (!user) return null;
        let p = await requestUserPermission()
        if (!p) return null;

        let newUpdatedTokens: {
            ios?: string[];
            android?: string[];
            web?: string[];
        } | null = null;

        const token = await getTokenCustom();

        if (Platform.OS === "ios") {
            newUpdatedTokens = removeToken("ios", user, token);
        } else if (Platform.OS === "android") {
            newUpdatedTokens = removeToken("android", user, token);
        }

        await deleteToken(messaging);

        return newUpdatedTokens;
    }

    const requestUserPermission = async () => {
        if (Platform.OS == "web") {
            const permission = await Notification.requestPermission();
            return permission === "granted"
        } else {
            const authStatus = await messaging().requestPermission().catch((e) => { Console.log("Cloud Authorization Error", e) });

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
            Console.log("Token is invalid");
            return
        }
        Console.log("Got Token to register", token);

        const push_provider = 'firebase';
        const push_provider_name = 'TrendlyFirebase';
        try {
            const x = await streamClient?.addDevice(token, push_provider, userOrManager?.id, push_provider_name);
            Console.log("Stream Device Added", x);
        } catch (e) {
            Console.log("Stream Error", e);
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
        const token = Platform.OS == "web" ? (await getToken(messaging, {
            vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
        })) : (await messaging().getToken({}));
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
                        Console.log("Notification caused app to open from quit state:", remoteMessage);
                    }
                });
    }

    useEffect(() => {
        if (!uid || !userOrManager) return;

        initNotification();

        if (Platform.OS != "web") {
            const backgroundSubscription = messaging().onNotificationOpenedApp((remoteMessage) => {
                Console.log("Notification caused app to open from background state:", remoteMessage.notification);
            });

            messaging().setBackgroundMessageHandler(async (remoteMessage) => {
                Console.log("Message handled in the background:", remoteMessage);
            });

            const foregroundSubscription = messaging().onMessage(async (remoteMessage) => {
                Console.log("A new FCM message arrived!", remoteMessage);
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
        updatedTokens,
        getToken: getTokenCustom,
        registerPushTokenWithPlatform,
        registerPushTokenWithStream
    }
};
