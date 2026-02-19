import { getConstrainedWidth } from "@/shared-libs/contexts/mobile-layout-context.provider";
import { MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import { CSSProperties } from "react";

const screenWidth = getConstrainedWidth();
const cardDim = (MAX_WIDTH_WEB < screenWidth) ? MAX_WIDTH_WEB / 4 : screenWidth / 4

export const DraggableItemStyle: { [k: string]: CSSProperties } = {
    container: {
        position: 'relative',
        minWidth: cardDim,
        maxWidth: cardDim,
        height: cardDim,
        aspectRatio: '1',
        borderRadius: '10px',
        cursor: 'grab',
        backgroundColor: '#f5f5f5',
    },
    button: {
        position: 'absolute',
        right: '8px',
        bottom: '8px',
        padding: '10px',
        borderRadius: '50%',
        backgroundColor: '#1e3a5f',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        zIndex: 2,
    },
    card: {
        borderRadius: "10px",
        height: cardDim,
        maxWidth: cardDim,
        minWidth: cardDim,
        overflow: "hidden",
        width: cardDim,
    },
    video: {
        height: cardDim,
        maxWidth: cardDim,
        minWidth: cardDim,
        objectFit: "cover",
    },
    image: {
        borderRadius: "10px",
        height: cardDim,
        maxWidth: cardDim,
        minWidth: cardDim,
        objectFit: "cover",
    }
}