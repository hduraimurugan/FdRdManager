import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { GRADIENT_ANGLE } from '../theme/colors';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import BottomSheet from '../components/BottomSheet';
import { IconDownload, IconImport, IconLock } from '../components/icons/Icons';

const MIN_PASSPHRASE_LENGTH = 6;

export default function BackupRestoreScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  const [encryptExport, setEncryptExport] = useState(false);
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportPassphraseConfirm, setExportPassphraseConfirm] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const [importPassphrase, setImportPassphrase] = useState('');

  const startExport = () => {
    if (encryptExport) {
      setExportPassphrase('');
      setExportPassphraseConfirm('');
      setExportError(null);
      setExportSheetOpen(true);
      return;
    }
    actions.exportBackup();
  };

  const confirmEncryptedExport = () => {
    if (exportPassphrase.length < MIN_PASSPHRASE_LENGTH) {
      setExportError(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`);
      return;
    }
    if (exportPassphrase !== exportPassphraseConfirm) {
      setExportError("Passphrases don't match");
      return;
    }
    setExportSheetOpen(false);
    actions.exportBackup(exportPassphrase);
  };

  const submitImportPassphrase = () => {
    actions.submitImportPassphrase(importPassphrase);
    setImportPassphrase('');
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Backup & Restore" showBack onBack={actions.back} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(91,158,224,0.15)' }]}>
            <IconDownload size={18} color="#5b9ee0" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Export backup</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Save your {state.fdList.length} FD{state.fdList.length === 1 ? '' : 's'} and {state.rdList.length} RD
            {state.rdList.length === 1 ? '' : 's'} as a file you can send to Drive, email, or another phone.
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelRow}>
              <IconLock size={13} color={theme.textMuted} />
              <Text style={[styles.toggleLabel, { color: theme.text }]}>Encrypt with a passphrase</Text>
            </View>
            <Switch value={encryptExport} onValueChange={setEncryptExport} />
          </View>
          {!encryptExport && (
            <Text style={[styles.warning, { color: theme.warning }]}>
              Without a passphrase, this file is plain text — anyone who gets it can read every field.
            </Text>
          )}

          <Pressable
            onPress={startExport}
            disabled={state.exporting}
            style={({ pressed }) => [styles.ctaShadowWrap, { shadowColor: theme.accent, opacity: pressed || state.exporting ? 0.7 : 1 }]}
          >
            <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
              <Text style={styles.ctaText}>{state.exporting ? 'Exporting…' : 'Export as file'}</Text>
            </LinearGradient>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(111,102,232,0.13)' }]}>
            <IconImport size={18} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Import backup</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Restore from a previously exported backup file. Existing entries are updated, nothing is deleted.
          </Text>
          <Pressable
            onPress={actions.importBackup}
            disabled={state.importing}
            style={[styles.outlineBtn, { borderColor: theme.border, backgroundColor: theme.card, opacity: state.importing ? 0.7 : 1 }]}
          >
            <Text style={[styles.outlineBtnText, { color: theme.text }]}>{state.importing ? 'Importing…' : 'Choose backup file'}</Text>
          </Pressable>
        </Card>
      </View>

      <BottomSheet visible={exportSheetOpen} onClose={() => setExportSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>Set a passphrase</Text>
        <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
          You'll need this exact passphrase to restore the file later. There's no way to recover it if you forget it.
        </Text>
        <TextInput
          value={exportPassphrase}
          onChangeText={text => {
            setExportPassphrase(text);
            setExportError(null);
          }}
          secureTextEntry
          autoFocus
          placeholder="Passphrase"
          placeholderTextColor={theme.textFaint}
          style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
        />
        <TextInput
          value={exportPassphraseConfirm}
          onChangeText={text => {
            setExportPassphraseConfirm(text);
            setExportError(null);
          }}
          secureTextEntry
          placeholder="Confirm passphrase"
          placeholderTextColor={theme.textFaint}
          style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: exportError ? theme.danger : theme.border, color: theme.text }]}
        />
        {exportError ? <Text style={[styles.error, { color: theme.danger }]}>{exportError}</Text> : null}
        <Pressable onPress={confirmEncryptedExport} style={styles.sheetBtnWrap}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
            <Text style={styles.ctaText}>Export encrypted file</Text>
          </LinearGradient>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={state.pendingEncryptedImportText !== null} onClose={actions.cancelImportPassphrase}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>This backup is encrypted</Text>
        <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>Enter the passphrase it was exported with.</Text>
        <TextInput
          value={importPassphrase}
          onChangeText={setImportPassphrase}
          secureTextEntry
          autoFocus
          placeholder="Passphrase"
          placeholderTextColor={theme.textFaint}
          style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: state.passphraseError ? theme.danger : theme.border, color: theme.text }]}
        />
        {state.passphraseError ? <Text style={[styles.error, { color: theme.danger }]}>{state.passphraseError}</Text> : null}
        <Pressable onPress={submitImportPassphrase} disabled={state.importing} style={styles.sheetBtnWrap}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
            <Text style={styles.ctaText}>{state.importing ? 'Decrypting…' : 'Continue'}</Text>
          </LinearGradient>
        </Pressable>
      </BottomSheet>
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
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
  },
  warning: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  ctaShadowWrap: {
    marginTop: 4,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  cta: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  ctaText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
    color: '#fff',
  },
  outlineBtn: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    marginBottom: 10,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  sheetBtnWrap: {
    marginTop: 4,
  },
});
