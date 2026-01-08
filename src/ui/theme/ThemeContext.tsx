import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'default' | 'minimalist';

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeType>('default');

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setThemeState(savedTheme as ThemeType);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
