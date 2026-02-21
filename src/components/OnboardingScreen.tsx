import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (apiKey: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const goToPage = (p: number) => {
    setPage(p);
    scrollRef.current?.scrollTo({ x: p * SCREEN_W, animated: true });
  };

  const handleFinish = () => {
    onComplete(apiKey.trim());
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {/* ── Page 1: Welcome ── */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <View style={styles.logoRow}>
              <Text style={styles.logo}>neo</Text>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to{'\n'}Neo Browser</Text>
            <Text style={styles.welcomeSub}>
              Search, browse, and build{'\n'}— powered by AI.
            </Text>
          </View>
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => goToPage(1)}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Page 2: API Key ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.page}
        >
          <View style={styles.pageContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={32} color={colors.blue} />
            </View>
            <Text style={styles.pageTitle}>Connect to Gemini</Text>
            <Text style={styles.pageDesc}>
              Enter your Gemini API key to unlock{'\n'}AI search, agent, and app builder.
            </Text>

            <View style={styles.keyInputWrapper}>
              <TextInput
                style={styles.keyInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste your API key here"
                placeholderTextColor={colors.gray300}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeBtn}>
                <Ionicons
                  name={showKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.gray400}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
            >
              <Ionicons name="open-outline" size={14} color={colors.blue} />
              <Text style={styles.linkText}>Get a free key from Google AI Studio</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.primaryBtn, !apiKey.trim() && styles.primaryBtnDisabled]}
              onPress={() => goToPage(2)}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => goToPage(2)}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* ── Page 3: Ready ── */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.green} />
            </View>
            <Text style={styles.pageTitle}>Privacy built in</Text>
            <Text style={styles.pageDesc}>
              Browse with confidence. Everything{'\n'}is protected by default.
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: 'ban', label: 'Ad Blocker', desc: 'Block ads on every page', color: colors.green },
                { icon: 'eye-off', label: 'Tracker Protection', desc: 'Stop cross-site tracking', color: colors.blue },
                { icon: 'globe', label: 'Built-in VPN', desc: 'One-tap secure connection', color: VPN_GREEN },
                { icon: 'lock-closed', label: 'HTTPS Everywhere', desc: 'Auto-upgrade connections', color: colors.green },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                    <Ionicons name={f.icon as any} size={18} color={f.color} />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
              <Text style={styles.primaryBtnText}>Start Browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const VPN_GREEN = '#10B981';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },
  page: {
    width: SCREEN_W,
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: SCREEN_H * 0.14,
    paddingBottom: SCREEN_H * 0.06,
  },
  pageContent: {
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    gap: spacing.md,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.gray800,
    letterSpacing: -3,
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blue,
    marginBottom: 16,
    marginLeft: 4,
  },

  // Welcome
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.gray800,
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: spacing.md,
  },
  welcomeSub: {
    fontSize: 20,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 30,
  },

  // Page title/desc
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.gray800,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pageDesc: {
    fontSize: 18,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },

  // Key input
  keyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    width: '100%',
    marginBottom: spacing.md,
  },
  keyInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.gray800,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 15,
    color: colors.blue,
    fontWeight: '500',
  },

  // Features
  featureList: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.soft,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.gray400,
    marginTop: 2,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.gray800,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    ...shadows.medium,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 16,
    color: colors.gray400,
    fontWeight: '500',
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    bottom: SCREEN_H * 0.03,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
  },
  dotActive: {
    backgroundColor: colors.gray800,
    width: 24,
  },
});
