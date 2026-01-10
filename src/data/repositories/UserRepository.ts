import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { User } from '../../domain/models/User';
import { Config } from '../../config';

const STORAGE_KEY = 'user_identity';

export const UserRepository = {
    /**
     * Get the current user. Creates a new user if one doesn't exist.
     * This only returns cached data. Use sync() to get fresh data from server.
     */
    async getUser(): Promise<User> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            let user: User | null = jsonValue != null ? JSON.parse(jsonValue) : null;

            // If we have a complete user with a real name, return it
            if (user && user.displayName && user.displayName !== 'Loading...') {
                return user;
            }

            // Create new identity if doesn't exist, or if we only have a placeholder
            const userId = user?.id || Crypto.randomUUID();

            // Sync with server to get generated name and aura data
            // Don't save intermediate state - only save after server responds
            return await this.syncUserWithServer(userId);
        } catch (e) {
            console.error('Error managing user identity', e);
            return { id: Crypto.randomUUID(), displayName: 'Guest User' };
        }
    },

    /**
     * Sync user data from server - fetches fresh aura/streak data.
     * This is critical for data persistence across app reinstalls/updates.
     */
    async sync(): Promise<User> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            let user: User | null = jsonValue != null ? JSON.parse(jsonValue) : null;

            if (!user || !user.id) {
                // No user exists, create one
                return await this.getUser();
            }

            // Fetch fresh data from server
            return await this.syncUserWithServer(user.id, user.displayName);
        } catch (e) {
            console.error('Error syncing user', e);
            return this.getUser();
        }
    },

    /**
     * Internal helper to sync user data with server
     */
    async syncUserWithServer(userId: string, displayName?: string): Promise<User> {
        try {
            const response = await fetch(`${Config.API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, displayName })
            });

            if (response.ok) {
                const serverUser = await response.json();
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
                return serverUser;
            }
        } catch (e) {
            console.error('Failed to sync user with server', e);
        }

        // Return cached user if sync fails
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue) {
            const cachedUser = JSON.parse(jsonValue);
            // Never return 'Loading...' to the UI - use a temporary name instead
            if (cachedUser.displayName === 'Loading...') {
                cachedUser.displayName = `User ${userId.substring(0, 6)}`;
            }
            return cachedUser;
        }
        return { id: userId, displayName: displayName || `User ${userId.substring(0, 6)}` };
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

