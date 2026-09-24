import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme/tokens';

type Variant = 'info'|'warn'|'err'|'error'|'danger'|'success';
interface Props { message?: string; text?: string; variant?: Variant; style?: StyleProp<ViewStyle>; }
const bg: Record<Variant,string> = {
  info: colors.accentLight,
  warn: colors.warningBg,
  err: colors.dangerLight,
  error: colors.dangerLight,
  danger: colors.dangerLight,
  success: colors.accentLight
};
const fg: Record<Variant,string> = {
  info: colors.accentDark,
  warn: colors.warningText,
  err: colors.dangerDark,
  error: colors.dangerDark,
  danger: colors.dangerDark,
  success: colors.accentDark
};

export default function Banner({ message, text, variant='info', style }: Props) {
  const content = message || text || '';
  return (
    <View style={[styles.base,{backgroundColor:bg[variant]},style]}>
      <Text style={[styles.text,{color:fg[variant]}]}>{content}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  base:{ borderRadius:radius.md, padding:spacing.md },
  text:{ fontSize:fontSize.md, lineHeight:20 },
});
