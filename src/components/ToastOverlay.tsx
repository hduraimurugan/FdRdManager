import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppState } from '../state/AppContext';
import { IconCheck } from './icons/Icons';

export default function ToastOverlay() {
  const theme = useTheme();
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.toast, { backgroundColor: theme.sheet, borderColor: theme.borderStrong }]}>
        <IconCheck size={15} color={theme.success} />
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
          {toast}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: '86%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  text: {
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
    flexShrink: 1,
  },
});
