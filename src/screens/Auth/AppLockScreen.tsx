import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Keypad, PinDots, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { hapticSuccess, hapticError, hapticMedium } from '../../utils/haptics';
import { authenticateWithBiometrics, getBiometricSupport } from '../../utils/biometrics';

export default function AppLockScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const [stage, setStage] = useState<'set'|'confirm'>('set');
  const [first, setFirst] = useState('');
  const [entry, setEntry] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [bioName, setBioName] = useState('Biometrics');

  useEffect(() => {
    getBiometricSupport().then(res => {
      if (res.available) setBioName(res.biometricName);
    });
  }, []);

  const handleKey = (k: string) => {
    if (k==='⌫'){ setEntry(e=>e.slice(0,-1)); setMismatch(false); return; }
    if (entry.length>=4) return;
    const next = entry+k;
    setEntry(next);
    if (next.length===4) {
      if (stage==='set') {
        hapticMedium();
        setFirst(next);
        setEntry('');
        setStage('confirm');
      } else if (next===first) {
        hapticSuccess();
        store.setPaySession({ appPin: next } as any);
        navigation.navigate('LinkWR');
      } else {
        hapticError();
        setMismatch(true);
        setEntry('');
        setFirst('');
        setStage('set');
      }
    }
  };

  const handleBiometric = async () => {
    const res = await authenticateWithBiometrics(`Enable ${bioName} for WelliPay`);
    if (res.success) {
      hapticSuccess();
      if (!store.biometricEnabled) store.toggleBio();
      navigation.navigate('LinkWR');
    } else {
      hapticError();
      Alert.alert('Biometric Setup', res.error || 'Authentication could not be completed.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>{t.lockTitle}</Text>
        <Text style={styles.helper}>{t.lockHelper}</Text>
        {mismatch && <Banner message={t.pinMismatchMsg} variant="err" style={{marginBottom:spacing.xl}}/>}
        <PinDots filled={entry.length} error={mismatch}/>
        <Text style={styles.stageLabel}>{stage==='set'?t.setPinLabel:t.confirmPinLabel}</Text>
        <Keypad onPress={handleKey}/>
        <TouchableOpacity onPress={handleBiometric} style={styles.bioBtn} activeOpacity={0.7}>
          <Text style={styles.bioBtnText}>Enable {bioName} instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{flex:1, paddingHorizontal:spacing.xl, alignItems:'center', justifyContent:'center'},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, textAlign:'center', marginBottom:spacing.sm},
  helper:{fontSize:fontSize.md, color:colors.textSecondary, textAlign:'center', marginBottom:spacing.xl},
  stageLabel:{fontSize:fontSize.sm, color:colors.textSecondary, marginTop:spacing.sm, marginBottom:spacing.xl},
  bioBtn:{marginTop:spacing.xxl, paddingVertical:spacing.md},
  bioBtnText:{fontSize:fontSize.base, color:colors.accent, fontWeight:'600', textAlign:'center'},
});
