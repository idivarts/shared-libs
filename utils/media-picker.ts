import * as MediaPicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

export type PickedAsset = {
    type: "image" | "video";
    uri: string;
    assetId: string | null;
    /** Pixel dimensions from the picker, when available (used for aspect checks). */
    width?: number;
    height?: number;
};

async function ensureMediaLibraryPermission(): Promise<boolean> {
    const { status } = await MediaPicker.getMediaLibraryPermissionsAsync();
    if (status === "granted") return true;

    const { status: newStatus } =
        await MediaPicker.requestMediaLibraryPermissionsAsync();
    return newStatus === "granted";
}

export async function pickMedia(
    mediaType: "image" | "video" | "all"
): Promise<PickedAsset | null> {
    const granted = await ensureMediaLibraryPermission();
    if (!granted) return null;

    const isImageOnly = mediaType === "image";
    const isVideoOnly = mediaType === "video";

    const mediaTypes: MediaPicker.MediaType[] = isImageOnly
        ? ["images", "livePhotos"]
        : isVideoOnly
            ? ["videos"]
            : ["images", "videos", "livePhotos"];

    const result = await MediaPicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: false,
        allowsEditing: !isVideoOnly,
        aspect: !isVideoOnly ? [4, 3] : undefined,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    return {
        type: asset.type === "video" ? "video" : "image",
        uri: asset.uri,
        assetId: asset.assetId ?? null,
        width: asset.width,
        height: asset.height,
    };
}

/**
 * Pick one or more assets in a single gallery session. Used by multi-asset
 * surfaces (e.g. carousels) so the user can select several images at once
 * instead of uploading one at a time.
 *
 * Note: `allowsEditing` is intentionally omitted — the native picker does not
 * support per-asset cropping alongside multi-selection.
 *
 * @param selectionLimit 0 (default) = unlimited; otherwise caps the selection.
 */
export async function pickMediaMulti(
    mediaType: "image" | "video" | "all",
    selectionLimit = 0
): Promise<PickedAsset[]> {
    const granted = await ensureMediaLibraryPermission();
    if (!granted) return [];

    const isImageOnly = mediaType === "image";
    const isVideoOnly = mediaType === "video";

    const mediaTypes: MediaPicker.MediaType[] = isImageOnly
        ? ["images", "livePhotos"]
        : isVideoOnly
            ? ["videos"]
            : ["images", "videos", "livePhotos"];

    const result = await MediaPicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: true,
        selectionLimit,
    });

    if (result.canceled) return [];

    return result.assets.map((asset) => ({
        type: asset.type === "video" ? "video" : "image",
        uri: asset.uri,
        assetId: asset.assetId ?? null,
        width: asset.width,
        height: asset.height,
    }));
}

/**
 * On iOS, prompts the user to choose Photo or Video first (to avoid
 * the known UIImagePickerController bug with allowsEditing + videos).
 * On Android/web, opens the gallery directly with all media types.
 */
export function promptAndPickMedia(
    onResult: (asset: PickedAsset) => void,
    onError?: (error: unknown) => void
): void {
    if (Platform.OS !== "ios") {
        pickMedia("all")
            .then((asset) => asset && onResult(asset))
            .catch(onError);
        return;
    }

    Alert.alert("Select Media", "What would you like to upload?", [
        {
            text: "Photo",
            onPress: () =>
                pickMedia("image")
                    .then((asset) => asset && onResult(asset))
                    .catch(onError),
        },
        {
            text: "Video",
            onPress: () =>
                pickMedia("video")
                    .then((asset) => asset && onResult(asset))
                    .catch(onError),
        },
        { text: "Cancel", style: "cancel" },
    ]);
}
