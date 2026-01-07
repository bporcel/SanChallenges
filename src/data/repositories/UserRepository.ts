import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { User } from '../../domain/models/User';
import { Config } from '../../config';

const STORAGE_KEY = 'user_identity';

export const UserRepository = {
    async getUser(): Promise<User> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            let user: User | null = jsonValue != null ? JSON.parse(jsonValue) : null;

            // If we have a user but it's stuck in 'Loading...', try to sync again
            if (user && user.displayName !== 'Loading...') {
                return user;
            }

            // Create new identity if doesn't exist
            const userId = user?.id || Crypto.randomUUID();
            if (!user) {
                user = {
                    id: userId,
                    displayName: 'Loading...'
                };
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            }

            // Sync with server to get generated name and aura data
            try {
                const response = await fetch(`${Config.API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId })
                });

                if (response.ok) {
                    const serverUser = await response.json();
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
                    return serverUser;
                }
            } catch (e) {
                console.error('Failed to sync user with server', e);
            }

            return user;
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

            // Sync with server
            const response = await fetch(`${Config.API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, displayName: name })
            });

            if (response.ok) {
                const serverUser = await response.json();
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
            }

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
