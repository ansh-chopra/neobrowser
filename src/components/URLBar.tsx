import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius } from '../theme';

interface URLBarProps {
  url: string;
  onSubmit: (url: string) => void;
  onRefresh: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  loading: boolean;
  shieldEnabled?: boolean;
  shieldCount?: number;
  onShieldPress?: () => void;
  vpnConnected?: boolean;
  onVpnPress?: () => void;
}

export function URLBar({
  url,
  onSubmit,
  onRefresh,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  loading,
  shieldEnabled = false,
  shieldCount = 0,
  onShieldPress,
  vpnConnected = false,
  onVpnPress,
}: URLBarProps) {
  const [text, setText] = useState(url);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!focused) setText(url);
  }, [url, focused]);

  useEffect(() => {
    if (loading) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0.9,
        duration: 8000,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => progressAnim.setValue(0), 300);
      });
    }
  }, [loading]);

  const handleSubmit = () => {
    let finalUrl = text.trim();
    if (!finalUrl) return;

    onSubmit(finalUrl);
    inputRef.current?.blur();
  };

  const displayUrl = () => {
    if (url.startsWith('neo://search')) {
      try {
        const q = new URLSearchParams(url.split('?')[1]).get('q');
        return q ? `Search: ${q}` : 'Neo Search';
      } catch {}
      return 'Neo Search';
    }
    if (url.startsWith('data:')) return 'Generated App';
    if (url === 'neo://home' || url === '') return '';
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navButtons}>
        <TouchableOpacity
          onPress={onGoBack}
          disabled={!canGoBack}
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-back" size={20} color={canGoBack ? colors.gray700 : colors.gray300} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onGoForward}
          disabled={!canGoForward}
          style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoForward ? colors.gray700 : colors.gray300} />
        </TouchableOpacity>
      </View>

      <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
        {/* Shield icon */}
        {!focused && onShieldPress && (
          <TouchableOpacity onPress={onShieldPress} style={styles.shieldBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Ionicons
              name="shield-checkmark"
              size={13}
              color={shieldEnabled ? colors.shield : colors.gray300}
            />
            {shieldEnabled && shieldCount > 0 && (
              <View style={styles.shieldBadge}>
                <Text style={styles.shieldBadgeText}>{shieldCount > 99 ? '99+' : shieldCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Lock / search / sparkle icon */}
        {!focused && (
          <Ionicons
            name={url.startsWith('neo://search') ? 'search' : url.startsWith('data:') ? 'sparkles' : 'lock-closed'}
            size={11}
            color={url.startsWith('neo://search') ? colors.blue : colors.gray400}
            style={styles.lockIcon}
          />
        )}

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={focused ? text : displayUrl()}
          onChangeText={setText}
          onFocus={() => {
            setFocused(true);
            if (url.startsWith('neo://search')) {
              try {
                const q = new URLSearchParams(url.split('?')[1]).get('q');
                if (q) { setText(q); return; }
              } catch {}
            }
            setText(url);
          }}
          onBlur={() => setFocused(false)}
          onSubmitEditing={handleSubmit}
          placeholder="Search or enter URL"
          placeholderTextColor={colors.gray400}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectTextOnFocus
        />

        {/* VPN indicator — hidden for v1 */}

        {focused && text.length > 0 && (
          <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={colors.gray400} />
          </TouchableOpacity>
        )}

        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              opacity: progressAnim.interpolate({
                inputRange: [0, 0.01, 0.99, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      </View>

      <TouchableOpacity onPress={onRefresh} style={styles.navBtn}>
        <Ionicons
          name={loading ? 'close' : 'reload'}
          size={17}
          color={colors.gray500}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
    backgroundColor: colors.white,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 2,
  },
  navBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  inputFocused: {
    borderColor: colors.blue + '40',
    backgroundColor: colors.white,
  },
  shieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  shieldBadge: {
    backgroundColor: colors.shield,
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginLeft: 2,
  },
  shieldBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.white,
  },
  lockIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray800,
    textAlign: 'center',
  },
  vpnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.vpnBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: spacing.xs,
  },
  vpnDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.vpn,
  },
  vpnText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.vpn,
  },
  clearBtn: {
    padding: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: colors.blue,
    borderRadius: 1,
  },
});
