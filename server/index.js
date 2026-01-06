const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
});

// Generate 6-char invite code
const generateInviteCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

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

const ensureUser = async (userId, displayName) => {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: userId,
                displayName: displayName || generateAnimeName()
            }
        });
    } else if (displayName && user.displayName === 'Unknown User') {
        // Update if we finally have a name
        user = await prisma.user.update({
            where: { id: userId },
            data: { displayName }
        });
    }
    return user;
};

// Helper to format dates to timestamps for compatibility
const formatChallenge = (c) => ({
    ...c,
    createdAt: c.createdAt.getTime(),
    isPrivate: c.isPrivate || false,
    duration: c.duration || 30,
    creatorId: c.creatorId || null,
    creatorName: c.creator?.displayName || null
});

// POST /challenges - Create new challenge
app.post('/challenges', async (req, res) => {
    console.log('Creating challenge with body:', req.body);
    const { title, description, points, duration, userId, isPrivate } = req.body;
    if (!title || !userId) return res.status(400).json({ error: 'Missing fields' });

    try {
        // Ensure user exists
        await ensureUser(userId, req.body.displayName);

        const newChallenge = await prisma.challenge.create({
            data: {
                title,
                description: description || '',
                points: points || 0,
                duration: duration || 30,
                inviteCode: generateInviteCode(),
                isPrivate: isPrivate || false,
                creatorId: userId,
                participants: {
                    create: {
                        userId: userId
                    }
                }
            },
            include: { creator: true }
        });

        res.json(formatChallenge(newChallenge));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /challenges/join - Join via code
app.post('/challenges/join', async (req, res) => {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) return res.status(400).json({ error: 'Missing fields' });

    try {
        const challenge = await prisma.challenge.findUnique({
            where: { inviteCode },
            include: { creator: true }
        });

        if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

        // Ensure user exists
        await ensureUser(userId, req.body.displayName);

        // Join if not already joined
        await prisma.participant.upsert({
            where: { userId_challengeId: { userId, challengeId: challenge.id } },
            update: {},
            create: {
                userId,
                challengeId: challenge.id
            }
        });

        res.json(formatChallenge(challenge));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /challenges/:id - Get challenge details
app.get('/challenges/:id', async (req, res) => {
    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: req.params.id },
            include: { creator: true }
        });
        if (!challenge) return res.status(404).json({ error: 'Not found' });
        res.json(formatChallenge(challenge));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/:userId/challenges - Get all challenges for a user
app.get('/users/:userId/challenges', async (req, res) => {
    const { userId } = req.params;
    try {
        const participations = await prisma.participant.findMany({
            where: { userId },
            include: {
                challenge: {
                    include: { creator: true }
                }
            }
        });
        const challenges = participations.map(p => formatChallenge(p.challenge));
        res.json(challenges);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /users - Update user profile
app.post('/users', async (req, res) => {
    const { id, displayName } = req.body;
    if (!id || !displayName) return res.status(400).json({ error: 'Missing fields' });

    try {
        const user = await prisma.user.upsert({
            where: { id },
            update: { displayName, updatedAt: new Date() },
            create: { id, displayName, updatedAt: new Date() }
        });
        res.json({ ...user, updatedAt: user.updatedAt.getTime() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /checks - Sync check
app.post('/checks', async (req, res) => {
    const { id, userId, challengeId, date, completed } = req.body;
    if (!userId || !challengeId || !date) return res.status(400).json({ error: 'Missing fields' });

    try {
        const checkData = {
            userId,
            challengeId,
            date,
            completed: completed !== false
        };

        let check;
        if (id) {
            check = await prisma.check.upsert({
                where: { id },
                update: { ...checkData },
                create: { id, ...checkData }
            });
        } else {
            check = await prisma.check.upsert({
                where: { userId_challengeId_date: { userId, challengeId, date } },
                update: { completed: checkData.completed },
                create: { ...checkData }
            });
        }

        res.json(check);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/challenges/:id/ranking', async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch only users who are still participants
        const participants = await prisma.participant.findMany({
            where: { challengeId: id },
            select: { userId: true }
        });
        const participantIds = Array.from(new Set(participants.map(p => p.userId)));

        // 1. Current Ranking (all time)
        const currentRanking = await prisma.check.groupBy({
            by: ['userId'],
            where: {
                challengeId: id,
                completed: true,
                userId: { in: participantIds }
            },
            _count: { userId: true },
            orderBy: { _count: { userId: 'desc' } }
        });

        // 2. Previous Ranking (up to yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const previousRanking = await prisma.check.groupBy({
            by: ['userId'],
            where: {
                challengeId: id,
                completed: true,
                userId: { in: participantIds },
                date: { lt: new Date().toISOString().split('T')[0] } // All checks before today
            },
            _count: { userId: true },
            orderBy: { _count: { userId: 'desc' } }
        });

        // Helper to get rank from a grouped result (handles ties)
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

        const currentRankMap = getRankMap(currentRanking);
        const previousRankMap = getRankMap(previousRanking);

        // Fetch user details
        const users = await prisma.user.findMany({
            where: { id: { in: participantIds } }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        // Build final result
        // We iterate over participantIds to include everyone, even those with 0 checks
        const result = participantIds.map(userId => {
            const user = userMap.get(userId);
            const currentStats = currentRanking.find(r => r.userId === userId);
            const count = currentStats ? currentStats._count.userId : 0;

            let displayName = user?.displayName;
            if (!displayName || displayName === 'Unknown User' || displayName === 'Unknown') {
                displayName = `User ${userId.substr(0, 6)}...`;
            }

            return {
                userId,
                count,
                displayName,
                currentRank: currentRankMap[userId] || (currentRanking.length + 1),
                previousRank: previousRankMap[userId] || (previousRanking.length + 1)
            };
        });

        // Sort by count desc
        result.sort((a, b) => b.count - a.count);

        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /challenges/:id/checks/today - Get today's checks with user names
app.get('/challenges/:id/checks/today', async (req, res) => {
    const { id } = req.params;
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Find completed checks for today and include user info
        const checks = await prisma.check.findMany({
            where: {
                challengeId: id,
                date: today,
                completed: true
            },
            include: {
                user: {
                    select: {
                        displayName: true
                    }
                }
            }
        });

        const userNames = checks.map(c => c.user.displayName || 'Unknown');

        res.json({
            count: userNames.length,
            userNames,
            date: today
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /challenges/:challengeId/participants/:userId - Leave challenge
app.delete('/challenges/:challengeId/participants/:userId', async (req, res) => {
    const { challengeId, userId } = req.params;
    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (challenge && challenge.isPrivate && challenge.creatorId === userId) {
            // If private and creator leaves, delete the whole challenge
            await prisma.challenge.delete({
                where: { id: challengeId }
            });
            console.log(`Private challenge ${challengeId} deleted because creator ${userId} left.`);
        } else {
            // Normal leave
            await prisma.participant.delete({
                where: {
                    userId_challengeId: { userId, challengeId }
                }
            });
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown for Docker
const shutdown = async () => {
    console.log('Received shutdown signal. Closing server...');
    server.close(() => {
        console.log('HTTP server closed.');
    });
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
