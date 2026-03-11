import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { appendRows, ensureHeaderRow } from '@/lib/google-sheets';
import { mapOrderToSheetRows } from '@/lib/mapping';
import { buildLineItemIdempotencyKey, verifyShopifyWebhook } from '@/lib/shopify';
import type { ShopifyOrder } from '@/src/types/shopify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') || '';
  const shopDomain = request.headers.get('x-shopify-shop-domain') || '';
  const webhookId = request.headers.get('x-shopify-webhook-id') || crypto.randomUUID();

  if (!verifyShopifyWebhook(rawBody, hmacHeader, config.SHOPIFY_WEBHOOK_SECRET)) {
    return new Response('Invalid webhook signature', { status: 401 });
  }

  if (topic !== config.SHOPIFY_ALLOWED_TOPIC) {
    return new Response(`Ignored topic: ${topic}`, { status: 202 });
  }

  // const existingWebhook = await prisma.webhookReceipt.findUnique({
  //   where: { webhookId }
  // });

  // if (existingWebhook?.status === 'processed') {
  //   return Response.json({ ok: true, duplicateWebhook: true });
  // }

  const order = JSON.parse(rawBody) as ShopifyOrder;
  const orderId = String(order.id);
  const storeDisplayName = config.storeDomainToName[shopDomain] || shopDomain;

  await prisma.webhookReceipt.upsert({
    where: { webhookId },
    create: {
      webhookId,
      topic,
      shopDomain,
      orderId,
      status: 'received'
    },
    update: {
      topic,
      shopDomain,
      orderId,
      status: 'received',
      error: null
    }
  });

  try {
    const mapped = mapOrderToSheetRows(order, storeDisplayName);
    const pending = mapped;
    // const keys = mapped.map((row) =>
    //   buildLineItemIdempotencyKey(shopDomain, row.idempotencyKeyParts.orderId, row.idempotencyKeyParts.lineItemId)
    // );

    // const alreadyProcessed = await prisma.processedLineItem.findMany({
    //   where: {
    //     idempotencyKey: {
    //       in: keys
    //     }
    //   },
    //   select: {
    //     idempotencyKey: true
    //   }
    // });

    // const processedSet = new Set(alreadyProcessed.map((row) => row.idempotencyKey));

    // const pending = mapped.filter((row) => {
    //   const key = buildLineItemIdempotencyKey(shopDomain, row.idempotencyKeyParts.orderId, row.idempotencyKeyParts.lineItemId);
    //   return !processedSet.has(key);
    // });

    if (pending.length === 0) {
      await prisma.webhookReceipt.update({
        where: { webhookId },
        data: {
          status: 'processed',
          processedAt: new Date()
        }
      });

      return Response.json({ ok: true, appended: 0, duplicateLineItems: true });
    }

    await ensureHeaderRow();
    const appendResult = await appendRows(pending.map((row) => row.values));

    for (let index = 0; index < pending.length; index += 1) {
      const row = pending[index];
      const idempotencyKey = buildLineItemIdempotencyKey(
        shopDomain,
        row.idempotencyKeyParts.orderId,
        row.idempotencyKeyParts.lineItemId
      );

      await prisma.processedLineItem.create({
        data: {
          idempotencyKey,
          shopDomain,
          orderId: row.idempotencyKeyParts.orderId,
          lineItemId: row.idempotencyKeyParts.lineItemId,
          webhookId,
          rowIndex: appendResult.startRow ? appendResult.startRow + index : null
        }
      });
    }

    await prisma.webhookReceipt.update({
      where: { webhookId },
      data: {
        status: 'processed',
        processedAt: new Date()
      }
    });

    return Response.json({
      ok: true,
      appended: pending.length,
      sheetRange: appendResult.updatedRange
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.webhookReceipt.update({
      where: { webhookId },
      data: {
        status: 'failed',
        error: message
      }
    });

    return new Response(message, { status: 500 });
  }
}
