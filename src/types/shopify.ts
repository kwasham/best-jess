export type ShopifyAddress = {
  province?: string | null;
  province_code?: string | null;
  country?: string | null;
  country_code?: string | null;
};

export type ShopifyTaxLine = {
  price?: string | null;
  rate?: number | null;
  title?: string | null;
};

export type ShopifyLineItem = {
  id: number | string;
  sku?: string | null;
  title?: string | null;
  variant_title?: string | null;
  quantity: number;
  price?: string | null;
  tax_lines?: ShopifyTaxLine[] | null;
};

export type ShopifyOrder = {
  id: number | string;
  name?: string | null;
  order_number?: number | null;
  created_at?: string | null;
  processed_at?: string | null;
  current_total_tax?: string | null;
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
  line_items: ShopifyLineItem[];
};
