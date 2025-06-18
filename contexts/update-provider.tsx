import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { Console } from '../utils/console';

type Props = {
    children: React.ReactNode;
    force?: boolean;
};

const UpdateProvider = ({ children, force = false }: Props) => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                const latestVersion = await VersionCheck.getLatestVersion();
                const currentVersion = VersionCheck.getCurrentVersion();

                const appId = Platform.select({
                    ios: Constants.expoConfig?.ios?.bundleIdentifier,
                    android: Constants.expoConfig?.android?.package,
                });

                if (!appId) {
                    Console.error('App ID is missing in app config.');
                    return;
                }

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
                            {
                                text: force ? 'Update Now' : 'Later',
                                onPress: async () => {
                                    if (force) {
                                        Linking.openURL(await VersionCheck.getStoreUrl({ appID: appId }));
                                    }
                                },
                                style: force ? 'default' : 'cancel',
                            },
                            ...(!force ? [{
                                text: 'Update',
                                onPress: async () => {
                                    const url = await VersionCheck.getStoreUrl({ appID: appId });
                                    Linking.openURL(url);
                                },
                            }] : []),
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