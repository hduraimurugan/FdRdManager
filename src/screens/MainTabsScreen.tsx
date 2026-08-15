import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewInstance, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppActions, useAppState } from '../state/AppContext';
import TopAppBar from '../components/TopAppBar';
import BottomTabBar, { TAB_ORDER } from '../components/BottomTabBar';
import Fab from '../components/Fab';
import FilterSheet from '../components/FilterSheet';
import HomeScreen from './HomeScreen';
import PortfolioScreen from './PortfolioScreen';
import PayoutsScreen from './PayoutsScreen';
import CalculatorsHubScreen from './CalculatorsHubScreen';
import MoreScreen from './MoreScreen';

const TITLES: Record<string, string> = {
  home: 'Portfolio',
  portfolio: 'Portfolio',
  payouts: 'Payouts',
  calculators: 'Calculators',
  more: 'More',
};

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
        showBell={state.activeTab === 'home'}
        unreadCount={state.notifications.length}
        onBellPress={actions.goNotifications}
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

        {state.activeTab === 'portfolio' && (
          <Fab
            onPress={state.portfolioTab === 'FD' ? actions.openAddFD : actions.openAddRD}
            accessibilityLabel={state.portfolioTab === 'FD' ? 'Add FD' : 'Add RD'}
          />
        )}
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
});
