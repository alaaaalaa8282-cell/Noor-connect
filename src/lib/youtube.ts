/**
 * YouTube Data API Utility
 * Handles fetching live stream IDs for Makkah and Madinah with caching
 */

const CACHE_KEY = 'youtube-live-ids';
const CACHE_DURATION = 5 * 60 * 1000; // Reduced to 5 minutes for more frequent updates

interface CachedData {
    makkah: string | null;
    madinah: string | null;
    timestamp: number;
}

const CHANNELS = {
    MAKKAH: 'UC8f_N_B_qY9JAnPDR9_VInA', // Saudi Quran TV
    MADINAH: 'UCROKYPep-UuODNwyipe6JMw'  // Saudi Sunnah TV
};

const EMERGENCY_IDS = {
    MAKKAH: 'Cm1v4bteXbI', // Known working Makkah stream
    MADINAH: 'CXJ0C03Nr_U'  // Known working Madinah stream
};

/**
 * Standalone function to fetch current live video ID for any channel
 * Client-side YouTube API keys would be exposed in the bundle, so we avoid
 * remote lookup here and rely on cached or emergency IDs instead.
 */
export async function getCurrentLiveVideoId(channelId: string): Promise<string | null> {
    if (channelId === CHANNELS.MAKKAH) return EMERGENCY_IDS.MAKKAH;
    if (channelId === CHANNELS.MADINAH) return EMERGENCY_IDS.MADINAH;
    return null;
}

/**
 * Get live video ID with multiple fallback strategies
 */
export async function getLiveVideoIdWithFallback(channelId: string, fallbackId: string): Promise<string> {
    const liveVideoId = await getCurrentLiveVideoId(channelId);
    if (liveVideoId) {
        return liveVideoId;
    }

    // Final fallback - use the hardcoded emergency ID.
    return fallbackId;
}

export const YoutubeService = {
    /**
     * Get live video ID for a specific channel (using enhanced fallback logic)
     */
    async getLiveVideoId(channelId: string, fallbackId: string): Promise<string> {
        return await getLiveVideoIdWithFallback(channelId, fallbackId);
    },

    /**
     * Get cached or fresh live stream IDs for both channels
     */
    async getLiveStreams(): Promise<{ makkah: string; madinah: string }> {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data: CachedData = JSON.parse(cached);
            const isExpired = Date.now() - data.timestamp > CACHE_DURATION;

            if (!isExpired && data.makkah && data.madinah) {
                return {
                    makkah: data.makkah,
                    madinah: data.madinah
                };
            }
        }

        // Fetch fresh data with enhanced fallbacks
        const [makkahId, madinahId] = await Promise.all([
            this.getLiveVideoId(CHANNELS.MAKKAH, EMERGENCY_IDS.MAKKAH),
            this.getLiveVideoId(CHANNELS.MADINAH, EMERGENCY_IDS.MADINAH)
        ]);

        // Save to cache
        const newData: CachedData = {
            makkah: makkahId,
            madinah: madinahId,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(newData));

        return {
            makkah: makkahId,
            madinah: madinahId
        };
    },

    /**
     * Force refresh live streams (bypass cache)
     */
    async forceRefreshLiveStreams(): Promise<{ makkah: string; madinah: string }> {
        this.clearCache();
        return await this.getLiveStreams();
    },

    /**
     * Get live stream for specific channel only
     */
    async getChannelLiveStream(channel: 'makkah' | 'madinah'): Promise<string> {
        const channelId = channel === 'makkah' ? CHANNELS.MAKKAH : CHANNELS.MADINAH;
        const fallbackId = channel === 'makkah' ? EMERGENCY_IDS.MAKKAH : EMERGENCY_IDS.MADINAH;
        
        return await this.getLiveVideoId(channelId, fallbackId);
    },

    /**
     * Clear the cached live stream IDs
     */
    clearCache() {
        localStorage.removeItem(CACHE_KEY);
    }
};
