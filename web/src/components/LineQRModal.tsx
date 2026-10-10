import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Line } from '../types';
import { X, Printer, Route } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LineQRModalProps {
  line: Line | null;
  clientsCount: number;
  onClose: () => void;
}

// QR belongs to the line: any agent scans it in the mobile app and works with that line's routes.
export const LineQRModal: React.FC<LineQRModalProps> = ({ line, clientsCount, onClose }) => {
  const { t } = useLanguage();
  if (!line) return null;

  // Payload is compatible with the mobile QRScannerScreen (needs id + name)
  const qrPayload = JSON.stringify({
    type: 'line',
    id: line.id,
    code: `LINE-${line.code}`,
    name: `${line.code} liniya`,
    territory: line.code,
    line: line.code,
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-slate-500" />
            <h3 className="font-medium text-xs text-slate-800">Liniya QR kodi</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center bg-slate-50/50" id="print-section">
          <div className="w-72 bg-white border border-slate-200/80 rounded-lg shadow-xs overflow-hidden flex flex-col items-center text-center">
            <div className="w-full bg-slate-900 text-white py-2 px-3.5 flex items-center gap-2 border-b border-slate-800">
              <div className="w-6 h-6 rounded bg-white p-0.5 shrink-0 overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xs" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-medium text-white leading-tight">{t('badge_brand')}</div>
                <div className="text-[9px] font-normal text-slate-400">{t('badge_sub')}</div>
              </div>
            </div>

            <div className="pt-4 pb-1 px-4">
              <div className="text-3xl font-semibold font-mono text-slate-900 tracking-tight">{line.code}</div>
              <div className="text-[11px] text-slate-500 mt-1">liniya • {clientsCount} ta doʻkon • 6 kunlik marshrut</div>
            </div>

            <div className="my-3 p-2 bg-white border border-slate-200 rounded-md">
              <QRCodeSVG value={qrPayload} size={168} level="M" includeMargin={false} />
            </div>

            <div className="w-full bg-slate-50 border-t border-slate-100 py-1.5 text-[9px] text-slate-400 font-normal">
              Mobi_R ilovasida skanerlang va liniyaga ulaning
            </div>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex justify-end gap-2 no-print">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-normal text-slate-600 hover:bg-slate-100 rounded-md transition">
            {t('btn_close')}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('btn_print')}
          </button>
        </div>
      </div>
    </div>
  );
};
