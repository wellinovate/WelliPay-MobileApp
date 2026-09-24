import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ScreenHeader, Button, Card } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { NAIRA } from '../../utils/helpers';

const PRESETS = [5000,10000,20000,50000];

export default function TopUpScreen({ navigation }: any) {
  const store = useStore();
  const { lang, payContext } = store as any;
  const t = COPY[lang];
  const isTopup = !payContext || payContext==='topup';
  const [presetIdx, setPresetIdx] = useState<number|null>(null);
  const [custom, setCustom] = useState('');

  const proceed = () => {
    store.setPaySession({
      payContext: isTopup ? 'topup' : 'savings',
      topupPresetIdx: presetIdx,
      topupCustom: presetIdx===null ? custom : '',
      payBillId: null,
    } as any);
    navigation.navigate('Method');
  };

  const amt = presetIdx!==null ? PRESETS[presetIdx] : parseInt(custom.replace(/[^0-9]/g,''))||0;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={isTopup ? t.topup_title : t.savings_topup_title}/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.presets}>
          {PRESETS.map((p,i)=>(
            <TouchableOpacity key={i} onPress={()=>{setPresetIdx(i);setCustom('');}}
              style={[styles.preset, presetIdx===i&&styles.presetOn]} activeOpacity={0.7}>
              <Text style={[styles.presetText,presetIdx===i&&styles.presetTextOn]}>{NAIRA(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.orLabel}>{t.customAmountLabel}</Text>
        <TextInput style={styles.input} value={custom} onChangeText={v=>{setCustom(v.replace(/[^0-9]/g,''));setPresetIdx(null);}}
          keyboardType="number-pad" placeholder="₦0" placeholderTextColor={colors.textTertiary}/>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={`${isTopup?t.topUpBtn:t.contributeBtn} — ${NAIRA(amt)}`} fullWidth disabled={amt===0} onPress={proceed}/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  presets:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},
  preset:{paddingVertical:spacing.md,paddingHorizontal:spacing.lg,borderRadius:radius.md,borderWidth:1.5,borderColor:colors.border,backgroundColor:colors.surface},
  presetOn:{borderColor:colors.accent,backgroundColor:colors.accentLight},
  presetText:{fontSize:fontSize.base,fontWeight:'600',color:colors.textPrimary},
  presetTextOn:{color:colors.accentDark},
  orLabel:{fontSize:fontSize.sm,color:colors.textSecondary,marginVertical:spacing.lg},
  input:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,paddingVertical:13,fontSize:fontSize.xl,color:colors.textPrimary,backgroundColor:colors.surface},
  footer:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border},
});
