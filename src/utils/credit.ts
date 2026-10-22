import { Shop } from '../types';
import { MobileLanguage } from '../i18n/mobileTranslations';
import { pick, Tri } from '../i18n/tri';
import { formatMoney } from './format';

export const CREDIT_TX = {
  overdueBadge: { uz: 'Muddati oʻtgan', uz_cyrl: 'Муддати ўтган', ru: 'Просрочен' },
  overLimitBadge: { uz: 'Limitdan oshgan', uz_cyrl: 'Лимитдан ошган', ru: 'Лимит превышен' },
  closedBadge: { uz: 'Nasiya yopiq', uz_cyrl: 'Насия ёпиқ', ru: 'Долг закрыт' },
  limit: { uz: 'Qarz limiti', uz_cyrl: 'Қарз лимити', ru: 'Лимит долга' },
  debtAge: { uz: 'Qarz muddati', uz_cyrl: 'Қарз муддати', ru: 'Срок долга' },
  days: { uz: 'kun', uz_cyrl: 'кун', ru: 'дн.' },
} satisfies Record<string, Tri>;

/** "21 kun" */
export const formatDebtDays = (days: number, lang: MobileLanguage) => `${days} ${pick(CREDIT_TX.days, lang)}`;

/** How much nasiya is still allowed (null = no limit). Uses the local debt, which includes queued orders. */
export const creditLeft = (shop: Shop): number | null => {
  const limit = shop.creditLimit || 0;
  if (limit <= 0) return null;
  return Math.max(0, limit - (shop.debtBalance || 0));
};

/** Nasiya closed for this shop even before any new order (server block, or local debt already at the limit) */
export const isCreditClosed = (shop: Shop) =>
  !!shop.creditBlocked || ((shop.creditLimit || 0) > 0 && (shop.debtBalance || 0) >= (shop.creditLimit || 0));

/**
 * Why nasiya is not allowed for this order, or null when it is.
 * Blocked when the server says creditBlocked, or the limit is set and debt + order > limit.
 */
export const nasiyaBlockReason = (shop: Shop | null, orderTotal: number, lang: MobileLanguage): string | null => {
  if (!shop) return null;
  const limit = shop.creditLimit || 0;
  const exceedsLimit = limit > 0 && (shop.debtBalance || 0) + orderTotal > limit;
  if (!shop.creditBlocked && !exceedsLimit) return null;

  if (shop.overdue && shop.debtDays != null) {
    return pick(
      {
        uz: `Qarz ${shop.debtDays} kundan beri toʻlanmagan`,
        uz_cyrl: `Қарз ${shop.debtDays} кундан бери тўланмаган`,
        ru: `Долг не оплачен ${shop.debtDays} дн.`,
      },
      lang
    );
  }
  if (limit > 0) {
    const limitText = formatMoney(limit, lang);
    const leftText = formatMoney(creditLeft(shop) ?? 0, lang);
    return pick(
      {
        uz: `Qarz limiti: ${limitText}, qoldi: ${leftText}`,
        uz_cyrl: `Қарз лимити: ${limitText}, қолди: ${leftText}`,
        ru: `Лимит долга: ${limitText}, осталось: ${leftText}`,
      },
      lang
    );
  }
  return pick(CREDIT_TX.closedBadge, lang);
};
