import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ScreenHeader, Card, Button, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

export default function AmountScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, payBillId } = store;
  const t = COPY[lang];
  const bill = bills.find(b=>b.id===payBillId);
  const [mode, setMode] = useState<'full'|'part'>('full');
  const [partAmt, setPartAmt] = useState('');
  const [err, setErr] = useState('');
  if (!bill) return null;

  const proceed = () => {
    if (mode==='part') {
      const v = parseInt(partAmt.replace(/[^0-9]/g,''))||0;
      if (v < (bill.minPart||0)) { setErr(typeof t.amountTooLow==='function'?t.amountTooLow(NAIRA(bill.minPart||0)):'Too low'); return; }
      if (v > bill.amountDue) { setErr(t.amountTooHigh); return; }
      store.setPaySession({payAmountMode:'part',payPartAmount:String(v)} as any);
    } else {
      store.setPaySession({payAmountMode:'full',payPartAmount:''} as any);
    }
    navigation.navigate('Method');
  };

  const selBorder = { borderWidth:1.5, borderColor:colors.accent };
  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.amountTitle}/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.facility}>{bill.facility}</Text>
        <Text style={styles.amount}>{NAIRA(bill.amountDue)} <Text style={styles.amtLabel}>due</Text></Text>
        <View style={{gap:spacing.md,marginTop:spacing.lg}}>
          <TouchableOpacity onPress={()=>{setMode('full');setErr('');}}>
            <Card style={mode==='full'?selBorder:{}}>
              <View style={styles.optRow}>
                <Text style={styles.optLabel}>{t.payFull} — {NAIRA(bill.amountDue)}</Text>
                <View style={[styles.radio, mode==='full'&&styles.radioOn]}/>
              </View>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setMode('part')}>
            <Card style={mode==='part'?selBorder:{}}>
              <View style={styles.optRow}>
                <Text style={styles.optLabel}>{t.payPart}</Text>
                <View style={[styles.radio, mode==='part'&&styles.radioOn]}/>
              </View>
              {mode==='part' && (
                <View style={{marginTop:spacing.md}}>
                  <TextInput style={styles.input} value={partAmt} onChangeText={v=>{setPartAmt(v);setErr('');}}
                    keyboardType="number-pad" placeholder="₦0" placeholderTextColor={colors.textTertiary} autoFocus/>
                  <Text style={styles.hint}>{typeof t.minPartHelper==='function'?t.minPartHelper(NAIRA(bill.minPart||0)):''}</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
          {err ? <Banner message={err} variant="err"/> : null}
        </View>
      </ScrollView>
      <View style={styles.footer}><Button label={t.continue} onPress={proceed} fullWidth/></View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  facility:{fontSize:fontSize.md,color:colors.textSecondary,marginBottom:4},
  amount:{fontSize:fontSize.xxxl,fontWeight:'700',fontFamily:'SourceSerif4_700Bold',color:colors.textPrimary},
  amtLabel:{fontSize:fontSize.base,fontWeight:'400',color:colors.textSecondary},
  optRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  optLabel:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary,flex:1},
  radio:{width:18,height:18,borderRadius:9,borderWidth:1.5,borderColor:colors.border},
  radioOn:{borderColor:colors.accent,backgroundColor:colors.accent},
  input:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,paddingVertical:10,fontSize:fontSize.xl,color:colors.textPrimary,backgroundColor:colors.bg},
  hint:{fontSize:fontSize.xs,color:colors.textTertiary,marginTop:4},
  footer:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border},
});
