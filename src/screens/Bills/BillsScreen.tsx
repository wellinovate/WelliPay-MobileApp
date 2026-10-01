import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, StatusPill, Chip } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';
import { fetchInvoices, ApiInvoice } from '../../api/patientData';
import { NotLinkedError } from '../../api/client';

export default function BillsScreen({ navigation }: any) {
  const { lang, bills, activePerson, setPaySession } = useStore();
  const t = COPY[lang];
  const [filter, setFilter] = useState('all');
  const insets = useSafeAreaInsets();

  // Real bills from the patient's linked WelliRecord account, loaded
  // alongside (not instead of) the demo bills below — wellipay-api only
  // models the invoice itself, not the HMO/deposit/funding breakdown the
  // demo bills below illustrate, so the two lists stay visually separate.
  const [liveInvoices, setLiveInvoices] = useState<ApiInvoice[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  const loadLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const items = await fetchInvoices();
      setLiveInvoices(items);
    } catch (err) {
      // Not linked yet, offline, or token expired — the demo bills list
      // below still works, so this just quietly stays empty.
      if (!(err instanceof NotLinkedError)) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load live invoices', err);
      }
      setLiveInvoices([]);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => { loadLive(); }, [loadLive]);

  const myBills = bills.filter(b=>b.personId===activePerson);
  const filtered = filter==='all' ? myBills
    : filter==='unpaid' ? myBills.filter(b=>['unpaid','overdue','partly_paid','awaiting_hmo'].includes(b.status))
    : myBills.filter(b=>b.status==='paid');

  return (
    <View style={[styles.screen,{paddingTop:insets.top}]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.billsTitle}</Text>
      </View>

      {(liveLoading || liveInvoices.length > 0) && (
        <View style={styles.liveSection}>
          <Text style={styles.liveHeading}>Your bills (from your hospital)</Text>
          {liveLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.sm }} />
          ) : (
            liveInvoices.map(inv => (
              <TouchableOpacity
                key={inv.invoiceId}
                activeOpacity={0.8}
                onPress={() => { setPaySession({ liveInvoiceId: inv.invoiceId, payBillId: null }); navigation.navigate('BillDetail'); }}
              >
                <Card style={styles.mb}>
                  <View style={styles.row}>
                    <View style={{flex:1}}>
                      <Text style={styles.facility} numberOfLines={1}>{inv.description}</Text>
                      <Text style={styles.date}>{inv.providerInvoiceRef}</Text>
                    </View>
                    <View style={{alignItems:'flex-end',gap:4}}>
                      <Text style={styles.amount}>{NAIRA((inv.amountMinor - inv.paidAmountMinor) / 100)}</Text>
                      <StatusPill status={inv.status === 'PAID' ? 'paid' : inv.status === 'PARTIALLY_PAID' ? 'partly_paid' : 'unpaid'}/>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.liveHeading}>Demo bills</Text>
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
          <TouchableOpacity activeOpacity={0.8} onPress={()=>{ setPaySession({payBillId:b.id, liveInvoiceId:null} as any); navigation.navigate('BillDetail'); }}>
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
  liveSection:{paddingHorizontal:spacing.lg,marginBottom:spacing.sm},
  liveHeading:{fontSize:fontSize.sm,fontWeight:'700',color:colors.textTertiary,textTransform:'uppercase',letterSpacing:0.5,marginBottom:spacing.sm},
  filters:{flexDirection:'row',gap:spacing.sm,paddingHorizontal:spacing.lg,marginBottom:spacing.md},
  list:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  mb:{marginBottom:spacing.sm},
  row:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm},
  facility:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  date:{fontSize:fontSize.sm,color:colors.textTertiary,marginTop:2},
  amount:{fontSize:fontSize.lg,fontWeight:'700',color:colors.textPrimary},
  empty:{fontSize:fontSize.md,color:colors.textTertiary,textAlign:'center',marginTop:60},
});
