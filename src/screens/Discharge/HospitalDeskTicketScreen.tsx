import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow, fontSize } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, Divider } from '../../components';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'HospitalDeskTicket'>;
type RouteProps = RouteProp<RootStackParamList, 'HospitalDeskTicket'>;

export const HospitalDeskTicketScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, welliPasses } = useStore();
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const [nowServing, setNowServing] = useState(12);
  const [bedsideRequested, setBedsideRequested] = useState(false);
  const [coPaySettled, setCoPaySettled] = useState(false);
  const [thermalModalVisible, setThermalModalVisible] = useState(false);

  const patientToken = 14;
  const patientsAhead = Math.max(0, patientToken - nowServing);
  const estimatedWaitMins = patientsAhead * 3;

  const billId = route.params?.billId || 'b2';
  const grossTariff = 75000;
  const hmoCoverage = 70350;
  const netCoPay = coPaySettled ? 0 : 4650;

  const handleRefreshQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Queue Refreshed', `Now serving Token #A-${nowServing}. You are ${patientsAhead} patient${patientsAhead === 1 ? '' : 's'} away.`);
  };

  const handleToggleBedside = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBedsideRequested(prev => !prev);
    if (!bedsideRequested) {
      Alert.alert(
        'Bedside Cashier Dispatched ✓',
        'Hospital Billing Officer Sister Chinyere Eze has received your request. An attendant with a mobile POS terminal will visit Surgical Ward 3B, Bed 12 shortly.'
      );
    }
  };

  const handlePayWallet = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCoPaySettled(true);
    Alert.alert(
      'Co-Pay Settled via Wallet ✓',
      `Payment of ₦4,650 confirmed. Your hospital clearance is 100% complete! Your WelliPass Digital Gate Pass has been issued.`,
      [
        { text: 'View WelliPass', onPress: () => navigation.navigate('WelliPass', { billId }) },
        { text: 'Done', style: 'cancel' }
      ]
    );
  };

  const handleCallCashier = () => {
    Haptics.selectionAsync();
    Linking.openURL('tel:+2348031234567').catch(() => {
      Alert.alert('Phone Call', 'Call Cashier Station Room 102 at +234 803 123 4567');
    });
  };

  const handleWhatsAppCashier = () => {
    Haptics.selectionAsync();
    const msg = encodeURIComponent(`Hello Sister Chinyere, I am Jay Umar (Token #A-14) in Surgical Ward 3B Bed 12 regarding my co-pay settlement.`);
    Linking.openURL(`whatsapp://send?phone=2348031234567&text=${msg}`).catch(() => {
      Alert.alert('WhatsApp', 'Sister Chinyere Eze: +234 803 123 4567');
    });
  };

  const handleSharePaperTicket = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `🏥 WELLIPAY HOSPITAL DESK TICKET\nFacility: Redeemer Specialist Clinic (Room 102)\nQueue Token: #A-14\nPatient: Jay Umar (LAG-4401)\nWard: Surgical Ward 3B, Bed 12\nStatus: ${coPaySettled ? 'PAID & CLEARED' : 'Co-Pay Due ₦4,650'}\nVerify: https://wellipay.ng/desk/verify?token=A14`,
      });
    } catch {
      // dismissed
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Hospital Desk Ticket"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('ProviderDesk')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 18 }}>🏢</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl, paddingLeft: Math.max(insets.left, spacing.md), paddingRight: Math.max(insets.right, spacing.md) }]} showsVerticalScrollIndicator={false}>
        {/* Scalloped Physical Queue Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketFacility}>Redeemer Specialist Clinic</Text>
              <Text style={styles.ticketCounter}>Cashier Station · Room 102</Text>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>OFFICIAL TICKET</Text>
            </View>
          </View>

          {/* Perforated Divider */}
          <View style={styles.perforatedLine}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashedDivider} />
            <View style={styles.cutoutRight} />
          </View>

          {/* Huge Token Section */}
          <View style={styles.tokenSection}>
            <Text style={styles.tokenLabel}>YOUR QUEUE TOKEN</Text>
            <Text style={styles.tokenNumber}>#A-14</Text>
            <Text style={styles.tokenPatient}>Jay Umar · MRN: LAG-4401</Text>
            <Text style={styles.tokenWard}>Surgical Ward 3B · Bed 12</Text>
          </View>

          {/* Live Serving Banner */}
          <View style={styles.liveServingBanner}>
            <View style={styles.livePulseRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveServingText}>NOW SERVING: #A-{nowServing}</Text>
            </View>
            <Text style={styles.liveWaitEstimate}>
              ⏱ {patientsAhead === 0 ? 'It is your turn! Please step to Room 102' : `${patientsAhead} Patients Ahead · ~${estimatedWaitMins} mins wait`}
            </Text>
          </View>

          {/* Footer Meta */}
          <View style={styles.ticketFooter}>
            <Text style={styles.ticketMetaText}>Issued Today, 10:15 AM · Shift #SFT-04</Text>
            <TouchableOpacity onPress={handleRefreshQueue} activeOpacity={0.7}>
              <Text style={styles.refreshLink}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bedside Service Request for Inpatients */}
        <Card style={styles.bedsideCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: 24 }}>🛏️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bedsideTitle}>Bedside Service Available</Text>
              <Text style={styles.bedsideSubtitle}>
                Too weak or elderly to walk down to Room 102? An attendant will visit Ward 3B with a mobile card POS.
              </Text>
            </View>
          </View>
          <Button
            label={bedsideRequested ? '✓ Bedside Attendant Dispatched' : 'Request Bedside Cashier Visit'}
            variant={bedsideRequested ? 'secondary' : 'primary'}
            onPress={handleToggleBedside}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {/* 4-Step Discharge Progress Audit */}
        <Text style={styles.sectionTitle}>Discharge Milestone Tracker</Text>
        <Card style={styles.milestoneCard}>
          {/* Step 1: Doctor */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneIconBox, styles.milestoneDone]}>
              <Text style={styles.milestoneCheck}>✓</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.milestoneName}>1. Physician Order</Text>
              <Text style={styles.milestoneDetail}>Dr. F. Adeleke (Consultant Surgeon) certified discharge</Text>
            </View>
            <Text style={styles.milestoneTime}>09:15 AM</Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Step 2: Pharmacy */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneIconBox, styles.milestoneDone]}>
              <Text style={styles.milestoneCheck}>✓</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.milestoneName}>2. Ward Pharmacy</Text>
              <Text style={styles.milestoneDetail}>Take-home drugs dispensed · 0 unused ampoules returned</Text>
            </View>
            <Text style={styles.milestoneTime}>09:45 AM</Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Step 3: Cashier Co-Pay */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneIconBox, coPaySettled ? styles.milestoneDone : styles.milestoneActive]}>
              <Text style={styles.milestoneCheck}>{coPaySettled ? '✓' : '3'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[styles.milestoneName, !coPaySettled && { color: colors.accentDark, fontWeight: '700' }]}>
                3. Cashier Co-Pay Settlement
              </Text>
              <Text style={styles.milestoneDetail}>
                {coPaySettled ? '₦4,650 Patient Co-Pay Paid in Full' : 'Awaiting settlement at Counter #04 (or via App)'}
              </Text>
            </View>
            <Text style={[styles.milestoneTime, !coPaySettled && { color: colors.accentDark, fontWeight: '700' }]}>
              {coPaySettled ? 'Cleared' : '● Now At Desk'}
            </Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Step 4: Gate Pass */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneIconBox, coPaySettled ? styles.milestoneDone : styles.milestonePending]}>
              <Text style={[styles.milestoneCheck, !coPaySettled && { color: colors.textTertiary }]}>{coPaySettled ? '✓' : '4'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.milestoneName}>4. WelliPass Gate Clearance</Text>
              <Text style={styles.milestoneDetail}>
                {coPaySettled ? 'Active Green Pass · Exit Code EXIT-7749' : 'Unlocks automatically after financial settlement'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('WelliPass', { billId })}
              disabled={!coPaySettled}
            >
              <Text style={[styles.milestoneTime, coPaySettled ? { color: '#166534', fontWeight: '700' } : { color: colors.textTertiary }]}>
                {coPaySettled ? 'View Pass →' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Financial Settlement Card */}
        <Text style={styles.sectionTitle}>Financial Clearance Breakdown</Text>
        <Card style={styles.financialCard}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Total Hospital Tariff</Text>
            <Text style={styles.finValue}>{NAIRA(grossTariff)}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>HMO Remittance (Hygeia)</Text>
            <Text style={[styles.finValue, { color: '#166534' }]}>- {NAIRA(hmoCoverage)}</Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { fontWeight: '700', fontSize: fontSize.md }]}>Out-of-Pocket Co-Pay Due</Text>
            <Text style={[styles.finValue, { fontWeight: '800', fontSize: fontSize.lg, color: coPaySettled ? '#166534' : colors.accentDark }]}>
              {coPaySettled ? `₦0.00 (PAID)` : NAIRA(netCoPay)}
            </Text>
          </View>

          {!coPaySettled ? (
            <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
              <Button
                label="⚡ Pay Now via WelliPay Wallet (Instant Zero-Wait)"
                variant="primary"
                onPress={handlePayWallet}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <Button
                  label="🌍 Ask Family"
                  variant="secondary"
                  onPress={() => navigation.navigate('FamilyPayHub', { billId })}
                  style={{ flex: 1 }}
                />
                <Button
                  label="📶 USSD Dial"
                  variant="secondary"
                  onPress={() => navigation.navigate('UssdOffline', { billId })}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.settledBanner}>
              <Text style={styles.settledBannerTitle}>✓ 100% Financial Clearance Certified</Text>
              <Text style={styles.settledBannerSub}>Receipt #REC-88402 generated. You can now present your exit pass.</Text>
              <Button
                label="Open WelliPass Digital Gate Pass"
                variant="primary"
                onPress={() => navigation.navigate('WelliPass', { billId })}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </Card>

        {/* Hospital Billing Attendant Contact */}
        <Card style={styles.contactCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 18 }}>👩🏾‍⚕️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Sister Chinyere Eze</Text>
              <Text style={styles.contactRole}>Chief Cashier · Station #04 (Room 102)</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button
              label="📞 Call Counter"
              variant="secondary"
              onPress={handleCallCashier}
              style={{ flex: 1 }}
            />
            <Button
              label="💬 WhatsApp Desk"
              variant="secondary"
              onPress={handleWhatsAppCashier}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Non-Smartphone & Offline Fallback Banner */}
        <Card style={styles.smsFallbackCard}>
          <Text style={styles.smsFallbackTitle}>📱 No Smartphone / Low Battery?</Text>
          <Text style={styles.smsFallbackText}>
            A digital SMS token for Token #A-14 has been sent to your registered phone (0803 123 4567) and your Next-of-Kin (Fatima Umar +234 802 345 6789).
          </Text>
          <Button
            label="🖨️ View / Print Thermal Slip"
            variant="ghost"
            onPress={() => setThermalModalVisible(true)}
            style={{ marginTop: spacing.xs }}
          />
        </Card>
      </ScrollView>

      {/* POS Thermal Paper Slip Modal */}
      <Modal
        visible={thermalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThermalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.thermalModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>80mm POS Thermal Slip Preview</Text>
              <TouchableOpacity onPress={() => setThermalModalVisible(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.thermalPaper}>
              <Text style={styles.monoCenterBold}>REDEEMER SPECIALIST CLINIC</Text>
              <Text style={styles.monoCenter}>Cashier Station · Room 102</Text>
              <Text style={styles.monoCenter}>Terminal #WP-882 · Ikoyi, Lagos</Text>
              <Text style={styles.monoCenter}>================================</Text>
              <Text style={styles.monoCenterBold}>PATIENT QUEUE TICKET</Text>
              <Text style={styles.monoCenterHuge}>#A-14</Text>
              <Text style={styles.monoCenter}>NOW SERVING: #A-12</Text>
              <Text style={styles.monoCenter}>--------------------------------</Text>
              <Text style={styles.monoLeft}>PATIENT: Jay Umar (LAG-4401)</Text>
              <Text style={styles.monoLeft}>WARD: Surgical Ward 3B, Bed 12</Text>
              <Text style={styles.monoLeft}>DATE: Today, 10:15 AM</Text>
              <Text style={styles.monoLeft}>ATTENDANT: Sr. Chinyere Eze</Text>
              <Text style={styles.monoCenter}>--------------------------------</Text>
              <Text style={styles.monoLeft}>Total Tariff:        NGN 75,000</Text>
              <Text style={styles.monoLeft}>HMO Hygeia Cover:   -NGN 70,350</Text>
              <Text style={styles.monoLeftBold}>Co-Pay Balance:      NGN  4,650</Text>
              <Text style={styles.monoCenter}>================================</Text>
              <Text style={styles.monoCenter}>Take this slip to Counter #04 or</Text>
              <Text style={styles.monoCenter}>dial *384*WELLI# on any 2G phone.</Text>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                label="Share Receipt"
                variant="secondary"
                onPress={handleSharePaperTicket}
                style={{ flex: 1 }}
              />
              <Button
                label="Done"
                variant="primary"
                onPress={() => setThermalModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  ticketFacility: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  ticketCounter: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ticketBadge: {
    backgroundColor: colors.accentDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ticketBadgeText: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  perforatedLine: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dashedDivider: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginHorizontal: 12,
  },
  cutoutLeft: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
  },
  cutoutRight: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
  },
  tokenSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tokenLabel: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  tokenNumber: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 48,
    color: colors.accentDark,
    marginVertical: 4,
  },
  tokenPatient: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  tokenWard: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  liveServingBanner: {
    backgroundColor: '#F0F9FA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CCECEF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  livePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0088b0',
  },
  liveServingText: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.sm,
    color: colors.accentDark,
  },
  liveWaitEstimate: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  ticketMetaText: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  refreshLink: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 11,
    color: colors.accentDark,
  },
  bedsideCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  bedsideTitle: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: '#92400E',
  },
  bedsideSubtitle: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: '#B45309',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  milestoneCard: {
    padding: spacing.md,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDone: {
    backgroundColor: '#DCFCE7',
  },
  milestoneActive: {
    backgroundColor: '#E0F2FE',
  },
  milestonePending: {
    backgroundColor: colors.surfaceAlt,
  },
  milestoneCheck: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 13,
    color: '#166534',
  },
  milestoneName: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  milestoneDetail: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  milestoneTime: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  financialCard: {
    padding: spacing.md,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  finLabel: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  finValue: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  settledBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F0FDF4',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  settledBannerTitle: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.sm,
    color: '#166534',
  },
  settledBannerSub: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: '#15803D',
    marginTop: 2,
  },
  contactCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  contactRole: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  smsFallbackCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  smsFallbackTitle: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  smsFallbackText: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  thermalModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  thermalPaper: {
    backgroundColor: '#FAFAF8',
    borderColor: '#D7D3D3',
    borderWidth: 1,
    padding: spacing.md,
    maxHeight: 360,
  },
  monoCenter: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    textAlign: 'center',
    color: '#201E1D',
    lineHeight: 16,
  },
  monoCenterBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#201E1D',
    lineHeight: 16,
  },
  monoCenterHuge: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#201E1D',
    marginVertical: 4,
  },
  monoLeft: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#201E1D',
    lineHeight: 16,
  },
  monoLeftBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#201E1D',
    lineHeight: 16,
  },
});
