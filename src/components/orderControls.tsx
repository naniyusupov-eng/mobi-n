/**
 * Order-flow controls shared by the catalog, cart and checkout screens.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { AppText } from './ui';
import { PackagingUnit, Product } from '../types';
import { formatNumber } from '../utils/format';
import { colors, font, radius, shadow, space } from '../theme/colors';

export const UNIT_ORDER: PackagingUnit[] = ['blok', 'korobka', 'dona', 'kg'];

export const getUnitPrice = (product: Product, unit: PackagingUnit) => {
  switch (unit) {
    case 'dona':
      return product.priceDona;
    case 'blok':
      return product.priceBlok;
    case 'korobka':
      return product.priceKorobka;
    case 'kg':
      return product.priceKg;
  }
};

/** Equal-width segmented control: every option gets the same share of the row, text shrinks to fit */
export function EqualSegments<K extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K | null;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.segments}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => onChange(o.key)}
            style={[styles.segment, active && styles.segmentActive]}
            hitSlop={2}
          >
            <AppText
              variant="small"
              fit
              align="center"
              color={active ? colors.primaryDark : colors.textSecondary}
              style={active ? styles.bold : null}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const STEPPER_WIDTH = 124;

/**
 * Quantity stepper with a fixed width, so it never pushes prices or names out of the row.
 * When `addLabel` is given and the value is 0 it turns into an "Add" button of the same size.
 * The number itself can be typed for big quantities (`onSet`).
 */
export const QtyStepper: React.FC<{
  value: number;
  onInc: () => void;
  onDec: () => void;
  onSet?: (qty: number) => void;
  addLabel?: string;
  trashAtOne?: boolean;
}> = ({ value, onInc, onDec, onSet, addLabel, trashAtOne }) => {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  if (value === 0 && addLabel) {
    return (
      <Pressable onPress={onInc} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]} hitSlop={4}>
        <Plus size={16} color={colors.primaryDark} strokeWidth={2.4} />
        <AppText variant="strong" color={colors.primaryDark} fit>
          {addLabel}
        </AppText>
      </Pressable>
    );
  }

  const commit = () => {
    const n = parseInt(text.replace(/\D/g, ''), 10);
    if (!onSet || Number.isNaN(n)) {
      setText(String(value));
      return;
    }
    if (n !== value) onSet(n);
  };

  const DecIcon = trashAtOne && value <= 1 ? Trash2 : Minus;

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDec}
        disabled={value === 0}
        hitSlop={4}
        style={({ pressed }) => [styles.stepBtn, value === 0 && styles.disabled, pressed && styles.pressed]}
      >
        <DecIcon size={16} color={DecIcon === Trash2 ? colors.danger : colors.text} strokeWidth={2.2} />
      </Pressable>
      {onSet ? (
        <TextInput
          style={styles.qtyInput}
          value={text}
          onChangeText={setText}
          onEndEditing={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={5}
          returnKeyType="done"
        />
      ) : (
        <View style={styles.qtyBox}>
          <AppText variant="strong" fit align="center">
            {formatNumber(value)}
          </AppText>
        </View>
      )}
      <Pressable onPress={onInc} hitSlop={4} style={({ pressed }) => [styles.stepBtn, styles.stepBtnPlus, pressed && styles.pressed]}>
        <Plus size={16} color={colors.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    height: 34,
    paddingHorizontal: space.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.card, ...shadow.card },
  bold: { fontWeight: '600' },
  addBtn: {
    width: STEPPER_WIDTH,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  pressed: { opacity: 0.75 },
  stepper: {
    width: STEPPER_WIDTH,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  stepBtn: { width: 40, height: '100%', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  qtyInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 2,
    textAlign: 'center',
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  qtyBox: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  stepBtnPlus: { backgroundColor: colors.primary },
});
