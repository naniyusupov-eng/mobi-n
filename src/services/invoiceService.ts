import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order, Shop } from '../types';
import { useLanguageStore } from '../store/languageStore';
import { PAYMENT_LABELS, Tri, UNIT_LABELS, pick } from '../i18n/tri';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../utils/format';

// Receipt texts in the three app languages; the receipt follows the app language
const T = {
  title: { uz: 'Hisob cheki', uz_cyrl: 'Ҳисоб чеки', ru: 'Товарный чек' },
  number: { uz: 'Chek raqami', uz_cyrl: 'Чек рақами', ru: 'Номер чека' },
  date: { uz: 'Sana', uz_cyrl: 'Сана', ru: 'Дата' },
  delivery: { uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' },
  shop: { uz: 'Doʻkon', uz_cyrl: 'Дўкон', ru: 'Магазин' },
  owner: { uz: 'Egasi', uz_cyrl: 'Эгаси', ru: 'Владелец' },
  address: { uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' },
  line: { uz: 'Liniya', uz_cyrl: 'Линия', ru: 'Линия' },
  payment: { uz: 'Toʻlov', uz_cyrl: 'Тўлов', ru: 'Оплата' },
  product: { uz: 'Mahsulot', uz_cyrl: 'Маҳсулот', ru: 'Товар' },
  qty: { uz: 'Miqdor', uz_cyrl: 'Миқдор', ru: 'Кол-во' },
  price: { uz: 'Narx', uz_cyrl: 'Нарх', ru: 'Цена' },
  sum: { uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' },
  subtotal: { uz: 'Tovarlar summasi', uz_cyrl: 'Товарлар суммаси', ru: 'Сумма товаров' },
  discount: { uz: 'Chegirma', uz_cyrl: 'Чегирма', ru: 'Скидка' },
  promo: { uz: 'Aksiya', uz_cyrl: 'Акция', ru: 'Акция' },
  total: { uz: 'Jami toʻlov', uz_cyrl: 'Жами тўлов', ru: 'Итого к оплате' },
  debt: { uz: 'Doʻkonning umumiy qarzi', uz_cyrl: 'Дўконнинг умумий қарзи', ru: 'Общий долг магазина' },
  notes: { uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Примечание' },
  thanks: { uz: 'Xaridingiz uchun rahmat!', uz_cyrl: 'Харидингиз учун раҳмат!', ru: 'Спасибо за покупку!' },
  share: { uz: 'Hisob cheki', uz_cyrl: 'Ҳисоб чеки', ru: 'Чек' },
} satisfies Record<string, Tri>;

// Shop names and notes are user data: keep them from breaking the HTML
const esc = (s: string | undefined | null) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const invoiceService = {
  generateInvoiceHtml: (order: Order, shop?: Shop | null): string => {
    const lang = useLanguageStore.getState().lang;
    const L = (t: Tri) => pick(t, lang);
    const money = (n: number) => formatMoney(n, lang);

    const rows = (order.items || [])
      .map(
        (item, i) => `
        <tr>
          <td class="muted">${i + 1}</td>
          <td>${esc(item.productName)}</td>
          <td class="c">${formatNumber(item.quantity)} ${L(UNIT_LABELS[item.unit] || UNIT_LABELS.dona)}</td>
          <td class="r">${formatNumber(item.unitPrice)}</td>
          <td class="r b">${formatNumber(item.totalPrice)}</td>
        </tr>`
      )
      .join('');

    // Promotions are part of discountAmount; the rest of it is the agent's own discount
    const promos = (order.promos || []).filter((p) => p.amount > 0);
    const promoSum = promos.reduce((s, p) => s + p.amount, 0);
    const manualDiscount = Math.max(0, order.discountAmount - promoSum);
    const promoRows = promos
      .map((p) => `<tr><td class="label red">${L(T.promo)}: ${esc(p.name)}</td><td class="val r red">-${money(p.amount)}</td></tr>`)
      .join('');

    const info = (label: Tri, value: string, cls = '') =>
      `<tr><td class="label">${L(label)}</td><td class="val ${cls}">${value}</td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${L(T.title)} #${order.id.slice(-8).toUpperCase()}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; padding: 24px; margin: 0; }
  .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 14px; }
  .brand { font-size: 20px; font-weight: 800; color: #0369a1; margin: 0; }
  .sub { font-size: 12px; color: #64748b; margin: 4px 0 0; }
  table { width: 100%; border-collapse: collapse; }
  .info td { padding: 3px 0; font-size: 13px; vertical-align: top; }
  .label { color: #64748b; width: 34%; }
  .val { font-weight: 600; }
  .items { margin: 14px 0; }
  .items th { background: #f1f5f9; padding: 7px 4px; font-size: 11px; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1; }
  .items td { padding: 7px 4px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
  .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; } .muted { color: #94a3b8; }
  .totals { border-top: 1px dashed #cbd5e1; }
  .totals td { padding: 4px 0; font-size: 13px; }
  .grand td { font-size: 16px; font-weight: 800; color: #0369a1; padding-top: 6px; }
  .red { color: #e11d48; } .green { color: #16a34a; }
  .notes { margin-top: 12px; font-size: 12px; color: #475569; background: #f8fafc; padding: 8px; border-radius: 6px; }
  .footer { margin-top: 22px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <p class="brand">RCandy</p>
    <p class="sub">${L(T.title)} • #${order.id.slice(-8).toUpperCase()}</p>
  </div>

  <table class="info">
    ${info(T.date, formatDateTime(order.createdAt, lang))}
    ${order.deliveryDate ? info(T.delivery, formatDate(order.deliveryDate, lang)) : ''}
    ${info(T.shop, esc(order.shopName))}
    ${shop?.ownerName ? info(T.owner, `${esc(shop.ownerName)}${shop.phone ? ` • ${esc(shop.phone)}` : ''}`) : ''}
    ${shop?.address ? info(T.address, esc(shop.address)) : ''}
    ${shop?.lineCode && shop.routeDay ? info(T.line, `${esc(shop.lineCode)}-${shop.routeDay}`) : ''}
    ${info(T.payment, L(PAYMENT_LABELS[order.paymentMethod]), order.paymentMethod === 'nasiya' ? 'red' : 'green')}
  </table>

  <table class="items">
    <thead><tr><th style="width:22px">#</th><th>${L(T.product)}</th><th class="c">${L(T.qty)}</th><th class="r">${L(T.price)}</th><th class="r">${L(T.sum)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    <tr><td class="label">${L(T.subtotal)}</td><td class="val r">${money(order.totalAmount)}</td></tr>
    ${manualDiscount > 0 ? `<tr><td class="label red">${L(T.discount)}</td><td class="val r red">-${money(manualDiscount)}</td></tr>` : ''}
    ${promoRows}
    <tr class="grand"><td>${L(T.total)}</td><td class="r">${money(order.finalAmount)}</td></tr>
    ${shop && shop.debtBalance > 0 ? `<tr><td class="label red">${L(T.debt)}</td><td class="val r red">${money(shop.debtBalance)}</td></tr>` : ''}
  </table>

  ${order.notes ? `<div class="notes"><strong>${L(T.notes)}:</strong> ${esc(order.notes)}</div>` : ''}

  <div class="footer">${L(T.thanks)}</div>
</body>
</html>`;
  },

  printOrSharePdf: async (order: Order, shop?: Shop | null): Promise<void> => {
    const html = invoiceService.generateInvoiceHtml(order, shop);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      const lang = useLanguageStore.getState().lang;
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${pick(T.share, lang)} — ${order.shopName}`,
      });
    } else {
      await Print.printAsync({ html });
    }
  },
};
