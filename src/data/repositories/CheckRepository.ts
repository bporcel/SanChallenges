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

    async getRanking(challengeId: string): Promise<{ userId: string, count: number, displayName?: string, previousRank?: number | null }[]> {
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
    },

    async getTodayCheckInsBulk(challengeIds: string[]): Promise<Record<string, string[]>> {
        try {
            const response = await fetch(`${Config.API_URL}/checks/today/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeIds })
            });

            if (response.ok) {
                const data = await response.json();
                const result: Record<string, any> = {};
                for (const [challengeId, checkData] of Object.entries(data)) {
                    result[challengeId] = checkData;
                }
                return result;
            }
            return {};
        } catch (e) {
            console.error('Error fetching bulk today check-ins', e);
            return {};
        }
    },

    /**
     * Sync checks from server - fetches all user's checks and updates local storage.
     * This is critical for data persistence across app reinstalls/updates.
     */
    async sync(): Promise<Check[]> {
        try {
            const userId = await UserRepository.getUserId();
            const response = await fetch(`${Config.API_URL}/users/${userId}/checks`);

            if (!response.ok) {
                console.error('Failed to sync checks from server');
                return this.getAll();
            }

            const serverChecks: Check[] = await response.json();

            // Update local storage with server data
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverChecks));

            return serverChecks;
        } catch (e) {
            console.error('Error syncing checks', e);
            // Return local data if sync fails
            return this.getAll();
        }
    }
};
