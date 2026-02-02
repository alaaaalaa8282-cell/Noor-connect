import { registerPlugin } from '@capacitor/core';

export interface WidgetPlugin {
    updateWidget(options: {
        name: string;
        time: string;
        remaining: string;
        location?: string;
    }): Promise<{ status: string }>;
}

const WidgetPlugin = registerPlugin<WidgetPlugin>('WidgetPlugin');

/**
 * Service to handle widget updates from React
 */
import { getNextPrayer } from './prayer-calculator';

export class WidgetService {
    /**
     * Update the home screen widget with the next prayer info
     */
    static async updateWidget(latitude: number, longitude: number, locationName?: string) {
        try {
            const next = getNextPrayer(latitude, longitude);
            if (!next) return;

            const isRamadan = localStorage.getItem('ramadan-mode') === 'true';
            let name = next.name;

            if (isRamadan) {
                if (next.name === 'Maghrib') name += ' (Iftar)';
                if (next.name === 'Fajr') name += ' (Suhoor)';
            }

            await WidgetPlugin.updateWidget({
                name,
                time: next.time.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }),
                remaining: next.timeUntil,
                location: locationName
            });

            console.log('Widget updated successfully:', next.name);
        } catch (error) {
            console.error('Failed to update widget:', error);
        }
    }

    /**
     * Start a timer to update the widget every 30 minutes
     */
    static startAutoUpdate(latitude: number, longitude: number, locationName?: string) {
        // Initial update
        this.updateWidget(latitude, longitude, locationName);

        // Update every 30 minutes
        return setInterval(() => {
            this.updateWidget(latitude, longitude, locationName);
        }, 30 * 60 * 1000);
    }
}
