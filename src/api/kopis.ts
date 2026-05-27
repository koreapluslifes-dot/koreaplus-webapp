/**
 * KOPIS 공연예술통합전산망 OpenAPI
 *
 * API Portal: https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do
 * Base URL:   https://www.kopis.or.kr/openApi/restful/
 *
 * KOPIS returns XML. This module includes a lightweight XML extractor.
 * Covers: performance lists, venue info, box office rankings.
 *
 * @example
 *   const client = new KopisClient(env.KOPIS_API_KEY);
 *   const shows = await client.getPerformances({ stdate: '20250601', eddate: '20250630' });
 */

import type { Performance, PerformanceStatus } from './schema.ts';
import { KOPIS_CATEGORIES } from './schema.ts';

const BASE = 'https://www.kopis.or.kr/openApi/restful';

// ── Lightweight XML helpers ───────────────────────────────────────────────────

/** Extract all values for a given XML tag */
function xmlValues(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].replace(/\s+/g, ' ').trim());
  }
  return results;
}

/** Extract all matching top-level blocks (for multi-item responses) */
function xmlBlocks(xml: string, tag: string): string[] {
  return xmlValues(xml, tag);
}

/** Extract single value from a block */
function xmlField(block: string, tag: string): string {
  return xmlValues(block, tag)[0] ?? '';
}

// ── KOPIS status codes ────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, PerformanceStatus> = {
  '01': 'scheduled',
  '02': 'ongoing',
  '03': 'completed',
};

export class KopisClient {
  private readonly key: string;

  constructor(apiKey: string) {
    this.key = apiKey;
  }

  private url(endpoint: string, params: Record<string, string | number>): string {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    return `${BASE}/${endpoint}?service=${this.key}&${qs}`;
  }

  private async fetchXml(url: string): Promise<string> {
    const res = await globalThis.fetch(url, {
      headers: { Accept: 'application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`KOPIS HTTP ${res.status}`);
    return res.text();
  }

  /**
   * Get performance list (pblprfr).
   * @param opts.stdate   Start date YYYYMMDD
   * @param opts.eddate   End date YYYYMMDD
   * @param opts.shcate   Category code (e.g. 'BBBC' for Musical). Omit for all.
   * @param opts.prfstate Status filter: '01'=scheduled, '02'=ongoing, '03'=completed
   * @param opts.rows     Results per page (default 20)
   * @param opts.cpage    Page number (default 1)
   */
  async getPerformances(opts: {
    stdate: string;
    eddate: string;
    shcate?: string;
    prfstate?: '01' | '02' | '03';
    rows?: number;
    cpage?: number;
    area?: string;   // 11=Seoul, 21=Busan (KOPIS area code)
  }): Promise<Performance[]> {
    const params: Record<string, string | number> = {
      stdate: opts.stdate,
      eddate: opts.eddate,
      cpage: opts.cpage ?? 1,
      rows: opts.rows ?? 20,
      newsql: 'Y',
    };
    if (opts.shcate) params.shcate = opts.shcate;
    if (opts.prfstate) params.prfstate = opts.prfstate;
    if (opts.area) params.signgucode = opts.area;

    const xml = await this.fetchXml(this.url('pblprfr', params));
    const blocks = xmlBlocks(xml, 'db');
    return blocks.map(block => this.parsePerformance(block));
  }

  /**
   * Get performance detail by ID (pblprfr/{id}).
   * Returns enriched Performance with cast, runtime, price, etc.
   */
  async getPerformanceDetail(mt20id: string): Promise<Performance | null> {
    const url = `${BASE}/pblprfr/${mt20id}?service=${this.key}&newsql=Y`;
    try {
      const xml = await this.fetchXml(url);
      const blocks = xmlBlocks(xml, 'db');
      if (!blocks.length) return null;
      return this.parsePerformanceDetail(blocks[0], mt20id);
    } catch {
      return null;
    }
  }

  /**
   * Get venue list (prfplc).
   */
  async getVenues(opts: {
    rows?: number;
    cpage?: number;
    area?: string;
  }): Promise<{ id: string; name: string; address: string; seats: number }[]> {
    const params: Record<string, string | number> = {
      cpage: opts.cpage ?? 1,
      rows: opts.rows ?? 20,
      newsql: 'Y',
    };
    if (opts.area) params.signgucode = opts.area;

    const xml = await this.fetchXml(this.url('prfplc', params));
    return xmlBlocks(xml, 'db').map(block => ({
      id: xmlField(block, 'mt10id'),
      name: xmlField(block, 'fcltynm'),
      address: xmlField(block, 'adres'),
      seats: parseInt(xmlField(block, 'seatscale') || '0'),
    }));
  }

  /**
   * Get box office rankings (boxoffice).
   * @param ststype  'week' | 'month'
   * @param date     Reference date YYYYMMDD (first day of period)
   * @param catecode Category code (optional)
   */
  async getBoxOffice(opts: {
    ststype: 'week' | 'month';
    date: string;
    catecode?: string;
  }): Promise<{ rank: number; title: string; venue: string; performances: number; id: string }[]> {
    const params: Record<string, string | number> = {
      ststype: opts.ststype,
      date: opts.date,
      newsql: 'Y',
    };
    if (opts.catecode) params.catecode = opts.catecode;

    const xml = await this.fetchXml(this.url('boxoffice', params));
    return xmlBlocks(xml, 'db').map((block, i) => ({
      rank: i + 1,
      title: xmlField(block, 'prfnm'),
      venue: xmlField(block, 'prfplcnm'),
      performances: parseInt(xmlField(block, 'prfcnt') || '0'),
      id: xmlField(block, 'mt20id'),
    }));
  }

  // ── Private parsers ────────────────────────────────────────────────────────

  private parsePerformance(block: string): Performance {
    const shcate = xmlField(block, 'shcate');
    return {
      id: xmlField(block, 'mt20id'),
      title: xmlField(block, 'prfnm'),
      venue: xmlField(block, 'fcltynm'),
      venueId: xmlField(block, 'mt10id'),
      startDate: xmlField(block, 'prfpdfrom').replace(/-/g, ''),
      endDate: xmlField(block, 'prfpdto').replace(/-/g, ''),
      category: KOPIS_CATEGORIES[shcate] ?? shcate,
      categoryCode: shcate,
      poster: xmlField(block, 'poster'),
      status: STATUS_MAP[xmlField(block, 'prfstate')] ?? 'ongoing',
      area: xmlField(block, 'area'),
      source: 'kopis',
    };
  }

  private parsePerformanceDetail(block: string, id: string): Performance {
    const base = this.parsePerformance(block);
    return {
      ...base,
      id,
      cast: xmlField(block, 'prfcast'),
      runtime: xmlField(block, 'prfruntime'),
      price: xmlField(block, 'pcseguidance'),
      ageLimit: xmlField(block, 'entrpsnm'),
    };
  }
}

// ── KOPIS Area Codes ──────────────────────────────────────────────────────────
// Used for filtering by region (signgucode parameter)
export const KOPIS_AREA_CODES: Record<string, string> = {
  Seoul: '11',    Busan: '21',     Daegu: '22',  Incheon: '23',
  Gwangju: '24',  Daejeon: '25',   Ulsan: '26',  Sejong: '29',
  Gyeonggi: '31', Gangwon: '32',   Chungbuk: '33', Chungnam: '34',
  Jeonbuk: '35',  Jeonnam: '36',   Gyeongbuk: '37', Gyeongnam: '38',
  Jeju: '39',
};
