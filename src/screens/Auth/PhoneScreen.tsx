import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function PhoneScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const clean = phone.replace(/\D/g,'');
    if (clean.length < 10) { setErr(t.phoneError); return; }
    navigation.navigate('OTP', { phone: clean });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.phoneTitle}</Text>
        <Text style={styles.helper}>{t.phoneHelper}</Text>
        <View style={styles.inputRow}>
          <View style={styles.prefix}><Text style={styles.prefixText}>+234</Text></View>
          <TextInput style={styles.input} value={phone} onChangeText={v=>{setPhone(v.replace(/\D/g,'').slice(0,10));setErr('');}}
            keyboardType="phone-pad" maxLength={10} placeholder="803 000 0000"
            placeholderTextColor={colors.textTertiary}/>
        </View>
        {err ? <Banner message={err} variant="err" style={{marginTop:spacing.sm}}/> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t.sendCode} onPress={submit} fullWidth/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.xl, paddingTop:spacing.xxl},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, marginBottom:spacing.sm},
  helper:{fontSize:fontSize.md, color:colors.textSecondary, marginBottom:spacing.xxl},
  inputRow:{flexDirection:'row', alignItems:'center', gap:spacing.sm},
  prefix:{backgroundColor:colors.surfaceAlt, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:13},
  prefixText:{fontSize:fontSize.lg, fontWeight:'600', color:colors.textPrimary},
  input:{flex:1, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:12, fontSize:fontSize.lg, color:colors.textPrimary, backgroundColor:colors.surface},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
