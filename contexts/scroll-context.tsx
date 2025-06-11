// src/contexts/ScrollContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { IOScrollView } from "react-native-intersection-observer";

type ScrollContextType = {
    scrollRef: React.RefObject<ScrollView>;
    scrollHeight?: number,
    setScrollHeight?: React.Dispatch<React.SetStateAction<number>>;
};

const ScrollContext = createContext<ScrollContextType>({
    scrollRef: { current: null },
    scrollHeight: 0,
    setScrollHeight: () => { }
});

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

export const useScrollContext = () => useContext(ScrollContext);

export const IOScroll: React.FC<ScrollViewProps> = ({ children, onScroll }) => {
    const { scrollRef, setScrollHeight } = useScrollContext()
    return <IOScrollView ref={scrollRef} onScroll={(e) => {
        setScrollHeight?.(e.nativeEvent.contentOffset?.y || 0)
        onScroll?.(e)
    }}>
        {children}
    </IOScrollView>
}