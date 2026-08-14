import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { IconCheck, IconChevronDown } from './icons/Icons';

export default function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  renderOptionIcon,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  renderOptionIcon?: (option: string) => React.ReactNode;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <View style={styles.optionLeft}>
          {value ? renderOptionIcon?.(value) : null}
          <Text style={[styles.value, { color: value ? theme.text : theme.textFaint }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </View>
        <IconChevronDown size={15} color={theme.textFaint} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.sheet }]}>
            <View style={[styles.handle, { backgroundColor: theme.borderStrong2 }]} />
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
          </View>
        </View>
      </Modal>
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
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
