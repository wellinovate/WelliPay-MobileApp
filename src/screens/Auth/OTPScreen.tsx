import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Button, ScreenHeader, Banner, Keypad } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

type Flow = 'signIn' | 'signUp';

export default function OTPScreen({ navigation, route }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const phone = route.params?.phone || '8030000000';
  const flow: Flow = route.params?.flow || 'signIn';
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(()=>{
      setCountdown(c=>{ if(c<=1){clearInterval(timer.current!);return 0;}return c-1;});
    },1000);
    return ()=>clearInterval(timer.current!);
  },[]);

  const verify = async (fullCode: string) => {
    setVerifying(true);
    setError(false);
    setErrorMsg('');
    try {
      if (flow === 'signIn') {
        const attempt = await signIn!.attemptFirstFactor({ strategy: 'phone_code', code: fullCode });
        if (attempt.status === 'complete') {
          await setActiveSignIn!({ session: attempt.createdSessionId });
          navigation.navigate('ProfileSetup');
        } else {
          throw new Error('Verification incomplete — this account may need an additional step.');
        }
      } else {
        const attempt = await signUp!.attemptPhoneNumberVerification({ code: fullCode });
        if (attempt.status === 'complete') {
          await setActiveSignUp!({ session: attempt.createdSessionId });
          navigation.navigate('ProfileSetup');
        } else {
          throw new Error('Verification incomplete — this account may need an additional step.');
        }
      }
    } catch (err) {
      setError(true);
      setErrorMsg(err instanceof Error ? err.message : t.otpWrongMsg);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const appendKey = (k: string) => {
    if (verifying) return;
    if(k==='⌫'){setCode(c=>c.slice(0,-1));setError(false);return;}
    if(code.length>=6)return;
    const next = code+k;
    setCode(next);
    if(next.length===6){ verify(next); }
  };

  const resend = async () => {
    setCode(''); setError(false); setErrorMsg(''); setCountdown(30);
    try {
      if (flow === 'signIn') {
        const phoneFactor = signIn?.supportedFirstFactors?.find((f) => f.strategy === 'phone_code');
        if (phoneFactor && 'phoneNumberId' in phoneFactor) {
          await signIn!.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneFactor.phoneNumberId });
        }
      } else {
        await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
      }
    } catch {
      // Resend failures aren't fatal — the user can wait for the countdown
      // and try again, or go back and re-enter their number.
    }
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
        {error ? <Banner message={errorMsg || t.otpWrongMsg} variant="err" style={{marginBottom:spacing.md}}/> : null}
        <TouchableOpacity disabled={countdown>0} onPress={resend}>
          <Text style={[styles.resend, countdown>0&&{opacity:0.4}]}>
            {countdown>0?`Resend in ${countdown}s`:'Resend code'}
          </Text>
        </TouchableOpacity>
        <Keypad onPress={appendKey}/>
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
  resend:{fontSize:fontSize.md, color:colors.accent, fontWeight:'600', marginBottom:spacing.xl},
});
