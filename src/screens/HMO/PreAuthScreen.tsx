import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Chip, Card, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { fetchHmoPolicies, ApiHmoPolicy, createPreAuthorization } from '../../api/patientData';
import { ApiError, NotLinkedError } from '../../api/client';

export default function PreAuthScreen({ navigation }: any) {
  const store = useStore();
  const { lang, facilities } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  // Pulled live rather than from the local store's demo hmoPolicies — a
  // pre-auth has to reference a real hmoPolicyId that exists in
  // wellipay-api, which a leftover demo-seed policy wouldn't.
  const [policies, setPolicies] = useState<ApiHmoPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [activePolicy, setActivePolicy] = useState<ApiHmoPolicy | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetchHmoPolicies()
      .then(items => {
        if (!active) return;
        setPolicies(items);
        setActivePolicy(items[0]);
      })
      .catch(() => { if (active) setPolicies([]); })
      .finally(() => { if (active) setPoliciesLoading(false); });
    return () => { active = false; };
  }, []);

  const [selectedFacility, setSelectedFacility] = useState(facilities[0].name);
  const [procedure, setProcedure] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('150000');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const numCost = parseInt(estimatedCost.replace(/[^0-9]/g, '')) || 0;
  const coPayPct = activePolicy ? activePolicy.coPayPercent : 10;
  const patientPortion = Math.round((numCost * coPayPct) / 100);
  const coveredAmount = Math.max(0, numCost - patientPortion);

  const handleSubmit = async () => {
    if (!activePolicy) {
      setError('Add an HMO card before requesting a pre-authorization.');
      return;
    }
    if (!procedure.trim()) {
      setError('Please specify the medical procedure or test.');
      return;
    }
    if (numCost <= 0) {
      setError('Please enter a valid estimated cost.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const created = await createPreAuthorization({
        hmoPolicyId: activePolicy.hmoPolicyId,
        facilityRef: selectedFacility,
        procedure: procedure.trim(),
        estimatedCostMinor: numCost * 100,
      });

      // Also mirror into the local store, in case another screen reads
      // store.preAuths later — HmoScreen itself now fetches its own list
      // live from the API instead of this.
      store.submitPreAuth({
        id: created.preAuthId,
        hmoPolicyId: created.hmoPolicyId,
        facility: created.facilityRef,
        procedure: created.procedure,
        estimatedCost: created.estimatedCost.amountMinor / 100,
        coveredAmount: created.coveredAmount.amountMinor / 100,
        patientPortion: created.patientPortion.amountMinor / 100,
        status: created.status === 'APPROVED' ? 'approved' : created.status === 'DECLINED' ? 'declined' : 'in_review',
        requestDate: 'Today',
        approvalCode: created.approvalCode,
        notes: created.notes,
      });

      Alert.alert(
        'Pre-Authorization Approved!',
        `${activePolicy.provider} has approved ${NAIRA(created.coveredAmount.amountMinor / 100)} for ${procedure} at ${selectedFacility}. Your co-pay: ${NAIRA(created.patientPortion.amountMinor / 100)}.`,
        [{ text: 'View Pre-Auths', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      if (err instanceof NotLinkedError) {
        setError('Link your WelliRecord account first.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not submit the pre-authorization. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.newPreAuthTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Banner text={error} variant="error" style={styles.mb} /> : null}

        <Card style={styles.policyCard}>
          <Text style={styles.kicker}>Active HMO Policy</Text>
          {policiesLoading ? (
            <ActivityIndicator color={colors.accentDark} style={{ marginTop: spacing.xs }} />
          ) : activePolicy ? (
            <>
              <Text style={styles.hmoName}>{activePolicy.provider}</Text>
              <Text style={styles.hmoSub}>{activePolicy.policyNo} · {activePolicy.planTier} ({coPayPct}% Co-Pay)</Text>
            </>
          ) : (
            <Text style={styles.hmoSub}>No HMO card on file — add one before requesting a pre-authorization.</Text>
          )}
        </Card>

        <View style={styles.field}>
          <Text style={styles.label}>Select Hospital / Facility</Text>
          <View style={styles.chipsWrap}>
            {facilities.map(fac => (
              <Chip
                key={fac.id}
                label={fac.name}
                active={selectedFacility === fac.name}
                onPress={() => setSelectedFacility(fac.name)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Procedure, Surgery or Lab Test</Text>
          <TextInput
            style={styles.input}
            value={procedure}
            onChangeText={(txt) => {
              setProcedure(txt);
              if (error) setError('');
            }}
            placeholder="e.g. Endoscopic Sinus Surgery / MRI Lumbar"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Estimated Cost (₦)</Text>
          <TextInput
            style={styles.input}
            value={estimatedCost}
            onChangeText={setEstimatedCost}
            keyboardType="numeric"
            placeholder="150000"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryKicker}>Estimated Coverage Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hospital Cost:</Text>
            <Text style={styles.summaryVal}>{NAIRA(numCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.accent }]}>HMO Covers ({100 - coPayPct}%):</Text>
            <Text style={[styles.summaryVal, { color: colors.accent }]}>{NAIRA(coveredAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Your Co-Pay ({coPayPct}%):</Text>
            <Text style={styles.summaryVal}>{NAIRA(patientPortion)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Request Instant Approval"
          fullWidth
          loading={submitting}
          disabled={policiesLoading || !activePolicy}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  mb: { marginBottom: spacing.md },
  policyCard: { marginBottom: spacing.lg, backgroundColor: colors.accentLight, borderColor: colors.accentBorder },
  kicker: { fontSize: fontSize.xs, color: colors.accentDark, textTransform: 'uppercase', fontWeight: '600' },
  hmoName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accentDark, marginTop: 2 },
  hmoSub: { fontSize: fontSize.xs, color: colors.accentMid, marginTop: 2 },
  field: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.lg },
  summaryKicker: { fontSize: fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: spacing.sm, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryVal: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
