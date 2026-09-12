import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order, Shop } from '../types';

export const invoiceService = {
  formatCurrency: (amount: number): string => {
    return amount.toLocaleString('uz-UZ') + " so'm";
  },

  generateInvoiceHtml: (order: Order, shop?: Shop | null): string => {
    const itemsHtml = (order.items || [])
      .map(
        (item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 4px; font-size: 13px;">${index + 1}</td>
          <td style="padding: 8px 4px; font-size: 13px; font-weight: 500;">${item.productName}</td>
          <td style="padding: 8px 4px; font-size: 13px; text-align: center;">${item.quantity} ${item.unit}</td>
          <td style="padding: 8px 4px; font-size: 13px; text-align: right;">${item.unitPrice.toLocaleString('uz-UZ')}</td>
          <td style="padding: 8px 4px; font-size: 13px; text-align: right; font-weight: 600;">${item.totalPrice.toLocaleString('uz-UZ')}</td>
        </tr>
      `
      )
      .join('');

    const paymentLabel =
      order.paymentMethod === 'naqd'
        ? 'Naqd pul'
        : order.paymentMethod === 'nasiya'
        ? 'Nasiya (Qarzga)'
        : "Pul o'tkazish (Bank)";

    const formattedDate = new Date(order.createdAt).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Buyurtma Cheki - ${order.id}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 24px;
            margin: 0;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #d97706;
            margin: 0 0 4px 0;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
          .info-table {
            width: 100%;
            margin-bottom: 16px;
            font-size: 13px;
          }
          .info-table td {
            padding: 3px 0;
          }
          .label {
            color: #64748b;
            width: 35%;
          }
          .val {
            font-weight: 600;
            color: #0f172a;
          }
          table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            margin-bottom: 16px;
          }
          table.items th {
            background-color: #f1f5f9;
            padding: 8px 4px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            border-bottom: 1px solid #cbd5e1;
          }
          .totals {
            width: 100%;
            margin-top: 12px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
          }
          .totals td {
            padding: 4px 0;
            font-size: 13px;
          }
          .total-highlight {
            font-size: 16px !important;
            font-weight: 800 !important;
            color: #d97706 !important;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="brand-title">Mobi_R Qandolat</h1>
          <p class="brand-sub">Savdo agentligi hisob-fakturasi</p>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">Chek raqami:</td>
            <td class="val">#${order.id.slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td class="label">Sana va vaqt:</td>
            <td class="val">${formattedDate}</td>
          </tr>
          <tr>
            <td class="label">Doʻkon (Mijoz):</td>
            <td class="val">${order.shopName}</td>
          </tr>
          ${shop?.ownerName ? `<tr><td class="label">Doʻkon egasi:</td><td class="val">${shop.ownerName} (${shop.phone})</td></tr>` : ''}
          ${shop?.address ? `<tr><td class="label">Manzil:</td><td class="val">${shop.address}</td></tr>` : ''}
          <tr>
            <td class="label">Savdo agenti:</td>
            <td class="val">${order.agentName}</td>
          </tr>
          <tr>
            <td class="label">Toʻlov turi:</td>
            <td class="val" style="color: ${order.paymentMethod === 'nasiya' ? '#dc2626' : '#16a34a'};">${paymentLabel}</td>
          </tr>
        </table>

        <table class="items">
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th style="text-align: left;">Mahsulot</th>
              <th>Miqdor</th>
              <th style="text-align: right;">Narxi</th>
              <th style="text-align: right;">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table class="totals">
          <tr>
            <td class="label">Tovarlar summasi:</td>
            <td class="val" style="text-align: right;">${order.totalAmount.toLocaleString('uz-UZ')} so'm</td>
          </tr>
          ${order.discountAmount > 0 ? `
          <tr>
            <td class="label" style="color: #dc2626;">Chegirma:</td>
            <td class="val" style="text-align: right; color: #dc2626;">-${order.discountAmount.toLocaleString('uz-UZ')} so'm</td>
          </tr>` : ''}
          <tr>
            <td class="label total-highlight">Jami toʻlov:</td>
            <td class="val total-highlight" style="text-align: right;">${order.finalAmount.toLocaleString('uz-UZ')} so'm</td>
          </tr>
          ${shop && shop.debtBalance > 0 ? `
          <tr>
            <td class="label" style="color: #dc2626; padding-top: 8px;">Mijozning umumiy qarzi:</td>
            <td class="val" style="text-align: right; color: #dc2626; padding-top: 8px;">${shop.debtBalance.toLocaleString('uz-UZ')} so'm</td>
          </tr>` : ''}
        </table>

        ${order.notes ? `
          <div style="margin-top: 12px; font-size: 12px; color: #475569; background: #f8fafc; padding: 8px; border-radius: 6px;">
            <strong>Izoh:</strong> ${order.notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>Xaridingiz uchun rahmat! Qandolat mahsulotlarimiz sizga yoqimli boʻlsin.</p>
          <p>Mobi_R savdo agenti tizimi orqali yaratildi</p>
        </div>
      </body>
      </html>
    `;
  },

  printOrSharePdf: async (order: Order, shop?: Shop | null): Promise<void> => {
    try {
      const html = invoiceService.generateInvoiceHtml(order, shop);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `${order.shopName} uchun hisob cheki`,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.warn('Chek chiqarishda xatolik:', error);
      throw error;
    }
  },
};
