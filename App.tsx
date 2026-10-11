import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { AuthProvider } from './src/state/AuthContext';
import { CartProvider } from './src/state/CartContext';
import { OrdersProvider } from './src/state/OrdersContext';
import { PlanProvider } from './src/state/PlanContext';
import { LocationProvider } from './src/state/LocationContext';
import { NotificationsProvider } from './src/state/NotificationsContext';
import { MealBuildProvider } from './src/state/MealBuildContext';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    PlayfairDisplay_800ExtraBold,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <OrdersProvider>
              <PlanProvider>
                <LocationProvider>
                  <NotificationsProvider>
                    <MealBuildProvider>
                    <SafeAreaProvider>
                      <NavigationContainer>
                        <StatusBar style="dark" />
                        <RootNavigator />
                      </NavigationContainer>
                    </SafeAreaProvider>
                    </MealBuildProvider>
                  </NotificationsProvider>
                </LocationProvider>
              </PlanProvider>
            </OrdersProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
