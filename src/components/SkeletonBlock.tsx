import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonBlock({ height, borderRadius = 16 }: { height: number; borderRadius?: number }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { height, borderRadius, backgroundColor: theme.card, opacity }]} />;
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
  },
});
