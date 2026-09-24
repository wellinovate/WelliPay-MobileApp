import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenHeader, Card, Button, Divider, StatusPill } from '../../components';
import { colors, fontSize, spacing, radius, shadow } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';

export default function EpisodeTimelineScreen({ navigation, route }: any) {
  const { lang, episodes, activeEpisodeId, setActiveEpisode, bills, setPaySession } = useStore();
  const t = COPY[lang] || COPY.en;

  const currentEpId = route?.params?.episodeId || activeEpisodeId || episodes[0]?.id || 'ep1';
  const [selectedEpId, setSelectedEpId] = useState(currentEpId);

  const episode = episodes.find(e => e.id === selectedEpId) || episodes[0];
  if (!episode) return null;

  const handleShare = async () => {
    hapticLight();
    try {
      const uri = await generateReceiptPdf({
        ref: episode.episodeNo,
        facility: episode.facility,
        personName: 'Jay Umar',
        amountPaid: episode.patientPaid,
        remainingBalance: episode.patientDue,
        method: 'Healthcare Episode Statement',
        billNo: episode.episodeNo,
        hmoProvider: 'Hygeia HMO (Primary)',
        hmoCovered: episode.hmoCover,
        depositApplied: episode.depositApplied,
        patientSelfPay: episode.patientSelfPay,
        totalHealthcareCost: episode.totalCost,
      });
      hapticSuccess();
      await shareReceiptPdf(uri);
    } catch (e) {
      console.log('PDF error', e);
    }
  };

  const associatedBill = bills.find(b => b.episodeId === episode.id) || bills[0];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.episodeTimeline || 'Healthcare Episode'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Episode Selector Chips */}
        <View style={styles.selectorRow}>
          {episodes.map(ep => {
            const active = ep.id === selectedEpId;
            return (
              <TouchableOpacity
                key={ep.id}
                style={[styles.selectorChip, active && styles.selectorChipActive]}
                onPress={() => {
                  hapticLight();
                  setSelectedEpId(ep.id);
                  setActiveEpisode(ep.id);
                }}
              >
                <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                  {ep.episodeNo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Episode Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>HEALTHCARE EPISODE</Text>
            <StatusPill status={episode.status === 'completed' ? 'paid' : 'unpaid'} />
          </View>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          <Text style={styles.facilityName}>🏥 {episode.facility} · Started {episode.startDate}</Text>
          <Text style={styles.taglineSub}>WelliPay™ · One bill, every payer.</Text>
        </Card>

        {/* Financial Timeline Stepper */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionHeader}>Episode Care Journey</Text>

          {episode.items.map((item, idx) => {
            const isLast = idx === episode.items.length - 1;
            return (
              <View key={item.id} style={styles.stepContainer}>
                {/* Timeline node */}
                <View style={styles.nodeColumn}>
                  <View style={[styles.nodeCircle, item.status === 'cleared' ? styles.nodeCleared : styles.nodePending]}>
                    <Text style={styles.nodeIcon}>
                      {item.category === 'Consultation' ? '🩺' : item.category === 'Laboratory' ? '🔬' : item.category === 'Procedure' ? '🛡️' : '💊'}
                    </Text>
                  </View>
                  {!isLast && <View style={styles.nodeLine} />}
                </View>

                {/* Step Content */}
                <View style={styles.stepContent}>
                  <View style={styles.stepHeaderRow}>
                    <Text style={styles.stepCategory}>{item.category.toUpperCase()}</Text>
                    <Text style={styles.stepDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{item.description}</Text>

                  {/* Dual-Payer Micro Table */}
                  <View style={styles.microTable}>
                    <View style={styles.microRow}>
                      <Text style={styles.microLabel}>Service Tariff:</Text>
                      <Text style={styles.microVal}>{NAIRA(item.totalCost)}</Text>
                    </View>
                    <View style={styles.microRow}>
                      <Text style={[styles.microLabel, { color: colors.accentDark }]}>HMO Contribution:</Text>
                      <Text style={[styles.microVal, { color: colors.accentDark, fontWeight: '600' }]}>
                        -{NAIRA(item.hmoContribution)}
                      </Text>
                    </View>
                    <View style={[styles.microRow, styles.microRowPsp]}>
                      <Text style={[styles.microLabel, { fontWeight: '700', color: colors.textPrimary }]}>
                        Patient Self-Pay (PSP):
                      </Text>
                      <Text style={[styles.microVal, { fontWeight: '700', color: colors.textPrimary }]}>
                        {NAIRA(item.patientSelfPay)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Deposit Treatment Card */}
        {episode.depositPaid > 0 && (
          <Card style={styles.depositCard}>
            <Text style={styles.kicker}>PRE-SERVICE DEPOSIT RECONCILIATION</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Upfront Deposit Paid:</Text>
              <Text style={styles.summaryVal}>{NAIRA(episode.depositPaid)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Applied to Confirmed Self-Pay:</Text>
              <Text style={[styles.summaryVal, { color: colors.accent }]}>-{NAIRA(episode.depositApplied)}</Text>
            </View>
            {episode.refundCredit ? (
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: '700', color: colors.accentDark }]}>
                  Refundable / Creditable to Patient:
                </Text>
                <Text style={[styles.summaryVal, { fontWeight: '700', color: colors.accentDark }]}>
                  {NAIRA(episode.refundCredit)}
                </Text>
              </View>
            ) : null}
            <Text style={styles.depositNote}>
              Deposits paid prior to service adjudication are credited against your final Patient Self-Pay amount.
            </Text>
          </Card>
        )}

        {/* Cumulative Episode Breakdown */}
        <Card style={styles.totalCard}>
          <Text style={styles.kicker}>EPISODE FINANCIAL SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Healthcare Service Cost</Text>
            <Text style={styles.summaryVal}>{NAIRA(episode.totalCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.accentDark }]}>Total HMO Responsibility</Text>
            <Text style={[styles.summaryVal, { color: colors.accentDark, fontWeight: '700' }]}>
              -{NAIRA(episode.hmoCover)}
            </Text>
          </View>
          {episode.depositApplied > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pre-Service Deposit Applied</Text>
              <Text style={[styles.summaryVal, { color: colors.accent }]}>-{NAIRA(episode.depositApplied)}</Text>
            </View>
          )}

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: fontSize.base }]}>
              Confirmed Patient Self-Pay (PSP)
            </Text>
            <Text style={[styles.summaryVal, { fontWeight: '700', fontSize: fontSize.base }]}>
              {NAIRA(episode.patientSelfPay)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Amount Paid to Date</Text>
            <Text style={[styles.summaryVal, { color: colors.accent, fontWeight: '600' }]}>
              {NAIRA(episode.patientPaid)}
            </Text>
          </View>

          <View style={[styles.summaryRow, { marginTop: spacing.xs }]}>
            <Text style={[styles.summaryLabel, { fontWeight: '800', color: episode.patientDue > 0 ? colors.danger : colors.accent }]}>
              Outstanding Balance Due
            </Text>
            <Text style={[styles.summaryVal, { fontWeight: '800', fontSize: fontSize.lg, color: episode.patientDue > 0 ? colors.danger : colors.accent }]}>
              {NAIRA(episode.patientDue)}
            </Text>
          </View>

          {/* HMO Remittance Status */}
          <View style={styles.hmoReconcileBox}>
            <Text style={styles.reconcileHeading}>WelliPay Reconcile™ Status:</Text>
            <Text style={styles.reconcileText}>
              Expected HMO Remittance: {NAIRA(episode.hmoReceivable.expected)} · Received: {NAIRA(episode.hmoReceivable.received)}
            </Text>
            {episode.hmoReceivable.variance > 0 ? (
              <Text style={styles.varianceAlert}>
                ⚠️ ₦{episode.hmoReceivable.variance.toLocaleString()} HMO underpayment identified as provider receivable.
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

          {episode.patientDue > 0 && associatedBill && (
            <Button
              label={`Settle Remaining PSP (${NAIRA(episode.patientDue)})`}
              fullWidth
              onPress={() => {
                setPaySession({
                  payBillId: associatedBill.id,
                  payContext: 'bill',
                  payAmountMode: 'full',
                  payPartAmount: '',
                });
                navigation.navigate('Amount');
              }}
            />
          )}
        </View>
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
  depositCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  depositNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
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
