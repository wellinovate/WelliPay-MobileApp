import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function DeleteAccountScreen({ navigation }: any) {
  const store = useStore();
  const { lang, deleteStage } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const handleInitialConfirm = () => {
    store.setPaySession({ deleteStage: 'confirming' } as any);
  };

  const handleFinalDelete = () => {
    store.setPaySession({ deleteStage: 'done' } as any);
    setTimeout(() => {
      store.resetStore();
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }, 2000);
  };

  const handleCancel = () => {
    store.setPaySession({ deleteStage: 'idle' } as any);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.deleteTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {deleteStage === 'idle' && (
          <View>
            <Banner text={t.deleteWarning} variant="error" style={styles.banner} />
            <Text style={styles.infoText}>
              All pending bills, payment receipts, saved family profiles, and wallet funds will be permanently deleted from WelliPay servers.
            </Text>
          </View>
        )}

        {deleteStage === 'confirming' && (
          <View>
            <Banner text={t.deleteFinalWarning} variant="error" style={styles.banner} />
            <Text style={styles.infoText}>
              This action cannot be undone. Please confirm that you want to delete your WelliPay account now.
            </Text>
          </View>
        )}

        {deleteStage === 'done' && (
          <View style={styles.doneContainer}>
            <Text style={styles.doneIcon}>✓</Text>
            <Text style={styles.doneTitle}>{t.deleteDoneMsg}</Text>
            <Text style={styles.doneSub}>Redirecting to welcome screen…</Text>
          </View>
        )}
      </ScrollView>

      {deleteStage === 'idle' && (
        <View style={styles.footer}>
          <Button
            label={t.deleteConfirmBtn}
            variant="danger"
            fullWidth
            onPress={handleInitialConfirm}
          />
        </View>
      )}

      {deleteStage === 'confirming' && (
        <View style={[styles.footer, styles.gap]}>
          <Button
            label={t.deleteFinalBtn}
            variant="danger"
            fullWidth
            onPress={handleFinalDelete}
          />
          <Button
            label={t.deleteCancel}
            variant="ghost"
            fullWidth
            onPress={handleCancel}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  banner: { marginBottom: spacing.lg },
  infoText: { fontSize: fontSize.base, color: colors.textSecondary, lineHeight: 22 },
  doneContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.huge },
  doneIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    color: colors.accent,
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: spacing.lg,
  },
  doneTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  doneSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  gap: { gap: spacing.sm },
});
