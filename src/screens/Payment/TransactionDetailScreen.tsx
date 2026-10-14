import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, StatusPill, Button, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { NAIRA, fmtDate } from '../../utils/helpers';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';
import { fetchTransaction, ApiTransaction } from '../../api/patientData';
import { pillStatus } from './TransactionsScreen';

const MAX_POLLS = 15;

// One payment: status, amounts, the bill's lines, refund state and a receipt.
// A pending payment is re-checked every few seconds. The status always comes
// from the server, which waits for Paystack to confirm.
export default function TransactionDetailScreen({ navigation, route }: any) {
  const reference: string = route.params?.reference;
  const [tx, setTx] = useState<ApiTransaction | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    fetchTransaction(reference)
      .then(res => {
        setTx(res);
        setError('');
        if (res.status === 'PENDING' && polls.current < MAX_POLLS) {
          polls.current += 1;
          timer.current = setTimeout(load, 4000);
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : 'This payment could not be loaded.'))
      .finally(() => setLoading(false));
  }, [reference]);

  useEffect(() => {
    load();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [load]);

  const checkAgain = () => {
    polls.current = 0;
    setLoading(true);
    load();
  };

  const share = async () => {
    if (!tx) return;
    setSharing(true);
    try {
      const uri = await generateReceiptPdf({
        ref: tx.reference,
        facility: tx.providerName,
        personName: 'Patient',
        amountPaid: tx.amountMinor / 100,
        method: 'Paystack',
        billNo: tx.invoiceRef,
        date: fmtDate(new Date(tx.paidAt || tx.createdAt)),
      });
      await shareReceiptPdf(uri);
    } catch {
      setError('The receipt could not be created.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Payment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {loading && !tx && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}
        {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}
        {tx && (
          <>
            <Text style={styles.amount}>{NAIRA(tx.amountMinor / 100)}</Text>
            <StatusPill status={pillStatus(tx)} />
            {tx.status === 'PENDING' && (
              <Banner message="We are waiting for Paystack to confirm this payment. This can take a minute." variant="warn" style={{ marginTop: spacing.md }} />
            )}
            {tx.status === 'FAILED' && (
              <Banner message={tx.failureReason || 'This payment was not completed. You were not charged for a failed payment.'} variant="err" style={{ marginTop: spacing.md }} />
            )}
            {tx.refundStatus === 'REFUNDED' && (
              <Banner message={`${NAIRA(tx.refundedMinor / 100)} was refunded.`} variant="warn" style={{ marginTop: spacing.md }} />
            )}
            {tx.refundStatus === 'PENDING' && (
              <Banner message="A refund is waiting for the provider's decision." variant="warn" style={{ marginTop: spacing.md }} />
            )}

            <Card style={styles.card}>
              <Text style={styles.kicker}>PAYMENT</Text>
              <Row label="Provider" value={tx.providerName} />
              <Row label="Bill" value={tx.invoiceRef} />
              <Row label="For" value={tx.description} />
              <Row label="Reference" value={tx.reference} />
              <Row label="Paid with" value={tx.processor === 'paystack' ? 'Paystack' : tx.processor} />
              <Row label="Started" value={fmtDate(new Date(tx.createdAt))} />
              {tx.paidAt ? <Row label="Paid on" value={fmtDate(new Date(tx.paidAt))} /> : null}
              {tx.source === 'GUEST' ? <Row label="Paid as" value="Guest" /> : null}
            </Card>

            {tx.lines && tx.lines.length > 0 && (
              <Card style={styles.card}>
                <Text style={styles.kicker}>ON THIS BILL</Text>
                {tx.lines.map((l, i) => (
                  <Row key={i} label={l.quantity > 1 ? `${l.description} × ${l.quantity}` : l.description} value={NAIRA((l.quantity * l.unitPriceMinor) / 100)} />
                ))}
              </Card>
            )}

            {tx.status === 'PENDING' && <Button label="Check again" variant="secondary" onPress={checkAgain} fullWidth style={{ marginTop: spacing.md }} />}
            {tx.status === 'SUCCESS' && <Button label="Share receipt" onPress={share} loading={sharing} fullWidth style={{ marginTop: spacing.md }} />}
            {tx.status === 'FAILED' && (
              <Button label="Back to my bills" variant="secondary" onPress={() => navigation.navigate('MainTabs')} fullWidth style={{ marginTop: spacing.md }} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  amount: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  card: { marginTop: spacing.md },
  kicker: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.6, marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 4 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, flexShrink: 1 },
  value: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'right' },
});
