import { AuraState } from '../models/AuraState';
import { colors } from '../../ui/theme/colors';
import { t } from '../../i18n/i18n';

export const AuraService = {
    /**
     * Calculate aura state from streak number
     */
    getAuraState(streak: number): AuraState {
        if (streak >= 14) return 'legendary';
        if (streak >= 7) return 'strong';
        if (streak >= 3) return 'stable';
        if (streak >= 1) return 'weak';
        return 'inactive';
    },

    /**
     * Get aura color for a given state
     */
    getAuraColor(state: AuraState): string {
        switch (state) {
            case 'legendary': return colors.aura.legendary;
            case 'strong': return colors.aura.strong;
            case 'stable': return colors.aura.stable;
            case 'weak': return colors.aura.weak;
            case 'inactive': return colors.aura.inactive;
            default: return colors.aura.inactive;
        }
    },

    /**
     * Get glow intensity for a given state (0-1)
     */
    getAuraGlow(state: AuraState): number {
        switch (state) {
            case 'legendary': return 1.0;
            case 'strong': return 0.8;
            case 'stable': return 0.5;
            case 'weak': return 0.3;
            case 'inactive': return 0;
            default: return 0;
        }
    },

    /**
     * Get localized label for aura state
     */
    getAuraLabel(state: AuraState): string {
        return t(`aura.${state}`);
    }
};
