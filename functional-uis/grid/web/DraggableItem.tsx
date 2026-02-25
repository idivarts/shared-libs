import { WebAssetItem } from "@/shared-libs/types/Asset";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { ActivityIndicator } from "react-native-paper";
import { getDraggableItemStyle } from "./DraggableItem.style";

interface DraggableItemProps {
    id: string;
    asset: WebAssetItem;
    listeners?: any;
    attributes?: any;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
    asset,
    listeners = {},
    attributes = {},
}) => {
    const theme = useTheme();
    const DraggableItemStyle = useMemo(
        () => getDraggableItemStyle(theme),
        [theme]
    );

    return (
        <div
            style={DraggableItemStyle.card}
            {...listeners}
            {...attributes}
        >
            {
                asset.type === "video" ? (
                    <video
                        autoPlay={false}
                        style={DraggableItemStyle.video}
                    >
                        <source src={
                            typeof asset.url === "string" ? asset.url : URL.createObjectURL(asset.url)
                        } type="video/mp4" />
                    </video>
                ) : (
                    <img style={DraggableItemStyle.image}
                        src={
                            typeof asset.url === "string" ? asset.url : URL.createObjectURL(asset.url)
                        }
                    />
                )
            }
            {typeof asset.url !== "string" &&
                <ActivityIndicator size={"small"} style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [
                        { translateX: -10 }, // Shift back by half of screen width
                        { translateY: -10 }, // Shift back by half of screen height
                    ]
                    // transform: "translate(-50%, -50%)"
                }} />}
        </div>
    );
};

export default DraggableItem;
