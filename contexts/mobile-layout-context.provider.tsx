import React, { createContext, useContext } from "react";
import { Platform, StyleSheet, View } from "react-native";

const MOBILE_MAX_WIDTH = 480;

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
