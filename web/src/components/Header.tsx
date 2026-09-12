import React from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface HeaderProps {
  title: string;
  subtitle?: string;
  totalTodaySales: number;
  activeAgentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  totalTodaySales,
  activeAgentsCount,
}) => {
  const { lang, setLang, t } = useLanguage();

  const getLocaleDate = () => {
    const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'uz', label: "Oʻzbek", flag: '🇺🇿' },
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
    { id: 'uz_cyrl', label: 'Ўзбекча', flag: '🇺🇿' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 no-print z-10 shadow-xs">
      <div>
        <h2 className="font-display text-lg sm:text-xl font-black text-slate-900 leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium hidden sm:block mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Stats Pill */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-semibold">
          <div>
            <span className="text-slate-400">{t('today_sales')} </span>
            <span className="text-blue-700 font-extrabold tabular-nums">
              {totalTodaySales.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')} {t('som')}
            </span>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div>
            <span className="text-slate-400">{t('active_agents')} </span>
            <span className="text-emerald-600 font-black tabular-nums">{activeAgentsCount}</span>
          </div>
        </div>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{getLocaleDate()}</span>
        </div>

        {/* Language Switcher Group */}
        <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
          {languages.map((l) => {
            const isSelected = lang === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{l.flag}</span>
                <span className="hidden md:inline">{l.label}</span>
              </button>
            );
          })}
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-md bg-blue-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
            ADM
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-extrabold text-slate-800 leading-none">{t('admin_role')}</div>
            <span className="text-[10px] text-slate-400 font-semibold">{t('office_name')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
