import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Divider } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function LegalScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const links = [
    { title: t.termsLink, detail: 'WelliPay Terms of Service govern your access to payment services, wallet operations, and dispute resolutions under Nigerian law.' },
    { title: t.privacyLink, detail: 'WelliPay Privacy Policy details data compliance with NDPR, HMO data encryption, and medical billing segregation.' },
    { title: t.refundLink, detail: 'Refunds for overpaid or cancelled facility charges are credited to your WelliPay wallet within 24 to 48 hours.' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.legalTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {links.map((link, i) => (
            <TouchableOpacity
              key={i}
              style={styles.row}
              onPress={() => Alert.alert(link.title, link.detail)}
              activeOpacity={0.7}
            >
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkTitle: { fontSize: fontSize.base, color: colors.textPrimary },
  chevron: { fontSize: fontSize.xl, color: colors.textTertiary },
});
