import { Platform, NativeModules } from 'react-native';
import { en } from './locales/en';
import { es } from './locales/es';

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_locale';
const locales: Record<string, any> = { en, es };

let currentLocale = 'en';

// Simple locale detection
const getDeviceLocale = (): string => {
    try {
        let locale: string | undefined;

        if (Platform.OS === 'ios') {
            locale =
                NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                NativeModules.SettingsManager?.settings?.AppleLocale;
        } else if (Platform.OS === 'android') {
            locale = NativeModules.I18nManager?.localeIdentifier;
        }

        if (!locale) return 'en';

        return locale.split(/[-_]/)[0]; // Just get 'en' or 'es'
    } catch (e) {
        return 'en';
    }
};

// Initialize locale
export const initLocale = async () => {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && locales[saved]) {
            currentLocale = saved;
        } else {
            currentLocale = getDeviceLocale() === 'es' ? 'es' : 'en';
        }
    } catch (e) {
        // Fallback to default during static export
        currentLocale = 'en';
    }
};

export const setLocale = async (locale: string) => {
    if (locales[locale]) {
        currentLocale = locale;
        await AsyncStorage.setItem(STORAGE_KEY, locale);
    }
};

export const getCurrentLocale = () => currentLocale;

// Call init immediately (though it's async, the first t() calls might use default 'en')
initLocale();

/**
 * Simple translation function
 * @param key Key in the locale object (e.g., 'home.greeting')
 * @param params Parameters to replace in the string (e.g., { count: 5 })
 */
export const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = locales[currentLocale];

    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            // Fallback to English if key not found in current locale
            let fallbackValue = locales['en'];
            for (const fk of keys) {
                if (fallbackValue && fallbackValue[fk]) {
                    fallbackValue = fallbackValue[fk];
                } else {
                    return key; // Return the key itself if not found anywhere
                }
            }
            value = fallbackValue;
            break;
        }
    }

    if (typeof value !== 'string') return key;

    if (params) {
        Object.keys(params).forEach((param) => {
            value = (value as string).replace(`{{${param}}}`, String(params[param]));
        });
    }

    return value as string;
};
