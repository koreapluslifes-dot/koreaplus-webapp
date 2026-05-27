/**
 * ExchangeRate-API — real-time currency conversion
 *
 * Free tier: 1,500 requests/month (~50/day)
 * API Portal: https://app.exchangerate-api.com/sign-up
 * Base URL:   https://v6.exchangerate-api.com/v6/{KEY}/latest/USD
 *
 * Strategy: cache for 6 hours (Worker KV or in-memory) so we stay well
 * under the 1,500/month limit even with many visitors.
 *
 * Returns KRW as the primary base (inverted from USD base response).
 *
 * @example
 *   const client = new ExchangeClient(env.EXCHANGE_RATE_KEY);
 *   const rates = await client.getRates();
 *   // rates.usdToKrw === 1380 (approx)
 *   // rates.rates.USD === 0.000725 (1 KRW in USD)
 */

import type { ExchangeRate } from './schema.ts';

const BASE_URL = 'https://v6.exchangerate-api.com/v6';

/** Currencies travelers commonly need when visiting Korea */
const TARGET_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'CNY', 'GBP', 'AUD', 'CAD', 'SGD',
  'HKD', 'TWD', 'THB', 'VND', 'INR', 'MYR', 'PHP',
];

interface ExchangeApiResponse {
  result: 'success' | 'error';
  base_code?: string;
  conversion_rates?: Record<string, number>;
  error_type?: string;
  time_last_update_unix?: number;
}

export class ExchangeClient {
  private readonly key: string;

  constructor(apiKey: string) {
    this.key = apiKey;
  }

  /**
   * Fetch exchange rates with KRW as the effective base.
   * The API returns USD-based rates; we invert to get KRW-based rates.
   *
   * @returns ExchangeRate with:
   *   - base: 'KRW'
   *   - rates: { USD: 0.000725, EUR: 0.00066, ... } (1 KRW = X foreign)
   *   - usdToKrw: 1380 (convenience: 1 USD = X KRW)
   */
  async getRates(): Promise<ExchangeRate> {
    const url = `${BASE_URL}/${this.key}/latest/USD`;
    const res = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`ExchangeRate-API HTTP ${res.status}`);

    const data = await res.json() as ExchangeApiResponse;
    if (data.result !== 'success') {
      throw new Error(`ExchangeRate-API error: ${data.error_type ?? 'unknown'}`);
    }

    const raw = data.conversion_rates ?? {};
    const krwPerUsd = raw.KRW ?? 1380;

    // Invert: 1 KRW = X foreign currency
    const rates: Record<string, number> = {};
    for (const currency of TARGET_CURRENCIES) {
      if (raw[currency] !== undefined) {
        // raw[currency] = USD→X, so KRW→X = (1/krwPerUsd) * raw[currency]
        rates[currency] = raw[currency] / krwPerUsd;
      }
    }

    const updatedAt = data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString();

    return {
      base: 'KRW',
      rates,
      usdToKrw: Math.round(krwPerUsd),
      updatedAt,
    };
  }

  /**
   * Convert an amount from KRW to a target currency.
   * Convenience method — rates must already be fetched.
   */
  static convert(krwAmount: number, targetCurrency: string, rates: ExchangeRate): number {
    const rate = rates.rates[targetCurrency];
    if (!rate) throw new Error(`Unknown currency: ${targetCurrency}`);
    return +(krwAmount * rate).toFixed(4);
  }

  /**
   * Format KRW → foreign currency for display.
   * @example formatConversion(10000, 'USD', rates) → '10,000 KRW ≈ $7.25'
   */
  static formatConversion(krwAmount: number, currency: string, rates: ExchangeRate): string {
    const amount = ExchangeClient.convert(krwAmount, currency, rates);
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', JPY: '¥', CNY: '¥', GBP: '£',
      AUD: 'A$', CAD: 'C$', SGD: 'S$', HKD: 'HK$', TWD: 'NT$',
    };
    const sym = symbols[currency] ?? '';
    const decimals = ['JPY', 'KRW', 'VND', 'TWD'].includes(currency) ? 0 : 2;
    return `${krwAmount.toLocaleString()} KRW ≈ ${sym}${amount.toFixed(decimals)}`;
  }
}
