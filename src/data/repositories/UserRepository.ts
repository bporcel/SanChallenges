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
                    user.displayName = generateAnimeName();
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                    // Sync with server (fire and forget)
                    fetch(`${Config.API_URL}/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(user)
                    }).catch(e => console.error('Background sync failed', e));
                }
                return user;
            }

            // Create new identity
            const newId = Crypto.randomUUID();
            const newUser: User = {
                id: newId,
                displayName: generateAnimeName()
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

            // Sync with server (fire and forget)
            fetch(`${Config.API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            }).catch(e => console.error('Background sync failed', e));

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

function generateAnimeName(): string {
    const prefixes = [
        'Shadow', 'Golden', 'Ultra', 'Spirit', 'Cosmic', 'Legendary',
        'Shinobi', 'Saiyan', 'Cursed', 'Phantom', 'Iron', 'Steel',
        'Dark', 'Light', 'Hidden', 'Eternal', 'Zenith', 'Apex'
    ];
    const suffixes = [
        'Hokage', 'Sannin', 'Hunter', 'Alchemist', 'Titan', 'Ghoul',
        'Shinigami', 'Pirate', 'Ninja', 'Samurai', 'Hero', 'Sensei',
        'Senpai', 'Kage', 'Hashira', 'Warrior', 'Slayer', 'Reaper'
    ];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${suffix}`;
}
