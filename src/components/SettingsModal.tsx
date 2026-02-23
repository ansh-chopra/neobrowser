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
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors, shadows, spacing, radius, typography } from '../theme';
import { PrivacySettings, CookiePolicy } from '../services/privacy';
import { VPNStatus } from './VPNPanel';

const API_KEY_STORAGE = '@neobrowser_gemini_key';
const HISTORY_STORAGE = '@neobrowser_history';

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentKey: string;
  isPro?: boolean;
  onOpenPaywall?: () => void;
  privacySettings?: PrivacySettings;
  onTogglePrivacy?: (key: keyof PrivacySettings) => void;
  onCookiePolicy?: (policy: CookiePolicy) => void;
  vpnStatus?: VPNStatus;
  onOpenVPN?: () => void;
  onOpenPrivacy?: () => void;
  onNavigate?: (url: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  forceDarkPages?: boolean;
  onToggleForceDarkPages?: () => void;
  onClearSiteData?: () => void;
}

export function SettingsModal({
  visible,
  onClose,
  onSave,
  currentKey,
  isPro,
  onOpenPaywall,
  privacySettings,
  onTogglePrivacy,
  onCookiePolicy,
  vpnStatus,
  onOpenVPN,
  onOpenPrivacy,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  forceDarkPages,
  onToggleForceDarkPages,
  onClearSiteData,
}: SettingsModalProps) {
  const c = darkMode ? darkColors : colors;
  const [editingKey, setEditingKey] = useState(false);
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_STORAGE);
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch {}
  };

  const clearHistory = async () => {
    await AsyncStorage.setItem(HISTORY_STORAGE, '[]');
    setHistory([]);
  };

  const handleSaveKey = async () => {
    const trimmed = key.trim();
    if (trimmed) {
      await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
      onSave(trimmed);
    }
    setEditingKey(false);
  };

  const maskedKey = currentKey
    ? currentKey.slice(0, 6) + '••••••' + currentKey.slice(-4)
    : 'Not set';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (showHistory) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <TouchableOpacity style={styles.backdrop} onPress={onClose} />
          <View style={styles.card}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.gray500} />
              </TouchableOpacity>
              <Text style={styles.title}>History</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {history.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={36} color={colors.gray200} />
                  <Text style={styles.emptyText}>No browsing history</Text>
                </View>
              ) : (
                history.slice(0, 50).map((entry, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.historyRow}
                    onPress={() => {
                      onNavigate?.(entry.url);
                      onClose();
                    }}
                  >
                    <View style={styles.historyIcon}>
                      <Ionicons name="globe-outline" size={14} color={colors.gray400} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {entry.title || entry.url}
                      </Text>
                      <Text style={styles.historyUrl} numberOfLines={1}>{entry.url}</Text>
                    </View>
                    <Text style={styles.historyTime}>{formatTime(entry.timestamp)}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, darkMode && { backgroundColor: c.white }]}>
          <View style={styles.header}>
            <Text style={[styles.title, darkMode && { color: c.gray800 }]}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={c.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Subscription Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
              {isPro ? (
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.blue + '15' }]}>
                    <Ionicons name="star" size={16} color={colors.blue} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Neo Pro</Text>
                    <Text style={[styles.settingDesc, { color: colors.green }]}>Active</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Linking.openURL('https://apps.apple.com/account/subscriptions');
                      }
                    }}
                  >
                    <Text style={styles.changeBtnText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.settingRow} onPress={onOpenPaywall}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.blue + '15' }]}>
                    <Ionicons name="sparkles" size={16} color={colors.blue} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Upgrade to Pro</Text>
                    <Text style={styles.settingDesc}>Ad-free + AI features · $9.99/mo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
                </TouchableOpacity>
              )}
            </View>

            {/* Browser Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BROWSER</Text>

              <TouchableOpacity style={styles.settingRow} onPress={() => setShowHistory(true)}>
                <View style={[styles.settingIcon, { backgroundColor: colors.blue + '15' }]}>
                  <Ionicons name="time-outline" size={16} color={colors.blue} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>History</Text>
                  <Text style={styles.settingDesc}>
                    {history.length > 0 ? `${history.length} pages visited` : 'No history yet'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={[styles.settingIcon, { backgroundColor: colors.green + '15' }]}>
                  <Ionicons name="download-outline" size={16} color={colors.green} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Downloads</Text>
                  <Text style={styles.settingDesc}>Manage downloaded files</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={[styles.settingIcon, { backgroundColor: colors.orange + '15' }]}>
                  <Ionicons name="bookmark-outline" size={16} color={colors.orange} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Bookmarks</Text>
                  <Text style={styles.settingDesc}>Saved pages</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
              </TouchableOpacity>
            </View>

            {/* Appearance Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>APPEARANCE</Text>
              <View style={styles.quickToggle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="moon-outline" size={16} color={darkMode ? colors.blue : colors.gray400} />
                  <Text style={styles.quickToggleLabel}>Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode || false}
                  onValueChange={onToggleDarkMode}
                  trackColor={{ false: colors.gray200, true: colors.blue + '60' }}
                  thumbColor={darkMode ? colors.blue : colors.gray400}
                />
              </View>
              <View style={styles.quickToggle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="contrast-outline" size={16} color={forceDarkPages ? colors.blue : colors.gray400} />
                  <Text style={styles.quickToggleLabel}>Force Dark on Websites</Text>
                </View>
                <Switch
                  value={forceDarkPages || false}
                  onValueChange={onToggleForceDarkPages}
                  trackColor={{ false: colors.gray200, true: colors.blue + '60' }}
                  thumbColor={forceDarkPages ? colors.blue : colors.gray400}
                />
              </View>
            </View>

            {/* Data Management */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DATA</Text>
              <TouchableOpacity style={styles.settingRow} onPress={onClearSiteData}>
                <View style={[styles.settingIcon, { backgroundColor: colors.red + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.red} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Clear Site Data</Text>
                  <Text style={styles.settingDesc}>Remove cookies, cache & local storage</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
              </TouchableOpacity>
            </View>

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

            {/* VPN Section — hidden for v1 */}

            {/* AI Section — subtle key display */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AI</Text>
              {isPro && (
                <Text style={{ fontSize: 12, color: colors.gray400, marginBottom: spacing.xs }}>
                  Pro includes AI. Or use your own key below.
                </Text>
              )}
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="sparkles" size={16} color={colors.blue} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Gemini API Key</Text>
                  <Text style={styles.settingDesc}>{maskedKey}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingKey(!editingKey)}
                  style={styles.changeBtn}
                >
                  <Text style={styles.changeBtnText}>{editingKey ? 'Cancel' : 'Change'}</Text>
                </TouchableOpacity>
              </View>

              {editingKey && (
                <View style={styles.keyEditSection}>
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
                  <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveKey}>
                    <Text style={styles.saveKeyBtnText}>Save Key</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                <Text style={styles.aboutValue}>Gemini 3 Flash</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export { API_KEY_STORAGE, HISTORY_STORAGE };

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
    maxHeight: '82%',
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
  backBtn: {
    marginRight: spacing.sm,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red,
  },
  scrollContent: {
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.tiny,
    color: colors.gray500,
    marginBottom: spacing.xs,
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
  changeBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.gray50,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue,
  },
  keyEditSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
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
  saveKeyBtn: {
    backgroundColor: colors.gray800,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveKeyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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
  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  historyIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray800,
  },
  historyUrl: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 1,
  },
  historyTime: {
    fontSize: 11,
    color: colors.gray400,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray300,
  },
});
