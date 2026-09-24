import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader } from '../../components';
import { NOTIFS_SEED } from '../../state/seed';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function NotificationsScreen() {
  const { lang } = useStore();
  const t = COPY[lang];
  const today = NOTIFS_SEED.filter(n=>n.unread);
  const older  = NOTIFS_SEED.filter(n=>!n.unread);

  const mkGroup = (label: string, items: typeof NOTIFS_SEED) => items.length === 0 ? null : (
    <View key={label}>
      <Text style={styles.groupLabel}>{label}</Text>
      {items.map(n=>(
        <View key={n.id} style={styles.notifRow}>
          <View style={[styles.iconBubble,{backgroundColor:n.unread?colors.accentLight:colors.surfaceAlt}]}>
            <Text style={styles.icon}>{n.icon}</Text>
          </View>
          <View style={styles.notifBody}>
            <Text style={[styles.notifTitle, n.unread&&{fontWeight:'700'}]}>{n.title}</Text>
            <Text style={styles.notifSub}>{n.body}</Text>
            <Text style={styles.notifTime}>{n.time}</Text>
          </View>
          {n.unread&&<View style={styles.unreadDot}/>}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.notifsTitle}/>
      <ScrollView contentContainerStyle={styles.body}>
        {today.length+older.length===0
          ? <Text style={styles.empty}>{t.noNotifs}</Text>
          : <>{mkGroup('Today',today)}{mkGroup('Earlier',older)}</>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.bg},
  body:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxxl},
  groupLabel:{fontSize:fontSize.xs,letterSpacing:0.8,textTransform:'uppercase',color:colors.textTertiary,fontWeight:'600',marginTop:spacing.xl,marginBottom:spacing.sm},
  notifRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  iconBubble:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',flexShrink:0},
  icon:{fontSize:16},
  notifBody:{flex:1},
  notifTitle:{fontSize:fontSize.base,color:colors.textPrimary},
  notifSub:{fontSize:fontSize.sm,color:colors.textSecondary,marginTop:2},
  notifTime:{fontSize:fontSize.xs,color:colors.textTertiary,marginTop:2},
  unreadDot:{width:8,height:8,borderRadius:4,backgroundColor:colors.accent,marginTop:6},
  empty:{fontSize:fontSize.md,color:colors.textTertiary,textAlign:'center',marginTop:60},
});
