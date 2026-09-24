import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { colors, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, ScreenHeader, ProgressBar, Divider, Chip } from '../../components';





type NavProp = NativeStackNavigationProp<RootStackParamList, 'RxPharmacy'>;
type RouteProps = RouteProp<RootStackParamList, 'RxPharmacy'>;

export const RxPharmacyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { lang, rxOrders, toggleRxItemOption } = useStore();
  const t = COPY[lang] || COPY.en;

  const orderId = route.params?.orderId;
  const activeOrder = rxOrders.find(o => !orderId || o.id === orderId) || rxOrders[0];

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t.rxPharmacyTitle} onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No prescription orders found.</Text>
        </View>
      </View>
    );
  }

  // Calculate current totals based on active selections
  const currentTotalCost = activeOrder.items.reduce((sum, item) => {
    return sum + (item.selectedOption === 'generic' ? item.genericPrice : item.brandPrice);
  }, 0);

  const currentPatientPsp = activeOrder.items.reduce((sum, item) => {
    return sum + (item.selectedOption === 'generic' ? item.pspGeneric : item.pspBrand);
  }, 0);

  const currentHmoCover = activeOrder.items.reduce((sum, item) => {
    return sum + (item.selectedOption === 'generic' ? item.hmoCoverGeneric : item.hmoCoverBrand);
  }, 0);

  const handleToggle = (itemId: string) => {
    Haptics.selectionAsync();
    toggleRxItemOption(activeOrder.id, itemId);
  };

  const handleAuthorizeDispense = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Prescription Dispensed ✓',
      'The hospital pharmacy has received your authorized dispense selection. Patient Responsibility: ' + NAIRA(0) + ' (HMO covers ' + NAIRA(0) + ').'
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t.rxPharmacyTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor & Prescription Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.doctorName}>{activeOrder.doctorName}</Text>
              <Text style={styles.clinicName}>{activeOrder.clinicName}</Text>
            </View>
            <Text style={styles.orderDate}>{activeOrder.date}</Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Savings Callout Box */}
          <View style={styles.savingsBox}>
            <View style={styles.savingsIconBadge}>
              <Text style={styles.savingsIcon}>₦</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.savingsTitle}>{t.potentialSavings}</Text>
              <Text style={styles.savingsAmount}>Save up to {NAIRA(activeOrder.savingsWithGeneric)}</Text>
              <Text style={styles.savingsDesc}>
                Switching to NAFDAC-approved generic equivalents qualifies for 100% HMO formulary coverage (₦0 Patient Self-Pay)!
              </Text>
            </View>
          </View>
        </Card>

        {/* Prescription Items */}
        <Text style={styles.sectionHeading}>Prescribed Medications ({activeOrder.items.length})</Text>
        <Text style={styles.sectionSub}>Choose between prescribed brand name and certified bioequivalent generic:</Text>

        {activeOrder.items.map((item, idx) => {
          const isGeneric = item.selectedOption === 'generic';
          return (
            <Card key={item.id || idx} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemDosage}>{item.dosage}</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{item.formularyTier}</Text>
                </View>
              </View>

              {/* Generic Option (Recommended) */}
              <TouchableOpacity
                style={[styles.optionRow, isGeneric && styles.optionRowSelected]}
                onPress={() => handleToggle(item.id)}
              >
                <View style={[styles.radioCircle, isGeneric && styles.radioCircleSelected]}>
                  {isGeneric && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <View style={styles.labelBadgeRow}>
                    <Text style={styles.genericTitle}>{item.genericName}</Text>
                    <View style={styles.nafdacBadge}>
                      <Text style={styles.nafdacText}>NAFDAC {item.nafdacRegNo}</Text>
                    </View>
                  </View>
                  <Text style={styles.optionSub}>Bioequivalent Generic · 100% HMO Formulary</Text>
                  <View style={styles.costBreakRow}>
                    <Text style={styles.costTotal}>Total: {NAIRA(item.genericPrice)}</Text>
                    <Text style={styles.costHmo}>HMO: -{NAIRA(item.hmoCoverGeneric)}</Text>
                    <Text style={styles.costPspZero}>You pay: {NAIRA(item.pspGeneric)}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Brand Option */}
              <TouchableOpacity
                style={[styles.optionRow, !isGeneric && styles.optionRowSelected, { marginTop: spacing.xs }]}
                onPress={() => handleToggle(item.id)}
              >
                <View style={[styles.radioCircle, !isGeneric && styles.radioCircleSelected]}>
                  {!isGeneric && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.brandTitle}>{item.brandName}</Text>
                  <Text style={styles.optionSub}>Original Prescribed Brand Name</Text>
                  <View style={styles.costBreakRow}>
                    <Text style={styles.costTotal}>Total: {NAIRA(item.brandPrice)}</Text>
                    <Text style={styles.costHmo}>HMO: -{NAIRA(item.hmoCoverBrand)}</Text>
                    <Text style={styles.costPsp}>You pay: {NAIRA(item.pspBrand)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}

        {/* Live Reconciled Total Card */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalHeading}>Prescription Summary</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Total Pharmacy Cost:</Text>
            <Text style={styles.summaryVal}>{NAIRA(currentTotalCost)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>HMO Contribution:</Text>
            <Text style={[styles.summaryVal, { color: colors.accent }]}>-{NAIRA(currentHmoCover)}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.xs }} />
          <View style={styles.summaryLine}>
            <Text style={styles.summaryPspLabel}>Patient Self-Pay (PSP):</Text>
            <Text style={styles.summaryPspVal}>{NAIRA(currentPatientPsp)}</Text>
          </View>
        </Card>

        {/* Dispense CTA */}
        <Button
          label="Authorize Pharmacy Dispense"
          variant="primary"
          onPress={handleAuthorizeDispense}
          style={{ marginVertical: spacing.md }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  doctorName: { fontSize: 16, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  clinicName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  orderDate: { fontSize: 11, color: colors.textTertiary },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  savingsIconBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  savingsIcon: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  savingsTitle: { fontSize: 12, fontWeight: '700', color: '#166534' },
  savingsAmount: { fontSize: 16, fontFamily: 'SourceSerif4_700Bold', color: '#166534', marginTop: 1 },
  savingsDesc: { fontSize: 11, color: '#166534', marginTop: 2, lineHeight: 15 },
  sectionHeading: { fontSize: 15, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginTop: spacing.xs },
  sectionSub: { fontSize: 12, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sm },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  itemDosage: { fontSize: 11, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), color: colors.textTertiary },
  tierBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tierText: { fontSize: 10, fontWeight: '600', color: colors.accent },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F0F9FA',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioCircleSelected: { borderColor: colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  labelBadgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  genericTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  brandTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  nafdacBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nafdacText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  optionSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  costBreakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' },
  costTotal: { fontSize: 11, color: colors.textTertiary },
  costHmo: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  costPsp: { fontSize: 12, fontFamily: 'SourceSerif4_700Bold', color: colors.danger },
  costPspZero: { fontSize: 12, fontFamily: 'SourceSerif4_700Bold', color: '#16A34A' },
  totalCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    ...shadow.sm,
  },
  totalHeading: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary },
  summaryVal: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  summaryPspLabel: { fontSize: 14, fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  summaryPspVal: { fontSize: 16, fontFamily: 'SourceSerif4_700Bold', color: colors.accent },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textTertiary },
});
