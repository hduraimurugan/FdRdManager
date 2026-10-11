import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
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
  selectedIconColor,
  inactiveColor,
  feedbackColor,
  reduceMotion,
  onPress,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  active: boolean;
  activeColor: string;
  selectedIconColor: string;
  inactiveColor: string;
  feedbackColor: string;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(active ? 1 : 0);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, anim, reduceMotion]);

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: pressed ? feedbackColor : 'transparent', borderColor: focused ? activeColor : 'transparent' },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <View style={styles.iconStack} pointerEvents="none">
        <Animated.View style={[styles.selectedPill, { backgroundColor: activeColor, opacity: anim }]} />
        <Animated.View style={[styles.iconLayer, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <Icon size={20} color={inactiveColor} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, { opacity: anim }]}>
          <Icon size={20} color={selectedIconColor} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, { color: active ? activeColor : inactiveColor }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

export default function BottomTabBar({ activeTab, onChange }: { activeTab: ActiveTab; onChange: (tab: ActiveTab) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      preferenceChanged = true;
      setReduceMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted && !preferenceChanged) {
        setReduceMotion(enabled);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <View style={[styles.wrap, {
      backgroundColor: theme.bg,
      paddingBottom: Math.max(10, insets.bottom),
      paddingLeft: Math.max(12, insets.left),
      paddingRight: Math.max(12, insets.right),
    }]}>
      <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.borderStrong }]}>
        {TABS.map(({ key, label, Icon }) => (
          <TabItem
            key={key}
            label={label}
            Icon={Icon}
            active={activeTab === key}
            activeColor={theme.accent}
            selectedIconColor={theme.mode === 'dark' ? theme.bg : theme.card}
            inactiveColor={theme.textMuted}
            feedbackColor={theme.tint(theme.accent, 0.12)}
            reduceMotion={reduceMotion}
            onPress={() => onChange(key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 26,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowOpacity: 0.12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  iconStack: {
    width: 44,
    maxWidth: '100%',
    height: 28,
  },
  selectedPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 14,
  },
  iconLayer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    textAlign: 'center',
  },
});
