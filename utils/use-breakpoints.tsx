import { useMobileLayout } from "@/shared-libs/contexts/mobile-layout-context.provider";
import { useWindowDimensions } from "react-native";

type useBreakpointsType = {
    'xl3': boolean;
    'xl2': boolean;
    xl: boolean;
    lg: boolean;
    md: boolean;
    sm: boolean;
    xs: boolean;
    width: number;
    height: number;
    scale: number;
};

const useBreakpoints = (): useBreakpointsType => {
    const dimensions = useWindowDimensions();
    const { isMobileLayout, maxWidth } = useMobileLayout();
    const width = isMobileLayout ? Math.min(dimensions.width, maxWidth) : dimensions.width;

    return {
        'xl3': width >= 1536,
        'xl2': width >= 1280,
        xl: width >= 1024,
        lg: width >= 768,
        md: width >= 640,
        sm: width >= 480,
        xs: width < 480,
        width,
        height: dimensions.height,
        scale: dimensions.scale,
    }
};

export default useBreakpoints;
