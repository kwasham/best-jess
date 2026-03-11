export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true, service: 'shopify-sheets-v1-starter' });
}
