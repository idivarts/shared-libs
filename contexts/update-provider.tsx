import { BRANDS_PLAYSTORE_URL, CREATORS_PLAYSTORE_URL } from '@/shared-constants/app';
import { collection, doc, getDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { Console } from '../utils/console';
import { FirestoreDB } from '../utils/firebase/firestore';

type Props = {
    children: React.ReactNode;
    force?: boolean;
    influencerApp?: boolean
};

const UpdateProvider = ({ children, force = false, influencerApp = false }: Props) => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                const currentVersion = VersionCheck.getCurrentVersion();

                const updateDoc = await getDoc(doc(collection(FirestoreDB, "userImages"), "config"));
                const version = (updateDoc.data() as any)[influencerApp ? "androidVersion" : "brandAndroidVersion"]

                if (__DEV__)
                    return

                if (currentVersion != version) {
                    Alert.alert(
                        'Update Available',
                        'A new version of the app is available.',
                        [
                            ...(!force ? [
                                {
                                    text: 'Later',
                                    onPress: async () => { },
                                    style: 'cancel' as 'cancel'
                                }
                            ] : []),
                            {
                                text: 'Update Now',
                                onPress: async () => {
                                    const url = influencerApp ? CREATORS_PLAYSTORE_URL : BRANDS_PLAYSTORE_URL;
                                    Linking.openURL(url);
                                },
                                style: 'default',
                            },
                        ],
                        { cancelable: !force }
                    );
                }
            } catch (e) {
                Console.log('Version check failed', e);
            }
        };

        checkVersion();
    }, [force]);

    return <>{children}</>;
};

export default UpdateProvider;