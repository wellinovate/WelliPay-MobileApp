import React from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import { useSafeAreaInsets, EdgeInsets } from "react-native-safe-area-context";
import { colors } from "../theme/tokens";

export interface SafeAreaViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ("top" | "right" | "bottom" | "left")[];
  backgroundColor?: string;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  edges = ["top", "bottom", "left", "right"],
  backgroundColor = colors.bg,
}) => {
  const insets: EdgeInsets = useSafeAreaInsets();

  const edgePadding: ViewStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return (
    <View style={[{ flex: 1, backgroundColor }, edgePadding, style]}>
      {children}
    </View>
  );
};

export default SafeAreaView;
