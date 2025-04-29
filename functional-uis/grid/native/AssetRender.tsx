import { draggableGridStylesFn } from "@/shared-libs/functional-uis/DraggableGrid.styles";
import { useTheme } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { Image } from "react-native";

interface AssetRenderProps {
  asset: {
    url: string;
    type: string;
  } | null;
}

const AssetRender: React.FC<AssetRenderProps> = ({
  asset,
}) => {
  const theme = useTheme();
  const styles = draggableGridStylesFn(theme);

  if (!asset) {
    return null;
  } else if (asset.type === 'video') {
    return (
      <Video
        source={{ uri: asset.url }}
        style={styles.video}
        isLooping={false}
        shouldPlay={false}
        resizeMode={ResizeMode.COVER}
      >
      </Video>
    );
  } else {
    return (
      <Image
        source={{ uri: asset.url }}
        style={styles.image}
      />
    );
  }
};

export default AssetRender;
