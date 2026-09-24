import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { ScreenHeader, Button, Card, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function CardPayScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId, payAmountMode, payPartAmount, payContext, financingPlans, topupPresetIdx, topupCustom } = store as any;
  const t = COPY[lang];
  const [loading, setLoading] = useState(true);

  const bill = bills.find((b: any)=>b.id===payBillId);
  const amt = (() => {
    if (payContext==='bill') return payAmountMode==='full'?bill?.amountDue||0:parseInt(payPartAmount)||0;
    if (payContext==='topup'||payContext==='savings') { if(topupPresetIdx!==null)return[5000,10000,20000,50000][topupPresetIdx]||0; return parseInt(topupCustom)||0; }
    if (payContext==='installment') { const plan=financingPlans.find((p:any)=>p.id===payBillId); return plan?plan.perInstallment:0; }
    return 0;
  })();

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),900); return ()=>clearTimeout(t); },[]);

  const succeed = () => { store.finalisePayment(); navigation.navigate('Status'); };
  const threeDS = () => { store.setPaySession({payOutcome:'pending'} as any); navigation.navigate('Status'); };
  const decline = () => { store.setPaySession({payOutcome:'failed',payFailReason:'declined'} as any); navigation.navigate('Status'); };

  if (loading) return (
    <View style={styles.screen}>
      <ScreenHeader showBack/>
      <View style={styles.center}><ActivityIndicator color={colors.accent} size="large"/><Text style={styles.loadText}>{t.openingSecure}</Text></View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>{t.securePaymentKicker}</Text>
        <Text style={styles.amount}>{NAIRA(amt)}</Text>
        {bill&&<Text style={styles.facility}>{bill.facility}</Text>}
        <Card style={{marginTop:spacing.xl}}>
          <Text style={styles.fieldLabel}>{t.cardNumberLabel}</Text>
          <TextInput style={styles.input} value="•••• •••• •••• 4242" editable={false} placeholderTextColor={colors.textTertiary}/>
          <View style={{flexDirection:'row',gap:spacing.md,marginTop:spacing.md}}>
            <View style={{flex:1}}>
              <Text style={styles.fieldLabel}>{t.expiryLabel}</Text>
              <TextInput style={styles.input} value="09/29" editable={false}/>
            </View>
            <View style={{flex:1}}>
              <Text style={styles.fieldLabel}>{t.cvvLabel}</Text>
              <TextInput style={styles.input} value="•••" editable={false}/>
            </View>
          </View>
          <Button label={`Pay ${NAIRA(amt)}`} fullWidth style={{marginTop:spacing.xl}} onPress={succeed}/>
        </Card>
        <View style={{marginTop:spacing.xxl}}>
          <Text style={styles.protoLabel}>Prototype</Text>
          <View style={{flexDirection:'row',gap:spacing.md,marginTop:spacing.sm}}>
            <Button label={t.demoThreeDS} variant="secondary" onPress={threeDS}/>
            <Button label={t.demoDecline} variant="danger" onPress={decline}/>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.lg},
  loadText:{fontSize:fontSize.md,color:colors.textSecondary},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.xs},
  amount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  facility:{fontSize:fontSize.md,color:colors.textSecondary,marginTop:4},
  fieldLabel:{fontSize:fontSize.sm,color:colors.textSecondary,marginBottom:spacing.xs,fontWeight:'500'},
  input:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,paddingVertical:11,fontSize:fontSize.base,color:colors.textPrimary,backgroundColor:colors.bg},
  protoLabel:{fontSize:fontSize.xs,color:colors.textTertiary,letterSpacing:0.5,textTransform:'uppercase'},
});
