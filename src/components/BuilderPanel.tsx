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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BuilderPanelProps {
  visible: boolean;
  onClose: () => void;
  onBuild: (prompt: string) => void;
  loading: boolean;
  buildStage: string;
}

const TEMPLATES = [
  { label: 'Landing Page', icon: 'globe-outline' as const, prompt: 'A beautiful startup landing page with hero section, features grid, testimonials, and CTA' },
  { label: 'Todo App', icon: 'checkbox-outline' as const, prompt: 'A sleek todo list app with categories, drag-to-reorder, and local storage persistence' },
  { label: 'Dashboard', icon: 'bar-chart-outline' as const, prompt: 'An analytics dashboard with charts, stats cards, and a clean sidebar navigation' },
  { label: 'Chat UI', icon: 'chatbubbles-outline' as const, prompt: 'A modern messaging app UI with conversation list, chat bubbles, and typing indicators' },
  { label: 'Portfolio', icon: 'briefcase-outline' as const, prompt: 'A minimal developer portfolio with project showcase, about section, and contact form' },
  { label: 'Calculator', icon: 'calculator-outline' as const, prompt: 'A beautiful calculator app with scientific mode toggle and calculation history' },
];

const BUILD_STAGES = [
  { key: 'planning', label: 'Agent planning architecture...', icon: 'git-branch-outline' },
  { key: 'building', label: 'MCP tools generating code...', icon: 'code-slash-outline' },
  { key: 'styling', label: 'Designing UI & interactions...', icon: 'color-palette-outline' },
  { key: 'testing', label: 'Running quality checks...', icon: 'shield-checkmark-outline' },
];

export function BuilderPanel({
  visible,
  onClose,
  onBuild,
  loading,
  buildStage,
}: BuilderPanelProps) {
  const [prompt, setPrompt] = useState('');
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

  const handleBuild = () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onBuild(trimmed);
  };

  const handleTemplate = (templatePrompt: string) => {
    if (loading) return;
    setPrompt(templatePrompt);
    onBuild(templatePrompt);
  };

  const currentStageIndex = BUILD_STAGES.findIndex((s) => s.key === buildStage);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.claudeBadge}>
                <Ionicons name="flash" size={12} color={colors.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Builder</Text>
                <Text style={styles.headerSub}>Claude + MCP Agent</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.buildingState}>
              <View style={styles.buildingIcon}>
                <ActivityIndicator size="large" color={colors.claude} />
              </View>
              <Text style={styles.buildingTitle}>Building your app</Text>
              <Text style={styles.buildingPrompt} numberOfLines={2}>
                "{prompt}"
              </Text>

              {/* Pipeline steps */}
              <View style={styles.pipeline}>
                {BUILD_STAGES.map((stage, i) => {
                  const isActive = i === currentStageIndex;
                  const isDone = i < currentStageIndex;
                  return (
                    <View key={stage.key} style={styles.pipelineStep}>
                      <View
                        style={[
                          styles.pipelineDot,
                          isDone && styles.pipelineDotDone,
                          isActive && styles.pipelineDotActive,
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={12} color={colors.white} />
                        ) : (
                          <Ionicons
                            name={stage.icon as any}
                            size={12}
                            color={isActive ? colors.white : colors.gray400}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.pipelineLabel,
                          (isActive || isDone) && styles.pipelineLabelActive,
                        ]}
                      >
                        {stage.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <>
              {/* Empty state */}
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>What do you want to build?</Text>
                <Text style={styles.emptySubtitle}>
                  Describe any web app and the AI agent will build, test, and launch it for you.
                </Text>
              </View>

              {/* Templates */}
              <Text style={styles.sectionLabel}>Quick start</Text>
              <View style={styles.templates}>
                {TEMPLATES.map((t) => (
                  <TouchableOpacity
                    key={t.label}
                    style={styles.template}
                    onPress={() => handleTemplate(t.prompt)}
                  >
                    <Ionicons name={t.icon} size={20} color={colors.claude} />
                    <Text style={styles.templateLabel}>{t.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.gray300} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* MCP info */}
              <View style={styles.mcpInfo}>
                <View style={styles.mcpRow}>
                  <View style={styles.mcpDot} />
                  <Text style={styles.mcpText}>MCP Server Connected</Text>
                </View>
                <Text style={styles.mcpSub}>
                  code_gen / ui_design / deploy tools available
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Input */}
        {!loading && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe your app..."
                placeholderTextColor={colors.gray400}
                multiline
                maxLength={1000}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={handleBuild}
              />
              <TouchableOpacity
                onPress={handleBuild}
                disabled={!prompt.trim()}
                style={[
                  styles.buildBtn,
                  !prompt.trim() && styles.buildBtnDisabled,
                ]}
              >
                <Ionicons name="rocket" size={16} color={colors.white} />
                <Text style={styles.buildBtnText}>Build</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75,
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
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  handle: {
    width: 36,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  claudeBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.claude,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.gray800,
  },
  headerSub: {
    ...typography.tiny,
    color: colors.gray400,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
  },
  // Empty state
  emptyState: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.gray400,
    fontSize: 14,
    lineHeight: 20,
  },
  // Templates
  sectionLabel: {
    ...typography.tiny,
    color: colors.gray400,
    marginBottom: spacing.sm,
  },
  templates: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  templateLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray700,
    flex: 1,
  },
  // MCP info
  mcpInfo: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  mcpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  mcpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  mcpText: {
    ...typography.caption,
    color: colors.gray600,
    fontSize: 12,
  },
  mcpSub: {
    ...typography.caption,
    color: colors.gray400,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Building state
  buildingState: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  buildingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.claude + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buildingTitle: {
    ...typography.subtitle,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  buildingPrompt: {
    ...typography.body,
    color: colors.gray400,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  pipeline: {
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pipelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineDotActive: {
    backgroundColor: colors.claude,
  },
  pipelineDotDone: {
    backgroundColor: colors.green,
  },
  pipelineLabel: {
    ...typography.caption,
    color: colors.gray400,
    fontSize: 13,
  },
  pipelineLabelActive: {
    color: colors.gray700,
  },
  // Input
  inputContainer: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray100,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.gray50,
    borderRadius: radius.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.gray800,
    maxHeight: 80,
    paddingVertical: spacing.xs,
  },
  buildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.claude,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  buildBtnDisabled: {
    backgroundColor: colors.gray200,
  },
  buildBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
});
