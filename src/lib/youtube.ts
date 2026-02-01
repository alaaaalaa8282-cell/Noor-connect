/**
 * YouTube Data API Utility
 * Handles fetching live stream IDs for Makkah and Madinah with caching
 */

const CACHE_KEY = 'youtube-live-ids';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedData {
    makkah: string | null;
    madinah: string | null;
    timestamp: number;
}

const CHANNELS = {
    MAKKAH: 'UC8f_N_B_qY9JAnPDR9_VInA',
    MADINAH: 'UCROKYPep-UuODNwyipe6JMw'
};

const EMERGENCY_IDS = {
    MAKKAH: 'u_vEwM7mD60',
    MADINAH: 'Y_I7G9v7W8Y'
};

export const YoutubeService = {
    /**
     * Get live video ID for a specific channel
     */
    async getLiveVideoId(channelId: string, fallbackId: string): Promise<string> {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        console.log(`[YouTube] Checking API Key: ${apiKey ? 'Present' : 'Missing'}`);

        if (!apiKey) {
            console.warn('[YouTube] No API key found, using fallback ID');
            return fallbackId;
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
            );

            if (!response.ok) {
                console.error(`[YouTube] API Error: ${response.status} ${response.statusText}`);
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                console.log(`[YouTube] Fetched live video ID for channel ${channelId}: ${videoId}`);
                return videoId;
            }

            console.warn(`[YouTube] No live stream found for channel ${channelId}, using fallback`);
            return fallbackId;
        } catch (error) {
            console.error('[YouTube] Failed to fetch live video ID:', error);
            return fallbackId;
        }
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

            if (!isExpired) {
                return {
                    makkah: data.makkah || EMERGENCY_IDS.MAKKAH,
                    madinah: data.madinah || EMERGENCY_IDS.MADINAH
                };
            }
        }

        // Fetch fresh data with fallbacks
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
     * Clear the cached live stream IDs
     */
    clearCache() {
        localStorage.removeItem(CACHE_KEY);
        console.log('[YouTube] Cache cleared');
    }
};
