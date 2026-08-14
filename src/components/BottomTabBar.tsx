import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
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

// Left-to-right tab order, shared with MainTabsScreen's swipeable pager so the
// swipe order always matches what's drawn in the bar.
export const TAB_ORDER: ActiveTab[] = TABS.map(t => t.key);

function TabItem({
  label,
  Icon,
  active,
  activeColor,
  inactiveColor,
  onPress,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, anim]);

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={4}>
      <View style={styles.iconStack}>
        <Animated.View style={[styles.iconLayer, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <Icon size={21} color={inactiveColor} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, { opacity: anim }]}>
          <Icon size={21} color={activeColor} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, { color: anim.interpolate({ inputRange: [0, 1], outputRange: [inactiveColor, activeColor] }) }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

export default function BottomTabBar({ activeTab, onChange }: { activeTab: ActiveTab; onChange: (tab: ActiveTab) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg, paddingBottom: Math.max(14, insets.bottom) }]}>
      <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.mode === 'dark' ? '#000' : 'rgba(40,35,90,0.35)' }]}>
        {TABS.map(({ key, label, Icon }) => (
          <TabItem
            key={key}
            label={label}
            Icon={Icon}
            active={activeTab === key}
            activeColor={theme.accent}
            inactiveColor={theme.textFaint}
            onPress={() => onChange(key)}
          />
        ))}
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
  iconStack: {
    width: 21,
    height: 21,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 10.5,
  },
});
