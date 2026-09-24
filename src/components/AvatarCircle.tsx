import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarColor, initials } from '../utils/helpers';
import { radius, fontSize } from '../theme/tokens';

interface Props { personId: string; name: string; size?: number; }
export default function AvatarCircle({ personId, name, size=40 }: Props) {
  const ac = getAvatarColor(personId);
  return (
    <View style={[styles.base,{width:size,height:size,borderRadius:size/2,backgroundColor:ac.bg}]}>
      <Text style={[styles.text,{color:ac.fg,fontSize:size*0.35}]}>{initials(name)}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  base:{ alignItems:'center', justifyContent:'center' },
  text:{ fontWeight:'700' },
});
