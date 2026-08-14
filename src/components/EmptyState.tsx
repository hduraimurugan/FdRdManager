import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { GradientSpec, GRADIENT_ANGLE } from '../theme/colors';
import { IconSearch, IconSparkle } from './icons/Icons';

export interface EmptyStateHighlight {
  icon: React.ReactNode;
  label: string;
}

export default function EmptyState({
  title = 'No deposits match',
  subtitle = 'Try a different search term or clear your filters.',
  actionLabel = 'Clear filters',
  onAction,
  icon,
  gradient,
  compact = false,
  highlights,
}: {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  gradient?: GradientSpec;
  compact?: boolean;
  highlights?: EmptyStateHighlight[];
}) {
  const theme = useTheme();

  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(compact ? 6 : 16)).current;
  const scale = useRef(new Animated.Value(compact ? 1 : 0.94)).current;

  useEffect(() => {
    const duration = compact ? 200 : 420;
    const delay = compact ? 0 : 60;
    const easing = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration, delay, easing, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, easing, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration, delay, easing, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (compact) {
    return (
      <Animated.View style={[styles.wrapCompact, { opacity: fade, transform: [{ translateY }] }]}>
        <View style={[styles.iconWrapCompact, { backgroundColor: theme.card }]}>
          {icon ?? <IconSearch size={22} color={theme.textFaint} />}
        </View>
        <Text style={[styles.titleCompact, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitleCompact, { color: theme.textMuted }]}>{subtitle}</Text>
        {onAction && (
          <Pressable onPress={onAction} style={[styles.btnCompact, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.btnCompactText, { color: theme.text }]}>{actionLabel}</Text>
          </Pressable>
        )}
      </Animated.View>
    );
  }

  const activeGradient = gradient ?? theme.gradientAccent;
  const glowColor = activeGradient.colors[0];
  const glowAlpha = theme.mode === 'dark' ? { outer: 0.32, inner: 0.48 } : { outer: 0.16, inner: 0.26 };

  return (
    <Animated.View style={[styles.wrap, { opacity: fade, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.glowStage}>
        <View style={[styles.glowOuter, { backgroundColor: theme.tint(glowColor, glowAlpha.outer) }]} />
        <View style={[styles.glowInner, { backgroundColor: theme.tint(glowColor, glowAlpha.inner) }]} />
        <LinearGradient
          colors={theme.gradientAccent.colors}
          start={GRADIENT_ANGLE.start}
          end={GRADIENT_ANGLE.end}
          style={styles.bubble}
        >
          {icon ?? <IconSearch size={30} color="#fff" />}
        </LinearGradient>
        <View style={[styles.sparkleBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <IconSparkle size={12} color={theme.accent} />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>

      {highlights && highlights.length > 0 && (
        <View style={styles.highlightsWrap}>
          {highlights.map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <View style={[styles.highlightIcon, { backgroundColor: theme.tint(theme.accent, 0.1) }]}>{h.icon}</View>
              <Text style={[styles.highlightLabel, { color: theme.text }]}>{h.label}</Text>
            </View>
          ))}
        </View>
      )}

      {onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.ctaShadowWrap,
            { shadowColor: theme.accent, shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.28, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
            <Text style={styles.ctaText}>{actionLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 28,
    gap: 14,
  },
  glowStage: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  glowOuter: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  glowInner: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  bubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 28,
    right: 28,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 264,
  },
  highlightsWrap: {
    marginTop: 6,
    gap: 10,
    width: '100%',
    maxWidth: 280,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    flexShrink: 1,
  },
  ctaShadowWrap: {
    marginTop: 4,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
  },
  ctaText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Compact variant — used for transient "no results" states where data already exists.
  wrapCompact: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrapCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCompact: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  subtitleCompact: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 230,
  },
  btnCompact: {
    marginTop: 2,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnCompactText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
});
