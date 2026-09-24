import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenHeader, Card, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function MethodScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId, payAmountMode, payPartAmount, wallets, activePerson, payContextAmount, payMethodBanner, topupPresetIdx, topupCustom, payContext, financingPlans } = store as any;
  const t = COPY[lang];

  const amt = (() => {
    if (payContext==='bill') {
      const bill = bills.find((b: any)=>b.id===payBillId);
      if (!bill) return 0;
      return payAmountMode==='full' ? bill.amountDue : parseInt(payPartAmount)||0;
    }
    if (payContext==='topup'||payContext==='savings') {
      if (topupPresetIdx!==null) return [5000,10000,20000,50000][topupPresetIdx]||0;
      return parseInt(topupCustom)||0;
    }
    if (payContext==='installment') {
      const plan = financingPlans.find((p: any)=>p.id===payBillId);
      return plan ? plan.perInstallment : 0;
    }
    return 0;
  })();

  const walletBal = wallets[activePerson]||0;
  const walletOk = walletBal >= amt;

  const choose = (method: string) => {
    store.setPaySession({payMethod:method,confirmSubStage:'idle',confirmPinEntry:'',confirmPinError:false} as any);
    navigation.navigate('Confirm');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.methodTitle}/>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.amount}>{NAIRA(amt)}</Text>
        {payMethodBanner && <Banner message={t.paymentCancelledMsg} variant="warn" style={{marginBottom:spacing.lg}}/>}
        <View style={{gap:spacing.md}}>
          <TouchableOpacity activeOpacity={walletOk?0.7:1} onPress={walletOk?()=>choose('wallet'):undefined}>
            <Card style={!walletOk?{opacity:0.45}:{}}>
              <Text style={styles.methodName}>{t.payWithWallet}</Text>
              <Text style={styles.methodSub}>{walletOk?(typeof t.payWithWalletSub==='function'?t.payWithWalletSub(NAIRA(walletBal)):''):`${t.insufficientWallet}${NAIRA(walletBal)}`}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>choose('card')} activeOpacity={0.8}>
            <Card>
              <Text style={styles.methodName}>{t.payWithCard}</Text>
              <Text style={styles.methodSub}>{t.payWithCardSub}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>choose('transfer')} activeOpacity={0.8}>
            <Card>
              <Text style={styles.methodName}>{t.payWithTransfer}</Text>
              <Text style={styles.methodSub}>{t.payWithTransferSub}</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  amount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary,marginBottom:spacing.xl},
  methodName:{fontSize:fontSize.base,fontWeight:'700',color:colors.textPrimary,marginBottom:4},
  methodSub:{fontSize:fontSize.sm,color:colors.textSecondary},
});
