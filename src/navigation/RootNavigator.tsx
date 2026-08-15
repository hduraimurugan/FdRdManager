import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import MainTabsScreen from '../screens/MainTabsScreen';
import FdDetailScreen from '../screens/FdDetailScreen';
import RdDetailScreen from '../screens/RdDetailScreen';
import AddEditFdScreen from '../screens/AddEditFdScreen';
import AddEditRdScreen from '../screens/AddEditRdScreen';
import FdCalculatorScreen from '../screens/FdCalculatorScreen';
import RdCalculatorScreen from '../screens/RdCalculatorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MaturityTimelineScreen from '../screens/MaturityTimelineScreen';
import BackupRestoreScreen from '../screens/BackupRestoreScreen';
import ClearDataScreen from '../screens/ClearDataScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import ReminderSettingsScreen from '../screens/ReminderSettingsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const theme = useTheme();
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.accent,
          background: theme.bg,
          card: theme.bg,
          text: theme.text,
          border: theme.border,
          notification: theme.danger,
        },
        fonts: {
          regular: { fontFamily: 'Inter-Regular', fontWeight: '400' },
          medium: { fontFamily: 'Inter-Medium', fontWeight: '500' },
          bold: { fontFamily: 'Inter-Bold', fontWeight: '700' },
          heavy: { fontFamily: 'Inter-ExtraBold', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={MainTabsScreen} />
        <Stack.Screen name="FdDetail" component={FdDetailScreen} />
        <Stack.Screen name="RdDetail" component={RdDetailScreen} />
        <Stack.Screen name="AddEditFD" component={AddEditFdScreen} />
        <Stack.Screen name="AddEditRD" component={AddEditRdScreen} />
        <Stack.Screen name="FdCalculator" component={FdCalculatorScreen} />
        <Stack.Screen name="RdCalculator" component={RdCalculatorScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MaturityTimeline" component={MaturityTimelineScreen} />
        <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
        <Stack.Screen name="ClearData" component={ClearDataScreen} />
        <Stack.Screen name="Security" component={SecuritySettingsScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="Reminders" component={ReminderSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
