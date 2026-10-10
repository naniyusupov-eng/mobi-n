import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, Line } from '../types';
import { Search, MapPin, Route, Store, QrCode, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LineQRModal } from '../components/LineQRModal';

const API = 'http://localhost:3000/api/v1';

const DAYS = [
  { day: 1, label: 'Dushanba' },
  { day: 2, label: 'Seshanba' },
  { day: 3, label: 'Chorshanba' },
  { day: 4, label: 'Payshanba' },
  { day: 5, label: 'Juma' },
  { day: 6, label: 'Shanba' },
];


export const Clients: React.FC = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [lineFilter, setLineFilter] = useState('');
  const [dayFilter, setDayFilter] = useState<number | ''>('');
  const [qrLine, setQrLine] = useState<Line | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/clients`).then((r) => r.json()),
      fetch(`${API}/lines`).then((r) => r.json()),
    ])
      .then(([c, l]) => {
        setClients(c.clients || []);
        setLines(l.lines || []);
        setError('');
      })
      .catch(() => setError('Serverga ulanib boʻlmadi (localhost:3000). Server ishga tushirilganini tekshiring.'));
  }, []);

  // Shops are shown only for one route at a time: a line and a week day must both be chosen
  const isRouteSelected = Boolean(lineFilter && dayFilter);

  const routeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSearch('');
    // The line cards take most of the screen, so bring the opened route into view
    if (lineFilter && dayFilter) routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lineFilter, dayFilter]);

  const filteredClients = useMemo(() => {
    if (!lineFilter || !dayFilter) return [];
    const q = search.toLowerCase();
    return clients
      .filter((c) => {
        if (c.lineCode !== lineFilter || c.day !== dayFilter) return false;
        return (
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.ownerName || '').toLowerCase().includes(q) ||
          (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          (c.address || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.num || 0) - (b.num || 0));
  }, [clients, search, lineFilter, dayFilter]);

  const countFor = (lineCode: string, day?: number) =>
    clients.filter((c) => c.lineCode === lineCode && (!day || c.day === day)).length;

  return (
    <div className="space-y-3.5">
      {error && (
        <div className="px-3.5 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">{error}</div>
      )}

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">Jami doʻkonlar</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">{clients.length} ta</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Store className="w-4 h-4 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">Liniyalar</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">{lines.length} ta</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Route className="w-4 h-4 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* 2. Lines with QR */}
      {lines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`bg-white rounded-lg border p-3 shadow-2xs transition ${
                lineFilter === line.code ? 'border-sky-400' : 'border-slate-200/70 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setLineFilter(lineFilter === line.code ? '' : line.code);
                    setDayFilter('');
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-semibold font-mono text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                    {line.code}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">{countFor(line.code)} ta doʻkon</span>
                </button>
                <button
                  onClick={() => setQrLine(line)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-sky-50 hover:text-sky-900 hover:border-sky-200 text-slate-700 rounded-md text-xs border border-slate-200/80 transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-600 stroke-[1.6]" />
                  <span>QR kod</span>
                </button>
              </div>
              <div className="mt-2.5 grid grid-cols-6 gap-1">
                {DAYS.map((d) => {
                  const active = lineFilter === line.code && dayFilter === d.day;
                  return (
                    <button
                      key={d.day}
                      title={`${line.code}-${d.day} • ${d.label}`}
                      onClick={() => {
                        setLineFilter(line.code);
                        setDayFilter(active ? '' : d.day);
                      }}
                      className={`py-1 rounded text-center border transition ${
                        active
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-sky-300'
                      }`}
                    >
                      <span className="block text-[9px] font-mono opacity-70">
                        {line.code}-{d.day}
                      </span>
                      <span className="block text-[11px] font-medium tabular-nums">{countFor(line.code, d.day)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Shops of the selected route (line + week day) */}
      {!isRouteSelected ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 py-8 text-center shadow-2xs">
          <Route className="w-5 h-5 text-slate-300 mx-auto mb-2 stroke-[1.6]" />
          <p className="text-xs text-slate-500">
            {lineFilter ? (
              <>
                <span className="font-mono font-semibold text-sky-800">{lineFilter}</span> liniya uchun hafta kunini tanlang
              </>
            ) : (
              'Doʻkonlarni koʻrish uchun liniya va hafta kunini tanlang'
            )}
          </p>
        </div>
      ) : (
      <>
      <div ref={routeRef} className="scroll-mt-4 bg-white p-2.5 rounded-lg border border-slate-200/70 flex flex-wrap items-center gap-2 shadow-2xs">
        <span className="text-sm font-semibold font-mono text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
          {lineFilter}-{dayFilter}
        </span>
        <span className="text-xs text-slate-600">{DAYS.find((d) => d.day === dayFilter)?.label}</span>
        <div className="relative w-full sm:w-72 sm:ml-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.6]" />
          <input
            type="text"
            placeholder="Nomi, egasi, telefon yoki manzil"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/70 rounded-md text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:bg-white"
          />
        </div>
        <span className="ml-auto text-[11px] text-slate-400 tabular-nums">{filteredClients.length} ta doʻkon</span>
        <button
          onClick={() => {
            setDayFilter('');
            setSearch('');
          }}
          title="Yopish"
          className="p-1 text-slate-400 hover:text-slate-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Clients Table */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="py-2.5 px-3.5 w-12 text-center">№</th>
                <th className="py-2.5 px-3.5">{t('col_shop_name')}</th>
                <th className="py-2.5 px-3.5">Ism-familiya</th>
                <th className="py-2.5 px-3.5">{t('col_phone')}</th>
                <th className="py-2.5 px-3.5">{t('col_address')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5}className="py-8 text-center text-slate-400">
                    {search ? 'Qidiruv boʻyicha doʻkon topilmadi' : 'Bu marshrutda doʻkonlar yoʻq'}
                  </td>
                </tr>
              )}
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-sky-50/20 transition">
                  <td className="py-2.5 px-3.5 text-center text-slate-500 font-mono tabular-nums">{c.num == null ? '—' : Number.isInteger(c.num) ? c.num : `${Math.floor(c.num)}a`}</td>
                  <td className="py-2.5 px-3.5 font-medium text-slate-900">
                    {c.name}
                    {c.notes && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-normal whitespace-nowrap">
                        {c.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">{c.ownerName || <span className="text-slate-300">—</span>}</td>
                  <td className="py-2.5 px-3.5 text-slate-500 tabular-nums">
                    {c.phone ? (
                      c.phone.split(', ').map((p) => (
                        <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block whitespace-nowrap hover:text-sky-700">
                          {p}
                        </a>
                      ))
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {c.latitude != null && c.longitude != null && (
                        <a
                          href={`https://yandex.uz/maps/?pt=${c.longitude},${c.latitude}&z=17&l=map`}
                          target="_blank"
                          rel="noreferrer"
                          title="Xaritada ochish"
                          className="text-sky-600 hover:text-sky-800 shrink-0"
                        >
                          <MapPin className="w-3.5 h-3.5 stroke-[1.6]" />
                        </a>
                      )}
                      <span>{c.address}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      <LineQRModal line={qrLine} clientsCount={qrLine ? countFor(qrLine.code) : 0} onClose={() => setQrLine(null)} />
    </div>
  );
};

export default Clients;
