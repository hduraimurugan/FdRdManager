import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { GRADIENT_ANGLE } from '../theme/colors';
import { useRefresh } from '../hooks/useRefresh';
import Card from '../components/Card';
import { IconBell, IconCalendar, IconClock, IconDownload, IconInfo, IconChevronRight, IconSun, IconMoon, IconWarning, IconLock } from '../components/icons/Icons';

function SegButton({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  if (active) {
    return (
      <Pressable onPress={onPress} style={styles.segBtnWrap}>
        <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.segBtn}>
          {icon}
          <Text style={[styles.segText, { color: '#fff' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.segBtnWrap}>
      <View style={styles.segBtn}>
        {icon}
        <Text style={[styles.segText, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { refreshing, onRefresh } = useRefresh();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}
    >
      <Card style={styles.listCard}>
        <Pressable onPress={actions.goNotifications} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(226,73,90,0.12)' }]}>
            <IconBell size={17} color={theme.danger} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.rowMeta, { color: theme.textFaint }]}>{state.notifications.length}</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
        <Pressable onPress={actions.goMaturityTimeline} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(226,121,63,0.14)' }]}>
            <IconCalendar size={17} color={theme.orange} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Maturity timeline</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
        <Pressable onPress={actions.goReminderSettings} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(201,134,26,0.15)' }]}>
            <IconClock size={16} color={theme.warning} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Maturity reminders</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
        <Pressable onPress={actions.goBackupRestore} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(91,158,224,0.15)' }]}>
            <IconDownload size={17} color="#5b9ee0" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Backup & Restore</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
        <Pressable onPress={actions.goSecurity} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(14,164,114,0.13)' }]}>
            <IconLock size={16} color={theme.success} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Security</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
        <Pressable onPress={actions.toastComingSoon} style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(111,102,232,0.13)' }]}>
            <IconInfo size={17} color={theme.accent} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>About FD/RD Manager</Text>
          <IconChevronRight size={15} color={theme.textFaint} />
        </Pressable>
      </Card>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Appearance</Text>
        <View style={styles.segRow}>
          <SegButton label="Light" active={state.theme === 'light'} onPress={actions.setThemeLight} icon={<IconSun color={state.theme === 'light' ? '#fff' : theme.textMuted} />} />
          <SegButton label="Dark" active={state.theme === 'dark'} onPress={actions.setThemeDark} icon={<IconMoon color={state.theme === 'dark' ? '#fff' : theme.textMuted} />} />
        </View>
      </View>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Data</Text>
        <Card style={styles.listCard}>
          <Pressable onPress={actions.goClearData} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(226,73,90,0.12)' }]}>
              <IconWarning size={17} color={theme.danger} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.danger }]}>Delete all data</Text>
            <IconChevronRight size={15} color={theme.textFaint} />
          </Pressable>
        </Card>
      </View>

      <Text style={[styles.footer, { color: theme.textFaint }]}>FD/RD Portfolio Manager · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
  },
  rowMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  segRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
    backgroundColor: 'rgba(120,120,140,0.08)',
  },
  segBtnWrap: {
    flex: 1,
  },
  segBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segText: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  footer: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 10,
  },
});
