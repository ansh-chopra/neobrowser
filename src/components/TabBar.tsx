import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, shadows, spacing, radius, typography } from '../theme';

export interface Space {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_SPACES: Space[] = [
  { id: 'personal', name: 'Personal', color: colors.blue },
  { id: 'work', name: 'Work', color: colors.purple },
  { id: 'research', name: 'Research', color: colors.teal },
];

export interface Tab {
  id: string;
  title: string;
  url: string;
  color: string;
  spaceId?: string;
}

const TAB_COLORS = [
  colors.purple,
  colors.teal,
  colors.cyan,
  colors.orange,
  colors.green,
  colors.pink,
  colors.blue,
];

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onBuild?: () => void;
  spaces?: Space[];
  activeSpaceId?: string;
  onSelectSpace?: (spaceId: string) => void;
  darkMode?: boolean;
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onBuild,
  spaces = DEFAULT_SPACES,
  activeSpaceId,
  onSelectSpace,
  darkMode,
}: TabBarProps) {
  const c = darkMode ? darkColors : colors;
  const filteredTabs = activeSpaceId
    ? tabs.filter((t) => t.spaceId === activeSpaceId || !t.spaceId)
    : tabs;

  const activeIndex = spaces.findIndex((s) => s.id === activeSpaceId);
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);

  useEffect(() => {
    if (activeIndex >= 0 && segmentWidth.current > 0) {
      Animated.spring(pillTranslateX, {
        toValue: activeIndex * segmentWidth.current,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  }, [activeIndex]);

  return (
    <View style={[styles.container, { backgroundColor: c.white, borderBottomColor: c.gray100 }]}>
      {/* Segmented space control */}
      {onSelectSpace && (
        <View style={[styles.segmentedContainer, { backgroundColor: c.gray100 }]}
          onLayout={(e) => {
            const containerWidth = e.nativeEvent.layout.width - 8; // subtract padding
            segmentWidth.current = containerWidth / spaces.length;
            // Set initial position without animation
            if (activeIndex >= 0) {
              pillTranslateX.setValue(activeIndex * segmentWidth.current);
            }
          }}
        >
          <Animated.View
            style={[
              styles.segmentedPill,
              {
                width: `${100 / spaces.length}%` as any,
                backgroundColor: (spaces[activeIndex >= 0 ? activeIndex : 0]?.color || colors.blue) + '18',
                transform: [{ translateX: pillTranslateX }],
              },
            ]}
          />
          {spaces.map((space) => {
            const isActive = space.id === activeSpaceId;
            return (
              <TouchableOpacity
                key={space.id}
                style={styles.segment}
                onPress={() => onSelectSpace(space.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.segmentDot, { backgroundColor: space.color }]} />
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: c.gray400 },
                    isActive && { color: space.color, fontWeight: '700' },
                  ]}
                >
                  {space.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && styles.activeTab,
                  isActive && { borderBottomColor: tab.color },
                ]}
                onPress={() => onSelectTab(tab.id)}
              >
                <View style={[styles.tabDot, { backgroundColor: tab.color }]} />
                <Text
                  style={[styles.tabTitle, isActive && styles.activeTabTitle]}
                  numberOfLines={1}
                >
                  {tab.title || 'New Tab'}
                </Text>
                {tabs.length > 1 && (
                  <TouchableOpacity
                    onPress={() => onCloseTab(tab.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={14} color={c.gray400} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={onNewTab} style={styles.newTabBtn}>
          <Ionicons name="add" size={20} color={c.gray500} />
        </TouchableOpacity>
        {onBuild && (
          <TouchableOpacity onPress={onBuild} style={styles.buildBtn}>
            <Ionicons name="flash" size={14} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function getTabColor(index: number): string {
  return TAB_COLORS[index % TAB_COLORS.length];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  segmentedContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs + 2,
    borderRadius: radius.sm,
    padding: 4,
    position: 'relative',
  },
  segmentedPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.sm - 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 30,
  },
  segmentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    flexGrow: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    maxWidth: 160,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabTitle: {
    ...typography.caption,
    color: colors.gray400,
    flex: 1,
    fontSize: 12,
  },
  activeTabTitle: {
    color: colors.gray800,
    fontWeight: '600',
  },
  newTabBtn: {
    padding: spacing.sm,
  },
  buildBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.claude,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
});
