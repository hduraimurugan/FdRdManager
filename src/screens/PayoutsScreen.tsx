import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { payoutGroups } from '../state/selectors';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { IconBank, IconClock } from '../components/icons/Icons';

export default function PayoutsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { overdue, sections } = useMemo(() => payoutGroups(state, theme), [state, theme]);

  const openRecord = (kind: 'FD' | 'RD', recordId: string) => (kind === 'FD' ? actions.openFDDetail(recordId) : actions.openRDDetail(recordId));

  const isEmpty = overdue.length === 0 && sections.every(sec => sec.items.length === 0);
  if (isEmpty) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <EmptyState
          icon={<IconClock size={30} color="#fff" />}
          title="Nothing scheduled"
          subtitle="Payouts and installments from your active deposits will show up here."
          gradient={theme.gradientPayouts}
          actionLabel="Add a deposit"
          onAction={() => actions.setTab('portfolio')}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {overdue.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { color: theme.danger }]}>Overdue</Text>
          <View style={styles.gap8}>
            {overdue.map(e => (
              <Pressable key={e.id} onPress={() => openRecord(e.kind, e.recordId)}>
                <Card style={[styles.eventCard, { borderColor: 'rgba(226,73,90,0.25)' }]}>
                  <View style={styles.flexShrink}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>
                      {e.bank} · {e.number}
                    </Text>
                    <Text style={[styles.overdueSubtitle, { color: theme.danger }]}>
                      {e.type} overdue since {e.dateLabel}
                    </Text>
                  </View>
                  <Text style={[styles.eventAmount, { color: theme.text }]}>{e.amountFmt}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {sections
        .filter(sec => sec.items.length > 0)
        .map(sec => (
          <View key={sec.label}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{sec.label}</Text>
            <View style={styles.gap8}>
              {sec.items.map(e => (
                <Pressable key={e.id} onPress={() => openRecord(e.kind, e.recordId)}>
                  <Card style={styles.eventCard}>
                    <View style={[styles.eventIcon, { backgroundColor: e.iconBg }]}>
                      <IconBank color={e.iconFg} />
                      <View style={[styles.kindBadge, { backgroundColor: e.kindBadgeBg }]}>
                        <Text style={styles.kindBadgeText}>{e.kind}</Text>
                      </View>
                    </View>
                    <View style={styles.flexShrink}>
                      <Text style={[styles.eventTitle, { color: theme.text }]}>
                        {e.bank} · {e.number}
                      </Text>
                      <Text style={[styles.eventSubtitle, { color: theme.textMuted }]}>
                        {e.type} · {e.dateLabel}
                      </Text>
                    </View>
                    <Text style={[styles.eventAmount, { color: e.amountColor }]}>{e.amountFmt}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  emptyContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  gap8: {
    gap: 8,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  flexShrink: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  eventSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  overdueSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  eventAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    flexShrink: 0,
  },
  eventIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kindBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  kindBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 8.5,
    color: '#fff',
  },
});
