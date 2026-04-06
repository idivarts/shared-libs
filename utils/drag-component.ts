import { getConstrainedWidth } from "@/shared-libs/contexts/mobile-layout-context.provider";

const COL = 3;
export const MARGIN = 8;
export const SIZE = getConstrainedWidth() / COL - MARGIN * 2;

export const getPosition = (index: number) => {
    "worklet";
    return {
        x: (index % COL) * SIZE,
        y: Math.floor(index / COL) * SIZE,
    };
};

export const getOrder = (x: number, y: number) => {
    "worklet";
    const row = Math.round(y / SIZE);
    const col = Math.round(x / SIZE);
    return row * COL + col;
};
