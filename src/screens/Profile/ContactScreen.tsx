import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Card } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function ContactScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const contacts = [
    { title: t.callSupport, value: '0800 111 2222', icon: '📞', action: 'call' },
    { title: t.whatsappSupport, value: '+234 803 000 0000', icon: '💬', action: 'whatsapp' },
    { title: t.emailSupport, value: 'support@wellipay.ng', icon: '✉️', action: 'email' },
  ];

  const handleCopy = async (val: string, label: string) => {
    await Clipboard.setStringAsync(val);
    Alert.alert('Copied', `${label} (${val}) copied to clipboard.`);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.contactTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {contacts.map((c, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleCopy(c.value, c.title)}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.icon}>{c.icon}</Text>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.title}>{c.title}</Text>
                  <Text style={styles.value}>{c.value}</Text>
                </View>
                <Text style={styles.copyTip}>Tap to copy</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24 },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  value: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  copyTip: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
});
