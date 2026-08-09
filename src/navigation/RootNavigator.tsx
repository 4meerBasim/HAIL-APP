import React from 'react';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TrackingStatus } from '../data/menu';
import { useAuth } from '../state/AuthContext';
import Tabs from './Tabs';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DishDetailScreen from '../screens/DishDetailScreen';
import BoxDetailScreen from '../screens/BoxDetailScreen';
import PlanBuilderScreen from '../screens/PlanBuilderScreen';
import MealCustomizeScreen from '../screens/MealCustomizeScreen';
import PlanMacrosScreen from '../screens/PlanMacrosScreen';
import SubscribeScreen from '../screens/SubscribeScreen';
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
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  DishDetail: { id: string };
  BoxDetail: { id: string };
  PlanBuilder: { boxId?: string } | undefined;
  MealCustomize: { dishId: string };
  PlanMacros: undefined;
  Subscribe: undefined;
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
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return <SplashScreen />;
  }

  // Login is the entry point, but guests can walk straight into the tabs to
  // browse plans; the gate only comes back at checkout.
  const initialRouteName =
    status === 'authed' ? (profile ? 'Tabs' : 'Onboarding') : 'Login';

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="DishDetail" component={DishDetailScreen} />
      <Stack.Screen name="BoxDetail" component={BoxDetailScreen} />
      <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
      <Stack.Screen name="MealCustomize" component={MealCustomizeScreen} />
      <Stack.Screen name="PlanMacros" component={PlanMacrosScreen} />
      <Stack.Screen name="Subscribe" component={SubscribeScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
}
