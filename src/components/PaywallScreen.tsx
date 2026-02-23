import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { colors, shadows, spacing, radius } from '../theme';

export function PaywallScreen() {
  const {
    showPaywall,
    closePaywall,
    subscribe,
    restorePurchases,
    setApiKey,
  } = useSubscription();

  const [showBYOK, setShowBYOK] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!showPaywall) return null;

  const handleSaveBYOK = async () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      await setApiKey(trimmed);
      closePaywall();
    }
  };

  const features = [
    { icon: 'ban' as const, label: 'Ad-Free Browsing', desc: 'No ads, anywhere', color: colors.green },
    { icon: 'sparkles' as const, label: 'AI Agent', desc: 'Ask anything, AI finds answers', color: colors.blue },
    { icon: 'construct' as const, label: 'AI Builder', desc: 'Describe an app, AI builds it', color: colors.orange },
    { icon: 'search' as const, label: 'AI Search', desc: 'Smarter search powered by AI', color: colors.purple },
  ];

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={closePaywall}>
            <Ionicons name="close" size={22} color={colors.gray400} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Logo + Pro badge */}
            <View style={styles.logoSection}>
              <View style={styles.logoRow}>
                <Text style={styles.logo}>neo</Text>
                <View style={styles.logoDot} />
              </View>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Pro</Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.featureList}>
              {features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                    <Ionicons name={f.icon} size={18} color={f.color} />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Price */}
            <Text style={styles.priceText}>$9.99/month after 3-day free trial</Text>

            {/* CTA */}
            <TouchableOpacity style={styles.ctaBtn} onPress={subscribe}>
              <Text style={styles.ctaBtnText}>Start Free Trial</Text>
            </TouchableOpacity>

            {/* Links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={restorePurchases}>
                <Text style={styles.linkText}>Restore Purchases</Text>
              </TouchableOpacity>
              <Text style={styles.linkDot}>·</Text>
              <TouchableOpacity onPress={() => setShowBYOK(!showBYOK)}>
                <Text style={styles.linkText}>Use your own API key</Text>
              </TouchableOpacity>
            </View>

            {/* BYOK section */}
            {showBYOK && (
              <View style={styles.byokSection}>
                <Text style={styles.byokTitle}>Bring Your Own Key</Text>
                <Text style={styles.byokDesc}>
                  Enter your Gemini API key to use AI features for free.
                </Text>
                <View style={styles.keyInputWrapper}>
                  <TextInput
                    style={styles.keyInput}
                    value={keyInput}
                    onChangeText={setKeyInput}
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
                  <Text style={styles.linkBtnText}>Get a free key from Google AI Studio</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.byokSaveBtn, !keyInput.trim() && { opacity: 0.4 }]}
                  onPress={handleSaveBYOK}
                  disabled={!keyInput.trim()}
                >
                  <Text style={styles.byokSaveBtnText}>Save Key</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Terms & Privacy links */}
            <View style={styles.legalRow}>
              <TouchableOpacity onPress={() => Linking.openURL('https://neobrowser.app/terms')}>
                <Text style={styles.legalLink}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.linkDot}>·</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://neobrowser.app/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {/* Fine print */}
            <Text style={styles.finePrint}>
              Payment will be charged to your Apple ID account at confirmation of purchase.
              Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    ...shadows.lifted,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + 20,
  },
  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.gray800,
    letterSpacing: -2,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
    marginBottom: 10,
    marginLeft: 3,
  },
  proBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  proBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  // Features
  featureList: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
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
  // Price
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // CTA
  ctaBtn: {
    backgroundColor: colors.gray800,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  // Links
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  linkText: {
    fontSize: 14,
    color: colors.blue,
    fontWeight: '500',
  },
  linkDot: {
    fontSize: 14,
    color: colors.gray300,
  },
  // BYOK
  byokSection: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  byokTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray800,
    marginBottom: 4,
  },
  byokDesc: {
    fontSize: 13,
    color: colors.gray400,
    marginBottom: spacing.md,
  },
  keyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  keyInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
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
    marginBottom: spacing.md,
  },
  linkBtnText: {
    fontSize: 13,
    color: colors.blue,
    fontWeight: '500',
  },
  byokSaveBtn: {
    backgroundColor: colors.gray800,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  byokSaveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Legal links
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  legalLink: {
    fontSize: 12,
    color: colors.gray400,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Fine print
  finePrint: {
    fontSize: 11,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 16,
  },
});
