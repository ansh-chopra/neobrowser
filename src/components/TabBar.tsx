import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, radius, typography } from '../theme';

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
}: TabBarProps) {
  const filteredTabs = activeSpaceId
    ? tabs.filter((t) => t.spaceId === activeSpaceId || !t.spaceId)
    : tabs;

  return (
    <View style={styles.container}>
      {/* Space pills */}
      {onSelectSpace && (
        <View style={styles.spacesRow}>
          {spaces.map((space) => {
            const isActive = space.id === activeSpaceId;
            return (
              <TouchableOpacity
                key={space.id}
                style={[
                  styles.spacePill,
                  isActive && { backgroundColor: space.color + '15', borderColor: space.color + '30' },
                ]}
                onPress={() => onSelectSpace(space.id)}
              >
                <View style={[styles.spaceDot, { backgroundColor: space.color }]} />
                <Text
                  style={[
                    styles.spaceLabel,
                    isActive && { color: space.color, fontWeight: '600' },
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
                    <Ionicons name="close" size={14} color={colors.gray400} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={onNewTab} style={styles.newTabBtn}>
          <Ionicons name="add" size={20} color={colors.gray500} />
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
  spacesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs + 2,
    gap: spacing.xs,
  },
  spacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
    backgroundColor: colors.gray50,
  },
  spaceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spaceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray500,
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
