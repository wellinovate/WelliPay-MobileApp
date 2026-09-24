import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export default function Divider({ vertical=false, my=spacing.md, style }: { vertical?: boolean; my?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.line, vertical&&styles.vert, {marginVertical:my}, style]}/>;
}
const styles = StyleSheet.create({
  line:{ height:1, backgroundColor:colors.border },
  vert:{ width:1, height:'100%' },
});
