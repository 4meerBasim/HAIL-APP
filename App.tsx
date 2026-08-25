import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
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
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
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
