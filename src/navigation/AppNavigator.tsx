import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { getDatabase } from '../database/db';
import { QRScannerScreen } from '../screens/Auth/QRScannerScreen';
import { RootTabNavigator } from './RootTabNavigator';
import { DriverTabNavigator } from './DriverTabNavigator';
import { colors } from '../theme/colors';
import { useLanguageStore } from '../store/languageStore';

// Screens sit on the same soft canvas as the web admin
const NAV_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary, card: colors.card } };

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { agent, isLoading, loadStoredSession } = useAuthStore();
  const { loadStoredLanguage } = useLanguageStore();

  useEffect(() => {
    // Initialize offline SQLite DB and load any cached session & language
    try {
      getDatabase();
    } catch (e) {
      console.error('Failed to init database', e);
    }
    loadStoredLanguage();
    loadStoredSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {agent ? (
          // The line's driver code opens the delivery app; the agent code opens order taking
          agent.role === 'driver' ? (
            <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
          ) : (
            <Stack.Screen name="MainTabs" component={RootTabNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={QRScannerScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
