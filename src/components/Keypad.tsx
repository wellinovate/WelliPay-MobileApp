import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius } from '../theme/tokens';
import { hapticLight } from '../utils/haptics';

interface Props { onPress: (key: string) => void; }
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
export default function Keypad({ onPress }: Props) {
  const handlePress = (k: string) => {
    hapticLight();
    onPress(k);
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((k,i) => k === ''
        ? <View key={i} style={styles.empty}/>
        : <TouchableOpacity key={i} style={styles.key} onPress={()=>handlePress(k)} activeOpacity={0.6}>
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  grid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', maxWidth:280, alignSelf:'center', gap:8 },
  key:{ width:82, height:60, borderRadius:radius.full, alignItems:'center', justifyContent:'center', backgroundColor:colors.surfaceAlt },
  keyText:{ fontSize:fontSize.xxl, fontWeight:'600', color:colors.textPrimary },
  empty:{ width:82, height:60 },
});
