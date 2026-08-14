import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions } from '../state/AppContext';
import Card from '../components/Card';
import { IconCalculator, IconGrowth, IconChevronRight } from '../components/icons/Icons';

export default function CalculatorsHubScreen() {
  const theme = useTheme();
  const actions = useAppActions();

  return (
    <View style={styles.container}>
      <Pressable onPress={actions.openFdCalculator}>
        <Card style={styles.card}>
          <View style={[styles.icon, { backgroundColor: 'rgba(111,102,232,0.13)' }]}>
            <IconCalculator size={22} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: theme.text }]}>FD Calculator</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Simple vs compound interest, any scenario</Text>
          </View>
          <IconChevronRight size={17} color={theme.textFaint} />
        </Card>
      </Pressable>

      <Pressable onPress={actions.openRdCalculator}>
        <Card style={styles.card}>
          <View style={[styles.icon, { backgroundColor: 'rgba(14,164,114,0.13)' }]}>
            <IconGrowth size={22} color={theme.success} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: theme.text }]}>RD Calculator</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Plan monthly installments and maturity</Text>
          </View>
          <IconChevronRight size={17} color={theme.textFaint} />
        </Card>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    padding: 20,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    marginTop: 2,
  },
});
