/**
 * One header for every screen (replaces the platform headers, which looked different on
 * Android and iOS). Top-level screens get a large title; pushed screens get a back button.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { AppText } from './ui';
import { colors, space } from '../theme/colors';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, onBack, right }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        <AppText variant={onBack ? 'title' : 'h2'} lines={1} style={styles.title}>
          {title}
        </AppText>
        {right}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  back: {
    width: 36,
    height: 36,
    marginLeft: -space.xs,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  pressed: { opacity: 0.7 },
  title: { flex: 1 },
});
