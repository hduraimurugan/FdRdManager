import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { formatDate } from '../data/portfolioData';
import { IconCalendar } from './icons/Icons';
import BottomSheet from './BottomSheet';

// Operates on 'YYYY-MM-DD' strings, matching the stored/derived date format everywhere else.
export default function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosPending, setIosPending] = useState<Date | null>(null);

  const dateValue = value ? new Date(value + 'T00:00:00') : new Date();

  const toIso = (d: Date) => {
    const offsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toIso(date));
        },
      });
    } else {
      setIosPending(dateValue);
      setIosOpen(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Pressable onPress={openPicker} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <Text style={[styles.value, { color: value ? theme.text : theme.textFaint }]}>{value ? formatDate(value, 'medium') : 'Select date'}</Text>
        <IconCalendar size={15} color={theme.textFaint} />
      </Pressable>

      {Platform.OS === 'ios' && (
        <BottomSheet visible={iosOpen} onClose={() => setIosOpen(false)} sheetStyle={styles.sheet}>
          {iosPending && (
            <DateTimePicker
              value={iosPending}
              mode="date"
              display="spinner"
              onChange={(_event, date) => date && setIosPending(date)}
              themeVariant={theme.mode}
            />
          )}
          <View style={styles.sheetActions}>
            <Pressable onPress={() => setIosOpen(false)} style={styles.sheetBtn}>
              <Text style={[styles.sheetBtnText, { color: theme.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (iosPending) onChange(toIso(iosPending));
                setIosOpen(false);
              }}
              style={styles.sheetBtn}
            >
              <Text style={[styles.sheetBtnText, { color: theme.accent }]}>Done</Text>
            </Pressable>
          </View>
        </BottomSheet>
      )}
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
  },
  sheet: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  sheetBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
});
