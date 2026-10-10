import React from 'react';
import { Check, Languages, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface SettingsProps {
  onResetData: () => void;
}

const LANGUAGES: { id: Language; label: string; sample: string }[] = [
  { id: 'uz', label: 'Oʻzbekcha (lotin)', sample: 'UZ' },
  { id: 'uz_cyrl', label: 'Ўзбекча (кирилл)', sample: 'ЎЗ' },
  { id: 'ru', label: 'Русский', sample: 'RU' },
];

export const Settings: React.FC<SettingsProps> = ({ onResetData }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="space-y-3.5 max-w-2xl">
      {/* Language */}
      <div className="bg-white rounded-lg border border-slate-200/70 shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Languages className="w-3.5 h-3.5 stroke-[1.8]" />
          </div>
          <h3 className="text-xs font-semibold text-slate-900">Til / Тил / Язык</h3>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((l) => {
            const isSelected = lang === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border text-xs text-left transition ${
                  isSelected
                    ? 'border-sky-400 bg-sky-50/60 text-sky-900 font-medium'
                    : 'border-slate-200/80 text-slate-600 hover:border-sky-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-7 text-center text-[10px] font-mono py-0.5 rounded ${
                      isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {l.sample}
                  </span>
                  {l.label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-lg border border-slate-200/70 shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
          </div>
          <h3 className="text-xs font-semibold text-slate-900">Maʼlumotlarni tozalash</h3>
        </div>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Barcha buyurtmalar oʻchiriladi va doʻkonlar qarzi 0 ga tushiriladi. Liniyalar va klientlar saqlanib qoladi.
          </p>
          <button
            onClick={onResetData}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition"
          >
            Tozalash
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
