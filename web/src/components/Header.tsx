import React from 'react';
import { Calendar, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface HeaderProps {
  title: string;
  subtitle?: string;
  totalTodaySales: number;
  activeAgentsCount: number;
  isServerConnected?: boolean;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  totalTodaySales,
  activeAgentsCount,
  isServerConnected = false,
  onResetData,
}) => {
  const { lang, setLang, t } = useLanguage();

  const getLocaleDate = () => {
    const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    return new Date().toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const languages: { id: Language; label: string }[] = [
    { id: 'uz', label: 'UZ' },
    { id: 'ru', label: 'RU' },
    { id: 'uz_cyrl', label: 'ЎЗ' },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200/70 px-6 flex items-center justify-between shrink-0 no-print z-10 select-none">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal hidden md:inline">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live Server Sync Indicator */}
        <div
          title={isServerConnected ? "Sync Server: Ulangan (192.168.1.47:3000)" : "Sync Server: Bogʻlanilmagan"}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal border transition bg-sky-50/80 border-sky-200/70 text-sky-800"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isServerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="hidden sm:inline">
            {isServerConnected ? 'Server: Ulangan' : 'Kutishda'}
          </span>
        </div>

        {/* Quick Sales Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-slate-50/80 border border-slate-200/60 rounded-md text-xs text-slate-600 font-normal">
          <span className="text-slate-400">{t('today_sales')}:</span>
          <span className="text-sky-700 font-medium tabular-nums">
            {totalTodaySales.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')} {t('som')}
          </span>
        </div>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-normal">
          <Calendar className="w-3.5 h-3.5 stroke-[1.6]" />
          <span className="capitalize">{getLocaleDate()}</span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md border border-slate-200/60">
          {languages.map((l) => {
            const isSelected = lang === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`px-2 py-0.5 rounded text-[11px] transition ${
                  isSelected
                    ? 'bg-sky-600 text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 font-normal'
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Reset Button */}
        {onResetData && (
          <button
            onClick={onResetData}
            title="Barcha ma'lumotlarni 0 qilish"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.6]" />
          </button>
        )}

        {/* Admin Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200/70">
          <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium flex items-center justify-center border border-sky-200/70">
            A
          </div>
          <span className="text-xs text-slate-600 font-normal hidden sm:inline">
            {t('admin_role')}
          </span>
        </div>
      </div>
    </header>
  );
};
