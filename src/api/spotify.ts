/**
 * Spotify Web API — canonical artist metadata, popularity, artwork, followers.
 *
 * Auth: OAuth 2.0 Client Credentials (no user login). The bearer token is
 * cached in KV (key `spotify:token`) so we mint one token per ~55 min instead
 * of per request.
 *
 * NOTE (May 2025): a Spotify *developer* account now requires an active Spotify
 * Premium subscription, and audio-features / 30s-preview / recommendations are
 * deprecated for new apps — this client deliberately avoids all of them and uses
 * only artist + new-releases (stable, metadata-only) endpoints.
 *
 * Secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 *
 * @example
 *   const client = new SpotifyClient(id, secret, env);
 *   const artist = await client.getArtist('6HvFMzyDtX2J0OmBnzWNAm'); // NewJeans
 */

import type { CacheEnv } from '../cache.ts';
import type { KpopArtist } from './schema.ts';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const TOKEN_KV_KEY = 'kp:spotify:token';

interface SpotifyTokenResponse { access_token?: string; token_type?: string; expires_in?: number }
interface SpotifyImage { url: string; width?: number; height?: number }
interface SpotifyArtistResponse {
  id?: string;
  name?: string;
  genres?: string[];
  popularity?: number;
  followers?: { total?: number };
  images?: SpotifyImage[];
}
interface SpotifyAlbumItem {
  id?: string;
  name?: string;
  release_date?: string;
  album_type?: string;
  images?: SpotifyImage[];
  external_urls?: { spotify?: string };
  artists?: { name?: string }[];
}
interface SpotifyNewReleases { albums?: { items?: SpotifyAlbumItem[] } }

export class SpotifyClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly env: CacheEnv;

  constructor(clientId: string, clientSecret: string, env: CacheEnv) {
    this.clientId = clientId.trim();
    this.clientSecret = clientSecret.trim();
    this.env = env;
  }

  /** Mint or reuse a cached client-credentials bearer token. */
  private async getToken(): Promise<string> {
    if (this.env.CACHE_KV) {
      const cached = await this.env.CACHE_KV.get(TOKEN_KV_KEY);
      if (cached) return cached;
    }
    const basic = btoa(`${this.clientId}:${this.clientSecret}`);
    const res = await globalThis.fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Spotify token HTTP ${res.status}`);
    const data = await res.json() as SpotifyTokenResponse;
    const token = data.access_token;
    if (!token) throw new Error('Spotify token missing in response');
    if (this.env.CACHE_KV) {
      const ttl = Math.max((data.expires_in ?? 3600) - 60, 60);
      this.env.CACHE_KV.put(TOKEN_KV_KEY, token, { expirationTtl: ttl }).catch(() => {});
    }
    return token;
  }

  private async apiGet<T>(path: string): Promise<T> {
    const token = await this.getToken();
    const res = await globalThis.fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Spotify API HTTP ${res.status} (${path})`);
    return res.json() as Promise<T>;
  }

  /** Artist popularity, followers, genres, artwork. */
  async getArtist(spotifyId: string): Promise<Partial<KpopArtist>> {
    const a = await this.apiGet<SpotifyArtistResponse>(`/artists/${encodeURIComponent(spotifyId)}`);
    return {
      spotifyId: a.id,
      nameEn: a.name,
      spotifyPopularity: a.popularity,
      spotifyFollowers: a.followers?.total,
      genres: a.genres,
      image: a.images?.[0]?.url,
    };
  }

  /** Latest new releases (album-type) — used for the comeback/release feed. */
  async getNewReleases(market = 'KR', limit = 20): Promise<SpotifyAlbumItem[]> {
    const data = await this.apiGet<SpotifyNewReleases>(
      `/browse/new-releases?country=${market}&limit=${Math.min(limit, 50)}`,
    );
    return data.albums?.items ?? [];
  }
}
