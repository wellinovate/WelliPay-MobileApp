import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button, ScreenHeader } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function ProfileSetupScreen({ navigation }: any) {
  const { lang } = useStore();
  const t = COPY[lang];
  const [name, setName] = useState('Jay Umar');
  const [email, setEmail] = useState('');

  return (
    <View style={styles.screen}>
      <ScreenHeader title="" showBack/>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.profileTitle}</Text>
        <View style={styles.field}>
          <Text style={styles.label}>{t.fullName}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textTertiary}/>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t.dob}</Text>
          <View style={{flexDirection:'row',gap:spacing.sm}}>
            <TextInput style={[styles.input,{width:60}]} placeholder="DD" keyboardType="number-pad" placeholderTextColor={colors.textTertiary}/>
            <TextInput style={[styles.input,{width:60}]} placeholder="MM" keyboardType="number-pad" placeholderTextColor={colors.textTertiary}/>
            <TextInput style={[styles.input,{flex:1}]} placeholder="YYYY" keyboardType="number-pad" placeholderTextColor={colors.textTertiary}/>
          </View>
          <Text style={styles.hint}>{t.dobHelper}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t.emailOpt}</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="you@example.com" placeholderTextColor={colors.textTertiary}/>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t.continue} onPress={()=>navigation.navigate('AppLock')} fullWidth/>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.xl, paddingTop:spacing.xxl},
  title:{fontSize:fontSize.xxl, fontWeight:'700', fontFamily:'SourceSerif4_700Bold', color:colors.textPrimary, marginBottom:spacing.xxl},
  field:{marginBottom:spacing.xl},
  label:{fontSize:fontSize.sm, color:colors.textSecondary, marginBottom:spacing.sm, fontWeight:'500'},
  input:{borderWidth:1, borderColor:colors.border, borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:12, fontSize:fontSize.base, color:colors.textPrimary, backgroundColor:colors.surface},
  hint:{fontSize:fontSize.xs, color:colors.textTertiary, marginTop:4},
  footer:{padding:spacing.xl, borderTopWidth:1, borderTopColor:colors.border},
});
