import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { GRADIENT_ANGLE } from '../theme/colors';

export default function ConfirmDialog() {
  const theme = useTheme();
  const { confirmDialog } = useAppState();
  const actions = useAppActions();
  const visible = !!confirmDialog;
  const hasSecondary = !!confirmDialog?.secondaryLabel;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={actions.closeConfirm}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={actions.closeConfirm} />
        <View style={[styles.dialog, { backgroundColor: theme.sheet, borderColor: theme.borderStrong }]}>
          <Text style={[styles.title, { color: theme.text }]}>{confirmDialog?.title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{confirmDialog?.message}</Text>
          {hasSecondary ? (
            <View style={styles.stack}>
              <Pressable onPress={actions.runConfirm}>
                <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.btnGradient}>
                  <Text style={[styles.btnText, { color: '#fff' }]}>{confirmDialog?.confirmLabel}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={actions.runConfirmSecondary} style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.btnText, { color: theme.text }]}>{confirmDialog?.secondaryLabel}</Text>
              </Pressable>
              <Pressable onPress={actions.closeConfirm} style={styles.cancelLink}>
                <Text style={[styles.cancelLinkText, { color: theme.textMuted }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.row}>
              <Pressable onPress={actions.closeConfirm} style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={actions.runConfirm} style={styles.btnFlex}>
                <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.btnGradient}>
                  <Text style={[styles.btnText, { color: '#fff' }]}>{confirmDialog?.confirmLabel}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    marginBottom: 8,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  stack: {
    gap: 10,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnFlex: {
    flex: 1,
  },
  btnGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
});
