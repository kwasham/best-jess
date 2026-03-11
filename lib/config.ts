import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1),
  SHOPIFY_ALLOWED_TOPIC: z.string().default('orders/paid'),
  SHOPIFY_STORE_DOMAIN_TO_NAME_JSON: z.string().min(2),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  GOOGLE_SHEET_ID: z.string().min(1),
  GOOGLE_SHEET_TAB_NAME: z.string().min(1),
  NON_TEXAS_TAX_MODE: z.enum(['zero', 'blank']).default('zero'),
  USE_ORDER_PAID_DATE: z.enum(['true', 'false']).default('true')
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  storeDomainToName: JSON.parse(env.SHOPIFY_STORE_DOMAIN_TO_NAME_JSON) as Record<string, string>,
  googlePrivateKey: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  useOrderPaidDate: env.USE_ORDER_PAID_DATE === 'true'
};
