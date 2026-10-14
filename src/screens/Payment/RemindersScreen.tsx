import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenHeader, Card, Banner, Chip } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { NAIRA } from '../../utils/helpers';
import { useStore } from '../../state/store';
import { fetchReminders, setReminder, clearReminder, ApiReminderItem } from '../../api/patientData';

function at9(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}

function when(d: Date): string {
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) + ', 9:00 am';
}

// The times a patient can pick. Only times at least an hour away are offered.
export function reminderChoices(dueAt?: string, now: Date = new Date()): { label: string; at: Date }[] {
  const choices: { label: string; at: Date }[] = [
    { label: 'Tomorrow', at: at9(1) },
    { label: 'In 3 days', at: at9(3) },
    { label: 'In a week', at: at9(7) },
  ];
  if (dueAt) {
    const due = new Date(dueAt);
    const before = new Date(due);
    before.setDate(before.getDate() - 1);
    before.setHours(9, 0, 0, 0);
    if (!Number.isNaN(before.getTime())) choices.push({ label: 'Day before due', at: before });
  }
  return choices
    .filter(c => c.at.getTime() > now.getTime() + 3_600_000)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

const DUE_LABEL: Record<string, string> = { OVERDUE: 'Overdue', DUE_SOON: 'Due soon', OPEN: 'Open' };
const DUE_COLOR: Record<string, string> = { OVERDUE: colors.danger, DUE_SOON: colors.warning, OPEN: colors.textTertiary };

// Unpaid bills with an optional SMS reminder on each. The server sends the SMS.
export default function RemindersScreen({ navigation }: any) {
  const { setPaySession } = useStore();
  const [items, setItems] = useState<ApiReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchReminders()
      .then(res => { setItems(res); setError(''); })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your bills.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const choose = async (invoiceId: string, at: Date) => {
    setBusy(invoiceId);
    setError('');
    try {
      await setReminder(invoiceId, at);
      setOpen(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The reminder could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (invoiceId: string) => {
    setBusy(invoiceId);
    setError('');
    try {
      await clearReminder(invoiceId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The reminder could not be removed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Payment reminders" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.note}>Pick a time and WelliPay sends an SMS to the phone number on your profile. It does not send one if the bill is paid by then.</Text>
        {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}
        {!loading && !error && items.length === 0 && <Text style={styles.empty}>You have no unpaid bills.</Text>}
        {items.map(it => {
          const choices = reminderChoices(it.dueAt);
          const isOpen = open === it.invoiceId;
          return (
            <Card key={it.invoiceId} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{it.description}</Text>
                  <Text style={styles.sub}>{it.providerName} · {it.invoiceRef}</Text>
                </View>
                <Text style={styles.amount}>{NAIRA(it.outstandingMinor / 100)}</Text>
              </View>
              <Text style={[styles.due, { color: DUE_COLOR[it.dueState] }]}>
                {DUE_LABEL[it.dueState]}
                {it.nextInstallment ? ` · next instalment ${new Date(it.nextInstallment.dueAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}` : it.dueAt ? ` · ${new Date(it.dueAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </Text>
              {it.reminder ? (
                <View style={styles.setRow}>
                  <Text style={styles.setText}>
                    {it.reminder.sent ? 'Reminder sent' : `Reminder: ${when(new Date(it.reminder.remindAt))}`}
                  </Text>
                  <TouchableOpacity disabled={busy === it.invoiceId} onPress={() => remove(it.invoiceId)}>
                    <Text style={styles.link}>{busy === it.invoiceId ? 'Removing…' : 'Remove'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => setOpen(isOpen ? null : it.invoiceId)}>
                  <Text style={styles.link}>{it.reminder ? 'Change reminder' : 'Remind me'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setPaySession({ liveInvoiceId: it.invoiceId, payBillId: null } as any); navigation.navigate('BillDetail'); }}>
                  <Text style={styles.link}>Open bill</Text>
                </TouchableOpacity>
              </View>
              {isOpen && (
                <View style={styles.chips}>
                  {choices.map(c => (
                    <Chip key={c.label} label={`${c.label} · ${when(c.at)}`} onPress={() => choose(it.invoiceId, c.at)} />
                  ))}
                  {busy === it.invoiceId && <ActivityIndicator color={colors.accent} />}
                </View>
              )}
            </Card>
          );
        })}
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginLeft: spacing.md },
  due: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  setText: { fontSize: fontSize.sm, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  link: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accentDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
