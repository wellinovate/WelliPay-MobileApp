import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, radius, shadow } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { Button, Card, Divider } from '../../components';
import { QRCodeView } from '../../components/QRCodeView';
import { generateReceiptPdf } from '../../utils/pdfGenerator';
import { useStore } from '../../state/store';

export interface ProviderInvoiceData {
  invoiceNo: string;
  facility: string;
  cashierDesk: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  providerWhatsApp: string;
  providerEmail: string;
  customerCarePhone: string;
  date: string;
  totalCharges: number;
  hmoCovered: number;
  hmoProvider: string;
  depositApplied: number;
  patientSelfPay: number;
  status: 'outstanding' | 'cleared';
  gatePassCode: string;
  items: Array<{ description: string; amount: number }>;
}

interface ProviderInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  invoiceData: ProviderInvoiceData | null;
  onViewWelliPass?: (gatePassCode: string) => void;
}

export const ProviderInvoiceModal: React.FC<ProviderInvoiceModalProps> = ({
  visible,
  onClose,
  invoiceData,
  onViewWelliPass,
}) => {
  const { wallets, activePerson, topupWallet } = useStore();
  const currentWallet = wallets[activePerson] || 0;

  const [localStatus, setLocalStatus] = useState<'outstanding' | 'cleared'>('outstanding');
  const [paying, setPaying] = useState(false);
  const [showCashierRouting, setShowCashierRouting] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);

  // Sync status when invoice changes
  React.useEffect(() => {
    if (invoiceData) {
      setLocalStatus(invoiceData.status);
      setShowCashierRouting(false);
      setNotificationsSent(invoiceData.status === 'cleared');
    }
  }, [invoiceData]);

  if (!invoiceData) return null;

  const isCleared = localStatus === 'cleared';
  const outstandingPsp = isCleared ? 0 : invoiceData.patientSelfPay;

  const handlePayNow = () => {
    if (currentWallet < outstandingPsp) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `Your WelliPay wallet has ${NAIRA(currentWallet)}, but the outstanding patient responsibility is ${NAIRA(outstandingPsp)}. You can top up or proceed to the Cashier Desk.`,
        [
          { text: 'Cashier Desk Option', onPress: () => setShowCashierRouting(true) },
          { text: 'OK' },
        ]
      );
      return;
    }

    setPaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      // Deduct from store wallet
      topupWallet(activePerson, -outstandingPsp);

      // Update state
      setLocalStatus('cleared');
      setNotificationsSent(true);
      setPaying(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Payment Cleared ✓',
        `Patient responsibility of ${NAIRA(outstandingPsp)} cleared successfully via WelliPay Wallet. WhatsApp & Email clearance notifications dispatched to both parties.`
      );
    }, 800);
  };

  const handleSimulateCashierClearance = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLocalStatus('cleared');
    setNotificationsSent(true);
    setShowCashierRouting(false);
    Alert.alert(
      'Cashier Desk Settlement Certified ✓',
      `Cashier Desk 3 recorded payment. Official clearance certificate and gate pass issued. Notifications dispatched to Patient and Hospital.`
    );
  };

  const handleShareWhatsAppClearance = async () => {
    Haptics.selectionAsync();
    const text = `🏥 *WELLIPAY CLEARANCE CERTIFICATE*\n\n` +
      `*Facility:* ${invoiceData.facility}\n` +
      `*Invoice Ref:* ${invoiceData.invoiceNo}\n` +
      `*Patient:* ${invoiceData.patientName}\n` +
      `*Total Healthcare Bill:* ${NAIRA(invoiceData.totalCharges)}\n` +
      `*HMO Coverage (${invoiceData.hmoProvider}):* ${NAIRA(invoiceData.hmoCovered)}\n` +
      `*Patient Self-Pay (PSP):* ${NAIRA(invoiceData.patientSelfPay)} (CLEARED)\n` +
      `*Discharge Gate Pass:* ${invoiceData.gatePassCode}\n\n` +
      `*Status:* 100% CLEARED & RECONCILED. Patient is authorized for facility exit.\n` +
      `Verified by WelliPay Healthcare Settlement Network.`;

    const encoded = encodeURIComponent(text);
    const waUrl = `whatsapp://send?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        await Linking.openURL(waUrl);
      } else {
        await Share.share({ message: text, title: 'WelliPay Hospital Clearance' });
      }
    } catch {
      await Share.share({ message: text, title: 'WelliPay Hospital Clearance' });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      Haptics.selectionAsync();
      await generateReceiptPdf({
        ref: invoiceData.invoiceNo,
        facility: invoiceData.facility,
        personName: invoiceData.patientName,
        amountPaid: invoiceData.patientSelfPay,
        remainingBalance: 0,
        method: 'WelliPay Instant Clearing',
        billNo: invoiceData.invoiceNo,
        hmoProvider: invoiceData.hmoProvider,
        hmoCovered: invoiceData.hmoCovered,
        patientSelfPay: invoiceData.patientSelfPay,
        totalHealthcareCost: invoiceData.totalCharges,
        date: invoiceData.date,
      });
    } catch (err: any) {
      Alert.alert('PDF Error', err.message || 'Could not generate statement');
    }
  };

  const qrPayload = `https://wellipay.ng/verify/invoice?ref=${invoiceData.invoiceNo}&patient=${encodeURIComponent(invoiceData.patientName)}&facility=${encodeURIComponent(invoiceData.facility)}&status=${isCleared ? 'CLEARED' : 'PENDING'}&gateCode=${invoiceData.gatePassCode}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Grab Handle */}
          <View style={styles.grabBar} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>PROVIDER SETTLEMENT INVOICE</Text>
                <Text style={styles.facilityName}>{invoiceData.facility}</Text>
                <Text style={styles.invoiceMeta}>
                  Invoice: {invoiceData.invoiceNo} · {invoiceData.date}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status Hero Card */}
            {isCleared ? (
              <Card style={styles.clearedHeroCard}>
                <View style={styles.clearedBadgeRow}>
                  <View style={styles.clearedPill}>
                    <View style={styles.greenDot} />
                    <Text style={styles.clearedPillText}>INVOICE CLEARED · GATE PASS ACTIVE</Text>
                  </View>
                  <Text style={styles.gateCodeBadge}>{invoiceData.gatePassCode}</Text>
                </View>

                <Text style={styles.clearedTitle}>All Charges Settled & Reconciled</Text>
                <Text style={styles.clearedSubtitle}>
                  Zero patient responsibility remaining. HMO tariff and patient self-pay verified.
                </Text>

                {/* Real SCANNABLE Gate Pass QR Code */}
                <View style={styles.qrCardWrap}>
                  <QRCodeView
                    value={qrPayload}
                    size={170}
                    color={{ dark: '#08716D', light: '#FFFFFF' }}
                    logo={require('../../../assets/wellipay-mark.png')}
                    logoSize={34}
                  />
                  <Text style={styles.qrScanHelp}>
                    Scan with hospital security scanner or phone camera for exit gate clearance.
                  </Text>
                </View>
              </Card>
            ) : (
              <Card style={styles.outstandingHeroCard}>
                <View style={styles.warningPill}>
                  <Text style={styles.warningPillText}>🚨 OUTSTANDING BALANCE FLAGGED</Text>
                </View>
                <Text style={styles.outstandingAmountText}>{NAIRA(outstandingPsp)}</Text>
                <Text style={styles.outstandingDesc}>
                  Patient Self-Pay (PSP) balance must be settled before WelliPass hospital discharge gate clearance is unlocked.
                </Text>
              </Card>
            )}

            {/* Financial Adjudication Table */}
            <Card style={styles.breakdownCard}>
              <Text style={styles.tableHeading}>Settlement Adjudication</Text>

              {invoiceData.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemVal}>{NAIRA(item.amount)}</Text>
                </View>
              ))}

              <Divider style={{ marginVertical: spacing.sm }} />

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Total Healthcare Bill</Text>
                <Text style={styles.calcVal}>{NAIRA(invoiceData.totalCharges)}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.brandTeal }]}>
                  HMO Cover ({invoiceData.hmoProvider})
                </Text>
                <Text style={[styles.calcVal, { color: colors.brandTeal }]}>
                  -{NAIRA(invoiceData.hmoCovered)}
                </Text>
              </View>

              {invoiceData.depositApplied > 0 && (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Pre-Service Deposit Applied</Text>
                  <Text style={styles.calcVal}>-{NAIRA(invoiceData.depositApplied)}</Text>
                </View>
              )}

              <Divider style={{ marginVertical: spacing.sm }} />

              <View style={styles.calcRow}>
                <Text style={styles.totalPspLabel}>Patient Responsibility (PSP)</Text>
                <Text style={[styles.totalPspVal, !isCleared && { color: colors.danger }]}>
                  {isCleared ? '₦0 (Settled)' : NAIRA(outstandingPsp)}
                </Text>
              </View>
            </Card>

            {/* Conditional Flow: Outstanding Balance Actions */}
            {!isCleared && (
              <View style={{ marginTop: spacing.sm }}>
                <View style={styles.walletBar}>
                  <Text style={styles.walletBarLabel}>Your WelliPay Wallet Balance:</Text>
                  <Text style={styles.walletBarVal}>{NAIRA(currentWallet)}</Text>
                </View>

                <Button
                  label={paying ? 'Clearing Invoice...' : `Pay Balance Now (${NAIRA(outstandingPsp)})`}
                  variant="primary"
                  onPress={handlePayNow}
                  fullWidth
                  style={{ marginBottom: spacing.sm }}
                />

                <Button
                  label="Proceed to Cashier / Customer Care Unit"
                  variant="secondary"
                  onPress={() => setShowCashierRouting(!showCashierRouting)}
                  fullWidth
                />

                {/* Cashier Routing Sub-card */}
                {showCashierRouting && (
                  <Card style={styles.cashierRoutingCard}>
                    <Text style={styles.cashierRoutingTitle}>📍 Cashier Desk & Customer Care Routing</Text>
                    <Text style={styles.cashierRoutingDesc}>
                      If you prefer to pay in cash, use POS card swipe, or resolve tariff questions:
                    </Text>

                    <View style={styles.routingInfoRow}>
                      <Text style={styles.routingInfoLabel}>Assigned Desk:</Text>
                      <Text style={styles.routingInfoVal}>{invoiceData.cashierDesk}</Text>
                    </View>

                    <View style={styles.routingInfoRow}>
                      <Text style={styles.routingInfoLabel}>Desk Token:</Text>
                      <Text style={[styles.routingInfoVal, { color: colors.brandNavy, fontWeight: '700' }]}>
                        #CSH-DESK-03
                      </Text>
                    </View>

                    <View style={styles.routingInfoRow}>
                      <Text style={styles.routingInfoLabel}>Customer Care Hotline:</Text>
                      <Text style={styles.routingInfoVal}>{invoiceData.customerCarePhone}</Text>
                    </View>

                    <Button
                      label="Simulate Cashier Counter Settlement"
                      variant="ghost"
                      onPress={handleSimulateCashierClearance}
                      style={{ marginTop: spacing.sm }}
                    />
                  </Card>
                )}
              </View>
            )}

            {/* Cleared State: Multi-Party Notification Delivery Status */}
            {isCleared && notificationsSent && (
              <Card style={styles.notificationsCard}>
                <Text style={styles.notifHeading}>Multi-Party Notification Engine</Text>
                <Text style={styles.notifSub}>
                  Official clearance notes and digital invoices dispatched to both parties:
                </Text>

                <View style={styles.notifItem}>
                  <Text style={styles.notifIcon}>💬</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifParty}>Patient WhatsApp ({invoiceData.patientPhone})</Text>
                    <Text style={styles.notifMessage}>
                      "🏥 Invoice #{invoiceData.invoiceNo} cleared! Gate pass {invoiceData.gatePassCode} issued."
                    </Text>
                    <Text style={styles.notifStatusTag}>✓ Delivered</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: spacing.xs }} />

                <View style={styles.notifItem}>
                  <Text style={styles.notifIcon}>✉️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifParty}>Patient Email ({invoiceData.patientEmail})</Text>
                    <Text style={styles.notifMessage}>
                      Subject: Official WelliPay Clearance Note & Receipt — #{invoiceData.invoiceNo}
                    </Text>
                    <Text style={styles.notifStatusTag}>✓ Sent</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: spacing.xs }} />

                <View style={styles.notifItem}>
                  <Text style={styles.notifIcon}>🏥</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifParty}>Provider WhatsApp ({invoiceData.providerWhatsApp})</Text>
                    <Text style={styles.notifMessage}>
                      "Patient {invoiceData.patientName} has settled #{invoiceData.invoiceNo}. Security exit cleared."
                    </Text>
                    <Text style={styles.notifStatusTag}>✓ Delivered to Lagoon Hospital Cashier Desk</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: spacing.xs }} />

                <View style={styles.notifItem}>
                  <Text style={styles.notifIcon}>📋</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifParty}>Hospital Billing Email ({invoiceData.providerEmail})</Text>
                    <Text style={styles.notifMessage}>
                      Reconciled Claims Remittance & Zero-PSP Ledger attached.
                    </Text>
                    <Text style={styles.notifStatusTag}>✓ Logged to Hospital EMR</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.clearedActionsRow}>
                  <Button
                    label="Share WhatsApp Clearance Note"
                    variant="primary"
                    onPress={handleShareWhatsAppClearance}
                    fullWidth
                    style={{ marginBottom: spacing.xs }}
                  />
                  <Button
                    label="Download Official Medical PDF"
                    variant="secondary"
                    onPress={handleDownloadPdf}
                    fullWidth
                    style={{ marginBottom: spacing.xs }}
                  />
                  {onViewWelliPass && (
                    <Button
                      label="View Full WelliPass Gate Screen"
                      variant="ghost"
                      onPress={() => {
                        onClose();
                        onViewWelliPass(invoiceData.gatePassCode);
                      }}
                      fullWidth
                    />
                  )}
                </View>
              </Card>
            )}

            <Button
              label="Close"
              variant="ghost"
              onPress={onClose}
              fullWidth
              style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingTop: spacing.xs,
  },
  grabBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  kicker: {
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.brandTeal,
    fontWeight: '700',
  },
  facilityName: {
    fontSize: fontSize.xl,
    fontFamily: 'SourceSerif4_700Bold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  invoiceMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  clearedHeroCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    ...shadow.sm,
  },
  clearedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clearedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  clearedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  gateCodeBadge: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearedTitle: {
    fontSize: 16,
    fontFamily: 'SourceSerif4_700Bold',
    color: '#166534',
    marginTop: 4,
  },
  clearedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrCardWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  qrScanHelp: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 15,
  },
  outstandingHeroCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    alignItems: 'center',
    ...shadow.sm,
  },
  warningPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  warningPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  outstandingAmountText: {
    fontSize: fontSize.xxxl,
    fontFamily: 'SourceSerif4_700Bold',
    color: colors.danger,
    marginVertical: 4,
  },
  outstandingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    ...shadow.sm,
  },
  tableHeading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  itemVal: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calcVal: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  totalPspLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalPspVal: {
    fontSize: 15,
    fontFamily: 'SourceSerif4_700Bold',
    color: colors.textPrimary,
  },
  walletBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  walletBarLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  walletBarVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  cashierRoutingCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  cashierRoutingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: 4,
  },
  cashierRoutingDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 15,
  },
  routingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  routingInfoLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  routingInfoVal: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  notificationsCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  notifHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  notifSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  notifIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  notifParty: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifMessage: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  notifStatusTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  clearedActionsRow: {
    marginTop: spacing.md,
  },
});
