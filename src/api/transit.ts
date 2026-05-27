/**
 * Seoul Real-time Transit APIs
 *
 * Three data sources:
 *  1. Seoul Subway Real-time Arrival — data.seoul.go.kr
 *     GET http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimeStationArrival/0/5/{station}
 *
 *  2. Seoul Bus Real-time Arrival — ws.bus.go.kr
 *     GET http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll
 *
 *  3. 따릉이 (Seoul Public Bike) — openapi.seoul.go.kr
 *     GET http://openapi.seoul.go.kr:8088/{KEY}/json/bikeList/{start}/{end}/
 *
 * Note: These APIs use HTTP (not HTTPS). Cloudflare Workers can call HTTP endpoints.
 *
 * @example
 *   const client = new TransitClient(env.SEOUL_OPEN_DATA_KEY);
 *   const arrivals = await client.getSubwayArrivals('강남');
 *   const bikes = await client.getNearbyBikes(1, 50);
 */

import type { SubwayArrival, BikeStation } from './schema.ts';

// ── Seoul Subway line colors ──────────────────────────────────────────────────
const LINE_COLORS: Record<string, string> = {
  '1001': '#0052A4', // 1호선
  '1002': '#009246', // 2호선
  '1003': '#EF7C1C', // 3호선
  '1004': '#00A5DE', // 4호선
  '1005': '#996CAC', // 5호선
  '1006': '#CD7C2F', // 6호선
  '1007': '#747F00', // 7호선
  '1008': '#E6186C', // 8호선
  '1009': '#BDB092', // 9호선
  '1063': '#77C4A3', // 경의중앙선
  '1065': '#0090D2', // 공항철도
  '1067': '#EF7C1C', // 경춘선
  '1075': '#F5A200', // 수인분당선
  '1077': '#6EBF46', // 신분당선
  '1092': '#B0C332', // 우이신설선
  '1093': '#C7C7C7', // 서해선
};

function lineColor(subwayId: string): string {
  return LINE_COLORS[subwayId] ?? '#666666';
}

// ── Raw Seoul Subway response shapes ─────────────────────────────────────────

interface RawSubwayArrival {
  subwayId?: string;
  trainLineNm?: string;
  btrainSttus?: string;
  btrainNo?: string;
  bstatnNm?: string;
  arvlMsg2?: string;
  arvlMsg3?: string;
  barvlDt?: string;   // seconds as string
  updnLine?: '0' | '1';
  arvlCd?: string;    // 0=진입, 1=도착, 2=출발, 3=전역출발, 4=전역진입, 5=전역도착, 99=운행중
}

interface SubwayApiResponse {
  realtimeArrivalList?: RawSubwayArrival[];
  errorMessage?: {
    code?: string;
    status?: number;
    message?: string;
  };
}

// ── Raw 따릉이 response shapes ────────────────────────────────────────────────

interface RawBikeStation {
  stationId?: string;
  stationName?: string;
  stationLatitude?: string;
  stationLongitude?: string;
  parkingBikeTotCnt?: string;
  rackTotCnt?: string;
  shared?: string;
}

interface BikeApiResponse {
  rentBikeStatus?: {
    list_total_count?: number;
    RESULT?: { CODE?: string; MESSAGE?: string };
    row?: RawBikeStation[];
  };
}

export class TransitClient {
  private readonly key: string;

  constructor(seoulApiKey: string) {
    this.key = seoulApiKey;
  }

  /**
   * Get real-time subway arrivals for a station.
   * @param stationName  Korean station name (e.g. '강남', '서울역', '홍대입구')
   * @param maxResults   Max arrivals per station (default 5)
   */
  async getSubwayArrivals(stationName: string, maxResults = 5): Promise<SubwayArrival[]> {
    const encodedName = encodeURIComponent(stationName);
    const url = `http://swopenapi.seoul.go.kr/api/subway/${this.key}/json/realtimeStationArrival/0/${maxResults}/${encodedName}`;

    const res = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`Seoul Subway API HTTP ${res.status}`);

    const data = await res.json() as SubwayApiResponse;

    if (data.errorMessage?.code && data.errorMessage.code !== '00') {
      throw new Error(`Seoul Subway API: ${data.errorMessage.message ?? 'Unknown error'}`);
    }

    return (data.realtimeArrivalList ?? []).map(item => ({
      line: item.trainLineNm?.split('|')[0]?.trim() ?? '',
      direction: item.updnLine === '0' ? 'Outbound' : 'Inbound',
      destinationStation: item.arvlMsg3 ?? '',
      arrivalMessage: item.arvlMsg2 ?? '',
      secondsToArrival: item.barvlDt ? parseInt(item.barvlDt) : undefined,
      trainId: item.btrainNo,
      status: this.arrivalStatus(item.arvlCd),
      lineColor: lineColor(item.subwayId ?? ''),
      updnLine: item.updnLine ?? '0',
    }));
  }

  /**
   * Get 따릉이 (public bike) station availability.
   * Returns up to 200 stations city-wide (paginated).
   * @param startIndex  1-based start index (default 1)
   * @param endIndex    1-based end index (max 200 per request; default 50)
   */
  async getBikeStations(startIndex = 1, endIndex = 50): Promise<BikeStation[]> {
    const url = `http://openapi.seoul.go.kr:8088/${this.key}/json/bikeList/${startIndex}/${endIndex}/`;

    const res = await globalThis.fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`따릉이 API HTTP ${res.status}`);

    const data = await res.json() as BikeApiResponse;
    const rows = data.rentBikeStatus?.row ?? [];

    return rows.map(station => ({
      id: station.stationId ?? '',
      name: station.stationName ?? '',
      lat: parseFloat(station.stationLatitude ?? '0'),
      lng: parseFloat(station.stationLongitude ?? '0'),
      availableBikes: parseInt(station.parkingBikeTotCnt ?? '0'),
      totalDocks: parseInt(station.rackTotCnt ?? '0'),
      emptyDocks: parseInt(station.rackTotCnt ?? '0') - parseInt(station.parkingBikeTotCnt ?? '0'),
    })).filter(s => s.lat !== 0 && s.lng !== 0);
  }

  /**
   * Get bike stations near a GPS coordinate.
   * Fetches city-wide data then filters by distance.
   * @param lat      Latitude
   * @param lng      Longitude
   * @param radiusKm Distance threshold in km (default 1.5)
   * @param max      Max results (default 10)
   */
  async getNearbyBikeStations(lat: number, lng: number, radiusKm = 1.5, max = 10): Promise<BikeStation[]> {
    const all = await this.getBikeStations(1, 200);
    return all
      .map(s => ({ ...s, dist: haversineKm(lat, lng, s.lat, s.lng) }))
      .filter(s => s.dist <= radiusKm)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, max);
  }

  private arrivalStatus(code: string | undefined): string {
    const map: Record<string, string> = {
      '0': 'Entering', '1': 'Arrived', '2': 'Departed',
      '3': 'En Route', '4': 'Approaching', '5': 'Arriving', '99': 'En Route',
    };
    return map[code ?? '99'] ?? 'En Route';
  }
}

/** Haversine distance in km between two GPS coordinates */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Commonly queried station names ────────────────────────────────────────────
// Korean station name → standard Korean name accepted by the API
export const SUBWAY_STATIONS: Record<string, string> = {
  'Gangnam':          '강남',
  'Seoul Station':    '서울역',
  'Hongdae':          '홍대입구',
  'Myeongdong':       '명동',
  'Dongdaemun':       '동대문역사문화공원',
  'Insadong':         '안국',
  'Itaewon':          '이태원',
  'Sinchon':          '신촌',
  'Jamsil':           '잠실',
  'Coex':             '삼성',
  'Incheon Airport':  '공항화물청사',
  'Gyeongbokgung':    '경복궁',
};
