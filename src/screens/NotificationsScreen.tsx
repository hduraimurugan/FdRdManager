import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { decorateNotification } from '../state/selectors';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import { IconAlert, IconClock, IconWallet, IconRefresh } from '../components/icons/Icons';

export default function NotificationsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const items = useMemo(() => state.notifications.map(n => decorateNotification(n, theme)), [state.notifications, theme]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Notifications" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {items.map(n => (
          <Pressable key={n.id} onPress={() => (n.recordType === 'FD' ? actions.openFDDetail(n.recordId) : actions.openRDDetail(n.recordId))}>
            <Card style={styles.row}>
              <View style={[styles.icon, { backgroundColor: n.iconBg }]}>
                {n.icon === 'alert' && <IconAlert color={n.iconFg} />}
                {n.icon === 'clock' && <IconClock color={n.iconFg} />}
                {n.icon === 'wallet' && <IconWallet color={n.iconFg} />}
                {n.icon === 'refresh' && <IconRefresh color={n.iconFg} />}
              </View>
              <View style={styles.flexShrink}>
                <Text style={[styles.title, { color: theme.text }]}>{n.title}</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>{n.subtitle}</Text>
                <Text style={[styles.date, { color: theme.textFaint }]}>{n.dateLabel}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 0,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  flexShrink: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 4,
  },
});
