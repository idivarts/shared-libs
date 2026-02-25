import { MARGIN, SIZE } from "@/shared-libs/utils/drag-component";
import { StyleSheet } from "react-native";

import { Theme } from "@react-navigation/native";
import Colors from "@/shared-uis/constants/Colors";

/**
 * EXCEPTION: External stylesheet kept shared by DragAndDropNative, DraggableItem, AssetRender.
 * Uses only Colors(theme); no hardcoded colors. See .cursor/rules/ui-styling-theme-responsive.mdc.
 */

export const draggableGridStylesFn = (
    theme: Theme,
) => StyleSheet.create({
    container: {
        width: SIZE - MARGIN * 2,
        height: SIZE - MARGIN * 2,
        margin: MARGIN,
        borderRadius: 10,
        borderWidth: 4,
        borderColor: Colors(theme).white,
        backgroundColor: theme.dark ? Colors(theme).card : Colors(theme).platinum,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    image: {
        width: SIZE - MARGIN - 16,
        height: SIZE - MARGIN - 16,
        borderRadius: 6,
    },
    video: {
        width: SIZE - MARGIN - 16,
        height: SIZE - MARGIN - 16,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors(theme).red,
    },
    addButton: {
        borderRadius: 100,
        borderWidth: 2,
        padding: 5,
        borderColor: Colors(theme).white,
    },
    removeButton: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        borderRadius: 10,
        borderWidth: 2,
        padding: 5,
        backgroundColor: Colors(theme).primary,
        borderColor: Colors(theme).primary,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors(theme).black,
    },
});

export const gridStylesFn = (
    theme: Theme,
) => StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 340,
        backgroundColor: theme.dark ? Colors(theme).card : Colors(theme).gray200,
    },
    wrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    hintContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
    },
    hintText: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginHorizontal: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        borderWidth: 1,
        borderColor: theme.dark ? Colors(theme).white : Colors(theme).platinum,
        borderStyle: 'dashed',
    },
    text: {
        color: Colors(theme).text,
    }
});
