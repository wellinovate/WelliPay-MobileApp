import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme/tokens';

interface Props { label: string; active?: boolean; onPress?: () => void; }
export default function Chip({ label, active, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.chip, active&&styles.active]}>
      <Text style={[styles.label, active&&styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  chip:{ paddingHorizontal:spacing.md, paddingVertical:spacing.xs+2, borderRadius:radius.full, backgroundColor:colors.surfaceAlt, borderWidth:1, borderColor:colors.border },
  active:{ backgroundColor:colors.accent, borderColor:colors.accent },
  label:{ fontSize:fontSize.sm, color:colors.textPrimary, fontWeight:'500' },
  labelActive:{ color:colors.white },
});
