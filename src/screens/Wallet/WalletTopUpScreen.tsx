import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ScreenHeader, Button, Banner, Card } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { startWalletTopUp, fetchTopUp, ApiTopUp } from '../../api/patientData';

const PRESETS = [5000, 10000, 20000, 50000];
const MAX_POLLS = 15;

// Adds credit to the wallet through Paystack. The balance changes only after
// Paystack confirms the payment to the server, so this screen waits and checks.
export default function WalletTopUpScreen({ navigation }: any) {
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [topUp, setTopUp] = useState<ApiTopUp | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amountNaira = preset !== null ? PRESETS[preset]! : parseInt(custom.replace(/[^0-9]/g, ''), 10) || 0;

  const check = (ref: string) => {
    fetchTopUp(ref)
      .then(res => {
        setTopUp(res);
        if (res.status === 'PENDING' && polls.current < MAX_POLLS) {
          polls.current += 1;
          timer.current = setTimeout(() => check(ref), 4000);
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not check the top-up.'));
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await startWalletTopUp({ amountMinor: amountNaira * 100, ...(email.trim() ? { email: email.trim() } : {}) });
      setReference(res.reference);
      polls.current = 0;
      await WebBrowser.openBrowserAsync(res.authorizationUrl);
      check(res.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The top-up could not be started.');
    } finally {
      setStarting(false);
    }
  };

  if (reference) {
    const status = topUp?.status ?? 'PENDING';
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Add money" />
        <View style={styles.body}>
          <Card>
            <Text style={styles.big}>{NAIRA((topUp?.amountMinor ?? amountNaira * 100) / 100)}</Text>
            {status === 'PENDING' && (
              <>
                <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />
                <Text style={styles.msg}>Waiting for Paystack to confirm. This usually takes a few seconds.</Text>
              </>
            )}
            {status === 'SUCCESS' && <Text style={[styles.msg, { color: colors.accentDark }]}>Added to your wallet.</Text>}
            {status === 'FAILED' && <Text style={[styles.msg, { color: colors.danger }]}>{topUp?.failureReason || 'The payment did not go through. You were not charged.'}</Text>}
          </Card>
          {!!error && <Banner message={error} variant="err" style={{ marginTop: spacing.md }} />}
          {status === 'PENDING' && (
            <Button label="Check again" variant="secondary" fullWidth style={{ marginTop: spacing.md }} onPress={() => { polls.current = 0; check(reference); }} />
          )}
          <Button label="Done" fullWidth style={{ marginTop: spacing.md }} onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Add money" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>Money you add is credit with this provider. You can spend it on this provider's bills. It is not a bank account and it does not earn interest.</Text>
        <View style={styles.presets}>
          {PRESETS.map((p, i) => (
            <TouchableOpacity key={p} onPress={() => { setPreset(i); setCustom(''); }} style={[styles.preset, preset === i && styles.presetOn]} activeOpacity={0.7}>
              <Text style={[styles.presetText, preset === i && styles.presetTextOn]}>{NAIRA(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Or enter an amount in naira</Text>
        <TextInput
          style={styles.input}
          value={custom}
          onChangeText={v => { setCustom(v.replace(/[^0-9]/g, '')); setPreset(null); setError(''); }}
          keyboardType="number-pad"
          placeholder="₦0"
          placeholderTextColor={colors.textTertiary}
        />
        <TextInput
          style={[styles.input, { fontSize: fontSize.base, marginTop: spacing.md }]}
          value={email}
          onChangeText={v => { setEmail(v); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Email for your receipt (optional if on file)"
          placeholderTextColor={colors.textTertiary}
        />
        {!!error && <Banner message={error} variant="err" style={{ marginTop: spacing.md }} />}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={`Add ${NAIRA(amountNaira)}`} fullWidth disabled={amountNaira < 100} loading={starting} onPress={start} />
        <Text style={styles.small}>From ₦100 to ₦500,000. You pay on Paystack's secure page.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  note: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 18 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  preset: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  presetOn: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  presetText: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  presetTextOn: { color: colors.accentDark },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginVertical: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: fontSize.xl, color: colors.textPrimary, backgroundColor: colors.surface },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  small: { fontSize: fontSize.xs, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  big: { fontSize: fontSize.display, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  msg: { fontSize: fontSize.base, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
