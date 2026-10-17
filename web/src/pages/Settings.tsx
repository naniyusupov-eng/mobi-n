import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Award, Building2, Check, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { COMMON, Tri, useL } from '../i18n/tri';
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

const COMPANY_FIELDS: { key: keyof CompanySettings; label: Tri; placeholder: string; wide?: boolean }[] = [
  { key: 'companyName', label: { uz: 'Kompaniya nomi', uz_cyrl: 'Компания номи', ru: 'Название компании' }, placeholder: 'Mobi_R Qandolat', wide: true },
  { key: 'address', label: { uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' }, placeholder: 'Fargʻona viloyati, Qoʻqon sh., ...', wide: true },
  { key: 'phone', label: COMMON.phone, placeholder: '+998 90 000 00 00' },
  { key: 'inn', label: { uz: 'STIR (INN)', uz_cyrl: 'СТИР (ИНН)', ru: 'ИНН' }, placeholder: '123456789' },
  { key: 'bankAccount', label: { uz: 'Hisob raqami', uz_cyrl: 'Ҳисоб рақами', ru: 'Расчётный счёт' }, placeholder: '2020 8000 ...' },
  { key: 'bankMfo', label: { uz: 'Bank MFO', uz_cyrl: 'Банк МФО', ru: 'МФО банка' }, placeholder: '00000' },
];

const T = {
  saved: { uz: 'Saqlandi', uz_cyrl: 'Сақланди', ru: 'Сохранено' },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
  language: { uz: 'Til', uz_cyrl: 'Тил', ru: 'Язык' },
  bonusTitle: { uz: 'Vozvratsiz ishlash bonusi', uz_cyrl: 'Возвратсиз ишлаш бонуси', ru: 'Бонус за работу без возвратов' },
  bonusSubtitle: {
    uz: 'Liniya ketma-ket shuncha kun vozvratsiz ishlasa, hisobotda "Bonus" belgisi chiqadi',
    uz_cyrl: 'Линия кетма-кет шунча кун возвратсиз ишласа, ҳисоботда "Бонус" белгиси чиқади',
    ru: 'Если линия столько дней подряд работает без возвратов, в отчёте появится отметка «Бонус»',
  },
  daysCount: { uz: 'Kunlar soni', uz_cyrl: 'Кунлар сони', ru: 'Количество дней' },
  days: { uz: 'kun', uz_cyrl: 'кун', ru: 'дн.' },
  bonusAmount: { uz: 'Bonus summasi (ixtiyoriy)', uz_cyrl: 'Бонус суммаси (ихтиёрий)', ru: 'Сумма бонуса (необязательно)' },
  saveFailed: { uz: 'Saqlab boʻlmadi', uz_cyrl: 'Сақлаб бўлмади', ru: 'Не удалось сохранить' },
  saveFailedRetry: {
    uz: 'Saqlab boʻlmadi, qaytadan urinib koʻring',
    uz_cyrl: 'Сақлаб бўлмади, қайтадан уриниб кўринг',
    ru: 'Не удалось сохранить, попробуйте ещё раз',
  },
  companyTitle: { uz: 'Kompaniya rekvizitlari', uz_cyrl: 'Компания реквизитлари', ru: 'Реквизиты компании' },
  companySubtitle: {
    uz: 'Yuk xati va cheklarning tepasida chiqadi',
    uz_cyrl: 'Юк хати ва чекларнинг тепасида чиқади',
    ru: 'Отображаются в шапке накладных и чеков',
  },
} satisfies Record<string, Tri>;

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
const SaveRow: React.FC<{ status: SaveStatus; disabled: boolean; errorText: string }> = ({ status, disabled, errorText }) => {
  const L = useL();
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-5 mt-5 border-t border-ink-100">
      {status === 'saved' && (
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
          <Check className="w-4 h-4" /> {L(T.saved)}
        </span>
      )}
      {status === 'error' && <span className="text-[13px] text-rose-600">{errorText}</span>}
      <Button type="submit" disabled={disabled}>
        {status === 'saving' ? L(T.saving) : L(COMMON.save)}
      </Button>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ company, onSaveCompany }) => {
  const { lang, setLang } = useLanguage();
  const L = useL();
  const [form, setForm] = useState<CompanySettings>(company);
  const [status, setStatus] = useState<SaveStatus>('idle');

  // Settings arrive from the server after the page opens. Each form only follows the server
  // while it has no unsaved edits, so saving one card does not wipe what is typed in the other.
  const isDirty = COMPANY_FIELDS.some((f) => (form[f.key] || '') !== (company[f.key] || ''));

  // Bonus settings are numbers, kept as text while typing
  const bonusFrom = (c: CompanySettings) => ({ days: String(c.bonusStreakDays || 10), amount: c.bonusAmount ? String(c.bonusAmount) : '' });
  const [bonus, setBonus] = useState(bonusFrom(company));
  const [bonusStatus, setBonusStatus] = useState<SaveStatus>('idle');

  const prevCompany = useRef(company);
  useEffect(() => {
    const prev = prevCompany.current;
    prevCompany.current = company;
    // Untouched form (equal to the previous server values) follows the new values
    setForm((cur) => (COMPANY_FIELDS.every((f) => (cur[f.key] || '') === (prev[f.key] || '')) ? company : cur));
    setBonus((cur) => {
      const old = bonusFrom(prev);
      return cur.days === old.days && cur.amount === old.amount ? bonusFrom(company) : cur;
    });
  }, [company]);
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
          <SectionTitle icon={Languages} tone="brand" title={L(T.language)} subtitle="Til / Тил / Язык" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((l) => {
              const isSelected = lang === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  aria-pressed={isSelected}
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
            <SectionTitle icon={Award} tone="amber" title={L(T.bonusTitle)} subtitle={L(T.bonusSubtitle)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={L(T.daysCount)}
                type="number"
                min={1}
                value={bonus.days}
                suffix={L(T.days)}
                className="tabular-nums"
                onChange={(e) => {
                  setBonus({ ...bonus, days: e.target.value });
                  setBonusStatus('idle');
                }}
              />
              <Field
                label={L(T.bonusAmount)}
                type="number"
                min={0}
                value={bonus.amount}
                placeholder="0"
                suffix={L(COMMON.som)}
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
              errorText={L(T.saveFailed)}
            />
          </form>
        </Card>
      </div>

      {/* Company requisites */}
      <Card className="min-w-0">
        <form onSubmit={handleSave}>
          <SectionTitle icon={Building2} tone="brand" title={L(T.companyTitle)} subtitle={L(T.companySubtitle)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPANY_FIELDS.map((f) => (
              <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                <Field
                  label={L(f.label)}
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
          <SaveRow status={status} disabled={!isDirty || status === 'saving'} errorText={L(T.saveFailedRetry)} />
        </form>
      </Card>
    </div>
  );
};

export default Settings;
