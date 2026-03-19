/**
 * Video Stream Proxy Configuration
 * Handles alternative streaming methods for restricted networks
 */

export interface StreamProxy {
    name: string;
    type: 'youtube' | 'direct' | 'proxy' | 'vimeo' | 'twitch' | 'audio';
    url: string;
    fallback?: string;
}

export const STREAM_PROXIES: Record<'makkah' | 'madinah', StreamProxy[]> = {
    makkah: [
        {
            name: 'Haramain TV Live',
            type: 'direct',
            url: 'https://www.haramain.tv/live-stream',
            fallback: 'https://www.haramain.tv'
        },
        {
            name: 'Saudi Quran TV',
            type: 'direct',
            url: 'https://sauditv.live/stream-quran',
            fallback: 'https://sauditv.live'
        },
        {
            name: 'Makkah Live Audio',
            type: 'audio',
            url: 'https://qurandownload.org/audio/quran/192/arabic/Alafasy_192kbps/001.mp3',
            fallback: null
        },
        {
            name: 'Islamic Radio',
            type: 'audio',
            url: 'https://radioquran.streamguys1.com:7220/;',
            fallback: null
        },
        {
            name: 'Quran Stream',
            type: 'audio',
            url: 'https://stream.radioquran.net/quran-ar',
            fallback: null
        },
        {
            name: 'Primary YouTube',
            type: 'youtube',
            url: 'https://www.youtube-nocookie.com/embed/Cm1v4bteXbI',
            fallback: 'https://www.youtube.com/watch?v=Cm1v4bteXbI'
        }
    ],
    madinah: [
        {
            name: 'Nabawi TV Live',
            type: 'direct',
            url: 'https://www.nabawi.tv/live-stream',
            fallback: 'https://www.nabawi.tv'
        },
        {
            name: 'Saudi Sunnah TV',
            type: 'direct',
            url: 'https://sauditv.live/stream-sunnah',
            fallback: 'https://sauditv.live'
        },
        {
            name: 'Madinah Live Audio',
            type: 'audio',
            url: 'https://qurandownload.org/audio/quran/192/arabic/Alafasy_192kbps/001.mp3',
            fallback: null
        },
        {
            name: 'Islamic Radio',
            type: 'audio',
            url: 'https://radioquran.streamguys1.com:7220/;',
            fallback: null
        },
        {
            name: 'Quran Stream',
            type: 'audio',
            url: 'https://stream.radioquran.net/quran-ar',
            fallback: null
        },
        {
            name: 'Primary YouTube',
            type: 'youtube',
            url: 'https://www.youtube-nocookie.com/embed/CXJ0C03Nr_U',
            fallback: 'https://www.youtube.com/watch?v=CXJ0C03Nr_U'
        }
    ]
};

/**
 * Network detection utilities
 */
export const NetworkUtils = {
    /**
     * Check if YouTube is likely blocked by testing connectivity
     */
    async checkYouTubeConnectivity(): Promise<boolean> {
        try {
            const response = await fetch('https://www.youtube-nocookie.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Get the best available proxy based on network conditions
     */
    async getBestProxy(stream: 'makkah' | 'madinah'): Promise<StreamProxy> {
        const proxies = STREAM_PROXIES[stream];
        
        // Prioritize non-YouTube sources first (since YouTube is often blocked)
        const nonYouTubeProxies = proxies.filter(p => p.type !== 'youtube');
        if (nonYouTubeProxies.length > 0) {
            return nonYouTubeProxies[0]; // Use first non-YouTube source
        }
        
        // Try YouTube connectivity last
        const youTubeAvailable = await this.checkYouTubeConnectivity();
        if (youTubeAvailable) {
            return proxies[0]; // Use primary YouTube
        }
        
        // Fallback to direct stream
        return proxies.find(p => p.type === 'direct') || proxies[0];
    },

    /**
     * Detect if YouTube is blocked based on console errors
     */
    detectYouTubeBlock(): boolean {
        // Check for common YouTube block indicators
        const errors = [
            'ERR_BLOCKED_BY_CLIENT',
            'youtube-nocookie.com',
            'generate_204'
        ];
        
        return errors.some(error => 
            console.error.toString().includes(error) ||
            document.title.includes('blocked')
        );
    }
};
