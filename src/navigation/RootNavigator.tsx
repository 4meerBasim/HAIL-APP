import React from 'react';
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
import TrackingScreen from '../screens/TrackingScreen';

export type MenuCategory = 'all' | 'h' | 'r' | 'pop';

export type TabParamList = {
  Plans: undefined;
  Menu: { cat?: MenuCategory } | undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  BoxDetail: { id: BoxGoal };
  PlanBuilder: { boxId?: BoxGoal } | undefined;
  Subscribe: undefined;
  DishDetail: { id: string };
  Cart: undefined;
  Tracking: { status?: TrackingStatus } | undefined;
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

  if (status === 'loading') {
    return <SplashScreen />;
  }

  // Login is the entry point, but guests can walk straight into the tabs to
  // browse plans and the menu; the gate only comes back at checkout.
  const initialRouteName = status === 'authed' ? 'Tabs' : 'Login';

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="BoxDetail" component={BoxDetailScreen} />
      <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
      <Stack.Screen name="Subscribe" component={SubscribeScreen} />
      <Stack.Screen name="DishDetail" component={DishDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
}
