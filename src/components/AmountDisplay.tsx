import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NAIRA } from '../utils/helpers';
import { colors, fontSize } from '../theme/tokens';

export default function AmountDisplay({ amount, size='lg' }: { amount: number; size?: 'sm'|'md'|'lg' }) {
  const fs = {sm:fontSize.xl,md:fontSize.xxl,lg:fontSize.xxxl}[size];
  return <Text style={[styles.base,{fontSize:fs}]}>{NAIRA(amount)}</Text>;
}
const styles = StyleSheet.create({
  base:{ fontFamily:'SourceSerif4_700Bold', fontWeight:'700', color:colors.textPrimary, letterSpacing:-0.5 },
});
