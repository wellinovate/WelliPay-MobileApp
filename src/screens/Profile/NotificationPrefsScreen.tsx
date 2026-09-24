import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Toggle, Card } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function NotificationPrefsScreen({ navigation }: any) {
  const store = useStore();
  const { lang, notifBills, notifReceipts, notifPromo } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.notifprefsTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.rowTitle}>{t.billAlertsLabel}</Text>
            <Toggle value={notifBills} onPress={() => store.togglePref('notifBills')} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.rowTitle}>{t.receiptsLabel}</Text>
            <Toggle value={notifReceipts} onPress={() => store.togglePref('notifReceipts')} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.rowTitle}>{t.promoLabel}</Text>
            <Toggle value={notifPromo} onPress={() => store.togglePref('notifPromo')} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
});
