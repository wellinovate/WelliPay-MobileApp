import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Card, Divider } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { FAQS } from '../../state/seed';

export default function HelpScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.helpTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {FAQS.map((faq, i) => (
          <Card key={i} style={styles.faqCard}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </Card>
        ))}

        <TouchableOpacity
          style={styles.contactLink}
          onPress={() => navigation.navigate('Contact')}
          activeOpacity={0.7}
        >
          <Text style={styles.contactText}>Need more help? Contact our team ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  faqCard: { marginBottom: spacing.md },
  faqQ: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  faqA: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  contactLink: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  contactText: { fontSize: fontSize.base, color: colors.accent, fontWeight: '600' },
});
