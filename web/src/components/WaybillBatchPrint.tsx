import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CompanySettings, Order } from '../types';
import { Waybill } from './InvoiceModal';

/**
 * Prints several waybills at once, stacked one under another (about three per A4 page, a waybill
 * never split across pages), in route order. Render `node` somewhere in the page and call
 * `printWaybills(orders)`; the copies go straight into <body>, like the single waybill does.
 */
export const useWaybillPrint = (company: CompanySettings) => {
  const [batch, setBatch] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!batch) return;
    document.body.classList.add('printing-waybill');
    // Let the copies render first; window.print() blocks until the print dialog closes
    const timer = window.setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-waybill');
      setBatch(null);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [batch]);

  // Route order: line, week day, shop number — the order the driver visits them
  const printWaybills = useCallback((orders: Order[]) => {
    if (orders.length === 0) return;
    const sorted = [...orders].sort(
      (a, b) =>
        (a.lineCode || '').localeCompare(b.lineCode || '', undefined, { numeric: true }) ||
        (a.routeDay ?? 9) - (b.routeDay ?? 9) ||
        (a.shopNum ?? 9999) - (b.shopNum ?? 9999)
    );
    setBatch(sorted);
  }, []);

  const node = batch
    ? createPortal(
        <div className="waybill-print waybill-batch">
          {batch.map((o) => (
            <Waybill key={o.id} order={o} company={company} compact />
          ))}
        </div>,
        document.body
      )
    : null;

  return { printWaybills, node };
};
