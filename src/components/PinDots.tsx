import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/tokens';

interface Props { filled: number; total?: number; error?: boolean; }
export default function PinDots({ filled, total=4, error }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({length:total},(_,i)=>
        <View key={i} style={[styles.dot,
          i<filled ? (error ? styles.err : styles.filled) : styles.empty]}/>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', gap:spacing.lg, justifyContent:'center', marginVertical:spacing.lg },
  dot:{ width:14, height:14, borderRadius:7 },
  empty:{ borderWidth:1.5, borderColor:colors.textPrimary, backgroundColor:colors.transparent },
  filled:{ backgroundColor:colors.textPrimary },
  err:{ backgroundColor:colors.danger },
});
