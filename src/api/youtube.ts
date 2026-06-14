/**
 * YouTube Data API v3 — MV view counts (THE real-time K-pop hype metric),
 * channel stats, and latest uploads.
 *
 * QUOTA DISCIPLINE (mandatory): 10,000 units/day. `search.list` costs 100 units
 * (≈100 calls/day) — this client NEVER calls search. It resolves channel IDs
 * from the manual roster, reads the channel `uploads` playlist (1u) and batches
 * `videos.list` (1u) for view counts. A full "latest uploads + stats" pull is
 * ~3 units. Always wrap calls in withCache (30–60 min) at the route layer.
 *
 * Secret: YOUTUBE_API_KEY
 *
 * @example
 *   const client = new YoutubeClient(env.YOUTUBE_API_KEY);
 *   const vids = await client.getLatestUploads('UClud...', 6);
 */

import type { MusicVideo } from './schema.ts';

const API = 'https://www.googleapis.com/youtube/v3';

interface YtThumbnails { medium?: { url?: string }; high?: { url?: string }; default?: { url?: string } }
interface YtChannelItem {
  id?: string;
  snippet?: { title?: string; thumbnails?: YtThumbnails };
  statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}
interface YtChannelResponse { items?: YtChannelItem[] }
interface YtPlaylistItem { snippet?: { resourceId?: { videoId?: string } } }
interface YtPlaylistResponse { items?: YtPlaylistItem[] }
interface YtVideoItem {
  id?: string;
  snippet?: { title?: string; channelTitle?: string; publishedAt?: string; thumbnails?: YtThumbnails };
  statistics?: { viewCount?: string; likeCount?: string };
}
interface YtVideoResponse { items?: YtVideoItem[] }

export interface ChannelStats {
  channelId: string;
  title?: string;
  subscribers?: number;
  views?: number;
  videoCount?: number;
  uploadsPlaylist?: string;
  thumbnail?: string;
}

const num = (s?: string): number | undefined => (s == null ? undefined : Number(s));
const thumb = (t?: YtThumbnails): string | undefined => t?.high?.url || t?.medium?.url || t?.default?.url;

export class YoutubeClient {
  private readonly key: string;

  constructor(apiKey: string) {
    this.key = apiKey.trim();
  }

  private async apiGet<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const res = await globalThis.fetch(`${API}${path}${sep}key=${this.key}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`YouTube API HTTP ${res.status} (${path.split('?')[0]})`);
    return res.json() as Promise<T>;
  }

  /** channels.list — stats + uploads playlist id (1 unit). */
  async getChannelStats(channelId: string): Promise<ChannelStats> {
    const data = await this.apiGet<YtChannelResponse>(
      `/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}`,
    );
    const c = data.items?.[0];
    return {
      channelId,
      title: c?.snippet?.title,
      subscribers: num(c?.statistics?.subscriberCount),
      views: num(c?.statistics?.viewCount),
      videoCount: num(c?.statistics?.videoCount),
      uploadsPlaylist: c?.contentDetails?.relatedPlaylists?.uploads,
      thumbnail: thumb(c?.snippet?.thumbnails),
    };
  }

  /**
   * Latest uploads with view/like counts (no search.list).
   * Cost: 1 (channels) + 1 (playlistItems) + 1 (videos) = 3 units.
   */
  async getLatestUploads(channelId: string, max = 6): Promise<MusicVideo[]> {
    const stats = await this.getChannelStats(channelId);
    const playlist = stats.uploadsPlaylist;
    if (!playlist) return [];

    const pl = await this.apiGet<YtPlaylistResponse>(
      `/playlistItems?part=snippet&maxResults=${Math.min(max, 50)}&playlistId=${encodeURIComponent(playlist)}`,
    );
    const ids = (pl.items ?? [])
      .map(i => i.snippet?.resourceId?.videoId)
      .filter((v): v is string => !!v);
    if (!ids.length) return [];

    const vids = await this.apiGet<YtVideoResponse>(
      `/videos?part=snippet,statistics&id=${ids.map(encodeURIComponent).join(',')}`,
    );
    return (vids.items ?? []).map((v): MusicVideo => ({
      videoId: v.id ?? '',
      title: v.snippet?.title ?? '',
      artist: v.snippet?.channelTitle,
      thumbnail: thumb(v.snippet?.thumbnails),
      publishedAt: v.snippet?.publishedAt ?? '',
      viewCount: num(v.statistics?.viewCount),
      likeCount: num(v.statistics?.likeCount),
      url: `https://www.youtube.com/watch?v=${v.id ?? ''}`,
    }));
  }
}
