export const palettes = {
    default: {
        primary: '#6366F1', // Indigo 500
        primaryLight: '#818CF8',
        primaryDark: '#4F46E5',
        secondary: '#10B981', // Emerald 500
        secondaryLight: '#34D399',
        accent: '#F59E0B', // Amber 500
        background: '#0F172A', // Slate 900
        surface: '#1E293B', // Slate 800
        text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8',
            tertiary: '#64748B',
            inverse: '#FFFFFF',
        },
        border: '#334155',
        status: {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
        },
        rank: {
            gold: '#FBBF24',
            silver: '#94A3B8',
            bronze: '#B45309',
        },
        tiers: {
            legend: '#8B5CF6',
            elite: '#EF4444',
            pro: '#F59E0B',
            active: '#10B981',
            beginner: '#6B7280',
        },
        streak: {
            cold: '#64748B',
            warming: '#FBBF24',
            hot: '#FB923C',
            fire: '#C026D3',
            broken: '#475569',
        },
        aura: {
            inactive: '#64748B',
            weak: '#3B82F6',
            stable: '#10B981',
            strong: '#F97316',
            legendary: '#A855F7',
            legendaryGlow: '#FBBF24',
        }
    },
    minimalist: {
        primary: '#4A5D4E', // Sage Green
        primaryLight: '#6B8E76',
        primaryDark: '#2D3A31',
        secondary: '#D4A373', // Sandy Brown
        secondaryLight: '#E9C46A',
        accent: '#E76F51', // Terra Cotta
        background: '#F8F9FA', // Off White
        surface: '#FFFFFF', // Pure White
        text: {
            primary: '#212529', // Dark Charcoal
            secondary: '#6C757D', // Gray
            tertiary: '#ADB5BD', // Light Gray
            inverse: '#FFFFFF',
        },
        border: '#DEE2E6',
        status: {
            success: '#52B788',
            error: '#E63946',
            warning: '#F4A261',
            info: '#457B9D',
        },
        rank: {
            gold: '#D4AF37',
            silver: '#C0C0C0',
            bronze: '#CD7F32',
        },
        tiers: {
            legend: '#6D597A',
            elite: '#B56576',
            pro: '#E56B6F',
            active: '#EAAC8B',
            beginner: '#ADB5BD',
        },
        streak: {
            cold: '#CED4DA',
            warming: '#FFD166',
            hot: '#F78C6B',
            fire: '#EF476F',
            broken: '#E9ECEF',
        },
        aura: {
            inactive: '#DEE2E6',
            weak: '#90E0EF',
            stable: '#B7E4C7',
            strong: '#FFD8BE',
            legendary: '#D8E2DC',
            legendaryGlow: '#FFE5D9',
        }
    }
};

import { useTheme } from './ThemeContext';

export const colors = palettes.default;

export const useColors = () => {
    const { theme } = useTheme();
    return palettes[theme] || palettes.default;
};

