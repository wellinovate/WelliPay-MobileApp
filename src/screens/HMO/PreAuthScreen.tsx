import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Chip, Card, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, uid } from '../../utils/helpers';

export default function PreAuthScreen({ navigation }: any) {
  const store = useStore();
  const { lang, hmoPolicies, activeHmoId, facilities } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const activePolicy = hmoPolicies.find(p => p.id === activeHmoId) || hmoPolicies[0];

  const [selectedFacility, setSelectedFacility] = useState(facilities[0].name);
  const [procedure, setProcedure] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('150000');
  const [error, setError] = useState('');

  const numCost = parseInt(estimatedCost.replace(/[^0-9]/g, '')) || 0;
  const coPayPct = activePolicy ? activePolicy.coPayPercent : 10;
  const patientPortion = Math.round((numCost * coPayPct) / 100);
  const coveredAmount = Math.max(0, numCost - patientPortion);

  const handleSubmit = () => {
    if (!procedure.trim()) {
      setError('Please specify the medical procedure or test.');
      return;
    }
    if (numCost <= 0) {
      setError('Please enter a valid estimated cost.');
      return;
    }

    const newPreAuth = {
      id: 'pa_' + uid().toLowerCase(),
      hmoPolicyId: activePolicy ? activePolicy.id : 'hmo1',
      facility: selectedFacility,
      procedure: procedure.trim(),
      estimatedCost: numCost,
      coveredAmount,
      patientPortion,
      status: 'approved' as const,
      requestDate: 'Today',
      approvalCode: 'AUTH-HYG-' + Math.floor(1000 + Math.random() * 9000),
      notes: `Pre-authorization approved by ${activePolicy?.provider || 'HMO'}. Valid for 14 days.`,
    };

    store.submitPreAuth(newPreAuth);
    Alert.alert(
      'Pre-Authorization Approved!',
      `${activePolicy?.provider || 'HMO'} has approved ${NAIRA(coveredAmount)} for ${procedure} at ${selectedFacility}. Your co-pay: ${NAIRA(patientPortion)}.`,
      [{ text: 'View Pre-Auths', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.newPreAuthTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Banner text={error} variant="error" style={styles.mb} /> : null}

        <Card style={styles.policyCard}>
          <Text style={styles.kicker}>Active HMO Policy</Text>
          <Text style={styles.hmoName}>{activePolicy?.provider}</Text>
          <Text style={styles.hmoSub}>{activePolicy?.policyNo} · {activePolicy?.planTier} ({coPayPct}% Co-Pay)</Text>
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
        <Button label="Request Instant Approval" fullWidth onPress={handleSubmit} />
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
