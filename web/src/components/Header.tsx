import React from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatToday } from '../utils/format';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { lang, t } = useLanguage();

  return (
    <header className="h-14 bg-white border-b border-slate-200/70 px-6 flex items-center justify-between shrink-0 no-print z-10 select-none">
      <div className="flex items-baseline gap-3 min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight truncate">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 font-normal hidden md:inline truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-normal">
          <Calendar className="w-3.5 h-3.5 stroke-[1.6]" />
          <span>{formatToday(lang)}</span>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200/70">
          <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium flex items-center justify-center border border-sky-200/70">
            A
          </div>
          <span className="text-xs text-slate-600 font-normal hidden sm:inline">{t('admin_role')}</span>
        </div>
      </div>
    </header>
  );
};
