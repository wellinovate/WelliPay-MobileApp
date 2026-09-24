import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, fontSize, spacing } from '../theme/tokens';

interface Props {
  label: string; onPress?: () => void; variant?: 'primary'|'secondary'|'ghost'|'danger';
  disabled?: boolean; loading?: boolean; style?: ViewStyle; textStyle?: TextStyle; fullWidth?: boolean;
}
export default function Button({ label, onPress, variant='primary', disabled, loading, style, textStyle, fullWidth }: Props) {
  const bg = {primary:colors.accent, secondary:colors.surface, ghost:colors.transparent, danger:colors.dangerLight}[variant];
  const fg = {primary:colors.white, secondary:colors.textPrimary, ghost:colors.accent, danger:colors.dangerDark}[variant];
  const brd = variant==='secondary' ? colors.border : variant==='primary' ? colors.accent : colors.transparent;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled||loading} activeOpacity={0.75}
      style={[styles.base, {backgroundColor:bg,borderColor:brd}, fullWidth&&styles.full, disabled&&styles.disabled, style]}>
      {loading
        ? <ActivityIndicator color={fg} size="small"/>
        : <Text style={[styles.label,{color:fg},textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  base:{ paddingVertical:13, paddingHorizontal:spacing.xl, borderRadius:radius.md, borderWidth:1, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:6 },
  full:{ width:'100%' },
  disabled:{ opacity:0.45 },
  label:{ fontSize:fontSize.base, fontWeight:'600', fontFamily:'SourceSerif4_600SemiBold' },
});
