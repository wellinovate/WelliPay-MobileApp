import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { ScreenHeader, Card, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { fetchSavedCards, deleteSavedCard, ApiSavedCard } from '../../api/patientData';

export function cardTitle(c: { brand: string; last4: string }): string {
  const brand = c.brand ? c.brand.charAt(0).toUpperCase() + c.brand.slice(1) : 'Card';
  return `${brand} •••• ${c.last4}`;
}

// Cards kept for next time. WelliPay stores Paystack's token and the last
// four digits. It never sees the card number.
export default function SavedCardsScreen() {
  const [cards, setCards] = useState<ApiSavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchSavedCards()
      .then(res => { setCards(res); setError(''); })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your cards.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = (c: ApiSavedCard) => {
    Alert.alert('Remove this card?', `${cardTitle(c)} will be removed from WelliPay. You can save it again when you next pay.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(c.methodId);
          try {
            await deleteSavedCard(c.methodId);
            load();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'The card could not be removed.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Saved cards" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.note}>To save a card, tick "Save this card" when you pay a bill. The card is saved after the payment is confirmed.</Text>
        {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}
        {!loading && !error && cards.length === 0 && <Text style={styles.empty}>You have no saved cards.</Text>}
        {cards.map(c => (
          <Card key={c.methodId} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{cardTitle(c)}</Text>
                <Text style={[styles.sub, c.expired && { color: colors.danger }]}>
                  {c.expired ? 'Expired' : c.expMonth && c.expYear ? `Expires ${c.expMonth}/${c.expYear}` : 'Saved card'}
                  {c.bank ? ` · ${c.bank}` : ''}
                </Text>
              </View>
              <TouchableOpacity disabled={busy === c.methodId} onPress={() => remove(c)}>
                <Text style={styles.remove}>{busy === c.methodId ? 'Removing…' : 'Remove'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  note: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  empty: { fontSize: fontSize.md, color: colors.textTertiary, marginTop: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  remove: { fontSize: fontSize.sm, fontWeight: '600', color: colors.danger },
});
