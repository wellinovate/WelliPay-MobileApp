import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function WalletIntroScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.icon}><Text style={styles.iconText}>₦</Text></View>
        <Text style={styles.title}>{t.walletIntroTitle}</Text>
        <Text style={styles.body2}>{t.walletIntroBody}</Text>
      </View>
      <View style={styles.footer}>
        <Button label={t.createWallet} onPress={()=>navigation.navigate('MainTabs')} fullWidth style={{marginBottom:spacing.md}}/>
        <Button label={t.skipForNow} variant="ghost" onPress={()=>navigation.navigate('MainTabs')} fullWidth/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg, justifyContent:'space-between'},
  body:{flex:1, paddingHorizontal:spacing.xxxl, alignItems:'center', justifyContent:'center', gap:spacing.xl},
  icon:{width:80, height:80, borderRadius:40, backgroundColor:colors.accentLight, alignItems:'center', justifyContent:'center'},
  iconText:{fontSize:36, color:colors.accent, fontWeight:'700'},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, textAlign:'center'},
  body2:{fontSize:fontSize.base, color:colors.textSecondary, textAlign:'center', lineHeight:24, maxWidth:280},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
