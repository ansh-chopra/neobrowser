import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logSubscription, logPurchase } from '../services/appsflyer';

const PRO_STORAGE = '@neobrowser_is_pro';
const GEMINI_KEY_STORAGE = '@neobrowser_gemini_key';
const PRODUCT_ID = 'neo_pro_monthly';

type SubscriptionMode = 'free' | 'pro' | 'byok';

interface SubscriptionContextValue {
  isPro: boolean;
  isBYOK: boolean;
  mode: SubscriptionMode;
  apiKey: string;
  showPaywall: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  subscribe: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  requireProOrBYOK: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPro: false,
  isBYOK: false,
  mode: 'free',
  apiKey: '',
  showPaywall: false,
  openPaywall: () => {},
  closePaywall: () => {},
  subscribe: async () => {},
  restorePurchases: async () => {},
  setApiKey: async () => {},
  requireProOrBYOK: () => false,
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

// Lazy-load expo-iap only on native
let iapModule: any = null;
function getIAP() {
  if (!iapModule && Platform.OS !== 'web') {
    try {
      iapModule = require('expo-iap');
    } catch {}
  }
  return iapModule;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const isBYOK = !isPro && apiKey.length > 0;
  const mode: SubscriptionMode = isPro ? 'pro' : isBYOK ? 'byok' : 'free';

  // Load cached state on mount
  useEffect(() => {
    (async () => {
      const [proVal, keyVal] = await Promise.all([
        AsyncStorage.getItem(PRO_STORAGE),
        AsyncStorage.getItem(GEMINI_KEY_STORAGE),
      ]);
      if (proVal === 'true') setIsPro(true);
      if (keyVal) setApiKeyState(keyVal);
      else if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        setApiKeyState(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
      }

      // Check active purchases via StoreKit
      const iap = getIAP();
      if (iap) {
        try {
          await iap.setup();
          const purchases = await iap.getAvailablePurchases();
          const hasActive = purchases?.some(
            (p: any) => p.productId === PRODUCT_ID
          );
          if (hasActive) {
            setIsPro(true);
            await AsyncStorage.setItem(PRO_STORAGE, 'true');
          }
        } catch {}
      }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    const iap = getIAP();
    if (!iap) return;
    try {
      await iap.setup();
      const products = await iap.getProducts([PRODUCT_ID]);
      if (products && products.length > 0) {
        await iap.requestSubscription(PRODUCT_ID);
        setIsPro(true);
        await AsyncStorage.setItem(PRO_STORAGE, 'true');
        logSubscription(PRODUCT_ID, 9.99, 'USD');
        logPurchase(PRODUCT_ID, 9.99, 'USD');
        setShowPaywall(false);
      }
    } catch (err: any) {
      // User cancelled or error - don't crash
      console.warn('Subscription error:', err?.message);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    const iap = getIAP();
    if (!iap) return;
    try {
      await iap.setup();
      const purchases = await iap.getAvailablePurchases();
      const hasActive = purchases?.some(
        (p: any) => p.productId === PRODUCT_ID
      );
      if (hasActive) {
        setIsPro(true);
        await AsyncStorage.setItem(PRO_STORAGE, 'true');
        setShowPaywall(false);
      }
    } catch (err: any) {
      console.warn('Restore error:', err?.message);
    }
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    setApiKeyState(trimmed);
    if (trimmed) {
      await AsyncStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    } else {
      await AsyncStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  }, []);

  const openPaywall = useCallback(() => setShowPaywall(true), []);
  const closePaywall = useCallback(() => setShowPaywall(false), []);

  const requireProOrBYOK = useCallback((): boolean => {
    if (isPro || isBYOK) return true;
    setShowPaywall(true);
    return false;
  }, [isPro, isBYOK]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        isBYOK,
        mode,
        apiKey,
        showPaywall,
        openPaywall,
        closePaywall,
        subscribe,
        restorePurchases,
        setApiKey,
        requireProOrBYOK,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
