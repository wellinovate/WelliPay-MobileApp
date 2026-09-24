import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, Toggle, Divider, ProgressBar } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, fmtDate } from '../../utils/helpers';

export default function WalletScreen({ navigation }: any) {
  const store = useStore();
  const { lang, activePerson, wallets, walletTxns, walletAutoPay, savingsGoal } = store;
  const t = COPY[lang];
  const balance = wallets[activePerson]||0;
  const autoPay = walletAutoPay[activePerson]||false;
  const myTxns = walletTxns.filter(tx=>tx.personId===activePerson);
  const sg = savingsGoal;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}><Text style={styles.title}>{t.walletTitle}</Text></View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.kicker}>{t.walletKicker}</Text>
          <Text style={styles.balance}>{NAIRA(balance)}</Text>
          <Button label={t.topUpBtn} fullWidth style={{marginTop:spacing.lg}} onPress={()=>navigation.navigate('TopUp')}/>
        </Card>

        {/* Auto-pay */}
        <Card style={styles.mb}>
          <View style={styles.toggleRow}>
            <View style={{flex:1}}>
              <Text style={styles.toggleLabel}>{t.autoPayLabel}</Text>
              <Text style={styles.toggleSub}>{t.autoPaySub}</Text>
            </View>
            <Toggle value={autoPay} onPress={()=>store.toggleAutoPay(activePerson)}/>
          </View>
        </Card>

        {/* Savings goal */}
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.savingsKicker}</Text>
          <Text style={styles.goalName}>{sg.name}</Text>
          <View style={styles.goalAmts}>
            <Text style={styles.saved}>{NAIRA(sg.saved)}</Text>
            <Text style={styles.target}> / {NAIRA(sg.target)}</Text>
          </View>
          <ProgressBar value={sg.saved} max={sg.target} style={{marginTop:spacing.sm} as any}/>
          <Button label={t.contributeBtn} variant="secondary" fullWidth style={{marginTop:spacing.lg}}
            onPress={()=>{ store.setPaySession({payContext:'savings',topupPresetIdx:null,topupCustom:''} as any); navigation.navigate('TopUp'); }}/>
        </Card>

        {/* Activity */}
        <Text style={styles.sectionLabel}>{t.walletActivity}</Text>
        {myTxns.length===0 && <Text style={styles.empty}>{t.noWalletActivity}</Text>}
        {myTxns.map(tx=>(
          <View key={tx.id} style={styles.txnRow}>
            <View style={{flex:1}}>
              <Text style={styles.txnLabel}>{tx.label}</Text>
              <Text style={styles.txnDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txnAmt,{color:tx.sign>0?colors.accentDark:colors.textPrimary}]}>
              {tx.sign>0?'+':'-'}{NAIRA(tx.amount)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  header:{paddingHorizontal:spacing.lg,paddingVertical:spacing.md},
  title:{fontSize:fontSize.xxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  balanceCard:{marginBottom:spacing.md},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.xs},
  balance:{fontSize:fontSize.display,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  mb:{marginBottom:spacing.md},
  toggleRow:{flexDirection:'row',alignItems:'center'},
  toggleLabel:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  toggleSub:{fontSize:fontSize.sm,color:colors.textSecondary,marginTop:2},
  goalName:{fontSize:fontSize.lg,fontWeight:'600',color:colors.textPrimary,marginTop:4},
  goalAmts:{flexDirection:'row',alignItems:'baseline',marginTop:spacing.xs},
  saved:{fontSize:fontSize.xl,fontWeight:'700',color:colors.textPrimary},
  target:{fontSize:fontSize.md,color:colors.textSecondary},
  sectionLabel:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.textTertiary,fontWeight:'600',marginBottom:spacing.sm,marginTop:spacing.sm},
  txnRow:{flexDirection:'row',alignItems:'center',paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  txnLabel:{fontSize:fontSize.base,fontWeight:'500',color:colors.textPrimary},
  txnDate:{fontSize:fontSize.sm,color:colors.textTertiary,marginTop:2},
  txnAmt:{fontSize:fontSize.base,fontWeight:'700',color:colors.textPrimary},
  empty:{fontSize:fontSize.md,color:colors.textTertiary,marginBottom:spacing.md},
});
