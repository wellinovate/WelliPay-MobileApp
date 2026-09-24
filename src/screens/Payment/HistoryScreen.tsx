import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, StatusPill, Chip } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA, methodLabel } from '../../utils/helpers';

export default function HistoryScreen() {
  const { lang, payments } = useStore();
  const t = COPY[lang];
  const [filter, setFilter] = useState('all');
  const insets = useSafeAreaInsets();

  const filtered = filter==='month' ? payments.filter(p=>p.date.includes('Sep 2026')) : payments;
  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}><Text style={styles.title}>{t.historyTitle}</Text></View>
      <View style={styles.filters}>
        <Chip label={t.filterAll} active={filter==='all'} onPress={()=>setFilter('all')}/>
        <Chip label={t.thisMonth} active={filter==='month'} onPress={()=>setFilter('month')}/>
      </View>
      <FlatList data={filtered} keyExtractor={p=>p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t.noPaymentsYet}</Text>}
        renderItem={({item:p})=>(
          <Card style={styles.mb}>
            <View style={styles.row}>
              <View style={{flex:1}}>
                <Text style={styles.facility} numberOfLines={1}>{p.facility}</Text>
                <Text style={styles.date}>{p.date} · {methodLabel(p.method)}</Text>
              </View>
              <View style={{alignItems:'flex-end',gap:4}}>
                <Text style={styles.amount}>{NAIRA(p.amount)}</Text>
                <StatusPill status={p.status}/>
              </View>
            </View>
          </Card>
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
