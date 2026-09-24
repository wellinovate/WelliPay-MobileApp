import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader, Card, Button, Divider, StatusPill, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

export default function HmoReconcileScreen({ navigation }: any) {
  const { lang, bills, recordHmoRemittance } = useStore();
  const t = COPY[lang] || COPY.en;

  const reconciledBills = bills.filter(b => b.hasSplit && b.reconciliation);

  const totalExpected = reconciledBills.reduce((acc, b) => acc + (b.reconciliation?.expectedHmo || 0), 0);
  const totalReceived = reconciledBills.reduce((acc, b) => acc + (b.reconciliation?.receivedHmo || 0), 0);
  const totalVariance = reconciledBills.reduce((acc, b) => acc + (b.reconciliation?.variance || 0), 0);

  const [simulatedBillId, setSimulatedBillId] = useState<string | null>(null);

  const handleSimulateRemittance = (billId: string, currentExpected: number) => {
    hapticLight();
    // Simulate HMO paying ₦5,000 less (underpayment variance)
    const paid = currentExpected - 5000;
    recordHmoRemittance(billId, paid);
    hapticSuccess();
    setSimulatedBillId(billId);
    Alert.alert(
      'Remittance Recorded',
      `HMO remitted ${NAIRA(paid)} of expected ${NAIRA(currentExpected)}. ₦5,000 underpayment logged to provider receivable ledger.`
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.reconcileTitle || 'WelliPay Reconcile™'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.kicker}>PROVIDER SETTLEMENT AUDIT</Text>
          <Text style={styles.heroTitle}>HMO Remittance & Variance Tracker</Text>
          <Text style={styles.heroSub}>
            WelliPay Reconcile™ detects underpayments between approved HMO claims and actual bank remittances.
          </Text>
        </Card>

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
            message={`₦${totalVariance.toLocaleString()} Total HMO Variance: Flagged as provider receivable awaiting dispute settlement.`}
            variant="warn"
            style={{ marginBottom: spacing.lg }}
          />
        )}

        {/* Reconciliation Items */}
        <Text style={styles.sectionTitle}>Adjudicated Claims & Settlements</Text>

        {reconciledBills.map(bill => {
          const rec = bill.reconciliation!;
          const isUnderpaid = rec.variance > 0;

          return (
            <Card key={bill.id} style={[styles.claimCard, isUnderpaid && styles.claimCardUnderpaid]}>
              <View style={styles.claimHeader}>
                <View>
                  <Text style={styles.facilityText}>{bill.facility}</Text>
                  <Text style={styles.billRefText}>{bill.billNo} · Encounter Care</Text>
                </View>
                <View style={[styles.statusBadge, isUnderpaid ? styles.statusUnderpaid : styles.statusBalanced]}>
                  <Text style={[styles.statusBadgeText, isUnderpaid ? styles.textUnderpaid : styles.textBalanced]}>
                    {isUnderpaid ? '⚠ UNDERPAID' : '✓ RECONCILED'}
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Total Encounter Cost:</Text>
                <Text style={styles.tableVal}>{NAIRA(bill.amountTotal)}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Patient Self-Pay (PSP):</Text>
                <Text style={styles.tableVal}>{NAIRA(bill.patientSelfPay || bill.amountDue)}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: colors.accentDark }]}>HMO Approved Claim:</Text>
                <Text style={[styles.tableVal, { color: colors.accentDark, fontWeight: '700' }]}>
                  {NAIRA(rec.expectedHmo)}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>HMO Remittance Received:</Text>
                <Text style={[styles.tableVal, { fontWeight: '700' }]}>
                  {NAIRA(rec.receivedHmo)}
                </Text>
              </View>

              {isUnderpaid ? (
                <View style={[styles.tableRow, styles.varianceRow]}>
                  <Text style={styles.varianceLabel}>HMO Underpayment Variance:</Text>
                  <Text style={styles.varianceAmount}>{NAIRA(rec.variance)}</Text>
                </View>
              ) : null}

              <View style={styles.claimFooter}>
                <Button
                  label={isUnderpaid ? "Resolve HMO Underpayment" : "Simulate Remittance Shortfall"}
                  variant={isUnderpaid ? "primary" : "secondary"}
                  onPress={() => handleSimulateRemittance(bill.id, rec.expectedHmo)}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            </Card>
          );
        })}
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
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  claimFooter: { marginTop: spacing.xs },
});
