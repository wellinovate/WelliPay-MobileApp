import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/tokens';

interface Props { value: number; max: number; color?: string; style?: StyleProp<ViewStyle>; }
export default function ProgressBar({ value, max, color, style }: Props) {
  const pct = Math.min(Math.max(value/(max||1), 0), 1) * 100;
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill,{width:`${pct}%`,backgroundColor:color||colors.accent}]}/>
    </View>
  );
}
const styles = StyleSheet.create({
  track:{ height:8, borderRadius:radius.full, backgroundColor:colors.surfaceAlt, overflow:'hidden' },
  fill:{ height:'100%', borderRadius:radius.full },
});
