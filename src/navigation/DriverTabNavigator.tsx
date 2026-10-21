import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, User, Wallet } from 'lucide-react-native';
import { DeliveriesScreen } from '../screens/Driver/DeliveriesScreen';
import { DeliveryDetailScreen } from '../screens/Driver/DeliveryDetailScreen';
import { LOADING_TITLE, LoadingListScreen } from '../screens/Driver/LoadingListScreen';
import { PkoScreen } from '../screens/Driver/PkoScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AppHeader } from '../components/AppHeader';
import { Tri, useL } from '../i18n/tri';
import { colors, font, radius, shadow } from '../theme/colors';

const Tab = createBottomTabNavigator();
const DeliveryStack = createNativeStackNavigator();

const TITLES = {
  deliveries: { uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' },
  delivery: { uz: 'Buyurtma', uz_cyrl: 'Буюртма', ru: 'Заказ' },
  pko: { uz: 'PKO', uz_cyrl: 'ПКО', ru: 'ПКО' },
  profile: { uz: 'Profil', uz_cyrl: 'Профил', ru: 'Профиль' },
} satisfies Record<string, Tri>;

type TabIconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// Same tab look as the agent app: active tab in a soft blue pill
const tabIcon = (IconCmp: TabIconCmp) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return (
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? colors.primaryLight : 'transparent',
        }}
      >
        <IconCmp size={21} color={color} strokeWidth={focused ? 2.2 : 1.8} />
      </View>
    );
  };

const stackHeader = {
  header: ({ navigation, back, options }: NativeStackHeaderProps) => (
    <AppHeader title={String(options.title ?? '')} onBack={back ? navigation.goBack : undefined} />
  ),
};

const DeliveryStackNavigator = () => {
  const L = useL();
  return (
    <DeliveryStack.Navigator screenOptions={stackHeader}>
      <DeliveryStack.Screen name="DeliveriesList" component={DeliveriesScreen} options={{ title: L(TITLES.deliveries) }} />
      <DeliveryStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: L(TITLES.delivery) }} />
      <DeliveryStack.Screen name="LoadingList" component={LoadingListScreen} options={{ title: L(LOADING_TITLE) }} />
    </DeliveryStack.Navigator>
  );
};

/** The app a line's delivery driver gets: today's deliveries, PKO and profile */
export const DriverTabNavigator = () => {
  const L = useL();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        header: ({ options }) => <AppHeader title={String(options.headerTitle ?? options.title ?? '')} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          ...shadow.pop,
        },
        tabBarLabelStyle: { fontSize: font.caption, fontWeight: '600', marginTop: 2 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="DeliveriesTab"
        component={DeliveryStackNavigator}
        options={{ headerShown: false, title: L(TITLES.deliveries), tabBarIcon: tabIcon(Truck) }}
      />
      <Tab.Screen name="PkoTab" component={PkoScreen} options={{ title: L(TITLES.pko), tabBarIcon: tabIcon(Wallet) }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: L(TITLES.profile), tabBarIcon: tabIcon(User) }} />
    </Tab.Navigator>
  );
};
