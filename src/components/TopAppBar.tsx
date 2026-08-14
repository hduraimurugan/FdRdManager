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
    <View style={[styles.row, { paddingTop: insets.top + 10, backgroundColor: theme.bg }]}>
      {showBack ? (
        <Pressable onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.card }]} hitSlop={8}>
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
        <Pressable onPress={onBellPress} style={[styles.iconBtnRight, { backgroundColor: theme.card }]} hitSlop={8}>
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
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    fontFamily: fontFamily.bold,
    fontSize: 19,
    letterSpacing: -0.2,
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
