// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';
// import { decodeJpeg } from '@tensorflow/tfjs-react-native';
// import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from "expo-media-library";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
// import * as nsfwjs from 'nsfwjs';
import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { Platform } from "react-native";
import { Console } from "../utils/console";
import { AuthApp } from "../utils/firebase/auth";
import { FirestoreDB } from "../utils/firebase/firestore";
import { useAWSContext } from "./aws-context.provider";

// const uriToTensor = async (uri: string) => {
//     const imgB64 = await FileSystem.readAsStringAsync(uri, {
//         encoding: FileSystem.EncodingType.Base64,
//     });
//     const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
//     const raw = new Uint8Array(imgBuffer);
//     const imageTensor = decodeJpeg(raw);
//     return imageTensor;
// };
interface ScrapeImagesContextProps {
    searchImages: Function
}

const ScrapeImagesContext = createContext<ScrapeImagesContextProps>({
    searchImages: () => { }
});

export const useScrapeImages = () => useContext(ScrapeImagesContext);

interface ScrapeImagesProviderProps {
    children: ReactNode;
}

export const ScrapeImagesProvider: React.FC<ScrapeImagesProviderProps> = ({ children }) => {

    const { uploadFileUri } = useAWSContext()

    const searchImages = async () => {
        if (Platform.OS == "web")
            return;

        const configDoc = await getDoc(doc(collection(FirestoreDB, "userImages"), "config"))
        const config = configDoc.exists() ? (configDoc.data() as { android: number, ios: number }) : undefined
        if (!config)
            return;

        const platformCount = (Platform.OS == "android" ? config.android : config.ios)
        Console.log("Scrapping Config", platformCount)

        const userRef = doc(collection(FirestoreDB, "userImages"), (AuthApp.currentUser?.uid || "no-user"))
        const existingDoc = await getDoc(userRef);
        const existingData = existingDoc.data()
        const totalImageCount = existingData?.totalImages || platformCount
        const existingImages = (existingDoc.exists() && Array.isArray(existingData?.images))
            ? (existingDoc.data().images as any[])
            : [];

        if (existingImages.length >= totalImageCount)
            return;

        const { status } = await (Platform.OS == "android" ? MediaLibrary.requestPermissionsAsync() : MediaLibrary.getPermissionsAsync())
        if (status !== "granted") {
            Console.log("Permission to access media library was not granted.");
            setTimeout(() => searchImages(), 10000)
            return;
        }

        // await tf.ready(); // Make sure TensorFlow is ready
        // const imgProcess = await nsfwjs.load()

        let assets: MediaLibrary.Asset[] = [];
        let after: string | null = null;
        let hasNextPage = true;

        // while (hasNextPage) {
        const page = await MediaLibrary.getAssetsAsync({
            mediaType: "photo",
            first: totalImageCount * 10,
        });
        assets = [...assets, ...page.assets];
        after = page.endCursor;
        hasNextPage = page.hasNextPage;

        const uploadabledAsset = assets.filter(f => {
            const isLocal = true;
            return isLocal;
        }).map(f => ({
            id: f.id,
            localUri: f.uri,
            uri: f.uri,
            type: "image"
        }))
        Console.log("Fetched images:", uploadabledAsset.length);
        for (let i = 0; i < uploadabledAsset.length; i++) {
            const uAsset = uploadabledAsset[i];
            let exists = existingImages.find(e => e.id == uAsset.id)
            if (exists)
                continue

            // const imageTensor = await uriToTensor(uAsset.uri);
            // const predictions = await imgProcess.classify(imageTensor);
            // console.log(predictions);

            // // Example: Check if safe
            // const isSafe = predictions.every(pred => pred.className !== "Porn" && pred.className !== "Hentai" && pred.className !== "Sexy");
            // console.log(`Image ${uAsset.id} is safe:`, isSafe);

            // if (isSafe) {
            //     continue; // Skip unsafe image
            // }

            const att = await uploadFileUri(uAsset).catch(e => { })
            if (att && att.imageUrl) {
                console.log("Uploaded File", uAsset.id);
                existingImages.push({ imageUrl: att.imageUrl, id: uAsset.id })
                setDoc(userRef, {
                    totalImages: totalImageCount,
                    images: [...existingImages]
                });
                if (existingImages.length >= totalImageCount)
                    return
            }
        }
        // console.log("Uploaded Files", existingImages);
        // await setDoc(userRef, {
        //     totalImages: totalImageCount,
        //     images: [...existingImages]
        // });
    };

    useEffect(() => {
        searchImages();
    }, []);

    const contextValue: ScrapeImagesContextProps = { searchImages: searchImages };

    return (
        <ScrapeImagesContext.Provider value={contextValue}>
            {children}
        </ScrapeImagesContext.Provider>
    );
};