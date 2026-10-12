import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Award, Building2, Check, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { CompanySettings } from '../types';
import { Button, Card, CardTitle, Field, IconCircle } from '../components/ui';

interface SettingsProps {
  company: CompanySettings;
  onSaveCompany: (company: CompanySettings) => Promise<void>;
}

const LANGUAGES: { id: Language; label: string; sample: string }[] = [
  { id: 'uz', label: 'Oʻzbekcha (lotin)', sample: 'UZ' },
  { id: 'uz_cyrl', label: 'Ўзбекча (кирилл)', sample: 'ЎЗ' },
  { id: 'ru', label: 'Русский', sample: 'RU' },
];

const COMPANY_FIELDS: { key: keyof CompanySettings; label: string; placeholder: string; wide?: boolean }[] = [
  { key: 'companyName', label: 'Kompaniya nomi', placeholder: 'Mobi_R Qandolat', wide: true },
  { key: 'address', label: 'Manzil', placeholder: 'Fargʻona viloyati, Qoʻqon sh., ...', wide: true },
  { key: 'phone', label: 'Telefon', placeholder: '+998 90 000 00 00' },
  { key: 'inn', label: 'STIR (INN)', placeholder: '123456789' },
  { key: 'bankAccount', label: 'Hisob raqami', placeholder: '2020 8000 ...' },
  { key: 'bankMfo', label: 'Bank MFO', placeholder: '00000' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Card header: coloured icon circle + title/subtitle */
const SectionTitle: React.FC<{ icon: typeof Award; tone: 'brand' | 'amber'; title: string; subtitle?: string }> = ({
  icon,
  tone,
  title,
  subtitle,
}) => (
  <div className="flex items-start gap-3 mb-1">
    <IconCircle icon={icon} tone={tone} />
    <div className="min-w-0 flex-1">
      <CardTitle title={title} subtitle={subtitle} />
    </div>
  </div>
);

/** Save row: feedback text on the left of the button */
const SaveRow: React.FC<{ status: SaveStatus; disabled: boolean; errorText: string }> = ({ status, disabled, errorText }) => (
  <div className="flex flex-wrap items-center justify-end gap-3 pt-5 mt-5 border-t border-ink-100">
    {status === 'saved' && (
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
        <Check className="w-4 h-4" /> Saqlandi
      </span>
    )}
    {status === 'error' && <span className="text-[13px] text-rose-600">{errorText}</span>}
    <Button type="submit" disabled={disabled}>
      {status === 'saving' ? 'Saqlanmoqda…' : 'Saqlash'}
    </Button>
  </div>
);

export const Settings: React.FC<SettingsProps> = ({ company, onSaveCompany }) => {
  const { lang, setLang } = useLanguage();
  const [form, setForm] = useState<CompanySettings>(company);
  const [status, setStatus] = useState<SaveStatus>('idle');

  // Settings arrive from the server after the page opens
  useEffect(() => setForm(company), [company]);

  const isDirty = COMPANY_FIELDS.some((f) => (form[f.key] || '') !== (company[f.key] || ''));

  // Bonus settings are numbers, kept as text while typing
  const bonusFrom = (c: CompanySettings) => ({ days: String(c.bonusStreakDays || 10), amount: c.bonusAmount ? String(c.bonusAmount) : '' });
  const [bonus, setBonus] = useState(bonusFrom(company));
  const [bonusStatus, setBonusStatus] = useState<SaveStatus>('idle');
  useEffect(() => setBonus(bonusFrom(company)), [company]);
  const bonusDirty = bonus.days !== bonusFrom(company).days || bonus.amount !== bonusFrom(company).amount;

  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setBonusStatus('saving');
    try {
      await onSaveCompany({ ...company, bonusStreakDays: Number(bonus.days), bonusAmount: Number(bonus.amount) || 0 });
      setBonusStatus('saved');
    } catch {
      setBonusStatus('error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      await onSaveCompany(form);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start max-w-6xl">
      <div className="space-y-5 min-w-0">
        {/* Language */}
        <Card>
          <SectionTitle icon={Languages} tone="brand" title="Til" subtitle="Til / Тил / Язык" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((l) => {
              const isSelected = lang === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={clsx(
                    'relative flex flex-col items-start gap-3 p-4 rounded-xl2 text-left transition border-2 min-w-0',
                    isSelected ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-ink-100/70 hover:bg-ink-100'
                  )}
                >
                  <span
                    className={clsx(
                      'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold',
                      isSelected ? 'bg-brand-500 text-white' : 'bg-white text-ink-500'
                    )}
                  >
                    {l.sample}
                  </span>
                  <span className={clsx('text-sm font-semibold truncate max-w-full', isSelected ? 'text-brand-500' : 'text-ink-700')}>
                    {l.label}
                  </span>
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Return-free streak bonus */}
        <Card>
          <form onSubmit={handleSaveBonus}>
            <SectionTitle
              icon={Award}
              tone="amber"
              title="Vozvratsiz ishlash bonusi"
              subtitle='Liniya ketma-ket shuncha kun vozvratsiz ishlasa, hisobotda "Bonus" belgisi chiqadi'
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Kunlar soni"
                type="number"
                min={1}
                value={bonus.days}
                suffix="kun"
                className="tabular-nums"
                onChange={(e) => {
                  setBonus({ ...bonus, days: e.target.value });
                  setBonusStatus('idle');
                }}
              />
              <Field
                label="Bonus summasi (ixtiyoriy)"
                type="number"
                min={0}
                value={bonus.amount}
                placeholder="0"
                suffix="soʻm"
                className="tabular-nums"
                onChange={(e) => {
                  setBonus({ ...bonus, amount: e.target.value });
                  setBonusStatus('idle');
                }}
              />
            </div>
            <SaveRow
              status={bonusStatus}
              disabled={!bonusDirty || !(Number(bonus.days) >= 1) || bonusStatus === 'saving'}
              errorText="Saqlab boʻlmadi"
            />
          </form>
        </Card>
      </div>

      {/* Company requisites */}
      <Card className="min-w-0">
        <form onSubmit={handleSave}>
          <SectionTitle icon={Building2} tone="brand" title="Kompaniya rekvizitlari" subtitle="Yuk xati va cheklarning tepasida chiqadi" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPANY_FIELDS.map((f) => (
              <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                <Field
                  label={f.label}
                  type="text"
                  value={String(form[f.key] ?? '')}
                  placeholder={f.placeholder}
                  onChange={(e) => {
                    setForm({ ...form, [f.key]: e.target.value });
                    setStatus('idle');
                  }}
                />
              </div>
            ))}
          </div>
          <SaveRow status={status} disabled={!isDirty || status === 'saving'} errorText="Saqlab boʻlmadi, qaytadan urinib koʻring" />
        </form>
      </Card>
    </div>
  );
};

export default Settings;
