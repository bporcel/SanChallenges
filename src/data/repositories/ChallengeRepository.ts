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

    async create(challengeData: Pick<Challenge, 'title' | 'description' | 'points' | 'duration' | 'isPrivate' | 'isLongTerm'>): Promise<void> {
        try {
            const user = await UserRepository.getUser();
            const response = await fetch(`${Config.API_URL}/challenges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...challengeData,
                    userId: user.id,
                    displayName: user.displayName
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
            const user = await UserRepository.getUser();
            const response = await fetch(`${Config.API_URL}/challenges/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteCode,
                    userId: user.id,
                    displayName: user.displayName
                })
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
            const userId = await UserRepository.getUserId();

            // Sync with server FIRST before removing locally
            try {
                const response = await fetch(`${Config.API_URL}/challenges/${challengeId}/participants/${userId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }

                // Only remove from local storage if server sync succeeded
                const challenges = await this.getAll();
                const filtered = challenges.filter(c => c.id !== challengeId);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

            } catch (networkError) {
                console.error('Failed to sync delete with server:', networkError);
                // Still allow local delete but warn the user
                throw new Error('Network error: Could not leave challenge on server. Please try again.');
            }

        } catch (e) {
            console.error('Error deleting challenge', e);
            throw e;
        }
    },

    async sync(): Promise<Challenge[]> {
        try {
            const userId = await UserRepository.getUserId();
            const response = await fetch(`${Config.API_URL}/users/${userId}/challenges`);
            if (!response.ok) throw new Error('Failed to sync challenges');

            const serverChallenges: Challenge[] = await response.json();

            // Update local storage with fresh data from server
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverChallenges));
            return serverChallenges;
        } catch (e) {
            console.error('Error syncing challenges', e);
            // Return local data if sync fails
            return this.getAll();
        }
    },

    async complete(challengeId: string): Promise<void> {
        try {
            const userId = await UserRepository.getUserId();
            const response = await fetch(`${Config.API_URL}/challenges/${challengeId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to complete challenge');
            }

            const { completedAt } = await response.json();

            // Update local storage with completion timestamp
            const challenges = await this.getAll();
            const updated = challenges.map(c =>
                c.id === challengeId ? { ...c, completedAt } : c
            );
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Error completing challenge', e);
            throw e;
        }
    }
};
