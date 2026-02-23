import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { PaywallScreen } from './src/components/PaywallScreen';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { initAppsFlyer, logOnboardingComplete } from './src/services/appsflyer';

const ONBOARDING_KEY = '@neobrowser_onboarding_done';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initAppsFlyer();
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  const handleOnboardingComplete = async (apiKey: string) => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (apiKey) {
      await AsyncStorage.setItem('@neobrowser_gemini_key', apiKey);
    }
    logOnboardingComplete();
    setShowOnboarding(false);
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F7' }}>
        <ActivityIndicator size="small" color="#78716C" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          {showOnboarding ? (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          ) : (
            <BrowserScreen />
          )}
          <PaywallScreen />
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
