/** Shop helpers shared by the shop list, shop page and add-shop form */
import { Alert, Linking } from 'react-native';
import { Tri } from '../i18n/tri';
import { MobileLanguage } from '../i18n/mobileTranslations';
import { ROUTE_DAYS } from '../services/lineService';
import { routeDayName } from '../utils/format';
import { Shop } from '../types';

export const EVERY_DAY: Tri = { uz: 'Har kuni', uz_cyrl: 'Ҳар куни', ru: 'Каждый день' };
export const PKO_LABEL: Tri = { uz: 'PKO', uz_cyrl: 'ПКО', ru: 'ПКО' };

/** Visit day in the current language. The DB keeps Latin names in visitDay, so prefer routeDay. */
export const shopDayLabel = (shop: Shop, lang: MobileLanguage): string => {
  if (shop.routeDay) return routeDayName(shop.routeDay, lang);
  const idx = ROUTE_DAYS.indexOf(shop.visitDay);
  return idx >= 0 ? routeDayName(idx + 1, lang) : EVERY_DAY[lang];
};

/** Route code like "4-3-6", or null for shops added on the phone */
export const shopRouteCode = (shop: Shop): string | null =>
  shop.lineCode && shop.routeDay ? `${shop.lineCode}-${shop.routeDay}` : null;

/** Some shops have two numbers: "+998 90 111 22 33, +998 91 444 55 66" */
export const splitPhones = (phone?: string): string[] =>
  (phone || '')
    .split(/[,;/]/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, '').length >= 5);

export const dialPhone = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);

/** Calls the shop; asks which number when there are several */
export const callShop = (shop: Shop, title: string, cancel: string) => {
  const phones = splitPhones(shop.phone);
  if (phones.length === 0) return;
  if (phones.length === 1) {
    dialPhone(phones[0]);
    return;
  }
  Alert.alert(title, shop.name, [
    ...phones.map((p) => ({ text: p, onPress: () => dialPhone(p) })),
    { text: cancel, style: 'cancel' as const },
  ]);
};
