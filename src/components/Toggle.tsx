import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';

export default function Toggle({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.track, value&&styles.on]}>
      <View style={[styles.thumb, value&&styles.thumbOn]}/>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  track:{ width:44, height:26, borderRadius:radius.full, backgroundColor:colors.borderStrong, justifyContent:'center', padding:3 },
  on:{ backgroundColor:colors.accent },
  thumb:{ width:20, height:20, borderRadius:10, backgroundColor:colors.white, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:2, shadowOffset:{width:0,height:1}, elevation:2 },
  thumbOn:{ transform:[{translateX:18}] },
});
