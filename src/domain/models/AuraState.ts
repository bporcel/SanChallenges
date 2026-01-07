export type AuraState = 'inactive' | 'weak' | 'stable' | 'strong' | 'legendary';

export interface AuraConfig {
    threshold: number;
    label: string;
}

export const AURA_THRESHOLDS: Record<AuraState, AuraConfig> = {
    inactive: { threshold: 0, label: 'Inactive' },
    weak: { threshold: 1, label: 'Weak' },
    stable: { threshold: 3, label: 'Stable' },
    strong: { threshold: 7, label: 'Strong' },
    legendary: { threshold: 14, label: 'Legendary' }
};
