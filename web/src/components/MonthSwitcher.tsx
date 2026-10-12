import React from 'react';
import { PeriodPicker } from './PeriodPicker';

/** "‹ 📅 Oktabr 2026 ›" — the label opens a month calendar; future months are disabled */
export const MonthSwitcher: React.FC<{ month: string; onChange: (month: string) => void }> = ({ month, onChange }) => (
  <PeriodPicker kinds={['month']} value={{ kind: 'month', month }} onChange={(p) => p.kind === 'month' && onChange(p.month)} />
);
