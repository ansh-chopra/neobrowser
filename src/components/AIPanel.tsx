import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';
import { BrowserAction } from '../services/gemini';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  actions?: BrowserAction[];
  isStep?: boolean;
  timestamp: number;
}

interface AIPanelProps {
  visible: boolean;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  loading: boolean;
  agentRunning?: boolean;
  onStop?: () => void;
  onActionTap?: (action: BrowserAction) => void;
}

export function AIPanel({
  visible,
  messages,
  onSend,
  onClose,
  loading,
  agentRunning,
  onStop,
  onActionTap,
}: AIPanelProps) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 25,
      stiffness: 200,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setText('');
  };

  const quickActions = [
    { label: 'Summarize', icon: 'document-text-outline' as const, prompt: 'Summarize this page for me' },
    { label: 'Find info', icon: 'search-outline' as const, prompt: 'What are the key links and content on this page?' },
    { label: 'Fill forms', icon: 'create-outline' as const, prompt: 'Help me fill out any forms on this page' },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Handle bar */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerContent}>
            <View style={styles.aiLabel}>
              <View style={[styles.aiDotOuter, agentRunning && styles.aiDotOuterActive]}>
                <View style={[styles.aiDot, agentRunning && styles.aiDotActive]} />
              </View>
              <Text style={styles.aiLabelText}>
                {agentRunning ? 'Agent browsing' : 'Neo Agent'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {agentRunning && onStop && (
                <TouchableOpacity onPress={onStop} style={styles.stopBtn} activeOpacity={0.7}>
                  <View style={styles.stopIcon} />
                  <Text style={styles.stopBtnText}>Stop</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles" size={24} color={colors.blue} />
              </View>
              <Text style={styles.emptyTitle}>What can I help with?</Text>
              <Text style={styles.emptySubtitle}>
                I can browse the web, click buttons, fill forms, and complete tasks for you.
              </Text>
              <View style={styles.quickActions}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.quickAction}
                    onPress={() => onSend(action.prompt)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={action.icon} size={16} color={colors.blue} />
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg) => {
            // Agent step messages - compact inline display
            if (msg.isStep) {
              return (
                <View key={msg.id} style={styles.stepRow}>
                  <View style={styles.stepLine} />
                  <View style={styles.stepDot} />
                  <Text style={styles.stepText} numberOfLines={1}>
                    {msg.text}
                  </Text>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {msg.role === 'ai' && (
                  <View style={styles.aiBubbleHeader}>
                    <View style={styles.aiBubbleDot} />
                    <Text style={styles.aiBubbleLabel}>Gemini</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {msg.text}
                </Text>
                {msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionsContainer}>
                    {msg.actions.map((action, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.actionPill}
                        onPress={() => onActionTap?.(action)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={getActionIcon(action.type)}
                          size={13}
                          color={colors.blue}
                        />
                        <Text style={styles.actionText}>{action.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {loading && !agentRunning && (
            <View style={[styles.bubble, styles.aiBubble]}>
              <View style={styles.loadingDots}>
                <LoadingDot delay={0} />
                <LoadingDot delay={150} />
                <LoadingDot delay={300} />
              </View>
            </View>
          )}

          {agentRunning && (
            <View style={styles.agentIndicator}>
              <LoadingDot delay={0} />
              <LoadingDot delay={150} />
              <LoadingDot delay={300} />
              <Text style={styles.agentIndicatorText}>Working...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={agentRunning ? 'Agent is working...' : 'Tell the agent what to do...'}
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={2000}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
              editable={!agentRunning}
            />
            {agentRunning ? (
              <TouchableOpacity onPress={onStop} style={styles.stopBtnInput} activeOpacity={0.7}>
                <View style={styles.stopIconSmall} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || loading}
                style={[
                  styles.sendBtn,
                  (!text.trim() || loading) && styles.sendBtnDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-up" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { opacity: anim }]}
    />
  );
}

function getActionIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'navigate': return 'globe-outline';
    case 'click': return 'hand-left-outline';
    case 'type': return 'create-outline';
    case 'scroll': return 'swap-vertical-outline';
    case 'extract': return 'code-slash-outline';
    case 'summarize': return 'document-text-outline';
    case 'search': return 'search-outline';
    default: return 'ellipsis-horizontal';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.62,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadows.lifted,
  },
  inner: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  aiDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDotOuterActive: {
    backgroundColor: colors.green + '20',
  },
  aiDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.gray300,
  },
  aiDotActive: {
    backgroundColor: colors.green,
  },
  aiLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  stopIcon: {
    width: 8,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: colors.white,
  },
  stopBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray800,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  // Agent step rows - compact
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.xs,
  },
  stepLine: {
    width: 1,
    height: 16,
    backgroundColor: colors.gray200,
    position: 'absolute',
    left: spacing.sm + 2,
    top: -8,
  },
  stepDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.blue,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.gray500,
    flex: 1,
  },
  // Agent working indicator
  agentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  agentIndicatorText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray400,
    marginLeft: 4,
  },
  // Chat bubbles
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.gray800,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray50,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiBubbleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.blue,
  },
  aiBubbleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.blue,
    letterSpacing: 0.3,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: colors.white,
    fontWeight: '400',
  },
  aiText: {
    color: colors.gray800,
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray700,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  inputContainer: {
    padding: spacing.sm,
    paddingBottom: spacing.md + 4,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.gray800,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray200,
  },
  stopBtnInput: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIconSmall: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
});
