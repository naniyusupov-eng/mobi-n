/**
 * RCandy mobile UI kit. Every screen is built from these pieces, so spacing, type and colours
 * stay consistent. All text shrinks/truncates instead of overflowing its box.
 */
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { ChevronRight, Search, X } from 'lucide-react-native';
import { colors, font, radius, shadow, space } from '../theme/colors';
import { useLanguageStore } from '../store/languageStore';
import { formatMoney } from '../utils/format';

type Icon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export const TONES: Record<Tone, { fg: string; bg: string; border: string; solid: string }> = {
  neutral: { fg: colors.textSecondary, bg: colors.surfaceSecondary, border: colors.border, solid: colors.textSecondary },
  primary: { fg: colors.primary, bg: colors.primaryLight, border: colors.primaryBorder, solid: colors.primary },
  success: { fg: colors.success, bg: colors.successLight, border: '#A7F3D0', solid: colors.success },
  warning: { fg: colors.warning, bg: colors.warningLight, border: '#FDE68A', solid: colors.warning },
  danger: { fg: colors.danger, bg: colors.dangerLight, border: '#FECDD3', solid: colors.danger },
};

// ---------------------------------------------------------------- Text

type Variant = 'h1' | 'h2' | 'title' | 'body' | 'strong' | 'small' | 'caption' | 'label';

const VARIANTS: Record<Variant, TextStyle> = {
  h1: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: font.h2, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  body: { fontSize: font.body, color: colors.text },
  strong: { fontSize: font.body, fontWeight: '600', color: colors.text },
  small: { fontSize: font.small, color: colors.textSecondary },
  caption: { fontSize: font.caption, color: colors.textMuted },
  label: { fontSize: font.title, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
};

interface AppTextProps {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  lines?: number; // truncate after N lines
  fit?: boolean; // shrink font to stay on one line (numbers, buttons)
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

export const AppText: React.FC<AppTextProps> = ({ children, variant = 'body', color, lines, fit, align, style }) => (
  <Text
    numberOfLines={fit ? 1 : lines}
    adjustsFontSizeToFit={fit}
    minimumFontScale={0.7}
    style={[styles.text, VARIANTS[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
  >
    {children}
  </Text>
);

/** Formatted amount with the currency of the current language */
export const Money: React.FC<{ amount: number; variant?: Variant; color?: string; style?: StyleProp<TextStyle> }> = ({
  amount,
  variant = 'strong',
  color,
  style,
}) => {
  const lang = useLanguageStore((s) => s.lang);
  return (
    <AppText variant={variant} color={color} fit style={[styles.tabular, style]}>
      {formatMoney(amount, lang)}
    </AppText>
  );
};

// ---------------------------------------------------------------- Layout

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: React.ReactNode; // sticky bottom area (main action)
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  footer,
  edges = ['left', 'right'],
  contentStyle,
}) => (
  <SafeAreaView style={styles.screen} edges={edges}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.screenContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>
);

export const Card: React.FC<{ children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; padded?: boolean }> = ({
  children,
  onPress,
  style,
  padded = true,
}) => {
  const body = [styles.card, padded && styles.cardPadded, style];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [...body, pressed && styles.pressed]}>
      {children}
    </Pressable>
  ) : (
    <View style={body}>{children}</View>
  );
};

export const Row: React.FC<{ children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }> = ({
  children,
  gap = space.sm,
  style,
  wrap,
}) => <View style={[styles.row, { gap }, wrap && styles.wrap, style]}>{children}</View>;

export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => <View style={[styles.divider, style]} />;

/** Section title with an optional action on the right */
export const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <AppText variant="label" lines={1} style={styles.flex}>
      {title}
    </AppText>
    {action && onAction ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <AppText variant="small" color={colors.primary} lines={1}>
          {action}
        </AppText>
      </Pressable>
    ) : null}
  </View>
);

// ---------------------------------------------------------------- Controls

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: Icon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BUTTON: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.primaryLight, fg: colors.primary, border: colors.primaryLight },
  outline: { bg: colors.card, fg: colors.text, border: colors.border },
  danger: { bg: colors.dangerLight, fg: colors.danger, border: colors.dangerLight },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
};

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', size = 'md', icon: IconCmp, loading, disabled, style }) => {
  const c = BUTTON[variant];
  const height = { sm: 38, md: 48, lg: 54 }[size];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: c.bg, borderColor: c.border, paddingHorizontal: size === 'sm' ? space.md : space.lg },
        off && styles.disabled,
        pressed && !off && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={c.fg} />
      ) : (
        <>
          {IconCmp ? <IconCmp size={size === 'sm' ? 15 : 17} color={c.fg} strokeWidth={2} /> : null}
          <AppText variant="strong" color={c.fg} fit style={size === 'sm' ? styles.buttonTextSm : null}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
};

export const IconButton: React.FC<{ icon: Icon; onPress: () => void; tone?: Tone; size?: number; disabled?: boolean }> = ({
  icon: IconCmp,
  onPress,
  tone = 'neutral',
  size = 38,
  disabled,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={6}
    style={({ pressed }) => [
      styles.iconButton,
      { width: size, height: size, backgroundColor: TONES[tone].bg, borderColor: TONES[tone].border },
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    <IconCmp size={Math.round(size * 0.45)} color={TONES[tone].fg} strokeWidth={2} />
  </Pressable>
);

export const Badge: React.FC<{ label: string; tone?: Tone; icon?: Icon }> = ({ label, tone = 'neutral', icon: IconCmp }) => (
  <View style={[styles.badge, { backgroundColor: TONES[tone].bg }]}>
    {IconCmp ? <IconCmp size={11} color={TONES[tone].fg} strokeWidth={2.2} /> : null}
    <AppText variant="caption" color={TONES[tone].fg} lines={1} style={styles.badgeText}>
      {label}
    </AppText>
  </View>
);

/** Horizontal set of options; scrolls sideways when it does not fit */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segment, active && styles.segmentActive]}>
            <AppText variant="small" color={active ? colors.white : colors.textSecondary} lines={1} style={styles.bold}>
              {o.label}
              {o.count != null ? ` · ${o.count}` : ''}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const SearchBar: React.FC<{ value: string; onChangeText: (v: string) => void; placeholder: string }> = ({
  value,
  onChangeText,
  placeholder,
}) => (
  <View style={styles.search}>
    <Search size={17} color={colors.textMuted} />
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      returnKeyType="search"
    />
    {value ? (
      <Pressable onPress={() => onChangeText('')} hitSlop={8}>
        <X size={17} color={colors.textMuted} />
      </Pressable>
    ) : null}
  </View>
);

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
}

export const Field: React.FC<FieldProps> = ({ label, hint, error, suffix, style, multiline, ...input }) => (
  <View style={styles.field}>
    <AppText variant="small" style={styles.fieldLabel} lines={1}>
      {label}
    </AppText>
    <View style={[styles.input, multiline && styles.inputMultiline, !!error && styles.inputError]}>
      <TextInput
        style={[styles.inputText, multiline && styles.inputTextMultiline, style]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        {...input}
      />
      {suffix ? (
        <AppText variant="small" color={colors.textMuted}>
          {suffix}
        </AppText>
      ) : null}
    </View>
    {error ? (
      <AppText variant="caption" color={colors.danger}>
        {error}
      </AppText>
    ) : hint ? (
      <AppText variant="caption">{hint}</AppText>
    ) : null}
  </View>
);

// ---------------------------------------------------------------- Display

/** One line of a list: icon, title/subtitle, something on the right */
export const ListItem: React.FC<{
  title: string;
  subtitle?: string;
  icon?: Icon;
  iconTone?: Tone;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}> = ({ title, subtitle, icon: IconCmp, iconTone = 'primary', right, onPress, chevron }) => {
  const content = (
    <>
      {IconCmp ? (
        <View style={[styles.listIcon, { backgroundColor: TONES[iconTone].bg }]}>
          <IconCmp size={18} color={TONES[iconTone].fg} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="strong" lines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" lines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {chevron ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.listItem}>{content}</View>
  );
};

/** Label on the left, value on the right; value wraps instead of pushing out */
export const KeyValue: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <View style={styles.keyValue}>
    <AppText variant={strong ? 'strong' : 'small'} lines={1} style={styles.keyLabel}>
      {label}
    </AppText>
    <View style={styles.keyValueRight}>
      {typeof value === 'string' ? (
        <AppText variant={strong ? 'strong' : 'body'} align="right" lines={2}>
          {value}
        </AppText>
      ) : (
        value
      )}
    </View>
  </View>
);

/** Small KPI tile */
export const Stat: React.FC<{ label: string; value: string; hint?: string; tone?: Tone; icon?: Icon; style?: StyleProp<ViewStyle> }> = ({
  label,
  value,
  hint,
  tone = 'neutral',
  icon: IconCmp,
  style,
}) => (
  <Card style={[styles.stat, style]}>
    {IconCmp ? <IconCircle icon={IconCmp} tone={tone === 'neutral' ? 'primary' : tone} size={38} /> : null}
    <AppText variant="small" lines={2}>
      {label}
    </AppText>
    <AppText variant="h2" fit style={styles.tabular}>
      {value}
    </AppText>
    {hint ? (
      <AppText variant="caption" lines={1}>
        {hint}
      </AppText>
    ) : null}
  </Card>
);

/** Round tinted icon, like the service icons in Click */
export const IconCircle: React.FC<{ icon: Icon; tone?: Tone; size?: number }> = ({ icon: IconCmp, tone = 'primary', size = 44 }) => (
  <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: TONES[tone].bg }]}>
    <IconCmp size={Math.round(size * 0.46)} color={TONES[tone].fg} strokeWidth={2} />
  </View>
);

/** The blue headline card (web HeroCard): icon, label, big value, pills underneath */
export const HeroCard: React.FC<{
  icon: Icon;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ icon: IconCmp, label, value, badge, children, style }) => (
  <View style={[styles.hero, style]}>
    <View style={styles.heroTop}>
      <View style={styles.heroIcon}>
        <IconCmp size={20} color={colors.white} strokeWidth={2} />
      </View>
      {badge}
    </View>
    <AppText variant="small" color="rgba(255,255,255,0.8)" lines={1}>
      {label}
    </AppText>
    {typeof value === 'string' ? (
      <AppText variant="h1" color={colors.white} fit style={styles.tabular}>
        {value}
      </AppText>
    ) : (
      value
    )}
    {children ? <View style={styles.heroPills}>{children}</View> : null}
  </View>
);

/** Small pill on the hero card; solid = white with blue text */
export const HeroPill: React.FC<{ label: string; icon?: Icon; solid?: boolean }> = ({ label, icon: IconCmp, solid }) => (
  <View style={[styles.heroPill, solid && styles.heroPillSolid]}>
    {IconCmp ? <IconCmp size={13} color={solid ? colors.primary : colors.white} strokeWidth={2.2} /> : null}
    <AppText variant="caption" color={solid ? colors.primary : colors.white} lines={1} style={styles.bold}>
      {label}
    </AppText>
  </View>
);

export const EmptyState: React.FC<{ icon: Icon; title: string; hint?: string; action?: React.ReactNode }> = ({
  icon: IconCmp,
  title,
  hint,
  action,
}) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <IconCmp size={26} color={colors.primary} strokeWidth={1.8} />
    </View>
    <AppText variant="strong" align="center">
      {title}
    </AppText>
    {hint ? (
      <AppText variant="small" align="center">
        {hint}
      </AppText>
    ) : null}
    {action}
  </View>
);

/** Bottom sheet modal with a title, content and an optional sticky footer */
export const Sheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ visible, onClose, title, subtitle, children, footer }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={styles.flex}>
            <AppText variant="title" lines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="small" lines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          <IconButton icon={X} onPress={onClose} size={34} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
          {children}
        </ScrollView>
        {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>
);

// ---------------------------------------------------------------- Styles

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  text: { flexShrink: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '600' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },

  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  footer: {
    padding: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: space.sm,
    ...shadow.pop,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  cardPadded: { padding: 18, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm, paddingHorizontal: 2 },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 0,
  },
  buttonTextSm: { fontSize: font.small },
  iconButton: { borderRadius: radius.pill, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeText: { fontWeight: '600' },

  segmented: { gap: 4, padding: 4, backgroundColor: colors.card, borderRadius: radius.md + 2, ...shadow.card },
  segment: {
    paddingHorizontal: space.md + 2,
    paddingVertical: 8,
    borderRadius: radius.sm + 2,
  },
  segmentActive: { backgroundColor: colors.primary },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 48,
    paddingHorizontal: space.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    ...shadow.card,
  },
  searchInput: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 0 },

  field: { gap: 6 },
  fieldLabel: { fontWeight: '500' },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
  },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: space.sm },
  inputError: { borderColor: colors.danger },
  inputText: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 10 },
  inputTextMultiline: { minHeight: 72, textAlignVertical: 'top' },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  listIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  keyValue: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: 3 },
  keyLabel: { flexShrink: 0, maxWidth: '50%' },
  keyValueRight: { flex: 1, alignItems: 'flex-end', minWidth: 0 },

  stat: { flex: 1, minWidth: 140, padding: space.lg, gap: 6 },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },

  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.xl, gap: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md, marginBottom: 2 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 4 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    maxWidth: '100%',
  },
  heroPillSolid: { backgroundColor: colors.white },

  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: space.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  sheetBody: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  sheetFooter: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
