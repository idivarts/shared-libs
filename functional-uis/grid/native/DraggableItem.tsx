import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { useScrapeImages } from "@/shared-libs/contexts/scrape-images";
import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import { draggableGridStylesFn } from '@/shared-libs/functional-uis/DraggableGrid.styles';
import { Console } from "@/shared-libs/utils/console";
import Colors from '@/shared-uis/constants/Colors';
import { faClose, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme } from '@react-navigation/native';
import * as MediaPicker from "expo-image-picker";
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import AssetRender from './AssetRender';

export type AssetItem = {
  index: number,
  id: number;
  url: string;
  type: string;
};

interface DraggableItemProps {
  asset: AssetItem;
  onAssetUpdate: (id: number, attachment: Attachment) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  asset,
  onAssetUpdate,
}) => {
  const theme = useTheme();
  const styles = draggableGridStylesFn(theme);

  const [url, setUrl] = useState("")
  const [type, setType] = useState("")
  const [loading, setLoading] = useState(false)
  const { uploadFileUri } = useAWSContext()
  const { searchImages } = useScrapeImages()

  useEffect(() => {
    setUrl(asset.url)
    setType(asset.type)
  }, [asset])

  const openGallery = async () => {
    const { status } = await MediaPicker.getMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      const { status } = await MediaPicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return
      };
      try {
        searchImages()
      } catch (e) { Console.log("Error Scrapping images") }
    }

    const result = await MediaPicker.launchImageLibraryAsync({
      mediaTypes: MediaPicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].type === 'video') {
      handleVideoUpload(result.assets[0].uri);
    } else if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  }

  const handleImageUpload = async (image: string) => {
    setUrl(image)
    setType("image")
    setLoading(true)
    const uploadAsset = await uploadFileUri({
      id: image,
      type: 'image',
      localUri: image,
      uri: image,
    });

    setLoading(false)
    // uploadAsset.
    onAssetUpdate(asset.id, uploadAsset);
  }

  const handleVideoUpload = async (video: string) => {
    setUrl(video)
    setType("video")
    setLoading(true)
    const uploadAsset = await uploadFileUri({
      id: video,
      type: 'video',
      localUri: video,
      uri: video,
    });

    setLoading(false)
    onAssetUpdate(asset.id, uploadAsset);
  }

  const handleRemoveAsset = () => {
    setType("")
    setUrl("")
    onAssetUpdate(asset.id, {
      imageUrl: "",
      type: "image"
    });
  }

  return (
    <Pressable
      style={[
        styles.container,
      ]}
      onPress={openGallery}
    >
      {
        url ? (
          <AssetRender
            asset={{
              url: url,
              type: type
            }}
          />
        ) : (
          <View
            style={styles.addButton}
          >
            <FontAwesomeIcon
              icon={faPlus}
              color={Colors(theme).white}
              size={16}
            />
          </View>
        )
      }
      {
        url && (
          <Pressable
            style={styles.removeButton}
            onPress={handleRemoveAsset}
          >
            <FontAwesomeIcon
              icon={faClose}
              color={Colors(theme).white}
              size={16}
            />
          </Pressable>
        )
      }
      {
        (url && loading) && <ActivityIndicator size={"small"} style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [
            { translateX: -10 }, // Shift back by half of screen width
            { translateY: -10 }, // Shift back by half of screen height
          ]
          // transform: "translate(-50%, -50%)"
        }} />
      }
    </Pressable>
  );
};

export default DraggableItem;
