# Implementation plan

## Phase 1 — sandbox only
- Build and run the Next.js service locally.
- Create the sandbox Shopify dev store.
- Create a sandbox copy of the Google Sheet.
- Connect the webhook.
- Validate that one create order writes one row per line item.

## Phase 2 — harden for bookkeeping confidence
- Confirm final sheet column order with your wife.
- Add a manual reconciliation script for a date range.
- Add structured application logging.
- Add a small admin page or API route to inspect failed webhook receipts.

## Phase 3 — production readiness
- Move webhook processing to a queue worker.
- Switch SQLite to Postgres.
- Add rate limiting and retry strategy.
- Add alerting for failed appends.
- Add daily reconciliation against Shopify orders.

## Suggested acceptance criteria
- No duplicate line items after webhook replay.
- Correct Texas/non-Texas tax behavior.
- Correct store name in `Customer*`.
- Correct order number in `Memo`.
- One row per Shopify line item.
- Every successful append is represented in the audit tables.
