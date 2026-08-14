import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../theme/typography';

export default function StatusBadge({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
  },
});
