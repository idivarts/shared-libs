import {
    createContext,
    type PropsWithChildren,
    useContext
} from "react";

import { useCloudMessaging } from "@/shared-libs/utils/cloud-messaging";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";

interface CloudMessagingContextProps {
    getToken: () => Promise<string>;
    updatedTokens?: Function
    registerPushTokenWithStream: (token: string) => Promise<void>
    registerPushTokenWithPlatform: (token: string) => Promise<void>
}

const CloudMessagingContext = createContext<CloudMessagingContextProps>({
    getToken: async () => "",
    registerPushTokenWithPlatform: async (x: string) => { },
    registerPushTokenWithStream: async (x: string) => { },
});

export const useCloudMessagingContext = () => useContext(CloudMessagingContext);

export const CloudMessagingContextProvider: React.FC<PropsWithChildren & { userOrmanager: any, updateUserOrManager: any, streamClient: any }> = ({
    children,
    userOrmanager,
    updateUserOrManager,
    streamClient
}) => {
    const { getToken, updatedTokens, registerPushTokenWithStream, registerPushTokenWithPlatform } = useCloudMessaging(streamClient, AuthApp.currentUser?.uid, userOrmanager, updateUserOrManager)

    return (
        <CloudMessagingContext.Provider
            value={{
                getToken,
                updatedTokens,
                registerPushTokenWithPlatform,
                registerPushTokenWithStream
            }}
        >
            {children}
        </CloudMessagingContext.Provider>
    );
};
