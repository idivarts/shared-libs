import React, { useEffect } from 'react';
import { Platform } from 'react-native';

type Props = {
    children: React.ReactNode;
    force?: boolean;
    influencerApp?: boolean
};

const UpdateProvider = ({ children, force = false, influencerApp = false }: Props) => {
    useEffect(() => {
        if (Platform.OS != "web")
            return;

        // Write code to see if a new version available for web build, then empty cache and reload 
    }, [force]);

    return <>{children}</>;
};

export default UpdateProvider;