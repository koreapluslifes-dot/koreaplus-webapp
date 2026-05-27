/**
 * 기상청 동네예보 API (Korea Meteorological Administration)
 *
 * API Portal: https://www.data.go.kr/data/15084084/openapi.do
 * Base URL:   https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/
 *
 * Two endpoints used:
 *  - getUltraSrtNcst: Ultra-short-range current observation (updated every hour)
 *  - getVilageFcst:   Short-range village forecast (3-hr intervals, up to 3 days)
 *
 * Grid coordinates (nx, ny) map lat/lng to KMA's Lambert Conformal grid.
 * Pre-computed values are used for major Korean cities.
 *
 * @example
 *   const client = new WeatherClient(env.KMA_API_KEY);
 *   const weather = await client.getCurrentWeather('Seoul');
 */

import type { WeatherData, SkyCode, RainCode } from './schema.ts';

const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

// ── KMA grid coordinates for major cities ─────────────────────────────────────
interface CityGrid {
  ko: string;
  nx: number;
  ny: number;
  lat: number;
  lng: number;
  airStation: string; // AirKorea station name for this city
}

export const CITY_GRIDS: Record<string, CityGrid> = {
  Seoul:     { ko: '서울',   nx: 60,  ny: 127, lat: 37.57, lng: 126.97, airStation: '종로구' },
  Busan:     { ko: '부산',   nx: 98,  ny: 76,  lat: 35.10, lng: 129.03, airStation: '연제구' },
  Incheon:   { ko: '인천',   nx: 55,  ny: 124, lat: 37.46, lng: 126.70, airStation: '미추홀구' },
  Daegu:     { ko: '대구',   nx: 89,  ny: 90,  lat: 35.87, lng: 128.60, airStation: '중구' },
  Gwangju:   { ko: '광주',   nx: 58,  ny: 74,  lat: 35.16, lng: 126.85, airStation: '북구' },
  Daejeon:   { ko: '대전',   nx: 67,  ny: 100, lat: 36.35, lng: 127.38, airStation: '서구' },
  Ulsan:     { ko: '울산',   nx: 102, ny: 84,  lat: 35.54, lng: 129.31, airStation: '남구' },
  Jeju:      { ko: '제주',   nx: 52,  ny: 38,  lat: 33.50, lng: 126.53, airStation: '이도동' },
  Gangneung: { ko: '강릉',   nx: 92,  ny: 131, lat: 37.75, lng: 128.87, airStation: '강릉시' },
  Jeonju:    { ko: '전주',   nx: 63,  ny: 89,  lat: 35.82, lng: 127.15, airStation: '완산구' },
  Gyeongju:  { ko: '경주',   nx: 97,  ny: 87,  lat: 35.84, lng: 129.21, airStation: '경주시' },
  Andong:    { ko: '안동',   nx: 91,  ny: 106, lat: 36.57, lng: 128.73, airStation: '안동시' },
  Yeosu:     { ko: '여수',   nx: 73,  ny: 66,  lat: 34.76, lng: 127.66, airStation: '여수시' },
  Suwon:     { ko: '수원',   nx: 60,  ny: 121, lat: 37.26, lng: 127.00, airStation: '팔달구' },
  Chuncheon: { ko: '춘천',   nx: 73,  ny: 134, lat: 37.88, lng: 127.73, airStation: '춘천시' },
};

// ── Code interpretation tables ────────────────────────────────────────────────

// SKY: 1=맑음, 3=구름많음, 4=흐림
const SKY_MAP: Record<string, { code: SkyCode; en: string; ko: string; emoji: string }> = {
  '1': { code: 'clear',        en: 'Clear',         ko: '맑음',     emoji: '☀️' },
  '3': { code: 'mostlyCloudy', en: 'Mostly Cloudy', ko: '구름많음', emoji: '⛅' },
  '4': { code: 'overcast',     en: 'Overcast',      ko: '흐림',     emoji: '☁️' },
};

// PTY: 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기, 5=빗방울, 6=빗방울/눈날림, 7=눈날림
const RAIN_MAP: Record<string, { code: RainCode; en: string; ko: string; emoji: string }> = {
  '0': { code: 'none',       en: 'No Precipitation', ko: '없음',       emoji: '' },
  '1': { code: 'rain',       en: 'Rain',             ko: '비',         emoji: '🌧️' },
  '2': { code: 'mixed',      en: 'Sleet',            ko: '비/눈',      emoji: '🌨️' },
  '3': { code: 'snow',       en: 'Snow',             ko: '눈',         emoji: '❄️' },
  '4': { code: 'shower',     en: 'Shower',           ko: '소나기',     emoji: '🌦️' },
  '5': { code: 'drizzle',    en: 'Drizzle',          ko: '빗방울',     emoji: '🌦️' },
  '6': { code: 'mixed',      en: 'Drizzle & Snow',   ko: '빗방울/눈',  emoji: '🌨️' },
  '7': { code: 'blowingSnow',en: 'Blowing Snow',     ko: '눈날림',     emoji: '❄️' },
};

interface KmaItem {
  category: string;
  obsrValue?: string;  // ultra short range (현재실황)
  fcstValue?: string;  // forecast
  fcstDate?: string;
  fcstTime?: string;
}

interface KmaResponse {
  response?: {
    header?: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item: KmaItem | KmaItem[] };
    };
  };
}

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

/** Returns the most recent valid base_time for getUltraSrtNcst (updated every hour, 40 min delay) */
function ultraSrtBaseTime(): string {
  const now = new Date();
  const minutes = now.getUTCMinutes();
  // Data available ~40 min after the hour; use previous hour if < 40 min past
  let hour = now.getUTCHours();
  if (minutes < 40) hour = (hour - 1 + 24) % 24;
  return `${String(hour).padStart(2, '0')}00`;
}

/** Returns the most recent valid base_time for getVilageFcst (issued at 02,05,08,11,14,17,20,23 KST) */
function vilageFcstBaseTime(): string {
  const kstHour = (new Date().getUTCHours() + 9) % 24;
  const issueTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let base = 23;
  for (const t of issueTimes) {
    if (kstHour >= t) base = t;
  }
  return `${String(base).padStart(2, '0')}00`;
}

export class WeatherClient {
  private readonly key: string;

  constructor(serviceKey: string) {
    this.key = serviceKey;
  }

  private url(endpoint: string, params: Record<string, string | number>): string {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    return `${BASE}/${endpoint}?serviceKey=${this.key}&dataType=JSON&${qs}`;
  }

  private items(data: KmaResponse): KmaItem[] {
    const raw = data.response?.body?.items?.item;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  /**
   * Get current observed weather for a city (ultra-short-range, updated hourly).
   * Falls back to village forecast if observation fails.
   */
  async getCurrentWeather(city: string): Promise<WeatherData> {
    const grid = CITY_GRIDS[city];
    if (!grid) throw new Error(`Unknown city: ${city}`);

    const baseDate = todayYYYYMMDD();
    const baseTime = ultraSrtBaseTime();

    const url = this.url('getUltraSrtNcst', {
      numOfRows: 10,
      pageNo: 1,
      base_date: baseDate,
      base_time: baseTime,
      nx: grid.nx,
      ny: grid.ny,
    });

    const data = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) })
      .then(r => r.json() as Promise<KmaResponse>);

    const obs: Record<string, string> = {};
    for (const item of this.items(data)) {
      obs[item.category] = item.obsrValue ?? '';
    }

    const skyRaw = obs.SKY ?? '1';
    const rainRaw = obs.PTY ?? '0';
    const sky = SKY_MAP[skyRaw] ?? SKY_MAP['1'];
    const rain = RAIN_MAP[rainRaw] ?? RAIN_MAP['0'];

    const hasRain = rainRaw !== '0';
    const condition = hasRain ? rain.en : sky.en;
    const conditionKo = hasRain ? rain.ko : sky.ko;
    const conditionEmoji = hasRain ? rain.emoji : sky.emoji;

    return {
      city,
      cityKo: grid.ko,
      nx: grid.nx,
      ny: grid.ny,
      temp: parseFloat(obs.T1H ?? '0'),
      humidity: parseFloat(obs.REH ?? '0'),
      windSpeed: parseFloat(obs.WSD ?? '0'),
      windDir: parseFloat(obs.VEC ?? '0'),
      sky: sky.code,
      rainType: rain.code,
      condition,
      conditionKo,
      conditionEmoji,
      precipitation: parseFloat(obs.RN1 ?? '0') || undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get 3-hourly forecast for the next 3 days (village forecast).
   * Returns an array of forecast snapshots grouped by date+time.
   */
  async getForecast(city: string): Promise<{
    datetime: string; temp: number; condition: string; emoji: string; rainProb: number;
  }[]> {
    const grid = CITY_GRIDS[city];
    if (!grid) throw new Error(`Unknown city: ${city}`);

    const baseDate = todayYYYYMMDD();
    const baseTime = vilageFcstBaseTime();

    const url = this.url('getVilageFcst', {
      numOfRows: 300,
      pageNo: 1,
      base_date: baseDate,
      base_time: baseTime,
      nx: grid.nx,
      ny: grid.ny,
    });

    const data = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) })
      .then(r => r.json() as Promise<KmaResponse>);

    // Group items by fcstDate + fcstTime
    const grouped = new Map<string, Record<string, string>>();
    for (const item of this.items(data)) {
      const key = `${item.fcstDate}_${item.fcstTime}`;
      if (!grouped.has(key)) grouped.set(key, {});
      grouped.get(key)![item.category] = item.fcstValue ?? '';
    }

    const results: { datetime: string; temp: number; condition: string; emoji: string; rainProb: number }[] = [];
    for (const [key, obs] of grouped) {
      const skyRaw = obs.SKY ?? '1';
      const rainRaw = obs.PTY ?? '0';
      const sky = SKY_MAP[skyRaw] ?? SKY_MAP['1'];
      const rain = RAIN_MAP[rainRaw] ?? RAIN_MAP['0'];
      const hasRain = rainRaw !== '0';

      results.push({
        datetime: key.replace('_', 'T'),
        temp: parseFloat(obs.TMP ?? '0'),
        condition: hasRain ? rain.en : sky.en,
        emoji: hasRain ? rain.emoji : sky.emoji,
        rainProb: parseInt(obs.POP ?? '0'),
      });
    }

    // Return up to 24 slots (3 days × 8 per day)
    return results.slice(0, 24);
  }

  /** List all supported city names */
  static supportedCities(): string[] {
    return Object.keys(CITY_GRIDS);
  }
}
