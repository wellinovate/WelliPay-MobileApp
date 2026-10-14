import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader, Card, StatusPill, Chip, Button, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { NAIRA, fmtDate } from '../../utils/helpers';
import { fetchTransactions, claimGuestPayment, ApiTransaction } from '../../api/patientData';
import { NotLinkedError } from '../../api/client';

type Filter = 'all' | 'pending' | 'successful' | 'failed' | 'refunded';

export function pillStatus(t: ApiTransaction): string {
  return t.status === 'SUCCESS' ? 'successful' : t.status === 'FAILED' ? 'failed' : 'pending';
}

function matches(t: ApiTransaction, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'refunded') return t.refundStatus !== 'NONE';
  return pillStatus(t) === f;
}

// Every payment attempt on the patient's bills, whatever its outcome, plus
// guest payments the patient added with a receipt code.
export default function TransactionsScreen({ navigation }: any) {
  const [items, setItems] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showClaim, setShowClaim] = useState(false);
  const [code, setCode] = useState('');
  const [claimMsg, setClaimMsg] = useState('');
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(() => {
    setError('');
    fetchTransactions()
      .then(res => { setItems(res); setNotLinked(false); })
      .catch(err => {
        if (err instanceof NotLinkedError) setNotLinked(true);
        else setError(err instanceof Error ? err.message : 'Payments could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const claim = async () => {
    if (code.trim().length < 6) { setClaimMsg('Enter the code from your receipt.'); return; }
    setClaiming(true);
    setClaimMsg('');
    try {
      await claimGuestPayment(code.trim());
      setCode('');
      setShowClaim(false);
      load();
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : 'That code could not be added.');
    } finally {
      setClaiming(false);
    }
  };

  const shown = items.filter(t => matches(t, filter));

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My payments" onBack={() => navigation.goBack()} />
      <View style={styles.filters}>
        {(['all', 'pending', 'successful', 'failed', 'refunded'] as Filter[]).map(f => (
          <Chip key={f} label={f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={t => t.transactionId}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={
          <View>
            {notLinked && <Banner message="Link your WelliRecord account to see your payments." variant="warn" style={{ marginBottom: spacing.md }} />}
            {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}
            {!notLinked && (
              <TouchableOpacity onPress={() => setShowClaim(v => !v)} style={styles.claimLink}>
                <Text style={styles.claimLinkText}>{showClaim ? 'Close' : 'Add a guest payment'}</Text>
              </TouchableOpacity>
            )}
            {showClaim && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={styles.claimHelp}>Paid a bill from a link without signing in? Enter the code printed on that receipt to add the payment here.</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={v => { setCode(v.toUpperCase()); setClaimMsg(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Receipt code"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={24}
                />
                {!!claimMsg && <Text style={styles.claimErr}>{claimMsg}</Text>}
                <Button label="Add payment" onPress={claim} loading={claiming} fullWidth style={{ marginTop: spacing.sm }} />
              </Card>
            )}
            {loading && items.length === 0 && <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />}
          </View>
        }
        ListEmptyComponent={!loading && !notLinked ? <Text style={styles.empty}>{items.length ? 'No payments with this status.' : 'No payments yet. A payment appears here as soon as you start one.'}</Text> : null}
        renderItem={({ item: t }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('TransactionDetail', { reference: t.reference })}>
            <Card style={styles.mb}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.facility} numberOfLines={1}>{t.providerName || 'Provider'}</Text>
                  <Text style={styles.date} numberOfLines={1}>{t.description}</Text>
                  <Text style={styles.date}>{fmtDate(new Date(t.paidAt || t.createdAt))}{t.source === 'GUEST' ? ' · guest payment' : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.amount}>{NAIRA(t.amountMinor / 100)}</Text>
                  <StatusPill status={pillStatus(t)} />
                  {t.refundStatus !== 'NONE' && (
                    <Text style={styles.refund}>{t.refundStatus === 'REFUNDED' ? `Refunded ${NAIRA(t.refundedMinor / 100)}` : 'Refund pending'}</Text>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  mb: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  facility: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  amount: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  refund: { fontSize: fontSize.xs, color: colors.textSecondary },
  empty: { fontSize: fontSize.md, color: colors.textTertiary, textAlign: 'center', marginTop: 60 },
  claimLink: { alignSelf: 'flex-end', paddingVertical: spacing.xs, marginBottom: spacing.sm },
  claimLinkText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent },
  claimHelp: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  claimErr: { fontSize: fontSize.sm, color: colors.dangerDark, marginTop: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, fontSize: fontSize.md, color: colors.textPrimary, backgroundColor: colors.surface, letterSpacing: 2 },
});
