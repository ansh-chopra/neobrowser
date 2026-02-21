import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';

const ONBOARDING_KEY = '@neobrowser_onboarding_done';
const API_KEY_STORAGE = '@neobrowser_gemini_key';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  const handleOnboardingComplete = async (apiKey: string) => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (apiKey) {
      await AsyncStorage.setItem(API_KEY_STORAGE, apiKey);
    }
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
        {showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <BrowserScreen />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
