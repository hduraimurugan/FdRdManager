import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { IconSearch } from './icons/Icons';

export default function EmptyState({
  title = 'No deposits match',
  subtitle = 'Try a different search term or clear your filters.',
  actionLabel = 'Clear filters',
  onAction,
}: {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: theme.card }]}>
        <IconSearch size={22} color={theme.textFaint} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      <Pressable onPress={onAction} style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.btnText, { color: theme.text }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  btn: {
    marginTop: 2,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
});
