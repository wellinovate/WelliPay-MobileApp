import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function LanguageScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const languages = [
    { key: 'en', title: 'English', flag: '🇬🇧', subtitle: 'Standard English' },
    { key: 'pcm', title: 'Nigerian Pidgin', flag: '🇳🇬', subtitle: 'Naija Pidgin English' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.languageTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {languages.map(item => {
          const isSelected = lang === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.langCard, isSelected && styles.langCardActive]}
              onPress={() => store.setLang(item.key as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.langTitle}>{item.title}</Text>
                <Text style={styles.langSub}>{item.subtitle}</Text>
              </View>
              {isSelected && (
                <View style={styles.check}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  langCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  flag: { fontSize: 28, marginRight: spacing.md },
  langInfo: { flex: 1 },
  langTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  langSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
});
