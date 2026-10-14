import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenHeader, Card, Banner } from '../../components';
import { colors, fontSize, spacing } from '../../theme/tokens';
import { fmtDate } from '../../utils/helpers';
import { fetchPatientResults, ApiPatientResult } from '../../api/patientData';
import { NotLinkedError } from '../../api/client';

// Lab results and scan reports the provider has marked ready for digital
// delivery. Results the lab hands over in person are counted, not shown.
export default function ResultsScreen({ navigation }: any) {
  const [items, setItems] = useState<ApiPatientResult[]>([]);
  const [inPerson, setInPerson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPatientResults()
      .then(res => {
        if (!active) return;
        setItems(res.items);
        setInPerson(res.inPersonCount);
      })
      .catch(err => {
        if (!active) return;
        if (err instanceof NotLinkedError) setNotLinked(true);
        else setFailed(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My results" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {notLinked ? (
          <Banner message="Link your WelliRecord account to see your results." variant="warn" style={{ marginBottom: spacing.lg }} />
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
        ) : failed ? (
          <Banner message="Results could not be loaded. Try again later." variant="warn" style={{ marginBottom: spacing.lg }} />
        ) : (
          <>
            {items.length === 0 && (
              <Text style={styles.empty}>No results here yet. A result appears when the lab marks it ready.</Text>
            )}
            {items.map(r => (
              <Card key={r.resultId} style={styles.card}>
                <Text style={styles.kicker}>{r.kind === 'IMAGING' ? 'SCAN REPORT' : 'LAB RESULT'} · {fmtDate(new Date(r.takenOn))}</Text>
                <Text style={styles.title}>{r.testName}</Text>
                {r.resultText ? <Text style={styles.text}>{r.resultText}</Text> : null}
                {r.abnormal ? <Text style={styles.flag}>Outside the normal range. Speak to your doctor.</Text> : null}
              </Card>
            ))}
            {inPerson > 0 && (
              <Text style={styles.note}>
                {inPerson} other {inPerson === 1 ? 'result is' : 'results are'} ready for collection at the lab.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
  kicker: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.6 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  text: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: spacing.sm },
  flag: { fontSize: fontSize.xs, fontWeight: '700', color: '#B45309', marginTop: spacing.sm },
  empty: { fontSize: fontSize.xs, color: colors.textTertiary, marginVertical: spacing.lg },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm },
});
