import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n-new';

export const useI18n = () => {
    const { t } = useTranslation(undefined, { i18n });
    
    return {
        t,
        // Helper for pluralized strings
        tp: (key: string, count: number, options?: any) => {
            return t(key, { count, ...options });
        },
        
        // Helper for formatting numbers with locale
        formatNumber: (num: number) => {
            return new Intl.NumberFormat(undefined).format(num);
        },
        
        // Helper for formatting dates with locale
        formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
            return new Intl.DateTimeFormat(undefined, options).format(date);
        },
    };
};
