import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking, Platform } from 'react-native';
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





type NavProp = NativeStackNavigationProp<RootStackParamList, 'UssdOffline'>;
type RouteProps = RouteProp<RootStackParamList, 'UssdOffline'>;

export const UssdOfflineScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, ussdBanks, offlineVouchers, generateOfflineVoucher, bills } = useStore();
  const t = COPY[lang] || COPY.en;

  const billId = route.params?.billId;
  const activeBill = bills.find(b => b.id === billId) || bills[0];
  const activeVoucher = offlineVouchers.find(v => !billId || v.billId === billId) || offlineVouchers[0];

  const billCode = activeBill ? activeBill.billNo : 'BL-4019';
  const billAmount = activeBill ? activeBill.amountDue : 12000;

  const [selectedBank, setSelectedBank] = useState<string>('wellipay');

  const getDialString = (prefix: string) => {
    if (prefix.includes('347')) {
      return '*347*88*' + billCode.replace(/[^0-9]/g, '') + '#';
    }
    return prefix + billAmount + '*' + billCode.replace(/[^0-9]/g, '') + '#';
  };

  const handleDial = async (dialStr: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Linking.openURL('tel:' + encodeURIComponent(dialStr));
    } catch {
      Alert.alert('USSD String', 'Dial on your phone: ' + dialStr);
    }
  };

  const handleCopyUssd = async (dialStr: string) => {
    try {
      await Clipboard.setStringAsync(dialStr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied!', 'USSD code ' + dialStr + ' copied to clipboard. Dial it from your phone dialer.');
    } catch {
      Alert.alert('Copied', dialStr);
    }
  };

  const handleCreateVoucher = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const v = generateOfflineVoucher(activeBill?.id || 'b1', billAmount);
    Alert.alert('Emergency Voucher Created ✓', 'Offline token ' + v.voucherToken + ' generated. Valid for 24 hours without cellular data.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.offlineUssdTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Low-Bandwidth Mode Banner */}
        <View style={styles.networkBanner}>
          <View style={styles.signalDot} />
          <View style={{ flex: 1, marginLeft: spacing.xs }}>
            <Text style={styles.networkTitle}>Zero-Data / Low Network Protocol</Text>
            <Text style={styles.networkSub}>
              Authorize hospital payments instantly in hospital basements or telecom dead zones with no data connection.
            </Text>
          </View>
        </View>

        {/* WelliPay Direct Telco Channel Card */}
        <Card style={styles.heroCard}>
          <View style={styles.telcoBadgeRow}>
            <View style={styles.telcoBadge}>
              <Text style={styles.telcoBadgeText}>FREE ON MTN, AIRTEL, GLO & 9MOBILE</Text>
            </View>
            <Text style={styles.billTag}>{billCode}</Text>
          </View>

          <Text style={styles.heroTitle}>WelliPay Direct Shortcode</Text>
          <Text style={styles.heroSub}>Works on smartphone dialers and basic feature phones with zero internet.</Text>

          <View style={styles.ussdDisplayBox}>
            <Text style={styles.ussdCodeBig}>{getDialString('*347*88*')}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              label="Copy Code"
              variant="secondary"
              onPress={() => handleCopyUssd(getDialString('*347*88*'))}
              style={{ flex: 1, marginRight: spacing.xs }}
            />
            <Button
              label={t.dialUssdString}
              variant="primary"
              onPress={() => handleDial(getDialString('*347*88*'))}
              style={{ flex: 1, marginLeft: spacing.xs }}
            />
          </View>
        </Card>

        {/* Bank USSD Directory */}
        <Text style={styles.sectionHeading}>Bank USSD Quick Selectors</Text>
        <Text style={styles.sectionSub}>Select your bank to generate the pre-filled USSD payment string:</Text>

        <Card style={styles.bankListCard}>
          {ussdBanks.map((bank, i) => {
            const dialStr = getDialString(bank.ussdPrefix);
            const isSelected = selectedBank === bank.bankCode;
            return (
              <TouchableOpacity
                key={bank.bankCode || i}
                style={[styles.bankRow, isSelected && styles.bankRowActive]}
                onPress={() => {
                  setSelectedBank(bank.bankCode);
                  Haptics.selectionAsync();
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankName}>{bank.bankName}</Text>
                  <Text style={styles.bankUssd}>{dialStr}</Text>
                </View>
                <TouchableOpacity
                  style={styles.dialBtnSmall}
                  onPress={() => handleDial(dialStr)}
                >
                  <Text style={styles.dialBtnText}>Dial</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Offline Emergency Voucher Card */}
        <Text style={styles.sectionHeading}>{t.offlineVoucherLabel}</Text>
        <Text style={styles.sectionSub}>Cryptographic authorization token stored securely on your device:</Text>

        {activeVoucher ? (
          <Card style={styles.voucherCard}>
            <View style={styles.voucherTop}>
              <View>
                <Text style={styles.voucherKicker}>Encrypted Hospital Token</Text>
                <Text style={styles.voucherToken}>{activeVoucher.voucherToken}</Text>
              </View>
              <View style={styles.voucherVerifiedBadge}>
                <Text style={styles.voucherVerifiedText}>Offline Valid</Text>
              </View>
            </View>

            <Divider style={{ marginVertical: spacing.xs }} />

            <View style={styles.voucherDetailRow}>
              <Text style={styles.voucherMeta}>Patient: {activeVoucher.patientName}</Text>
              <Text style={styles.voucherMeta}>Expires: {activeVoucher.expiresAt}</Text>
            </View>
            <View style={styles.voucherDetailRow}>
              <Text style={styles.voucherMeta}>Hospital: {activeVoucher.hospitalName}</Text>
              <Text style={styles.voucherAmount}>{NAIRA(activeVoucher.amount)}</Text>
            </View>

            <View style={styles.offlineQrBox}>
              <Text style={styles.offlineQrPayload}>{activeVoucher.qrPayload}</Text>
              <Text style={styles.offlineQrHelp}>Present to hospital billing clerk for offline POS verification</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.voucherCard}>
            <Text style={styles.noVoucherText}>No offline emergency voucher generated for this bill.</Text>
            <Button
              label="+ Generate Emergency Voucher"
              variant="secondary"
              onPress={handleCreateVoucher}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        <Button
          label="+ Generate New Offline Voucher"
          variant="primary"
          onPress={handleCreateVoucher}
          style={{ marginVertical: spacing.md }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
  networkTitle: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  networkSub: { fontSize: 11, color: '#92400E', marginTop: 2, lineHeight: 15 },
  heroCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  telcoBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  telcoBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  telcoBadgeText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  billTag: { fontSize: 11, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textTertiary },
  heroTitle: { fontSize: 18, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: spacing.xs },
  heroSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ussdDisplayBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  ussdCodeBig: { fontSize: 22, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), fontWeight: '700', color: colors.accent },
  buttonRow: { flexDirection: 'row', marginTop: 4 },
  sectionHeading: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: spacing.xs },
  sectionSub: { fontSize: 12, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sm },
  bankListCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
    overflow: 'hidden',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankRowActive: { backgroundColor: colors.surfaceAlt },
  bankName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  bankUssd: { fontSize: 12, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.accent, marginTop: 2 },
  dialBtnSmall: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  dialBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  voucherCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  voucherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  voucherKicker: { fontSize: 11, color: colors.textTertiary },
  voucherToken: { fontSize: 14, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  voucherVerifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  voucherVerifiedText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  voucherDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  voucherMeta: { fontSize: 11, color: colors.textSecondary },
  voucherAmount: { fontSize: 14, fontFamily: 'SourceSerif4_700Bold', color: colors.accent },
  offlineQrBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  offlineQrPayload: { fontSize: 10, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textSecondary },
  offlineQrHelp: { fontSize: 10, color: colors.textTertiary, marginTop: 4, textAlign: 'center' },
  noVoucherText: { fontSize: 12, color: colors.textTertiary, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.sm },
});
