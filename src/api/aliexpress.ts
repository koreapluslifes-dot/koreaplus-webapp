/**
 * AliExpress Affiliate (Portals) product search — server-side only.
 *
 * The App Secret MUST never reach the browser: the TOP /sync call is HMAC-SHA256
 * signed here in the Worker. Ported from the battle-tested lucky-webapp proxy.
 *
 * Signing: ASCII-sort the params, concat key+value, HMAC-SHA256 with the secret,
 * uppercase hex. Endpoint api-sg.aliexpress.com/sync, method
 * aliexpress.affiliate.product.query.
 *
 * Geo-optimized: shipping country + currency come from the visitor's real
 * country (Cloudflare `request.cf.country`), NOT the page language, so a KR
 * visitor on an English page still gets KR-shippable items. A 4-step fallback
 * chain keeps the grid populated even when the primary country/lang is empty.
 *
 * No key configured → returns [] (the frontend shows curated retailers instead).
 */

import type { BeautyProduct } from './schema.ts';

const ENDPOINT = 'https://api-sg.aliexpress.com/sync';
const TRACKING_ID = 'koreaplus';

// Map visitor country → target currency (AliExpress supported). Fallback USD.
const COUNTRY_CUR: Record<string, string> = {
  KR: 'KRW', US: 'USD', JP: 'JPY', CN: 'USD', GB: 'GBP', BR: 'BRL', ID: 'IDR', RU: 'RUB',
  CA: 'CAD', AU: 'AUD', SG: 'SGD', HK: 'HKD', TW: 'USD', IN: 'USD', TH: 'USD', VN: 'USD',
  PH: 'USD', MY: 'USD', MX: 'USD', TR: 'USD', SA: 'USD', AE: 'USD', PL: 'PLN',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  PT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR',
  LU: 'EUR', CY: 'EUR', MT: 'EUR',
};

// Product-title display language (readability) — falls back to English.
const LANG_TL: Record<string, string> = {
  ko: 'ko', en: 'en', ja: 'ja', zh: 'zh', de: 'de', fr: 'fr', es: 'es', pt: 'pt', id: 'id', it: 'it',
};

const CUR_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩', BRL: 'R$', AUD: 'A$', CAD: 'C$' };

interface AliProduct {
  product_title?: string;
  product_main_image_url?: string;
  target_sale_price?: string;
  sale_price?: string;
  target_sale_price_currency?: string;
  sale_price_currency?: string;
  promotion_link?: string;
}
interface AliResponse {
  aliexpress_affiliate_product_query_response?: {
    resp_result?: { result?: { products?: { product?: AliProduct[] } }; resp_msg?: string };
  };
  error_response?: { msg?: string; code?: string };
}

function formatPrice(value: string | undefined, cur: string): string {
  if (!value) return '';
  const sym = CUR_SYMBOL[cur];
  return sym ? `${sym}${value}` : `${value} ${cur}`;
}

export class AliExpressClient {
  constructor(private appKey: string, private appSecret: string) {}

  private async sign(params: Record<string, string>): Promise<string> {
    const sorted = Object.keys(params).sort().map(k => k + params[k]).join('');
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(this.appSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sorted));
    return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  private async call(keywords: string, tl: string, ship: string, cur: string): Promise<AliProduct[]> {
    const params: Record<string, string> = {
      app_key: this.appKey,
      method: 'aliexpress.affiliate.product.query',
      sign_method: 'sha256',
      timestamp: String(Date.now()),
      format: 'json',
      v: '2.0',
      keywords: keywords || 'korean skincare',
      target_currency: cur,
      target_language: tl,
      tracking_id: TRACKING_ID,
      page_size: '12',
      sort: 'LAST_VOLUME_DESC',
    };
    if (ship) params.ship_to_country = ship;
    const sign = await this.sign(params);
    const qs = new URLSearchParams({ ...params, sign }).toString();
    const res = await globalThis.fetch(`${ENDPOINT}?${qs}`, {
      method: 'POST',
      signal: AbortSignal.timeout(9_000),
    });
    const json = await res.json().catch(() => null) as AliResponse | null;
    const list = json?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;
    return Array.isArray(list) ? list : [];
  }

  /**
   * Search K-beauty products, geo-localized. `country` is the visitor's CF
   * country code; `lang` the UI language for product titles.
   */
  async searchProducts(keywords: string, lang = 'en', country = ''): Promise<BeautyProduct[]> {
    const tlPrimary = LANG_TL[(lang || '').toLowerCase()] || 'en';
    const shipPrimary = /^[A-Z]{2}$/.test(country) ? country : 'US';
    const curPrimary = COUNTRY_CUR[shipPrimary] || 'USD';

    // 4-step fallback: visitor country (local lang → en) → US shipping (local → en)
    const attempts: [string, string, string][] = [[tlPrimary, shipPrimary, curPrimary]];
    if (tlPrimary !== 'en') attempts.push(['en', shipPrimary, curPrimary]);
    if (shipPrimary !== 'US') {
      attempts.push([tlPrimary, 'US', 'USD']);
      if (tlPrimary !== 'en') attempts.push(['en', 'US', 'USD']);
    }

    let list: AliProduct[] = [], usedCur = curPrimary;
    for (const [tl, ship, cur] of attempts) {
      list = await this.call(keywords, tl, ship, cur);
      if (list.length) { usedCur = cur; break; }
    }

    return list.slice(0, 12).map(p => {
      const cur = p.target_sale_price_currency || p.sale_price_currency || usedCur;
      return {
        title: p.product_title || '',
        image: p.product_main_image_url,
        price: formatPrice(p.target_sale_price || p.sale_price, cur),
        currency: cur,
        url: p.promotion_link || '',
      };
    }).filter(p => p.url && p.image);
  }
}
