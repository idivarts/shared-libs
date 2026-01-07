import { BRANDS_APPSTORE_URL, CREATORS_APPSTORE_URL } from '@/shared-constants/app';
import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { Console } from '../utils/console';

type Props = {
    children: React.ReactNode;
    force?: boolean;
    influencerApp?: boolean
};

const UpdateProvider = ({ children, force = false, influencerApp = false }: Props) => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                const latestVersion = await VersionCheck.getLatestVersion();
                const currentVersion = VersionCheck.getCurrentVersion();

                const appId = Platform.OS == "ios" ?
                    Constants.expoConfig?.ios?.bundleIdentifier :
                    Constants.expoConfig?.android?.package;

                if (!appId) {
                    Console.error('App ID is missing in app config.');
                    return;
                }
                if (__DEV__)
                    return

                console.log('Current Version:', currentVersion);
                console.log('Latest Version:', latestVersion);

                const updateNeeded = await VersionCheck.needUpdate({
                    currentVersion,
                    latestVersion,
                });

                if (updateNeeded?.isNeeded) {
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
                                    const url = influencerApp ? CREATORS_APPSTORE_URL : BRANDS_APPSTORE_URL;
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