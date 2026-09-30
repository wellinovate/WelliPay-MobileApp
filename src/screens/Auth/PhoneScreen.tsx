import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { isClerkAPIResponseError } from '@clerk/clerk-expo';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function PhoneScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setErr(t.phoneError);
      return;
    }
    if (!signInLoaded || !signUpLoaded) return;

    const phoneNumber = `+234${clean}`;
    setErr('');
    setLoading(true);
    try {
      // Try an existing account first. Clerk's phone_code strategy needs a
      // phoneNumberId to prepare against — it's on the sign-in attempt's
      // supportedFirstFactors once the identifier resolves to a real user.
      const attempt = await signIn.create({ identifier: phoneNumber });
      const phoneFactor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'phone_code');
      if (!phoneFactor) {
        throw new Error('This account has no phone verification method available.');
      }
      await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneFactor.phoneNumberId });
      navigation.navigate('OTP', { phone: clean, flow: 'signIn' });
    } catch (signInErr) {
      // Clerk raises "form_identifier_not_found" when no account exists
      // for this phone number yet — that's the expected case for a new
      // patient, so fall back to sign-up rather than surfacing it as an
      // error.
      const notFound =
        isClerkAPIResponseError(signInErr) &&
        signInErr.errors.some((e) => e.code === 'form_identifier_not_found');
      if (!notFound) {
        setErr(signInErr instanceof Error ? signInErr.message : t.phoneError);
        setLoading(false);
        return;
      }
      try {
        await signUp.create({ phoneNumber });
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        navigation.navigate('OTP', { phone: clean, flow: 'signUp' });
      } catch (signUpErr) {
        setErr(signUpErr instanceof Error ? signUpErr.message : t.phoneError);
      }
    } finally {
      setLoading(false);
    }
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
            placeholderTextColor={colors.textTertiary} editable={!loading}/>
        </View>
        {err ? <Banner message={err} variant="err" style={{marginTop:spacing.sm}}/> : null}
      </ScrollView>
      <View style={styles.footer}>
        {loading
          ? <ActivityIndicator color={colors.accent}/>
          : <Button label={t.sendCode} onPress={submit} fullWidth/>}
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
