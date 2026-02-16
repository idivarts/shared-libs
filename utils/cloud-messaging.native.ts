import { deleteToken, getToken } from "@/shared-libs/utils/firebase/messaging.native";
import {
    useEffect,
    useState
} from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { newToken, removeToken } from "@/shared-libs/utils/token";
import * as Notifications from 'expo-notifications';
import { Console } from "./console";
import { useMyNavigation } from "./router";


// Request permissions + get token
// export const registerForPushNotificationsAsync = async () => {

//     const { status } = await Notifications.requestPermissionsAsync();
//     if (status !== 'granted') return;

//     const token = await Notifications.getExpoPushTokenAsync({
//         projectId: 'your-expo-project-id',
//         experienceId: '@yourusername/trendly'
//     });

//     // Send token to your backend
//     await savePushTokenToBackend(token.data);

//     return token.data;
// };

// // Handle incoming notifications
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false
//     })
// });



export const useCloudMessaging = (streamClient: any, uid: any, userOrManager: any, updateUserOrManager: Function) => {
    const [token, setToken] = useState("")

    const router = useMyNavigation()
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

            if (!token)
                return

            if (Platform.OS === "ios") {
                newUpdatedTokens = removeToken("ios", userOrManager, token);
            } else if (Platform.OS === "android") {
                newUpdatedTokens = removeToken("android", userOrManager, token);
            } else {
                newUpdatedTokens = removeToken("web", userOrManager, token);
            }

            streamClient.removeDevice(token)
            await updateUserOrManager(uid, {
                pushNotificationToken: newUpdatedTokens,
            });

            await Notifications.setBadgeCountAsync(0);

            await deleteToken()

            Console.log("Token removed successfully", newUpdatedTokens);
        } catch (e) {
            Console.error(e, "Error in updatedTokens");
        }
    }

    const requestUserPermission = async () => {
        const authStatus = await Notifications.requestPermissionsAsync();

        const enabled = authStatus.granted || authStatus.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
        if (enabled && Platform.OS === 'android') {
            const perm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            return perm == "granted"
        }
        return enabled
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
        // If token already exists, simply return the token
        if (token)
            return token

        const tokenVal = await getToken()
        setToken(tokenVal.data)

        return tokenVal.data
    }

    const initNotification = async () => {
        const accessGranted = await requestUserPermission();
        if (!accessGranted)
            return;

        const token = await getTokenCustom();

        await registerPushTokenWithPlatform(token)
        await registerPushTokenWithStream(token);
    }

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
    }

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => {
                return {
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldShowAlert: true,
                }
            },
        });
    }, [])
    useEffect(() => {
        if (!uid || !userOrManager) return;

        try {
            initNotification();
        } catch (e) {
            Console.error("Error initializing notifications:", e);
        }

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

        return () => {
            // backgroundSubscription();
            // foregroundSubscription();
            // subscription.remove();
        };
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
