# Sandbox setup checklist

## 1) Shopify development store
Create a Shopify development store for testing only.

Recommended test products:
- Single-item taxable order
- Multi-quantity order
- Multi-line-item order
- Discounted order
- Texas shipping address order
- Non-Texas shipping address order

## 2) Test payments
Use Shopify's test ordering flow in the development store. Create multiple create test orders so the `orders/create` webhook fires.

## 3) Sandbox Google Sheet
Make a copy of your wife's batch template and name it something like:
- `QB Sales Receipt Batch Template - SANDBOX`

Share that spreadsheet with the Google service-account email from your GCP project.

## 4) Google Cloud project
- Create a Google Cloud project.
- Enable the Google Sheets API.
- Create a service account.
- Generate a JSON key.
- Put the service account email and private key into `.env.local`.

## 5) Local environment
Populate `.env.local` with:
- Shopify webhook secret
- store-domain-to-display-name JSON mapping
- Google Sheet ID and tab name
- Google service account credentials

## 6) Local tunnel
Use a public HTTPS tunnel for local testing, such as ngrok or Cloudflare Tunnel, and point the Shopify webhook at:
- `/api/shopify/webhooks/orders-create`

## 7) Test matrix
Run these cases before touching production:
- Texas single-item order
- Texas multi-line-item order
- Non-Texas single-item order
- Non-Texas multi-line-item order
- Duplicate webhook replay
- Missing shipping state (fallback to billing)
- Order with SKU and without SKU
- Order with zero tax
