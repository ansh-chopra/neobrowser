// Privacy Shield Service
// Ad/tracker blocking, HTTPS upgrade, fingerprint protection, cookie control

export type CookiePolicy = 'allow_all' | 'block_third_party' | 'block_all';

export interface PrivacySettings {
  adBlocking: boolean;
  trackerProtection: boolean;
  httpsEverywhere: boolean;
  fingerprintProtection: boolean;
  cookiePolicy: CookiePolicy;
}

export interface PrivacyStats {
  adsBlocked: number;
  trackersBlocked: number;
  httpsUpgrades: number;
  fingerprintAttempts: number;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  adBlocking: true,
  trackerProtection: true,
  httpsEverywhere: true,
  fingerprintProtection: true,
  cookiePolicy: 'block_third_party',
};

export const INITIAL_STATS: PrivacyStats = {
  adsBlocked: 0,
  trackersBlocked: 0,
  httpsUpgrades: 0,
  fingerprintAttempts: 0,
};

// ~40 common ad CSS selectors
const AD_SELECTORS = [
  '.ad', '.ads', '.advert', '.advertisement',
  '[class*="ad-banner"]', '[class*="ad-container"]', '[class*="ad-wrapper"]',
  '[id*="google_ads"]', '[id*="ad-slot"]', '[id*="ad_slot"]',
  '[id*="advert"]', '[id*="ad-container"]',
  'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
  'iframe[src*="adservice"]', 'iframe[src*="ads."]',
  '[class*="sponsored"]', '[data-ad]', '[data-ads]', '[data-adunit]',
  '.ad-unit', '.ad-slot', '.ad-zone', '.ad-block',
  '.dfp-ad', '.gpt-ad', '.adsbox', '.ad-placeholder',
  '[id*="taboola"]', '[id*="outbrain"]', '[class*="taboola"]', '[class*="outbrain"]',
  '.native-ad', '.promoted-content', '.sponsored-content',
  '[class*="AdSlot"]', '[class*="adSlot"]',
  'ins.adsbygoogle', '[id*="carbonads"]',
  '[class*="ad-leaderboard"]', '[class*="ad-sidebar"]',
  'div[aria-label="advertisement"]', 'aside[role="advertisement"]',
  '[class*="banner-ad"]', '[class*="bannerAd"]',
];

// Known ad domains
const AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'google-analytics.com', 'adservice.google.com', 'pagead2.googlesyndication.com',
  'ads.yahoo.com', 'ad.doubleclick.net', 'adnxs.com', 'adsrvr.org',
  'advertising.com', 'taboola.com', 'outbrain.com', 'criteo.com',
  'moatads.com', 'amazon-adsystem.com', 'adsymptotic.com',
  'adcolony.com', 'mopub.com', 'unity3d.com/ads',
];

// Known tracking domains/scripts
const TRACKER_DOMAINS = [
  'facebook.com/tr', 'connect.facebook.net', 'pixel.facebook.com',
  'analytics.twitter.com', 'bat.bing.com', 'snap.licdn.com',
  'hotjar.com', 'fullstory.com', 'clarity.ms', 'mouseflow.com',
  'mixpanel.com', 'segment.io', 'segment.com', 'amplitude.com',
  'heapanalytics.com', 'crazyegg.com', 'optimizely.com',
  'newrelic.com', 'sentry.io', 'bugsnag.com',
];

// Upgrade HTTP to HTTPS
export function upgradeToHttps(url: string): { url: string; upgraded: boolean } {
  if (url.startsWith('http://')) {
    return { url: url.replace('http://', 'https://'), upgraded: true };
  }
  return { url, upgraded: false };
}

// Generate ad-blocking JavaScript for injection into WebView
export function getAdBlockScript(enabled: boolean): string {
  if (!enabled) return '';
  const selectorsJson = JSON.stringify(AD_SELECTORS);
  return `
(function() {
  var NEO_AD_SELECTORS = ${selectorsJson};
  var neoAdsBlocked = 0;

  function removeAds() {
    NEO_AD_SELECTORS.forEach(function(sel) {
      try {
        var els = document.querySelectorAll(sel);
        els.forEach(function(el) {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
            neoAdsBlocked++;
          }
        });
      } catch(e) {}
    });
    if (neoAdsBlocked > 0 && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'privacyStats',
        adsBlocked: neoAdsBlocked
      }));
    }
  }

  removeAds();

  var observer = new MutationObserver(function(mutations) {
    var shouldCheck = false;
    mutations.forEach(function(m) {
      if (m.addedNodes.length > 0) shouldCheck = true;
    });
    if (shouldCheck) removeAds();
  });
  observer.observe(document.body || document.documentElement, {
    childList: true, subtree: true
  });
})();
`;
}

// Generate tracker-blocking JavaScript
export function getTrackerBlockScript(enabled: boolean): string {
  if (!enabled) return '';
  const domainsJson = JSON.stringify(TRACKER_DOMAINS);
  return `
(function() {
  var NEO_TRACKER_DOMAINS = ${domainsJson};
  var neoTrackersBlocked = 0;

  // Block tracking scripts
  var scripts = document.querySelectorAll('script[src]');
  scripts.forEach(function(s) {
    var src = s.getAttribute('src') || '';
    NEO_TRACKER_DOMAINS.forEach(function(domain) {
      if (src.indexOf(domain) !== -1 && s.parentNode) {
        s.parentNode.removeChild(s);
        neoTrackersBlocked++;
      }
    });
  });

  // Block tracking pixels/images
  var imgs = document.querySelectorAll('img[src]');
  imgs.forEach(function(img) {
    var src = img.getAttribute('src') || '';
    NEO_TRACKER_DOMAINS.forEach(function(domain) {
      if (src.indexOf(domain) !== -1 && img.parentNode) {
        img.parentNode.removeChild(img);
        neoTrackersBlocked++;
      }
    });
  });

  if (neoTrackersBlocked > 0 && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'privacyStats',
      trackersBlocked: neoTrackersBlocked
    }));
  }
})();
`;
}

// Generate fingerprint protection JavaScript
export function getFingerprintProtectionScript(enabled: boolean): string {
  if (!enabled) return '';
  return `
(function() {
  var neoFingerprintAttempts = 0;

  // Randomize canvas fingerprinting
  var origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function() {
    neoFingerprintAttempts++;
    var ctx = this.getContext('2d');
    if (ctx) {
      var imageData = ctx.getImageData(0, 0, this.width, this.height);
      for (var i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = imageData.data[i] ^ (Math.random() > 0.5 ? 1 : 0);
      }
      ctx.putImageData(imageData, 0, 0);
    }
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'privacyStats',
        fingerprintAttempts: neoFingerprintAttempts
      }));
    }
    return origToDataURL.apply(this, arguments);
  };

  // Randomize WebGL fingerprinting
  var getParam = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    if (param === 37445) return 'Neo Browser GPU';
    if (param === 37446) return 'Neo Browser Renderer';
    return getParam.apply(this, arguments);
  };
})();
`;
}

// Generate cookie control JavaScript
export function getCookieControlScript(policy: CookiePolicy): string {
  if (policy === 'allow_all') return '';
  if (policy === 'block_all') {
    return `
(function() {
  Object.defineProperty(document, 'cookie', {
    get: function() { return ''; },
    set: function() { return ''; }
  });
})();
`;
  }
  // block_third_party - only block cookies from different origins
  return `
(function() {
  var origCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                       Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
  if (origCookieDesc) {
    Object.defineProperty(document, 'cookie', {
      get: function() { return origCookieDesc.get.call(this); },
      set: function(val) {
        if (val.indexOf('domain=') !== -1) {
          var domain = val.match(/domain=([^;]+)/);
          if (domain && window.location.hostname.indexOf(domain[1].trim().replace(/^\./, '')) === -1) {
            return '';
          }
        }
        return origCookieDesc.set.call(this, val);
      }
    });
  }
})();
`;
}

// Combine all privacy scripts into one injectable string
export function getPrivacyInjectionScript(settings: PrivacySettings): string {
  return [
    getAdBlockScript(settings.adBlocking),
    getTrackerBlockScript(settings.trackerProtection),
    getFingerprintProtectionScript(settings.fingerprintProtection),
    getCookieControlScript(settings.cookiePolicy),
  ].filter(Boolean).join('\n');
}

// Check if a URL should be blocked (ad/tracker domain)
export function shouldBlockUrl(url: string, settings: PrivacySettings): { blocked: boolean; reason?: string } {
  if (!settings.adBlocking && !settings.trackerProtection) return { blocked: false };

  const lowerUrl = url.toLowerCase();

  if (settings.adBlocking) {
    for (const domain of AD_DOMAINS) {
      if (lowerUrl.includes(domain)) {
        return { blocked: true, reason: 'ad' };
      }
    }
  }

  if (settings.trackerProtection) {
    for (const domain of TRACKER_DOMAINS) {
      if (lowerUrl.includes(domain)) {
        return { blocked: true, reason: 'tracker' };
      }
    }
  }

  return { blocked: false };
}
