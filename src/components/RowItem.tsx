import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize } from '../theme/tokens';

interface Props {
  label: string; sublabel?: string; onPress?: () => void;
  right?: React.ReactNode; style?: ViewStyle;
}
export default function RowItem({ label, sublabel, onPress, right, style }: Props) {
  const Row = onPress ? TouchableOpacity : View;
  return (
    <Row onPress={onPress} activeOpacity={0.7}
      style={[styles.row, style]}>
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sub}>{sublabel}</Text> : null}
      </View>
      {right ?? <Text style={styles.arrow}>›</Text>}
    </Row>
  );
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:spacing.md, paddingHorizontal:4 },
  left:{ flex:1, paddingRight:spacing.sm },
  label:{ fontSize:fontSize.base, color:colors.textPrimary, fontWeight:'500' },
  sub:{ fontSize:fontSize.sm, color:colors.textSecondary, marginTop:2 },
  arrow:{ fontSize:fontSize.xl, color:colors.textTertiary },
});
