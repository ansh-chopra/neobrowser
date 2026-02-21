import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';
import { PrivacySettings, PrivacyStats, CookiePolicy } from '../services/privacy';

interface PrivacyShieldPanelProps {
  visible: boolean;
  onClose: () => void;
  settings: PrivacySettings;
  stats: PrivacyStats;
  onToggle: (key: keyof PrivacySettings) => void;
  onCookiePolicy: (policy: CookiePolicy) => void;
}

const COOKIE_OPTIONS: { label: string; value: CookiePolicy; desc: string }[] = [
  { label: 'Allow All', value: 'allow_all', desc: 'Accept all cookies' },
  { label: 'Block 3rd Party', value: 'block_third_party', desc: 'Block cross-site cookies' },
  { label: 'Block All', value: 'block_all', desc: 'Block all cookies' },
];

export function PrivacyShieldPanel({
  visible,
  onClose,
  settings,
  stats,
  onToggle,
  onCookiePolicy,
}: PrivacyShieldPanelProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const shieldPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      // Pulse shield icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(shieldPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(shieldPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      slideAnim.setValue(0);
      shieldPulse.setValue(1);
    }
  }, [visible]);

  const totalBlocked = stats.adsBlocked + stats.trackersBlocked;
  const anyEnabled = settings.adBlocking || settings.trackerProtection || settings.httpsEverywhere || settings.fingerprintProtection;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={[styles.shieldIconBg, { transform: [{ scale: shieldPulse }] }]}>
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={anyEnabled ? colors.shield : colors.gray400}
              />
            </Animated.View>
            <View>
              <Text style={styles.title}>Privacy Shield</Text>
              <Text style={styles.subtitle}>
                {anyEnabled ? `${totalBlocked} threats blocked` : 'Protection disabled'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.shieldBg }]}>
              <Text style={[styles.statNumber, { color: colors.shield }]}>{stats.adsBlocked}</Text>
              <Text style={styles.statLabel}>Ads Blocked</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.statNumber, { color: colors.blue }]}>{stats.trackersBlocked}</Text>
              <Text style={styles.statLabel}>Trackers</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.statNumber, { color: colors.green }]}>{stats.httpsUpgrades}</Text>
              <Text style={styles.statLabel}>HTTPS</Text>
            </View>
          </View>

          {/* Toggle Switches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROTECTION</Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={[styles.toggleIcon, { backgroundColor: colors.shieldBg }]}>
                  <Ionicons name="ban" size={16} color={colors.shield} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>Ad Blocking</Text>
                  <Text style={styles.toggleDesc}>Remove ads from web pages</Text>
                </View>
              </View>
              <Switch
                value={settings.adBlocking}
                onValueChange={() => onToggle('adBlocking')}
                trackColor={{ false: colors.gray200, true: colors.shield + '60' }}
                thumbColor={settings.adBlocking ? colors.shield : colors.gray400}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={[styles.toggleIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="eye-off" size={16} color={colors.blue} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>Tracker Protection</Text>
                  <Text style={styles.toggleDesc}>Block cross-site trackers</Text>
                </View>
              </View>
              <Switch
                value={settings.trackerProtection}
                onValueChange={() => onToggle('trackerProtection')}
                trackColor={{ false: colors.gray200, true: colors.blue + '60' }}
                thumbColor={settings.trackerProtection ? colors.blue : colors.gray400}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={[styles.toggleIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="lock-closed" size={16} color={colors.green} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>HTTPS Everywhere</Text>
                  <Text style={styles.toggleDesc}>Upgrade connections to HTTPS</Text>
                </View>
              </View>
              <Switch
                value={settings.httpsEverywhere}
                onValueChange={() => onToggle('httpsEverywhere')}
                trackColor={{ false: colors.gray200, true: colors.green + '60' }}
                thumbColor={settings.httpsEverywhere ? colors.green : colors.gray400}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={[styles.toggleIcon, { backgroundColor: '#FDF4FF' }]}>
                  <Ionicons name="finger-print" size={16} color={colors.purple} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>Fingerprint Protection</Text>
                  <Text style={styles.toggleDesc}>Randomize browser fingerprint</Text>
                </View>
              </View>
              <Switch
                value={settings.fingerprintProtection}
                onValueChange={() => onToggle('fingerprintProtection')}
                trackColor={{ false: colors.gray200, true: colors.purple + '60' }}
                thumbColor={settings.fingerprintProtection ? colors.purple : colors.gray400}
              />
            </View>
          </View>

          {/* Cookie Control */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COOKIE CONTROL</Text>
            <View style={styles.cookieOptions}>
              {COOKIE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.cookieOption,
                    settings.cookiePolicy === opt.value && styles.cookieOptionActive,
                  ]}
                  onPress={() => onCookiePolicy(opt.value)}
                >
                  <Text
                    style={[
                      styles.cookieLabel,
                      settings.cookiePolicy === opt.value && styles.cookieLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.cookieDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    ...shadows.lifted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  shieldIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.shieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subtitle,
    color: colors.gray800,
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 2,
    fontSize: 11,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.tiny,
    color: colors.gray500,
    marginBottom: spacing.sm + 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
  },
  toggleDesc: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 1,
  },
  cookieOptions: {
    gap: spacing.sm,
  },
  cookieOption: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cookieOptionActive: {
    backgroundColor: colors.shieldBg,
    borderColor: colors.shield + '40',
  },
  cookieLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  cookieLabelActive: {
    color: colors.shield,
  },
  cookieDesc: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 2,
  },
});
