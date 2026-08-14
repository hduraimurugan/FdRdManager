import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { GRADIENT_ANGLE } from '../theme/colors';

export default function BarChart({ bars, height = 100 }: { bars: { label: string; heightPct: number }[]; height?: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { height }]}>
      {bars.map((b, i) => (
        <View key={i} style={styles.col}>
          <LinearGradient
            colors={theme.gradientAccent.colors}
            locations={theme.gradientAccent.locations}
            start={GRADIENT_ANGLE.start}
            end={GRADIENT_ANGLE.end}
            style={[styles.bar, { height: `${Math.max(4, b.heightPct)}%` }]}
          />
          <Text style={[styles.label, { color: theme.textFaint }]}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: 26,
    borderRadius: 5,
    minHeight: 3,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
  },
});
