import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, Chip, BarChart, ProgressBar } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { SPEND_DATA, BILLS_SEED } from '../../state/seed';

export default function InsightsScreen({ navigation }: any) {
  const store = useStore();
  const { lang, activePerson, savingsGoal, financingPlans, bills } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<'me'|'family'>('me');

  const spendData = scope==='me' ? SPEND_DATA[activePerson]||[] : [
    { month:'Jun', amount:Object.values(SPEND_DATA).reduce((s,arr)=>s+(arr[0]?.amount||0),0) },
    { month:'Jul', amount:Object.values(SPEND_DATA).reduce((s,arr)=>s+(arr[1]?.amount||0),0) },
    { month:'Aug', amount:Object.values(SPEND_DATA).reduce((s,arr)=>s+(arr[2]?.amount||0),0) },
    { month:'Sep', amount:Object.values(SPEND_DATA).reduce((s,arr)=>s+(arr[3]?.amount||0),0) },
  ];

  const hmoBills = bills.filter(b=>b.hasSplit && b.personId===activePerson);
  const hmoTotal = hmoBills.reduce((s,b)=>s+(b.hmoAmount||0),0);
  const youTotal = hmoBills.reduce((s,b)=>s+b.amountTotal,0) - hmoTotal;
  const sg = savingsGoal;
  const plan = financingPlans[0];

  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}><Text style={styles.title}>{t.insightsTitle}</Text></View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          <Chip label={t.scopeMe} active={scope==='me'} onPress={()=>setScope('me')}/>
          <Chip label={t.scopeFamily} active={scope==='family'} onPress={()=>setScope('family')}/>
        </View>
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.spendingKicker}</Text>
          <BarChart data={spendData}/>
        </Card>
        {hmoBills.length>0 && (
          <Card style={styles.mb}>
            <Text style={styles.kicker}>{t.insuranceKicker}</Text>
            <View style={styles.splitRow}><Text style={styles.splitLabel}>{t.hmoPaidLabel}</Text><Text style={styles.splitAmt}>{NAIRA(hmoTotal)}</Text></View>
            <View style={styles.splitRow}><Text style={styles.splitLabel}>{t.youPaidLabel}</Text><Text style={styles.splitAmt}>{NAIRA(youTotal)}</Text></View>
            <ProgressBar value={hmoTotal} max={hmoTotal+youTotal} style={{marginTop:spacing.sm} as any}/>
          </Card>
        )}
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.savingsKicker}</Text>
          <Text style={styles.goalName}>{sg.name}</Text>
          <View style={{flexDirection:'row',alignItems:'baseline',gap:4}}>
            <Text style={styles.saved}>{NAIRA(sg.saved)}</Text>
            <Text style={styles.target}>/ {NAIRA(sg.target)}</Text>
          </View>
          <ProgressBar value={sg.saved} max={sg.target} style={{marginTop:spacing.sm} as any}/>
          <Button label={t.contributeBtn} variant="secondary" fullWidth style={{marginTop:spacing.lg}}
            onPress={()=>{ store.setPaySession({payContext:'savings',topupPresetIdx:null,topupCustom:''} as any); navigation.navigate('TopUp'); }}/>
        </Card>
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.financingKicker}</Text>
          {financingPlans.length===0 ? <Text style={styles.empty}>{t.noPlans}</Text> : financingPlans.map(fp=>(
            <View key={fp.id}>
              <Text style={styles.planFacility}>{fp.facility}</Text>
              <Text style={styles.planSub}>{fp.paidInstallments}/{fp.totalInstallments} installments · {t.nextInstallment} {fp.nextDue}</Text>
              <ProgressBar value={fp.paidInstallments} max={fp.totalInstallments} style={{marginTop:spacing.sm,marginBottom:spacing.md} as any}/>
              <Button label={`${t.payInstallmentBtn} (${NAIRA(fp.perInstallment)})`} variant="secondary" fullWidth
                onPress={()=>{ store.setPaySession({payBillId:fp.id,payContext:'installment'} as any); navigation.navigate('Method'); }}/>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  header:{paddingHorizontal:spacing.lg,paddingVertical:spacing.md},
  title:{fontSize:fontSize.xxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  chips:{flexDirection:'row',gap:spacing.sm,marginBottom:spacing.md},
  mb:{marginBottom:spacing.md},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.xs},
  splitRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4},
  splitLabel:{fontSize:fontSize.md,color:colors.textSecondary},
  splitAmt:{fontSize:fontSize.md,fontWeight:'600',color:colors.textPrimary},
  goalName:{fontSize:fontSize.lg,fontWeight:'600',color:colors.textPrimary,marginTop:4},
  saved:{fontSize:fontSize.xl,fontWeight:'700',color:colors.textPrimary},
  target:{fontSize:fontSize.md,color:colors.textSecondary},
  planFacility:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary,marginTop:spacing.sm},
  planSub:{fontSize:fontSize.sm,color:colors.textSecondary,marginTop:2},
  empty:{fontSize:fontSize.md,color:colors.textTertiary},
});
