import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow, fontSize } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, Divider, QRCodeView } from '../../components';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'WelliPass'>;
type RouteProps = RouteProp<RootStackParamList, 'WelliPass'>;

export const WelliPassScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, welliPasses, updateWelliPassStep, requestWelliPass } = useStore();
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  const billId = route.params?.billId;
  const passId = route.params?.passId;
  const activePass = welliPasses.find(p => (passId && p.id === passId) || (billId && p.billId === billId)) || welliPasses[0];

  const [guardVerified, setGuardVerified] = useState(activePass?.securityGuardVerified || false);
  const [fallbackDrawerOpen, setFallbackDrawerOpen] = useState(false);
  const [thermalReceiptModalOpen, setThermalReceiptModalOpen] = useState(false);

  if (!activePass) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t.welliPassTitle || 'WelliPass Clearance'} onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No active WelliPass discharge found.</Text>
          <Button
            label="Initialize Discharge Pass"
            onPress={() => {
              requestWelliPass(billId || 'b2', 'Ward 3, Bed 12');
            }}
          />
        </View>
      </View>
    );
  }

  const isCleared = activePass.overallStatus === 'cleared';
  const exitPin = 'EXIT-7749';

  const handleSimulateStep = (step: 'doctor' | 'pharmacy' | 'hmo' | 'psp', name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateWelliPassStep(activePass.id, step, name);
    Alert.alert('Step Verified', 'Discharge requirement has been authenticated and stamped.');
  };

  const handleGuardScan = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGuardVerified(true);
    Alert.alert(
      'Gate Exit Verified ✓',
      `WelliPass ${activePass.gatePassCode} (Exit PIN: ${exitPin}) scanned and cleared by Hospital Security. Patient is authorized to exit the facility.`
    );
  };

  const handleResendSms = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'SMS Token Dispatched ✓',
      `Toll-free exit token sent to:\n• Patient: 0803 123 4567\n• Next-of-Kin: Fatima Umar (+234 802 345 6789)\n\nMessage: "WELLIPASS CLEARED: ${activePass.patientName} (LAG-4401) is cleared to exit ${activePass.hospitalName}. Exit Code: ${exitPin}. Valid until 18:00 today."`
    );
  };

  const handleShareWhatsApp = async () => {
    Haptics.selectionAsync();
    const text =
      '🏥 *WELLIPASS DISCHARGE CLEARANCE*\n\n' +
      '*Patient:* ' + activePass.patientName + '\n' +
      '*Hospital:* ' + activePass.hospitalName + '\n' +
      '*Ward:* ' + activePass.ward + '\n' +
      '*Gate Pass Code:* ' + activePass.gatePassCode + '\n' +
      '*Exit PIN:* ' + exitPin + '\n' +
      '*Status:* 100% CLEARED (Doctor, Pharmacy, HMO, Cashier PSP Reconciled)\n\n' +
      'Verify Pass: https://wellipay.ng/pass/verify?code=' + activePass.gatePassCode;

    const waUrl = 'whatsapp://send?text=' + encodeURIComponent(text);
    try {
      const can = await Linking.canOpenURL(waUrl);
      if (can) {
        await Linking.openURL(waUrl);
      } else {
        await Share.share({ message: text });
      }
    } catch {
      await Share.share({ message: text });
    }
  };

  const handlePrintThermal = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Print Slip to POS Printer',
      `Printing 80mm thermal gate pass slip for ${activePass.patientName} (Code: ${exitPin}). Sent to hospital cashier terminal #WP-882.`
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.welliPassTitle || 'WelliPass Clearance'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('HospitalDeskTicket', { billId })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 18 }}>🎫</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl, paddingLeft: Math.max(insets.left, spacing.md), paddingRight: Math.max(insets.right, spacing.md) }]} showsVerticalScrollIndicator={false}>
        {/* Status Hero Card */}
        <Card style={[styles.heroCard, isCleared ? styles.heroCardCleared : styles.heroCardPending]}>
          <View style={styles.statusBadgeRow}>
            <View style={[styles.statusPill, isCleared ? styles.pillCleared : styles.pillPending]}>
              <View style={[styles.dot, isCleared ? styles.dotCleared : styles.dotPending]} />
              <Text style={[styles.pillText, isCleared ? styles.pillTextCleared : styles.pillTextPending]}>
                {isCleared ? 'DISCHARGE AUTHORIZED · GREEN PASS' : 'DISCHARGE IN AUDIT'}
              </Text>
            </View>
            <Text style={styles.gatePassCode}>{activePass.gatePassCode}</Text>
          </View>

          <Text style={styles.patientName}>{activePass.patientName}</Text>
          <Text style={styles.wardInfo}>{activePass.ward} · {activePass.hospitalName}</Text>
          <Text style={styles.dateMeta}>Admitted: {activePass.admissionDate} | Discharge: {activePass.dischargeDate}</Text>

          {/* Dual Experience: Smartphone Digital Pass */}
          {isCleared && (
            <View style={styles.greenPassContainer}>
              {/* High Resolution Vector QR Code */}
              <View style={styles.qrWrapper}>
                <QRCodeView
                  value={activePass.gatePassCode}
                  size={180}
                  color={{ dark: '#004961', light: '#FFFFFF' }}
                />
              </View>

              {/* High Visibility Exit PIN for Gate Officers */}
              <View style={styles.exitPinBox}>
                <Text style={styles.exitPinLabel}>GATE OFFICER EXIT PIN</Text>
                <Text style={styles.exitPinCode}>{exitPin}</Text>
                <Text style={styles.exitPinSub}>Show this code or QR to security at hospital barrier</Text>
              </View>

              {guardVerified ? (
                <View style={styles.verifiedStampBox}>
                  <Text style={styles.verifiedStampText}>✓ SCANNED & CLEARED AT HOSPITAL EXIT</Text>
                </View>
              ) : (
                <Button
                  label="Simulate Security Gate Scan"
                  variant="primary"
                  onPress={handleGuardScan}
                  style={{ marginTop: spacing.sm }}
                />
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Button
                  label="💬 Share WhatsApp"
                  variant="secondary"
                  onPress={handleShareWhatsApp}
                  style={{ flex: 1 }}
                />
                <Button
                  label="🎫 Desk Ticket"
                  variant="secondary"
                  onPress={() => navigation.navigate('HospitalDeskTicket', { billId })}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {!isCleared && (
            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Complete Cashier Co-Pay"
                variant="primary"
                onPress={() => navigation.navigate('HospitalDeskTicket', { billId })}
              />
            </View>
          )}
        </Card>

        {/* ============================================================ */}
        {/* NON-SMARTPHONE & LOW-BATTERY REDUNDANCY ARCHITECTURE         */}
        {/* ============================================================ */}
        <Card style={styles.fallbackHeaderCard}>
          <TouchableOpacity
            style={styles.fallbackTrigger}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setFallbackDrawerOpen(prev => !prev);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Text style={{ fontSize: 26 }}>🔋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fallbackHeaderTitle}>Phone Dead or No Smartphone?</Text>
                <Text style={styles.fallbackHeaderSub}>
                  WelliPass operates with 5 offline redundant fallbacks for feature phones & power cuts.
                </Text>
              </View>
            </View>
            <Text style={styles.accordionArrow}>{fallbackDrawerOpen ? '▲ Close' : '▼ 5 Options'}</Text>
          </TouchableOpacity>

          {fallbackDrawerOpen && (
            <View style={styles.fallbackDrawerBody}>
              <Divider style={{ marginVertical: spacing.sm }} />

              {/* Fallback 1: POS Thermal Slip */}
              <View style={styles.fallbackItem}>
                <View style={styles.fallbackItemIcon}>
                  <Text style={{ fontSize: 18 }}>🖨️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackItemTitle}>1. Official POS Thermal Paper Slip</Text>
                  <Text style={styles.fallbackItemDesc}>
                    Cashier prints an 80mm thermal receipt with offline QR, doctor stamp, and bold exit code {exitPin}. Gate guards accept physical slips.
                  </Text>
                  <Button
                    label="Preview / Print Thermal Gate Slip"
                    variant="secondary"
                    onPress={() => setThermalReceiptModalOpen(true)}
                    style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
                  />
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              {/* Fallback 2: SMS Token */}
              <View style={styles.fallbackItem}>
                <View style={styles.fallbackItemIcon}>
                  <Text style={{ fontSize: 18 }}>💬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackItemTitle}>2. Automatic Toll-Free SMS Token</Text>
                  <Text style={styles.fallbackItemDesc}>
                    Works on basic 2G feature phones ("palasa" / torchlight phones) with zero internet. Sent to patient (0803 123 4567) and Next-of-Kin (Fatima Umar).
                  </Text>
                  <Button
                    label="Resend SMS Token to NoK"
                    variant="secondary"
                    onPress={handleResendSms}
                    style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
                  />
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              {/* Fallback 3: Gate Guard Lookup */}
              <View style={styles.fallbackItem}>
                <View style={styles.fallbackItemIcon}>
                  <Text style={{ fontSize: 18 }}>👮🏾‍♂️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackItemTitle}>3. Gate Guard Tablet Direct Look-up</Text>
                  <Text style={styles.fallbackItemDesc}>
                    Tell the exit gate officer your Hospital Card # (LAG-4401) or phone number (0803 123 4567). The guard terminal flashes GREEN to raise barrier.
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              {/* Fallback 4: USSD Query on Borrowed Phone */}
              <View style={styles.fallbackItem}>
                <View style={styles.fallbackItemIcon}>
                  <Text style={{ fontSize: 18 }}>📶</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackItemTitle}>4. USSD Query on Any Borrowed Phone</Text>
                  <Text style={styles.fallbackItemDesc}>
                    Borrow any phone (nurse, relative, or taxi driver) and dial *384*WELLI#. Enter phone number & 4-digit PIN to display active exit code {exitPin}.
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.sm }} />

              {/* Fallback 5: Emergency Override */}
              <View style={styles.fallbackItem}>
                <View style={styles.fallbackItemIcon}>
                  <Text style={{ fontSize: 18 }}>🚨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackItemTitle}>5. Supervisor Emergency Override</Text>
                  <Text style={styles.fallbackItemDesc}>
                    For critical transfers or catastrophic hospital network outages, the Chief Security Officer and Matron hold a supervisor master keycard.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* 4-Step Discharge Audit Checklist */}
        <Text style={styles.sectionTitle}>4-Step Clinical & Financial Clearance Audit</Text>
        <Text style={styles.sectionSubtitle}>All four hospital departments must certify clearance before exit pass is active:</Text>

        {/* Step 1: Doctor */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.doctorSignOff.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>{t.doctorSignOffLabel || 'Physician Clinical Order'}</Text>
              <Text style={styles.stepOfficer}>{activePass.doctorSignOff.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.doctorSignOff.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.doctorSignOff.cleared ? '✓ Cleared' : 'Pending'}
            </Text>
          </View>
          {activePass.doctorSignOff.notes ? (
            <Text style={styles.stepNotes}>“{activePass.doctorSignOff.notes}”</Text>
          ) : null}
          {!activePass.doctorSignOff.cleared && (
            <Button
              label="Simulate Doctor Sign-Off"
              variant="secondary"
              onPress={() => handleSimulateStep('doctor', 'Dr. O. Alabi (Surgeon)')}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>

        {/* Step 2: Pharmacy */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.pharmacyClearance.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>Ward Pharmacy Returns</Text>
              <Text style={styles.stepOfficer}>{activePass.pharmacyClearance.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.pharmacyClearance.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.pharmacyClearance.cleared ? '✓ Cleared' : 'Pending'}
            </Text>
          </View>
          {activePass.pharmacyClearance.notes ? (
            <Text style={styles.stepNotes}>“{activePass.pharmacyClearance.notes}”</Text>
          ) : null}
          {!activePass.pharmacyClearance.cleared && (
            <Button
              label="Simulate Pharmacy Clearance"
              variant="secondary"
              onPress={() => handleSimulateStep('pharmacy', 'Pharm. K. Danladi')}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>

        {/* Step 3: HMO */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.hmoRemittance.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>HMO Adjudication Remittance</Text>
              <Text style={styles.stepOfficer}>{activePass.hmoRemittance.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.hmoRemittance.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.hmoRemittance.cleared ? '✓ Cleared' : 'Pending'}
            </Text>
          </View>
          {activePass.hmoRemittance.notes ? (
            <Text style={styles.stepNotes}>“{activePass.hmoRemittance.notes}”</Text>
          ) : null}
          {!activePass.hmoRemittance.cleared && (
            <Button
              label="Simulate HMO Desk Remittance"
              variant="secondary"
              onPress={() => handleSimulateStep('hmo', 'HMO Desk Officer S. Eze')}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>

        {/* Step 4: PSP Cashier */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.pspReconciled.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>4</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>Cashier Co-Pay Settlement</Text>
              <Text style={styles.stepOfficer}>{activePass.pspReconciled.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.pspReconciled.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.pspReconciled.cleared ? '✓ Cleared' : 'Pending'}
            </Text>
          </View>
          {activePass.pspReconciled.notes ? (
            <Text style={styles.stepNotes}>“{activePass.pspReconciled.notes}”</Text>
          ) : null}
          {!activePass.pspReconciled.cleared && (
            <Button
              label="Settle Co-Pay at Desk"
              variant="primary"
              onPress={() => navigation.navigate('HospitalDeskTicket', { billId })}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>
      </ScrollView>

      {/* POS Thermal Paper Slip Modal */}
      <Modal
        visible={thermalReceiptModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setThermalReceiptModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.thermalModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>80mm POS Thermal Gate Pass</Text>
              <TouchableOpacity onPress={() => setThermalReceiptModalOpen(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.thermalPaper}>
              <Text style={styles.monoCenterBold}>LAGOON HOSPITALS IKOYI</Text>
              <Text style={styles.monoCenter}>Discharge Billing Desk · Room 102</Text>
              <Text style={styles.monoCenter}>Terminal #WP-882 · Lagos, Nigeria</Text>
              <Text style={styles.monoCenter}>================================</Text>
              <Text style={styles.monoCenterBold}>DIGITAL DISCHARGE GATE PASS</Text>
              <Text style={styles.monoCenter}>CERTIFICATE OF COMPLETE SETTLEMENT</Text>
              <Text style={styles.monoCenter}>--------------------------------</Text>
              <Text style={styles.monoLeft}>PATIENT: {activePass.patientName}</Text>
              <Text style={styles.monoLeft}>HOSPITAL CARD #: LAG-4401</Text>
              <Text style={styles.monoLeft}>WARD: {activePass.ward}</Text>
              <Text style={styles.monoLeft}>DATE: Today, 10:45 AM</Text>
              <Text style={styles.monoLeft}>PHYSICIAN: Dr. F. Adeleke</Text>
              <Text style={styles.monoCenter}>--------------------------------</Text>
              <Text style={styles.monoLeft}>Total Hospital Tariff: NGN 75,000</Text>
              <Text style={styles.monoLeft}>HMO Reliance Remitted: NGN 55,000</Text>
              <Text style={styles.monoLeft}>Patient Co-Pay Paid:   NGN 20,000</Text>
              <Text style={styles.monoLeftBold}>BALANCE DUE:           NGN      0</Text>
              <Text style={styles.monoCenter}>--------------------------------</Text>
              <Text style={styles.monoCenterBold}>GATE SECURITY EXIT PIN:</Text>
              <Text style={styles.monoCenterHuge}>{exitPin}</Text>
              <Text style={styles.monoCenter}>PASS CODE: {activePass.gatePassCode}</Text>
              <Text style={styles.monoCenter}>================================</Text>
              <Text style={styles.monoCenter}>Valid for Exit Until 18:00 Today</Text>
              <Text style={styles.monoCenter}>Show this paper slip to Gate Security</Text>
              <Text style={styles.monoCenter}>or dial *384*WELLI# on any phone.</Text>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                label="🖨️ Print Slip"
                variant="secondary"
                onPress={handlePrintThermal}
                style={{ flex: 1 }}
              />
              <Button
                label="Done"
                variant="primary"
                onPress={() => setThermalReceiptModalOpen(false)}
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
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  heroCard: {
    padding: spacing.md,
  },
  heroCardCleared: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  heroCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  pillCleared: {
    backgroundColor: '#DCFCE7',
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCleared: {
    backgroundColor: '#16A34A',
  },
  dotPending: {
    backgroundColor: '#D97706',
  },
  pillText: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pillTextCleared: {
    color: '#166534',
  },
  pillTextPending: {
    color: '#92400E',
  },
  gatePassCode: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
  },
  patientName: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: 2,
  },
  wardInfo: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateMeta: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  greenPassContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    ...shadow.md,
  },
  exitPinBox: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#B7EED0',
    alignItems: 'center',
    width: '100%',
  },
  exitPinLabel: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  exitPinCode: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 28,
    color: '#004961',
    letterSpacing: 2,
    marginVertical: 2,
  },
  exitPinSub: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  verifiedStampBox: {
    marginTop: spacing.sm,
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  verifiedStampText: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 11,
    color: '#166534',
    letterSpacing: 0.5,
  },
  fallbackHeaderCard: {
    marginTop: spacing.md,
    backgroundColor: '#F8F9FA',
    borderColor: colors.border,
  },
  fallbackTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fallbackHeaderTitle: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  fallbackHeaderSub: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accordionArrow: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 12,
    color: colors.accentDark,
    marginLeft: spacing.xs,
  },
  fallbackDrawerBody: {
    marginTop: spacing.xs,
  },
  fallbackItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  fallbackItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fallbackItemTitle: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  fallbackItemDesc: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  stepCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumDone: {
    backgroundColor: '#DCFCE7',
  },
  stepNumText: {
    fontFamily: 'SourceSerif4_700Bold',
    fontSize: 11,
    color: colors.textPrimary,
  },
  stepTitle: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  stepOfficer: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  stepStatus: {
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: fontSize.xs,
  },
  statusDone: {
    color: '#166534',
  },
  statusWait: {
    color: colors.textTertiary,
  },
  stepNotes: {
    fontFamily: 'SourceSerif4_400Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#201E1D',
    letterSpacing: 2,
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
