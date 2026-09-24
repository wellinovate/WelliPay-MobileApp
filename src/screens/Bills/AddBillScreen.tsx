import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenHeader, Button, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { Bill } from '../../state/seed';
import { ProviderInvoiceModal, ProviderInvoiceData } from './ProviderInvoiceModal';
import { COPY } from '../../state/copy';
import { hapticSuccess, hapticError } from '../../utils/haptics';

export default function AddBillScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills } = store;
  const t = COPY[lang] || COPY.en;

  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'scan'|'manual'>('scan');
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [scannedInvoice, setScannedInvoice] = useState<ProviderInvoiceData | null>(null);

  const handleOpenProviderInvoice = (mode: 'outstanding' | 'cleared') => {
    hapticSuccess();
    setScanned(true);
    const invoice: ProviderInvoiceData = {
      invoiceNo: mode === 'outstanding' ? 'INV-2026-LGH-8821' : 'INV-2026-LGH-9904',
      facility: 'Lagoon Hospital Ikoyi',
      cashierDesk: 'Cashier Unit 3 (Ground Floor, Wing B)',
      patientName: 'Amina Bello',
      patientPhone: '+234 803 123 4567',
      patientEmail: 'amina.bello@gmail.com',
      providerWhatsApp: '+234 809 999 8822',
      providerEmail: 'billing@lagoonhospitals.com',
      customerCarePhone: '+234 1 271 2345',
      date: '24 Sep 2026',
      totalCharges: 100000,
      hmoCovered: mode === 'outstanding' ? 80000 : 100000,
      hmoProvider: 'Hygeia HMO',
      depositApplied: 0,
      patientSelfPay: mode === 'outstanding' ? 20000 : 0,
      status: mode === 'outstanding' ? 'outstanding' : 'cleared',
      gatePassCode: 'WP-PASS-LAG-2026-8812',
      items: [
        { description: 'Inpatient Room & Board (Ward 3)', amount: 45000 },
        { description: 'Attending Physician & Ward Rounds', amount: 20000 },
        { description: 'Prescription Infusions & Antibiotics', amount: 25000 },
        { description: 'Pathology Diagnostics & Electrolytes', amount: 10000 },
      ],
    };
    setScannedInvoice(invoice);
    setInvoiceModalVisible(true);
  };

  const processBillCode = (rawCode: string) => {
    // Check if QR code is a WelliPay Provider Invoice payload
    if (rawCode.includes('wellipay_provider_invoice') || rawCode.includes('INV-') || rawCode.includes('provider')) {
      try {
        if (rawCode.startsWith('{')) {
          const parsed = JSON.parse(rawCode);
          const invoice: ProviderInvoiceData = {
            invoiceNo: parsed.invoiceNo || 'INV-2026-LGH-8821',
            facility: parsed.facility || 'Lagoon Hospital Ikoyi',
            cashierDesk: parsed.cashierDesk || 'Cashier Unit 3 (Ground Floor, Wing B)',
            patientName: parsed.patientName || 'Amina Bello',
            patientPhone: parsed.patientPhone || '+234 803 123 4567',
            patientEmail: parsed.patientEmail || 'amina.bello@gmail.com',
            providerWhatsApp: parsed.providerWhatsApp || '+234 809 999 8822',
            providerEmail: parsed.providerEmail || 'billing@lagoonhospitals.com',
            customerCarePhone: parsed.customerCarePhone || '+234 1 271 2345',
            date: parsed.date || '24 Sep 2026',
            totalCharges: parsed.totalCharges || 100000,
            hmoCovered: parsed.hmoCovered || 80000,
            hmoProvider: parsed.hmoProvider || 'Hygeia HMO',
            depositApplied: parsed.depositApplied || 0,
            patientSelfPay: parsed.patientSelfPay !== undefined ? parsed.patientSelfPay : 20000,
            status: (parsed.patientSelfPay === 0) ? 'cleared' : 'outstanding',
            gatePassCode: parsed.gatePassCode || 'WP-PASS-LAG-2026-8812',
            items: parsed.items || [
              { description: 'Inpatient Clinical Care (Ward 3)', amount: 45000 },
              { description: 'Attending Physician & Ward Rounds', amount: 20000 },
              { description: 'Prescription Infusions & Antibiotics', amount: 25000 },
              { description: 'Pathology Diagnostics & Electrolytes', amount: 10000 },
            ],
          };
          hapticSuccess();
          setScannedInvoice(invoice);
          setInvoiceModalVisible(true);
          setScanned(false);
          return;
        }
      } catch (e) {
        // fallback
      }
    }

    let clean = rawCode.trim().toUpperCase();
    if (clean.startsWith('{')) {
      try {
        const parsed = JSON.parse(clean);
        clean = (parsed.billNo || clean).toUpperCase();
      } catch (e) {
        // use raw
      }
    }

    if (!clean) return;

    if (clean.startsWith('EXP')) {
      hapticError();
      setErr(t.billExpired);
      setScanned(false);
      return;
    }

    if (bills.some(b => b.billNo.replace(/-/g, '') === clean.replace(/-/g, ''))) {
      hapticError();
      setErr(t.billAlreadyAdded);
      setScanned(false);
      return;
    }

    const dateStr = new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
    const newBill: Bill = {
      id: 'b_' + Date.now(),
      billNo: clean,
      facility: clean.includes('DH') ? 'Doma Hospital, Lagos' : (clean.includes('LUTH') ? 'LUTH, Idi-Araba' : 'St. Nicholas Hospital, Lagos'),
      personId: store.activePerson,
      date: dateStr,
      amountTotal: 34500,
      amountDue: 34500,
      minPart: 5000,
      status: 'unpaid',
      lines: [
        { name: 'Consultation & Clinical Assessment', qty: 1, price: 12000, total: 12000 },
        { name: 'Diagnostic Lab Tests (FBC, Malaria Pf)', qty: 1, price: 15500, total: 15500 },
        { name: 'Prescription Medication Dispensation', qty: 1, price: 7000, total: 7000 },
      ],
    };
    store.addBill(newBill);

    hapticSuccess();
    setSuccess(true);
    setTimeout(() => navigation.goBack(), 1400);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || success) return;
    setScanned(true);
    processBillCode(data);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.addBillTitle} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        {!success ? (
          mode === 'scan' ? (
            <View style={styles.scanContainer}>
              {permission && permission.granted ? (
                <View style={styles.cameraBox}>
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torch}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  />

                  {/* Viewfinder overlay */}
                  <View style={styles.overlay}>
                    <View style={styles.targetFrame}>
                      <View style={[styles.corner, styles.tl]} />
                      <View style={[styles.corner, styles.tr]} />
                      <View style={[styles.corner, styles.bl]} />
                      <View style={[styles.corner, styles.br]} />
                    </View>
                  </View>

                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      style={styles.torchBtn}
                      onPress={() => setTorch(t => !t)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.torchText}>{torch ? '🔦 Torch On' : '💡 Torch Off'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.permissionBox}>
                  <Text style={styles.permIcon}>📷</Text>
                  <Text style={styles.permTitle}>Camera Permission</Text>
                  <Text style={styles.permSub}>
                    Allow camera access to instantly scan hospital bills and WelliRecord QR codes.
                  </Text>
                  <Button
                    label="Grant Camera Access"
                    onPress={requestPermission}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}

              <Text style={styles.scanHelpText}>{t.scanFrameHelp}</Text>

              {/* Provider QR Scanner Test Actions */}
              <View style={styles.providerDemoBox}>
                <Text style={styles.providerDemoHeading}>Simulate Provider QR Scan:</Text>
                <TouchableOpacity
                  style={[styles.providerDemoBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                  onPress={() => handleOpenProviderInvoice('outstanding')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.providerDemoBtnText, { color: '#92400E' }]}>
                    🚨 Scan Provider QR (Outstanding ₦20,000 Balance)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.providerDemoBtn, { backgroundColor: '#DCFCE7', borderColor: '#10B981' }]}
                  onPress={() => handleOpenProviderInvoice('cleared')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.providerDemoBtnText, { color: '#065F46' }]}>
                    🟢 Scan Provider QR (100% HMO Covered / ₦0 Due)
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setMode('manual')}
                style={styles.switchLink}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>{t.enterCodeInstead}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.manualContainer}>
              <Text style={styles.fieldLabel}>{t.billCode}</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={v => { setCode(v.toUpperCase()); setErr(''); }}
                placeholder="DH-99999"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                returnKeyType="done"
                autoFocus
              />
              {err ? <Banner message={err} variant="err" style={{ marginTop: spacing.sm }} /> : null}

              <Text style={styles.demoKicker}>Try Demo Codes:</Text>
              <View style={styles.demoRow}>
                {[
                  { label: t.demoValid, val: 'DH-99999' },
                  { label: t.demoExpired, val: 'EXP-0001' },
                  { label: t.demoAlready, val: 'DH-88213' },
                ].map((demo, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.demoChip}
                    onPress={() => { setCode(demo.val); setErr(''); }}
                  >
                    <Text style={styles.demoBtn}>{demo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setMode('scan')}
                style={styles.switchLink}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>← Switch back to QR Scanner</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.successBox}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successText}>{t.billAdded}</Text>
            <Text style={styles.successSub}>Opening bill details…</Text>
          </View>
        )}
      </View>

      {mode === 'manual' && !success && (
        <View style={styles.footer}>
          <Button label={t.continue} onPress={() => processBillCode(code)} fullWidth />
        </View>
      )}
      {/* Provider Invoice & Clearance Modal */}
      <ProviderInvoiceModal
        visible={invoiceModalVisible}
        onClose={() => {
          setInvoiceModalVisible(false);
          setScanned(false);
        }}
        invoiceData={scannedInvoice}
        onViewWelliPass={(gateCode) => {
          navigation.navigate('WelliPass', { passId: 'wp1' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  scanContainer: { flex: 1, alignItems: 'center' },
  cameraBox: {
    width: '100%',
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFF',
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraControls: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  torchBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  torchText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: '600' },
  permissionBox: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    textAlign: 'center',
  },
  permIcon: { fontSize: 44, marginBottom: spacing.sm },
  permTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  permSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  scanHelpText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  switchLink: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  switchText: { fontSize: fontSize.base, color: colors.accent, fontWeight: '600' },
  manualContainer: { flex: 1 },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    letterSpacing: 2,
    fontFamily: 'SourceSerif4_400Regular',
  },
  demoKicker: { fontSize: fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', marginTop: spacing.xl, marginBottom: spacing.xs, fontWeight: '600' },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  demoChip: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  demoBtn: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: { fontSize: 40, color: colors.accent, fontWeight: '700' },
  successText: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  successSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  providerDemoBox: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  providerDemoHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerDemoBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 6,
    alignItems: 'center',
  },
  providerDemoBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});