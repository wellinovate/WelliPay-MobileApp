import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, Toggle, Divider, ProgressBar, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, fmtDate } from '../../utils/helpers';
import { fetchWallet, ApiWallet } from '../../api/patientData';

export default function WalletScreen({ navigation }: any) {
  const store = useStore();
  const { lang, activePerson, walletAutoPay, savingsGoal } = store;
  const t = COPY[lang];
  const autoPay = walletAutoPay[activePerson]||false;
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [walletError, setWalletError] = useState('');
  const [walletLoading, setWalletLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    let active = true;
    fetchWallet()
      .then(w => { if (active) { setWallet(w); setWalletError(''); } })
      .catch(err => { if (active) setWalletError(err instanceof Error ? err.message : 'Could not load your wallet.'); })
      .finally(() => { if (active) setWalletLoading(false); });
    return () => { active = false; };
  }, []));
  const sg = savingsGoal;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}><Text style={styles.title}>{t.walletTitle}</Text></View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Balance card: real credit with the provider */}
        <Card style={styles.balanceCard}>
          <Text style={styles.kicker}>Wallet credit{wallet?.providerName ? ` · ${wallet.providerName}` : ''}</Text>
          {walletLoading && <ActivityIndicator color={colors.accent} style={{ alignSelf: 'flex-start', marginVertical: spacing.md }} />}
          {!walletLoading && wallet && <Text style={styles.balance}>{NAIRA(wallet.balanceMinor / 100)}</Text>}
          {!!walletError && <Banner message={walletError} variant="err" style={{ marginTop: spacing.sm }} />}
          <Text style={styles.toggleSub}>Credit you add can pay this provider's bills.</Text>
          <Button label="Add money" fullWidth style={{marginTop:spacing.lg}} onPress={()=>navigation.navigate('WalletTopUp')}/>
          <Button label="Saved cards" variant="secondary" fullWidth style={{marginTop:spacing.sm}} onPress={()=>navigation.navigate('SavedCards')}/>
          <Button label="Payment reminders" variant="secondary" fullWidth style={{marginTop:spacing.sm}} onPress={()=>navigation.navigate('Reminders')}/>
        </Card>

        {/* Auto-pay */}
        <Card style={styles.mb}>
          <View style={styles.toggleRow}>
            <View style={{flex:1}}>
              <Text style={styles.toggleLabel}>{t.autoPayLabel}</Text>
              <Text style={styles.toggleSub}>{t.autoPaySub} Preview only. Not connected yet.</Text>
            </View>
            <Toggle value={autoPay} onPress={()=>store.toggleAutoPay(activePerson)}/>
          </View>
        </Card>

        {/* HealthSave Smart Ajo Pots */}
        <Card style={[styles.mb, { backgroundColor: '#F0F9FA', borderColor: '#CCECEF', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.kicker, { color: colors.accentDark }]}>SMART HEALTHCARE AJO</Text>
            <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#166534' }}>11.5% APY</Text>
            </View>
          </View>
          <Text style={[styles.goalName, { fontSize: fontSize.base, marginTop: 4 }]}>Target Medical & Maternity Pots</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
            Save small-small for hospital admissions and surgery with automated spare-change roundups. Preview only. Not connected yet.
          </Text>
          <Button
            label="Manage HealthSave Pots"
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.md }}
            onPress={() => navigation.navigate('HealthSavePots')}
          />
        </Card>

        {/* Savings goal */}
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.savingsKicker} · Preview only</Text>
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
        {!walletLoading && wallet && wallet.entries.length===0 && <Text style={styles.empty}>{t.noWalletActivity}</Text>}
        {wallet?.entries.map(e=>(
          <View key={e.entryId} style={styles.txnRow}>
            <View style={{flex:1}}>
              <Text style={styles.txnLabel}>{e.kind==='TOPUP' ? 'Money added' : 'Paid a bill'}</Text>
              <Text style={styles.txnDate}>{fmtDate(new Date(e.createdAt))}</Text>
            </View>
            <Text style={[styles.txnAmt,{color:e.amountMinor>0?colors.accentDark:colors.textPrimary}]}>
              {e.amountMinor>0?'+':'-'}{NAIRA(Math.abs(e.amountMinor)/100)}
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
