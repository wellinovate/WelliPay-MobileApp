import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { fetchClaimReconciliation, ApiReconciliationItem, ApiReconciliationTotals } from '../../api/patientData';
import { NotLinkedError } from '../../api/client';

export default function HmoReconcileScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang] || COPY.en;

  // Real data: compares what each of the patient's HMO claims was
  // approved for against what has actually been remitted, derived
  // server-side from Claim + Payment — nothing simulated here anymore.
  const [items, setItems] = useState<ApiReconciliationItem[]>([]);
  const [totals, setTotals] = useState<ApiReconciliationTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);

  useEffect(() => {
    let active = true;
    fetchClaimReconciliation()
      .then(res => {
        if (!active) return;
        setItems(res.items);
        setTotals(res.totals);
      })
      .catch(err => {
        if (!active) return;
        if (err instanceof NotLinkedError) setNotLinked(true);
        setItems([]);
        setTotals(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totalExpected = (totals?.totalExpectedMinor ?? 0) / 100;
  const totalReceived = (totals?.totalReceivedMinor ?? 0) / 100;
  const totalVariance = (totals?.totalVarianceMinor ?? 0) / 100;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.reconcileTitle || 'WelliPay Reconcile™'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.kicker}>YOUR HMO CLAIMS</Text>
          <Text style={styles.heroTitle}>HMO Remittance & Variance Tracker</Text>
          <Text style={styles.heroSub}>
            Compares what your HMO approved on each claim against what's actually been remitted to your hospital.
          </Text>
        </Card>

        {notLinked ? (
          <Banner message="Link your WelliRecord account to see your claim reconciliation." variant="warn" style={{ marginBottom: spacing.lg }} />
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
        ) : items.length === 0 ? (
          <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: spacing.lg }}>
            No approved HMO claims on file yet.
          </Text>
        ) : (
          <>
            {/* Aggregated Variance Metrics */}
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Expected HMO Remittance</Text>
                <Text style={styles.metricVal}>{NAIRA(totalExpected)}</Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Received to Bank</Text>
                <Text style={[styles.metricVal, { color: colors.accent }]}>{NAIRA(totalReceived)}</Text>
              </Card>
            </View>

            {totalVariance > 0 && (
              <Banner
                message={`${NAIRA(totalVariance)} Total HMO Variance: underpaid relative to what was approved.`}
                variant="warn"
                style={{ marginBottom: spacing.lg }}
              />
            )}

            <Text style={styles.sectionTitle}>Adjudicated Claims & Settlements</Text>

            {items.map(item => {
              const expected = item.expectedAmount.amountMinor / 100;
              const received = item.receivedAmount.amountMinor / 100;
              const variance = item.variance.amountMinor / 100;
              const isUnderpaid = item.reconciliationStatus === 'UNDERPAID';

              return (
                <Card key={item.claimId} style={[styles.claimCard, isUnderpaid && styles.claimCardUnderpaid]}>
                  <View style={styles.claimHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.facilityText}>{item.facilityRef}</Text>
                      <Text style={styles.billRefText}>{item.providerInvoiceRef ?? item.invoiceId} · {item.description ?? 'Encounter'}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      isUnderpaid ? styles.statusUnderpaid : styles.statusBalanced,
                    ]}>
                      <Text style={[styles.statusBadgeText, isUnderpaid ? styles.textUnderpaid : styles.textBalanced]}>
                        {isUnderpaid ? '⚠ UNDERPAID' : item.reconciliationStatus === 'OVERPAID' ? '↑ OVERPAID' : '✓ RECONCILED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={[styles.tableLabel, { color: colors.accentDark }]}>HMO Approved Claim:</Text>
                    <Text style={[styles.tableVal, { color: colors.accentDark, fontWeight: '700' }]}>{NAIRA(expected)}</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>HMO Remittance Received:</Text>
                    <Text style={[styles.tableVal, { fontWeight: '700' }]}>{NAIRA(received)}</Text>
                  </View>

                  {isUnderpaid ? (
                    <View style={[styles.tableRow, styles.varianceRow]}>
                      <Text style={styles.varianceLabel}>HMO Underpayment Variance:</Text>
                      <Text style={styles.varianceAmount}>{NAIRA(variance)}</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  heroCard: {
    backgroundColor: '#E8F4F7',
    borderColor: '#B8D9E0',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1, fontWeight: '700', color: colors.accentDark },
  heroTitle: { fontSize: fontSize.lg, fontWeight: '700', fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 4 },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  metricsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  metricCard: { flex: 1, padding: spacing.md, backgroundColor: colors.surface, borderColor: colors.border },
  metricLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  metricVal: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  claimCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  claimCardUnderpaid: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  facilityText: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  billRefText: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusUnderpaid: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  statusBalanced: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textUnderpaid: { color: colors.danger },
  textBalanced: { color: colors.accentDark },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  tableLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  tableVal: { fontSize: fontSize.sm, color: colors.textPrimary },
  varianceRow: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  varianceLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.danger },
  varianceAmount: { fontSize: fontSize.sm, fontWeight: '800', color: colors.danger },
});
