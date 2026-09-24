import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Chip, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { uid } from '../../utils/helpers';

export default function AddHmoScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const providers = [
    'Hygeia HMO',
    'Reliance HMO',
    'AXA Mansard Health',
    'Leadway Health',
    'Avon HMO',
    'Bastion HMO',
  ];

  const planTiers = ['Standard', 'Silver', 'Gold', 'Executive'];
  const coPayOptions = [0, 10, 15, 20];

  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [policyNo, setPolicyNo] = useState('');
  const [enrolleeName, setEnrolleeName] = useState('Jay Umar');
  const [selectedTier, setSelectedTier] = useState('Silver');
  const [selectedCoPay, setSelectedCoPay] = useState(10);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!policyNo.trim()) {
      setError('Please enter your HMO Policy or Enrollee number.');
      return;
    }

    const newPolicy = {
      id: 'hmo_' + uid().toLowerCase(),
      provider: selectedProvider,
      policyNo: policyNo.trim().toUpperCase(),
      enrolleeName: enrolleeName.trim(),
      planTier: `${selectedTier} Care`,
      coPayPercent: selectedCoPay,
      annualLimit: selectedTier === 'Executive' ? 3000000 : selectedTier === 'Gold' ? 2000000 : 1200000,
      usedAmount: 0,
      status: 'active' as const,
      expiryDate: '31 Dec 2026',
      coveredPersons: ['self'],
    };

    store.addHmoPolicy(newPolicy);
    Alert.alert('HMO Verified', `${selectedProvider} policy ${policyNo} has been linked to your account.`);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.addHmoTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Banner text={error} variant="error" style={styles.mb} /> : null}

        <View style={styles.field}>
          <Text style={styles.label}>{t.providerLabel}</Text>
          <View style={styles.chipsWrap}>
            {providers.map(p => (
              <Chip
                key={p}
                label={p}
                active={selectedProvider === p}
                onPress={() => setSelectedProvider(p)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t.policyNoLabel}</Text>
          <TextInput
            style={styles.input}
            value={policyNo}
            onChangeText={(txt) => {
              setPolicyNo(txt);
              if (error) setError('');
            }}
            placeholder="e.g. HYG-992014-01"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Enrollee Full Name</Text>
          <TextInput
            style={styles.input}
            value={enrolleeName}
            onChangeText={setEnrolleeName}
            placeholder="As written on your HMO card"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t.planTierLabel}</Text>
          <View style={styles.chipsWrap}>
            {planTiers.map(tier => (
              <Chip
                key={tier}
                label={tier}
                active={selectedTier === tier}
                onPress={() => setSelectedTier(tier)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t.coPayLabel}</Text>
          <View style={styles.chipsWrap}>
            {coPayOptions.map(cp => (
              <Chip
                key={cp}
                label={`${cp}% Co-Pay`}
                active={selectedCoPay === cp}
                onPress={() => setSelectedCoPay(cp)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Verify & Link HMO" fullWidth onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  mb: { marginBottom: spacing.md },
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
