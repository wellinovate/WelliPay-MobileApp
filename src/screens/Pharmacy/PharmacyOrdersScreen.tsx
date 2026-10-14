import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { fetchPharmacyOrders, ApiPharmacyOrder } from '../../api/patientData';
import { orderStatusText, showsProofCode } from './pharmacyText';

function when(iso?: string): string {
  return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
}

// Where each pharmacy order is. A paid bill alone does not mean the medicine has been handed over,
// so this shows the pharmacy's own record of dispensing and delivery.
export default function PharmacyOrdersScreen() {
  const [orders, setOrders] = useState<ApiPharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetchPharmacyOrders()
      .then(res => { setOrders(res); setError(''); })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Pharmacy orders" />
      <ScrollView contentContainerStyle={styles.body}>
        {!!error && <Banner message={error} variant="err" style={{ marginBottom: spacing.md }} />}
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}
        {!loading && !error && orders.length === 0 && <Text style={styles.empty}>You have no pharmacy orders.</Text>}
        {orders.map(o => (
          <Card key={o.orderId} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, { flex: 1 }]}>{o.fulfilment === 'DELIVERY' ? 'Delivery' : 'Pickup'} · {when(o.createdAt)}</Text>
              <Text style={[styles.status, (o.deliveryStatus === 'FAILED' || o.status === 'CANCELLED') && { color: colors.danger }]}>{orderStatusText(o)}</Text>
            </View>
            {o.lines.map((l, i) => <Text key={i} style={styles.item}>{l.description} × {l.quantity}</Text>)}
            {!!o.courierName && o.deliveryStatus === 'OUT_FOR_DELIVERY' && <Text style={styles.sub}>Rider: {o.courierName}</Text>}
            {o.deliveryStatus === 'DELIVERED' && !!o.deliveredAt && <Text style={styles.sub}>Delivered {when(o.deliveredAt)}</Text>}
            {o.deliveryStatus === 'FAILED' && !!o.failureReason && <Text style={styles.sub}>{o.failureReason}</Text>}
            {showsProofCode(o) && (
              <View style={styles.codeBox}>
                <Text style={styles.sub}>Give this code to the rider when you receive your medicine. Do not share it before then.</Text>
                <Text style={styles.code}>{o.proofCode}</Text>
              </View>
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
  empty: { fontSize: fontSize.md, color: colors.textTertiary, marginTop: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  status: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accentDark, marginLeft: spacing.md },
  item: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: 4 },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 6 },
  codeBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: 8 },
  code: { fontSize: fontSize.display, fontWeight: '700', letterSpacing: 6, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
});
