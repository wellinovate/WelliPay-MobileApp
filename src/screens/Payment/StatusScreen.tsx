import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function StatusScreen({ navigation }: any) {
  const store = useStore();
  const { lang, payOutcome, lastPayAmount, lastPayRemaining, lastPayRef, bills, payBillId, payContext } = store as any;
  const t = COPY[lang];
  const bill = bills.find((b: any)=>b.id===payBillId);
  const isTopup = payContext==='topup'||payContext==='savings';

  const goReceipt = () => navigation.navigate('Receipt');
  const goWallet  = () => navigation.navigate('WalletTab');
  const goBills   = () => navigation.navigate('BillsTab');
  const retry     = () => navigation.navigate('Method');

  const resolve = (outcome: string) => { store.setPaySession({payOutcome:outcome} as any); if(outcome==='success')store.finalisePayment(); };

  const iconBg = payOutcome==='success'?colors.accentLight:payOutcome==='failed'?colors.dangerLight:colors.warningBg;
  const iconFg = payOutcome==='success'?colors.accentDark:payOutcome==='failed'?colors.dangerDark:colors.warningText;
  const icon = payOutcome==='success'?'✓':payOutcome==='failed'?'✕':'⏱';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.iconCircle,{backgroundColor:iconBg}]}>
          <Text style={[styles.iconText,{color:iconFg}]}>{icon}</Text>
        </View>

        {payOutcome==='pending' && <>
          <Text style={styles.heading}>{t.pendingMsg}</Text>
          <View style={styles.btnGroup}>
            <Button label={t.demoResolveSuccess} variant="secondary" fullWidth onPress={()=>resolve('success')} style={{marginBottom:8}}/>
            <Button label={t.demoResolveReview} variant="secondary" fullWidth onPress={()=>{ store.setPaySession({payOutcome:'review'} as any); }}/>
          </View>
        </>}

        {payOutcome==='success' && <>
          <Text style={styles.heading}>{t.successHeading}</Text>
          <Text style={styles.sub}>{NAIRA(lastPayAmount)} · {bill?.facility}</Text>
          <Text style={styles.ref}>{lastPayRef}</Text>
          {lastPayRemaining>0 && <Text style={styles.stillToPay}>{typeof t.stillToPay==='function'?t.stillToPay(NAIRA(lastPayRemaining)):''}</Text>}
          <View style={styles.btnGroup}>
            {!isTopup && <Button label={t.viewReceipt} fullWidth style={{marginBottom:8}} onPress={goReceipt}/>}
            {isTopup && <Button label={t.walletTitle} fullWidth style={{marginBottom:8}} onPress={goWallet}/>}
            {lastPayRemaining>0 && <Button label={t.payBalanceBtn} variant="secondary" fullWidth style={{marginBottom:8}} onPress={retry}/>}
            {!isTopup && <Button label={t.backToBills} variant="ghost" fullWidth onPress={goBills}/>}
          </View>
        </>}

        {payOutcome==='failed' && <>
          <Text style={styles.heading}>{t.failedHeading}</Text>
          <Text style={styles.sub}>{t.failReason[(store as any).payFailReason as 'declined']||t.failReason.default}</Text>
          <View style={styles.btnGroup}>
            <Button label={t.tryAgain} fullWidth style={{marginBottom:8}} onPress={retry}/>
            <Button label={t.useAnotherMethod} variant="secondary" fullWidth onPress={retry}/>
          </View>
        </>}

        {payOutcome==='review' && <>
          <Text style={styles.heading}>Under review</Text>
          <Text style={styles.sub}>{t.underReviewMsg}</Text>
          <Button label={t.contactSupport} variant="secondary" style={{marginTop:spacing.xl}} onPress={()=>navigation.navigate('Contact')}/>
        </>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.xl,gap:spacing.md},
  iconCircle:{width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center',marginBottom:spacing.md},
  iconText:{fontSize:36,fontWeight:'700'},
  heading:{fontSize:fontSize.xl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary,textAlign:'center'},
  sub:{fontSize:fontSize.md,color:colors.textSecondary,textAlign:'center',lineHeight:22},
  ref:{fontSize:fontSize.xs,color:colors.textTertiary,fontFamily:'SourceSerif4_400Regular'},
  stillToPay:{fontSize:fontSize.md,color:colors.warning,fontWeight:'600'},
  btnGroup:{width:'100%',marginTop:spacing.md},
});
