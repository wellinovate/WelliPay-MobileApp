import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert,
} from 'react-native';
import { ScreenHeader, Card, StatusPill, Button, Banner, Divider } from '../../components';
import { colors, fontSize, spacing, radius, shadow } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';

export default function BillDetailScreen({ navigation }: any) {
  const {
    lang, bills, payBillId, setPaySession, hmoPolicies, activeHmoId,
    adjudicateHmoTariff, applyDepositToBill, fundPspWithHealthSave,
    requestFamilyPay, applyEmployerBenefit, savingsGoal, people,
  } = useStore();

  const activePolicy = hmoPolicies.find(p => p.id === activeHmoId) || hmoPolicies[0];
  const t = COPY[lang] || COPY.en;
  const bill = bills.find(b => b.id === payBillId);
  const [showAll, setShowAll] = useState(false);

  // Modals for Multi-Funding & Deposits
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositInput, setDepositInput] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [isPartialMode, setIsPartialMode] = useState(false);

  if (!bill) return null;

  const totalCost = bill.amountTotal;
  const hmoCover = bill.hmoAmount || 0;
  const psp = bill.patientSelfPay !== undefined ? bill.patientSelfPay : (bill.hasSplit ? bill.amountDue : totalCost);
  const depositPaid = bill.depositPaid || 0;
  const depositApplied = bill.depositApplied || 0;
  const refundCredit = bill.refundCredit || 0;
  const paidToDate = Math.max(0, psp - bill.amountDue);
  const amountDue = bill.amountDue;

  const canPay = ['unpaid', 'overdue', 'partly_paid', 'awaiting_hmo'].includes(bill.status) && amountDue > 0;
  const isPaid = bill.status === 'paid' || amountDue === 0;
  const visLines = showAll ? bill.lines : bill.lines.slice(0, 3);

  // PDF Generation for Patient Responsibility Statement (PRS)
  const handleShareStatement = async () => {
    hapticLight();
    try {
      const uri = await generateReceiptPdf({
        ref: bill.billNo,
        facility: bill.facility,
        personName: 'Jay Umar',
        amountPaid: paidToDate,
        remainingBalance: amountDue,
        method: bill.hasSplit ? 'Multi-Payer Settlement' : 'Hospital Statement',
        billNo: bill.billNo,
        hmoProvider: bill.hasSplit ? (activePolicy?.provider || 'HMO') : undefined,
        hmoCovered: hmoCover,
        patientSelfPay: psp,
        totalHealthcareCost: totalCost,
        depositApplied,
        depositPaid,
        refundCredit,
        hmoVariance: bill.reconciliation?.variance,
      });
      hapticSuccess();
      await shareReceiptPdf(uri);
    } catch (e: any) {
      hapticError();
      Alert.alert('PDF Error', 'Could not generate statement PDF.');
    }
  };

  const handleApplyHmoFirst = () => {
    hapticSuccess();
    adjudicateHmoTariff(bill.id);
    Alert.alert(
      'HMO Adjudicated Successfully',
      `Step 1: Patient ID verified (${activePolicy?.policyNo})
Step 2: Eligibility active
Step 3: Provider tariff applied
Step 4: HMO approved ${NAIRA(Math.round(totalCost * (1 - activePolicy.coPayPercent / 100)))}
Step 5: Patient Self-Pay set to ${NAIRA(Math.round(totalCost * (activePolicy.coPayPercent / 100)))}`
    );
  };

  const handleApplyDeposit = () => {
    const val = parseInt(depositInput.replace(/[^0-9]/g, '')) || 0;
    if (val <= 0) return;
    hapticSuccess();
    applyDepositToBill(bill.id, val);
    setShowDepositModal(false);
    setDepositInput('');
  };

  const handleHealthSaveFunding = () => {
    hapticSuccess();
    const coverAmt = Math.min(savingsGoal.saved, amountDue);
    fundPspWithHealthSave(bill.id, coverAmt);
    setShowFundingModal(false);
    Alert.alert('HealthSave Applied', `₦${coverAmt.toLocaleString()} deducted from your emergency health reserve.`);
  };

  const handleFamilyPayRequest = (sponsorName: string) => {
    hapticSuccess();
    requestFamilyPay(bill.id, sponsorName, amountDue);
    setShowFundingModal(false);
    Alert.alert('FamilyPay Requested', `A secure payment link for ₦${amountDue.toLocaleString()} was sent to ${sponsorName}.`);
  };

  const handleEmployerBenefit = () => {
    hapticSuccess();
    const coverAmt = Math.min(25000, amountDue);
    applyEmployerBenefit(bill.id, 'Sterling Healthcare Trust', coverAmt);
    setShowFundingModal(false);
    Alert.alert('Employer Benefit Applied', `₦${coverAmt.toLocaleString()} corporate health subsidy applied to bill.`);
  };

  const handlePay = () => {
    const amtToPay = isPartialMode && partialAmount ? parseInt(partialAmount.replace(/[^0-9]/g, '')) || amountDue : amountDue;
    setPaySession({
      payBillId: bill.id,
      payContext: 'bill',
      payAmountMode: isPartialMode ? 'part' : 'full',
      payPartAmount: isPartialMode ? String(amtToPay) : '',
    });
    navigation.navigate('Amount');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Header & Tagline Badge */}
        <View style={styles.taglineBadge}>
          <Text style={styles.taglineText}>WelliPay™ · One bill, every payer.</Text>
        </View>

        <Text style={styles.date}>{bill.date} · {bill.billNo}</Text>
        <Text style={styles.facility}>{bill.facility}</Text>
        <StatusPill status={bill.status} />

        {bill.status === 'void' && <Banner message={t.voidBanner} variant="err" style={{ marginTop: spacing.md }} />}
        {bill.changed && <Banner message={t.billChangedMsg} variant="warn" style={{ marginTop: spacing.md }} />}

        {/* Big Amount Card */}
        <View style={styles.bigAmountBox}>
          <Text style={styles.bigAmount}>{NAIRA(amountDue)}</Text>
          <Text style={styles.amtLabel}>
            {canPay ? 'Your Patient Self-Pay (PSP) Outstanding' : 'Total Healthcare Cost Settled'}
          </Text>
        </View>

        {/* STEP 1 to 5: HMO PROCESSED FIRST */}
        {!bill.hasSplit && canPay && (
          <Card style={styles.adjudicateCard}>
            <View style={styles.stepBadgeRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepKicker}>HMO PROCESSED FIRST</Text>
            </View>
            <Text style={styles.adjudicateTitle}>Adjudicate Primary Insurance Cover</Text>
            <Text style={styles.adjudicateDesc}>
              WelliPay verifies your member ID with <Text style={{ fontWeight: '700' }}>{activePolicy?.provider || 'HMO'}</Text>, applies hospital provider tariffs, and calculates your exact Patient Self-Pay (PSP) co-pay before you pay anything.
            </Text>
            <Button
              label={`Verify & Apply ${activePolicy?.provider || 'HMO'} Benefit`}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
              onPress={handleApplyHmoFirst}
            />
          </Card>
        )}

        {/* DUAL-PAYER & MULTI-PAYER BREAKDOWN TABLE */}
        <Card style={styles.breakdownCard}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>PATIENT RESPONSIBILITY BREAKDOWN</Text>
            {bill.hasSplit && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ HMO Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.breakdownTable}>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Total Healthcare Service Cost</Text>
              <Text style={styles.rowVal}>{NAIRA(totalCost)}</Text>
            </View>

            {hmoCover > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.rowLabel, { color: colors.accentDark }]}>
                  HMO Contribution ({activePolicy?.provider || 'HMO'})
                </Text>
                <Text style={[styles.rowVal, { color: colors.accentDark, fontWeight: '700' }]}>
                  -{NAIRA(hmoCover)}
                </Text>
              </View>
            )}

            {depositApplied > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.rowLabel, { color: colors.accent }]}>
                  Pre-Service Deposit Applied
                </Text>
                <Text style={[styles.rowVal, { color: colors.accent, fontWeight: '600' }]}>
                  -{NAIRA(depositApplied)}
                </Text>
              </View>
            )}

            <Divider style={{ marginVertical: spacing.xs }} />

            <View style={[styles.tableRow, styles.pspRow]}>
              <View>
                <Text style={styles.pspLabel}>{t.pspTitle || 'Patient Self-Pay (PSP)'}</Text>
                <Text style={styles.pspSub}>Confirmed patient responsibility</Text>
              </View>
              <Text style={styles.pspVal}>{NAIRA(psp)}</Text>
            </View>

            {paidToDate > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Amount Paid to Date</Text>
                <Text style={[styles.rowVal, { color: colors.accent }]}>-{NAIRA(paidToDate)}</Text>
              </View>
            )}

            <View style={[styles.tableRow, { marginTop: 4 }]}>
              <Text style={[styles.rowLabel, { fontWeight: '800', color: amountDue > 0 ? colors.danger : colors.accent }]}>
                Current Balance Due
              </Text>
              <Text style={[styles.rowVal, { fontWeight: '800', fontSize: fontSize.md, color: amountDue > 0 ? colors.danger : colors.accent }]}>
                {NAIRA(amountDue)}
              </Text>
            </View>
          </View>
        </Card>

        {/* PAYER ALLOCATIONS ACCORDION */}
        {bill.payerAllocations && bill.payerAllocations.length > 0 && (
          <Card style={styles.allocCard}>
            <Text style={styles.kicker}>PAYER ALLOCATIONS ("WHO PAYS WHAT")</Text>
            {bill.payerAllocations.map((alloc) => (
              <View key={alloc.id} style={styles.allocRow}>
                <View style={styles.allocInfo}>
                  <Text style={styles.allocName}>{alloc.payerName}</Text>
                  <Text style={styles.allocNotes}>
                    {alloc.approvalCode ? `Code: ${alloc.approvalCode} · ` : ''}{alloc.notes || alloc.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.allocAmountBox}>
                  <Text style={styles.allocAmount}>{NAIRA(alloc.allocatedAmount)}</Text>
                  <View style={[styles.allocPill, alloc.status === 'paid' ? styles.pillPaid : alloc.status === 'approved' ? styles.pillApproved : styles.pillPending]}>
                    <Text style={styles.allocPillText}>{alloc.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* DEPOSIT VS CONFIRMED SELF-PAY */}
        <Card style={styles.depositSectionCard}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>PRE-SERVICE DEPOSIT VS SELF-PAY</Text>
            <TouchableOpacity onPress={() => setShowDepositModal(true)}>
              <Text style={styles.kickerAction}>+ Record Deposit</Text>
            </TouchableOpacity>
          </View>

          {depositPaid > 0 ? (
            <View style={styles.depositInfoBox}>
              <View style={styles.depositRow}>
                <Text style={styles.depLabel}>Deposit Paid Upfront:</Text>
                <Text style={styles.depVal}>{NAIRA(depositPaid)}</Text>
              </View>
              <View style={styles.depositRow}>
                <Text style={styles.depLabel}>Applied to Confirmed Self-Pay:</Text>
                <Text style={[styles.depVal, { color: colors.accent }]}>-{NAIRA(depositApplied)}</Text>
              </View>
              {refundCredit > 0 && (
                <View style={[styles.depositRow, { borderTopWidth: 1, borderTopColor: '#BAE6FD', paddingTop: 4 }]}>
                  <Text style={[styles.depLabel, { fontWeight: '700', color: colors.accentDark }]}>
                    Refundable / Creditable to Patient:
                  </Text>
                  <Text style={[styles.depVal, { fontWeight: '700', color: colors.accentDark }]}>
                    {NAIRA(refundCredit)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.depositEmptyText}>
              No upfront deposit on file. If you made a cash or POS deposit at the hospital reception before your final bill was issued, tap "+ Record Deposit" to apply it directly to your Self-Pay.
            </Text>
          )}
        </Card>

        {/* FIND FUNDING & MULTI-SOURCE FUNDING CARD */}
        {canPay && (
          <Card style={styles.fundingCard}>
            <View style={styles.kickerRow}>
              <Text style={styles.kicker}>WAYS TO COVER YOUR SELF-PAY</Text>
              <TouchableOpacity onPress={() => setShowFundingModal(true)}>
                <Text style={styles.kickerAction}>Explore All 6 Options →</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fundingTitle}>Need help covering your {NAIRA(amountDue)} responsibility?</Text>
            <View style={styles.fundingPillRow}>
              <TouchableOpacity style={styles.quickFundPill} onPress={handleHealthSaveFunding}>
                <Text style={styles.quickFundIcon}>🛡️</Text>
                <Text style={styles.quickFundText}>HealthSave ({NAIRA(savingsGoal.saved)})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickFundPill} onPress={() => handleFamilyPayRequest('Ade Okoro')}>
                <Text style={styles.quickFundIcon}>👥</Text>
                <Text style={styles.quickFundText}>FamilyPay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickFundPill} onPress={handleEmployerBenefit}>
                <Text style={styles.quickFundIcon}>🏢</Text>
                <Text style={styles.quickFundText}>Employer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* PARTIAL SELF-PAY MODE */}
        {canPay && (
          <Card style={styles.partialCard}>
            <View style={styles.partialHeader}>
              <Text style={styles.partialTitle}>Partial Self-Pay</Text>
              <TouchableOpacity
                style={[styles.togglePill, isPartialMode && styles.togglePillActive]}
                onPress={() => setIsPartialMode(!isPartialMode)}
              >
                <Text style={[styles.toggleText, isPartialMode && styles.toggleTextActive]}>
                  {isPartialMode ? 'Partial Mode ON' : 'Pay Full Amount'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.partialDesc}>
              {t.partialPayHelp || 'Pay what you have now; outstanding balance will be maintained on your account.'}
            </Text>

            {isPartialMode && (
              <View style={styles.partialInputBox}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.partialInput}
                  keyboardType="number-pad"
                  value={partialAmount}
                  onChangeText={setPartialAmount}
                  placeholder={`e.g. ${Math.round(amountDue / 2)}`}
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.presetRow}>
                  {[0.25, 0.5, 0.75].map((pct, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.presetChip}
                      onPress={() => setPartialAmount(String(Math.round(amountDue * pct)))}
                    >
                      <Text style={styles.presetText}>{pct * 100}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* LINE ITEMS DETAIL */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionHeader}>Itemized Hospital Bill</Text>
          {visLines.map((ln, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={2}>
                {ln.name} <Text style={{ opacity: 0.5 }}>× {ln.qty}</Text>
              </Text>
              <Text style={[styles.lineAmt, ln.discount && { color: colors.danger }]}>
                {NAIRA(ln.total)}
              </Text>
            </View>
          ))}
          {!showAll && bill.lines.length > 3 && (
            <TouchableOpacity onPress={() => setShowAll(true)}>
              <Text style={styles.showAll}>
                {typeof t.showAllLines === 'function' ? t.showAllLines(bill.lines.length) : 'Show all items'}
              </Text>
            </TouchableOpacity>
          )}
          {showAll && (
            <TouchableOpacity onPress={() => setShowAll(false)}>
              <Text style={styles.showAll}>{t.collapseLines}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LINKS & ADVANCED FEATURES */}
        <View style={styles.linksGrid}>
          <TouchableOpacity style={styles.linkCard} onPress={handleShareStatement}>
            <Text style={styles.linkIcon}>📄</Text>
            <View>
              <Text style={styles.linkTitle}>Patient Responsibility Statement</Text>
              <Text style={styles.linkSub}>Download official WelliPay PRS (PDF)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('EpisodeTimeline', { episodeId: bill.episodeId || 'ep1' })}
          >
            <Text style={styles.linkIcon}>🏥</Text>
            <View>
              <Text style={styles.linkTitle}>Healthcare Episode Timeline</Text>
              <Text style={styles.linkSub}>Consultation → Lab → Pharmacy breakdown</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('FamilyPayHub', { billId: bill.id })}
          >
            <Text style={styles.linkIcon}>🌍</Text>
            <View>
              <Text style={styles.linkTitle}>FamilyPay™ Diaspora Web Link</Text>
              <Text style={styles.linkSub}>Share payment link & pool funds in USD/GBP/EUR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('HospitalDeskTicket', { billId: bill.id })}
          >
            <Text style={styles.linkIcon}>🎫</Text>
            <View>
              <Text style={styles.linkTitle}>Hospital Desk Queue Ticket (#A-14)</Text>
              <Text style={styles.linkSub}>Room 102 Cashier · Bedside Service · Co-Pay Clearance</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('WelliPass', { billId: bill.id })}
          >
            <Text style={styles.linkIcon}>⚡</Text>
            <View>
              <Text style={styles.linkTitle}>WelliPass™ Hospital Discharge Pass</Text>
              <Text style={styles.linkSub}>4-step clinical & financial audit · Green QR Gate Pass</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('RxPharmacy')}
          >
            <Text style={styles.linkIcon}>💊</Text>
            <View>
              <Text style={styles.linkTitle}>Rx Pharmacy Formulary & Generics</Text>
              <Text style={styles.linkSub}>Switch to NAFDAC generic equivalent (100% HMO covered)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('UssdOffline', { billId: bill.id })}
          >
            <Text style={styles.linkIcon}>📶</Text>
            <View>
              <Text style={styles.linkTitle}>Offline USSD & Emergency Banking</Text>
              <Text style={styles.linkSub}>Dial *347*88# or generate encrypted offline voucher</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('HmoReconcile')}>
            <Text style={styles.linkIcon}>⚖️</Text>
            <View>
              <Text style={styles.linkTitle}>WelliPay Reconcile™</Text>
              <Text style={styles.linkSub}>
                {bill.reconciliation?.variance
                  ? `₦${bill.reconciliation.variance.toLocaleString()} HMO underpayment logged`
                  : 'Track provider remittance & claim variances'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => {
              setPaySession({ reportBillId: bill.id, reportCategory: '', reportDesc: '', reportSubmitted: false } as any);
              navigation.navigate('Report');
            }}
          >
            <Text style={styles.linkIcon}>⚠️</Text>
            <View>
              <Text style={styles.linkTitle}>{t.reportProblem}</Text>
              <Text style={styles.linkSub}>Dispute a tariff item or hospital charge</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER CTA */}
      {canPay && (
        <View style={styles.footer}>
          <Button
            label={isPartialMode && partialAmount ? `Pay ${NAIRA(parseInt(partialAmount.replace(/[^0-9]/g, '')) || 0)} (Partial)` : `Pay ${NAIRA(amountDue)}`}
            fullWidth
            onPress={handlePay}
          />
        </View>
      )}
      {isPaid && (
        <View style={styles.footer}>
          <Button label="View Settled Statement" fullWidth onPress={handleShareStatement} />
        </View>
      )}

      {/* MODAL: FIND FUNDING (6 OPTIONS) */}
      <Modal visible={showFundingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ways to Cover Your Self-Pay</Text>
              <TouchableOpacity onPress={() => setShowFundingModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Confirmed Patient Self-Pay due: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{NAIRA(amountDue)}</Text>
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Option A: Pay Now */}
              <TouchableOpacity
                style={styles.fundingOptCard}
                onPress={() => { setShowFundingModal(false); handlePay(); }}
              >
                <Text style={styles.fundingOptIcon}>💳</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option A — Pay Now</Text>
                  <Text style={styles.fundingOptDesc}>Direct checkout with Debit Card, Bank Transfer, USSD, or NQR.</Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>

              {/* Option B: HealthSave */}
              <TouchableOpacity style={styles.fundingOptCard} onPress={handleHealthSaveFunding}>
                <Text style={styles.fundingOptIcon}>🛡️</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option B — HealthSave Reserve</Text>
                  <Text style={styles.fundingOptDesc}>
                    Available reserve: {NAIRA(savingsGoal.saved)}. Apply immediately to cover your Self-Pay.
                  </Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>

              {/* Option C: FamilyPay */}
              <TouchableOpacity
                style={styles.fundingOptCard}
                onPress={() => handleFamilyPayRequest('Faith Oghene')}
              >
                <Text style={styles.fundingOptIcon}>👥</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option C — FamilyPay (Authorized Sponsor)</Text>
                  <Text style={styles.fundingOptDesc}>Request family member or authorized household sponsor to pay.</Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>

              {/* Option D: Employer */}
              <TouchableOpacity style={styles.fundingOptCard} onPress={handleEmployerBenefit}>
                <Text style={styles.fundingOptIcon}>🏢</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option D — Employer Healthcare Benefit</Text>
                  <Text style={styles.fundingOptDesc}>Apply company health allocation or corporate wellness subsidy.</Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>

              {/* Option E: NGO Funding Support */}
              <TouchableOpacity
                style={styles.fundingOptCard}
                onPress={() => {
                  setShowFundingModal(false);
                  Alert.alert('Funding Programme', 'WelliPay verified your eligibility for Lagos State Health Equity Assistance (Ilera Eko NGO fund). Support pending facility clearance.');
                }}
              >
                <Text style={styles.fundingOptIcon}>🤝</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option E — Funding Support / NGO Grant</Text>
                  <Text style={styles.fundingOptDesc}>Eligible community support or hospital foundation relief grant.</Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>

              {/* Option F: Financing */}
              <TouchableOpacity
                style={styles.fundingOptCard}
                onPress={() => {
                  setShowFundingModal(false);
                  navigation.navigate('InsightsTab');
                }}
              >
                <Text style={styles.fundingOptIcon}>⏱️</Text>
                <View style={styles.fundingOptBody}>
                  <Text style={styles.fundingOptName}>Option F — Medical Financing Partner</Text>
                  <Text style={styles.fundingOptDesc}>Spread into 3–6 interest-free installments via licensed partner.</Text>
                </View>
                <Text style={styles.fundingOptArrow}>→</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: RECORD PRE-SERVICE DEPOSIT */}
      <Modal visible={showDepositModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Pre-Service Deposit</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Enter deposit paid before final bill was known. It will be credited against your confirmed Self-Pay ({NAIRA(psp)}).
            </Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={styles.depositTextInput}
                keyboardType="number-pad"
                value={depositInput}
                onChangeText={setDepositInput}
                placeholder="e.g. 10000"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
            </View>

            <Button
              label="Apply Deposit to Self-Pay"
              fullWidth
              style={{ marginTop: spacing.md }}
              onPress={handleApplyDeposit}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  taglineBadge: {
    backgroundColor: '#E8F4F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  taglineText: { fontSize: 11, fontWeight: '700', color: colors.accentDark, letterSpacing: 0.5 },
  date: { fontSize: fontSize.sm, color: colors.textTertiary, marginBottom: spacing.xs },
  facility: { fontSize: fontSize.xl, fontWeight: '700', fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary, marginBottom: spacing.sm },
  bigAmountBox: { marginTop: spacing.md, marginBottom: spacing.md },
  bigAmount: { fontSize: fontSize.xxxl, fontWeight: '700', fontFamily: 'SourceSerif4_700Bold', color: colors.textPrimary },
  amtLabel: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  adjudicateCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  stepNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  stepKicker: { fontSize: fontSize.xs, fontWeight: '800', color: colors.accentDark, letterSpacing: 0.8 },
  adjudicateTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  adjudicateDesc: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  breakdownCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  kicker: { fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textTertiary, fontWeight: '700' },
  kickerAction: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '700' },
  verifiedBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  verifiedText: { fontSize: 10, color: colors.accentDark, fontWeight: '700' },
  breakdownTable: { gap: 6 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  rowVal: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  pspRow: {
    backgroundColor: '#FAFAF8',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pspLabel: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textPrimary },
  pspSub: { fontSize: 10, color: colors.textTertiary },
  pspVal: { fontSize: fontSize.base, fontWeight: '800', color: colors.textPrimary },
  allocCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allocInfo: { flex: 1, paddingRight: spacing.sm },
  allocName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  allocNotes: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  allocAmountBox: { alignItems: 'flex-end' },
  allocAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  allocPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, marginTop: 2 },
  pillPaid: { backgroundColor: '#ECFDF5' },
  pillApproved: { backgroundColor: '#EFF6FF' },
  pillPending: { backgroundColor: '#FFF7ED' },
  allocPillText: { fontSize: 9, fontWeight: '800', color: colors.textPrimary },
  depositSectionCard: {
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  depositInfoBox: { gap: 4, marginTop: 4 },
  depositRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  depVal: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textPrimary },
  depositEmptyText: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginTop: 4 },
  fundingCard: {
    padding: spacing.md,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    marginBottom: spacing.md,
  },
  fundingTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  fundingPillRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  quickFundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  quickFundIcon: { fontSize: 12 },
  quickFundText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.accentDark },
  partialCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  partialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partialTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  togglePillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: '#FFF' },
  partialDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  partialInputBox: { marginTop: spacing.sm },
  inputPrefix: { position: 'absolute', left: 12, top: 12, fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, zIndex: 1 },
  partialInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingLeft: 28,
    paddingRight: spacing.md,
    paddingVertical: 8,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  presetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent },
  sectionHeader: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  lineName: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },
  lineAmt: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  showAll: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600', paddingVertical: spacing.md, textAlign: 'center' },
  linksGrid: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkIcon: { fontSize: 22 },
  linkTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  linkSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, fontFamily: 'SourceSerif4_700Bold' },
  closeBtn: { fontSize: 20, color: colors.textTertiary, padding: 4 },
  modalSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  fundingOptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: '#FAFAF8',
  },
  fundingOptIcon: { fontSize: 24, marginRight: spacing.md },
  fundingOptBody: { flex: 1 },
  fundingOptName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  fundingOptDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  fundingOptArrow: { fontSize: fontSize.md, color: colors.accent, fontWeight: '700', marginLeft: spacing.sm },
  inputRow: { position: 'relative', marginVertical: spacing.md },
  depositTextInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingLeft: 30,
    paddingRight: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
