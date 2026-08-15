import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { IconCheck, IconChevronDown } from './icons/Icons';
import BottomSheet from './BottomSheet';

export default function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  renderOptionIcon,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  renderOptionIcon?: (option: string) => React.ReactNode;
  error?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: error ? theme.danger : theme.border }]}>
        <View style={styles.optionLeft}>
          {value ? renderOptionIcon?.(value) : null}
          <Text style={[styles.value, { color: value ? theme.text : theme.textFaint }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </View>
        <IconChevronDown size={15} color={theme.textFaint} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <BottomSheet visible={open} onClose={() => setOpen(false)} sheetStyle={styles.sheet}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>{label}</Text>
        <ScrollView style={styles.optionList}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={[styles.option, { borderColor: theme.divider }]}
            >
              <View style={styles.optionLeft}>
                {renderOptionIcon?.(opt)}
                <Text style={[styles.optionText, { color: theme.text }]}>{opt}</Text>
              </View>
              {opt === value && <IconCheck size={16} color={theme.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    flex: 1,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  sheet: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    marginBottom: 10,
  },
  optionList: {
    maxHeight: 360,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  optionText: {
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
  },
});
