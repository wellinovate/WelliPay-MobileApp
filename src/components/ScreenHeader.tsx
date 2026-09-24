import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';

interface Props { title?: string; showBack?: boolean; onBack?: () => void; right?: React.ReactNode; style?: StyleProp<ViewStyle>; }
export default function ScreenHeader({ title, showBack=true, onBack, right, style }: Props) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    if (onBack) onBack();
    else nav.goBack();
  };
  return (
    <View style={[styles.container, style]}>
      {showBack
        ? <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        : <View style={styles.backBtn}/>}
      {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : <View style={{flex:1}}/>}
      <View style={styles.right}>{right}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{ flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.lg, paddingBottom:spacing.sm, backgroundColor:colors.bg },
  backBtn:{ width:36, alignItems:'flex-start', justifyContent:'center' },
  backArrow:{ fontSize:fontSize.xl, color:colors.textPrimary, fontWeight:'400' },
  title:{ flex:1, textAlign:'center', fontSize:fontSize.lg, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary },
  right:{ width:36, alignItems:'flex-end' },
});
