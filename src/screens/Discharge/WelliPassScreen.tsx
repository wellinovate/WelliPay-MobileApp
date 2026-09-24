import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, ProgressBar, Divider, Chip } from '../../components';





type NavProp = NativeStackNavigationProp<RootStackParamList, 'WelliPass'>;
type RouteProps = RouteProp<RootStackParamList, 'WelliPass'>;

export const WelliPassScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, welliPasses, updateWelliPassStep, requestWelliPass } = useStore();
  const t = COPY[lang] || COPY.en;

  const billId = route.params?.billId;
  const passId = route.params?.passId;
  const activePass = welliPasses.find(p => (passId && p.id === passId) || (billId && p.billId === billId)) || welliPasses[0];

  const [guardVerified, setGuardVerified] = useState(activePass?.securityGuardVerified || false);

  if (!activePass) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t.welliPassTitle} onBack={() => navigation.goBack()} />
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

  const handleSimulateStep = (step: 'doctor' | 'pharmacy' | 'hmo' | 'psp', name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateWelliPassStep(activePass.id, step, name);
    Alert.alert('Step Verified', 'Discharge requirement has been authenticated and stamped.');
  };

  const handleGuardScan = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGuardVerified(true);
    Alert.alert('Gate Exit Verified ✓', 'WelliPass ' + activePass.gatePassCode + ' scanned and cleared by Hospital Security. Patient is authorized to exit the facility.');
  };

  const handleSharePass = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: 'WelliPass Hospital Discharge Clearance: ' + activePass.patientName + ' is cleared for discharge at ' + activePass.hospitalName + ' (Gate Pass: ' + activePass.gatePassCode + '). All clinical, pharmacy, HMO, and cashier records are reconciled.',
      });
    } catch {
      // dismissed
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.welliPassTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

          {isCleared && (
            <View style={styles.greenPassContainer}>
              <View style={styles.qrSimulationFrame}>
                {/* Visual QR Matrix Simulation */}
                <View style={styles.qrRow}>
                  <View style={styles.qrCorner} />
                  <View style={styles.qrBar} />
                  <View style={styles.qrCorner} />
                </View>
                <View style={styles.qrMidRow}>
                  <Text style={styles.qrCodeText}>{activePass.gatePassCode}</Text>
                </View>
                <View style={styles.qrRow}>
                  <View style={styles.qrCorner} />
                  <View style={styles.qrBar} />
                  <View style={styles.qrCorner} />
                </View>
              </View>

              <Text style={styles.qrInstruction}>
                Present this tamper-evident QR code to Ward Security and Hospital Gate Exit
              </Text>

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
              <Text style={styles.stepTitle}>{t.doctorSignOffLabel}</Text>
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
              <Text style={styles.stepTitle}>{t.pharmacyClearanceLabel}</Text>
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

        {/* Step 3: HMO Adjudication */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.hmoRemittance.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>{t.hmoRemittanceLabel}</Text>
              <Text style={styles.stepOfficer}>{activePass.hmoRemittance.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.hmoRemittance.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.hmoRemittance.cleared ? '✓ Certified' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.stepMetaAmount}>
            HMO Covered Tariff: {NAIRA(activePass.hmoRemittance.approvedAmount)}
          </Text>
          {!activePass.hmoRemittance.cleared && (
            <Button
              label="Simulate HMO Verification"
              variant="secondary"
              onPress={() => handleSimulateStep('hmo', 'HMO Desk Officer S. Eze')}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>

        {/* Step 4: Cashier PSP */}
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNum, activePass.pspReconciled.cleared && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>4</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.stepTitle}>{t.cashierPspLabel}</Text>
              <Text style={styles.stepOfficer}>{activePass.pspReconciled.officerName}</Text>
            </View>
            <Text style={[styles.stepStatus, activePass.pspReconciled.cleared ? styles.statusDone : styles.statusWait]}>
              {activePass.pspReconciled.cleared ? '✓ Settled' : 'Pending Payment'}
            </Text>
          </View>
          <View style={styles.pspBreakdownRow}>
            <Text style={styles.pspBreakdownLabel}>Patient Self-Pay (PSP) Paid:</Text>
            <Text style={styles.pspBreakdownVal}>{NAIRA(activePass.pspReconciled.pspPaid)}</Text>
          </View>
          <View style={styles.pspBreakdownRow}>
            <Text style={styles.pspBreakdownLabel}>Outstanding Balance Due:</Text>
            <Text style={[styles.pspBreakdownVal, activePass.pspReconciled.balanceDue > 0 && { color: colors.danger }]}>
              {NAIRA(activePass.pspReconciled.balanceDue)}
            </Text>
          </View>
          {!activePass.pspReconciled.cleared && (
            <Button
              label="Simulate Cashier Settlement"
              variant="secondary"
              onPress={() => handleSimulateStep('psp', 'Cashier R. Bello')}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </Card>

        {/* Share Action */}
        <Button
          label="Share Official Discharge Pass"
          variant="secondary"
          onPress={handleSharePass}
          style={{ marginVertical: spacing.md }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  heroCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  heroCardCleared: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 },
  heroCardPending: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  statusBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pillCleared: { backgroundColor: '#DCFCE7' },
  pillPending: { backgroundColor: '#FEF3C7' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  dotCleared: { backgroundColor: '#16A34A' },
  dotPending: { backgroundColor: '#D97706' },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  pillTextCleared: { color: '#166534' },
  pillTextPending: { color: '#92400E' },
  gatePassCode: { fontSize: 11, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textTertiary },
  patientName: { fontSize: 20, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 4 },
  wardInfo: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  dateMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  greenPassContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  qrSimulationFrame: {
    width: 180,
    height: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: '#16A34A',
    padding: 12,
    justifyContent: 'space-between',
  },
  qrRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qrCorner: { width: 34, height: 34, backgroundColor: '#16A34A', borderRadius: 4 },
  qrBar: { width: 40, height: 12, backgroundColor: '#16A34A', borderRadius: 2, alignSelf: 'center' },
  qrMidRow: { alignItems: 'center', justifyContent: 'center' },
  qrCodeText: { fontSize: 10, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), fontWeight: '700', color: '#166534' },
  qrInstruction: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 15 },
  verifiedStampBox: { backgroundColor: '#DCFCE7', padding: 10, borderRadius: 6, marginTop: spacing.sm },
  verifiedStampText: { fontSize: 11, fontWeight: '700', color: '#166534', textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: spacing.sm },
  sectionSubtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sm },
  stepCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepNumDone: { backgroundColor: colors.accent },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  stepOfficer: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  stepStatus: { fontSize: 12, fontWeight: '700' },
  statusDone: { color: '#16A34A' },
  statusWait: { color: '#D97706' },
  stepNotes: { fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, marginTop: spacing.xs, backgroundColor: colors.surfaceAlt, padding: 6, borderRadius: 4 },
  stepMetaAmount: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: spacing.xs },
  pspBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  pspBreakdownLabel: { fontSize: 11, color: colors.textTertiary },
  pspBreakdownVal: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textTertiary, marginBottom: spacing.md },
});
