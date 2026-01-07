import { AuraState } from './AuraState';

export interface User {
    id: string;
    displayName: string;
    currentStreak?: number;
    auraState?: AuraState;
}
