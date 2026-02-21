import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadows, spacing, radius, typography } from '../theme';
import { PrivacySettings, CookiePolicy } from '../services/privacy';
import { VPNStatus } from './VPNPanel';

const API_KEY_STORAGE = '@neobrowser_gemini_key';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentKey: string;
  privacySettings?: PrivacySettings;
  onTogglePrivacy?: (key: keyof PrivacySettings) => void;
  onCookiePolicy?: (policy: CookiePolicy) => void;
  vpnStatus?: VPNStatus;
  onOpenVPN?: () => void;
  onOpenPrivacy?: () => void;
}

export function SettingsModal({
  visible,
  onClose,
  onSave,
  currentKey,
  privacySettings,
  onTogglePrivacy,
  onCookiePolicy,
  vpnStatus,
  onOpenVPN,
  onOpenPrivacy,
}: SettingsModalProps) {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey]);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (trimmed) {
      await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
      onSave(trimmed);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Privacy & Security Section */}
            {privacySettings && onOpenPrivacy && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PRIVACY & SECURITY</Text>
                <TouchableOpacity style={styles.settingRow} onPress={onOpenPrivacy}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.shieldBg }]}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.shield} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Privacy Shield</Text>
                    <Text style={styles.settingDesc}>
                      {privacySettings.adBlocking ? 'Active' : 'Disabled'} · Tap for details
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
                </TouchableOpacity>

                {onTogglePrivacy && (
                  <>
                    <View style={styles.quickToggle}>
                      <Text style={styles.quickToggleLabel}>Ad Blocking</Text>
                      <Switch
                        value={privacySettings.adBlocking}
                        onValueChange={() => onTogglePrivacy('adBlocking')}
                        trackColor={{ false: colors.gray200, true: colors.shield + '60' }}
                        thumbColor={privacySettings.adBlocking ? colors.shield : colors.gray400}
                      />
                    </View>
                    <View style={styles.quickToggle}>
                      <Text style={styles.quickToggleLabel}>Tracker Protection</Text>
                      <Switch
                        value={privacySettings.trackerProtection}
                        onValueChange={() => onTogglePrivacy('trackerProtection')}
                        trackColor={{ false: colors.gray200, true: colors.blue + '60' }}
                        thumbColor={privacySettings.trackerProtection ? colors.blue : colors.gray400}
                      />
                    </View>
                    <View style={styles.quickToggle}>
                      <Text style={styles.quickToggleLabel}>HTTPS Everywhere</Text>
                      <Switch
                        value={privacySettings.httpsEverywhere}
                        onValueChange={() => onTogglePrivacy('httpsEverywhere')}
                        trackColor={{ false: colors.gray200, true: colors.green + '60' }}
                        thumbColor={privacySettings.httpsEverywhere ? colors.green : colors.gray400}
                      />
                    </View>
                  </>
                )}
              </View>
            )}

            {/* VPN Section */}
            {onOpenVPN && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>VPN</Text>
                <TouchableOpacity style={styles.settingRow} onPress={onOpenVPN}>
                  <View style={[styles.settingIcon, { backgroundColor: vpnStatus === 'connected' ? colors.vpnBg : colors.gray100 }]}>
                    <Ionicons name="globe" size={16} color={vpnStatus === 'connected' ? colors.vpn : colors.gray400} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>VPN</Text>
                    <Text style={styles.settingDesc}>
                      {vpnStatus === 'connected' ? 'Connected' : vpnStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
                </TouchableOpacity>
              </View>
            )}

            {/* AI Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AI SETTINGS</Text>
              <Text style={styles.sectionDesc}>
                Get your key from Google AI Studio
              </Text>
              <View style={styles.keyInputWrapper}>
                <TextInput
                  style={styles.keyInput}
                  value={key}
                  onChangeText={setKey}
                  placeholder="AIza..."
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
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="flash" size={16} color={colors.gemini} />
              <Text style={styles.infoText}>
                Gemini 2.0 Flash for ultra-fast AI browsing
              </Text>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Engine</Text>
                <Text style={styles.aboutValue}>Neo Browser</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>AI Model</Text>
                <Text style={styles.aboutValue}>Gemini 2.0 Flash</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export { API_KEY_STORAGE };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    width: '88%',
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lifted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.gray800,
  },
  scrollContent: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.tiny,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    ...typography.caption,
    color: colors.gray400,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 1,
  },
  quickToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xl + spacing.sm,
  },
  quickToggleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray600,
  },
  keyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    ...typography.caption,
    color: colors.gemini,
    flex: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray500,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  saveBtn: {
    backgroundColor: colors.gray800,
    paddingVertical: spacing.sm + 4,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
