import { apiClient } from './apiClient';
import { shopRepository } from '../database/shopRepository';
import { Shop, UserRole } from '../types';

// Route day number (1-6) -> visit day label used across the app
export const ROUTE_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

/** Today's route day: 1 = Dushanba ... 6 = Shanba, null on Sunday */
export const todayRouteDay = (): number | null => {
  const jsDay = new Date().getDay(); // 0 = Sunday
  return jsDay === 0 ? null : jsDay;
};

interface ServerLine {
  id: string;
  code: string;
}

interface ServerClient {
  id: string;
  num?: number;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  lineCode?: string;
  day?: number;
  notes?: string;
  debtBalance?: number;
}

/**
 * Reads a line code from a scanned QR payload or typed text.
 * Line QR codes from the website are JSON: { type: 'line', id, line: '4-3', ... }
 */
export const parseLineCode = (raw: string): string | null => {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.line === 'string') return parsed.line.trim();
  } catch {
    // not JSON, treat as typed code
  }
  const match = text.replace(/^(LINE|DRIVER)-/i, '').match(/^(\d+)\s*[-.]\s*(\d+)$/);
  return match ? `${match[1]}-${match[2]}` : null;
};

/**
 * Reads line and role from a scanned line QR. The website prints two codes per line;
 * the driver code carries role "driver". A typed "4-3" signs in as agent, "DRIVER-4-3" as driver.
 */
export const parseLineQR = (raw: string): { lineCode: string; role: UserRole } | null => {
  const lineCode = parseLineCode(raw);
  if (!lineCode) return null;
  const text = raw.trim();
  let role: UserRole = /^DRIVER-/i.test(text) ? 'driver' : 'agent';
  try {
    const parsed = JSON.parse(text);
    if (parsed && (parsed.role === 'driver' || /^DRIVER-/i.test(String(parsed.code || '')))) role = 'driver';
  } catch {
    // typed code
  }
  return { lineCode, role };
};

export const lineService = {
  /** Checks the line exists on the server. Returns its id, or null if unknown. */
  findLine: async (lineCode: string): Promise<ServerLine | null> => {
    const res = await apiClient.get('/lines', { timeout: 8000 });
    const lines: ServerLine[] = res.data?.lines || [];
    return lines.find((l) => l.code === lineCode) || null;
  },

  /** Downloads all shops of the line (every week day) and stores them on the phone. */
  downloadShops: async (lineCode: string): Promise<number> => {
    const res = await apiClient.get('/clients', { params: { line: lineCode }, timeout: 15000 });
    const clients: ServerClient[] = res.data?.clients || [];
    const now = new Date().toISOString();
    const shops: Shop[] = clients.map((c) => ({
      id: c.id,
      name: c.name,
      ownerName: c.ownerName || '',
      phone: c.phone || '',
      address: c.address || '',
      latitude: c.latitude,
      longitude: c.longitude,
      debtBalance: c.debtBalance || 0,
      visitDay: c.day ? ROUTE_DAYS[c.day - 1] : 'Barchasi',
      createdAt: now,
      isSynced: true,
      lineCode,
      routeDay: c.day,
      num: c.num,
      notes: c.notes,
    }));
    shopRepository.replaceLineShops(lineCode, shops);
    return shops.length;
  },
};
