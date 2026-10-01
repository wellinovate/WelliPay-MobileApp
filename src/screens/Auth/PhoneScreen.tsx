import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-expo';
import { isClerkAPIResponseError } from '@clerk/clerk-expo';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { refreshPatientToken } from '../../api/patientAuth';

// Using email_code instead of phone_code for this pass — the Clerk
// application isn't configured to accept phone number as a sign-in
// identifier yet (confirmed via the "Identifier is invalid" error phone
// auth was throwing), and email needs no dashboard changes to work. Swap
// this back to phone once "Phone number" is enabled as a sign-in
// identifier in the Clerk dashboard (User & Authentication > Email, Phone,
// Username) — the backend side (wellipay-api) doesn't care which identity
// method was used, so nothing there needs to change either way.
export default function PhoneScreen({ navigation }: any) {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { getToken } = useAuth();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErr('Please enter a valid email address.');
      return;
    }
    if (!signInLoaded || !signUpLoaded) return;

    setErr('');
    setLoading(true);
    try {
      // Try an existing account first. Clerk's email_code strategy needs
      // an emailAddressId to prepare against — it's on the sign-in
      // attempt's supportedFirstFactors once the identifier resolves to a
      // real user.
      const attempt = await signIn.create({ identifier: clean });
      const emailFactor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (!emailFactor || !('emailAddressId' in emailFactor)) {
        throw new Error('This account has no email verification method available.');
      }
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
      navigation.navigate('OTP', { email: clean, flow: 'signIn' });
    } catch (signInErr) {
      // RootNavigator should route an already-signed-in device straight
      // to MainTabs/LinkWR and never show this screen at all — but if it
      // lands here anyway (a stale nav state, a manual back-navigation),
      // don't dead-end on Clerk's "You're already signed in" error: try to
      // mint a WelliPay token from the existing session and continue.
      const alreadySignedIn =
        isClerkAPIResponseError(signInErr) &&
        signInErr.errors.some((e) => e.code === 'session_exists');
      if (alreadySignedIn) {
        try {
          const clerkToken = await getToken();
          if (clerkToken && (await refreshPatientToken(clerkToken))) {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'LinkWR' }] });
          }
        } catch {
          navigation.reset({ index: 0, routes: [{ name: 'LinkWR' }] });
        }
        setLoading(false);
        return;
      }

      // Clerk raises "form_identifier_not_found" when no account exists
      // for this email yet — that's the expected case for a new patient,
      // so fall back to sign-up rather than surfacing it as an error.
      const notFound =
        isClerkAPIResponseError(signInErr) &&
        signInErr.errors.some((e) => e.code === 'form_identifier_not_found');
      if (!notFound) {
        setErr(signInErr instanceof Error ? signInErr.message : 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      try {
        await signUp.create({ emailAddress: clean });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        navigation.navigate('OTP', { email: clean, flow: 'signUp' });
      } catch (signUpErr) {
        setErr(signUpErr instanceof Error ? signUpErr.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Enter your email</Text>
        <Text style={styles.helper}>We'll send you a one-time code to verify.</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={v=>{setEmail(v);setErr('');}}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          editable={!loading}
        />
        {err ? <Banner message={err} variant="err" style={{marginTop:spacing.sm}}/> : null}
      </ScrollView>
      <View style={styles.footer}>
        {loading
          ? <ActivityIndicator color={colors.accent}/>
          : <Button label="Send code" onPress={submit} fullWidth/>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.xl, paddingTop:spacing.xxl},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, marginBottom:spacing.sm},
  helper:{fontSize:fontSize.md, color:colors.textSecondary, marginBottom:spacing.xxl},
  input:{borderWidth:1, borderColor:colors.border, borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:12, fontSize:fontSize.lg, color:colors.textPrimary, backgroundColor:colors.surface},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
