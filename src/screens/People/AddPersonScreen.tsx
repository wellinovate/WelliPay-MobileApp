import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Chip, Banner } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';
import { uid } from '../../utils/helpers';

export default function AddPersonScreen({ navigation }: any) {
  const store = useStore();
  const { lang } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [relationKey, setRelationKey] = useState('child');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const relOptions = [
    { key: 'child', label: t.rel_child },
    { key: 'spouse', label: t.rel_spouse },
    { key: 'parent', label: t.rel_parent },
    { key: 'other', label: t.rel_other },
  ];

  const handleSave = () => {
    if (!name.trim()) {
      setError(t.depNameRequired);
      return;
    }

    const relLabel = relOptions.find(r => r.key === relationKey)?.label || relationKey;
    const newPerson = {
      id: 'p_' + uid().toLowerCase(),
      name: name.trim(),
      relation: relLabel,
      relationKey,
    };

    store.addPerson(newPerson);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.addDepTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Banner text={error} variant="error" style={styles.mb} /> : null}

        <View style={styles.field}>
          <Text style={styles.label}>{t.depNameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (error) setError('');
            }}
            placeholder="e.g. Chisom Okoro"
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t.depRelationLabel}</Text>
          <View style={styles.chipsRow}>
            {relOptions.map(r => (
              <Chip
                key={r.key}
                label={r.label}
                active={relationKey === r.key}
                onPress={() => setRelationKey(r.key)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t.depDobLabel}</Text>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t.depSave} fullWidth onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  mb: { marginBottom: spacing.md },
  field: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
