import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import { IconWarning } from '../components/icons/Icons';

const CONFIRM_PHRASE = 'DELETE';

export default function ClearDataScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Delete all data" showBack onBack={actions.back} />
      <View style={styles.container}>
        <Card style={[styles.card, { borderColor: 'rgba(226,73,90,0.35)' }]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(226,73,90,0.13)' }]}>
            <IconWarning size={22} color={theme.danger} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>This cannot be undone</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            This permanently deletes {state.fdList.length} FD{state.fdList.length === 1 ? '' : 's'}, {state.rdList.length} RD
            {state.rdList.length === 1 ? '' : 's'}, and your saved settings from this device. There is no undo — if you might
            want this data back, export a backup first.
          </Text>
        </Card>

        <FormField
          label={`Type ${CONFIRM_PHRASE} to confirm`}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={CONFIRM_PHRASE}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Pressable
          disabled={!canDelete}
          onPress={actions.clearAllData}
          style={({ pressed }) => [styles.deleteBtn, { backgroundColor: theme.danger, opacity: !canDelete ? 0.4 : pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.deleteBtnText}>Delete everything</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  deleteBtnText: {
    color: '#fff',
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
});
