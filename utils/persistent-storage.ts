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
    }
};