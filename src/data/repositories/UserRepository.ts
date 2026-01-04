import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { User } from '../../domain/models/User';
import { Config } from '../../config';

const STORAGE_KEY = 'user_identity';

export const UserRepository = {
    async getUser(): Promise<User> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (jsonValue != null) {
                const user: User = JSON.parse(jsonValue);
                // Migration: If user exists but has no displayName, add one
                if (!user.displayName) {
                    user.displayName = generateFunnyName();
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                }
                return user;
            }

            // Create new identity
            const newId = Crypto.randomUUID();
            const newUser: User = {
                id: newId,
                displayName: generateFunnyName()
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            return newUser;
        } catch (e) {
            console.error('Error managing user identity', e);
            return { id: 'temp-error-id', displayName: 'Error User' };
        }
    },

    async updateDisplayName(name: string): Promise<void> {
        try {
            const user = await this.getUser();
            user.displayName = name;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));

            // Sync with server (fire and forget)
            fetch(`${Config.API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            }).catch(e => console.error('Background sync failed', e));

        } catch (e) {
            console.error('Error updating display name', e);
            throw e;
        }
    },

    // Keep for backward compatibility if needed, or refactor usages
    async getUserId(): Promise<string> {
        const user = await this.getUser();
        return user.id;
    }
};

function generateFunnyName(): string {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Brave', 'Calm', 'Eager', 'Fancy', 'Jolly'];
    const nouns = ['Badger', 'Panda', 'Fox', 'Owl', 'Tiger', 'Lion', 'Bear', 'Koala', 'Hawk', 'Eagle'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adj} ${noun}`;
}
