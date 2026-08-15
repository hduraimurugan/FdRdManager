import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { LEAD_DAYS_OPTIONS } from '../data/reminders';
import { openNotificationSettings } from '../data/notifeeClient';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';

const LEAD_LABELS: Record<number, string> = {
  1: '1 day before',
  3: '3 days before',
  7: '1 week before',
  14: '2 weeks before',
};

export default function ReminderSettingsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  const handleToggle = async (enabled: boolean) => {
    const ok = await actions.setRemindersEnabled(enabled);
    if (enabled && !ok) {
      actions.showToast('Notifications are blocked for this app — enable them in Settings');
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Maturity Reminders" showBack onBack={actions.back} />
      <View style={styles.container}>
        <Card style={styles.introCard}>
          <Text style={[styles.title, { color: theme.text }]}>Get notified before an FD or RD matures</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            A local notification, scheduled on this device only — nothing is sent anywhere.
          </Text>
        </Card>

        <Card style={styles.listCard}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Maturity reminders</Text>
            <Switch value={state.remindersEnabled} onValueChange={handleToggle} />
          </View>
        </Card>

        {state.remindersEnabled && !state.notificationPermissionGranted && (
          <Card style={[styles.warningCard, { borderColor: 'rgba(201,134,26,0.35)' }]}>
            <Text style={[styles.warningText, { color: theme.warning }]}>
              Notifications are blocked for this app at the OS level, so reminders won't show even though this is on.
            </Text>
            <Pressable onPress={() => openNotificationSettings()}>
              <Text style={[styles.warningLink, { color: theme.accent }]}>Open notification settings</Text>
            </Pressable>
          </Card>
        )}

        {state.remindersEnabled && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Remind me</Text>
            <Card style={styles.listCard}>
              {LEAD_DAYS_OPTIONS.map((days, i) => (
                <Pressable
                  key={days}
                  onPress={() => actions.setReminderLeadDays(days)}
                  style={[styles.row, i < LEAD_DAYS_OPTIONS.length - 1 ? { borderBottomColor: theme.divider, borderBottomWidth: 1 } : null]}
                >
                  <Text style={[styles.rowLabel, { color: theme.text }]}>{LEAD_LABELS[days]}</Text>
                  {state.reminderLeadDays === days && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
                </Pressable>
              ))}
            </Card>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    gap: 16,
  },
  introCard: {
    gap: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  warningCard: {
    gap: 8,
  },
  warningText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  warningLink: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
});
