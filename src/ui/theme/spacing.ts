import { useTheme } from './ThemeContext';

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const baseLayout = {
    borderRadius: {
        s: 4,
        m: 8,
        l: 12,
        xl: 16,
        round: 9999,
    },
    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
        },
    }
};

export const layout = baseLayout;

export const useLayout = () => {
    const { theme } = useTheme();

    let currentLayout = baseLayout;

    if (theme === 'minimalist') {
        currentLayout = {
            ...baseLayout,
            borderRadius: {
                s: 8,
                m: 16,
                l: 24,
                xl: 32,
                round: 9999,
            },
        };
    }

    return {
        ...currentLayout,
        theme,
    };
};
