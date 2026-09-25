import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize, spacing } from "../theme/tokens";
import { useNavigation } from "@react-navigation/native";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  ignoreTopInset?: boolean;
}

export default function ScreenHeader({
  title,
  showBack = true,
  onBack,
  right,
  style,
  ignoreTopInset = false,
}: Props) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    if (onBack) onBack();
    else nav.goBack();
  };

  const topPadding = ignoreTopInset ? spacing.sm : Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);
  const leftPadding = insets.left > 0 ? insets.left + spacing.sm : spacing.lg;
  const rightPadding = insets.right > 0 ? insets.right + spacing.sm : spacing.lg;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding + 6,
          paddingLeft: leftPadding,
          paddingRight: rightPadding,
        },
        style,
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: "400",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.lg,
    fontWeight: "700",
    fontFamily: "SourceSerif4_700Bold",
    color: colors.textPrimary,
  },
  right: {
    width: 36,
    alignItems: "flex-end",
  },
});
