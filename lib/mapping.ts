import { config } from '@/lib/config';
import type { ShopifyLineItem, ShopifyOrder } from '@/src/types/shopify';

export const SHEET_HEADERS = [
  'Customer*',
  'Sales Receipt No',
  'Sales Receipt Date',
  'Product/Service',
  'Description',
  'Qty',
  'Rate',
  'Tax',
  'Amount',
  'Memo',
  'Ship To State',
  'Order Id',
  'Line Item Id',
  'SKU',
  'Store'
] as const;

function isTexas(order: ShopifyOrder) {
  const provinceCode = order.shipping_address?.province_code ?? order.billing_address?.province_code ?? '';
  const province = order.shipping_address?.province ?? order.billing_address?.province ?? '';

  return provinceCode.toUpperCase() === 'TX' || province.trim().toUpperCase() === 'TEXAS';
}

function getShipState(order: ShopifyOrder) {
  return order.shipping_address?.province_code ?? order.billing_address?.province_code ?? '';
}

function money(value?: string | null) {
  return Number.parseFloat(value ?? '0').toFixed(2);
}

function lineTaxAmount(lineItem: ShopifyLineItem) {
  const tax = (lineItem.tax_lines ?? []).reduce((sum, taxLine) => {
    return sum + Number.parseFloat(taxLine.price ?? '0');
  }, 0);
  return tax.toFixed(2);
}

function description(lineItem: ShopifyLineItem) {
  return [lineItem.title ?? '', lineItem.variant_title ?? ''].filter(Boolean).join(' - ');
}

function orderReceiptNumber(order: ShopifyOrder) {
  return order.name || String(order.order_number || order.id);
}

function orderDate(order: ShopifyOrder) {
  const raw = config.useOrderPaidDate ? (order.processed_at ?? order.created_at) : order.created_at;
  if (!raw) return '';
  return new Date(raw).toISOString().slice(0, 10);
}

export function mapOrderToSheetRows(order: ShopifyOrder, storeDisplayName: string) {
  const tx = isTexas(order);
  const shipState = getShipState(order);
  const receiptNo = orderReceiptNumber(order);
  const salesReceiptDate = orderDate(order);

  return order.line_items.map((lineItem) => {
    const qty = Number(lineItem.quantity || 0);
    const rate = money(lineItem.price);
    const amount = (qty * Number.parseFloat(lineItem.price ?? '0')).toFixed(2);
    const tax = tx ? lineTaxAmount(lineItem) : (config.NON_TEXAS_TAX_MODE === 'zero' ? '0.00' : '');

    return {
      idempotencyKeyParts: {
        orderId: String(order.id),
        lineItemId: String(lineItem.id)
      },
      values: [
        storeDisplayName,
        receiptNo,
        salesReceiptDate,
        lineItem.sku || lineItem.title || 'Shopify Item',
        description(lineItem),
        String(qty),
        rate,
        tax,
        amount,
        receiptNo,
        shipState,
        String(order.id),
        String(lineItem.id),
        lineItem.sku || '',
        storeDisplayName
      ]
    };
  });
}
