import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { PropsWithChildren, useEffect } from 'react';
import { IMessengerData } from '../messenger/interfaces/message-interface';

interface IProps {
    iFrameLoaded: boolean,
    iFrameRef: React.RefObject<HTMLIFrameElement>
}
const WebMessageWrapper: React.FC<PropsWithChildren & IProps> = ({ children, iFrameLoaded, iFrameRef }) => {
    const { channelId } = useLocalSearchParams()
    const isFocused = useIsFocused()

    const router = useRouter()
    useEffect(() => {
        window.addEventListener('message', function (event) {
            console.log("Received event from ifram");
            const mData: IMessengerData = event.data;
            if (mData.type == "open-contract") {
                const contractId = mData.data
                router.push(`/contract-details/${contractId}`);
            }
        });
    }, [])

    useEffect(() => {
        if (channelId && (iFrameLoaded || isFocused)) {
            const mData: IMessengerData = {
                type: "open-channel",
                data: channelId
            }
            iFrameRef.current?.contentWindow?.postMessage(mData)
        }
    }, [channelId, iFrameLoaded, isFocused])

    return (
        children
    )
}

export default WebMessageWrapper