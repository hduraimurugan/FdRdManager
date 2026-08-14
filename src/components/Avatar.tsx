import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../theme/typography';

export default function Avatar({
  bg,
  fg,
  initials,
  size = 38,
}: {
  bg: string;
  fg: string;
  initials: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.29, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: fontFamily.bold,
  },
});
