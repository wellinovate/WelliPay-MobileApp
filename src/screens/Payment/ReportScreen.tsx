import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenHeader, Button, Card } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function ReportScreen({ navigation }: any) {
  const store = useStore();
  const { lang, bills, reportBillId } = store as any;
  const t = COPY[lang];
  const bill = bills.find((b: any)=>b.id===reportBillId)||bills[0];
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const cats = [
    {key:'wrongAmt',label:t.cat_wrongAmt},{key:'alreadyPaid',label:t.cat_alreadyPaid},
    {key:'duplicate',label:t.cat_duplicate},{key:'other',label:t.cat_other},
  ];

  const submit = () => {
    const ticket = 'RPT-' + Math.random().toString(36).slice(2,8).toUpperCase();
    store.setPaySession({reportCategory:cat,reportDesc:desc,reportSubmitted:true,reportTicket:ticket} as any);
    setSubmitted(true);
  };

  if (submitted) return (
    <View style={styles.screen}>
      <ScreenHeader title={t.reportTitle}/>
      <View style={styles.successBox}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>{t.reportSubmittedMsg}</Text>
        <Button label={t.reportdetailTitle} onPress={()=>navigation.navigate('ReportDetail')} style={{marginTop:spacing.xl}}/>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.reportTitle}/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {bill && <Text style={styles.billRef}>{bill.facility} · {bill.billNo}</Text>}
        <Text style={styles.fieldLabel}>{t.reportCategoryLabel}</Text>
        {cats.map(c=>(
          <TouchableOpacity key={c.key} onPress={()=>setCat(c.key)}>
            <Card style={[styles.catCard, cat===c.key&&styles.catSelected]}>
              <Text style={styles.catLabel}>{c.label}</Text>
            </Card>
          </TouchableOpacity>
        ))}
        <Text style={[styles.fieldLabel,{marginTop:spacing.xl}]}>{t.reportDescLabel}</Text>
        <TextInput style={styles.textarea} value={desc} onChangeText={setDesc}
          placeholder={t.reportDescPlaceholder} placeholderTextColor={colors.textTertiary}
          multiline numberOfLines={4} textAlignVertical="top"/>
      </ScrollView>
      <View style={styles.footer}><Button label={t.reportSubmit} fullWidth onPress={submit}/></View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  billRef:{fontSize:fontSize.sm,color:colors.textTertiary,marginBottom:spacing.xl},
  fieldLabel:{fontSize:fontSize.sm,color:colors.textSecondary,fontWeight:'600',marginBottom:spacing.sm},
  catCard:{marginBottom:spacing.sm},
  catSelected:{borderColor:colors.accent,borderWidth:1.5},
  catLabel:{fontSize:fontSize.base,color:colors.textPrimary},
  textarea:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,fontSize:fontSize.md,color:colors.textPrimary,backgroundColor:colors.surface,height:120,marginTop:spacing.sm},
  footer:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border},
  successBox:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md},
  successIcon:{fontSize:56,color:colors.accent},
  successText:{fontSize:fontSize.lg,fontWeight:'600',color:colors.textPrimary,textAlign:'center',paddingHorizontal:spacing.xxl},
});
