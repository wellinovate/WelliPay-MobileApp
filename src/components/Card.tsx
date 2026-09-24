import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme/tokens';

interface Props { children: React.ReactNode; style?: StyleProp<ViewStyle>; elevation?: boolean; }
export default function Card({ children, style, elevation }: Props) {
  return <View style={[styles.card, elevation && shadow.sm, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card:{ backgroundColor:colors.surface, borderRadius:radius.md, padding:spacing.lg, borderWidth:1, borderColor:colors.border },
});
