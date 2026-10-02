import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, Button, Divider, StatusPill, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, fmtDate } from '../../utils/helpers';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';
import { fetchEpisodes, ApiEpisode } from '../../api/patientData';
import { NotLinkedError } from '../../api/client';

const CATEGORY_ICON: Record<string, string> = {
  Consultation: '🩺',
  Laboratory: '🔬',
  Procedure: '🛡️',
  Medication: '💊',
  'Ward/Bed': '🛏️',
};

export default function EpisodeTimelineScreen({ navigation }: any) {
  const { lang, setPaySession } = useStore();
  const t = COPY[lang] || COPY.en;

  // Real data: episodes are groups of the patient's own invoices that a
  // provider tagged with the same metadata.episodeRef — derived server-side
  // in wellipay-api, nothing simulated here anymore.
  const [episodes, setEpisodes] = useState<ApiEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchEpisodes()
      .then(res => {
        if (!active) return;
        setEpisodes(res);
        if (res.length > 0) setSelectedRef(res[0].episodeRef);
      })
      .catch(err => {
        if (!active) return;
        if (err instanceof NotLinkedError) setNotLinked(true);
        setEpisodes([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const episode = episodes.find(e => e.episodeRef === selectedRef) || episodes[0];

  const toMajor = (m: { amountMinor: number }) => m.amountMinor / 100;

  const handleShare = async () => {
    if (!episode) return;
    hapticLight();
    try {
      const uri = await generateReceiptPdf({
        ref: episode.episodeRef,
        facility: episode.facilityRef,
        personName: 'Patient',
        amountPaid: toMajor(episode.patientPaid),
        remainingBalance: toMajor(episode.patientDue),
        method: 'Healthcare Episode Statement',
        billNo: episode.episodeRef,
        hmoCovered: toMajor(episode.hmoCover),
        patientSelfPay: toMajor(episode.patientSelfPay),
        totalHealthcareCost: toMajor(episode.totalCost),
      });
      hapticSuccess();
      await shareReceiptPdf(uri);
    } catch (e) {
      console.log('PDF error', e);
    }
  };

  // The item with the largest unpaid self-pay balance is what "Settle
  // Remaining PSP" settles — routed through the same liveInvoiceId flow
  // BillsScreen uses for real invoices (see BillDetailScreen/LiveBillDetail).
  const outstandingItem = episode?.items
    .filter(i => i.status !== 'cleared')
    .sort((a, b) => toMajor(b.patientSelfPay) - toMajor(a.patientSelfPay))[0];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.episodeTimeline || 'Healthcare Episode'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {notLinked ? (
          <Banner message="Link your WelliRecord account to see your healthcare episodes." variant="warn" style={{ marginBottom: spacing.lg }} />
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
        ) : episodes.length === 0 || !episode ? (
          <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: spacing.lg }}>
            No healthcare episodes on file yet. An episode appears once your facility groups a set of invoices together.
          </Text>
        ) : (
          <>
            {/* Episode Selector Chips */}
            {episodes.length > 1 && (
              <View style={styles.selectorRow}>
                {episodes.map(ep => {
                  const active = ep.episodeRef === selectedRef;
                  return (
                    <TouchableOpacity
                      key={ep.episodeRef}
                      style={[styles.selectorChip, active && styles.selectorChipActive]}
                      onPress={() => { hapticLight(); setSelectedRef(ep.episodeRef); }}
                    >
                      <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                        {ep.episodeRef}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Episode Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.kickerRow}>
                <Text style={styles.kicker}>HEALTHCARE EPISODE</Text>
                <StatusPill status={episode.status === 'completed' ? 'paid' : 'unpaid'} />
              </View>
              <Text style={styles.episodeTitle}>{episode.episodeRef}</Text>
              <Text style={styles.facilityName}>🏥 {episode.facilityRef} · Started {fmtDate(new Date(episode.startDate))}</Text>
              <Text style={styles.taglineSub}>WelliPay™ · One bill, every payer.</Text>
            </Card>

            {/* Financial Timeline Stepper */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionHeader}>Episode Care Journey</Text>

              {episode.items.map((item, idx) => {
                const isLast = idx === episode.items.length - 1;
                return (
                  <View key={item.invoiceId} style={styles.stepContainer}>
                    {/* Timeline node */}
                    <View style={styles.nodeColumn}>
                      <View style={[styles.nodeCircle, item.status === 'cleared' ? styles.nodeCleared : styles.nodePending]}>
                        <Text style={styles.nodeIcon}>{CATEGORY_ICON[item.category] ?? '📄'}</Text>
                      </View>
                      {!isLast && <View style={styles.nodeLine} />}
                    </View>

                    {/* Step Content */}
                    <View style={styles.stepContent}>
                      <View style={styles.stepHeaderRow}>
                        <Text style={styles.stepCategory}>{item.category.toUpperCase()}</Text>
                        <Text style={styles.stepDate}>{fmtDate(new Date(item.date))}</Text>
                      </View>
                      <Text style={styles.stepDesc}>{item.description}</Text>

                      {/* Dual-Payer Micro Table */}
                      <View style={styles.microTable}>
                        <View style={styles.microRow}>
                          <Text style={styles.microLabel}>Service Tariff:</Text>
                          <Text style={styles.microVal}>{NAIRA(toMajor(item.totalCost))}</Text>
                        </View>
                        <View style={styles.microRow}>
                          <Text style={[styles.microLabel, { color: colors.accentDark }]}>HMO Contribution:</Text>
                          <Text style={[styles.microVal, { color: colors.accentDark, fontWeight: '600' }]}>
                            -{NAIRA(toMajor(item.hmoContribution))}
                          </Text>
                        </View>
                        <View style={[styles.microRow, styles.microRowPsp]}>
                          <Text style={[styles.microLabel, { fontWeight: '700', color: colors.textPrimary }]}>
                            Patient Self-Pay (PSP):
                          </Text>
                          <Text style={[styles.microVal, { fontWeight: '700', color: colors.textPrimary }]}>
                            {NAIRA(toMajor(item.patientSelfPay))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Cumulative Episode Breakdown */}
            <Card style={styles.totalCard}>
              <Text style={styles.kicker}>EPISODE FINANCIAL SUMMARY</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Healthcare Service Cost</Text>
                <Text style={styles.summaryVal}>{NAIRA(toMajor(episode.totalCost))}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.accentDark }]}>Total HMO Responsibility</Text>
                <Text style={[styles.summaryVal, { color: colors.accentDark, fontWeight: '700' }]}>
                  -{NAIRA(toMajor(episode.hmoCover))}
                </Text>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: fontSize.base }]}>
                  Confirmed Patient Self-Pay (PSP)
                </Text>
                <Text style={[styles.summaryVal, { fontWeight: '700', fontSize: fontSize.base }]}>
                  {NAIRA(toMajor(episode.patientSelfPay))}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Amount Paid to Date</Text>
                <Text style={[styles.summaryVal, { color: colors.accent, fontWeight: '600' }]}>
                  {NAIRA(toMajor(episode.patientPaid))}
                </Text>
              </View>

              <View style={[styles.summaryRow, { marginTop: spacing.xs }]}>
                <Text style={[styles.summaryLabel, { fontWeight: '800', color: toMajor(episode.patientDue) > 0 ? colors.danger : colors.accent }]}>
                  Outstanding Balance Due
                </Text>
                <Text style={[styles.summaryVal, { fontWeight: '800', fontSize: fontSize.lg, color: toMajor(episode.patientDue) > 0 ? colors.danger : colors.accent }]}>
                  {NAIRA(toMajor(episode.patientDue))}
                </Text>
              </View>

              {/* HMO Remittance Status */}
              <View style={styles.hmoReconcileBox}>
                <Text style={styles.reconcileHeading}>WelliPay Reconcile™ Status:</Text>
                <Text style={styles.reconcileText}>
                  Expected HMO Remittance: {NAIRA(toMajor(episode.hmoReceivable.expected))} · Received: {NAIRA(toMajor(episode.hmoReceivable.received))}
                </Text>
                {episode.hmoReceivable.status === 'UNDERPAID' ? (
                  <Text style={styles.varianceAlert}>
                    ⚠️ {NAIRA(toMajor(episode.hmoReceivable.variance))} HMO underpayment identified as provider receivable.
                  </Text>
                ) : (
                  <Text style={styles.balancedNotice}>✓ HMO remittance fully reconciled with hospital.</Text>
                )}
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                label="📄 Share Episode Statement (PDF)"
                variant="secondary"
                fullWidth
                onPress={handleShare}
                style={{ marginBottom: spacing.md }}
              />

              {toMajor(episode.patientDue) > 0 && outstandingItem && (
                <Button
                  label={`Settle Remaining PSP (${NAIRA(toMajor(episode.patientDue))})`}
                  fullWidth
                  onPress={() => {
                    setPaySession({ liveInvoiceId: outstandingItem.invoiceId, payBillId: null } as any);
                    navigation.navigate('BillDetail');
                  }}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  selectorRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  selectorChipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  selectorChipTextActive: { color: '#FFF' },
  headerCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1, fontWeight: '700', color: colors.textTertiary },
  episodeTitle: { fontSize: fontSize.lg, fontWeight: '700', fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 4 },
  facilityName: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  taglineSub: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600', marginTop: spacing.sm },
  timelineSection: { marginBottom: spacing.lg },
  sectionHeader: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  stepContainer: { flexDirection: 'row', marginBottom: spacing.md },
  nodeColumn: { width: 36, alignItems: 'center' },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
  },
  nodeCleared: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  nodePending: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  nodeIcon: { fontSize: 14 },
  nodeLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  stepContent: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  stepCategory: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent, letterSpacing: 0.5 },
  stepDate: { fontSize: fontSize.xs, color: colors.textTertiary },
  stepDesc: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.sm },
  microTable: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  microRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  microRowPsp: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4, marginTop: 2 },
  microLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  microVal: { fontSize: fontSize.xs, color: colors.textPrimary },
  totalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryVal: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  hmoReconcileBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  reconcileHeading: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },
  reconcileText: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  varianceAlert: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '700', marginTop: 4 },
  balancedNotice: { fontSize: fontSize.xs, color: colors.accentDark, fontWeight: '600', marginTop: 4 },
  actionRow: { marginTop: spacing.xs, marginBottom: spacing.xl },
});
