import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'override_api_url';

const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
});

export const EMULATOR_API_URL = 'http://10.0.2.2:3000';
export const LOCAL_API_URL = 'http://192.168.0.20:3000';
export const PROD_API_URL = 'https://sanchallenges.onrender.com';

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

let currentApiUrl = DEFAULT_API_URL;

export const getApiUrl = async () => {
    const override = await AsyncStorage.getItem(STORAGE_KEY);
    return override || DEFAULT_API_URL;
};

export const setApiUrl = async (url: string | null) => {
    if (url) {
        await AsyncStorage.setItem(STORAGE_KEY, url);
        currentApiUrl = url;
    } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        currentApiUrl = DEFAULT_API_URL || '';
    }
};

// For synchronous access where possible
export const Config = {
    get API_URL() {
        return currentApiUrl;
    }
};

getApiUrl().then(url => {
    currentApiUrl = url;
}).catch(() => {
    // Expected during static export
});
