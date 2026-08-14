import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Fill } from '../state/selectors';
import { GRADIENT_ANGLE } from '../theme/colors';

function isGradient(fill: Fill): fill is { colors: string[]; locations?: number[] } {
  return typeof fill === 'object' && fill !== null && 'colors' in fill;
}

export default function ProgressBar({
  progress,
  fill,
  height = 5,
}: {
  progress: number;
  fill: Fill;
  height?: number;
}) {
  const theme = useTheme();
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.divider }]}>
      {isGradient(fill) ? (
        <LinearGradient
          colors={fill.colors}
          locations={fill.locations}
          start={GRADIENT_ANGLE.start}
          end={GRADIENT_ANGLE.end}
          style={[styles.fill, { width: `${pct}%`, borderRadius: height / 2 }]}
        />
      ) : (
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fill, borderRadius: height / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
