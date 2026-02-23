import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// WebView only works on native - use iframe on web
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { URLBar } from '../components/URLBar';
import { AIPanel, ChatMessage } from '../components/AIPanel';
import { TabBar, Tab, getTabColor, Space, DEFAULT_SPACES } from '../components/TabBar';
import { HomePage } from '../components/HomePage';
import { BuilderPanel } from '../components/BuilderPanel';
import { SettingsModal, API_KEY_STORAGE, HISTORY_STORAGE, HistoryEntry } from '../components/SettingsModal';
import { PrivacyShieldPanel } from '../components/PrivacyShieldPanel';
import { VPNPanel, VPNServer, VPNStatus, VPN_SERVERS } from '../components/VPNPanel';
import { sendToGemini, sendToGeminiStreaming, queryGemini, GeminiMessage, BrowserAction, AIMode } from '../services/gemini';
import { buildApp } from '../services/builder';
import { searchWithAI } from '../services/search';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  PrivacySettings,
  PrivacyStats,
  CookiePolicy,
  DEFAULT_PRIVACY_SETTINGS,
  INITIAL_STATS,
  getPrivacyInjectionScript,
  upgradeToHttps,
  shouldBlockUrl,
} from '../services/privacy';
import { colors, darkColors, shadows, spacing, radius, typography } from '../theme';

const HOME_URL = 'neo://home';
const SEARCH_URL = 'https://www.google.com/search?q=';
const MAX_AGENT_STEPS = 15;

// YouTube embed support - extract video ID and convert to embeddable URL
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

// Build a YouTube search results page as a data URI
function buildYouTubeSearchPage(query: string, videos: { id: string; title: string; channel: string }[]): string {
  const videoCards = videos.map((v) => `
    <div style="display:flex;gap:16px;padding:16px;background:#fff;border-radius:12px;margin-bottom:12px;cursor:pointer;border:1px solid #e5e7eb;transition:all 0.2s" onclick="window.parent.postMessage(JSON.stringify({type:'youtubePlay',videoId:'${v.id}'}),'*')" onmouseover="this.style.borderColor='#ef4444';this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='#e5e7eb';this.style.transform='none'">
      <div style="position:relative;flex-shrink:0;width:200px;height:112px;border-radius:8px;overflow:hidden;background:#000">
        <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover" />
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;background:rgba(255,0,0,0.9);border-radius:8px;display:flex;align-items:center;justify-content:center">
          <div style="width:0;height:0;border-left:14px solid white;border-top:8px solid transparent;border-bottom:8px solid transparent;margin-left:3px"></div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:4px;line-height:1.3">${v.title}</div>
        <div style="font-size:13px;color:#6b7280">${v.channel}</div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f9fafb;padding:24px}</style></head>
<body>
<div style="max-width:720px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.5 6.5a3 3 0 00-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 00.5 6.5S0 8.7 0 11v2c0 2.3.5 4.5.5 4.5a3 3 0 002.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 002.1-2.1s.5-2.2.5-4.5v-2c0-2.3-.5-4.5-.5-4.5z"/><path d="M9.75 15.02l6.28-3.52-6.28-3.52v7.04z" fill="#fff"/></svg>
    <span style="font-size:18px;font-weight:700;color:#1a1a2e">YouTube Results for "${query}"</span>
  </div>
  ${videoCards}
  <div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">Click a video to play in NeoBrowser</div>
</div>
</body></html>`;
}

// Build a YouTube player page as a data URI
function buildYouTubePlayerPage(videoId: string, title?: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style></head>
<body>
<div style="width:100%;max-width:960px;aspect-ratio:16/9">
  <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" style="width:100%;height:100%;border:none;border-radius:8px" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
</div>
</body></html>`;
}

function isHomePage(url: string) {
  return url === HOME_URL || url === '';
}

function createTab(index: number, spaceId?: string): Tab {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: 'New Tab',
    url: HOME_URL,
    color: getTabColor(index),
    spaceId,
  };
}

export function BrowserScreen() {
  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([createTab(0, 'personal')]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  // Workspace / Spaces state
  const [spaces] = useState<Space[]>(DEFAULT_SPACES);
  const [activeSpaceId, setActiveSpaceId] = useState('personal');

  // WebView state
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef<any>(null);

  // Refs to avoid stale closures in the agent loop
  const currentUrlRef = useRef(currentUrl);
  currentUrlRef.current = currentUrl;
  const webViewUrlRef = useRef(webViewUrl);
  webViewUrlRef.current = webViewUrl;

  // Web navigation history (for web platform since iframes don't track this)
  const navHistoryRef = useRef<string[]>([HOME_URL]);
  const navIndexRef = useRef(0);

  // AI state
  const [aiVisible, setAiVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<GeminiMessage[]>([]);

  // Agent state
  const [agentRunning, setAgentRunning] = useState(false);
  const agentAbortRef = useRef(false);

  // Settings
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Subscription context
  const { isPro, isBYOK, mode, apiKey, setApiKey: setSubscriptionApiKey, requireProOrBYOK, openPaywall } = useSubscription();
  const aiMode: AIMode = isPro ? 'pro' : 'byok';

  // Search state (for AI search loading)
  const [searchLoading, setSearchLoading] = useState(false);

  // Builder state
  const [builderVisible, setBuilderVisible] = useState(false);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [buildStage, setBuildStage] = useState('planning');

  // Privacy state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats>(INITIAL_STATS);
  const [privacyPanelVisible, setPrivacyPanelVisible] = useState(false);

  // VPN state
  const [vpnStatus, setVpnStatus] = useState<VPNStatus>('disconnected');
  const [vpnServer, setVpnServer] = useState<VPNServer>(VPN_SERVERS[0]);
  const [vpnPanelVisible, setVpnPanelVisible] = useState(false);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const [forceDarkPages, setForceDarkPages] = useState(false);

  // Split view state
  const [splitViewActive, setSplitViewActive] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [splitWebViewUrl, setSplitWebViewUrl] = useState('');

  // Reader mode state
  const [readerMode, setReaderMode] = useState(false);

  // Fab animation
  const fabScale = useRef(new Animated.Value(1)).current;

  // Full-screen browsing: auto-hide bars on scroll
  const barsAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const barsHidden = useRef(false);

  // Screen dimensions for split view
  const screenWidth = Dimensions.get('window').width;
  const canSplitView = screenWidth >= 768; // tablet/web only

  // Resolved color palette based on dark mode
  const c = darkMode ? darkColors : colors;

  // Load preferences
  useEffect(() => {
    // Load dark mode preference
    AsyncStorage.getItem('@neobrowser_dark_mode').then((val) => {
      if (val === 'true') setDarkMode(true);
    });
    AsyncStorage.getItem('@neobrowser_force_dark').then((val) => {
      if (val === 'true') setForceDarkPages(true);
    });
  }, []);

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    AsyncStorage.setItem('@neobrowser_dark_mode', next ? 'true' : 'false');
  };

  const handleToggleForceDarkPages = () => {
    const next = !forceDarkPages;
    setForceDarkPages(next);
    AsyncStorage.setItem('@neobrowser_force_dark', next ? 'true' : 'false');
  };

  const handleClearSiteData = () => {
    // Clear cookies, local storage, and cache for the current webview
    if (Platform.OS === 'web') {
      // For web, we can clear the iframe by reloading
      try { localStorage.clear(); } catch {}
    }
    if (webViewRef.current?.clearCache) {
      webViewRef.current.clearCache(true);
    }
    if (webViewRef.current?.clearFormData) {
      webViewRef.current.clearFormData();
    }
    // Clear history too
    AsyncStorage.setItem(HISTORY_STORAGE, '[]');
  };

  // Listen for YouTube video play messages from iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'scroll' && typeof data.scrollY === 'number') {
          handleWebViewScroll(data.scrollY);
        }
        if (data.type === 'youtubePlay' && data.videoId) {
          const embedUrl = getYouTubeEmbedUrl(data.videoId);
          const ytUrl = `https://www.youtube.com/watch?v=${data.videoId}`;
          setCurrentUrl(ytUrl);
          setWebViewUrl(embedUrl);
          const hist = navHistoryRef.current;
          const idx = navIndexRef.current;
          navHistoryRef.current = [...hist.slice(0, idx + 1), ytUrl];
          navIndexRef.current = navHistoryRef.current.length - 1;
          setCanGoBack(navIndexRef.current > 0);
          setCanGoForward(false);
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTabId ? { ...t, url: ytUrl, title: 'YouTube Video' } : t))
          );
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeTabId]);

  const showHomePage = isHomePage(currentUrl);

  // Full-screen scroll handler
  const handleWebViewScroll = (scrollY: number) => {
    const delta = scrollY - lastScrollY.current;
    const threshold = 10;
    if (delta > threshold && !barsHidden.current && scrollY > 60) {
      barsHidden.current = true;
      Animated.timing(barsAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else if (delta < -threshold && barsHidden.current) {
      barsHidden.current = false;
      Animated.timing(barsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    lastScrollY.current = scrollY;
  };

  const showBars = () => {
    if (barsHidden.current) {
      barsHidden.current = false;
      Animated.timing(barsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // History tracking
  const saveToHistory = async (url: string, title: string) => {
    if (isHomePage(url) || url.startsWith('data:') || url.startsWith('neo://')) return;
    try {
      const data = await AsyncStorage.getItem(HISTORY_STORAGE);
      const history: HistoryEntry[] = data ? JSON.parse(data) : [];
      history.unshift({ url, title: title || url, timestamp: Date.now() });
      // Keep last 200 entries
      await AsyncStorage.setItem(HISTORY_STORAGE, JSON.stringify(history.slice(0, 200)));
    } catch {}
  };

  const shieldEnabled = privacySettings.adBlocking || privacySettings.trackerProtection ||
    privacySettings.httpsEverywhere || privacySettings.fingerprintProtection;
  const shieldCount = privacyStats.adsBlocked + privacyStats.trackersBlocked;

  // Privacy toggles
  const handleTogglePrivacy = (key: keyof PrivacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCookiePolicy = (policy: CookiePolicy) => {
    setPrivacySettings((prev) => ({
      ...prev,
      cookiePolicy: policy,
    }));
  };

  // VPN toggle
  const handleToggleVPN = () => {
    if (vpnStatus === 'disconnected') {
      setVpnStatus('connecting');
      // Simulate connection delay
      setTimeout(() => setVpnStatus('connected'), 1500);
    } else if (vpnStatus === 'connected') {
      setVpnStatus('disconnected');
    }
  };

  const handleSelectVpnServer = (server: VPNServer) => {
    const wasConnected = vpnStatus === 'connected';
    setVpnServer(server);
    if (wasConnected) {
      setVpnStatus('connecting');
      setTimeout(() => setVpnStatus('connected'), 1000);
    }
  };

  // Tab management
  const handleNewTab = () => {
    const newTab = createTab(tabs.length, activeSpaceId);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setCurrentUrl(HOME_URL);
    setWebViewUrl('');
    setChatMessages([]);
    setConversationHistory([]);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    // Close split if this tab is the split tab
    if (id === splitTabId) {
      setSplitViewActive(false);
      setSplitTabId(null);
      setSplitWebViewUrl('');
    }
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (id === activeTabId) {
      const nextTab = remaining[remaining.length - 1];
      setActiveTabId(nextTab.id);
      setCurrentUrl(nextTab.url);
      if (!isHomePage(nextTab.url)) setWebViewUrl(nextTab.url);
    }
  };

  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      setCurrentUrl(tab.url);
      if (!isHomePage(tab.url)) setWebViewUrl(tab.url);
    }
  };

  const handleSelectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    // Switch to first tab in the new space, or create one
    const spaceTabs = tabs.filter((t) => t.spaceId === spaceId || !t.spaceId);
    if (spaceTabs.length > 0) {
      handleSelectTab(spaceTabs[0].id);
    } else {
      handleNewTab();
    }
  };

  // Split view
  const handleOpenSplitView = (tabId: string) => {
    if (!canSplitView) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isHomePage(tab.url)) {
      setSplitViewActive(true);
      setSplitTabId(tabId);
      setSplitWebViewUrl(tab.url);
    }
  };

  const handleCloseSplitView = () => {
    setSplitViewActive(false);
    setSplitTabId(null);
    setSplitWebViewUrl('');
  };

  // Navigation with HTTPS upgrade
  const handleNavigate = (url: string) => {
    let finalUrl = url;

    // Detect search queries (no dots, not a protocol)
    const isSearchQuery = !finalUrl.includes('.') && !finalUrl.startsWith('http') && !finalUrl.startsWith('neo://') && !finalUrl.startsWith('data:');

    if (isSearchQuery) {
      if (Platform.OS === 'web') {
        performAISearch(finalUrl);
        return;
      }
      finalUrl = `${SEARCH_URL}${encodeURIComponent(finalUrl)}`;
    } else if (!finalUrl.startsWith('http') && !finalUrl.startsWith('neo://') && !finalUrl.startsWith('data:')) {
      finalUrl = `https://${finalUrl}`;
    }

    // HTTPS upgrade
    if (privacySettings.httpsEverywhere) {
      const { url: upgradedUrl, upgraded } = upgradeToHttps(finalUrl);
      if (upgraded) {
        finalUrl = upgradedUrl;
        setPrivacyStats((prev) => ({ ...prev, httpsUpgrades: prev.httpsUpgrades + 1 }));
      }
    }

    // Check for blocked URLs (ad/tracker domains)
    const blockResult = shouldBlockUrl(finalUrl, privacySettings);
    if (blockResult.blocked) {
      if (blockResult.reason === 'ad') {
        setPrivacyStats((prev) => ({ ...prev, adsBlocked: prev.adsBlocked + 1 }));
      } else {
        setPrivacyStats((prev) => ({ ...prev, trackersBlocked: prev.trackersBlocked + 1 }));
      }
      return; // Don't navigate to blocked URL
    }

    // On web, handle YouTube URLs specially (embed player), others open in new tab
    if (Platform.OS === 'web' && !isHomePage(finalUrl) && !finalUrl.startsWith('data:') && !finalUrl.startsWith('neo://')) {
      if (isYouTubeUrl(finalUrl)) {
        const videoId = getYouTubeVideoId(finalUrl);
        if (videoId) {
          const embedUrl = getYouTubeEmbedUrl(videoId);
          setCurrentUrl(finalUrl);
          setWebViewUrl(embedUrl);
          if (Platform.OS === 'web') {
            const hist = navHistoryRef.current;
            const idx = navIndexRef.current;
            navHistoryRef.current = [...hist.slice(0, idx + 1), finalUrl];
            navIndexRef.current = navHistoryRef.current.length - 1;
            setCanGoBack(navIndexRef.current > 0);
            setCanGoForward(false);
          }
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTabId ? { ...t, url: finalUrl, title: 'YouTube Video' } : t))
          );
          setLoading(false);
          return;
        }
        // YouTube homepage (no video ID) — show trending videos
        performYouTubeSearch('trending popular videos 2025');
        return;
      }
      // Non-YouTube external URLs open in new tab
      window.open(finalUrl, '_blank');
      return;
    }

    setCurrentUrl(finalUrl);
    if (!isHomePage(finalUrl)) {
      setWebViewUrl(finalUrl);
    }
    // Push to web nav history
    if (Platform.OS === 'web') {
      const hist = navHistoryRef.current;
      const idx = navIndexRef.current;
      navHistoryRef.current = [...hist.slice(0, idx + 1), finalUrl];
      navIndexRef.current = navHistoryRef.current.length - 1;
      setCanGoBack(navIndexRef.current > 0);
      setCanGoForward(false);
    }
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: finalUrl } : t))
    );
    saveToHistory(finalUrl, finalUrl);
    showBars();
  };

  // AI-powered search: generates results as data URI
  const performAISearch = async (query: string) => {
    if (!requireProOrBYOK()) return;
    setSearchLoading(true);
    setLoading(true);
    try {
      const result = await searchWithAI(apiKey, query, aiMode);
      const htmlDataUri = `data:text/html;charset=utf-8,${encodeURIComponent(result.html)}`;
      const searchUrl = `neo://search?q=${encodeURIComponent(query)}`;
      setCurrentUrl(searchUrl);
      setWebViewUrl(htmlDataUri);
      if (Platform.OS === 'web') {
        const hist = navHistoryRef.current;
        const idx = navIndexRef.current;
        navHistoryRef.current = [...hist.slice(0, idx + 1), searchUrl];
        navIndexRef.current = navHistoryRef.current.length - 1;
        setCanGoBack(navIndexRef.current > 0);
        setCanGoForward(false);
      }
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: searchUrl, title: result.title }
            : t
        )
      );
    } catch (error: any) {
      console.error('AI Search error:', error);
    }
    setSearchLoading(false);
    setLoading(false);
  };

  // YouTube search: uses Gemini to suggest videos, displays embeddable results
  const performYouTubeSearch = async (query: string) => {
    if (!requireProOrBYOK()) return;
    setSearchLoading(true);
    setLoading(true);
    try {
      const prompt = `I want to watch YouTube videos about: "${query}". Give me 6 real, popular YouTube videos. Respond ONLY with a JSON array, nothing else. Format: [{"id":"dQw4w9WgXcQ","title":"Video Title","channel":"Channel Name"}]. The id must be a real 11-character YouTube video ID. Focus on well-known, popular videos that actually exist on YouTube.`;
      const rawText = await queryGemini(apiKey, prompt, aiMode);
      let videos: { id: string; title: string; channel: string }[] = [];
      try {
        const cleaned = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        // Find the JSON array in the response
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          videos = JSON.parse(arrMatch[0]);
          // Filter out any entries with missing fields
          videos = videos.filter(v => v.id && v.title && v.channel);
        }
      } catch {}
      if (videos.length === 0) {
        // Fallback with well-known video IDs
        videos = [
          { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', channel: 'Rick Astley' },
          { id: 'jNQXAC9IVRw', title: 'Me at the zoo', channel: 'jawed' },
          { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', channel: 'officialpsy' },
        ];
      }
      const html = buildYouTubeSearchPage(query, videos);
      const htmlDataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      const ytSearchUrl = `neo://youtube?q=${encodeURIComponent(query)}`;
      setCurrentUrl(ytSearchUrl);
      setWebViewUrl(htmlDataUri);
      if (Platform.OS === 'web') {
        const hist = navHistoryRef.current;
        const idx = navIndexRef.current;
        navHistoryRef.current = [...hist.slice(0, idx + 1), ytSearchUrl];
        navIndexRef.current = navHistoryRef.current.length - 1;
        setCanGoBack(navIndexRef.current > 0);
        setCanGoForward(false);
      }
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: ytSearchUrl, title: `YouTube: ${query}` }
            : t
        )
      );
    } catch (error: any) {
      console.error('YouTube Search error:', error);
    }
    setSearchLoading(false);
    setLoading(false);
  };

  const handleHomeSearch = (query: string) => {
    if (Platform.OS === 'web') {
      // Detect YouTube-related queries
      const lq = query.toLowerCase();
      if (lq.includes('youtube') || lq.startsWith('watch ') || lq.startsWith('play ') || lq.includes('video of ') || lq.includes('music video')) {
        const cleanQuery = query.replace(/youtube/gi, '').replace(/^(watch|play)\s+/i, '').trim();
        performYouTubeSearch(cleanQuery || query);
      } else {
        performAISearch(query);
      }
    } else {
      handleNavigate(`${SEARCH_URL}${encodeURIComponent(query)}`);
    }
  };

  // Home page actions
  const handleSearchAI = (query: string) => {
    setAiVisible(true);
    setTimeout(() => runAgentLoop(query), 300);
  };

  const handleCreateAI = (query: string) => {
    setBuilderVisible(true);
    setTimeout(() => handleBuild(query), 300);
  };

  const goHome = () => {
    setCurrentUrl(HOME_URL);
    setWebViewUrl('');
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, url: HOME_URL, title: 'New Tab' } : t
      )
    );
  };

  const handleRefresh = () => {
    if (Platform.OS === 'web' && currentUrl.startsWith('neo://search')) {
      try {
        const q = new URLSearchParams(currentUrl.split('?')[1]).get('q');
        if (q) performAISearch(q);
      } catch {}
    } else {
      webViewRef.current?.reload();
    }
  };

  const navigateToHistoryEntry = (url: string) => {
    setCurrentUrl(url);
    if (isHomePage(url)) {
      setWebViewUrl('');
    }
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
    );
    setCanGoBack(navIndexRef.current > 0);
    setCanGoForward(navIndexRef.current < navHistoryRef.current.length - 1);
  };

  const handleGoBack = () => {
    if (Platform.OS === 'web') {
      if (navIndexRef.current > 0) {
        navIndexRef.current -= 1;
        const prevUrl = navHistoryRef.current[navIndexRef.current];
        navigateToHistoryEntry(prevUrl);
      }
    } else if (canGoBack) {
      webViewRef.current?.goBack();
    } else if (!isHomePage(currentUrl)) {
      goHome();
    }
  };

  const handleGoForward = () => {
    if (Platform.OS === 'web') {
      if (navIndexRef.current < navHistoryRef.current.length - 1) {
        navIndexRef.current += 1;
        const nextUrl = navHistoryRef.current[navIndexRef.current];
        navigateToHistoryEntry(nextUrl);
      }
    } else {
      webViewRef.current?.goForward();
    }
  };

  // Rich page context extraction
  const pageContextResolverRef = useRef<((ctx: string) => void) | null>(null);

  const getPageContext = (): Promise<string> => {
    return new Promise((resolve) => {
      const liveUrl = currentUrlRef.current;
      const liveWebViewUrl = webViewUrlRef.current;

      if (Platform.OS === 'web') {
        if (liveUrl.startsWith('neo://search')) {
          try {
            const iframe = document.querySelector('iframe') as HTMLIFrameElement;
            if (iframe?.contentDocument) {
              const text = iframe.contentDocument.body?.innerText?.slice(0, 3000) || '';
              const title = iframe.contentDocument.title || '';
              resolve(`[AI SEARCH RESULTS PAGE]\nTitle: ${title}\nURL: ${liveUrl}\nContent:\n${text}\n\nYou can use "search" action to search again, or set "done": true to give your final answer.`);
              return;
            }
          } catch {}
          resolve(`[AI SEARCH RESULTS] Page loaded at ${liveUrl}. Use "search" to refine, or set "done": true to answer.`);
        } else if (liveWebViewUrl.startsWith('data:')) {
          resolve(`[GENERATED APP] A generated web app is loaded. Set "done": true and answer the user.`);
        } else {
          resolve('[WEB PLATFORM] Answer the user\'s question directly from your knowledge. You can use "search" action to search the web. Always set "done": true when you have the answer.');
        }
        return;
      }
      if (isHomePage(liveUrl)) {
        resolve('User is on the NeoBrowser home page. No web content loaded.');
        return;
      }
      webViewRef.current?.injectJavaScript(`
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pageContext',
          data: (function() {
            var title = document.title;
            var url = window.location.href;
            var meta = (document.querySelector('meta[name="description"]') || {}).content || '';

            var interactive = [];
            var els = document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [onclick]');
            for (var i = 0; i < Math.min(els.length, 50); i++) {
              var el = els[i];
              var tag = el.tagName.toLowerCase();
              var rect = el.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) continue;
              if (rect.top > window.innerHeight * 2) continue;

              var selector = '';
              if (el.id) {
                selector = '#' + el.id;
              } else if (el.name) {
                selector = tag + '[name="' + el.name + '"]';
              } else if (el.className && typeof el.className === 'string') {
                var cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
                if (cls) selector = tag + '.' + cls;
              }
              if (!selector) {
                selector = tag + ':nth-of-type(' + (Array.from(el.parentElement ? el.parentElement.children : []).filter(function(c){return c.tagName===el.tagName}).indexOf(el) + 1) + ')';
              }

              var info = { tag: tag, selector: selector };
              if (tag === 'a') info.text = (el.textContent || '').trim().slice(0, 60);
              if (tag === 'a') info.href = el.getAttribute('href') || '';
              if (tag === 'button' || el.getAttribute('role') === 'button') info.text = (el.textContent || '').trim().slice(0, 60);
              if (tag === 'input') {
                info.type = el.type || 'text';
                info.placeholder = el.placeholder || '';
                info.value = el.value || '';
              }
              if (tag === 'select') info.text = 'Select: ' + (el.options && el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '');
              if (tag === 'textarea') {
                info.placeholder = el.placeholder || '';
                info.value = (el.value || '').slice(0, 100);
              }
              interactive.push(info);
            }

            var text = document.body ? document.body.innerText.slice(0, 2000) : '';
            return JSON.stringify({ title: title, url: url, meta: meta, interactive: interactive, text: text });
          })()
        }));
        true;
      `);
      pageContextResolverRef.current = resolve;
      setTimeout(() => {
        if (pageContextResolverRef.current === resolve) {
          pageContextResolverRef.current = null;
          resolve(`Page: ${currentUrlRef.current}`);
        }
      }, 3000);
    });
  };

  const waitForPage = (ms: number = 1500): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const executeAction = async (action: BrowserAction): Promise<string> => {
    switch (action.type) {
      case 'navigate':
        if (action.value) {
          handleNavigate(action.value);
          await waitForPage(2000);
        }
        return action.description || `Navigating to ${action.value}`;
      case 'search':
        if (action.value) {
          if (Platform.OS === 'web') {
            await performAISearch(action.value);
          } else {
            handleNavigate(`${SEARCH_URL}${encodeURIComponent(action.value)}`);
          }
          await waitForPage(2000);
        }
        return action.description || `Searching: ${action.value}`;
      case 'click':
        if (action.target) {
          webViewRef.current?.injectJavaScript(`
            (function() {
              var el = document.querySelector('${action.target.replace(/'/g, "\\'")}');
              if (el) el.click();
            })();
            true;
          `);
          await waitForPage(1500);
        }
        return action.description || `Clicking ${action.target}`;
      case 'type':
        if (action.target && action.value) {
          const safeTarget = action.target.replace(/'/g, "\\'");
          const safeValue = action.value.replace(/'/g, "\\'");
          webViewRef.current?.injectJavaScript(`
            (function() {
              var el = document.querySelector('${safeTarget}');
              if (el) {
                el.focus();
                el.value = '${safeValue}';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            })();
            true;
          `);
          await waitForPage(500);
        }
        return action.description || `Typing in ${action.target}`;
      case 'scroll':
        webViewRef.current?.injectJavaScript(`
          window.scrollBy(0, ${action.value === 'up' ? -500 : 500});
          true;
        `);
        await waitForPage(500);
        return action.description || `Scrolling ${action.value || 'down'}`;
      case 'wait':
        await waitForPage(parseInt(action.value || '1000', 10));
        return action.description || 'Waiting for page...';
      default:
        return action.description || action.type;
    }
  };

  // Agent loop
  const runAgentLoop = async (userText: string) => {
    if (!requireProOrBYOK()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);
    setAgentRunning(true);
    agentAbortRef.current = false;

    let history: GeminiMessage[] = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: userText }] },
    ];

    try {
      for (let step = 0; step < MAX_AGENT_STEPS; step++) {
        if (agentAbortRef.current) {
          const stopMsg: ChatMessage = {
            id: Date.now().toString() + '_stop',
            role: 'ai',
            text: 'Agent stopped.',
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, stopMsg]);
          break;
        }

        const pageContext = await getPageContext();

        // Use streaming to show the response as it comes in
        const streamMsgId = Date.now().toString() + '_stream' + step;
        let streamingStarted = false;

        const response = await sendToGeminiStreaming(apiKey, history, pageContext, (partialText) => {
          // Create or update a streaming message as chunks arrive
          if (!streamingStarted) {
            streamingStarted = true;
            const streamMsg: ChatMessage = {
              id: streamMsgId,
              role: 'ai',
              text: partialText,
              timestamp: Date.now(),
            };
            setChatMessages((prev) => [...prev, streamMsg]);
          } else {
            setChatMessages((prev) =>
              prev.map((m) => m.id === streamMsgId ? { ...m, text: partialText } : m)
            );
          }
        }, aiMode);

        if (Platform.OS === 'web' && response.actions) {
          response.actions = response.actions.filter(
            (a) => a.type === 'search'
          );
          if (response.actions.length === 0) {
            response.actions = undefined;
            response.done = true;
          }
        }

        // Remove the streaming placeholder if we're going to show structured messages
        if (streamingStarted) {
          setChatMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
        }

        if (response.thought && !response.done) {
          const stepMsg: ChatMessage = {
            id: Date.now().toString() + '_step' + step,
            role: 'ai',
            text: response.thought,
            isStep: true,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, stepMsg]);
        }

        if (response.actions && response.actions.length > 0 && !response.done) {
          for (const action of response.actions) {
            if (agentAbortRef.current) break;
            const desc = await executeAction(action);

            const actionMsg: ChatMessage = {
              id: Date.now().toString() + '_action' + step,
              role: 'ai',
              text: desc,
              isStep: true,
              actions: [action],
              timestamp: Date.now(),
            };
            setChatMessages((prev) => [...prev, actionMsg]);
          }
        }

        history = [
          ...history,
          { role: 'model', parts: [{ text: response.text }] },
        ];

        if (response.done) {
          const finalMsg: ChatMessage = {
            id: Date.now().toString() + '_final',
            role: 'ai',
            text: response.text,
            actions: response.actions,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev, finalMsg]);
          break;
        }

        history = [
          ...history,
          { role: 'user', parts: [{ text: '[Observation: Action executed. Provide updated page state on next call.]' }] },
        ];
      }
    } catch (error: any) {
      const errMsg: ChatMessage = {
        id: Date.now().toString() + '_err',
        role: 'ai',
        text: `Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    }

    setConversationHistory(history);
    setAiLoading(false);
    setAgentRunning(false);
  };

  const handleStopAgent = () => {
    agentAbortRef.current = true;
  };

  // Builder
  const handleBuild = async (prompt: string) => {
    if (!requireProOrBYOK()) return;

    setBuilderLoading(true);
    setBuildStage('planning');

    const stageTimer1 = setTimeout(() => setBuildStage('building'), 2000);
    const stageTimer2 = setTimeout(() => setBuildStage('styling'), 5000);
    const stageTimer3 = setTimeout(() => setBuildStage('testing'), 8000);

    try {
      const result = await buildApp(apiKey, prompt, aiMode);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const htmlDataUri = `data:text/html;charset=utf-8,${encodeURIComponent(result.html)}`;
      const newTab = createTab(tabs.length, activeSpaceId);
      newTab.title = result.title;
      newTab.url = htmlDataUri;
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setCurrentUrl(htmlDataUri);
      setWebViewUrl(htmlDataUri);
      setBuilderVisible(false);
    } catch (error: any) {
      // Keep panel open so user can retry
    }

    setBuilderLoading(false);
    setBuildStage('planning');
  };

  const handleFabPress = () => {
    // If closing the panel, always allow
    if (aiVisible) {
      setAiVisible(false);
      return;
    }
    // Opening: require Pro or BYOK
    if (!requireProOrBYOK()) return;
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.85,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();
    setAiVisible(true);
    showBars();
  };

  // Handle messages from injected privacy scripts
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pageContext' && pageContextResolverRef.current) {
        pageContextResolverRef.current(data.data);
        pageContextResolverRef.current = null;
      }
      if (data.type === 'privacyStats') {
        setPrivacyStats((prev) => ({
          adsBlocked: prev.adsBlocked + (data.adsBlocked || 0),
          trackersBlocked: prev.trackersBlocked + (data.trackersBlocked || 0),
          httpsUpgrades: prev.httpsUpgrades + (data.httpsUpgrades || 0),
          fingerprintAttempts: prev.fingerprintAttempts + (data.fingerprintAttempts || 0),
        }));
      }
    } catch {}
  };

  // Generate privacy injection script + force-dark CSS
  const forceDarkCSS = forceDarkPages ? `
    (function() {
      var s = document.createElement('style');
      s.id = 'neo-force-dark';
      s.textContent = 'html { filter: invert(1) hue-rotate(180deg); } img, video, canvas, svg, [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }';
      document.head.appendChild(s);
    })();
  ` : '';
  const readerModeCSS = readerMode ? `
    (function() {
      var s = document.createElement('style');
      s.id = 'neo-reader-mode';
      s.textContent = \`
        body { max-width: 680px !important; margin: 0 auto !important; padding: 24px 16px !important;
               font-family: Georgia, 'Times New Roman', serif !important; font-size: 19px !important;
               line-height: 1.7 !important; color: #1a1a2e !important; background: #FFFDF7 !important; }
        nav, header, footer, aside, .sidebar, .ad, .advertisement, [class*="social"],
        [class*="share"], [class*="comment"], [class*="related"], [class*="nav"],
        [class*="menu"], [class*="banner"], [class*="popup"], [class*="modal"],
        [role="navigation"], [role="banner"], [role="complementary"] { display: none !important; }
        img { max-width: 100% !important; height: auto !important; border-radius: 8px !important; margin: 16px 0 !important; }
        a { color: #2563EB !important; }
        h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, sans-serif !important; color: #1a1a2e !important; line-height: 1.3 !important; }
        h1 { font-size: 28px !important; } h2 { font-size: 22px !important; } h3 { font-size: 18px !important; }
        pre, code { font-size: 14px !important; background: #f5f5f5 !important; padding: 2px 6px !important; border-radius: 4px !important; }
        pre code { display: block !important; padding: 16px !important; overflow-x: auto !important; }
      \`;
      document.head.appendChild(s);
    })();
  ` : '';
  // Free users get ad blocking disabled (ads shown)
  const effectivePrivacySettings = (isPro || isBYOK)
    ? privacySettings
    : { ...privacySettings, adBlocking: false };
  const privacyScript = (getPrivacyInjectionScript(effectivePrivacySettings) || '') + forceDarkCSS + readerModeCSS;

  // Render a WebView (used for both main and split)
  const renderWebView = (viewUrl: string, ref?: any, isSplit?: boolean) => {
    if (Platform.OS === 'web') {
      const isYTEmbed = viewUrl.includes('youtube.com/embed/');
      return (
        <iframe
          key={viewUrl}
          src={viewUrl}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%', ...(isYTEmbed ? { background: '#000' } : {}) } as any}
          onLoad={() => !isSplit && setLoading(false)}
          {...(isYTEmbed ? { allow: 'autoplay; encrypted-media; picture-in-picture', allowFullScreen: true } : {})}
        />
      );
    }
    if (!WebView) return null;
    return (
      <WebView
        ref={isSplit ? undefined : ref}
        source={{ uri: viewUrl }}
        style={styles.webView}
        injectedJavaScript={privacyScript || undefined}
        onNavigationStateChange={isSplit ? undefined : (state: any) => {
          setCurrentUrl(state.url);
          setCanGoBack(state.canGoBack);
          setCanGoForward(state.canGoForward);
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTabId
                ? { ...t, url: state.url, title: state.title || t.title }
                : t
            )
          );
        }}
        onLoadStart={isSplit ? undefined : () => setLoading(true)}
        onLoadEnd={isSplit ? undefined : () => setLoading(false)}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={isSplit ? undefined : (request: any) => {
          const blockResult = shouldBlockUrl(request.url, privacySettings);
          if (blockResult.blocked) {
            if (blockResult.reason === 'ad') {
              setPrivacyStats((prev) => ({ ...prev, adsBlocked: prev.adsBlocked + 1 }));
            } else {
              setPrivacyStats((prev) => ({ ...prev, trackersBlocked: prev.trackersBlocked + 1 }));
            }
            return false;
          }
          return true;
        }}
        allowsBackForwardNavigationGestures
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => <View />}
        onScroll={(event: any) => {
          if (!isSplit) {
            handleWebViewScroll(event.nativeEvent.contentOffset?.y || 0);
          }
        }}
        scrollEventThrottle={16}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && { backgroundColor: c.cream }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={c.cream} />

      {/* Tab Bar + URL Bar - animated for full-screen browsing */}
      {!showHomePage && (
        <Animated.View style={{
          opacity: barsAnim,
          maxHeight: barsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
          overflow: 'hidden',
          backgroundColor: darkMode ? c.cream : undefined,
        }}>
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onBuild={() => setBuilderVisible(true)}
            spaces={spaces}
            activeSpaceId={activeSpaceId}
            onSelectSpace={handleSelectSpace}
            darkMode={darkMode}
          />
          <URLBar
            url={currentUrl}
            onSubmit={handleNavigate}
            onRefresh={handleRefresh}
            canGoBack={canGoBack || !isHomePage(currentUrl)}
            canGoForward={canGoForward}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            loading={loading}
            shieldEnabled={shieldEnabled}
            shieldCount={shieldCount}
            onShieldPress={() => setPrivacyPanelVisible(true)}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {showHomePage ? (
          <HomePage
            onSearchGoogle={handleHomeSearch}
            onSearchAI={handleSearchAI}
            onCreateAI={handleCreateAI}
            onNavigate={handleNavigate}
            privacyStats={privacyStats}
            shieldEnabled={shieldEnabled}
            onShieldPress={() => setPrivacyPanelVisible(true)}
            darkMode={darkMode}
            onOpenSettings={() => setSettingsVisible(true)}
            onToggleDarkMode={handleToggleDarkMode}
          />
        ) : (
          <View style={styles.splitContainer}>
            {/* Main WebView */}
            <View style={[styles.webViewContainer, splitViewActive && styles.splitWebView]}>
              {webViewUrl ? renderWebView(webViewUrl, webViewRef) : null}
            </View>

            {/* Split View */}
            {splitViewActive && splitWebViewUrl && (
              <>
                <View style={styles.splitDivider}>
                  <TouchableOpacity onPress={handleCloseSplitView} style={styles.splitCloseBtn}>
                    <Ionicons name="close" size={12} color={colors.gray500} />
                  </TouchableOpacity>
                </View>
                <View style={styles.splitWebView}>
                  {renderWebView(splitWebViewUrl, null, true)}
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* Bottom bar - animated for full-screen browsing */}
      {!showHomePage && (
        <Animated.View style={[styles.toolbar, darkMode && { backgroundColor: c.white, borderTopColor: c.gray100 }, {
          opacity: barsAnim,
          maxHeight: barsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }),
          overflow: 'hidden',
        }]}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={() => { goHome(); showBars(); }}>
            <Ionicons name="home-outline" size={20} color={c.gray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => {
              setReaderMode(!readerMode);
              // For web, inject/remove reader mode CSS dynamically
              if (Platform.OS === 'web') {
                const iframe = document.querySelector('iframe');
                if (iframe?.contentDocument) {
                  const existing = iframe.contentDocument.getElementById('neo-reader-mode');
                  if (existing) {
                    existing.remove();
                  } else {
                    const s = iframe.contentDocument.createElement('style');
                    s.id = 'neo-reader-mode';
                    s.textContent = 'body{max-width:680px!important;margin:0 auto!important;padding:24px 16px!important;font-family:Georgia,serif!important;font-size:19px!important;line-height:1.7!important;color:#1a1a2e!important;background:#FFFDF7!important}nav,header,footer,aside,.sidebar,.ad,[class*=social],[class*=share],[class*=comment],[class*=related],[class*=nav],[class*=menu],[class*=banner],[role=navigation],[role=banner],[role=complementary]{display:none!important}img{max-width:100%!important;height:auto!important}';
                    iframe.contentDocument.head.appendChild(s);
                  }
                }
              }
              // For native, reload the page with the new injection script
              if (Platform.OS !== 'web' && webViewRef.current) {
                webViewRef.current.reload();
              }
            }}
          >
            <Ionicons
              name={readerMode ? 'book' : 'book-outline'}
              size={18}
              color={readerMode ? colors.blue : c.gray500}
            />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity
              style={[styles.fab, aiVisible && styles.fabActive]}
              onPress={handleFabPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={aiVisible ? 'close' : 'sparkles'}
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => {
              handleToggleDarkMode();
            }}
          >
            <Ionicons
              name={darkMode ? 'sunny' : 'moon-outline'}
              size={18}
              color={darkMode ? colors.shield : c.gray500}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => { setSettingsVisible(true); showBars(); }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={c.gray500} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* AI Panel */}
      <AIPanel
        visible={aiVisible}
        messages={chatMessages}
        onSend={runAgentLoop}
        onClose={() => setAiVisible(false)}
        loading={aiLoading}
        agentRunning={agentRunning}
        onStop={handleStopAgent}
        onActionTap={executeAction}
      />

      {/* Builder Panel */}
      <BuilderPanel
        visible={builderVisible}
        onClose={() => setBuilderVisible(false)}
        onBuild={handleBuild}
        loading={builderLoading}
        buildStage={buildStage}
      />

      {/* Privacy Shield Panel */}
      <PrivacyShieldPanel
        visible={privacyPanelVisible}
        onClose={() => setPrivacyPanelVisible(false)}
        settings={privacySettings}
        stats={privacyStats}
        onToggle={handleTogglePrivacy}
        onCookiePolicy={handleCookiePolicy}
      />

      {/* VPN Panel — hidden for v1 */}

      {/* Settings */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={(key: string) => setSubscriptionApiKey(key)}
        currentKey={apiKey}
        isPro={isPro}
        onOpenPaywall={() => {
          setSettingsVisible(false);
          setTimeout(() => openPaywall(), 300);
        }}
        privacySettings={privacySettings}
        onTogglePrivacy={handleTogglePrivacy}
        onCookiePolicy={handleCookiePolicy}
        onOpenPrivacy={() => {
          setSettingsVisible(false);
          setTimeout(() => setPrivacyPanelVisible(true), 300);
        }}
        onNavigate={(url) => {
          setSettingsVisible(false);
          handleNavigate(url);
        }}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        forceDarkPages={forceDarkPages}
        onToggleForceDarkPages={handleToggleForceDarkPages}
        onClearSiteData={handleClearSiteData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  splitWebView: {
    flex: 1,
  },
  splitDivider: {
    width: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCloseBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md + 4,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  fabActive: {
    backgroundColor: colors.blue,
  },
});
