import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppActions, useAppState } from '../state/AppContext';
import TopAppBar from '../components/TopAppBar';
import BottomTabBar from '../components/BottomTabBar';
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

export default function MainTabsScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title={TITLES[state.activeTab]}
        showBell={state.activeTab === 'home'}
        unreadCount={state.notifications.length}
        onBellPress={actions.goNotifications}
      />
      <View style={styles.flex}>
        {state.activeTab === 'home' && <HomeScreen />}
        {state.activeTab === 'portfolio' && <PortfolioScreen />}
        {state.activeTab === 'payouts' && <PayoutsScreen />}
        {state.activeTab === 'calculators' && <CalculatorsHubScreen />}
        {state.activeTab === 'more' && <MoreScreen />}

        {state.activeTab === 'portfolio' && (
          <Fab onPress={state.portfolioTab === 'FD' ? actions.openAddFD : actions.openAddRD} />
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
