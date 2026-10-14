import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ScreenHeader, Button, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { PAY_PAGE_URL } from '../../api/config';

// Pulls the payment token out of a pasted link, or accepts the bare token.
export function extractPayToken(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  const fromQuery = text.match(/[?&]t=([A-Za-z0-9_-]{16,})/);
  if (fromQuery) return fromQuery[1];
  return /^[A-Za-z0-9_-]{16,}$/.test(text) ? text : null;
}

// Pay a provider's bill without a WelliPay account. Works before sign-in.
export default function GuestPayScreen({ navigation }: any) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');

  const open = async () => {
    const token = extractPayToken(value);
    if (!token) { setErr('Paste the payment link the provider sent you.'); return; }
    setErr('');
    try {
      await WebBrowser.openBrowserAsync(`${PAY_PAGE_URL}?t=${encodeURIComponent(token)}`);
    } catch {
      setErr('The payment page could not be opened.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Pay without an account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>Paste the payment link your provider sent you. You pay on Paystack's secure page and get a receipt and a reference.</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={v => { setValue(v); setErr(''); }}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Payment link"
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        {!!err && <Banner message={err} variant="err" style={{ marginTop: spacing.sm }} />}
        <Button label="Open payment page" onPress={open} fullWidth style={{ marginTop: spacing.md }} />
        <Text style={styles.note}>
          Want your bills, receipts and family contributions in one place? Create a WelliPay profile with your phone number. After a guest payment, keep the receipt code. You can add that payment to your profile later.
        </Text>
        <Button label="Create a profile" variant="secondary" onPress={() => navigation.navigate('Phone')} fullWidth style={{ marginTop: spacing.md }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  lead: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  input: { minHeight: 72, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, fontSize: fontSize.md, color: colors.textPrimary, backgroundColor: colors.surface, textAlignVertical: 'top' },
  note: { fontSize: fontSize.sm, color: colors.textTertiary, lineHeight: 18, marginTop: spacing.xl },
});
