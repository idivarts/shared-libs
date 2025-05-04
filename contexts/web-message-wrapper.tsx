import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { IMessengerData } from '../messenger/interfaces/message-interface';

interface IProps {
    id: string
    isInfluencer: boolean,
    streamToken: string
}
const WebMessageWrapper: React.FC<PropsWithChildren & IProps> = ({ children, id, streamToken, isInfluencer }) => {
    const [iFrameLoaded, setIFrameLoaded] = useState(false)
    const iFrameRef = useRef<HTMLIFrameElement>(null)

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
        <iframe
            ref={iFrameRef}
            src={`/messenger/index.html?user=${id}&user_token=${streamToken}&target_origin=${window.location.origin}&skip_name_image_set=false&no_channel_name_filter=false`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => {
                setIFrameLoaded(true)
            }}
        />
    )
}

export default WebMessageWrapper