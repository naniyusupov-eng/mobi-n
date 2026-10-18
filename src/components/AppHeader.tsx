/**
 * One header for every screen (replaces the platform headers, which looked different on
 * Android and iOS). Top-level screens get a large title; pushed screens get a back button.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { AppText } from './ui';
import { colors, shadow, space } from '../theme/colors';

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
        <AppText variant={onBack ? 'h2' : 'h1'} lines={1} style={styles.title}>
          {title}
        </AppText>
        {right}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Same as the web header: title straight on the canvas, no bar or border
  bar: {
    backgroundColor: colors.background,
  },
  row: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
  title: { flex: 1 },
});
