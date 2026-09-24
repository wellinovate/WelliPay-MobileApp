import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader, Card, Divider } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { statusMeta } from '../../utils/statusMeta';

export default function ReportDetailScreen() {
  const { lang, bills } = useStore();
  const store = useStore() as any;
  const t = COPY[lang];
  const bill = bills.find((b: any)=>b.id===store.reportBillId)||bills[0];
  const sm = statusMeta('under_review');
  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.reportdetailTitle}/>
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.kicker}>{t.ticketLabel}</Text>
          <Text style={styles.ticket}>{store.reportTicket||'RPT-DEMO01'}</Text>
          <Divider/>
          <View style={styles.row}><Text style={styles.label}>{t.statusLabel}</Text><View style={[styles.pill,{backgroundColor:sm.bg}]}><Text style={[styles.pillText,{color:sm.fg}]}>⏱ {t.underReviewStatus}</Text></View></View>
          {bill&&<View style={styles.row}><Text style={styles.label}>{t.facilityLabel}</Text><Text style={styles.val}>{bill.facility}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>{t.reportCategoryLabel}</Text><Text style={styles.val}>{(t as any)['cat_'+(store.reportCategory||'other')]}</Text></View>
        </Card>
        <Text style={styles.note}>{t.reportFollowupNote}</Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  kicker:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.accentMid,fontWeight:'600',marginBottom:spacing.xs},
  ticket:{fontSize:fontSize.xl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary,marginBottom:spacing.md},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:spacing.sm},
  label:{fontSize:fontSize.md,color:colors.textSecondary},
  val:{fontSize:fontSize.md,fontWeight:'600',color:colors.textPrimary},
  pill:{paddingHorizontal:spacing.sm,paddingVertical:3,borderRadius:999},
  pillText:{fontSize:fontSize.xs,fontWeight:'600'},
  note:{fontSize:fontSize.sm,color:colors.textTertiary,marginTop:spacing.xl,lineHeight:20},
});
