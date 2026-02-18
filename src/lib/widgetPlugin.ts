import { Capacitor } from '@capacitor/core';

export interface WidgetPlugin {
  updateWidget(options: {
    name: string;
    time: string;
    remaining?: string;
    location?: string;
  }): Promise<{ status: string }>;
}

const WidgetPlugin = Capacitor.registerPlugin<WidgetPlugin>('WidgetPlugin');

export { WidgetPlugin };
