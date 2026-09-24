import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarCircle, Divider, Button } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function ProfileScreen({ navigation }: any) {
  const store = useStore();
  const { lang, activePerson, people } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const person = people.find(p => p.id === activePerson) || people[0];

  const menuItems = [
    { key: 'People', label: t.settingsMenu[0] || 'People', target: 'People' },
    { key: 'Hmo', label: 'Health Insurance & HMO', target: 'Hmo' },
    { key: 'WelliRecordSync', label: 'WelliRecord EMR Sync', target: 'WelliRecordSync' },
    { key: 'FacilityDirectory', label: 'Partner Hospitals & Directory', target: 'FacilityDirectory' },
    { key: 'Security', label: t.settingsMenu[1] || 'Security', target: 'Security' },
    { key: 'Privacy', label: t.settingsMenu[2] || 'Privacy', target: 'Privacy' },
    { key: 'Notifications', label: t.settingsMenu[3] || 'Notifications', target: 'NotificationPrefs' },
    { key: 'Language', label: t.settingsMenu[4] || 'Language', target: 'Language' },
    { key: 'Help', label: t.settingsMenu[5] || 'Help', target: 'Help' },
    { key: 'Contact us', label: t.settingsMenu[6] || 'Contact us', target: 'Contact' },
    { key: 'Legal', label: t.settingsMenu[7] || 'Legal', target: 'Legal' },
  ];

  const handleLogout = () => {
    Alert.alert(t.logOut, 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          store.resetStore();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.profile2Title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* User profile card */}
        <View style={styles.userCard}>
          <AvatarCircle personId={activePerson} name={person?.name || 'Jay Umar'} size={56} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{person?.name || 'Jay Umar'}</Text>
            <Text style={styles.userPhone}>+234 803 123 4567</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Menu rows */}
        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuRow}
              onPress={() => navigation.navigate(item.target)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Danger zone */}
        <TouchableOpacity
          style={styles.deleteRow}
          onPress={() => navigation.navigate('DeleteAccount')}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteLabel}>{t.deleteAccountLabel}</Text>
          <Text style={styles.deleteChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.logoutContainer}>
          <Button label={t.logOut} variant="ghost" fullWidth onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  userInfo: { marginLeft: spacing.md },
  userName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  userPhone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  divider: { marginVertical: spacing.md },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { fontSize: fontSize.base, color: colors.textPrimary },
  chevron: { fontSize: fontSize.xl, color: colors.textTertiary, fontWeight: '300' },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: spacing.sm,
  },
  deleteLabel: { fontSize: fontSize.base, color: colors.danger, fontWeight: '600' },
  deleteChevron: { fontSize: fontSize.xl, color: colors.danger, fontWeight: '300' },
  logoutContainer: { marginTop: spacing.xl },
});
