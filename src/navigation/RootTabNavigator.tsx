import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/Dashboard/HomeScreen';
import { ShopsListScreen } from '../screens/Shops/ShopsListScreen';
import { ShopDetailScreen } from '../screens/Shops/ShopDetailScreen';
import { AddShopModal } from '../screens/Shops/AddShopModal';
import { CatalogScreen } from '../screens/Catalog/CatalogScreen';
import { CartScreen } from '../screens/Order/CartScreen';
import { CheckoutScreen } from '../screens/Order/CheckoutScreen';
import { OrderSuccessScreen } from '../screens/Order/OrderSuccessScreen';
import { OrdersHistoryScreen } from '../screens/History/OrdersHistoryScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { colors } from '../theme/colors';
import { Home, MapPin, Package, FileText, User } from 'lucide-react-native';
import { useLanguageStore } from '../store/languageStore';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ShopsStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();

const defaultHeaderOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 16, color: colors.text },
  headerShadowVisible: false,
};

const HomeStackNavigator = () => {
  const { t } = useLanguageStore();
  return (
    <HomeStack.Navigator screenOptions={defaultHeaderOptions}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ReportsScreen"
        component={ReportsScreen}
        options={{ title: t('nav_reports_agent') }}
      />
    </HomeStack.Navigator>
  );
};

const ShopsStackNavigator = () => {
  const { t } = useLanguageStore();
  return (
    <ShopsStack.Navigator screenOptions={defaultHeaderOptions}>
      <ShopsStack.Screen
        name="ShopsList"
        component={ShopsListScreen}
        options={{ title: t('tab_shops') }}
      />
      <ShopsStack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: t('nav_shop_detail') }}
      />
      <ShopsStack.Screen
        name="AddShopModal"
        component={AddShopModal}
        options={{ title: t('nav_new_shop'), presentation: 'modal' }}
      />
    </ShopsStack.Navigator>
  );
};

const CatalogStackNavigator = () => {
  const { t } = useLanguageStore();
  return (
    <CatalogStack.Navigator screenOptions={defaultHeaderOptions}>
      <CatalogStack.Screen
        name="CatalogMain"
        component={CatalogScreen}
        options={{ title: t('tab_catalog') }}
      />
      <CatalogStack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{ title: t('nav_cart') }}
      />
      <CatalogStack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{ title: t('nav_checkout') }}
      />
      <CatalogStack.Screen
        name="OrderSuccessScreen"
        component={OrderSuccessScreen}
        options={{ headerShown: false }}
      />
    </CatalogStack.Navigator>
  );
};

export const RootTabNavigator = () => {
  const { t, lang } = useLanguageStore();

  return (
    <Tab.Navigator
      key={lang}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        ...defaultHeaderOptions,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_home'),
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="ShopsTab"
        component={ShopsStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_shops'),
          tabBarIcon: ({ color, size }) => <MapPin size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_catalog'),
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={OrdersHistoryScreen}
        options={{
          title: t('tab_history'),
          headerTitle: t('nav_orders_journal'),
          tabBarIcon: ({ color, size }) => <FileText size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t('nav_profile'),
          headerTitle: t('nav_profile'),
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tab.Navigator>
  );
};
