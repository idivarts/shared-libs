import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';

type Props = {
    children: React.ReactNode;
    force?: boolean;
};

const UpdateProvider = ({ children, force = false }: Props) => {
    useEffect(() => {
        if (Platform.OS == "web")
            return;

        const checkVersion = async () => {
            try {
                const latestVersion = await VersionCheck.getLatestVersion();
                const currentVersion = VersionCheck.getCurrentVersion();

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
                                        Linking.openURL(await VersionCheck.getStoreUrl());
                                    }
                                },
                                style: 'cancel',
                            },
                            {
                                text: 'Update',
                                onPress: async () => {
                                    const url = await VersionCheck.getStoreUrl();
                                    Linking.openURL(url);
                                },
                            },
                        ],
                        { cancelable: !force }
                    );
                }
            } catch (e) {
                console.log('Version check failed', e);
            }
        };

        checkVersion();
    }, [force]);

    return <>{children}</>;
};

export default UpdateProvider;