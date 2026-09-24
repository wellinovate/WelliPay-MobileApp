import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Card, Button, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, pad2 } from '../../utils/helpers';

export default function TransferScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId, payAmountMode, payPartAmount, payContext, financingPlans, topupPresetIdx, topupCustom } = store as any;
  const t = COPY[lang];
  const [secs, setSecs] = useState(3600);
  const [expired, setExpired] = useState(false);
  const acctNo = '9021445678';

  const bill = bills.find((b: any)=>b.id===payBillId);
  const amt = (() => {
    if (payContext==='bill') return payAmountMode==='full'?bill?.amountDue||0:parseInt(payPartAmount)||0;
    if (payContext==='topup'||payContext==='savings') { if(topupPresetIdx!==null)return[5000,10000,20000,50000][topupPresetIdx]||0; return parseInt(topupCustom)||0; }
    if (payContext==='installment') { const plan=financingPlans.find((p:any)=>p.id===payBillId); return plan?plan.perInstallment:0; }
    return 0;
  })();

  useEffect(()=>{
    const timer = setInterval(()=>{
      setSecs(s=>{ if(s<=1){clearInterval(timer);setExpired(true);return 0;} return s-1; });
    },1000);
    return ()=>clearInterval(timer);
  },[]);

  const mins = Math.floor(secs/60), remSecs = secs%60;
  const isWarn = secs < 300;
  const copy = async (text: string) => { await Clipboard.setStringAsync(text); Alert.alert('',t.copiedMsg,[{text:'OK'}]); };
  const paid = () => { store.setPaySession({payOutcome:'pending'} as any); navigation.navigate('Status'); };

  if (expired) return (
    <View style={styles.screen}>
      <ScreenHeader title={t.transferTitle}/>
      <View style={styles.body}>
        <Banner message={t.transferExpiredMsg} variant="warn" style={{marginBottom:spacing.xl}}/>
        <Button label={t.getNewAccount} fullWidth onPress={()=>{ setSecs(3600); setExpired(false); }}/>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.transferTitle}/>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.instruction}>{t.transferInstruction}</Text>
        <Card style={{marginTop:spacing.lg,gap:spacing.md}}>
          {[
            [t.bankName,'Any Bank',null],
            [t.accountNumber,acctNo,acctNo],
            [t.accountName,'WELLIPAY-JAY UMAR',null],
            [t.amount,NAIRA(amt),String(amt)],
          ].map(([label,val,copyVal]:any,i)=>(
            <View key={i} style={styles.detRow}>
              <Text style={styles.detLabel}>{label}</Text>
              <View style={styles.valRow}>
                <Text style={[styles.detVal,copyVal&&{fontFamily:'SourceSerif4_400Regular',fontSize:fontSize.lg,letterSpacing:1}]}>{val}</Text>
                {copyVal && <TouchableOpacity onPress={()=>copy(copyVal)}><Text style={styles.copyBtn}>{t.copy}</Text></TouchableOpacity>}
              </View>
            </View>
          ))}
        </Card>
        <Text style={[styles.countdown,isWarn&&{color:colors.danger}]}>{t.expiresIn} {pad2(mins)}:{pad2(remSecs)}</Text>
        <Text style={styles.note}>{t.transferNote}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t.iHavePaid} fullWidth style={{marginBottom:spacing.sm}} onPress={paid}/>
        <Button label={t.chooseAnotherMethod} variant="ghost" fullWidth onPress={()=>{ store.setPaySession({payMethodBanner:true} as any); navigation.navigate('Method'); }}/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  instruction:{fontSize:fontSize.md,color:colors.textSecondary,lineHeight:22},
  detRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:spacing.xs},
  detLabel:{fontSize:fontSize.sm,color:colors.textSecondary},
  valRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm},
  detVal:{fontSize:fontSize.md,fontWeight:'600',color:colors.textPrimary},
  copyBtn:{fontSize:fontSize.sm,color:colors.accent,fontWeight:'600'},
  countdown:{fontSize:fontSize.base,fontWeight:'700',color:colors.accent,textAlign:'center',marginTop:spacing.lg},
  note:{fontSize:fontSize.xs,color:colors.textTertiary,marginTop:spacing.md,lineHeight:18},
  footer:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border},
});
