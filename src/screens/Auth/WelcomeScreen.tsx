import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function WelcomeScreen({ navigation }: any) {
  const { lang, setLang } = useStore();
  const t = COPY[lang];
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.accentDark, colors.accent, colors.accentMid]} style={styles.container}>
      <StatusBar barStyle="light-content"/>
      <ScrollView contentContainerStyle={[styles.inner,{paddingTop:insets.top+40, paddingBottom:insets.bottom+32}]}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>WelliPay</Text>
          <Text style={styles.logoSub}>₦</Text>
        </View>
        <Text style={styles.tagline}>{t.tagline}</Text>
        <Text style={styles.body}>{t.welcomeBody}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity onPress={()=>setLang('en')} style={[styles.langBtn, lang==='en'&&styles.langActive]}>
            <Text style={[styles.langLabel, lang==='en'&&styles.langLabelActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setLang('pcm')} style={[styles.langBtn, lang==='pcm'&&styles.langActive]}>
            <Text style={[styles.langLabel, lang==='pcm'&&styles.langLabelActive]}>Pidgin</Text>
          </TouchableOpacity>
        </View>
        <Button label={t.getStarted} onPress={()=>navigation.navigate('Phone')}
          style={styles.cta} textStyle={{color:colors.accent}} variant="secondary" fullWidth/>
        <Text style={styles.terms}>{t.terms}</Text>
      </ScrollView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container:{flex:1},
  inner:{paddingHorizontal:spacing.xxxl, alignItems:'center'},
  logoRow:{flexDirection:'row', alignItems:'center', gap:6, marginBottom:spacing.lg},
  logo:{fontSize:42, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.white, letterSpacing:-1},
  logoSub:{fontSize:32, color:colors.white, opacity:0.7},
  tagline:{fontSize:fontSize.lg, color:colors.white, fontStyle:'italic', textAlign:'center', marginBottom:spacing.xl, opacity:0.9},
  body:{fontSize:fontSize.base, color:colors.white, textAlign:'center', lineHeight:24, marginBottom:spacing.xxxl, opacity:0.8},
  langRow:{flexDirection:'row', gap:spacing.md, marginBottom:spacing.xxxl},
  langBtn:{paddingVertical:spacing.sm, paddingHorizontal:spacing.xl, borderRadius:radius.full, borderWidth:1.5, borderColor:'rgba(255,255,255,0.4)'},
  langActive:{borderColor:colors.white, backgroundColor:'rgba(255,255,255,0.15)'},
  langLabel:{color:'rgba(255,255,255,0.7)', fontSize:fontSize.base, fontWeight:'500'},
  langLabelActive:{color:colors.white, fontWeight:'700'},
  cta:{marginBottom:spacing.lg},
  terms:{fontSize:fontSize.xs, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:16},
});
