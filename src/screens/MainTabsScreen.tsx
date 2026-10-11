import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

export default function MainTabsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [pagerHeight, setPagerHeight] = useState(0);

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
    scrollRef.current?.scrollTo({ x: activeIndex * width, animated: true });
  }, [activeIndex, width]);

  // Commit the tab change as soon as the finger lifts (onScrollEndDrag) rather
  // than waiting for the native snap animation to finish (onMomentumScrollEnd)
  // — pagingEnabled always settles on the page nearest the release offset, so
  // rounding here predicts the destination correctly in the vast majority of
  // cases and makes the tab bar/title update feel instant instead of trailing
  // ~200-300ms behind the visible swipe. onMomentumScrollEnd is kept as a
  // correction for the rare fast-flick case where the native fling carries
  // past the immediate next page.
  const commitFromOffset = (offsetX: number) => {
    const index = Math.round(offsetX / width);
    const tab = TAB_ORDER[index];
    if (tab && tab !== state.activeTab) {
      tabChangeFromSwipe.current = true;
      actions.setTab(tab);
    }
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.x);
  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.x);

  const handlePagerLayout = (e: LayoutChangeEvent) => {
    setPagerHeight(e.nativeEvent.layout.height);
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
          <View style={[styles.portfolioSwitch, { backgroundColor: theme.inputBg }]}>
            {(['FD', 'RD'] as const).map(kind => {
              const selected = state.portfolioTab === kind;
              return (
                <Pressable
                  key={kind}
                  accessibilityRole="tab"
                  accessibilityLabel={kind === 'FD' ? 'Fixed Deposits' : 'Recurring Deposits'}
                  accessibilityState={{ selected }}
                  onPress={kind === 'FD' ? actions.setPortfolioTabFD : actions.setPortfolioTabRD}
                  style={[styles.portfolioSwitchItem, { backgroundColor: selected ? theme.accent : 'transparent' }]}
                >
                  <Text style={[styles.portfolioSwitchText, { color: selected ? (theme.mode === 'dark' ? theme.bg : '#fff') : theme.textMuted }]}>
                    {kind} {kind === 'FD' ? state.fdList.length : state.rdList.length}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
              <View key={tab} style={{ width, height: pagerHeight || undefined }} collapsable={false}>
                <Screen />
              </View>
            );
          })}
        </ScrollView>

      </View>
      <BottomTabBar activeTab={state.activeTab} onChange={actions.setTab} />
      <FilterSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  portfolioSwitch: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2 },
  portfolioSwitchItem: { minWidth: 58, minHeight: 36, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  portfolioSwitchText: { fontFamily: fontFamily.semibold, fontSize: 12 },
});
