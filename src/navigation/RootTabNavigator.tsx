import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Home, MapPin, Package, User } from 'lucide-react-native';
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
import { AppHeader } from '../components/AppHeader';
import { Tri, useL } from '../i18n/tri';
import { colors, font } from '../theme/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ShopsStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();

// Screen and tab titles
const TITLES = {
  home: { uz: 'Asosiy', uz_cyrl: 'Асосий', ru: 'Главная' },
  reports: { uz: 'Hisobotlar', uz_cyrl: 'Ҳисоботлар', ru: 'Отчёты' },
  shops: { uz: 'Doʻkonlar', uz_cyrl: 'Дўконлар', ru: 'Магазины' },
  shop: { uz: 'Doʻkon', uz_cyrl: 'Дўкон', ru: 'Магазин' },
  newShop: { uz: 'Yangi doʻkon', uz_cyrl: 'Янги дўкон', ru: 'Новый магазин' },
  catalog: { uz: 'Katalog', uz_cyrl: 'Каталог', ru: 'Каталог' },
  cart: { uz: 'Savatcha', uz_cyrl: 'Саватча', ru: 'Корзина' },
  checkout: { uz: 'Rasmiylashtirish', uz_cyrl: 'Расмийлаштириш', ru: 'Оформление' },
  history: { uz: 'Buyurtmalar', uz_cyrl: 'Буюртмалар', ru: 'Заказы' },
  profile: { uz: 'Profil', uz_cyrl: 'Профил', ru: 'Профиль' },
} satisfies Record<string, Tri>;

// Every stack uses the app's own header (same look on Android and iOS)
const stackHeader = {
  header: ({ navigation, back, options }: NativeStackHeaderProps) => (
    <AppHeader title={String(options.title ?? '')} onBack={back ? navigation.goBack : undefined} />
  ),
};

const HomeStackNavigator = () => {
  const L = useL();
  return (
    <HomeStack.Navigator screenOptions={stackHeader}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="ReportsScreen" component={ReportsScreen} options={{ title: L(TITLES.reports) }} />
    </HomeStack.Navigator>
  );
};

const ShopsStackNavigator = () => {
  const L = useL();
  return (
    <ShopsStack.Navigator screenOptions={stackHeader}>
      <ShopsStack.Screen name="ShopsList" component={ShopsListScreen} options={{ title: L(TITLES.shops) }} />
      <ShopsStack.Screen name="ShopDetail" component={ShopDetailScreen} options={{ title: L(TITLES.shop) }} />
      <ShopsStack.Screen
        name="AddShopModal"
        component={AddShopModal}
        options={{ title: L(TITLES.newShop) }}
      />
    </ShopsStack.Navigator>
  );
};

const CatalogStackNavigator = () => {
  const L = useL();
  return (
    <CatalogStack.Navigator screenOptions={stackHeader}>
      <CatalogStack.Screen name="CatalogMain" component={CatalogScreen} options={{ title: L(TITLES.catalog) }} />
      <CatalogStack.Screen name="CartScreen" component={CartScreen} options={{ title: L(TITLES.cart) }} />
      <CatalogStack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ title: L(TITLES.checkout) }} />
      <CatalogStack.Screen name="OrderSuccessScreen" component={OrderSuccessScreen} options={{ headerShown: false }} />
    </CatalogStack.Navigator>
  );
};

export const RootTabNavigator = () => {
  const L = useL();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        // Tab screens without their own stack (history, profile) use the same header
        header: ({ options }) => <AppHeader title={String(options.headerTitle ?? options.title ?? '')} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: font.caption, fontWeight: '500' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          title: L(TITLES.home),
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="ShopsTab"
        component={ShopsStackNavigator}
        options={{
          headerShown: false,
          title: L(TITLES.shops),
          tabBarIcon: ({ color, size }) => <MapPin size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{
          headerShown: false,
          title: L(TITLES.catalog),
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={OrdersHistoryScreen}
        options={{
          title: L(TITLES.history),
          tabBarIcon: ({ color, size }) => <FileText size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: L(TITLES.profile),
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tab.Navigator>
  );
};
