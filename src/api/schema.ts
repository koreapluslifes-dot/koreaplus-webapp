/**
 * Unified internal data schema for KoreaPlus API aggregation layer.
 * All external API responses are normalized into these interfaces before
 * being returned to the client.
 */

// ── Place / Attraction ───────────────────────────────────────────────────────

export type PlaceCategory =
  | 'attraction'     // 관광지 (TourAPI contentTypeId: 12)
  | 'culture'        // 문화시설 — museums, galleries (14)
  | 'festival'       // 축제/공연/행사 (15)
  | 'course'         // 여행코스 (25)
  | 'leisure'        // 레포츠 (28)
  | 'accommodation'  // 숙박 (32)
  | 'shopping'       // 쇼핑 (38)
  | 'food'           // 음식점 (39)
  | 'performance';   // KOPIS 공연

export type DataSource =
  | 'tourapi' | 'kopis' | 'culture_go' | 'seoul' | 'manual'
  // K-Pop vertical sources
  | 'spotify' | 'youtube' | 'itunes' | 'newsdata' | 'wikidata' | 'ticketmaster' | 'lastfm' | 'kpop'
  // K-Beauty vertical sources
  | 'aliexpress' | 'kbeauty';

/** Normalized place entity — used across TourAPI, KOPIS, culture.go.kr */
export interface Place {
  id: string;
  nameEn: string;
  nameKo: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  subcategory?: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  /** Operating hours (free-text, may be multi-line) */
  hours?: string;
  /** Rest/closed days */
  closed?: string;
  /** Admission fee */
  price?: string;
  source: DataSource;
  sourceId: string;
  updatedAt: string;
  tags?: string[];
  areaCode?: number;
  sigunguCode?: number;
}

/** Festival — extends Place with event dates */
export interface Festival extends Place {
  category: 'festival';
  eventStartDate: string; // YYYYMMDD
  eventEndDate: string;   // YYYYMMDD
  venue?: string;
  ageLimit?: string;
  sponsor?: string;
  playtime?: string;
  program?: string;
}

// ── KOPIS Performance ────────────────────────────────────────────────────────

export type PerformanceStatus = 'scheduled' | 'ongoing' | 'completed';

/** KOPIS 공연 정보 */
export interface Performance {
  id: string;         // mt20id (KOPIS unique ID)
  title: string;
  venue: string;
  venueId?: string;   // mt10id
  startDate: string;  // YYYYMMDD
  endDate: string;
  category: string;   // human-readable (e.g. "Musical", "Classical")
  categoryCode: string;
  poster?: string;
  status: PerformanceStatus;
  cast?: string;
  runtime?: string;   // e.g. "150분"
  price?: string;
  ageLimit?: string;
  area?: string;      // region name
  source: 'kopis';
}

// ── Weather ──────────────────────────────────────────────────────────────────

export type SkyCode = 'clear' | 'mostlyCloudy' | 'overcast';
export type RainCode = 'none' | 'rain' | 'mixed' | 'snow' | 'shower' | 'drizzle' | 'blowingSnow';
export type AqiGrade = 'good' | 'moderate' | 'unhealthy' | 'veryUnhealthy' | 'unknown';

/** Combined weather + AQI snapshot for one city */
export interface WeatherData {
  city: string;       // English city name
  cityKo: string;     // Korean city name
  nx: number;         // KMA grid X
  ny: number;         // KMA grid Y
  temp: number;       // °C
  humidity: number;   // %
  windSpeed: number;  // m/s
  windDir?: number;   // degrees 0–360
  sky: SkyCode;
  rainType: RainCode;
  condition: string;        // English description
  conditionKo: string;      // Korean description
  conditionEmoji: string;
  precipitation?: number;   // mm/hr
  pm25?: number;            // μg/m³
  pm10?: number;
  aqiGrade?: AqiGrade;
  updatedAt: string;        // ISO 8601
}

// ── Air Quality ──────────────────────────────────────────────────────────────

/** AirKorea 실시간 대기질 */
export interface AirQualityData {
  stationName: string;
  city: string;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  khaiIndex: number | null; // 통합대기환경지수
  khaiGrade: AqiGrade;
  pm25Grade: AqiGrade;
  pm10Grade: AqiGrade;
  updatedAt: string;
}

// ── Exchange Rates ────────────────────────────────────────────────────────────

export interface ExchangeRate {
  base: 'KRW';
  rates: Record<string, number>; // { USD: 0.00072, EUR: 0.00066, ... }
  usdToKrw: number;              // convenience field
  updatedAt: string;
}

// ── Transit ──────────────────────────────────────────────────────────────────

/** Seoul subway real-time arrival */
export interface SubwayArrival {
  line: string;
  direction: string;
  destinationStation: string;
  arrivalMessage: string;  // "2분 후", "곧 도착", "진입"
  secondsToArrival?: number;
  trainId?: string;
  status: string;          // 전, 당, 진입
  updnLine: '0' | '1';     // 0=상행/외선, 1=하행/내선
}

/** 따릉이 대여소 현황 */
export interface BikeStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableBikes: number;
  totalDocks: number;
  emptyDocks: number;
}

// ── K-Pop vertical ───────────────────────────────────────────────────────────

/** Normalized artist/group profile — manual roster enriched by Spotify + Wikidata + YouTube */
export interface KpopArtist {
  id: string;                  // our slug id (matches kpop-data.js KPOP_ROSTER)
  nameEn: string;
  nameKo?: string;
  type: 'group' | 'soloist';
  agency?: string;
  debut?: string;              // YYYY or YYYY-MM-DD
  members?: string[];
  emoji?: string;
  image?: string;              // artist image URL (Spotify/Wikidata — never label press photos)
  bio?: string;                // localized short bio (Wikipedia extract)
  bioUrl?: string;             // Wikipedia source link
  // popularity signals
  spotifyId?: string;
  spotifyPopularity?: number;  // 0–100
  spotifyFollowers?: number;
  youtubeChannelId?: string;
  youtubeSubscribers?: number;
  youtubeViews?: number;
  genres?: string[];
  sources: DataSource[];
  updatedAt: string;
}

/** A music video / upload (YouTube) */
export interface MusicVideo {
  videoId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  url: string;
}

/** A single chart position (iTunes RSS / derived) */
export interface ChartEntry {
  rank: number;
  title: string;
  artist: string;
  artworkUrl?: string;
  url?: string;
  releaseDate?: string;
  kind?: string;               // songs | albums | music-videos
  store?: string;              // storefront code, e.g. 'kr', 'us'
}

/** A news / 근황 item (NewsData.io — title+excerpt+link only, never full body) */
export interface NewsItem {
  title: string;
  excerpt?: string;
  link: string;
  source?: string;
  sourceIcon?: string;
  imageUrl?: string;
  publishedAt?: string;
  language?: string;
  artists?: string[];          // matched roster ids
  credibility?: 'confirmed' | 'reported' | 'rumor';
}

/** A scheduled comeback / release / event (manual roster, client-side countdown) */
export interface Comeback {
  artistId: string;
  artist: string;
  title: string;
  date: string;                // YYYY-MM-DD (KST)
  type: 'album' | 'single' | 'ep' | 'mv' | 'tour' | 'event';
  confirmed?: boolean;
}

export type TickerKind = 'comeback' | 'chart' | 'mv' | 'news' | 'release';

/** A single scrolling-ticker item on the hub */
export interface TickerItem {
  kind: TickerKind;
  text: string;                // display string
  artist?: string;
  value?: string;              // e.g. '+2.1M', '#1', '3d 14h'
  url?: string;
  ts?: string;
}

/** A concert / tour date (Ticketmaster global + KOPIS for KR) */
export interface KpopConcert {
  id: string;
  name: string;
  artist?: string;
  venue?: string;
  city?: string;
  country?: string;
  date?: string;               // ISO 8601
  onSaleDate?: string;
  url?: string;                // ticket / affiliate deep link
  image?: string;
  source: DataSource;
}

// ── K-Beauty vertical ──────────────────────────────────────────────────────────

/** A shoppable product (AliExpress affiliate — pre-tracked promotion link). */
export interface BeautyProduct {
  title: string;
  image?: string;       // seller-listing image (AliExpress CDN) — not a brand press photo
  price?: string;       // formatted, e.g. "$12.30"
  currency?: string;
  url: string;          // tracked promotion_link
}

// ── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  cacheAgeSeconds?: number;
  source?: string;
  error?: string;
}

// ── TourAPI Area / Content Type Codes ────────────────────────────────────────

export const AREA_CODES: Record<string, number> = {
  Seoul: 1, Incheon: 2, Daejeon: 3, Daegu: 4, Gwangju: 5,
  Busan: 6, Ulsan: 7, Sejong: 8, Gyeonggi: 31, Gangwon: 32,
  Chungbuk: 33, Chungnam: 34, Gyeongbuk: 35, Gyeongnam: 36,
  Jeonbuk: 37, Jeonnam: 38, Jeju: 39,
};

export const CONTENT_TYPE_IDS: Record<PlaceCategory, number> = {
  attraction: 12, culture: 14, festival: 15, course: 25,
  leisure: 28, accommodation: 32, shopping: 38, food: 39,
  performance: 15,
};

export const KOPIS_CATEGORIES: Record<string, string> = {
  AAAA: 'Theater',      BBBC: 'Musical',      CCCA: 'Classical',
  CCCC: 'Opera',        CCCD: 'Dance',         CCCE: 'Western Dance',
  CCCF: 'Traditional',  GGGA: 'Pop/Rock',     HHHA: 'Mixed',
  JJJA: 'Circus/Magic', BBBE: 'Family',        GGGE: 'Festival',
};
