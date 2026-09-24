import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Toggle, Card, Divider } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function PrivacyScreen({ navigation }: any) {
  const store = useStore();
  const { lang, hmoShare, marketing } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.privacyTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.rowTitle}>{t.hmoShareLabel}</Text>
              <Text style={styles.rowSub}>{t.hmoShareSub}</Text>
            </View>
            <Toggle value={hmoShare} onPress={() => store.togglePref('hmoShare')} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.rowTitle}>{t.marketingLabel}</Text>
              <Text style={styles.rowSub}>{t.marketingSub}</Text>
            </View>
            <Toggle value={marketing} onPress={() => store.togglePref('marketing')} />
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
  rowSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
});
