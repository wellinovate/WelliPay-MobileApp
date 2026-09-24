import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusMeta } from '../utils/statusMeta';
import { radius, fontSize, spacing } from '../theme/tokens';

export default function StatusPill({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <View style={[styles.pill,{backgroundColor:m.bg}]}>
      <View style={[styles.dot,{backgroundColor:m.dot}]}/>
      <Text style={[styles.label,{color:m.fg}]}>{m.label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  pill:{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:spacing.sm, paddingVertical:3, borderRadius:radius.full, alignSelf:'flex-start' },
  dot:{ width:6, height:6, borderRadius:3 },
  label:{ fontSize:fontSize.xs, fontWeight:'600' },
});
