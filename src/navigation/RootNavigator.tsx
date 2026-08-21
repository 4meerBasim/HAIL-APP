import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BoxGoal, TrackingStatus } from '../data/menu';
import { useAuth } from '../state/AuthContext';
import Tabs from './Tabs';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import BoxDetailScreen from '../screens/BoxDetailScreen';
import PlanBuilderScreen from '../screens/PlanBuilderScreen';
import SubscribeScreen from '../screens/SubscribeScreen';
import DishDetailScreen from '../screens/DishDetailScreen';
import CartScreen from '../screens/CartScreen';
import PastOrdersScreen from '../screens/PastOrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import TrackingScreen from '../screens/TrackingScreen';
import MapScreen from '../screens/MapScreen';
import CateringScreen from '../screens/CateringScreen';
import PlanMenuScreen from '../screens/PlanMenuScreen';
import AddressesScreen from '../screens/AddressesScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import AddCardScreen from '../screens/AddCardScreen';
import PhonesScreen from '../screens/PhonesScreen';
import AddPhoneScreen from '../screens/AddPhoneScreen';

export type MenuCategory = 'all' | 'h' | 'r' | 'pop';

export type TabParamList = {
  Plans: undefined;
  // `focusSearch` is consumed and cleared by MenuScreen, so arriving from the
  // Plans search box puts the caret in the field instead of asking for a
  // second tap.
  Menu: { cat?: MenuCategory; focusSearch?: boolean } | undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Catering: undefined;
  PlanMenu: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  BoxDetail: { id: BoxGoal };
  PlanBuilder: { boxId?: BoxGoal } | undefined;
  Subscribe: undefined;
  DishDetail: { id: string };
  Cart: undefined;
  PastOrders: undefined;
  OrderDetail: { id: string };
  Tracking: { status?: TrackingStatus } | undefined;
  Map: undefined;
  Addresses: undefined;
  Phones: undefined;
  // Same screen for both jobs: `asPrimary` decides whether the verified number
  // replaces the sign-in number or joins the list beside it.
  AddPhone: { asPrimary: boolean } | undefined;
  Payments: undefined;
  AddCard: undefined;
  Notifications: undefined;
  Support: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { status } = useAuth();
  const [splashGone, setSplashGone] = useState(false);
  const onSplashDone = useCallback(() => setSplashGone(true), []);

  // `initialRouteName` is only read on mount, so the navigator cannot go up
  // until auth has resolved — otherwise a returning customer would land on
  // Login. The splash sits over the top and covers that wait.
  const resolved = status !== 'loading';

  // Login is the entry point, but guests can walk straight into the tabs to
  // browse plans and the menu; the gate only comes back at checkout.
  const initialRouteName = status === 'authed' ? 'Tabs' : 'Login';

  return (
    <View style={styles.root}>
      {resolved ? (
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="BoxDetail" component={BoxDetailScreen} />
          <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
          <Stack.Screen name="Subscribe" component={SubscribeScreen} />
          <Stack.Screen name="DishDetail" component={DishDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="PastOrders" component={PastOrdersScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Catering" component={CateringScreen} />
          <Stack.Screen name="PlanMenu" component={PlanMenuScreen} />
          <Stack.Screen name="Addresses" component={AddressesScreen} />
          <Stack.Screen name="Phones" component={PhonesScreen} />
          <Stack.Screen name="AddPhone" component={AddPhoneScreen} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
          <Stack.Screen name="AddCard" component={AddCardScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
        </Stack.Navigator>
      ) : null}
      {/* Rendered over the live navigator rather than instead of it, so the
          destination is already mounted underneath when the splash dissolves. */}
      {splashGone ? null : <SplashScreen ready={resolved} onDone={onSplashDone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
