import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Card, Chip, Divider } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function FacilityDirectoryScreen({ navigation }: any) {
  const store = useStore();
  const { lang, facilities } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('All');

  const filtered = facilities.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.address.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === 'All' || f.state === filterState;
    return matchSearch && matchState;
  });

  const handleCopyAccount = async (f: any) => {
    await Clipboard.setStringAsync(f.accountNo);
    Alert.alert(
      'Bank Details Copied',
      `${f.name} direct settlement account (${f.bankName} - ${f.accountNo}) copied to clipboard.`
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.facilitiesTitle} onBack={() => navigation.goBack()} />

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchFacilities}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.stateChips}>
        {['All', 'Lagos', 'Abuja'].map(st => (
          <Chip
            key={st}
            label={st}
            active={filterState === st}
            onPress={() => setFilterState(st)}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {filtered.map(fac => (
          <Card key={fac.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.facilityName}>{fac.name}</Text>
                <Text style={styles.facilityAddress}>{fac.address}</Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{fac.category}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Direct Bank Settlement Routing */}
            <TouchableOpacity
              style={styles.settlementBox}
              onPress={() => handleCopyAccount(fac)}
              activeOpacity={0.7}
            >
              <View style={styles.settleRow}>
                <Text style={styles.settleTitle}>Direct Bank Settlement (CBN Verified)</Text>
                <Text style={styles.copyBadge}>Tap to copy</Text>
              </View>
              <Text style={styles.bankDetail}>{fac.bankName} · {fac.accountNo}</Text>
              <Text style={styles.accountName}>{fac.accountName}</Text>
            </TouchableOpacity>

            {/* Accepted HMOs */}
            <Text style={styles.hmoLabel}>Accepted Insurance Plans:</Text>
            <View style={styles.hmoPills}>
              {fac.acceptedHmos.map(h => (
                <View key={h} style={styles.hmoPill}>
                  <Text style={styles.hmoPillText}>{h}</Text>
                </View>
              ))}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.cardFooter}>
              <Text style={styles.phoneText}>📞 {fac.phone}</Text>
              <Text style={styles.emergencyText}>🚨 Emergency: {fac.emergency}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  stateChips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  facilityName: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  facilityAddress: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  catBadge: { backgroundColor: colors.accentLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  catText: { fontSize: fontSize.xs, color: colors.accentDark, fontWeight: '600' },
  divider: { marginVertical: spacing.sm },
  settlementBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  settleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settleTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  copyBadge: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
  bankDetail: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accentDark, marginTop: 4 },
  accountName: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  hmoLabel: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: '600', marginTop: 4, marginBottom: 4 },
  hmoPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hmoPill: { backgroundColor: '#EBF5FB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs },
  hmoPillText: { fontSize: 10, color: '#1B4F72', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneText: { fontSize: fontSize.xs, color: colors.textSecondary },
  emergencyText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
});
