import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, shadows, spacing, radius, typography } from '../theme';
import { PrivacyStats } from '../services/privacy';

const { width, height } = Dimensions.get('window');

interface HomePageProps {
  onSearchGoogle: (query: string) => void;
  onSearchAI: (query: string) => void;
  onCreateAI: (query: string) => void;
  onNavigate: (url: string) => void;
  privacyStats?: PrivacyStats;
  shieldEnabled?: boolean;
  onShieldPress?: () => void;
  vpnConnected?: boolean;
  darkMode?: boolean;
}

const SUGGESTIONS = [
  { label: 'YouTube', url: 'https://youtube.com', icon: 'logo-youtube', color: '#DC2626' },
  { label: 'GitHub', url: 'https://github.com', icon: 'logo-github', color: colors.gray800 },
  { label: 'Reddit', url: 'https://reddit.com', icon: 'chatbubbles', color: '#EA580C' },
  { label: 'Twitter', url: 'https://x.com', icon: 'logo-twitter', color: colors.gray800 },
  { label: 'HN', url: 'https://news.ycombinator.com', icon: 'newspaper', color: '#EA580C' },
  { label: 'Gmail', url: 'https://mail.google.com', icon: 'mail', color: '#DC2626' },
];

export function HomePage({
  onSearchGoogle,
  onSearchAI,
  onCreateAI,
  onNavigate,
  privacyStats,
  shieldEnabled,
  onShieldPress,
  vpnConnected,
  darkMode,
}: HomePageProps) {
  const c = darkMode ? darkColors : colors;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const inputSlide = useRef(new Animated.Value(20)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const card1 = useRef(new Animated.Value(0)).current;
  const card2 = useRef(new Animated.Value(0)).current;
  const card3 = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(inputSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const hasText = text.trim().length > 0;

  useEffect(() => {
    if (hasText) {
      card1.setValue(0);
      card2.setValue(0);
      card3.setValue(0);
      Animated.stagger(80, [
        Animated.spring(card1, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.spring(card2, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.spring(card3, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
      Animated.timing(cardsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cardsAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [hasText]);

  const handleSearchGoogle = () => {
    if (!text.trim()) return;
    onSearchGoogle(text.trim());
  };

  const handleSearchAI = () => {
    if (!text.trim()) return;
    onSearchAI(text.trim());
  };

  const handleCreateAI = () => {
    if (!text.trim()) return;
    onCreateAI(text.trim());
  };

  const makeCardStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  });

  const totalBlocked = privacyStats ? privacyStats.adsBlocked + privacyStats.trackersBlocked : 0;

  return (
    <View style={[styles.container, darkMode && { backgroundColor: c.cream }]}>
      {/* Decorative background elements */}
      <View style={[styles.bgCircle1, darkMode && { backgroundColor: c.blue + '08' }]} />
      <View style={[styles.bgCircle2, darkMode && { backgroundColor: c.indigo + '08' }]} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={[styles.hero, hasText && styles.heroCompact]}>
          <View style={styles.logoRow}>
            <Text style={[styles.logo, hasText && styles.logoCompact, darkMode && { color: c.gray800 }]}>neo</Text>
            <View style={[styles.logoDot, hasText && styles.logoDotCompact]} />
          </View>
          {!hasText && (
            <Text style={[styles.tagline, darkMode && { color: c.gray400 }]}>Search, browse, or build anything</Text>
          )}
        </View>

        {/* Privacy Status Card */}
        {!hasText && privacyStats && shieldEnabled && onShieldPress && (
          <TouchableOpacity style={[styles.privacyCard, darkMode && { backgroundColor: c.white, borderColor: c.shield + '20' }]} onPress={onShieldPress} activeOpacity={0.8}>
            <View style={styles.privacyCardLeft}>
              <View style={[styles.privacyIconBg, darkMode && { backgroundColor: c.shieldBg }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.shield} />
              </View>
              <View>
                <Text style={[styles.privacyCardTitle, darkMode && { color: c.gray800 }]}>Privacy Shield Active</Text>
                <Text style={[styles.privacyCardSub, darkMode && { color: c.gray400 }]}>
                  {totalBlocked} threats blocked · {privacyStats.httpsUpgrades} HTTPS upgrades
                </Text>
              </View>
            </View>
            {vpnConnected && (
              <View style={styles.vpnMiniPill}>
                <View style={styles.vpnMiniDot} />
                <Text style={styles.vpnMiniText}>VPN</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Main input */}
        <Animated.View style={{ transform: [{ translateY: inputSlide }], opacity: fadeAnim }}>
          <View style={[styles.inputArea, isFocused && styles.inputAreaFocused, darkMode && { backgroundColor: c.white, borderColor: c.gray100 }]}>
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, hasText && styles.inputIconActive, darkMode && !hasText && { backgroundColor: c.gray100 }]}>
                <Ionicons name="sparkles" size={15} color={hasText ? colors.white : c.gray300} />
              </View>
              <TextInput
                ref={inputRef}
                style={[styles.input, darkMode && { color: c.gray800 }]}
                value={text}
                onChangeText={setText}
                placeholder="Search, ask AI, or describe an app..."
                placeholderTextColor={c.gray400}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleSearchGoogle}
                returnKeyType="search"
                autoCapitalize="none"
                autoFocus
              />
              {hasText && (
                <TouchableOpacity onPress={() => setText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.gray300} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Action cards - staggered entrance when typing */}
        {hasText && (
          <View style={styles.actions}>
            <Animated.View style={makeCardStyle(card1)}>
              <TouchableOpacity style={[styles.actionCard, darkMode && { backgroundColor: c.white, borderColor: c.gray100 }]} onPress={handleSearchGoogle} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: darkMode ? c.blue + '20' : '#EFF6FF' }]}>
                  <Ionicons name="search" size={18} color={colors.blue} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, darkMode && { color: c.gray800 }]}>Search the web</Text>
                  <Text style={[styles.actionSub, darkMode && { color: c.gray400 }]} numberOfLines={1}>"{text.trim()}"</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={14} color={colors.gray300} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={makeCardStyle(card2)}>
              <TouchableOpacity style={[styles.actionCard, darkMode && { backgroundColor: c.white, borderColor: c.gray100 }]} onPress={handleSearchAI} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: darkMode ? c.indigo + '20' : '#EEF2FF' }]}>
                  <Ionicons name="sparkles" size={18} color={colors.indigo} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, darkMode && { color: c.gray800 }]}>Ask AI agent</Text>
                  <Text style={[styles.actionSub, darkMode && { color: c.gray400 }]} numberOfLines={1}>Browse & find answers for you</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={14} color={colors.gray300} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={makeCardStyle(card3)}>
              <TouchableOpacity style={[styles.actionCard, darkMode && { backgroundColor: c.white, borderColor: c.gray100 }]} onPress={handleCreateAI} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: darkMode ? c.claude + '20' : '#FFF7ED' }]}>
                  <Ionicons name="flash" size={18} color={colors.claude} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, darkMode && { color: c.gray800 }]}>Create with AI</Text>
                  <Text style={[styles.actionSub, darkMode && { color: c.gray400 }]} numberOfLines={1}>Build a web app from this idea</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={14} color={colors.gray300} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Quick sites - show when NOT typing */}
        {!hasText && (
          <View style={styles.sites}>
            <Text style={[styles.sitesLabel, darkMode && { color: c.gray400 }]}>Quick links</Text>
            <View style={styles.sitesGrid}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.siteChip, darkMode && { backgroundColor: c.white, borderColor: c.gray100 }]}
                  onPress={() => onNavigate(s.url)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.siteIconBg, { backgroundColor: s.color + '0C' }]}>
                    <Ionicons name={s.icon as any} size={16} color={s.color} />
                  </View>
                  <Text style={[styles.siteLabel, darkMode && { color: c.gray600 }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Powered by label */}
      <View style={styles.poweredBy}>
        <View style={styles.poweredDot} />
        <Text style={styles.poweredText}>Powered by Gemini</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  // Decorative background
  bgCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.blue + '06',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.indigo + '05',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: '18%',
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl + 4,
  },
  heroCompact: {
    marginBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.gray800,
    letterSpacing: -3,
  },
  logoCompact: {
    fontSize: 32,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
    marginBottom: 12,
    marginLeft: 2,
  },
  logoDotCompact: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: 7,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.gray400,
    marginTop: spacing.sm,
    letterSpacing: -0.2,
  },
  // Privacy card
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
    borderWidth: 1,
    borderColor: colors.shield + '20',
  },
  privacyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  privacyIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.shieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray800,
  },
  privacyCardSub: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 1,
  },
  vpnMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.vpnBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  vpnMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.vpn,
  },
  vpnMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.vpn,
  },
  // Input
  inputArea: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...shadows.medium,
    marginBottom: spacing.md + 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  inputAreaFocused: {
    borderColor: colors.blue + '30',
    ...shadows.glow,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  inputIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconActive: {
    backgroundColor: colors.blue,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.gray800,
    paddingVertical: 2,
    letterSpacing: -0.2,
  },
  // Action cards
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm + 2,
    ...shadows.soft,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray800,
    letterSpacing: -0.2,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.gray400,
    marginTop: 1,
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sites
  sites: {
    marginBottom: spacing.lg,
  },
  sitesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  sitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    ...shadows.soft,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  siteIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray600,
  },
  // Powered by
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xl + spacing.sm,
  },
  poweredDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gemini,
  },
  poweredText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray400,
    letterSpacing: 0.2,
  },
});
