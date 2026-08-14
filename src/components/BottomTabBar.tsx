import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { ActiveTab } from '../state/AppContext';
import { IconHome, IconPortfolio, IconClock, IconCalculator, IconDots } from './icons/Icons';

const TABS: { key: ActiveTab; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'home', label: 'Home', Icon: IconHome },
  { key: 'portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { key: 'payouts', label: 'Payouts', Icon: IconClock },
  { key: 'calculators', label: 'Calculators', Icon: IconCalculator },
  { key: 'more', label: 'More', Icon: IconDots },
];

export default function BottomTabBar({ activeTab, onChange }: { activeTab: ActiveTab; onChange: (tab: ActiveTab) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg, paddingBottom: Math.max(14, insets.bottom) }]}>
      <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.mode === 'dark' ? '#000' : 'rgba(40,35,90,0.35)' }]}>
        {TABS.map(({ key, label, Icon }) => {
          const color = activeTab === key ? theme.accent : theme.textFaint;
          return (
            <Pressable key={key} onPress={() => onChange(key)} style={styles.item} hitSlop={4}>
              <Icon size={21} color={color} />
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 10.5,
  },
});
