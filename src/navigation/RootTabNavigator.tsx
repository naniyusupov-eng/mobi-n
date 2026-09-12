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
import { Home, MapPin, Package, FileText, BarChart3 } from 'lucide-react-native';
import { useLanguageStore } from '../store/languageStore';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ShopsStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();

const defaultHeaderOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 16 },
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
        name="ReportsTab"
        component={ReportsScreen}
        options={{ title: t('nav_reports_agent') }}
      />
      <HomeStack.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('nav_profile') }}
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
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_home'),
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="ShopsTab"
        component={ShopsStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_shops'),
          tabBarIcon: ({ color, size }) => <MapPin size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{
          headerShown: false,
          title: t('tab_catalog'),
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={OrdersHistoryScreen}
        options={{
          title: t('tab_history'),
          headerTitle: t('nav_orders_journal'),
          tabBarIcon: ({ color, size }) => <FileText size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          title: t('tab_reports'),
          headerTitle: t('nav_reports_agent'),
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
