import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Toggle, Card, Divider } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { getBiometricSupport, authenticateWithBiometrics } from '../../utils/biometrics';
import { hapticSuccess, hapticError, hapticLight } from '../../utils/haptics';

export default function SecurityScreen({ navigation }: any) {
  const store = useStore();
  const { lang, biometricEnabled } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();
  const [bioName, setBioName] = useState('Face / Fingerprint');
  const [bioAvailable, setBioAvailable] = useState(true);

  useEffect(() => {
    getBiometricSupport().then(res => {
      setBioAvailable(res.available && res.enrolled);
      if (res.available) setBioName(res.biometricName);
    });
  }, []);

  const handleToggleBio = async () => {
    if (!biometricEnabled) {
      const res = await authenticateWithBiometrics(`Verify identity to enable ${bioName}`);
      if (res.success) {
        hapticSuccess();
        store.toggleBio();
      } else {
        hapticError();
        Alert.alert('Authentication Failed', res.error || 'Could not verify biometrics.');
      }
    } else {
      hapticLight();
      store.toggleBio();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.securityTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.rowTitle}>{bioName} unlock</Text>
              <Text style={styles.rowSub}>Use {bioName.toLowerCase()} to securely open the app and authorize payments.</Text>
            </View>
            <Toggle value={biometricEnabled} onPress={handleToggleBio} />
          </View>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AppLock')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowTitle}>{t.changePinLabel}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  chevron: { fontSize: fontSize.xl, color: colors.textTertiary },
});
