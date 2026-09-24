import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, ScreenHeader, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function OTPScreen({ navigation, route }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const phone = route.params?.phone || '8030000000';
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(()=>{
      setCountdown(c=>{ if(c<=1){clearInterval(timer.current!);return 0;}return c-1;});
    },1000);
    return ()=>clearInterval(timer.current!);
  },[]);

  const appendKey = (k: string) => {
    if(k==='⌫'){setCode(c=>c.slice(0,-1));setError(false);return;}
    if(code.length>=6)return;
    const next = code+k;
    setCode(next);
    if(next.length===6){ setError(false); navigation.navigate('ProfileSetup'); }
  };

  const digits = code.split('').concat(Array(6).fill('')).slice(0,6);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <View style={styles.body}>
        <Text style={styles.title}>{t.otpTitle}</Text>
        <Text style={styles.helper}>{t.otpHelper}+234 {phone}</Text>
        <View style={styles.boxes}>
          {digits.map((d,i)=><View key={i} style={[styles.box, d&&styles.boxFilled, error&&styles.boxErr]}>
            <Text style={styles.boxText}>{d||''}</Text>
          </View>)}
        </View>
        {error ? <Text style={styles.errText}>{t.otpWrongMsg}</Text> : null}
        <View style={styles.demoRow}>
          <TouchableOpacity onPress={()=>{setCode('123456');setError(false);setTimeout(()=>navigation.navigate('ProfileSetup'),200);}}>
            <Text style={styles.demoBtn}>{t.demoCorrect}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setCode('000000');setError(true);}}>
            <Text style={[styles.demoBtn,{color:colors.danger}]}>{t.demoWrong}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity disabled={countdown>0} onPress={()=>{setCode('');setError(false);setCountdown(30);}}>
          <Text style={[styles.resend, countdown>0&&{opacity:0.4}]}>
            {countdown>0?`${t.resendLabel ? (typeof t.resendLabel==='function'?t.resendLabel(countdown):`Resend in ${countdown}s`) : `Resend in ${countdown}s`}`:'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{flex:1, paddingHorizontal:spacing.xl, paddingTop:spacing.xxl},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, marginBottom:spacing.sm},
  helper:{fontSize:fontSize.md, color:colors.textSecondary, marginBottom:spacing.xxl},
  boxes:{flexDirection:'row', gap:spacing.sm, marginBottom:spacing.xl},
  box:{width:44, height:56, borderRadius:radius.md, borderWidth:1.5, borderColor:colors.border, backgroundColor:colors.surface, alignItems:'center', justifyContent:'center'},
  boxFilled:{borderColor:colors.accent},
  boxErr:{borderColor:colors.danger},
  boxText:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary},
  errText:{fontSize:fontSize.sm, color:colors.danger, marginBottom:spacing.md},
  demoRow:{flexDirection:'row', gap:spacing.xl, marginBottom:spacing.xl},
  demoBtn:{fontSize:fontSize.sm, color:colors.accent, fontWeight:'600'},
  resend:{fontSize:fontSize.md, color:colors.accent, fontWeight:'600', textAlign:'center'},
});
