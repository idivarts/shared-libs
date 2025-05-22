// src/contexts/ScrollContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

type ScrollContextType = {
    scrollRef: React.RefObject<ScrollView>;
    scrollHeight?: number,
    setScrollHeight?: React.Dispatch<React.SetStateAction<number>>;
};

const ScrollContext = createContext<ScrollContextType | null>(null);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [scrollHeight, setScrollHeight] = useState(0)

    useEffect(() => {
        if (scrollRef.current) {
            setScrollHeight(0)
        }
    }, [scrollRef.current])

    return (
        <ScrollContext.Provider value={{ scrollRef, scrollHeight, setScrollHeight }}>
            {children}
        </ScrollContext.Provider>
    );
};

export const useScrollContext = () => {
    const context = useContext(ScrollContext);
    if (!context) throw new Error("useScrollContext must be used within ScrollProvider");
    return context;
};