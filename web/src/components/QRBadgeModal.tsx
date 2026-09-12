import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Agent } from '../types';
import { X, Printer, ShieldCheck, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface QRBadgeModalProps {
  agent: Agent | null;
  onClose: () => void;
}

export const QRBadgeModal: React.FC<QRBadgeModalProps> = ({ agent, onClose }) => {
  const { t } = useLanguage();
  if (!agent) return null;

  const handlePrint = () => {
    window.print();
  };

  // QR Code payload (can be scanned by the mobile app QRScannerScreen)
  const qrPayload = JSON.stringify({
    id: agent.id,
    code: agent.code,
    name: agent.name,
    phone: agent.phone,
    territory: agent.territory,
  });

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-display font-bold text-sm text-slate-800 tracking-tight">{t('badge_modal_title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-5 flex flex-col items-center bg-slate-50/80" id="print-section">
          {/* Badge Container (Enterprise ID Badge style) */}
          <div className="w-76 bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden flex flex-col items-center text-center">
            {/* Badge Top Header with Official Logo */}
            <div className="w-full bg-[#090d16] text-white py-2.5 px-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white p-0.5 shadow-2xs shrink-0 overflow-hidden">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-display font-black tracking-wider text-amber-400 uppercase leading-tight">
                    {t('badge_brand')}
                  </div>
                  <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                    {t('badge_sub')}
                  </div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>

            {/* Agent Info */}
            <div className="pt-3.5 pb-2 px-3.5 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border border-slate-200 overflow-hidden shadow-2xs mb-2 bg-slate-100 flex items-center justify-center">
                {agent.avatarUrl ? (
                  <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-slate-600">{agent.name.charAt(0)}</span>
                )}
              </div>

              <h4 className="font-display text-sm font-bold text-slate-900 leading-tight">{agent.name}</h4>
              <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 mt-1 font-mono">
                {agent.code}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{agent.territory}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{agent.phone}</span>
              </div>
            </div>

            {/* QR Code Frame */}
            <div className="my-2.5 p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
              <QRCodeSVG
                value={qrPayload}
                size={148}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Badge Footer */}
            <div className="w-full bg-slate-50 border-t border-slate-200 py-1.5 text-[9px] text-slate-500 font-medium">
              {t('badge_footer')}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-end gap-2.5 no-print">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
          >
            {t('btn_close')}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('btn_print')}
          </button>
        </div>
      </div>
    </div>
  );
};
