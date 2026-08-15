import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { GRADIENT_ANGLE } from '../theme/colors';
import { IconPlus } from './icons/Icons';

export default function Fab({ onPress, bottom = 88, accessibilityLabel }: { onPress: () => void; bottom?: number; accessibilityLabel: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.wrap, { bottom }]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <LinearGradient
        colors={theme.gradientAccent.colors}
        start={GRADIENT_ANGLE.start}
        end={GRADIENT_ANGLE.end}
        style={styles.fab}
      >
        <IconPlus />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    shadowColor: '#6f66e8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 6,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
