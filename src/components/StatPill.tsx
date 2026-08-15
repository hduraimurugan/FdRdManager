import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Card from './Card';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

export default function StatPill({ value, label }: { value: string | number; label: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.pill}>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: '47.5%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
});
