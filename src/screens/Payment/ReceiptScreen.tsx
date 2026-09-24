import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, Button, Divider } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, methodLabel, fmtDate, timeNow } from '../../utils/helpers';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';
import { hapticSuccess, hapticError, hapticLight } from '../../utils/haptics';

export default function ReceiptScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId, payMethod, lastPayRef, lastPayAmount, lastPayRemaining, activePerson, people, hmoPolicies, activeHmoId } = store as any;
  const t = COPY[lang] || COPY.en;

  const bill = bills.find((b: any) => b.id === payBillId);
  const person = people.find((p: any) => p.id === activePerson);
  const activeHmo = hmoPolicies.find((h: any) => h.id === activeHmoId);

  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    hapticLight();
    try {
      const pdfUri = await generateReceiptPdf({
        ref: lastPayRef || 'WP512340',
        facility: bill?.facility || 'Dovers Hospitals',
        personName: person?.name || 'Jay Umar',
        amountPaid: lastPayAmount || 20000,
        remainingBalance: lastPayRemaining,
        method: payMethod || 'card',
        billNo: bill?.billNo,
        hmoProvider: bill?.hasSplit ? (activeHmo?.provider || 'Hygeia HMO') : undefined,
        hmoCovered: bill?.hmoAmount,
      });
      hapticSuccess();
      await shareReceiptPdf(pdfUri);
    } catch (e: any) {
      hapticError();
      Alert.alert('Receipt Export', e.message || 'Could not export receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    hapticLight();
    try {
      const pdfUri = await generateReceiptPdf({
        ref: lastPayRef || 'WP512340',
        facility: bill?.facility || 'Dovers Hospitals',
        personName: person?.name || 'Jay Umar',
        amountPaid: lastPayAmount || 20000,
        remainingBalance: lastPayRemaining,
        method: payMethod || 'card',
        billNo: bill?.billNo,
        hmoProvider: bill?.hasSplit ? (activeHmo?.provider || 'Hygeia HMO') : undefined,
        hmoCovered: bill?.hmoAmount,
      });
      hapticSuccess();
      Alert.alert(
        'Receipt Downloaded',
        `Official medical receipt ${lastPayRef || 'WP512340'}.pdf is ready.\n\nWould you like to open or share it now?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Share PDF', onPress: () => shareReceiptPdf(pdfUri) },
        ]
      );
    } catch (e: any) {
      hapticError();
      Alert.alert('Receipt Download', e.message || 'Could not download receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.receiptTitle} onBack={() => navigation.navigate('MainTabs')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.ref}>{lastPayRef || 'WP512340'}</Text>
          <Text style={styles.date}>{fmtDate(new Date())} at {timeNow()}</Text>

          <Divider />

          {[
            [t.facilityLabel, bill?.facility || 'Dovers Hospitals'],
            [t.personLabel, person?.name || 'Jay Umar'],
            [t.methodLabel2, methodLabel(payMethod || 'card')],
          ].map(([label, val], i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.val} numberOfLines={2}>{val}</Text>
            </View>
          ))}

          {bill?.hasSplit && (
            <View style={styles.row}>
              <Text style={styles.label}>HMO Coverage</Text>
              <Text style={styles.val}>{activeHmo?.provider || 'Hygeia HMO'} ({NAIRA(bill.hmoAmount || 0)})</Text>
            </View>
          )}

          <Divider />

          <View style={styles.row}>
            <Text style={[styles.label, { fontWeight: '700' }]}>{t.amountPaid}</Text>
            <Text style={[styles.val, { fontWeight: '700', fontSize: fontSize.lg, color: colors.accent }]}>
              {NAIRA(lastPayAmount || 20000)}
            </Text>
          </View>

          {lastPayRemaining > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>{t.balanceLabel}</Text>
              <Text style={styles.val}>{NAIRA(lastPayRemaining)}</Text>
            </View>
          )}
        </Card>

        {/* Verification badge */}
        <View style={styles.qrBox}>
          <View style={styles.qrBadge}>
            <Text style={styles.qrCheck}>✓</Text>
          </View>
          <Text style={styles.qrRef}>VERIFIED BY CENTRAL BANK NIP & WELLIPAY</Text>
          <Text style={styles.qrSub}>{lastPayRef || 'WP512340'}-SECURE-SETTLEMENT</Text>
        </View>

        <View style={styles.btnRow}>
          <Button
            label={loading ? "Generating…" : t.share}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={handleShare}
            disabled={loading}
          />
          <Button
            label={loading ? "Saving…" : "Save PDF"}
            variant="primary"
            style={{ flex: 1 }}
            onPress={handleDownload}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginTop: spacing.xs },
  ref: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent, fontFamily: 'SourceSerif4_700Bold' },
  date: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: spacing.xs },
  label: { fontSize: fontSize.md, color: colors.textSecondary, flex: 1 },
  val: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
  qrBox: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.xs },
  qrBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  qrCheck: { fontSize: 24, color: colors.accent, fontWeight: '700' },
  qrRef: { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: '700', letterSpacing: 0.5 },
  qrSub: { fontSize: 10, color: colors.textTertiary },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
