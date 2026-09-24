import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, ProgressBar, Divider, Chip } from '../../components';






type NavProp = NativeStackNavigationProp<RootStackParamList, 'FamilyPayHub'>;
type RouteProps = RouteProp<RootStackParamList, 'FamilyPayHub'>;

export const FamilyPayHubScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, familyPayLinks, contributeToFamilyPool, createFamilyPayLink } = useStore();
  const t = COPY[lang] || COPY.en;

  const billId = route.params?.billId;
  const activeLink = familyPayLinks.find(l => !billId || l.billId === billId) || familyPayLinks[0];

  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD'>('NGN');
  const [modalVisible, setModalVisible] = useState(false);
  const [contribName, setContribName] = useState('');
  const [contribRelation, setContribRelation] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribMessage, setContribMessage] = useState('');

  if (!activeLink) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t.familyPayTitle} onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No active FamilyPay link found.</Text>
          <Button
            label="Create FamilyPay Link"
            onPress={() => {
              createFamilyPayLink(billId || 'b1');
            }}
          />
        </View>
      </View>
    );
  }

  const poolProgressPercent = Math.min(100, Math.round((activeLink.poolCollectedNgn / activeLink.poolTargetNgn) * 100));
  const remainingNgn = Math.max(0, activeLink.poolTargetNgn - activeLink.poolCollectedNgn);

  const getForeignEstimate = (ngn: number) => {
    const rate = activeLink.currencyRates[selectedCurrency as 'USD' | 'GBP' | 'EUR' | 'CAD'] || 1;
    if (selectedCurrency === 'NGN') return NAIRA(0);
    const symbol = selectedCurrency === 'USD' ? '$' : selectedCurrency === 'GBP' ? '£' : selectedCurrency === 'EUR' ? '€' : 'C$';
    const val = (ngn / rate).toFixed(2);
    return symbol + val + ' (' + selectedCurrency + ')';
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(activeLink.webLinkUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Link Copied!', 'The secure FamilyPay web payment link is copied to your clipboard.');
    } catch {
      Alert.alert('Copied', activeLink.webLinkUrl);
    }
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: 'WelliPay Care Contribution: Please help support ' + activeLink.patientName + "'s healthcare at " + activeLink.hospitalName + '. You can pay directly in NGN, USD, GBP, or EUR via this secure link: ' + activeLink.webLinkUrl + ' (Shortcode: ' + activeLink.shortCode + ')',
      });
    } catch (e) {
      // dismissed
    }
  };

  const handleAddContribution = () => {
    const amountVal = parseFloat(contribAmount.replace(/[^0-9.]/g, ''));
    if (!contribName.trim() || isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Error', 'Please enter contributor name and a valid amount.');
      return;
    }

    let ngnAmount = amountVal;
    if (selectedCurrency !== 'NGN') {
      const rate = activeLink.currencyRates[selectedCurrency as 'USD' | 'GBP' | 'EUR' | 'CAD'] || 1;
      ngnAmount = Math.round(amountVal * rate);
    }

    contributeToFamilyPool(activeLink.id, {
      name: contribName.trim(),
      relation: contribRelation.trim() || 'Family Member',
      amountNgn: ngnAmount,
      currency: selectedCurrency,
      foreignAmount: amountVal,
      message: contribMessage.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    setContribName('');
    setContribRelation('');
    setContribAmount('');
    setContribMessage('');
    Alert.alert('Contribution Added!', NAIRA(0) + ' has been credited toward the bill.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.familyPayTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Kicker Card */}
        <Card style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveText}>DIASPORA & SOCIAL SPONSOR HUB</Text>
            </View>
            <Text style={styles.shortCode}>{activeLink.shortCode}</Text>
          </View>

          <Text style={styles.heroPatient}>{activeLink.patientName}</Text>
          <Text style={styles.heroService}>{activeLink.serviceDescription}</Text>
          <Text style={styles.heroHospital}>{activeLink.hospitalName}</Text>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Group Pool Progress */}
          <View style={styles.poolHeaderRow}>
            <Text style={styles.poolLabel}>{t.groupPoolTitle}</Text>
            <Text style={styles.poolPercent}>{poolProgressPercent}% Funded</Text>
          </View>
          <ProgressBar value={activeLink.poolCollectedNgn} max={activeLink.poolTargetNgn} color={colors.accent} />

          <View style={styles.poolStatRow}>
            <View>
              <Text style={styles.statKicker}>Collected</Text>
              <Text style={styles.statValCol}>{NAIRA(activeLink.poolCollectedNgn)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statKicker}>Remaining Target</Text>
              <Text style={styles.statValTar}>{NAIRA(remainingNgn)}</Text>
            </View>
          </View>
        </Card>

        {/* Shareable Web Link Card */}
        <Card style={styles.linkCard}>
          <Text style={styles.sectionHeading}>{t.shareWebLink}</Text>
          <Text style={styles.sectionSub}>
            Family members and overseas sponsors can open this link in any browser to pay securely with international cards or local transfer.
          </Text>

          <View style={styles.linkDisplayBox}>
            <Text style={styles.linkUrl} numberOfLines={1}>{activeLink.webLinkUrl}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              label={t.copyPaymentLink}
              variant="secondary"
              onPress={handleCopyLink}
              style={{ flex: 1, marginRight: spacing.xs }}
            />
            <Button
              label={t.whatsappShareText}
              variant="primary"
              onPress={handleShare}
              style={{ flex: 1, marginLeft: spacing.xs }}
            />
          </View>
        </Card>

        {/* Multi-Currency Rates & Conversions */}
        <Card style={styles.ratesCard}>
          <Text style={styles.sectionHeading}>Diaspora Multi-Currency Acceptance</Text>
          <Text style={styles.sectionSub}>Select currency to preview real-time conversion for overseas sponsors:</Text>

          <View style={styles.currencyChips}>
            {(['NGN', 'USD', 'GBP', 'EUR', 'CAD'] as const).map(curr => (
              <TouchableOpacity
                key={curr}
                onPress={() => {
                  setSelectedCurrency(curr);
                  Haptics.selectionAsync();
                }}
                style={[styles.currChip, selectedCurrency === curr && styles.currChipActive]}
              >
                <Text style={[styles.currChipText, selectedCurrency === curr && styles.currChipTextActive]}>
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.conversionBox}>
            <Text style={styles.conversionKicker}>Remaining Responsibility in {selectedCurrency}:</Text>
            <Text style={styles.conversionAmount}>{getForeignEstimate(remainingNgn)}</Text>
            {selectedCurrency !== 'NGN' && (
              <Text style={styles.conversionRate}>
                Benchmark Rate: 1 {selectedCurrency} ≈ {NAIRA(activeLink.currencyRates[selectedCurrency as "USD" | "GBP" | "EUR" | "CAD"] || 1)}
              </Text>
            )}
          </View>
        </Card>

        {/* Contributors List */}
        <Card style={styles.contribCard}>
          <View style={styles.contribHeader}>
            <Text style={styles.sectionHeading}>Family Care Contributors ({activeLink.contributors.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.addContribLink}>{t.addContribution}</Text>
            </TouchableOpacity>
          </View>

          {activeLink.contributors.length === 0 ? (
            <Text style={styles.noContribText}>No contributions logged yet. Share the link above!</Text>
          ) : (
            activeLink.contributors.map((c, i) => (
              <View key={c.id || i} style={styles.contribItem}>
                <View style={styles.contribTop}>
                  <Text style={styles.contribName}>{c.name}</Text>
                  <Text style={styles.contribAmount}>+{NAIRA(c.amountNgn)}</Text>
                </View>
                <View style={styles.contribSubRow}>
                  <Text style={styles.contribRelation}>{c.relation}</Text>
                  {c.currency !== 'NGN' && (
                    <Text style={styles.contribForeign}>({c.currency} {c.foreignAmount})</Text>
                  )}
                  <Text style={styles.contribDate}>{c.date}</Text>
                </View>
                {c.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>“{c.message}”</Text>
                  </View>
                ) : null}
                {i < activeLink.contributors.length - 1 && <Divider style={{ marginVertical: spacing.xs }} />}
              </View>
            ))
          )}
        </Card>

        {/* Simulate Add Contribution CTA */}
        <Button
          label={t.addContribution}
          variant="primary"
          onPress={() => setModalVisible(true)}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        />
      </ScrollView>

      {/* Add Contribution Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Family Contribution</Text>
            <Text style={styles.modalSub}>Simulate or log a direct payment received from family in Nigeria or diaspora:</Text>

            <Text style={styles.inputLabel}>Sponsor Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dr. Kelechi Okafor (Brother)"
              value={contribName}
              onChangeText={setContribName}
            />

            <Text style={styles.inputLabel}>Relationship & Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Brother (London, UK)"
              value={contribRelation}
              onChangeText={setContribRelation}
            />

            <Text style={styles.inputLabel}>Amount ({selectedCurrency})</Text>
            <TextInput
              style={styles.input}
              placeholder={selectedCurrency === 'NGN' ? 'e.g. 20000' : 'e.g. 50'}
              keyboardType="numeric"
              value={contribAmount}
              onChangeText={setContribAmount}
            />

            <Text style={styles.inputLabel}>Message of Support (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="e.g. Praying for your fast recovery!"
              multiline
              value={contribMessage}
              onChangeText={setContribMessage}
            />

            <View style={styles.modalBtnRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                label="Submit"
                variant="primary"
                onPress={handleAddContribution}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  heroCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 0.5 },
  shortCode: { fontSize: 11, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textTertiary },
  heroPatient: { fontSize: 20, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 4 },
  heroService: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  heroHospital: { fontSize: 12, color: colors.accent, marginTop: 2, fontWeight: '600' },
  poolHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  poolLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  poolPercent: { fontSize: 13, fontWeight: '700', color: colors.accent },
  poolStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  statKicker: { fontSize: 11, color: colors.textTertiary },
  statValCol: { fontSize: 16, fontFamily: 'SourceSerif4_700Bold', color: colors.accent, marginTop: 2 },
  statValTar: { fontSize: 16, fontFamily: 'SourceSerif4_700Bold', color: colors.danger, marginTop: 2 },
  linkCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  sectionHeading: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  sectionSub: { fontSize: 12, color: colors.textTertiary, marginTop: 4, lineHeight: 17, marginBottom: spacing.sm },
  linkDisplayBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  linkUrl: { fontSize: 12, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textPrimary },
  buttonRow: { flexDirection: 'row', marginTop: 4 },
  ratesCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  currencyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.sm },
  currChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  currChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  currChipTextActive: { color: colors.surface },
  conversionBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginTop: 4,
  },
  conversionKicker: { fontSize: 11, color: colors.textTertiary },
  conversionAmount: { fontSize: 18, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 2 },
  conversionRate: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
  contribCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  contribHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addContribLink: { fontSize: 12, fontWeight: '700', color: colors.accent },
  noContribText: { fontSize: 12, color: colors.textTertiary, fontStyle: 'italic', paddingVertical: spacing.sm },
  contribItem: { paddingVertical: spacing.xs },
  contribTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contribName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  contribAmount: { fontSize: 14, fontFamily: 'SourceSerif4_700Bold', color: colors.accent },
  contribSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 },
  contribRelation: { fontSize: 11, color: colors.textSecondary },
  contribForeign: { fontSize: 11, color: colors.textTertiary },
  contribDate: { fontSize: 10, color: colors.textTertiary, marginLeft: 'auto' },
  messageBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  messageText: { fontSize: 11, fontStyle: 'italic', color: colors.textSecondary },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textTertiary, marginBottom: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.md },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, ...shadow.md },
  modalTitle: { fontSize: 18, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  modalSub: { fontSize: 12, color: colors.textTertiary, marginTop: 4, marginBottom: spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  modalBtnRow: { flexDirection: 'row', marginTop: spacing.md },
});
