import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, ProgressBar, Divider, Chip } from '../../components';





type NavProp = NativeStackNavigationProp<RootStackParamList, 'ProviderDesk'>;

export const ProviderDeskScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { lang, providerDesk, generateProviderBill, providerAdjudicateQueueItem } = useStore();
  const t = COPY[lang] || COPY.en;

  const [modalVisible, setModalVisible] = useState(false);
  const [newPatient, setNewPatient] = useState('');
  const [newService, setNewService] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newHmo, setNewHmo] = useState('Hygeia HMO');

  const handleGenerateBill = () => {
    const amt = parseFloat(newAmount.replace(/[^0-9.]/g, ''));
    if (!newPatient.trim() || !newService.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please fill in patient name, service, and valid bill amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const code = generateProviderBill(newPatient.trim(), newService.trim(), amt, newHmo);
    setModalVisible(false);
    setNewPatient('');
    setNewService('');
    setNewAmount('');
    Alert.alert('Bill Generated ✓', 'Bill code ' + code + ' created for ' + newPatient + '. Patient can scan or enter this code in WelliPay.');
  };

  const handleAdjudicate = (itemId: string, total: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const approved = Math.round(total * 0.75); // simulate 75% HMO cover
    providerAdjudicateQueueItem(itemId, approved);
    Alert.alert('HMO Certified ✓', 'HMO claim of ' + NAIRA(approved) + ' certified. Remaining PSP: ' + NAIRA(total - approved) + '.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.providerDeskTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hospital Desk Operator Card */}
        <Card style={styles.operatorCard}>
          <View style={styles.operatorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>SC</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.operatorName}>{providerDesk.operatorName}</Text>
              <Text style={styles.operatorRole}>{providerDesk.role}</Text>
              <Text style={styles.facilityTag}>{providerDesk.facilityName}</Text>
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.onlineText}>DESK LIVE</Text>
            </View>
          </View>
        </Card>

        {/* Today's Metrics Bar */}
        <Text style={styles.sectionHeading}>{t.todaysDeskStats}</Text>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Billed</Text>
            <Text style={styles.metricVal}>{NAIRA(Math.round(providerDesk.todaysStats.totalBilled / 1000))}k</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>HMO Claims</Text>
            <Text style={[styles.metricVal, { color: colors.accent }]}>
              {NAIRA(Math.round(providerDesk.todaysStats.hmoClaims / 1000))}k
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>PSP Settled</Text>
            <Text style={[styles.metricVal, { color: '#16A34A' }]}>
              {NAIRA(Math.round(providerDesk.todaysStats.pspCollected / 1000))}k
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Patients</Text>
            <Text style={styles.metricVal}>{providerDesk.todaysStats.patientsCount}</Text>
          </Card>
        </View>

        {/* Live Patient Queue */}
        <View style={styles.queueHeaderRow}>
          <Text style={styles.sectionHeading}>{t.livePatientQueue} ({providerDesk.liveQueue.length})</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.generateBtnText}>+ New Bill Code</Text>
          </TouchableOpacity>
        </View>

        {providerDesk.liveQueue.map((item, idx) => {
          const isAwaitingAdj = item.status === 'awaiting_adjudication';
          const isAwaitingPsp = item.status === 'awaiting_psp';
          const isCleared = item.status === 'cleared';

          return (
            <Card key={item.id || idx} style={styles.queueCard}>
              <View style={styles.queueTop}>
                <View>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.serviceText}>{item.service}</Text>
                  <Text style={styles.hmoTag}>{item.hmoName} · {item.welliRecordId}</Text>
                </View>
                <View style={[
                  styles.statusTag,
                  isAwaitingAdj ? styles.tagYellow : isAwaitingPsp ? styles.tagBlue : styles.tagGreen
                ]}>
                  <Text style={[
                    styles.statusTagText,
                    isAwaitingAdj ? styles.textYellow : isAwaitingPsp ? styles.textBlue : styles.textGreen
                  ]}>
                    {isAwaitingAdj ? 'Awaiting HMO' : isAwaitingPsp ? 'Awaiting PSP' : 'Cleared'}
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.xs }} />

              <View style={styles.queueFinancials}>
                <View>
                  <Text style={styles.finLabel}>Total Bill</Text>
                  <Text style={styles.finVal}>{NAIRA(item.totalAmount)}</Text>
                </View>
                <View>
                  <Text style={styles.finLabel}>HMO Approved</Text>
                  <Text style={[styles.finVal, { color: colors.accent }]}>
                    {item.hmoApproved > 0 ? NAIRA(0) : '₦0'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.finLabel}>Patient PSP</Text>
                  <Text style={[styles.finVal, { color: isCleared ? '#16A34A' : colors.danger }]}>
                    {NAIRA(item.pspAmount)}
                  </Text>
                </View>
              </View>

              {isAwaitingAdj && (
                <Button
                  label="Approve HMO Pre-Auth Tariff"
                  variant="primary"
                  onPress={() => handleAdjudicate(item.id, item.totalAmount)}
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>
          );
        })}

        {/* Recently Generated Bill Codes */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>Recently Generated Bill Codes</Text>
        <Card style={styles.codesCard}>
          {providerDesk.generatedBillCodes.map((b, i) => (
            <View key={b.code || i} style={styles.codeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.billCodeBig}>{b.code}</Text>
                <Text style={styles.codeMeta}>{b.patientName} · {b.service}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.codeAmount}>{NAIRA(b.amount)}</Text>
                <Text style={[styles.claimedText, b.claimed ? { color: '#16A34A' } : { color: colors.accent }]}>
                  {b.claimed ? 'Claimed in App' : 'Pending Claim'}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <Button
          label={t.generateNewBillCode}
          variant="primary"
          onPress={() => setModalVisible(true)}
          style={{ marginVertical: spacing.md }}
        />
      </ScrollView>

      {/* Generate Bill Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Generate Patient Bill Code</Text>
            <Text style={styles.modalSub}>Create a digital WelliPay bill for an inpatient or outpatient encounter:</Text>

            <Text style={styles.inputLabel}>Patient Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amina Bello"
              value={newPatient}
              onChangeText={setNewPatient}
            />

            <Text style={styles.inputLabel}>Service / Procedure</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Laparoscopic Appendectomy"
              value={newService}
              onChangeText={setNewService}
            />

            <Text style={styles.inputLabel}>Total Tariff Cost (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 185000"
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <Text style={styles.inputLabel}>HMO Provider</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hygeia HMO"
              value={newHmo}
              onChangeText={setNewHmo}
            />

            <View style={styles.modalBtnRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                label="Generate Code"
                variant="primary"
                onPress={handleGenerateBill}
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
  operatorCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  operatorRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  operatorName: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  operatorRole: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  facilityTag: { fontSize: 11, fontWeight: '600', color: colors.accent, marginTop: 1 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginRight: 4 },
  onlineText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  sectionHeading: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginVertical: spacing.xs },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  metricCard: { flex: 1, minWidth: '45%', padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, ...shadow.sm },
  metricLabel: { fontSize: 11, color: colors.textTertiary },
  metricVal: { fontSize: 18, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: 2 },
  queueHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  generateBtnText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  queueCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  queueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientName: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  serviceText: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  hmoTag: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  statusTag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  tagYellow: { backgroundColor: '#FEF3C7' },
  textYellow: { color: '#92400E' },
  tagBlue: { backgroundColor: '#DBEAFE' },
  textBlue: { color: '#1E40AF' },
  tagGreen: { backgroundColor: '#DCFCE7' },
  textGreen: { color: '#166534' },
  queueFinancials: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  finLabel: { fontSize: 10, color: colors.textTertiary },
  finVal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
  codesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  billCodeBig: { fontSize: 14, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), fontWeight: '700', color: colors.accent },
  codeMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  codeAmount: { fontSize: 13, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  claimedText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
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
