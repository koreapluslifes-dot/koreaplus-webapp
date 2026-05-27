/**
 * 한국환경공단 에어코리아 실시간 대기질 API
 *
 * API Portal: https://www.data.go.kr/data/15073861/openapi.do
 * Base URL:   https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/
 *
 * Two endpoints:
 *  - getMsrstnAcctoRltmMesureDnsty: station-level real-time measurement
 *  - getCtprvnRltmMesureDnsty:      city/province-level average
 *
 * AQI Grade: 1=좋음(Good), 2=보통(Moderate), 3=나쁨(Unhealthy), 4=매우나쁨(Very Unhealthy)
 *
 * @example
 *   const client = new AirQualityClient(env.AIRKOREA_API_KEY);
 *   const aqi = await client.getCityAqi('Seoul');
 */

import type { AirQualityData, AqiGrade } from './schema.ts';
import { CITY_GRIDS } from './weather.ts';

const BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

// Grade codes → internal AqiGrade
const GRADE_MAP: Record<string, AqiGrade> = {
  '1': 'good', '2': 'moderate', '3': 'unhealthy', '4': 'veryUnhealthy',
};

// Map English city name → Korean sido (province) name for getCtprvnRltmMesureDnsty
const SIDO_MAP: Record<string, string> = {
  Seoul: '서울',      Busan: '부산',   Daegu: '대구',  Incheon: '인천',
  Gwangju: '광주',   Daejeon: '대전', Ulsan: '울산',  Sejong: '세종',
  Gyeonggi: '경기',  Gangwon: '강원', Chungbuk: '충북', Chungnam: '충남',
  Gyeongbuk: '경북', Gyeongnam: '경남', Jeonbuk: '전북', Jeonnam: '전남',
  Jeju: '제주',
};

interface AirKoreaItem {
  stationName?: string;
  dataTime?: string;
  pm10Value?: string;
  pm25Value?: string;
  o3Value?: string;
  no2Value?: string;
  so2Value?: string;
  coValue?: string;
  khaiValue?: string;
  khaiGrade?: string;
  pm10Grade?: string;
  pm25Grade?: string;
  cityName?: string;  // for sido endpoint
  pm10Average?: string;
  pm25Average?: string;
}

interface AirKoreaResponse {
  response?: {
    header?: { resultCode: string; resultMsg: string };
    body?: {
      items?: AirKoreaItem | AirKoreaItem[];
      totalCount?: number;
    };
  };
}

function parseNum(v: string | undefined): number | null {
  if (!v || v === '-' || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parseGrade(v: string | undefined): AqiGrade {
  return GRADE_MAP[v ?? ''] ?? 'unknown';
}

/** Compute overall AQI grade from PM2.5 and PM10 values (simplified WHO breakpoints) */
function computeGrade(pm25: number | null, pm10: number | null): AqiGrade {
  const g25 = pm25 === null ? null
    : pm25 <= 15 ? 'good'
    : pm25 <= 35 ? 'moderate'
    : pm25 <= 75 ? 'unhealthy'
    : 'veryUnhealthy';
  const g10 = pm10 === null ? null
    : pm10 <= 30 ? 'good'
    : pm10 <= 80 ? 'moderate'
    : pm10 <= 150 ? 'unhealthy'
    : 'veryUnhealthy';
  const order: AqiGrade[] = ['good', 'moderate', 'unhealthy', 'veryUnhealthy', 'unknown'];
  const worst = [g25, g10]
    .filter((g): g is AqiGrade => g !== null)
    .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
  return worst ?? 'unknown';
}

export class AirQualityClient {
  private readonly key: string;

  constructor(serviceKey: string) {
    this.key = serviceKey;
  }

  private url(endpoint: string, params: Record<string, string | number>): string {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    return `${BASE}/${endpoint}?serviceKey=${this.key}&returnType=json&${qs}`;
  }

  private items(data: AirKoreaResponse): AirKoreaItem[] {
    const raw = data.response?.body?.items;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  /**
   * Get real-time AQI for a specific monitoring station.
   * Station names are mapped from city names via CITY_GRIDS.airStation.
   * @param city  English city name (e.g. 'Seoul')
   */
  async getStationAqi(city: string): Promise<AirQualityData> {
    const grid = CITY_GRIDS[city];
    const stationName = grid?.airStation ?? city;

    const url = this.url('getMsrstnAcctoRltmMesureDnsty', {
      stationName: encodeURIComponent(stationName),
      dataTerm: 'DAILY',
      pageNo: 1,
      numOfRows: 1,
      ver: '1.4',
    });

    const data = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) })
      .then(r => r.json() as Promise<AirKoreaResponse>);

    const items = this.items(data);
    if (!items.length) throw new Error(`No AQI data for station: ${stationName}`);

    const item = items[0];
    const pm25 = parseNum(item.pm25Value);
    const pm10 = parseNum(item.pm10Value);

    return {
      stationName: item.stationName ?? stationName,
      city,
      pm25,
      pm10,
      o3: parseNum(item.o3Value),
      no2: parseNum(item.no2Value),
      so2: parseNum(item.so2Value),
      co: parseNum(item.coValue),
      khaiIndex: parseNum(item.khaiValue),
      khaiGrade: parseGrade(item.khaiGrade),
      pm25Grade: parseGrade(item.pm25Grade) !== 'unknown'
        ? parseGrade(item.pm25Grade)
        : computeGrade(pm25, null),
      pm10Grade: parseGrade(item.pm10Grade) !== 'unknown'
        ? parseGrade(item.pm10Grade)
        : computeGrade(null, pm10),
      updatedAt: item.dataTime
        ? new Date(item.dataTime.replace(' ', 'T') + ':00+09:00').toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Get city/province-wide average AQI (getCtprvnRltmMesureDnsty).
   * Useful as a fallback when a specific station name is unavailable.
   * @param city  English city name
   */
  async getCityAqi(city: string): Promise<AirQualityData> {
    // Try station-level first (more accurate)
    try {
      return await this.getStationAqi(city);
    } catch {
      // Fall back to sido average
    }

    const sidoName = SIDO_MAP[city];
    if (!sidoName) throw new Error(`Unsupported city: ${city}`);

    const url = this.url('getCtprvnRltmMesureDnsty', {
      sidoName: encodeURIComponent(sidoName),
      pageNo: 1,
      numOfRows: 1,
      ver: '1.0',
    });

    const data = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) })
      .then(r => r.json() as Promise<AirKoreaResponse>);

    const items = this.items(data);
    if (!items.length) throw new Error(`No AQI data for city: ${city}`);

    const item = items[0];
    const pm25 = parseNum(item.pm25Value);
    const pm10 = parseNum(item.pm10Value);

    return {
      stationName: `${city} average`,
      city,
      pm25,
      pm10,
      o3: null, no2: null, so2: null, co: null,
      khaiIndex: null,
      khaiGrade: computeGrade(pm25, pm10),
      pm25Grade: computeGrade(pm25, null),
      pm10Grade: computeGrade(null, pm10),
      updatedAt: new Date().toISOString(),
    };
  }

  /** AQI grade as English label with emoji */
  static gradeLabel(grade: AqiGrade): { label: string; emoji: string; color: string } {
    const map = {
      good:         { label: 'Good',          emoji: '🟢', color: '#00c853' },
      moderate:     { label: 'Moderate',      emoji: '🟡', color: '#ffab00' },
      unhealthy:    { label: 'Unhealthy',     emoji: '🟠', color: '#ff6d00' },
      veryUnhealthy:{ label: 'Very Unhealthy',emoji: '🔴', color: '#d50000' },
      unknown:      { label: 'N/A',           emoji: '⚪', color: '#757575' },
    };
    return map[grade];
  }
}
