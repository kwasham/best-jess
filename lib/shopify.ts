import crypto from 'node:crypto';

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null, secret: string) {
  if (!hmacHeader) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function buildLineItemIdempotencyKey(shopDomain: string, orderId: string, lineItemId: string) {
  return `${shopDomain}:${orderId}:${lineItemId}`;
}
