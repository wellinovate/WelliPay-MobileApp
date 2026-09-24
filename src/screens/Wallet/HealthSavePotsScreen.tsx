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
  Switch, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, ProgressBar, Divider, Chip } from '../../components';






type NavProp = NativeStackNavigationProp<RootStackParamList, 'HealthSavePots'>;

export const HealthSavePotsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { lang, healthSavePots, depositToHealthSavePot, togglePotRoundUp, addHealthSavePot } = useStore();
  const t = COPY[lang] || COPY.en;

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [potTitle, setPotTitle] = useState('');
  const [potCategory, setPotCategory] = useState<'Maternity' | 'Emergency' | 'Surgery' | 'Elderly Care' | 'Dental/Optical'>('Emergency');
  const [potTarget, setPotTarget] = useState('');
  const [potMonthly, setPotMonthly] = useState('');

  const totalSaved = healthSavePots.reduce((sum, p) => sum + p.currentAmount, 0);

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount.replace(/[^0-9.]/g, ''));
    if (!selectedPotId || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    depositToHealthSavePot(selectedPotId, amt, 'Manual direct deposit');
    setDepositModalVisible(false);
    setDepositAmount('');
    Alert.alert('Deposit Saved ✓', NAIRA(0) + ' deposited into your HealthSave Medical Pot.');
  };

  const handleCreatePot = () => {
    const tar = parseFloat(potTarget.replace(/[^0-9.]/g, ''));
    const mon = parseFloat(potMonthly.replace(/[^0-9.]/g, '')) || 0;
    if (!potTitle.trim() || isNaN(tar) || tar <= 0) {
      Alert.alert('Error', 'Please provide a title and target amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHealthSavePot({
      title: potTitle.trim(),
      category: potCategory,
      targetAmount: tar,
      monthlyContribution: mon,
      interestYieldAnnual: 11.5,
      roundUpEnabled: true,
      autoDeductDay: 28,
    });

    setCreateModalVisible(false);
    setPotTitle('');
    setPotTarget('');
    setPotMonthly('');
    Alert.alert('Pot Created ✓', 'New target medical pot active and earning 11.5% APY.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.healthSavePotsTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Savings Overview Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroKicker}>Total Medical Savings Stashed</Text>
          <Text style={styles.heroAmount}>{NAIRA(totalSaved)}</Text>

          <View style={styles.yieldBadgeRow}>
            <View style={styles.yieldPill}>
              <Text style={styles.yieldPillText}>★ 11.5% APY COMPOUND INTEREST</Text>
            </View>
            <Text style={styles.mfbTag}>Partnered with CBN-Licensed MFB</Text>
          </View>
        </Card>

        {/* Spare-Change Round-Up Explainer */}
        <Card style={styles.roundupCard}>
          <View style={styles.roundupRow}>
            <View style={styles.roundupIconBox}>
              <Text style={styles.roundupIcon}>⚡</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.roundupTitle}>{t.spareChangeRoundup}</Text>
              <Text style={styles.roundupDesc}>
                Automatically rounds up every hospital, pharmacy, and everyday card spend to the nearest ₦500 and saves the spare change into your Emergency Pot.
              </Text>
            </View>
          </View>
        </Card>

        {/* Active Medical Pots */}
        <View style={styles.potsHeaderRow}>
          <Text style={styles.sectionHeading}>Your Medical Pots ({healthSavePots.length})</Text>
          <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
            <Text style={styles.createPotLink}>+ New Pot</Text>
          </TouchableOpacity>
        </View>

        {healthSavePots.map((pot, idx) => {
          const progress = Math.min(100, Math.round((pot.currentAmount / pot.targetAmount) * 100));
          return (
            <Card key={pot.id || idx} style={styles.potCard}>
              <View style={styles.potTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.potTitle}>{pot.title}</Text>
                  <Text style={styles.potCategory}>{pot.category} · {pot.interestYieldAnnual}% Annual Yield</Text>
                </View>
                <View style={styles.roundupToggleBox}>
                  <Text style={styles.toggleLabel}>Round-up</Text>
                  <Switch
                    value={pot.roundUpEnabled}
                    onValueChange={() => {
                      Haptics.selectionAsync();
                      togglePotRoundUp(pot.id);
                    }}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>
              </View>

              <View style={styles.potAmountRow}>
                <Text style={styles.potSavedAmount}>{NAIRA(pot.currentAmount)}</Text>
                <Text style={styles.potTargetAmount}>Target: {NAIRA(pot.targetAmount)} ({progress}%)</Text>
              </View>

              <ProgressBar value={pot.currentAmount} max={pot.targetAmount} color={colors.accent} style={{ marginVertical: spacing.xs }} />

              <View style={styles.potBottomRow}>
                <Text style={styles.monthlyMeta}>Auto-save: {NAIRA(pot.monthlyContribution)}/mo</Text>
                <TouchableOpacity
                  style={styles.depositBtn}
                  onPress={() => {
                    setSelectedPotId(pot.id);
                    setDepositModalVisible(true);
                  }}
                >
                  <Text style={styles.depositBtnText}>+ Deposit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <Button
          label={t.createMedicalPot}
          variant="primary"
          onPress={() => setCreateModalVisible(true)}
          style={{ marginVertical: spacing.md }}
        />
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={depositModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Deposit into Medical Pot</Text>
            <Text style={styles.modalSub}>Transfer funds directly from your WelliPay wallet to earn daily interest:</Text>

            <Text style={styles.inputLabel}>Deposit Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />

            <View style={styles.modalBtnRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setDepositModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                label="Deposit Now"
                variant="primary"
                onPress={handleDeposit}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Pot Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Target Medical Pot</Text>
            <Text style={styles.modalSub}>Set up a dedicated healthcare piggy bank for upcoming treatments:</Text>

            <Text style={styles.inputLabel}>Pot Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maternity & Delivery Fund"
              value={potTitle}
              onChangeText={setPotTitle}
            />

            <Text style={styles.inputLabel}>Target Goal (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100000"
              keyboardType="numeric"
              value={potTarget}
              onChangeText={setPotTarget}
            />

            <Text style={styles.inputLabel}>Monthly Contribution (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10000"
              keyboardType="numeric"
              value={potMonthly}
              onChangeText={setPotMonthly}
            />

            <View style={styles.modalBtnRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setCreateModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                label="Start Pot"
                variant="primary"
                onPress={handleCreatePot}
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
  heroKicker: { fontSize: 11, color: colors.textTertiary },
  heroAmount: { fontSize: 28, fontFamily: 'SourceSerif4_700Bold', color: colors.accent, marginVertical: 2 },
  yieldBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  yieldPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  yieldPillText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  mfbTag: { fontSize: 11, color: colors.textTertiary },
  roundupCard: {
    backgroundColor: '#F0F9FA',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#CCECEF',
  },
  roundupRow: { flexDirection: 'row', alignItems: 'center' },
  roundupIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  roundupIcon: { fontSize: 16, color: '#FFFFFF' },
  roundupTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  roundupDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  potsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xs },
  sectionHeading: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  createPotLink: { fontSize: 13, fontWeight: '700', color: colors.accent },
  potCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  potTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  potTitle: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  potCategory: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  roundupToggleBox: { alignItems: 'flex-end' },
  toggleLabel: { fontSize: 10, color: colors.textTertiary, marginBottom: 2 },
  potAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  potSavedAmount: { fontSize: 18, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  potTargetAmount: { fontSize: 12, color: colors.textSecondary },
  potBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  monthlyMeta: { fontSize: 11, color: colors.textTertiary },
  depositBtn: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  depositBtnText: { fontSize: 12, fontWeight: '700', color: colors.accent },
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
