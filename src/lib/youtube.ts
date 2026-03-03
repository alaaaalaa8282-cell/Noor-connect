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
 * Uses YouTube Data API search endpoint with eventType=live and type=video
 */
export async function getCurrentLiveVideoId(channelId: string): Promise<string | null> {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    
    if (!apiKey) {
        console.warn('[YouTube] No API key found');
        return null;
    }

    try {
        // Search for live videos on the channel
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&order=date&key=${apiKey}`;
        
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            console.error(`[YouTube] API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`[YouTube] Error details: ${errorText}`);
            return null;
        }

        const data = await response.json();
        
        // Check if we found any live videos
        if (data.items && data.items.length > 0) {
            const liveVideo = data.items[0];
            const videoId = liveVideo.id.videoId;
                return videoId;
        }

        return null;
        
    } catch (error) {
        console.error(`[YouTube] Error fetching live video ID for ${channelId}:`, error);
        return null;
    }
}

/**
 * Get live video ID with multiple fallback strategies
 */
export async function getLiveVideoIdWithFallback(channelId: string, fallbackId: string): Promise<string> {
    
    // Try to get current live video first
    const liveVideoId = await getCurrentLiveVideoId(channelId);
    
    if (liveVideoId) {
        return liveVideoId;
    }
    
    
    // If no live video found, try to get the most recent video
    try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (apiKey) {
            const recentVideosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=1&key=${apiKey}`;
            
            
            const response = await fetch(recentVideosUrl);
            if (response.ok) {
                const data = await response.json();
                
                if (data.items && data.items.length > 0) {
                    const recentVideoId = data.items[0].id.videoId;
                        return recentVideoId;
                }
            } else {
                console.error(`[YouTube] Recent videos API error: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error(`[YouTube] Error fetching recent videos:`, error);
    }
    
    // Final fallback - use the hardcoded emergency ID
    console.warn(`[YouTube] Using emergency fallback ID for channel ${channelId}: ${fallbackId}`);
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
