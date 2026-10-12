import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Route, ScanLine } from 'lucide-react';
import { Line } from '../types';
import { Button, Modal, Pill } from './ui';

interface LineQRModalProps {
  line: Line | null;
  clientsCount: number;
  onClose: () => void;
}

// QR belongs to the line: any agent scans it in the mobile app and works with that line's routes.
export const LineQRModal: React.FC<LineQRModalProps> = ({ line, clientsCount, onClose }) => {
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
    <Modal
      open
      onClose={onClose}
      width="sm"
      title="Liniya QR kodi"
      subtitle="Agent mobil ilovada skanerlab liniyaga ulanadi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="no-print">
            Yopish
          </Button>
          <Button icon={Printer} onClick={() => window.print()} className="no-print">
            Chop etish
          </Button>
        </>
      }
    >
      <div id="print-section" className="flex justify-center rounded-card bg-canvas p-5">
        <div className="w-full max-w-[300px] bg-white rounded-card shadow-card overflow-hidden flex flex-col items-center text-center">
          <div className="w-full bg-brand-500 text-white px-5 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Route className="w-[18px] h-[18px]" strokeWidth={2} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-[15px] font-bold leading-tight truncate">Mobi_R</div>
              <div className="text-[11px] font-medium text-white/80 uppercase tracking-wide">Liniya QR kodi</div>
            </div>
          </div>

          <div className="pt-5 px-5">
            <div className="text-[44px] leading-none font-bold tracking-tight tabular-nums text-ink-900">{line.code}</div>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <Pill tone="brand">liniya</Pill>
              <Pill>
                {clientsCount} ta doʻkon • 6 kunlik marshrut
              </Pill>
            </div>
          </div>

          <div className="my-5 p-3 bg-white rounded-xl2 border border-ink-200">
            <QRCodeSVG value={qrPayload} size={176} level="M" includeMargin={false} />
          </div>

          <div className="w-full bg-ink-100/70 py-2.5 px-4 text-[11px] font-medium text-ink-500 flex items-center justify-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mobi_R ilovasida skanerlang va liniyaga ulaning</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
