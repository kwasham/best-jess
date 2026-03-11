# Shopify → Google Sheets starter (Next.js / Node)

This starter receives a Shopify `orders/paid` webhook, expands the order into **one row per line item**, and appends those rows to a sandbox Google Sheet.

## What this starter does
- Verifies the Shopify webhook HMAC.
- Accepts only the configured topic (`orders/paid` by default).
- Maps each line item to one sheet row.
- Uses **store name** as `Customer*`.
- Uses the Shopify order number/name as `Memo` and `Sales Receipt No`.
- Applies Texas vs non-Texas tax handling.
- Prevents duplicate writes with SQLite + Prisma idempotency keys.

## Folder structure
- `app/api/shopify/webhooks/orders-paid/route.ts` — webhook endpoint
- `app/api/health/route.ts` — health check
- `lib/mapping.ts` — row-per-line-item mapping
- `lib/google-sheets.ts` — Sheets API append helpers
- `lib/shopify.ts` — HMAC verification and idempotency key builder
- `prisma/schema.prisma` — audit + idempotency tables
- `docs/SANDBOX-SETUP.md` — Shopify and Google sandbox steps
- `docs/IMPLEMENTATION-PLAN.md` — build sequence and rollout plan

## Quick start
1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client and create the SQLite DB:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Run the app:
   ```bash
   npm run dev
   ```
5. Test health route:
   - `GET /api/health`
6. Point your Shopify dev-store webhook to:
   - `POST /api/shopify/webhooks/orders-paid`

## Expected Google Sheet columns
The starter writes columns in this exact order:
1. `Customer*`
2. `Sales Receipt No`
3. `Sales Receipt Date`
4. `Product/Service`
5. `Description`
6. `Qty`
7. `Rate`
8. `Tax`
9. `Amount`
10. `Memo`
11. `Ship To State`
12. `Order Id`
13. `Line Item Id`
14. `SKU`
15. `Store`

## Important notes
- This is **sandbox-first** and intentionally simple.
- For production scale, move the append work off the webhook request path into a queue worker.
- The tax logic is intentionally conservative:
  - Texas destination → use line-item tax from Shopify.
  - Non-Texas destination → write `0.00` or blank based on env config.
- The starter defaults to `processed_at` as the receipt date when available.
