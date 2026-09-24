import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function LinkWRScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const [state, setState] = useState<'idle'|'loading'|'success'|'notfound'>('idle');

  const doLink = () => {
    setState('loading');
    setTimeout(()=>setState(Math.random()>0.3?'success':'notfound'),1400);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{t.linkTitle}</Text>
        <Text style={styles.section}><Text style={styles.bold}>{t.linkDoesLabel}</Text>{' '}{t.linkDoes}</Text>
        <Text style={styles.section}><Text style={styles.bold}>{t.linkNotLabel}</Text>{' '}{t.linkNot}</Text>
        {state==='loading' && <ActivityIndicator color={colors.accent} size="large" style={{marginTop:spacing.xxl}}/>}
        {state==='success' && <Banner message={t.linkedSuccessMsg} variant="success" style={{marginTop:spacing.xl}}/>}
        {state==='notfound' && <Banner message="No WelliRecord found. You can add bills manually." variant="warn" style={{marginTop:spacing.xl}}/>}
      </ScrollView>
      <View style={styles.footer}>
        {state!=='loading' && state!=='success' && <Button label={t.linkNow} onPress={doLink} fullWidth style={{marginBottom:spacing.md}}/>}
        {state==='success' && <Button label={t.continue} onPress={()=>navigation.navigate('WalletIntro')} fullWidth style={{marginBottom:spacing.md}}/>}
        <Button label={t.skipForNow} variant="ghost" onPress={()=>navigation.navigate('WalletIntro')} fullWidth/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.xl, paddingTop:spacing.xxl},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, marginBottom:spacing.xl},
  section:{fontSize:fontSize.base, color:colors.textPrimary, lineHeight:24, marginBottom:spacing.lg},
  bold:{fontWeight:'700'},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
