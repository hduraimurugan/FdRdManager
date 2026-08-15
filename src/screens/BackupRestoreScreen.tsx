import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { GRADIENT_ANGLE } from '../theme/colors';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import { IconDownload, IconImport } from '../components/icons/Icons';

export default function BackupRestoreScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

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
          <Pressable
            onPress={actions.exportBackup}
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
});
