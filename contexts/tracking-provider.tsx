import * as TrackingTransparency from 'expo-tracking-transparency';
import React, { useEffect } from 'react';


const TrackingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    useEffect(() => {
        const askForPermission = async () => {
            const status = await TrackingTransparency.getTrackingPermissionsAsync();
            if (status.status === TrackingTransparency.PermissionStatus.UNDETERMINED) {
                await TrackingTransparency.requestTrackingPermissionsAsync();
            }
        };
        askForPermission();
    }, []);

    return <>
        {children}
    </>
}

export default TrackingProvider