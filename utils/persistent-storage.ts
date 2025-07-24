import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const PersistentStorage = {
    set: async (key: string, value: string) => {
        if (Platform.OS === "web") localStorage.setItem(key, value);
        else await AsyncStorage.setItem(key, value);
    },
    get: async (key: string) => {
        if (Platform.OS === "web") return localStorage.getItem(key);
        else return await AsyncStorage.getItem(key);
    },
    clear: async (key: string) => {
        if (Platform.OS === "web") localStorage.removeItem(key);
        else await AsyncStorage.removeItem(key);
    },
    setItemWithExpiry: async (key: string, value: string, ttlInHours = 2) => {
        const now = new Date();
        const expiry = now.getTime() + ttlInHours * 60 * 60 * 1000;
        const item = JSON.stringify({ value, expiry });
        await AsyncStorage.setItem(key, item);
    },
    getItemWithExpiry: async (key: string): Promise<string | null> => {
        const item = await AsyncStorage.getItem(key);
        if (!item) return null;

        try {
            const { value, expiry } = JSON.parse(item);
            if (new Date().getTime() > expiry) {
                await AsyncStorage.removeItem(key);
                return null; // expired
            }
            return value;
        } catch {
            return null;
        }
    }
};