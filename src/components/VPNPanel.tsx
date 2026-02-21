import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';

export interface VPNServer {
  id: string;
  name: string;
  country: string;
  flag: string;
  ping: string;
}

export type VPNStatus = 'disconnected' | 'connecting' | 'connected';

export const VPN_SERVERS: VPNServer[] = [
  { id: 'us', name: 'United States', country: 'US', flag: '🇺🇸', ping: '12ms' },
  { id: 'uk', name: 'United Kingdom', country: 'UK', flag: '🇬🇧', ping: '45ms' },
  { id: 'de', name: 'Germany', country: 'DE', flag: '🇩🇪', ping: '38ms' },
  { id: 'jp', name: 'Japan', country: 'JP', flag: '🇯🇵', ping: '89ms' },
  { id: 'sg', name: 'Singapore', country: 'SG', flag: '🇸🇬', ping: '72ms' },
  { id: 'nl', name: 'Netherlands', country: 'NL', flag: '🇳🇱', ping: '42ms' },
];

interface VPNPanelProps {
  visible: boolean;
  onClose: () => void;
  status: VPNStatus;
  selectedServer: VPNServer;
  onToggleVPN: () => void;
  onSelectServer: (server: VPNServer) => void;
}

export function VPNPanel({
  visible,
  onClose,
  status,
  selectedServer,
  onToggleVPN,
  onSelectServer,
}: VPNPanelProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const connectAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (status === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(connectAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (status === 'connected') {
      pulseAnim.setValue(1);
      Animated.timing(connectAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      pulseAnim.setValue(1);
      Animated.timing(connectAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [status]);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

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
            <View style={[styles.vpnIconBg, isConnected && styles.vpnIconBgActive]}>
              <Ionicons name="globe" size={20} color={isConnected ? colors.white : colors.gray400} />
            </View>
            <View>
              <Text style={styles.title}>VPN</Text>
              <Text style={styles.subtitle}>
                {isConnected
                  ? `Connected to ${selectedServer.name}`
                  : isConnecting
                  ? 'Connecting...'
                  : 'Not connected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Connection Toggle */}
        <View style={styles.connectSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.connectBtn,
                isConnected && styles.connectBtnActive,
                isConnecting && styles.connectBtnConnecting,
              ]}
              onPress={onToggleVPN}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isConnected ? 'power' : 'power-outline'}
                size={36}
                color={isConnected ? colors.white : isConnecting ? colors.shield : colors.gray400}
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.connectLabel, isConnected && styles.connectLabelActive]}>
            {isConnected ? 'Protected' : isConnecting ? 'Connecting...' : 'Tap to connect'}
          </Text>
          {isConnected && (
            <View style={styles.connectedInfo}>
              <Text style={styles.connectedFlag}>{selectedServer.flag}</Text>
              <Text style={styles.connectedServer}>{selectedServer.name}</Text>
              <View style={styles.pingBadge}>
                <Text style={styles.pingText}>{selectedServer.ping}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Server List */}
        <View style={styles.serverSection}>
          <Text style={styles.sectionTitle}>SERVER LOCATIONS</Text>
          {VPN_SERVERS.map((server) => {
            const isSelected = server.id === selectedServer.id;
            return (
              <TouchableOpacity
                key={server.id}
                style={[styles.serverRow, isSelected && styles.serverRowSelected]}
                onPress={() => onSelectServer(server)}
                activeOpacity={0.7}
              >
                <Text style={styles.serverFlag}>{server.flag}</Text>
                <View style={styles.serverInfo}>
                  <Text style={[styles.serverName, isSelected && styles.serverNameSelected]}>
                    {server.name}
                  </Text>
                  <Text style={styles.serverPing}>{server.ping}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.vpn} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={16} color={colors.gray400} />
          <Text style={styles.noteText}>
            VPN interface ready. Native tunnel requires react-native-vpn module for production.
          </Text>
        </View>
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
    maxHeight: '85%',
    paddingBottom: spacing.xl,
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
  vpnIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vpnIconBgActive: {
    backgroundColor: colors.vpn,
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
  connectSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  connectBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gray200,
  },
  connectBtnActive: {
    backgroundColor: colors.vpn,
    borderColor: colors.vpn,
    ...shadows.glow,
    shadowColor: colors.vpn,
  },
  connectBtnConnecting: {
    borderColor: colors.shield,
    borderStyle: 'dashed' as any,
  },
  connectLabel: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  connectLabelActive: {
    color: colors.vpn,
    fontWeight: '600',
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.vpnBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  connectedFlag: {
    fontSize: 16,
  },
  connectedServer: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.vpn,
  },
  pingBadge: {
    backgroundColor: colors.vpn + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.vpn,
  },
  serverSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.tiny,
    color: colors.gray500,
    marginBottom: spacing.sm,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  serverRowSelected: {
    backgroundColor: colors.vpnBg,
  },
  serverFlag: {
    fontSize: 20,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  serverNameSelected: {
    fontWeight: '600',
    color: colors.vpn,
  },
  serverPing: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 1,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
  },
  noteText: {
    ...typography.caption,
    color: colors.gray400,
    flex: 1,
    fontSize: 11,
  },
});
