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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <h3 className="font-medium text-xs text-slate-800">{t('badge_modal_title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-5 flex flex-col items-center bg-slate-50/50" id="print-section">
          {/* Badge Container */}
          <div className="w-72 bg-white border border-slate-200/80 rounded-lg shadow-xs overflow-hidden flex flex-col items-center text-center">
            {/* Badge Top Header */}
            <div className="w-full bg-slate-900 text-white py-2 px-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white p-0.5 shrink-0 overflow-hidden">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xs" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-medium text-white leading-tight">
                    {t('badge_brand')}
                  </div>
                  <div className="text-[9px] font-normal text-slate-400">
                    {t('badge_sub')}
                  </div>
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            {/* Agent Info */}
            <div className="pt-4 pb-2 px-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden mb-2 bg-slate-100 flex items-center justify-center">
                {agent.avatarUrl ? (
                  <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-medium text-slate-600">{agent.name.charAt(0)}</span>
                )}
              </div>

              <h4 className="text-sm font-medium text-slate-900 leading-tight">{agent.name}</h4>
              <div className="inline-block bg-slate-50 text-slate-600 text-[10px] font-normal px-2 py-0.5 rounded border border-slate-200 mt-1 font-mono">
                {agent.code}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{agent.territory}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{agent.phone}</span>
              </div>
            </div>

            {/* QR Code Frame */}
            <div className="my-2.5 p-2 bg-white border border-slate-200 rounded-md">
              <QRCodeSVG
                value={qrPayload}
                size={136}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Badge Footer */}
            <div className="w-full bg-slate-50 border-t border-slate-100 py-1.5 text-[9px] text-slate-400 font-normal">
              {t('badge_footer')}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-normal text-slate-600 hover:bg-slate-100 rounded-md transition"
          >
            {t('btn_close')}
          </button>
          <button
            onClick={handlePrint}
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
