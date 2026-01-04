import { Config } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge } from '../../domain/models/Challenge';
import { UserRepository } from './UserRepository';

const STORAGE_KEY = 'challenges';


export const ChallengeRepository = {
    async getAll(): Promise<Challenge[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading challenges', e);
            return [];
        }
    },

    async create(challengeData: Pick<Challenge, 'title' | 'description' | 'points'>): Promise<void> {
        try {
            const userId = await UserRepository.getUserId();
            const response = await fetch(`${Config.API_URL}/challenges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...challengeData,
                    userId
                })
            });

            if (!response.ok) throw new Error('Failed to create challenge');

            const newChallenge: Challenge = await response.json();

            const challenges = await this.getAll();
            challenges.push(newChallenge);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
        } catch (e) {
            console.error('Error saving challenge', e);
            throw e;
        }
    },

    async join(inviteCode: string): Promise<Challenge> {
        try {
            const userId = await UserRepository.getUserId();
            const response = await fetch(`${Config.API_URL}/challenges/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode, userId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to join challenge');
            }

            const challenge: Challenge = await response.json();

            const challenges = await this.getAll();
            // Check if already exists
            if (!challenges.find(c => c.id === challenge.id)) {
                challenges.push(challenge);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
            }
            return challenge;
        } catch (e) {
            console.error('Error joining challenge', e);
            throw e;
        }
    },

    async delete(challengeId: string): Promise<void> {
        try {
            const challenges = await this.getAll();
            const filtered = challenges.filter(c => c.id !== challengeId);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

            // Sync with server (fire and forget)
            const userId = await UserRepository.getUserId();
            fetch(`${Config.API_URL}/challenges/${challengeId}/participants/${userId}`, {
                method: 'DELETE'
            }).catch(e => console.error('Background sync failed', e));

        } catch (e) {
            console.error('Error deleting challenge', e);
            throw e;
        }
    }
};
