import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { TypeSlice } from '../state/selectors';

export default function DonutChart({
  entries,
  centerLabel,
  size = 88,
  strokeWidth = 16,
}: {
  entries: TypeSlice[];
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {entries.map((seg, i) => {
            const segLen = seg.fraction * circumference;
            const dashoffset = -cumulative;
            cumulative += segLen;
            return (
              <Circle
                key={seg.type + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={dashoffset}
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      <View style={[styles.center, { width: size - strokeWidth * 1.4, height: size - strokeWidth * 1.4, borderRadius: (size - strokeWidth * 1.4) / 2, backgroundColor: theme.card }]}>
        <Text style={[styles.centerText, { color: theme.textMuted }]}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 13,
  },
});
