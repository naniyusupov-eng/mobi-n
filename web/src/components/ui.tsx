/**
 * Click-style UI kit for the web admin. Pages are built from these pieces so cards,
 * buttons, pills and tables look the same everywhere.
 */
import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X, LucideIcon } from 'lucide-react';

export type Tone = 'brand' | 'green' | 'red' | 'amber' | 'violet' | 'gray';

export const TONE: Record<Tone, { soft: string; text: string; solid: string }> = {
  brand: { soft: 'bg-brand-50', text: 'text-brand-500', solid: 'bg-brand-500' },
  green: { soft: 'bg-emerald-50', text: 'text-emerald-600', solid: 'bg-emerald-500' },
  red: { soft: 'bg-rose-50', text: 'text-rose-600', solid: 'bg-rose-500' },
  amber: { soft: 'bg-amber-50', text: 'text-amber-600', solid: 'bg-amber-500' },
  violet: { soft: 'bg-violet-50', text: 'text-violet-600', solid: 'bg-violet-500' },
  gray: { soft: 'bg-ink-100', text: 'text-ink-500', solid: 'bg-ink-500' },
};

// ---------------------------------------------------------------- Layout

export const Card: React.FC<{ children: React.ReactNode; className?: string; padded?: boolean; onClick?: () => void }> = ({
  children,
  className,
  padded = true,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={clsx(
      'bg-white rounded-card shadow-card',
      padded && 'p-5 md:p-6',
      onClick && 'cursor-pointer transition hover:shadow-pop',
      className
    )}
  >
    {children}
  </div>
);

/** Title row inside a card */
export const CardTitle: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h3 className="text-[17px] font-bold tracking-tight text-ink-900 truncate">{title}</h3>
      {subtitle ? <p className="text-[13px] text-ink-400 mt-0.5">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

/** Page title row: title, optional subtitle, actions on the right */
export const PageHeader: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-[26px] font-bold tracking-tight text-ink-900">{title}</h1>
      {subtitle ? <p className="text-sm text-ink-500 mt-1">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
  </div>
);

// ---------------------------------------------------------------- Controls

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'white';

const BUTTON: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  secondary: 'bg-brand-50 text-brand-500 hover:bg-brand-100',
  white: 'bg-white text-ink-700 hover:bg-ink-100 shadow-card',
  ghost: 'text-ink-500 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
};

export const Button: React.FC<{
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
  className?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', icon: Icon, type = 'button', disabled, title, className }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={clsx(
      'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition disabled:opacity-40 disabled:pointer-events-none',
      size === 'md' ? 'h-11 px-4 rounded-xl2 text-sm' : 'h-9 px-3 rounded-xl text-[13px]',
      BUTTON[variant],
      className
    )}
  >
    {Icon ? <Icon className={size === 'md' ? 'w-[18px] h-[18px]' : 'w-4 h-4'} strokeWidth={2} /> : null}
    {children}
  </button>
);

/** Round coloured icon, like the service icons in Click */
export const IconCircle: React.FC<{ icon: LucideIcon; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  icon: Icon,
  tone = 'brand',
  size = 'md',
  className,
}) => {
  const box = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-12 h-12' }[size];
  const ic = { sm: 'w-[18px] h-[18px]', md: 'w-5 h-5', lg: 'w-[22px] h-[22px]' }[size];
  return (
    <div className={clsx('rounded-full flex items-center justify-center shrink-0', box, TONE[tone].soft, TONE[tone].text, className)}>
      <Icon className={ic} strokeWidth={2} />
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: Tone; className?: string; title?: string }> = ({
  children,
  tone = 'gray',
  className,
  title,
}) => (
  <span
    title={title}
    className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
      TONE[tone].soft,
      TONE[tone].text,
      className
    )}
  >
    {children}
  </span>
);

/** Pill-shaped switch between a few options */
export function Segmented<K extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: K; label: React.ReactNode }[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div className={clsx('inline-flex flex-wrap gap-1 p-1 bg-white rounded-xl2 shadow-card', className)}>
      {options.map((o) => (
        <button
          key={String(o.key)}
          type="button"
          onClick={() => onChange(o.key)}
          className={clsx(
            'h-9 px-3.5 rounded-xl text-[13px] font-semibold transition whitespace-nowrap',
            o.key === value ? 'bg-brand-500 text-white' : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const fieldBase =
  'w-full h-11 px-4 rounded-xl2 bg-ink-100/70 border border-transparent text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:bg-white focus:border-brand-200 focus:ring-4 focus:ring-brand-50';

export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  icon: LucideIcon;
}> = ({ value, onChange, placeholder, className, icon: Icon }) => (
  <div className={clsx('relative', className)}>
    <Icon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={clsx(fieldBase, 'pl-11 pr-10')} />
    {value ? (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-ink-400 hover:text-ink-700"
        aria-label="Tozalash"
      >
        <X className="w-4 h-4" />
      </button>
    ) : null}
  </div>
);

export const Field: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; suffix?: string }
> = ({ label, hint, suffix, className, ...input }) => (
  <label className="block">
    <span className="block text-[13px] font-medium text-ink-700 mb-1.5">{label}</span>
    <span className="relative block">
      <input {...input} className={clsx(fieldBase, suffix && 'pr-14', className)} />
      {suffix ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">{suffix}</span> : null}
    </span>
    {hint ? <span className="block text-xs text-ink-400 mt-1">{hint}</span> : null}
  </label>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({
  label,
  className,
  children,
  ...select
}) => {
  const el = (
    <select {...select} className={clsx(fieldBase, 'pr-9 cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center]', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2398A2B3' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
      {children}
    </select>
  );
  return label ? (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink-700 mb-1.5">{label}</span>
      {el}
    </label>
  ) : (
    el
  );
};

// ---------------------------------------------------------------- Display

/** KPI card: coloured icon, label, big number, note */
export const StatCard: React.FC<{
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}> = ({ icon, tone = 'brand', label, value, note, className }) => (
  <Card className={clsx('flex flex-col gap-2.5 h-full', className)}>
    <IconCircle icon={icon} tone={tone} />
    <div className="text-sm text-ink-500">{label}</div>
    <div className="text-[26px] leading-tight font-bold tracking-tight tabular-nums text-ink-900 truncate">{value}</div>
    {note ? <div className="text-[13px] text-ink-400">{note}</div> : null}
  </Card>
);

/** The bright blue hero card (like the Click balance card) */
// Same layout as StatCard (icon, label, value, note) so the three top boxes line up
export const HeroCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ icon: Icon, label, value, badge, children }) => (
  <div className="rounded-card bg-brand-500 text-white p-5 md:p-6 flex flex-col gap-2.5 min-w-0 h-full">
    <div className="flex items-start justify-between gap-3">
      <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      {badge}
    </div>
    <div className="text-sm text-white/80">{label}</div>
    <div className="text-[26px] leading-tight font-bold tracking-tight tabular-nums truncate">{value}</div>
    {children ? <div className="flex flex-wrap gap-2 mt-auto">{children}</div> : null}
  </div>
);

export const HeroPill: React.FC<{ children: React.ReactNode; solid?: boolean }> = ({ children, solid }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
      solid ? 'bg-white text-brand-500' : 'bg-white/20 text-white'
    )}
  >
    {children}
  </span>
);

export const EmptyState: React.FC<{ icon: LucideIcon; title: string; hint?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  hint,
  action,
}) => (
  <div className="flex flex-col items-center text-center gap-2 py-12 px-6">
    <IconCircle icon={icon} tone="gray" size="lg" className="mb-1" />
    <div className="font-semibold text-ink-900">{title}</div>
    {hint ? <div className="text-sm text-ink-400 max-w-sm">{hint}</div> : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);

/** Table helpers: consistent paddings and dividers */
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={clsx('w-full text-sm border-collapse', className)}>{children}</table>
  </div>
);
export const Th: React.FC<{ children?: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }> = ({
  children,
  align = 'left',
  className,
}) => (
  <th
    className={clsx(
      'px-5 py-3 text-xs font-medium text-ink-400 bg-ink-100/60 first:rounded-l-xl2 last:rounded-r-xl2',
      { left: 'text-left', right: 'text-right', center: 'text-center' }[align],
      className
    )}
  >
    {children}
  </th>
);
export const Td: React.FC<{
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
  title?: string;
}> = ({ children, align = 'left', className, colSpan, title }) => (
  <td
    colSpan={colSpan}
    title={title}
    className={clsx(
      'px-5 py-3.5 border-b border-ink-100 text-ink-700',
      { left: 'text-left', right: 'text-right', center: 'text-center' }[align],
      className
    )}
  >
    {children}
  </td>
);

/** Centered modal dialog */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}> = ({ open, onClose, title, subtitle, children, footer, width = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={clsx(
          'bg-white rounded-card shadow-pop w-full max-h-[90vh] flex flex-col',
          { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[width]
        )}
      >
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-ink-900">{title}</h3>
            {subtitle ? <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink-100 text-ink-500 hover:text-ink-900 flex items-center justify-center"
            aria-label="Yopish"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
        {footer ? <div className="px-6 py-4 border-t border-ink-100 flex items-center justify-end gap-2.5">{footer}</div> : null}
      </div>
    </div>
  );
};

/** Money as "1 250 000 soʻm" (spaces as thousands separators) */
export const formatSum = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const Money: React.FC<{ value: number; className?: string; unit?: boolean }> = ({ value, className, unit = true }) => (
  <span className={clsx('tabular-nums whitespace-nowrap', className)}>
    {formatSum(value)}
    {unit ? <span className="text-[0.8em] font-medium opacity-60"> soʻm</span> : null}
  </span>
);
