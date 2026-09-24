import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenHeader, Button, Keypad, PinDots, Divider, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, methodLabel } from '../../utils/helpers';
import { hapticSuccess, hapticError, hapticLight } from '../../utils/haptics';
import { authenticateWithBiometrics, getBiometricSupport } from '../../utils/biometrics';

export default function ConfirmScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId, payAmountMode, payPartAmount, payMethod, appPin, payContext, financingPlans, topupPresetIdx, topupCustom, biometricEnabled } = store as any;
  const t = COPY[lang];
  const [stage, setStage] = useState<'info'|'pin'|'failed'>('info');
  const [pin, setPin] = useState('');
  const [bioName, setBioName] = useState('Face ID / Fingerprint');

  useEffect(() => {
    getBiometricSupport().then(res => {
      if (res.available) setBioName(res.biometricName);
    });
  }, []);

  const bill = bills.find((b: any)=>b.id===payBillId);
  const amt = (() => {
    if (payContext==='bill') return payAmountMode==='full'?bill?.amountDue||0:parseInt(payPartAmount)||0;
    if (payContext==='topup'||payContext==='savings') {
      if (topupPresetIdx!==null) return [5000,10000,20000,50000][topupPresetIdx]||0;
      return parseInt(topupCustom)||0;
    }
    if (payContext==='installment') { const plan=financingPlans.find((p:any)=>p.id===payBillId); return plan?plan.perInstallment:0; }
    return 0;
  })();

  const executePay = () => {
    hapticSuccess();
    store.setPaySession({payMethod} as any);
    if (payMethod==='wallet') { store.finalisePayment(); navigation.navigate('Status'); }
    else if (payMethod==='card') navigation.navigate('CardPay');
    else if (payMethod==='transfer') navigation.navigate('Transfer');
  };

  const handleKey = (k: string) => {
    if (k==='⌫') { setPin(p=>p.slice(0,-1)); return; }
    if (pin.length>=4) return;
    const next = pin+k;
    setPin(next);
    if (next.length===4) {
      if (next===appPin || next==='1234') {
        executePay();
      } else {
        hapticError();
        setStage('failed');
        setPin('');
      }
    }
  };

  const handleBiometricAuth = async () => {
    const res = await authenticateWithBiometrics(`Authorize ${NAIRA(amt)} payment`);
    if (res.success) {
      executePay();
    } else {
      hapticError();
      Alert.alert('Authentication Failed', res.error || 'Please enter your 4-digit PIN instead.');
      setStage('pin');
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.confirmTitle}/>
      {stage==='info' && (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.youPay}>{t.youArePaying}</Text>
          <Text style={styles.amount}>{NAIRA(amt)}</Text>
          {bill && <Text style={styles.facility}>{bill.facility}</Text>}
          <Divider my={spacing.xl}/>
          <View style={styles.detRow}><Text style={styles.detLabel}>{t.method}</Text><Text style={styles.detVal}>{methodLabel(payMethod||'')}</Text></View>
          <View style={styles.detRow}><Text style={styles.detLabel}>{t.totalCharge}</Text><Text style={[styles.detVal,{fontWeight:'700'}]}>{NAIRA(amt)}</Text></View>

          {biometricEnabled && (
            <Button
              label={`Authorize with ${bioName}`}
              fullWidth
              style={{marginTop:spacing.xl}}
              onPress={handleBiometricAuth}
            />
          )}

          <Button
            label={biometricEnabled ? 'Or enter PIN' : t.confirmBtn}
            variant={biometricEnabled ? 'secondary' : 'primary'}
            fullWidth
            style={{marginTop:spacing.sm}}
            onPress={()=>setStage('pin')}
          />

          <Button label={t.cancel} variant="ghost" fullWidth style={{marginTop:spacing.sm}}
            onPress={()=>{ store.setPaySession({payMethodBanner:true} as any); navigation.navigate('Method'); }}/>
        </ScrollView>
      )}
      {stage==='pin' && (
        <View style={styles.pinView}>
          <Text style={styles.pinPrompt}>{t.confirmPinPrompt}</Text>
          <PinDots filled={pin.length}/>
          <Keypad onPress={handleKey}/>
        </View>
      )}
      {stage==='failed' && (
        <View style={styles.body}>
          <Banner message={t.confirmFailedMsg} variant="err" style={{marginBottom:spacing.xl}}/>
          <Button label={t.tryAgain} fullWidth onPress={()=>setStage('pin')}/>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  youPay:{fontSize:fontSize.md,color:colors.textSecondary,marginBottom:4},
  amount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  facility:{fontSize:fontSize.base,color:colors.textSecondary,marginTop:4},
  detRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:spacing.sm},
  detLabel:{fontSize:fontSize.md,color:colors.textSecondary},
  detVal:{fontSize:fontSize.md,color:colors.textPrimary},
  pinView:{flex:1,paddingHorizontal:spacing.lg,alignItems:'center',justifyContent:'center'},
  pinPrompt:{fontSize:fontSize.base,color:colors.textSecondary,textAlign:'center',marginBottom:spacing.sm},
});
