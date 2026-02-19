import React, { createContext, useContext } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";

export const MOBILE_MAX_WIDTH = 480;

/**
 * Non-hook utility for module-level code that can't use React hooks.
 * On web, caps the width at MOBILE_MAX_WIDTH. On native, returns real width.
 */
export const getConstrainedWidth = () => {
    const realWidth = Dimensions.get("window").width;
    return Platform.OS === "web" ? Math.min(realWidth, MOBILE_MAX_WIDTH) : realWidth;
};

export const getConstrainedHeight = () => {
    return Dimensions.get("window").height;
};

interface MobileLayoutContextType {
    isMobileLayout: boolean;
    maxWidth: number;
}

const MobileLayoutContext = createContext<MobileLayoutContextType>({
    isMobileLayout: false,
    maxWidth: MOBILE_MAX_WIDTH,
});

export const MobileLayoutProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isWeb = Platform.OS === "web";

    const value: MobileLayoutContextType = {
        isMobileLayout: true,
        maxWidth: MOBILE_MAX_WIDTH,
    };

    if (!isWeb) {
        return (
            <MobileLayoutContext.Provider value={value}>
                {children}
            </MobileLayoutContext.Provider>
        );
    }

    return (
        <MobileLayoutContext.Provider value={value}>
            <View style={styles.outerContainer}>
                <View style={styles.mobileContainer}>
                    {children}
                </View>
            </View>
        </MobileLayoutContext.Provider>
    );
};

export const useMobileLayout = () => useContext(MobileLayoutContext);

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: "#e5e5e5",
    },
    mobileContainer: {
        width: "100%",
        maxWidth: MOBILE_MAX_WIDTH,
        flex: 1,
        backgroundColor: "#ffffff",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
});
