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
let lastYouTubeBlocked = false;

export const NetworkUtils = {
    /**
     * Check if YouTube is likely blocked by testing connectivity
     */
    async checkYouTubeConnectivity(): Promise<boolean> {
        return await new Promise((resolve) => {
            const image = new Image();
            const cleanup = (isAvailable: boolean) => {
                lastYouTubeBlocked = !isAvailable;
                image.onload = null;
                image.onerror = null;
                clearTimeout(timeoutId);
                resolve(isAvailable);
            };

            const timeoutId = window.setTimeout(() => {
                cleanup(false);
            }, 3000);

            image.onload = () => cleanup(true);
            image.onerror = () => cleanup(false);
            image.src = `https://www.youtube-nocookie.com/favicon.ico?ts=${Date.now()}`;
        });
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
     * Returns the last observed connectivity result from checkYouTubeConnectivity().
     */
    detectYouTubeBlock(): boolean {
        return lastYouTubeBlocked;
    }
};
