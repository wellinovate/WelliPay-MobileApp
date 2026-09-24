import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, StatusPill, AvatarCircle } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, getAvatarColor, initials } from '../../utils/helpers';

export default function HomeScreen({ navigation }: any) {
  const store = useStore();
  const { lang, activePerson, people, bills, wallets } = store;
  const t = COPY[lang];
  const [showSheet, setShowSheet] = useState(false);

  const myBills = bills.filter(b=>b.personId===activePerson);
  const dueBills = myBills.filter(b=>['unpaid','overdue','partly_paid','awaiting_hmo'].includes(b.status));
  const totalDue = dueBills.reduce((s,b)=>s+b.amountDue,0);
  const nextDue = dueBills[0];
  const recent = myBills.slice(0,4);
  const wallet = wallets[activePerson]||0;
  const person = people.find(p=>p.id===activePerson);
  const ac = getAvatarColor(activePerson);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, {paddingTop:insets.top}]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.personChip} onPress={()=>setShowSheet(true)} activeOpacity={0.7}>
          <AvatarCircle personId={activePerson} name={person?.name||'Me'} size={34}/>
          <Text style={styles.personName}>{person?.name||'Me'}</Text>
          <Text style={styles.caret}>▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bellBtn} onPress={()=>navigation.navigate('Notifications')} activeOpacity={0.7}>
          <Text style={styles.bell}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Total outstanding */}
        <Card style={styles.mb}>
          <Text style={styles.kicker}>{t.summaryKicker}</Text>
          <Text style={styles.bigAmount}>{NAIRA(totalDue)}</Text>
        </Card>

        {/* Next due */}
        {nextDue && (
          <Card style={styles.mb}>
            <Text style={styles.kicker}>{t.nextDueKicker}</Text>
            <Text style={styles.facilityName}>{nextDue.facility}</Text>
            <View style={styles.dueLine}>
              <Text style={styles.amount}>{NAIRA(nextDue.amountDue)}</Text>
              <Text style={styles.dateText}>{t.due} {nextDue.date}</Text>
            </View>
            <Button label={t.payNow} fullWidth style={{marginTop:spacing.md}}
              onPress={()=>{ store.setPaySession({payBillId:nextDue.id,payContext:'bill',payAmountMode:'full',payPartAmount:'',payMethodBanner:false} as any); navigation.navigate('Amount'); }}/>
          </Card>
        )}

        {/* Wallet */}
        <TouchableOpacity activeOpacity={0.8} onPress={()=>navigation.navigate('WalletTab')}>
          <Card style={styles.mb}>
            <View style={styles.walletRow}>
              <View>
                <Text style={styles.kicker}>{t.walletKicker}</Text>
                <Text style={styles.amount}>{NAIRA(wallet)}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Healthcare & Coverage */}
        <Card style={styles.mb}>
          <Text style={styles.kicker}>HEALTHCARE & COVERAGE</Text>
          <View style={{flexDirection:'row',gap:spacing.sm,marginTop:spacing.xs}}>
            <TouchableOpacity
              style={{flex:1,backgroundColor:colors.accentLight,padding:spacing.md,borderRadius:radius.sm}}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Hmo')}
            >
              <Text style={{fontSize:fontSize.sm,fontWeight:'700',color:colors.accentDark}}>🛡️ Insurance & HMO</Text>
              <Text style={{fontSize:fontSize.xs,color:colors.accentMid,marginTop:2}}>Hygeia · 90% Co-Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{flex:1,backgroundColor:colors.surfaceAlt,padding:spacing.md,borderRadius:radius.sm}}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FacilityDirectory')}
            >
              <Text style={{fontSize:fontSize.sm,fontWeight:'700',color:colors.textPrimary}}>🏥 Hospitals</Text>
              <Text style={{fontSize:fontSize.xs,color:colors.textSecondary,marginTop:2}}>6 Linked · Direct Routing</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent bills */}
        <Text style={styles.sectionLabel}>{t.recentBills}</Text>
        {recent.length ? recent.map(b=>(
          <TouchableOpacity key={b.id} activeOpacity={0.8}
            onPress={()=>{ store.setPaySession({payBillId:b.id} as any); navigation.navigate('BillDetail'); }}>
            <Card style={styles.mb}>
              <View style={styles.billRow}>
                <View style={{flex:1}}>
                  <Text style={styles.facilityName} numberOfLines={1}>{b.facility}</Text>
                  <Text style={styles.dateText}>{b.date}</Text>
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={styles.amount}>{NAIRA(b.amountDue||b.amountTotal)}</Text>
                  <StatusPill status={b.status}/>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )) : <Text style={styles.empty}>{t.noBillsYet}</Text>}

        <Button label={t.addBill} variant="secondary" fullWidth style={{marginTop:spacing.sm}}
          onPress={()=>navigation.navigate('AddBill')}/>
      </ScrollView>

      {/* Person switcher modal */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={()=>setShowSheet(false)}>
        <TouchableOpacity style={styles.backdrop} onPress={()=>setShowSheet(false)} activeOpacity={1}>
          <View style={[styles.sheet,{paddingBottom:insets.bottom+spacing.xl}]} onStartShouldSetResponder={()=>true}>
            <Text style={styles.sheetTitle}>{t.people}</Text>
            {people.map(p=>(
              <TouchableOpacity key={p.id} style={styles.sheetRow}
                onPress={()=>{ store.setActivePerson(p.id); setShowSheet(false); }} activeOpacity={0.7}>
                <AvatarCircle personId={p.id} name={p.name} size={40}/>
                <View style={{flex:1}}>
                  <Text style={styles.sheetName}>{p.name}</Text>
                  <Text style={styles.sheetRel}>{p.relation}</Text>
                </View>
                {p.id===activePerson && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <Button label={t.addPerson} variant="ghost" fullWidth style={{marginTop:spacing.md}}
              onPress={()=>{ setShowSheet(false); navigation.navigate('AddDep'); }}/>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  topBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.lg,paddingVertical:spacing.md},
  personChip:{flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.sm,paddingVertical:spacing.xs,borderRadius:radius.full},
  personName:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  caret:{fontSize:10,color:colors.textTertiary},
  bellBtn:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
  bell:{fontSize:20},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  mb:{marginBottom:spacing.md},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.xs},
  bigAmount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary,marginTop:spacing.xs},
  amount:{fontSize:fontSize.xxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  facilityName:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary,marginTop:spacing.xs},
  dueLine:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:spacing.xs},
  dateText:{fontSize:fontSize.sm,color:colors.textTertiary},
  walletRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  arrow:{fontSize:fontSize.xl,color:colors.textTertiary},
  sectionLabel:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.textTertiary,fontWeight:'600',marginBottom:spacing.sm,marginTop:spacing.xs},
  billRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm},
  empty:{fontSize:fontSize.md,color:colors.textTertiary,marginBottom:spacing.md},
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'},
  sheet:{backgroundColor:colors.surface,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,padding:spacing.xl},
  sheetTitle:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.textTertiary,fontWeight:'600',marginBottom:spacing.lg},
  sheetRow:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.md},
  sheetName:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  sheetRel:{fontSize:fontSize.sm,color:colors.textSecondary},
  checkmark:{fontSize:fontSize.lg,color:colors.accent,fontWeight:'700'},
});
