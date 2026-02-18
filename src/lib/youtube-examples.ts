/**
 * Example usage of YouTube live stream functions
 * 
 * These functions use the YouTube Data API search endpoint with:
 * - eventType=live (filters for live streams only)
 * - type=video (ensures we get video results)
 * - channelId (specific to Saudi Quran and Sunnah channels)
 */

import { getCurrentLiveVideoId, getLiveVideoIdWithFallback, YoutubeService } from '@/lib/youtube';

// Example 1: Get current live video ID for Saudi Quran TV (Makkah)
export async function getMakkahLiveId() {
    const channelId = 'UC8f_N_B_qY9JAnPDR9_VInA'; // Saudi Quran TV
    
    try {
        const liveVideoId = await getCurrentLiveVideoId(channelId);
        
        if (liveVideoId) {
            console.log('Makkah live video ID:', liveVideoId);
            return liveVideoId;
        } else {
            console.log('No live stream currently available for Makkah');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Makkah live stream:', error);
        return null;
    }
}

// Example 2: Get live video ID with fallback for Saudi Sunnah TV (Madinah)
export async function getMadinahLiveId() {
    const channelId = 'UCROKYPep-UuODNwyipe6JMw'; // Saudi Sunnah TV
    const fallbackId = 'Y_I7G9v7W8Y'; // Emergency fallback
    
    try {
        const videoId = await getLiveVideoIdWithFallback(channelId, fallbackId);
        console.log('Madinah video ID (with fallback):', videoId);
        return videoId;
    } catch (error) {
        console.error('Error fetching Madinah stream:', error);
        return fallbackId;
    }
}

// Example 3: Get both streams with caching (recommended for production)
export async function getAllLiveStreams() {
    try {
        const streams = await YoutubeService.getLiveStreams();
        console.log('All live streams:', streams);
        return streams;
    } catch (error) {
        console.error('Error fetching live streams:', error);
        return {
            makkah: 'u_vEwM7mD60', // Emergency fallback
            madinah: 'Y_I7G9v7W8Y'  // Emergency fallback
        };
    }
}

// Example 4: Force refresh streams (bypass cache)
export async function refreshLiveStreams() {
    try {
        const streams = await YoutubeService.forceRefreshLiveStreams();
        console.log('Refreshed live streams:', streams);
        return streams;
    } catch (error) {
        console.error('Error refreshing live streams:', error);
        return null;
    }
}

// Example 5: Get specific channel stream
export async function getMakkahStream() {
    try {
        const videoId = await YoutubeService.getChannelLiveStream('makkah');
        console.log('Makkah stream ID:', videoId);
        return videoId;
    } catch (error) {
        console.error('Error getting Makkah stream:', error);
        return null;
    }
}

// Usage in React component:
/*
import { useState, useEffect } from 'react';
import { getAllLiveStreams } from './youtube-examples';

function LiveStreamPlayer() {
    const [videoIds, setVideoIds] = useState({ makkah: '', madinah: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStreams = async () => {
            try {
                const streams = await getAllLiveStreams();
                setVideoIds(streams);
            } catch (error) {
                console.error('Failed to load streams:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStreams();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoIds.makkah}`}
                title="Makkah Live"
                allowFullScreen
            />
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoIds.madinah}`}
                title="Madinah Live"
                allowFullScreen
            />
        </div>
    );
}
*/
