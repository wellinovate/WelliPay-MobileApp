import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components';
import { colors, fontSize, spacing, radius, shadow } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function WelcomeScreen({ navigation }: any) {
  const { lang, setLang } = useStore();
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const handleLangChange = (l: 'en' | 'pcm') => {
    Haptics.selectionAsync();
    setLang(l);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Logo Hero */}
        <View style={styles.heroBox}>
          <Image
            source={require('../../../assets/wellipay-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Value Prop Intro */}
        <Text style={styles.introBody}>{t.welcomeBody}</Text>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Text style={styles.featureIcon}>🛡️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.featureTitle}>Dual-Payer & HMO Adjudication</Text>
              <Text style={styles.featureDesc}>
                HMO covers their share first; Patient Self-Pay (PSP) is clearly itemized with zero surprise costs.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.featureIcon}>⚡</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.featureTitle}>WelliPass™ Discharge Clearance</Text>
              <Text style={styles.featureDesc}>
                Skip the 6-hour ward delay. 4-step real-time departmental audit generates a verified Green QR Gate Pass.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Text style={styles.featureIcon}>🌍</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.featureTitle}>FamilyPay™ Diaspora Links</Text>
              <Text style={styles.featureDesc}>
                Let family and relatives abroad contribute directly in USD, GBP, EUR, or Naira via one-click web links.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.featureIcon}>📶</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.featureTitle}>Offline USSD Protocol (*347#)</Text>
              <Text style={styles.featureDesc}>
                Zero-data banking fallback and offline emergency vouchers for hospital basement dead zones.
              </Text>
            </View>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.langWrapper}>
          <Text style={styles.langKicker}>Choose Language / Choose Langwej:</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              onPress={() => handleLangChange('en')}
              style={[styles.langBtn, lang === 'en' && styles.langActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.langLabel, lang === 'en' && styles.langLabelActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLangChange('pcm')}
              style={[styles.langBtn, lang === 'pcm' && styles.langActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.langLabel, lang === 'pcm' && styles.langLabelActive]}>Nigerian Pidgin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary CTA */}
        <Button
          label={t.getStarted}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Phone');
          }}
          variant="primary"
          fullWidth
          style={styles.cta}
        />

        <Text style={styles.terms}>{t.terms}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  heroBox: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  logoImage: {
    width: 280,
    height: 140,
  },
  introBody: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.xs,
    paddingVertical: spacing.xs,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  langWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  langKicker: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  langLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  langLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  cta: {
    marginBottom: spacing.sm,
  },
  terms: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
