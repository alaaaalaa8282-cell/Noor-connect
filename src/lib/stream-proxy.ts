/**
 * Video Stream Proxy Configuration
 * Handles alternative streaming methods for restricted networks
 * YouTube sources have been removed for F-Droid compliance.
 */

export interface StreamProxy {
    name: string;
    type: 'direct' | 'audio';
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
            url: 'https://radioquran.streamguys1.com:7220/;',
        },
        {
            name: 'Quran Stream',
            type: 'audio',
            url: 'https://stream.radioquran.net/quran-ar',
        },
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
            url: 'https://radioquran.streamguys1.com:7220/;',
        },
        {
            name: 'Quran Stream',
            type: 'audio',
            url: 'https://stream.radioquran.net/quran-ar',
        },
    ]
};
