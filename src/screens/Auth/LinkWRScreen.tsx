import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { linkPatientAccount, refreshPatientToken } from '../../api/patientAuth';
import { ApiError } from '../../api/client';

export default function LinkWRScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const { getToken } = useAuth();
  const [invoiceRef, setInvoiceRef] = useState('');
  const [amount, setAmount] = useState('');
  const [state, setState] = useState<'idle'|'loading'|'success'|'notfound'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const doLink = async () => {
    const amountMinor = Math.round(Number(amount.replace(/,/g, '')) * 100);
    if (!invoiceRef.trim() || !Number.isFinite(amountMinor) || amountMinor < 0) {
      setState('error');
      setErrorMsg('Enter the bill reference and amount exactly as printed on your bill.');
      return;
    }
    setState('loading');
    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        setState('error');
        setErrorMsg('You need to be signed in to link a WelliRecord.');
        return;
      }
      await linkPatientAccount(clerkToken, invoiceRef.trim(), amountMinor);
      setState('success');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invoice_not_found') {
        setState('notfound');
      } else if (err instanceof ApiError && err.code === 'already_linked') {
        // This Clerk identity already has a linked patient account — just
        // exchange for a fresh token instead of erroring out.
        try {
          const clerkToken = await getToken();
          if (clerkToken && (await refreshPatientToken(clerkToken))) {
            setState('success');
            return;
          }
        } catch {
          // fall through to the generic error banner below
        }
        setState('error');
        setErrorMsg('This account is already linked. Try again in a moment.');
      } else {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{t.linkTitle}</Text>
        <Text style={styles.section}><Text style={styles.bold}>{t.linkDoesLabel}</Text>{' '}{t.linkDoes}</Text>
        <Text style={styles.section}><Text style={styles.bold}>{t.linkNotLabel}</Text>{' '}{t.linkNot}</Text>

        <Text style={styles.label}>Bill reference</Text>
        <TextInput
          style={styles.input}
          value={invoiceRef}
          onChangeText={setInvoiceRef}
          placeholder="e.g. INV-2026-0042"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          editable={state !== 'loading'}
        />
        <Text style={styles.label}>Bill amount (₦)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 48150"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          editable={state !== 'loading'}
        />
        <Text style={styles.helper}>Both are printed on the bill your hospital gave you.</Text>

        {state==='loading' && <ActivityIndicator color={colors.accent} size="large" style={{marginTop:spacing.xl}}/>}
        {state==='success' && <Banner message={t.linkedSuccessMsg} variant="success" style={{marginTop:spacing.xl}}/>}
        {state==='notfound' && <Banner message="No bill matches that reference and amount. Double-check both against your bill." variant="warn" style={{marginTop:spacing.xl}}/>}
        {state==='error' && <Banner message={errorMsg} variant="err" style={{marginTop:spacing.xl}}/>}
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
  label:{fontSize:fontSize.sm, fontWeight:'600', color:colors.textSecondary, marginTop:spacing.md, marginBottom:spacing.xs},
  input:{borderWidth:1, borderColor:colors.border, borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:12, fontSize:fontSize.lg, color:colors.textPrimary, backgroundColor:colors.surface},
  helper:{fontSize:fontSize.xs, color:colors.textTertiary, marginTop:spacing.sm},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
