import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { getDatabase } from '../database/db';
import { QRScannerScreen } from '../screens/Auth/QRScannerScreen';
import { RootTabNavigator } from './RootTabNavigator';
import { colors } from '../theme/colors';

import { useLanguageStore } from '../store/languageStore';

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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {agent ? (
          <Stack.Screen name="MainTabs" component={RootTabNavigator} />
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
