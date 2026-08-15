import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

export default function FormField({
  label,
  style,
  error,
  ...rest
}: { label: string; error?: string } & TextInputProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textFaint}
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: error ? theme.danger : theme.border, color: theme.text }, style]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 5,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
});
