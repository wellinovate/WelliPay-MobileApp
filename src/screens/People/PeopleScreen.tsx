import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, AvatarCircle, Button } from '../../components';
import { colors, fontSize, spacing, radius } from '../../theme/tokens';
import { useStore } from '../../state/store';
import { COPY } from '../../state/copy';

export default function PeopleScreen({ navigation }: any) {
  const store = useStore();
  const { lang, people, activePerson } = store;
  const t = COPY[lang];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title={t.peopleTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {people.map(p => {
          const isSelected = p.id === activePerson;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.personRow, isSelected && styles.personRowActive]}
              onPress={() => {
                store.setActivePerson(p.id);
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <AvatarCircle personId={p.id} name={p.name} size={44} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{p.name}</Text>
                <Text style={styles.personRelation}>{p.relation}</Text>
              </View>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t.addPerson}
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('AddPerson')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  personInfo: { flex: 1, marginLeft: spacing.md },
  personName: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  personRelation: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
