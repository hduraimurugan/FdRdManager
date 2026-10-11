import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bankOptions, findBank } from '../data/banks';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import BankBadge from './BankBadge';
import { IconCheck, IconChevronDown, IconSearch } from './icons/Icons';

export default function BankPicker({
  value,
  onChange,
  error,
  usedNames = [],
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  usedNames?: string[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState(false);
  const [customName, setCustomName] = useState('');
  const [manualError, setManualError] = useState(false);
  const options = useMemo(
    () => bankOptions([...usedNames, value], query),
    [usedNames, value, query],
  );
  const close = () => setOpen(false);
  const choose = (name: string) => {
    onChange(name);
    close();
  };
  const startManual = () => {
    setCustomName(value && !findBank(value) ? value : query.trim());
    setManualError(false);
    setManual(true);
  };
  const confirmManual = () => {
    const name = customName.trim();
    if (!name) {
      setManualError(true);
      return;
    }
    choose(name);
  };
  return (
    <View style={styles.field}>
      <Text style={[styles.caption, { color: theme.textMuted }]}>Bank</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          value ? `Bank, ${value}. Change bank` : 'Choose bank'
        }
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setQuery('');
          setManual(false);
          setOpen(true);
        }}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}
      >
        {value ? <BankBadge bankName={value} size={36} /> : null}
        <Text
          style={[styles.name, { color: value ? theme.text : theme.textMuted }]}
        >
          {value || 'Select bank'}
        </Text>
        <IconChevronDown color={theme.textMuted} />
      </Pressable>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.caption, { color: theme.danger }]}
        >
          {error}
        </Text>
      ) : null}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          style={[
            styles.overlay,
            { backgroundColor: theme.overlay, paddingTop: insets.top + 12 },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss bank picker"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                height: Math.max(240, height - insets.top - 36),
                backgroundColor: theme.sheet,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.heading}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: theme.text }]}
              >
                {manual ? 'Enter bank name' : 'Choose your bank'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel bank selection"
                onPress={close}
                style={styles.textButton}
              >
                <Text style={[styles.buttonText, { color: theme.accent }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
            {manual ? (
              <ScrollView
                contentContainerStyle={styles.manual}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.caption, { color: theme.textMuted }]}>
                  Use the name shown on your deposit, including cooperative or
                  other unlisted banks.
                </Text>
                <TextInput
                  autoFocus
                  accessibilityLabel="Bank name"
                  value={customName}
                  onChangeText={name => {
                    setCustomName(name);
                    setManualError(false);
                  }}
                  placeholder="e.g. My Cooperative Bank"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={confirmManual}
                  style={[
                    styles.manualInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.inputBg,
                      borderColor: manualError
                        ? theme.danger
                        : theme.borderStrong,
                    },
                  ]}
                />
                {manualError ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[styles.caption, { color: theme.danger }]}
                  >
                    Enter a bank name
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={confirmManual}
                  style={[styles.confirm, { backgroundColor: theme.accent }]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: theme.mode === 'dark' ? theme.bg : '#fff' },
                    ]}
                  >
                    Use bank name
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setManual(false)}
                  style={styles.textButton}
                >
                  <Text style={[styles.buttonText, { color: theme.accent }]}>
                    Back to bank list
                  </Text>
                </Pressable>
              </ScrollView>
            ) : (
              <>
                <View
                  style={[
                    styles.search,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderStrong,
                    },
                  ]}
                >
                  <IconSearch color={theme.textMuted} />
                  <TextInput
                    accessibilityLabel="Search banks"
                    placeholder="Search bank name or abbreviation"
                    placeholderTextColor={theme.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {query ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear bank search"
                      onPress={() => setQuery('')}
                      style={styles.textButton}
                    >
                      <Text
                        style={[styles.buttonText, { color: theme.accent }]}
                      >
                        Clear
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={startManual}
                  style={[
                    styles.other,
                    { backgroundColor: theme.tint(theme.accent, 0.1) },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: theme.accent }]}>
                    Other / Enter manually
                  </Text>
                </Pressable>
                <Text style={[styles.caption, { color: theme.textMuted }]}>
                  {query.trim()
                    ? `${options.length} matching bank${
                        options.length === 1 ? '' : 's'
                      }`
                    : 'Previously used first · then A–Z'}
                </Text>
                <FlatList
                  data={options}
                  keyExtractor={item => item.name}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  ListEmptyComponent={
                    <Text style={[styles.empty, { color: theme.textMuted }]}>
                      No banks found. Try another name or enter it manually.
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.name}`}
                      accessibilityState={{ selected: item.name === value }}
                      onPress={() => choose(item.name)}
                      style={[
                        styles.option,
                        { borderBottomColor: theme.divider },
                      ]}
                    >
                      <BankBadge bankName={item.name} />
                      <View style={styles.grow}>
                        <Text style={[styles.name, { color: theme.text }]}>
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.caption, { color: theme.textMuted }]}
                        >
                          {item.used ? 'Previously used · ' : ''}
                          {item.category}
                        </Text>
                      </View>
                      {item.name === value ? (
                        <IconCheck color={theme.accent} />
                      ) : null}
                    </Pressable>
                  )}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  trigger: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    flexShrink: 1,
    flexGrow: 1,
  },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fontFamily.bold, fontSize: 20, flex: 1 },
  textButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { fontFamily: fontFamily.semibold, fontSize: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    paddingVertical: 10,
  },
  other: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  list: { flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grow: { flex: 1, gap: 3 },
  empty: { fontFamily: fontFamily.regular, fontSize: 14, paddingVertical: 24 },
  manual: { gap: 12 },
  manualInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  confirm: {
    minHeight: 48,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
