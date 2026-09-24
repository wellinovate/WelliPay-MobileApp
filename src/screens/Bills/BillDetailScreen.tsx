import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenHeader, Card, StatusPill, Button, Banner, Divider } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { generateReceiptPdf, shareReceiptPdf } from '../../utils/pdfGenerator';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';

export default function BillDetailScreen({ navigation }: any) {
  const { lang, bills, payBillId, setPaySession, hmoPolicies, activeHmoId, applyHmoToBill } = useStore();
  const activePolicy = hmoPolicies.find(p => p.id === activeHmoId) || hmoPolicies[0];
  const t = COPY[lang];
  const bill = bills.find(b=>b.id===payBillId);
  const [showAll, setShowAll] = useState(false);
  if(!bill) return null;

  const handleShareStatement = async () => {
    hapticLight();
    try {
      const uri = await generateReceiptPdf({
        ref: bill.billNo,
        facility: bill.facility,
        personName: 'Jay Umar',
        amountPaid: bill.amountDue,
        remainingBalance: bill.amountDue,
        method: 'Hospital Statement',
        billNo: bill.billNo,
        hmoProvider: bill.hasSplit ? (activePolicy?.provider || 'HMO') : undefined,
        hmoCovered: bill.hmoAmount,
      });
      hapticSuccess();
      await shareReceiptPdf(uri);
    } catch (e: any) {
      hapticError();
    }
  };

  const canPay = ['unpaid','overdue','partly_paid','awaiting_hmo'].includes(bill.status);
  const isPaid = bill.status==='paid';
  const visLines = showAll ? bill.lines : bill.lines.slice(0,3);

  return (
    <View style={styles.screen}>
      <ScreenHeader title=""/>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{bill.date} · {bill.billNo}</Text>
        <Text style={styles.facility}>{bill.facility}</Text>
        <StatusPill status={bill.status}/>
        {bill.status==='void' && <Banner message={t.voidBanner} variant="err" style={{marginTop:spacing.md}}/>}
        {bill.changed && <Banner message={t.billChangedMsg} variant="warn" style={{marginTop:spacing.md}}/>}
        {(canPay||isPaid) && (
          <View style={{marginTop:spacing.lg}}>
            <Text style={styles.bigAmount}>{NAIRA(canPay?bill.amountDue:bill.amountTotal)}</Text>
            <Text style={styles.amtLabel}>{canPay?'Amount due':'Total paid'}</Text>
          </View>
        )}
        {!bill.hasSplit && canPay && (
          <Card style={{marginTop:spacing.lg,backgroundColor:colors.accentLight,borderColor:colors.accentBorder}}>
            <Text style={[styles.kicker,{color:colors.accentDark}]}>INSURANCE & HMO CO-PAY</Text>
            <Text style={{fontSize:fontSize.sm,color:colors.textPrimary,marginTop:2,lineHeight:20}}>
              You have active coverage with <Text style={{fontWeight:'700'}}>{activePolicy?.provider || 'HMO'}</Text> ({activePolicy?.coPayPercent}% patient co-pay).
            </Text>
            <Button
              label={`Apply ${activePolicy?.provider || 'HMO'} Coverage`}
              variant="secondary"
              fullWidth
              style={{marginTop:spacing.sm}}
              onPress={() => applyHmoToBill(bill.id)}
            />
          </Card>
        )}

        {bill.hasSplit && (
          <Card style={{marginTop:spacing.lg}}>
            <Text style={styles.kicker}>{t.payerSplit}</Text>
            <View style={styles.splitRow}><Text style={styles.splitLabel}>{t.youPay}</Text><Text style={styles.splitAmt}>{NAIRA(bill.amountDue)}</Text></View>
            <View style={styles.splitRow}><Text style={[styles.splitLabel,{opacity:0.65}]}>{t.hmoPays}</Text><Text style={[styles.splitAmt,{opacity:0.65}]}>{NAIRA(bill.hmoAmount||0)}</Text></View>
            <Divider/>
            <View style={styles.splitRow}><Text style={styles.splitLabel}>{t.billTotal}</Text><Text style={styles.splitAmt}>{NAIRA(bill.amountTotal)}</Text></View>
            <Text style={{fontSize:fontSize.xs,color:colors.accent,marginTop:spacing.sm,fontWeight:'600'}}>
              ✓ Verified with {activePolicy?.provider || 'HMO'} ({activePolicy?.policyNo})
            </Text>
          </Card>
        )}
        <View style={{marginTop:spacing.lg}}>
          {visLines.map((ln,i)=>(
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={2}>{ln.name} <Text style={{opacity:0.5}}>× {ln.qty}</Text></Text>
              <Text style={[styles.lineAmt,ln.discount&&{color:colors.danger}]}>{NAIRA(ln.total)}</Text>
            </View>
          ))}
          {!showAll && bill.lines.length>3 && (
            <TouchableOpacity onPress={()=>setShowAll(true)}><Text style={styles.showAll}>{typeof t.showAllLines==='function'?t.showAllLines(bill.lines.length):'Show all'}</Text></TouchableOpacity>
          )}
          {showAll && <TouchableOpacity onPress={()=>setShowAll(false)}><Text style={styles.showAll}>{t.collapseLines}</Text></TouchableOpacity>}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.total}</Text>
            <Text style={styles.totalAmt}>{NAIRA(bill.amountTotal)}</Text>
          </View>
        </View>
        <View style={styles.links}>
          <TouchableOpacity onPress={handleShareStatement}><Text style={styles.link}>📄 Share Statement</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PreAuth')}><Text style={styles.link}>🛡️ Request Pre-Auth</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>{ setPaySession({reportBillId:bill.id,reportCategory:'',reportDesc:'',reportSubmitted:false} as any); navigation.navigate('Report'); }}>
            <Text style={styles.link}>⚠️ {t.reportProblem}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {canPay && (
        <View style={styles.footer}>
          <Button label={typeof t.payCtaPartial==='function'?t.payCtaPartial(NAIRA(bill.amountDue)):`Pay ${NAIRA(bill.amountDue)}`} fullWidth
            onPress={()=>{ setPaySession({payBillId:bill.id,payContext:'bill',payAmountMode:'full',payPartAmount:'',payMethodBanner:false} as any); navigation.navigate('Amount'); }}/>
        </View>
      )}
      {isPaid && (
        <View style={styles.footer}>
          <Button label={t.viewReceipt} fullWidth onPress={()=>navigation.navigate('Receipt')}/>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  date:{fontSize:fontSize.sm,color:colors.textTertiary,marginBottom:spacing.xs},
  facility:{fontSize:fontSize.xl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary,marginBottom:spacing.sm},
  bigAmount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  amtLabel:{fontSize:fontSize.sm,color:colors.textTertiary,marginTop:2},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.sm},
  splitRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4},
  splitLabel:{fontSize:fontSize.md,color:colors.textPrimary},
  splitAmt:{fontSize:fontSize.md,fontWeight:'600',color:colors.textPrimary},
  lineRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingVertical:spacing.sm,borderBottomWidth:1,borderBottomColor:colors.border,gap:8},
  lineName:{flex:1,fontSize:fontSize.md,color:colors.textPrimary},
  lineAmt:{fontSize:fontSize.md,fontWeight:'600',color:colors.textPrimary},
  showAll:{fontSize:fontSize.md,color:colors.accent,fontWeight:'600',paddingVertical:spacing.md,textAlign:'center'},
  totalRow:{flexDirection:'row',justifyContent:'space-between',paddingTop:spacing.md},
  totalLabel:{fontSize:fontSize.base,fontWeight:'700',color:colors.textPrimary},
  totalAmt:{fontSize:fontSize.base,fontWeight:'700',color:colors.textPrimary},
  links:{flexDirection:'row',gap:spacing.xxl,marginTop:spacing.xl},
  link:{fontSize:fontSize.md,color:colors.accent,fontWeight:'600'},
  footer:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border},
});
