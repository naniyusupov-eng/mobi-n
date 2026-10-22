import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Award, Building2, Check, Download, Languages, LogOut, ShieldCheck, Wallet } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { COMMON, Tri, useL } from '../i18n/tri';
import { CompanySettings } from '../types';
import { Button, Card, CardTitle, Field, IconCircle } from '../components/ui';
import { API, apiFetch, downloadBackup, signOut } from '../api';

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
  creditTitle: { uz: 'Qarz nazorati', uz_cyrl: 'Қарз назорати', ru: 'Контроль долгов' },
  creditSubtitle: {
    uz: 'Limitdan oshgan yoki qarzi muddati oʻtgan doʻkonga yangi nasiya berilmaydi',
    uz_cyrl: 'Лимитдан ошган ёки қарзи муддати ўтган дўконга янги насия берилмайди',
    ru: 'Магазину с превышенным лимитом или просроченным долгом новый долг не выдаётся',
  },
  creditLimitDefault: { uz: 'Standart qarz limiti', uz_cyrl: 'Стандарт қарз лимити', ru: 'Стандартный лимит долга' },
  creditLimitHint: { uz: '0 = limitsiz', uz_cyrl: '0 = лимитсиз', ru: '0 = без лимита' },
  debtMaxDays: { uz: 'Qarz muddati', uz_cyrl: 'Қарз муддати', ru: 'Срок долга' },
  debtMaxDaysHint: { uz: '0 = cheklovsiz', uz_cyrl: '0 = чекловсиз', ru: '0 = без ограничения' },
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
  securityTitle: { uz: 'Xavfsizlik', uz_cyrl: 'Хавфсизлик', ru: 'Безопасность' },
  securitySubtitle: {
    uz: 'Administrator hisobi, parol va zaxira nusxa',
    uz_cyrl: 'Администратор ҳисоби, парол ва захира нусха',
    ru: 'Учётная запись администратора, пароль и резервная копия',
  },
  signedInAs: { uz: 'Siz kirgansiz', uz_cyrl: 'Сиз киргансиз', ru: 'Вы вошли как' },
  signOut: { uz: 'Chiqish', uz_cyrl: 'Чиқиш', ru: 'Выйти' },
  changePassword: { uz: 'Parolni oʻzgartirish', uz_cyrl: 'Паролни ўзгартириш', ru: 'Сменить пароль' },
  currentPassword: { uz: 'Joriy parol', uz_cyrl: 'Жорий парол', ru: 'Текущий пароль' },
  newPassword: { uz: 'Yangi parol', uz_cyrl: 'Янги парол', ru: 'Новый пароль' },
  repeatPassword: { uz: 'Yangi parolni takrorlang', uz_cyrl: 'Янги паролни такрорланг', ru: 'Повторите новый пароль' },
  pwTooShort: { uz: 'Kamida 8 ta belgi', uz_cyrl: 'Камида 8 та белги', ru: 'Не менее 8 символов' },
  pwMismatch: { uz: 'Parollar mos kelmadi', uz_cyrl: 'Пароллар мос келмади', ru: 'Пароли не совпадают' },
  pwWrongCurrent: { uz: 'Joriy parol notoʻgʻri', uz_cyrl: 'Жорий парол нотўғри', ru: 'Неверный текущий пароль' },
  backupTitle: { uz: 'Zaxira nusxa', uz_cyrl: 'Захира нусха', ru: 'Резервная копия' },
  backupHint: {
    uz: 'Barcha maʼlumotlar bitta faylda (parollarsiz). Xavfsiz joyda saqlang.',
    uz_cyrl: 'Барча маълумотлар битта файлда (паролларсиз). Хавфсиз жойда сақланг.',
    ru: 'Все данные в одном файле (без паролей). Храните в надёжном месте.',
  },
  backupButton: { uz: 'Zaxira nusxani yuklab olish', uz_cyrl: 'Захира нусхани юклаб олиш', ru: 'Скачать резервную копию' },
  backupFailed: { uz: 'Yuklab boʻlmadi', uz_cyrl: 'Юклаб бўлмади', ru: 'Не удалось скачать' },
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

/** Signed-in admin, password change, sign out and database backup */
const SecurityCard: React.FC = () => {
  const L = useL();
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', repeat: '' });
  const [pwStatus, setPwStatus] = useState<SaveStatus>('idle');
  const [pwError, setPwError] = useState<Tri>(T.saveFailedRetry);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupFailed, setBackupFailed] = useState(false);

  useEffect(() => {
    apiFetch(`${API}/auth/me`)
      .then((r) => r.json())
      .then((d) => setUsername(d.username || ''))
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      setPwError(T.pwTooShort);
      return setPwStatus('error');
    }
    if (pw.next !== pw.repeat) {
      setPwError(T.pwMismatch);
      return setPwStatus('error');
    }
    setPwStatus('saving');
    try {
      // 401 here means a wrong current password, not a lost session
      const res = await apiFetch(
        `${API}/auth/password`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: pw.current, next: pw.next }) },
        { keepSessionOn401: true }
      );
      if (res.ok) {
        setPw({ current: '', next: '', repeat: '' });
        return setPwStatus('saved');
      }
      setPwError(res.status === 401 ? T.pwWrongCurrent : res.status === 400 ? T.pwTooShort : T.saveFailedRetry);
      setPwStatus('error');
    } catch {
      setPwError(T.saveFailedRetry);
      setPwStatus('error');
    }
  };

  const handleBackup = async () => {
    setBackupBusy(true);
    setBackupFailed(false);
    try {
      await downloadBackup();
    } catch {
      setBackupFailed(true);
    } finally {
      setBackupBusy(false);
    }
  };

  const editPw = (patch: Partial<typeof pw>) => {
    setPw({ ...pw, ...patch });
    setPwStatus('idle');
  };

  return (
    <Card className="min-w-0">
      <SectionTitle icon={ShieldCheck} tone="brand" title={L(T.securityTitle)} subtitle={L(T.securitySubtitle)} />

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl2 bg-ink-100/70">
        <div className="min-w-0">
          <div className="text-xs text-ink-400">{L(T.signedInAs)}</div>
          <div className="text-[15px] font-semibold text-ink-900 truncate">{username || '—'}</div>
        </div>
        <Button variant="danger" size="sm" icon={LogOut} onClick={() => signOut()}>
          {L(T.signOut)}
        </Button>
      </div>

      <form onSubmit={handleChangePassword} className="mt-5">
        <div className="text-[15px] font-semibold text-ink-900 mb-3">{L(T.changePassword)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field
              label={L(T.currentPassword)}
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => editPw({ current: e.target.value })}
            />
          </div>
          <Field
            label={L(T.newPassword)}
            type="password"
            autoComplete="new-password"
            hint={L(T.pwTooShort)}
            value={pw.next}
            onChange={(e) => editPw({ next: e.target.value })}
          />
          <Field
            label={L(T.repeatPassword)}
            type="password"
            autoComplete="new-password"
            value={pw.repeat}
            onChange={(e) => editPw({ repeat: e.target.value })}
          />
        </div>
        <SaveRow
          status={pwStatus}
          disabled={!pw.current || !pw.next || !pw.repeat || pwStatus === 'saving'}
          errorText={L(pwError)}
        />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-ink-100">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink-900">{L(T.backupTitle)}</div>
          <div className="text-[13px] text-ink-400 mt-0.5">{L(T.backupHint)}</div>
          {backupFailed && <div className="text-[13px] text-rose-600 mt-1">{L(T.backupFailed)}</div>}
        </div>
        <Button variant="secondary" icon={Download} onClick={handleBackup} disabled={backupBusy}>
          {backupBusy ? L(COMMON.loading) : L(T.backupButton)}
        </Button>
      </div>
    </Card>
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

  // Credit control: server default for debtMaxDays is 14 when unset
  const creditFrom = (c: CompanySettings) => ({
    limit: String(c.creditLimitDefault ?? 0),
    days: String(c.debtMaxDays ?? 14),
  });
  const [credit, setCredit] = useState(creditFrom(company));
  const [creditStatus, setCreditStatus] = useState<SaveStatus>('idle');

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
    setCredit((cur) => {
      const old = creditFrom(prev);
      return cur.limit === old.limit && cur.days === old.days ? creditFrom(company) : cur;
    });
  }, [company]);
  const bonusDirty = bonus.days !== bonusFrom(company).days || bonus.amount !== bonusFrom(company).amount;
  const creditDirty = credit.limit !== creditFrom(company).limit || credit.days !== creditFrom(company).days;
  const creditValid =
    Number.isInteger(Number(credit.limit)) && Number(credit.limit) >= 0 && Number.isInteger(Number(credit.days)) && Number(credit.days) >= 0;

  const handleSaveCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditStatus('saving');
    try {
      await onSaveCompany({ ...company, creditLimitDefault: Number(credit.limit) || 0, debtMaxDays: Number(credit.days) || 0 });
      setCreditStatus('saved');
    } catch {
      setCreditStatus('error');
    }
  };

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

        {/* Credit control */}
        <Card>
          <form onSubmit={handleSaveCredit}>
            <SectionTitle icon={Wallet} tone="amber" title={L(T.creditTitle)} subtitle={L(T.creditSubtitle)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={L(T.creditLimitDefault)}
                type="number"
                min={0}
                value={credit.limit}
                placeholder="0"
                suffix={L(COMMON.som)}
                hint={L(T.creditLimitHint)}
                className="tabular-nums"
                onChange={(e) => {
                  setCredit({ ...credit, limit: e.target.value });
                  setCreditStatus('idle');
                }}
              />
              <Field
                label={L(T.debtMaxDays)}
                type="number"
                min={0}
                value={credit.days}
                placeholder="14"
                suffix={L(T.days)}
                hint={L(T.debtMaxDaysHint)}
                className="tabular-nums"
                onChange={(e) => {
                  setCredit({ ...credit, days: e.target.value });
                  setCreditStatus('idle');
                }}
              />
            </div>
            <SaveRow
              status={creditStatus}
              disabled={!creditDirty || !creditValid || creditStatus === 'saving'}
              errorText={L(T.saveFailed)}
            />
          </form>
        </Card>
      </div>

      <div className="space-y-5 min-w-0">
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

        <SecurityCard />
      </div>
    </div>
  );
};

export default Settings;
