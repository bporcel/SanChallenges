import { Config } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check } from '../../domain/models/Check';
import { UserRepository } from './UserRepository';

const STORAGE_KEY = 'checks';

export const CheckRepository = {
    async getAll(): Promise<Check[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading checks', e);
            return [];
        }
    },

    async getByChallengeId(challengeId: string): Promise<Check[]> {
        const checks = await this.getAll();
        return checks.filter((c) => c.challengeId === challengeId);
    },

    async create(check: Check): Promise<void> {
        try {
            // Optimistic update: save locally first
            const checks = await this.getAll();
            const existingIndex = checks.findIndex(
                (c) => c.challengeId === check.challengeId && c.date === check.date
            );

            if (existingIndex >= 0) {
                checks[existingIndex] = check;
            } else {
                checks.push(check);
            }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checks));

            // Sync with server
            const userId = await UserRepository.getUserId();
            // Fire and forget for MVP speed
            const { id: _, ...syncData } = check;
            fetch(`${Config.API_URL}/checks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...syncData,
                    userId
                })
            }).catch(e => console.error('Background sync failed', e));

        } catch (e) {
            console.error('Error saving check', e);
        }
    },

    async getRanking(challengeId: string): Promise<{ userId: string, count: number }[]> {
        try {
            const response = await fetch(`${Config.API_URL}/challenges/${challengeId}/ranking`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (e) {
            console.error('Error fetching ranking', e);
            return [];
        }
    },

    async getTodayCheckIns(challengeId: string): Promise<string[]> {
        try {
            const response = await fetch(`${Config.API_URL}/challenges/${challengeId}/checks/today`);
            if (response.ok) {
                const data = await response.json();
                return data.userNames || [];
            }
            return [];
        } catch (e) {
            console.error('Error fetching today check-ins', e);
            return [];
        }
    }
};
