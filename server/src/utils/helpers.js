const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate 6-char invite code
const generateInviteCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Generate anime-themed display name
const generateAnimeName = () => {
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
};

// Ensure user exists, create if not
const ensureUser = async (userId, displayName) => {
    // Use upsert to atomically handle user creation/update
    const user = await prisma.user.upsert({
        where: { id: userId },
        update: {
            // Update displayName if provided and current name is default/unknown
            ...(displayName ? { displayName, updatedAt: new Date() } : {})
        },
        create: {
            id: userId,
            displayName: displayName || generateAnimeName(),
            updatedAt: new Date()
        }
    });
    return user;
};

// Format challenge for API response
const formatChallenge = (c) => ({
    ...c,
    createdAt: c.createdAt.getTime(),
    isPrivate: c.isPrivate || false,
    isLongTerm: c.isLongTerm || false,
    duration: c.duration || 30,
    creatorId: c.creatorId || null,
    creatorName: c.creator?.displayName || null
});

// Get rank map from grouped ranking results (handles ties)
const getRankMap = (ranking) => {
    const map = {};
    ranking.forEach((r, index) => {
        let rank = 1;
        for (let i = 0; i < index; i++) {
            if (ranking[i]._count.userId > r._count.userId) {
                rank++;
            }
        }
        map[r.userId] = rank;
    });
    return map;
};

module.exports = {
    prisma,
    generateInviteCode,
    generateAnimeName,
    ensureUser,
    formatChallenge,
    getRankMap
};
