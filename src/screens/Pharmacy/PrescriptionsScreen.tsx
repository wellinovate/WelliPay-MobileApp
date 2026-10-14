import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ScreenHeader, Card, Banner, Button } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { fetchPrescriptions, submitPrescription, requestRefill, cancelPrescription, uploadPrescriptionPhoto, ApiPrescription } from '../../api/patientData';
import { pickPrescriptionPhoto, PickedPhoto } from '../../utils/prescriptionPhoto';
import { RX_STATUS_TEXT } from './pharmacyText';

const MAX_ITEMS = 4;
const MAX_PHOTOS = 3;
interface Draft { description: string; quantity: string; directions: string }
const blank = (): Draft => ({ description: '', quantity: '', directions: '' });

function day(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Turns the form into the request body, or says what is wrong with it.
export function buildPrescription(prescriber: string, notes: string, drafts: Draft[]): { body?: { prescriberName: string; notes?: string; items: { description: string; quantity: number; directions?: string }[] }; error?: string } {
  if (prescriber.trim().length < 2) return { error: 'Enter the name of the doctor who prescribed it.' };
  const items = [];
  for (const d of drafts) {
    if (!d.description.trim()) continue;
    const qty = Math.round(Number(d.quantity));
    if (!(qty > 0)) return { error: `Enter how many of "${d.description.trim()}" you need.` };
    items.push({ description: d.description.trim(), quantity: qty, ...(d.directions.trim() ? { directions: d.directions.trim() } : {}) });
  }
  if (!items.length) return { error: 'Add at least one medicine.' };
  return { body: { prescriberName: prescriber.trim(), ...(notes.trim() ? { notes: notes.trim() } : {}), items } };
}

// Send a prescription to the pharmacy, track its review and ask for refills.
// A pharmacist checks every prescription before anything is dispensed.
export default function PrescriptionsScreen({ navigation }: any) {
  const [items, setItems] = useState<ApiPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [prescriber, setPrescriber] = useState('');
  const [notes, setNotes] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([blank()]);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  const load = useCallback(() => {
    fetchPrescriptions()
      .then(res => { setItems(res); setError(''); })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your prescriptions.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setDraft = (i: number, patch: Partial<Draft>) => setDrafts(ds => ds.map((d, n) => (n === i ? { ...d, ...patch } : d)));

  const send = async () => {
    const built = buildPrescription(prescriber, notes, drafts);
    if (!built.body) { setError(built.error || 'Check the form.'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await submitPrescription(built.body);
      let failed = 0;
      for (const p of photos) {
        try { await uploadPrescriptionPhoto(created.prescriptionId, p); } catch { failed += 1; }
      }
      setAdding(false); setPrescriber(''); setNotes(''); setDrafts([blank()]); setPhotos([]);
      if (failed > 0) setError(`Your prescription was sent, but ${failed} photo${failed === 1 ? '' : 's'} did not upload. Use "Add photo" on the prescription below.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The prescription could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  // Takes or chooses a photo. For a prescription already sent, uploads it straight away.
  const addPhoto = async (source: 'camera' | 'library', existingId?: string) => {
    setError('');
    setPhotoBusy(true);
    try {
      const photo = await pickPrescriptionPhoto(source);
      if (!photo) return;
      if (existingId) { await uploadPrescriptionPhoto(existingId, photo); load(); }
      else setPhotos(ps => [...ps, photo]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The photo could not be added.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const act = async (id: string, fn: (id: string) => Promise<void>, fallback: string) => {
    setBusy(id);
    setError('');
    try { await fn(id); load(); } catch (err) { setError(err instanceof Error ? err.message : fallback); } finally { setBusy(null); }
  };

  const confirmCancel = (id: string) => Alert.alert('Cancel this prescription?', 'The pharmacy will not review it.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Cancel it', style: 'destructive', onPress: () => act(id, cancelPrescription, 'It could not be cancelled.') },
  ]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My prescriptions" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>Send the details from your prescription. A pharmacist checks it before the pharmacy prepares your medicine. You pay the bill the pharmacy sends you.</Text>
        {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}

        {adding ? (
          <Card style={styles.card}>
            <Text style={styles.title}>New prescription</Text>
            <Text style={styles.label}>Doctor</Text>
            <TextInput style={styles.input} value={prescriber} onChangeText={setPrescriber} placeholder="Name of the prescriber" placeholderTextColor={colors.textTertiary} maxLength={120} />
            {drafts.map((d, i) => (
              <View key={i} style={styles.draft}>
                <Text style={styles.label}>Medicine {i + 1}</Text>
                <TextInput style={styles.input} value={d.description} onChangeText={v => setDraft(i, { description: v })} placeholder="Name, strength, form (e.g. Amoxicillin 500mg capsule)" placeholderTextColor={colors.textTertiary} maxLength={160} />
                <View style={styles.pair}>
                  <TextInput style={[styles.input, { flex: 1 }]} value={d.quantity} onChangeText={v => setDraft(i, { quantity: v.replace(/[^0-9]/g, '') })} keyboardType="number-pad" placeholder="Quantity" placeholderTextColor={colors.textTertiary} />
                  <TextInput style={[styles.input, { flex: 2 }]} value={d.directions} onChangeText={v => setDraft(i, { directions: v })} placeholder="How to take it" placeholderTextColor={colors.textTertiary} maxLength={200} />
                </View>
              </View>
            ))}
            {drafts.length < MAX_ITEMS && (
              <TouchableOpacity onPress={() => setDrafts(ds => [...ds, blank()])}><Text style={styles.link}>Add another medicine</Text></TouchableOpacity>
            )}
            <Text style={styles.label}>Photo of the prescription (optional, up to {MAX_PHOTOS})</Text>
            <Text style={styles.sub}>A clear photo helps the pharmacist check what you typed. {photos.length} added.</Text>
            {photos.length < MAX_PHOTOS && (
              <View style={styles.pair}>
                <Button label="Take photo" variant="secondary" style={{ flex: 1 }} loading={photoBusy} onPress={() => addPhoto('camera')} />
                <Button label="Choose photo" variant="secondary" style={{ flex: 1 }} disabled={photoBusy} onPress={() => addPhoto('library')} />
              </View>
            )}
            {photos.length > 0 && (
              <TouchableOpacity onPress={() => setPhotos(ps => ps.slice(0, -1))}><Text style={styles.link}>Remove last photo</Text></TouchableOpacity>
            )}
            <Text style={styles.label}>Note for the pharmacist (optional)</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="e.g. Allergic to penicillin" placeholderTextColor={colors.textTertiary} maxLength={500} />
            <View style={styles.pair}>
              <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => { setAdding(false); setError(''); }} />
              <Button label="Send to pharmacy" style={{ flex: 2 }} loading={saving} onPress={send} />
            </View>
          </Card>
        ) : (
          <Button label="Send a prescription" fullWidth onPress={() => setAdding(true)} style={{ marginBottom: spacing.md }} />
        )}

        <Button label="Track my pharmacy orders" variant="secondary" fullWidth onPress={() => navigation.navigate('PharmacyOrders')} style={{ marginBottom: spacing.md }} />

        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}
        {!loading && !error && items.length === 0 && <Text style={styles.empty}>You have not sent a prescription yet.</Text>}
        {items.map(rx => (
          <Card key={rx.prescriptionId} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, { flex: 1 }]}>{rx.prescriberName || 'Prescription'}{rx.refillOfId ? ' · Refill' : ''}</Text>
              <Text style={[styles.status, rx.status === 'REJECTED' && { color: colors.danger }]}>{RX_STATUS_TEXT[rx.status]}</Text>
            </View>
            <Text style={styles.sub}>Sent {day(rx.createdAt)}</Text>
            {rx.items.map(i => (
              <Text key={i.itemId} style={styles.item}>{i.description} × {i.quantity}{i.directions ? ` · ${i.directions}` : ''}</Text>
            ))}
            {rx.status === 'REJECTED' && !!rx.rejectionReason && <Text style={styles.reason}>Reason: {rx.rejectionReason}</Text>}
            {rx.status === 'VERIFIED' && !!rx.validUntil && <Text style={styles.sub}>Valid until {day(rx.validUntil)}. The pharmacy will send you a bill.</Text>}
            {rx.status === 'COMPLETED' && rx.refillsRemaining !== undefined && <Text style={styles.sub}>{rx.refillsRemaining} refill{rx.refillsRemaining === 1 ? '' : 's'} left</Text>}
            {rx.status === 'SUBMITTED' && (
              <View>
                <Text style={styles.sub}>{(rx.images?.length ?? 0)} photo{(rx.images?.length ?? 0) === 1 ? '' : 's'} attached</Text>
                {(rx.images?.length ?? 0) < MAX_PHOTOS && (
                  <View style={styles.pair}>
                    <TouchableOpacity disabled={photoBusy} onPress={() => addPhoto('camera', rx.prescriptionId)}><Text style={styles.link}>Take photo</Text></TouchableOpacity>
                    <TouchableOpacity disabled={photoBusy} onPress={() => addPhoto('library', rx.prescriptionId)}><Text style={styles.link}>Choose photo</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            {rx.canRefill && (
              <TouchableOpacity disabled={busy === rx.prescriptionId} onPress={() => act(rx.prescriptionId, requestRefill, 'The refill could not be requested.')}>
                <Text style={styles.link}>{busy === rx.prescriptionId ? 'Requesting…' : 'Request a refill'}</Text>
              </TouchableOpacity>
            )}
            {!rx.canRefill && !!rx.refillBlockedReason && <Text style={styles.sub}>{rx.refillBlockedReason}</Text>}
            {rx.status === 'SUBMITTED' && (
              <TouchableOpacity disabled={busy === rx.prescriptionId} onPress={() => confirmCancel(rx.prescriptionId)}>
                <Text style={[styles.link, { color: colors.danger }]}>Cancel</Text>
              </TouchableOpacity>
            )}
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  status: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accentDark, marginLeft: spacing.md },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  item: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: 4 },
  reason: { fontSize: fontSize.sm, color: colors.danger, marginTop: 6 },
  link: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accentDark, marginTop: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: fontSize.base, color: colors.textPrimary, backgroundColor: colors.surface },
  draft: { marginTop: 4 },
  pair: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
