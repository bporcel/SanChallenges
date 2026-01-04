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

// Helper to format dates to timestamps for compatibility
const formatChallenge = (c) => ({
    ...c,
    createdAt: c.createdAt.getTime()
});

// POST /challenges - Create new challenge
app.post('/challenges', async (req, res) => {
    console.log('Creating challenge with body:', req.body);
    const { title, description, points, userId } = req.body;
    if (!title || !userId) return res.status(400).json({ error: 'Missing fields' });

    try {
        // Ensure user exists
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: { id: userId, displayName: 'Unknown User' }
            });
        }

        const newChallenge = await prisma.challenge.create({
            data: {
                title,
                description: description || '',
                points: points || 0,
                inviteCode: generateInviteCode(),
                participants: {
                    create: {
                        userId: userId
                    }
                }
            }
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
            where: { inviteCode }
        });

        if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

        // Ensure user exists
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: { id: userId, displayName: 'Unknown User' }
            });
        }

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
            where: { id: req.params.id }
        });
        if (!challenge) return res.status(404).json({ error: 'Not found' });
        res.json(formatChallenge(challenge));
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

// GET /challenges/:id/ranking
app.get('/challenges/:id/ranking', async (req, res) => {
    const { id } = req.params;
    try {
        // Group by user and count completed checks
        const ranking = await prisma.check.groupBy({
            by: ['userId'],
            where: {
                challengeId: id,
                completed: true
            },
            _count: {
                userId: true
            },
            orderBy: {
                _count: {
                    userId: 'desc'
                }
            }
        });

        // Fetch user details
        const userIds = ranking.map(r => r.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const result = ranking.map(r => ({
            userId: r.userId,
            count: r._count.userId,
            displayName: userMap.get(r.userId)?.displayName || 'Unknown'
        }));

        res.json(result);
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
