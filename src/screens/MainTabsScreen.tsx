import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppActions, useAppState } from '../state/AppContext';
import TopAppBar from '../components/TopAppBar';
import BottomTabBar, { TAB_ORDER } from '../components/BottomTabBar';
import { IconHome, IconPortfolio, IconClock, IconCalculator, IconDots } from '../components/icons/Icons';
import FilterSheet from '../components/FilterSheet';
import HomeScreen from './HomeScreen';
import PortfolioScreen from './PortfolioScreen';
import PayoutsScreen from './PayoutsScreen';
import CalculatorsHubScreen from './CalculatorsHubScreen';
import MoreScreen from './MoreScreen';
import { fontFamily } from '../theme/typography';

const TITLES: Record<string, string> = {
  home: 'Home',
  portfolio: 'Portfolio',
  payouts: 'Payouts',
  calculators: 'Calculators',
  more: 'More',
};

const TITLE_ICONS = { home: IconHome, portfolio: IconPortfolio, payouts: IconClock, calculators: IconCalculator, more: IconDots };

const PAGES: Record<string, React.ComponentType> = {
  home: HomeScreen,
  portfolio: PortfolioScreen,
  payouts: PayoutsScreen,
  calculators: CalculatorsHubScreen,
  more: MoreScreen,
};

function PortfolioKindSwitch({ selected, fdCount, rdCount, accent, background, mutedColor, selectedTextColor, onSelect }: {
  selected: 'FD' | 'RD'; fdCount: number; rdCount: number; accent: string;
  background: string; mutedColor: string; selectedTextColor: string; onSelect: (kind: 'FD' | 'RD') => void;
}) {
  const slide = useRef(new Animated.Value(selected === 'FD' ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(slide, { toValue: selected === 'FD' ? 0 : 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [selected, slide]);
  return (
    <View style={[styles.portfolioSwitch, { backgroundColor: background }]}>
      <Animated.View pointerEvents="none" style={[styles.switchPill, { backgroundColor: accent, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 58] }) }] }]} />
      {(['FD', 'RD'] as const).map(kind => {
        const active = selected === kind;
        return <Pressable key={kind} accessibilityRole="tab" accessibilityLabel={kind === 'FD' ? 'Fixed Deposits' : 'Recurring Deposits'} accessibilityState={{ selected: active }} onPress={() => onSelect(kind)} style={styles.portfolioSwitchItem}>
          <Text style={[styles.portfolioSwitchText, { color: active ? selectedTextColor : mutedColor }]}>{kind} {kind === 'FD' ? fdCount : rdCount}</Text>
        </Pressable>;
      })}
    </View>
  );
}

export default function MainTabsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [pagerSize, setPagerSize] = useState({ width: 0, height: 0 });
  const pageWidth = pagerSize.width || width;

  const TitleIcon = TITLE_ICONS[state.activeTab];
  const activeIndex = TAB_ORDER.indexOf(state.activeTab);
  // True while an activeTab change is a *result* of the user's own swipe (set
  // right before we dispatch it from handleMomentumScrollEnd). The sync effect
  // below checks this so it never re-issues scrollTo for a change the pager
  // itself just produced — doing so would fight the in-flight native paging
  // animation and could snap the pager back to the wrong page.
  const tabChangeFromSwipe = useRef(false);

  // Keep the pager in sync whenever activeTab changes from anywhere else
  // (bottom tab bar tap, an EmptyState CTA jumping to Portfolio, etc.).
  useEffect(() => {
    if (tabChangeFromSwipe.current) {
      tabChangeFromSwipe.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ x: activeIndex * pageWidth, animated: true });
  }, [activeIndex, pageWidth]);

  // Commit the tab change as soon as the finger lifts (onScrollEndDrag) rather
  // than waiting for the native snap animation to finish (onMomentumScrollEnd)
  // — pagingEnabled always settles on the page nearest the release offset, so
  // rounding here predicts the destination correctly in the vast majority of
  // cases and makes the tab bar/title update feel instant instead of trailing
  // ~200-300ms behind the visible swipe. onMomentumScrollEnd is kept as a
  // correction for the rare fast-flick case where the native fling carries
  // past the immediate next page.
  const commitFromOffset = (offsetX: number) => {
    const index = Math.round(offsetX / pageWidth);
    const tab = TAB_ORDER[index];
    if (tab && tab !== state.activeTab) {
      tabChangeFromSwipe.current = true;
      actions.setTab(tab);
    }
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.x);
  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.x);

  const handlePagerLayout = (e: LayoutChangeEvent) => {
    setPagerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title={TITLES[state.activeTab]}
        titleIcon={<TitleIcon size={22} color={theme.accent} />}
        showBell={state.activeTab === 'home'}
        unreadCount={state.notifications.length}
        onBellPress={actions.goNotifications}
        rightContent={state.activeTab === 'portfolio' ? (
          <PortfolioKindSwitch selected={state.portfolioTab} fdCount={state.fdList.length} rdCount={state.rdList.length} accent={theme.accent} background={theme.inputBg} mutedColor={theme.textMuted} selectedTextColor={theme.mode === 'dark' ? theme.bg : '#fff'} onSelect={kind => kind === 'FD' ? actions.setPortfolioTabFD() : actions.setPortfolioTabRD()} />
        ) : undefined}
      />
      <View style={styles.flex} onLayout={handlePagerLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {TAB_ORDER.map(tab => {
            const Screen = PAGES[tab];
            return (
              <View key={tab} style={{ width: pageWidth, height: pagerSize.height || undefined }} collapsable={false}>
                <Screen />
              </View>
            );
          })}
        </ScrollView>

      </View>
      <BottomTabBar activeTab={state.activeTab} onChange={tab => { tabChangeFromSwipe.current = false; actions.setTab(tab); }} />
      <FilterSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  portfolioSwitch: { position: 'relative', flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2 },
  switchPill: { position: 'absolute', top: 3, left: 3, width: 58, height: 36, borderRadius: 9 },
  portfolioSwitchItem: { zIndex: 1, minWidth: 58, minHeight: 36, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  portfolioSwitchText: { fontFamily: fontFamily.semibold, fontSize: 12 },
});
