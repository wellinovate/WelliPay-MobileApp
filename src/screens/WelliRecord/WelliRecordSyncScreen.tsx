import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Card, Button, Toggle, Divider, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function WelliRecordSyncScreen({ navigation }: any) {
  const store = useStore();
  const { lang, facilities, lastSyncTime, isSyncing } = store;
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const handleSyncAll = async () => {
    await store.syncWelliRecord();
    Alert.alert('Sync Complete', 'All partner hospital ledgers and pending bills have been updated.');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.welliRecordSyncTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Sync status card */}
        <Card style={styles.syncCard}>
          <View style={styles.syncTop}>
            <View>
              <Text style={styles.syncLabel}>EMR Cloud Synchronization</Text>
              <Text style={styles.syncTime}>Last synced: {lastSyncTime}</Text>
            </View>
            <View style={styles.pulseDot} />
          </View>

          <Button
            label={isSyncing ? t.syncingText : t.syncNowBtn}
            variant="secondary"
            fullWidth
            style={styles.syncBtn}
            onPress={handleSyncAll}
          />
        </Card>

        <Banner
          text="WelliRecord automatically imports your medical bills and lab invoices. Clinical consultation notes and diagnostic records remain strictly confidential."
          variant="info"
          style={styles.banner}
        />

        <Text style={styles.sectionTitle}>Connected Facilities ({facilities.length})</Text>

        {facilities.map(fac => (
          <Card key={fac.id} style={styles.facCard}>
            <View style={styles.facRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.facName}>{fac.name}</Text>
                <Text style={styles.facCat}>{fac.category} · {fac.state}</Text>
                <Text style={styles.facSync}>Last pulled: {fac.lastSyncDate}</Text>
              </View>
              <Toggle
                value={fac.welliRecordIntegrated}
                onPress={() => store.toggleFacilityLink(fac.id)}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.billsInfo}>
              <Text style={styles.billsCount}>
                {fac.activeBillsCount > 0 ? `${fac.activeBillsCount} active bills in WelliPay` : 'No outstanding charges'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('FacilityDirectory')}>
                <Text style={styles.viewLink}>View Hospital Info ›</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  syncCard: { marginBottom: spacing.md, backgroundColor: colors.surface, borderColor: colors.border },
  syncTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  syncTime: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2ECC71' },
  syncBtn: { marginTop: spacing.md },
  banner: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  facCard: { marginBottom: spacing.md },
  facRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facName: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  facCat: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  facSync: { fontSize: fontSize.xs, color: colors.accent, marginTop: 4 },
  divider: { marginVertical: spacing.sm },
  billsInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billsCount: { fontSize: fontSize.xs, color: colors.textSecondary },
  viewLink: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
});
