import { Platform } from 'react-native';

const AF_DEV_KEY = 'GXrmkTJ2ThCAmTT7pmM687';
const AF_APP_ID = '6759487820'; // Apple App Store ID (numbers only)

let appsflyer: any = null;

function getAppsFlyer() {
  if (!appsflyer && Platform.OS !== 'web') {
    try {
      appsflyer = require('react-native-appsflyer');
    } catch {}
  }
  return appsflyer;
}

/**
 * Initialize AppsFlyer SDK. Call once on app start.
 */
export async function initAppsFlyer(): Promise<void> {
  const af = getAppsFlyer();
  if (!af) return;

  try {
    af.default.initSdk({
      devKey: AF_DEV_KEY,
      isDebug: __DEV__,
      appId: AF_APP_ID,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      timeToWaitForATTUserAuthorization: 10,
    });
  } catch (err) {
    console.warn('AppsFlyer init error:', err);
  }
}

/**
 * Log a subscription purchase event.
 */
export function logSubscription(
  productId: string,
  price: number,
  currency: string = 'USD',
): void {
  const af = getAppsFlyer();
  if (!af) return;

  try {
    af.default.logEvent('af_subscribe', {
      af_revenue: price,
      af_currency: currency,
      af_content_id: productId,
      af_content_type: 'subscription',
    });
  } catch {}
}

/**
 * Log a purchase event (generic).
 */
export function logPurchase(
  productId: string,
  price: number,
  currency: string = 'USD',
): void {
  const af = getAppsFlyer();
  if (!af) return;

  try {
    af.default.logEvent('af_purchase', {
      af_revenue: price,
      af_currency: currency,
      af_content_id: productId,
      af_content_type: 'subscription',
    });
  } catch {}
}

/**
 * Log when onboarding is completed.
 */
export function logOnboardingComplete(): void {
  const af = getAppsFlyer();
  if (!af) return;

  try {
    af.default.logEvent('af_complete_registration', {
      af_registration_method: 'onboarding',
    });
  } catch {}
}

/**
 * Log a custom event.
 */
export function logEvent(eventName: string, eventValues: Record<string, any> = {}): void {
  const af = getAppsFlyer();
  if (!af) return;

  try {
    af.default.logEvent(eventName, eventValues);
  } catch {}
}
