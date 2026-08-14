import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { GRADIENT_ANGLE } from '../theme/colors';
import { IconWarning } from './icons/Icons';

export default function ErrorState({
  title = "Couldn't load your portfolio",
  subtitle = 'Check your connection and try again.',
  onRetry,
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: compact ? 50 : 60 }]}>
      <View style={styles.iconWrap}>
        <IconWarning size={compact ? 24 : 26} color={theme.danger} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {!compact && <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
      <Pressable onPress={onRetry} style={styles.btnWrap}>
        <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.btn}>
          <Text style={styles.btnText}>Retry</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(226,73,90,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  btnWrap: {
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
});
