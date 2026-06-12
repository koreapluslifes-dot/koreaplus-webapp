/**
 * 한국관광공사 TourAPI 4.0 — English Service (EngService2)
 *
 * API Portal: https://www.data.go.kr/data/15101578/openapi.do
 * Base URL:   https://apis.data.go.kr/B551011/EngService2/
 *
 * Note: serviceKey from data.go.kr is pre-URL-encoded.
 * Pass it raw in the query string — do NOT wrap in URLSearchParams.
 *
 * @example
 *   const client = new TourApiClient(env.TOUR_API_KEY);
 *   const festivals = await client.getFestivals({ eventStartDate: '20250601' });
 */

import type { Place, Festival, PlaceCategory } from './schema.ts';
import { AREA_CODES } from './schema.ts';

const BASE = 'https://apis.data.go.kr/B551011/EngService2';
const DEFAULT_ROWS = 20;

/** Raw item shape returned by TourAPI (subset of fields we care about) */
interface TourApiItem {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  mapx?: string;  // longitude
  mapy?: string;  // latitude
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  overview?: string;
  homepage?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  eventstartdate?: string;
  eventenddate?: string;
  // detailIntro fields
  usetime?: string;
  restdate?: string;
  useseason?: string;
  usefee?: string;
  sponsor1?: string;
  program?: string;
  agelimit?: string;
  playtime?: string;
  spendtime?: string;
}

interface TourApiResponse {
  response?: {
    header?: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: TourApiItem | TourApiItem[] };
      totalCount?: number;
      numOfRows?: number;
      pageNo?: number;
    };
  };
}

// Map TourAPI contentTypeId → internal PlaceCategory
const TYPE_MAP: Record<string, PlaceCategory> = {
  '12': 'attraction', '14': 'culture',  '15': 'festival',
  '25': 'course',     '28': 'leisure',  '32': 'accommodation',
  '38': 'shopping',   '39': 'food',
};

export class TourApiClient {
  private readonly key: string;

  constructor(serviceKey: string) {
    this.key = serviceKey.trim(); // strip stray BOM/whitespace from pasted secret
  }

  /**
   * Build full URL. serviceKey is injected raw to avoid double-encoding.
   */
  private url(endpoint: string, params: Record<string, string | number>): string {
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `${BASE}/${endpoint}?serviceKey=${this.key}&_type=json&MobileOS=ETC&MobileApp=KoreaPlus&${qs}`;
  }

  private async fetch<T>(url: string): Promise<T> {
    const res = await globalThis.fetch(url, {
      headers: { Accept: 'application/json' },
      // 10 second timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`TourAPI HTTP ${res.status}: ${url}`);
    return res.json() as Promise<T>;
  }

  /** Normalize raw TourAPI item → internal Place */
  private normalize(item: TourApiItem): Place {
    const cat = TYPE_MAP[item.contenttypeid ?? '12'] ?? 'attraction';
    return {
      id: `tour_${item.contentid}`,
      nameEn: item.title ?? '',
      nameKo: item.title ?? '', // EngService returns English titles; KorService for Korean
      lat: parseFloat(item.mapy ?? '0'),
      lng: parseFloat(item.mapx ?? '0'),
      category: cat,
      image: item.firstimage,
      thumbnail: item.firstimage2,
      address: [item.addr1, item.addr2].filter(Boolean).join(' '),
      phone: item.tel,
      description: item.overview,
      website: item.homepage?.replace(/<[^>]*>/g, '').trim(),
      source: 'tourapi',
      sourceId: item.contentid ?? '',
      updatedAt: new Date().toISOString(),
      areaCode: parseInt(item.areacode ?? '0'),
      sigunguCode: parseInt(item.sigungucode ?? '0'),
    };
  }

  private items(body: TourApiResponse['response']): TourApiItem[] {
    const raw = body?.body?.items?.item;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  // ── Public API methods ───────────────────────────────────────────────────

  /**
   * Fetch tourist spots by area (areaBasedList2).
   * @param city   English city name (e.g. 'Seoul')
   * @param category  Place category to filter by
   * @param page   Page number (1-based)
   */
  async getAreaBasedList(opts: {
    city: string;
    category?: PlaceCategory;
    page?: number;
    rows?: number;
  }): Promise<{ places: Place[]; total: number }> {
    const areaCode = AREA_CODES[opts.city] ?? 1;
    const contentTypeId = opts.category
      ? { attraction: 12, culture: 14, festival: 15, course: 25, leisure: 28,
          accommodation: 32, shopping: 38, food: 39, performance: 15 }[opts.category]
      : undefined;

    const params: Record<string, string | number> = {
      numOfRows: opts.rows ?? DEFAULT_ROWS,
      pageNo: opts.page ?? 1,
      areaCode,
      arrange: 'Q', // sorted by popularity
    };
    if (contentTypeId) params.contentTypeId = contentTypeId;

    const data = await this.fetch<TourApiResponse>(this.url('areaBasedList2', params));
    const rawItems = this.items(data.response);
    return {
      places: rawItems.map(i => this.normalize(i)),
      total: data.response?.body?.totalCount ?? 0,
    };
  }

  /**
   * Fetch upcoming festivals / events (searchFestival2).
   * @param eventStartDate  YYYYMMDD — start of search window
   * @param eventEndDate    YYYYMMDD — end of search window (optional)
   * @param city            Filter by city name
   */
  async getFestivals(opts: {
    eventStartDate: string;
    eventEndDate?: string;
    city?: string;
    page?: number;
    rows?: number;
  }): Promise<{ festivals: Festival[]; total: number }> {
    const params: Record<string, string | number> = {
      numOfRows: opts.rows ?? DEFAULT_ROWS,
      pageNo: opts.page ?? 1,
      eventStartDate: opts.eventStartDate,
      arrange: 'A', // sorted by date
    };
    if (opts.eventEndDate) params.eventEndDate = opts.eventEndDate;
    if (opts.city) params.areaCode = AREA_CODES[opts.city] ?? 1;

    const data = await this.fetch<TourApiResponse>(this.url('searchFestival2', params));
    const rawItems = this.items(data.response);
    const total = data.response?.body?.totalCount ?? 0;

    const festivals: Festival[] = rawItems.map(item => ({
      ...this.normalize(item),
      category: 'festival' as const,
      eventStartDate: item.eventstartdate ?? opts.eventStartDate,
      eventEndDate: item.eventenddate ?? opts.eventStartDate,
      venue: item.addr1,
      sponsor: item.sponsor1,
      program: item.program,
      ageLimit: item.agelimit,
      playtime: item.playtime,
    }));

    return { festivals, total };
  }

  /**
   * Fetch tourist spots near a GPS coordinate (locationBasedList2).
   * @param lat      Latitude
   * @param lng      Longitude
   * @param radius   Search radius in meters (default: 5000)
   */
  async getLocationBased(opts: {
    lat: number;
    lng: number;
    radius?: number;
    category?: PlaceCategory;
    rows?: number;
  }): Promise<Place[]> {
    const contentTypeId = opts.category
      ? { attraction: 12, culture: 14, festival: 15, course: 25, leisure: 28,
          accommodation: 32, shopping: 38, food: 39, performance: 15 }[opts.category]
      : undefined;

    const params: Record<string, string | number> = {
      numOfRows: opts.rows ?? DEFAULT_ROWS,
      pageNo: 1,
      mapX: opts.lng,
      mapY: opts.lat,
      radius: opts.radius ?? 5000,
      arrange: 'S', // sorted by distance
    };
    if (contentTypeId) params.contentTypeId = contentTypeId;

    const data = await this.fetch<TourApiResponse>(this.url('locationBasedList2', params));
    return this.items(data.response).map(i => this.normalize(i));
  }

  /**
   * Fetch common detail info for a content item (detailCommon2).
   * Returns enriched Place with description, hours, image.
   */
  async getDetailCommon(contentId: string, contentTypeId: number): Promise<Partial<Place>> {
    const params = {
      numOfRows: 1,
      pageNo: 1,
      contentId,
      contentTypeId,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      areainfoYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y',
    };
    const data = await this.fetch<TourApiResponse>(this.url('detailCommon2', params));
    const items = this.items(data.response);
    if (!items.length) return {};
    const item = items[0];
    return {
      description: item.overview,
      image: item.firstimage,
      thumbnail: item.firstimage2,
      address: [item.addr1, item.addr2].filter(Boolean).join(' '),
      phone: item.tel,
      website: item.homepage?.replace(/<[^>]*>/g, '').trim(),
    };
  }

  /**
   * Fetch operational detail (detailIntro2): hours, admission, rest days.
   */
  async getDetailIntro(contentId: string, contentTypeId: number): Promise<{
    hours?: string; closed?: string; price?: string; spendTime?: string;
  }> {
    const params = { numOfRows: 1, pageNo: 1, contentId, contentTypeId, introYN: 'Y' };
    const data = await this.fetch<TourApiResponse>(this.url('detailIntro2', params));
    const items = this.items(data.response);
    if (!items.length) return {};
    const item = items[0];
    return {
      hours: item.usetime ?? item.useseason,
      closed: item.restdate,
      price: item.usefee,
      spendTime: item.spendtime,
    };
  }

  /**
   * Fetch area code list (areaCode2). Pass areaCode to get sigungu (district) codes.
   */
  async getAreaCodes(areaCode?: number): Promise<{ code: string; name: string }[]> {
    const params: Record<string, string | number> = { numOfRows: 50, pageNo: 1 };
    if (areaCode) params.areaCode = areaCode;
    const data = await this.fetch<TourApiResponse>(this.url('areaCode2', params));
    return this.items(data.response).map(item => ({
      code: (item as unknown as { code: string }).code ?? '',
      name: item.title ?? '',
    }));
  }
}
