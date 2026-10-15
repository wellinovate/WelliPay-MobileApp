import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Card, Button, Chip, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import {
  ApiRecordConnection,
  ApiRecordIntegration,
  RecordConnectionKind,
  confirmRecordConnection,
  createRecordConnection,
  fetchRecordConnections,
  fetchRecordIntegrations,
  revokeRecordConnection,
} from '../../api/patientData';
import { ApiError, NotLinkedError } from '../../api/client';

const NOTICE = 'A connection links an ID to your profile. It does not give anyone access to your records.';

// One option the patient can pick when adding a connection.
interface Option {
  id: string;
  label: string;
  kind: RecordConnectionKind;
  integrationKey?: string;
  placeholder: string;
  hint: string;
}

const PATIENT_NUMBER_OPTION: Option = {
  id: 'patient-number',
  label: 'Hospital or lab number',
  kind: 'PROVIDER_PATIENT_NUMBER',
  placeholder: 'e.g. LAB 12/445',
  hint: 'The number on your card or receipt. The hospital or lab checks that it is yours before it is linked.',
};

function optionsFrom(integrations: ApiRecordIntegration[]): Option[] {
  const partner = integrations.map<Option>(i =>
    i.kind === 'WELLIRECORD'
      ? { id: i.key, label: i.name, kind: i.kind, integrationKey: i.key, placeholder: 'e.g. WR-2291-04', hint: `Enter your WelliRecord ID. ${i.name} sends a code to the phone or email it has for you.` }
      : { id: i.key, label: i.name, kind: i.kind, integrationKey: i.key, placeholder: 'Your patient ID', hint: `Enter your patient ID exactly as ${i.name} shows it. ${i.name} sends a code to the phone or email it has for you.` },
  );
  return [...partner, PATIENT_NUMBER_OPTION];
}

const STATUS_TEXT: Record<ApiRecordConnection['status'], string> = {
  PENDING_VERIFICATION: 'Waiting',
  VERIFIED: 'Linked',
  REJECTED: 'Not accepted',
  REVOKED: 'Removed',
  EXPIRED: 'Expired',
};

function messageFor(err: unknown): string {
  if (err instanceof NotLinkedError) return 'Link your account first, then try again.';
  if (err instanceof ApiError) return err.message;
  return 'Could not reach WelliPay. Check your connection and try again.';
}

export default function RecordConnectionsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [items, setItems] = useState<ApiRecordConnection[]>([]);
  const [options, setOptions] = useState<Option[]>([PATIENT_NUMBER_OPTION]);
  const [selected, setSelected] = useState<Option>(PATIENT_NUMBER_OPTION);
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState('');
  const [adding, setAdding] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [conns, integ] = await Promise.all([fetchRecordConnections(), fetchRecordIntegrations()]);
      setItems(conns.items);
      const opts = optionsFrom(integ.items);
      setOptions(opts);
      setSelected(prev => opts.find(o => o.id === prev.id) ?? opts[0]);
    } catch (err) {
      setLoadError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const replace = (updated: ApiRecordConnection) =>
    setItems(prev => (prev.some(x => x.id === updated.id) ? prev.map(x => (x.id === updated.id ? updated : x)) : [updated, ...prev]));

  const handleAdd = async () => {
    if (!reference.trim()) {
      setFormError('Enter the ID first.');
      return;
    }
    setFormError('');
    setAdding(true);
    try {
      const created = await createRecordConnection({
        kind: selected.kind,
        ...(selected.integrationKey ? { integrationKey: selected.integrationKey } : {}),
        reference: reference.trim(),
      });
      replace(created);
      setReference('');
    } catch (err) {
      setFormError(messageFor(err));
    } finally {
      setAdding(false);
    }
  };

  const handleConfirm = async (id: string) => {
    const code = (codes[id] || '').trim();
    if (!/^\d{6}$/.test(code)) {
      setRowError(prev => ({ ...prev, [id]: 'The code is 6 digits.' }));
      return;
    }
    setBusyId(id);
    setRowError(prev => ({ ...prev, [id]: '' }));
    try {
      replace(await confirmRecordConnection(id, code));
      setCodes(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      setRowError(prev => ({ ...prev, [id]: messageFor(err) }));
      // A used-up or expired code closes the connection on the server. Refresh to show it.
      if (err instanceof ApiError && ['expired', 'too_many_attempts', 'not_pending'].includes(err.code || '')) load();
    } finally {
      setBusyId('');
    }
  };

  const handleRemove = (c: ApiRecordConnection) => {
    Alert.alert('Remove connection', `Remove ${c.reference}? You can connect it again later.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(c.id);
          try {
            replace(await revokeRecordConnection(c.id));
          } catch (err) {
            setRowError(prev => ({ ...prev, [c.id]: messageFor(err) }));
          } finally {
            setBusyId('');
          }
        },
      },
    ]);
  };

  const active = items.filter(i => i.status === 'PENDING_VERIFICATION' || i.status === 'VERIFIED');
  const past = items.filter(i => i.status !== 'PENDING_VERIFICATION' && i.status !== 'VERIFIED');

  const renderRow = (c: ApiRecordConnection) => (
    <Card key={c.id} style={styles.row}>
      <Text style={styles.rowTitle}>{c.integrationName || 'Hospital or lab number'}</Text>
      <Text style={styles.rowRef}>{c.reference}</Text>
      <Text style={styles.rowStatus}>
        {STATUS_TEXT[c.status]}
        {c.status === 'PENDING_VERIFICATION' && c.nextStep === 'AWAIT_PROVIDER_REVIEW' ? '. The hospital or lab is checking this number.' : ''}
      </Text>
      {c.decisionNote ? <Text style={styles.rowNote}>{c.decisionNote}</Text> : null}

      {c.status === 'PENDING_VERIFICATION' && c.nextStep === 'ENTER_CODE' ? (
        <View style={styles.codeBox}>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            style={styles.input}
            value={codes[c.id] || ''}
            onChangeText={txt => setCodes(prev => ({ ...prev, [c.id]: txt.replace(/\D/g, '').slice(0, 6) }))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textTertiary}
          />
          {rowError[c.id] ? <Text style={styles.error}>{rowError[c.id]}</Text> : null}
          <Button label="Confirm code" onPress={() => handleConfirm(c.id)} loading={busyId === c.id} fullWidth style={styles.mt} />
        </View>
      ) : rowError[c.id] ? (
        <Text style={styles.error}>{rowError[c.id]}</Text>
      ) : null}

      {c.status === 'PENDING_VERIFICATION' || c.status === 'VERIFIED' ? (
        <Button label={c.status === 'VERIFIED' ? 'Remove' : 'Cancel'} variant="ghost" onPress={() => handleRemove(c)} disabled={busyId === c.id} style={styles.mt} />
      ) : null}
    </Card>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Connect health records" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Banner text={NOTICE} variant="info" style={styles.mb} />

        {loading ? <ActivityIndicator color={colors.accent} style={styles.mb} /> : null}
        {loadError ? (
          <View style={styles.mb}>
            <Banner text={loadError} variant="error" />
            <Button label="Try again" variant="secondary" onPress={() => { setLoading(true); load(); }} style={styles.mt} />
          </View>
        ) : null}

        <Text style={styles.section}>Add a connection</Text>
        <Card style={styles.mb}>
          <View style={styles.chips}>
            {options.map(o => (
              <Chip key={o.id} label={o.label} active={selected.id === o.id} onPress={() => { setSelected(o); setFormError(''); }} />
            ))}
          </View>
          <Text style={styles.hint}>{selected.hint}</Text>
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={txt => { setReference(txt); if (formError) setFormError(''); }}
            placeholder={selected.placeholder}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <Button
            label={selected.kind === 'PROVIDER_PATIENT_NUMBER' ? 'Submit for review' : 'Send code'}
            onPress={handleAdd}
            loading={adding}
            fullWidth
            style={styles.mt}
          />
        </Card>

        {active.length > 0 ? <Text style={styles.section}>Your connections</Text> : null}
        {active.map(renderRow)}

        {past.length > 0 ? <Text style={styles.section}>Closed</Text> : null}
        {past.map(renderRow)}

        {!loading && !loadError && items.length === 0 ? <Text style={styles.empty}>You have no connections yet.</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  mb: { marginBottom: spacing.lg },
  mt: { marginTop: spacing.md },
  section: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { fontSize: fontSize.xs, color: colors.textSecondary, marginVertical: spacing.sm },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    paddingVertical: 12, paddingHorizontal: spacing.md, fontSize: fontSize.base, color: colors.textPrimary,
  },
  error: { fontSize: fontSize.xs, color: colors.dangerDark, marginTop: spacing.sm },
  row: { marginBottom: spacing.md },
  rowTitle: { fontSize: fontSize.xs, color: colors.textSecondary },
  rowRef: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  rowStatus: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  rowNote: { fontSize: fontSize.xs, color: colors.textPrimary, marginTop: 4 },
  codeBox: { marginTop: spacing.md },
  empty: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
