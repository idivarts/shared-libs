import { useIsFocused, useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import { IContracts } from "../firestore/trendly-pro/models/contracts";
import { IMessengerData } from '../messenger/interfaces/message-interface';
import { CrashLog } from "../utils/firebase/crashlytics";
import { FirestoreDB } from "../utils/firebase/firestore";

interface IProps {
    influencerManagerid: string
    isInfluencer: boolean,
    streamToken: string
}
const WebMessageWrapper: React.FC<IProps> = ({ influencerManagerid: id, streamToken, isInfluencer }) => {
    const [iFrameLoaded, setIFrameLoaded] = useState(false)
    const iFrameRef = useRef<HTMLIFrameElement>(null)

    const { channelId } = useLocalSearchParams()
    const isFocused = useIsFocused()

    const theme = useTheme()
    useEffect(() => {
        if (iFrameLoaded && iFrameRef.current)
            iFrameRef.current?.contentWindow?.postMessage(theme.dark ? "dark" : "light")
    }, [theme, iFrameLoaded, iFrameRef])

    const router = useRouter()
    useEffect(() => {
        window.addEventListener('message', async (event) => {
            CrashLog.log("Received event from ifram");
            const mData: IMessengerData = event.data;
            if (mData.type == "open-contract") {
                const contractId = mData.data
                router.push(`/contract-details/${contractId}`);
            } else if (mData.type == "contract-status") {
                const contractId = mData.data
                const contractSnap = await getDoc(doc(FirestoreDB, "contracts", contractId))
                const contract = await contractSnap.data() as IContracts
                const sData: IMessengerData = {
                    type: "contract-status-receive",
                    data: contract.status
                }
                iFrameRef.current?.contentWindow?.postMessage(sData)
            } else if (mData.type == "give-feedback") {
                const contractId = mData.data
                router.push(`/contract-details/${contractId}?giveFeedback=true`);
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
            src={`/messenger/index.html?user=${id}&user_token=${streamToken}&target_origin=${window.location.origin}${isInfluencer ? "&isInfluencer=true" : ""}&skip_name_image_set=false&no_channel_name_filter=false`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => {
                setIFrameLoaded(true)
            }}
        />
    )
}

export default WebMessageWrapper