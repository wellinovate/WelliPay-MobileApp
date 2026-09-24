import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../theme/tokens';
import { NAIRA } from '../utils/helpers';

interface Bar { month: string; amount: number; }
export default function BarChart({ data }: { data: Bar[] }) {
  const max = Math.max(...data.map(d=>d.amount), 1);
  return (
    <View style={styles.container}>
      {data.map((d,i) => (
        <View key={i} style={styles.col}>
          <Text style={styles.amt} numberOfLines={1}>{d.amount>0?NAIRA(d.amount).replace('₦',''):''}</Text>
          <View style={[styles.bar,{height:Math.round((d.amount/max)*90)+6}]}/>
          <Text style={styles.label}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container:{ flexDirection:'row', alignItems:'flex-end', gap:spacing.sm, height:130, marginTop:spacing.md },
  col:{ flex:1, alignItems:'center', gap:4, justifyContent:'flex-end' },
  amt:{ fontSize:9, color:colors.textTertiary },
  bar:{ width:'100%', borderRadius:3, backgroundColor:colors.accent },
  label:{ fontSize:fontSize.xs, color:colors.textTertiary },
});
