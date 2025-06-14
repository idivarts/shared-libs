import { MARGIN, SIZE } from "@/shared-libs/utils/drag-component";
import { StyleSheet } from "react-native";

import { Theme } from "@react-navigation/native";

const tintColorLight = "#ff6d2d";
const tintColorDark = "#fff";

const Colors = (theme: Theme) => ({
  ...theme.colors,
  ...(theme.dark
    ? {
      card: "#1E1E1E",
      text: "#fff",
      textSecondary: "#666666",
      background: "#000",
      reverseBackground: "#fff",
      tint: tintColorDark,
      tabIconDefault: "#ccc",
      tabIconSelected: tintColorDark,
      primary: "#538BA6",
      onSurface: "#538BA6",
      tag: "#5f6368",
      tagForeground: "#f1f3f4",
      outline: "#538BA6",
    }
    : {
      card: "#fff",
      text: "#000",
      textSecondary: "#666666",
      background: "#fff",
      reverseBackground: "#000",
      tint: tintColorLight,
      tabIconDefault: "#ccc",
      tabIconSelected: tintColorLight,
      primary: "#054463",
      onSurface: "#054463",
      tag: "#f1f3f4",
      tagForeground: "#5f6368",
      outline: "#054463",
    }),
  aliceBlue: "#E9F1F7",
  amber: "#FFBF00",
  unicornSilver: "#e8e8e8",
  danger: "#7d5260",
  eerieBlack: "#1b1b1b",
  whiteSmoke: "#f5f5f5",
  success: "#02ca30",
  successForeground: "#28a745",
  gold: "#ECD694",
  green: "#9DD586",
  yellow: "#E8B931",
  yellow100: "#A69F5BD6",
  pink: "#f8d7da",
  pinkForeground: "#dc3545",
  backdrop: "rgba(0, 0, 0, 0.5)",
  black: "#000",
  lightgray: "lightgray",
  modalBackground: "rgba(0, 0, 0, 0.5)",
  orange: "#F64740",
  platinum: "#DBDBDB",
  red: "red",
  gray100: "#555",
  gray200: "#f9f9f9",
  gray300: "#757575",
  surface: "#ffffff",
  surfaceVariant: "#ffffff",
  white: "#ffffff",
  onPrimary: "#ffffff",
  secondary: "#054463",
  secondaryContainer: "#538BA6",
  onSecondaryContainer: "#ffffff",
  transparent: "transparent",
  notificationDot: "red",
});

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
