import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, StatusPill, Chip } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function BillsScreen({ navigation }: any) {
  const { lang, bills, activePerson, setPaySession } = useStore();
  const t = COPY[lang];
  const [filter, setFilter] = useState('all');
  const insets = useSafeAreaInsets();

  const myBills = bills.filter(b=>b.personId===activePerson);
  const filtered = filter==='all' ? myBills
    : filter==='unpaid' ? myBills.filter(b=>['unpaid','overdue','partly_paid','awaiting_hmo'].includes(b.status))
    : myBills.filter(b=>b.status==='paid');

  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.billsTitle}</Text>
      </View>
      <View style={styles.filters}>
        {(['all','unpaid','paid'] as const).map(f=>(
          <Chip key={f} label={f==='all'?t.filterAll:f==='unpaid'?t.filterUnpaid:t.filterPaid}
            active={filter===f} onPress={()=>setFilter(f)}/>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={b=>b.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t.noBillsFilter}</Text>}
        renderItem={({item:b})=>(
          <TouchableOpacity activeOpacity={0.8} onPress={()=>{ setPaySession({payBillId:b.id} as any); navigation.navigate('BillDetail'); }}>
            <Card style={styles.mb}>
              <View style={styles.row}>
                <View style={{flex:1}}>
                  <Text style={styles.facility} numberOfLines={1}>{b.facility}</Text>
                  <Text style={styles.date}>{b.date}</Text>
                </View>
                <View style={{alignItems:'flex-end',gap:4}}>
                  <Text style={styles.amount}>{NAIRA(b.amountDue||b.amountTotal)}</Text>
                  <StatusPill status={b.status}/>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}/>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  header:{paddingHorizontal:spacing.lg,paddingVertical:spacing.md},
  title:{fontSize:fontSize.xxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  filters:{flexDirection:'row',gap:spacing.sm,paddingHorizontal:spacing.lg,marginBottom:spacing.md},
  list:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  mb:{marginBottom:spacing.sm},
  row:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm},
  facility:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  date:{fontSize:fontSize.sm,color:colors.textTertiary,marginTop:2},
  amount:{fontSize:fontSize.lg,fontWeight:'700',color:colors.textPrimary},
  empty:{fontSize:fontSize.md,color:colors.textTertiary,textAlign:'center',marginTop:60},
});
