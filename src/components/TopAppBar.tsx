import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { IconBack, IconBell } from './icons/Icons';

export default function TopAppBar({
  title,
  showBack = false,
  onBack,
  showBell = false,
  unreadCount = 0,
  onBellPress,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showBell?: boolean;
  unreadCount?: number;
  onBellPress?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 10, backgroundColor: theme.bg, borderBottomColor: theme.divider }]}>
      {showBack ? (
        <Pressable
          onPress={onBack}
          style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <IconBack color={theme.text} />
        </Pressable>
      ) : (
        <View style={styles.iconBtnSpacer} />
      )}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {showBell ? (
        <Pressable
          onPress={onBellPress}
          style={[styles.iconBtnRight, { backgroundColor: theme.card }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <IconBell color={theme.text} />
          {unreadCount > 0 && <View style={[styles.dot, { backgroundColor: theme.danger, borderColor: theme.bg }]} />}
        </Pressable>
      ) : (
        <View style={styles.iconBtnSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBtnRight: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBtnSpacer: {
    width: 36,
    height: 36,
    flexShrink: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
