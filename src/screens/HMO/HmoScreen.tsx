import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Card, ProgressBar, StatusPill, Button, Divider } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function HmoScreen({ navigation }: any) {
  const store = useStore();
  const { lang, hmoPolicies, activeHmoId, preAuths } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.hmoTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Active Health Insurance</Text>

        {hmoPolicies.map(policy => {
          const isActive = policy.id === activeHmoId;
          const remaining = Math.max(0, policy.annualLimit - policy.usedAmount);
          return (
            <TouchableOpacity
              key={policy.id}
              activeOpacity={0.8}
              onPress={() => store.setActiveHmo(policy.id)}
            >
              <Card style={[styles.policyCard, isActive && styles.policyCardActive]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.providerName}>{policy.provider}</Text>
                    <Text style={styles.policyNo}>{policy.policyNo}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{policy.planTier}</Text>
                  </View>
                </View>

                <View style={styles.enrolleeRow}>
                  <Text style={styles.enrolleeLabel}>Enrollee: </Text>
                  <Text style={styles.enrolleeName}>{policy.enrolleeName}</Text>
                  <Text style={styles.coPayTag}>{policy.coPayPercent}% Co-Pay</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.limitInfo}>
                  <Text style={styles.limitKicker}>Annual Benefit Limit</Text>
                  <View style={styles.limitRow}>
                    <Text style={styles.usedText}>{NAIRA(policy.usedAmount)} used</Text>
                    <Text style={styles.limitText}>Limit: {NAIRA(policy.annualLimit)}</Text>
                  </View>
                  <ProgressBar
                    value={policy.usedAmount}
                    max={policy.annualLimit}
                    color={policy.usedAmount / policy.annualLimit > 0.8 ? colors.danger : colors.accent}
                    style={styles.pb}
                  />
                  <Text style={styles.remainingText}>
                    {NAIRA(remaining)} available for medical claims
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Pre-Authorizations */}
        <View style={styles.preAuthHeader}>
          <Text style={styles.sectionTitle}>Recent Pre-Authorizations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PreAuth')}>
            <Text style={styles.requestLink}>+ Request New</Text>
          </TouchableOpacity>
        </View>

        {preAuths.map(pa => (
          <Card key={pa.id} style={styles.paCard}>
            <View style={styles.paRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paFacility}>{pa.facility}</Text>
                <Text style={styles.paProcedure}>{pa.procedure}</Text>
                <Text style={styles.paDate}>{pa.requestDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <StatusPill status={pa.status === 'approved' ? 'paid' : pa.status === 'in_review' ? 'pending' : 'failed'} />
                {pa.approvalCode ? (
                  <Text style={styles.authCode}>{pa.approvalCode}</Text>
                ) : null}
              </View>
            </View>

            <Divider style={styles.paDivider} />

            <View style={styles.paCostRow}>
              <Text style={styles.paCostLabel}>Covered: {NAIRA(pa.coveredAmount)}</Text>
              <Text style={styles.paCostPatient}>You pay: {NAIRA(pa.patientPortion)}</Text>
            </View>
            {pa.notes ? <Text style={styles.paNotes}>{pa.notes}</Text> : null}
          </Card>
        ))}

        {/* WelliPay Reconcile Card */}
        <Card style={{ marginTop: spacing.md, backgroundColor: '#E8F4F7', borderColor: '#B8D9E0' }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.accentDark, letterSpacing: 0.8 }}>PROVIDER SETTLEMENT & CLAIMS</Text>
          <Text style={{ fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>WelliPay Reconcile™</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
            Audit approved HMO claim remittances and detect underpayment variances with partner hospitals.
          </Text>
          <Button
            label="Open WelliPay Reconcile™"
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.sm }}
            onPress={() => navigation.navigate('HmoReconcile')}
          />
        </Card>

        {/* Episode Financial Timeline Card */}
        <Card style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.8 }}>EPISODE CARE JOURNEY</Text>
          <Text style={{ fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>Healthcare Episode Timelines</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
            View continuous financial tracking across Consultation, Labs, and Medication with HMO vs Self-Pay splits.
          </Text>
          <Button
            label="View Episode Timelines"
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.sm }}
            onPress={() => navigation.navigate('EpisodeTimeline')}
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t.addHmoBtn}
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('AddHmo')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  policyCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  policyCardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#F7FCFD',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  providerName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  policyNo: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  badge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.xs, color: colors.accentDark, fontWeight: '600' },
  enrolleeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  enrolleeLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  enrolleeName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  coPayTag: {
    marginLeft: 'auto',
    fontSize: fontSize.xs,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: { marginVertical: spacing.md },
  limitInfo: { marginTop: 2 },
  limitKicker: { fontSize: fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 6 },
  usedText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  limitText: { fontSize: fontSize.sm, color: colors.textSecondary },
  pb: { marginVertical: spacing.xs },
  remainingText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600', marginTop: 4 },
  preAuthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  requestLink: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  paCard: { marginBottom: spacing.md },
  paRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paFacility: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  paProcedure: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  paDate: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 4 },
  authCode: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent, marginTop: 4 },
  paDivider: { marginVertical: spacing.sm },
  paCostRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paCostLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  paCostPatient: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textPrimary },
  paNotes: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
