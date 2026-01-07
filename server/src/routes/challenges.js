const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { prisma, generateInviteCode, ensureUser, formatChallenge, getRankMap } = require('../utils/helpers');
const logger = require('../utils/logger');
const { getUserAuraData } = require('../services/AuraService');

// POST /challenges - Create new challenge
router.post('/', validate('createChallenge'), async (req, res) => {
    logger.info({ body: req.body }, 'Creating challenge');
    const { title, description, points, duration, userId, isPrivate, isLongTerm } = req.body;

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
                isLongTerm: isLongTerm || false,
                creatorId: userId,
                participants: {
                    create: {
                        userId: userId
                    }
                }
            },
            include: { creator: true }
        });

        logger.info({ challengeId: newChallenge.id }, 'Challenge created successfully');
        res.json(formatChallenge(newChallenge));
    } catch (e) {
        logger.error({ error: e.message }, 'Failed to create challenge');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /challenges/join - Join via invite code
router.post('/join', validate('joinChallenge'), async (req, res) => {
    const { inviteCode, userId } = req.body;
    logger.info({ inviteCode, userId }, 'User joining challenge');

    try {
        const challenge = await prisma.challenge.findUnique({
            where: { inviteCode },
            include: { creator: true }
        });

        if (!challenge) {
            logger.warn({ inviteCode }, 'Challenge not found');
            return res.status(404).json({ error: 'Challenge not found' });
        }

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

        logger.info({ challengeId: challenge.id, userId }, 'User joined challenge');
        res.json(formatChallenge(challenge));
    } catch (e) {
        logger.error({ error: e.message }, 'Failed to join challenge');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /challenges/:id - Get challenge details
router.get('/:id', async (req, res) => {
    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: req.params.id },
            include: { creator: true }
        });
        if (!challenge) {
            logger.warn({ challengeId: req.params.id }, 'Challenge not found');
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(formatChallenge(challenge));
    } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch challenge');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /challenges/:id/ranking - Get challenge ranking with rank changes
router.get('/:id/ranking', async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch challenge to check if it's long-term
        const challenge = await prisma.challenge.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!challenge) {
            logger.warn({ challengeId: id }, 'Challenge not found');
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const participantIds = challenge.participants.map(p => p.userId);

        if (challenge.isLongTerm) {
            // Long-term ranking: Completed first, then by nudge count
            const nudgeCounts = await prisma.check.groupBy({
                by: ['userId'],
                where: {
                    challengeId: id,
                    completed: true,
                    userId: { in: participantIds }
                },
                _count: { userId: true }
            });

            const result = challenge.participants.map(p => {
                const nudgeStats = nudgeCounts.find(n => n.userId === p.userId);
                const count = nudgeStats ? nudgeStats._count.userId : 0;

                let displayName = p.user.displayName;
                if (!displayName || displayName === 'Unknown User' || displayName === 'Unknown') {
                    displayName = `User ${p.userId.substr(0, 6)}...`;
                }

                return {
                    userId: p.userId,
                    count, // This is nudge count for long-term
                    displayName,
                    completedAt: p.completedAt ? p.completedAt.getTime() : null,
                    isCompleted: !!p.completedAt,
                    currentRank: 0, // Will be set after sorting
                    previousRank: 0,
                    currentStreak: p.user.currentStreak || 0,
                    auraState: null // Will be calculated below
                };
            });

            // Sort: Completed first (by completion date), then by nudge count
            result.sort((a, b) => {
                if (a.isCompleted && !b.isCompleted) return -1;
                if (!a.isCompleted && b.isCompleted) return 1;
                if (a.isCompleted && b.isCompleted) {
                    return a.completedAt - b.completedAt;
                }
                return b.count - a.count;
            });

            // Assign ranks and fetch aura states
            const resultWithAura = await Promise.all(result.map(async (item, index) => {
                item.currentRank = index + 1;
                item.previousRank = index + 1; // No rank change logic for long-term yet

                const auraData = await getUserAuraData(item.userId);
                item.auraState = auraData.auraState;
                item.currentStreak = auraData.currentStreak;

                return item;
            }));

            return res.json(resultWithAura);
        } else {
            // Daily ranking logic
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

            const currentRankMap = getRankMap(currentRanking);
            const previousRankMap = getRankMap(previousRanking);

            const result = challenge.participants.map(p => {
                const currentStats = currentRanking.find(r => r.userId === p.userId);
                const count = currentStats ? currentStats._count.userId : 0;

                let displayName = p.user.displayName;
                if (!displayName || displayName === 'Unknown User' || displayName === 'Unknown') {
                    displayName = `User ${p.userId.substr(0, 6)}...`;
                }

                return {
                    userId: p.userId,
                    count,
                    displayName,
                    currentRank: currentRankMap[p.userId] || (currentRanking.length + 1),
                    previousRank: previousRankMap[p.userId] || (previousRanking.length + 1),
                    currentStreak: p.user.currentStreak || 0,
                    auraState: null // Will be calculated below
                };
            });

            result.sort((a, b) => b.count - a.count);

            // Fetch aura states for all users
            const resultWithAura = await Promise.all(result.map(async (item) => {
                const auraData = await getUserAuraData(item.userId);
                item.auraState = auraData.auraState;
                item.currentStreak = auraData.currentStreak;
                return item;
            }));

            res.json(resultWithAura);
        }
    } catch (e) {
        logger.error({ error: e.message, challengeId: id }, 'Failed to fetch ranking');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /challenges/:id/checks/today - Get today's checks with user names
router.get('/:id/checks/today', async (req, res) => {
    const { id } = req.params;
    try {
        const today = new Date().toISOString().split('T')[0];

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
        logger.error({ error: e.message, challengeId: id }, 'Failed to fetch today checks');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /challenges/:challengeId/participants/:userId - Leave challenge
router.delete('/:challengeId/participants/:userId', async (req, res) => {
    const { challengeId, userId } = req.params;
    logger.info({ challengeId, userId }, 'User leaving challenge');

    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (challenge && challenge.isPrivate && challenge.creatorId === userId) {
            // If private and creator leaves, delete the whole challenge
            await prisma.challenge.delete({
                where: { id: challengeId }
            });
            logger.info({ challengeId }, 'Private challenge deleted');
        } else {
            // Normal leave
            await prisma.participant.delete({
                where: {
                    userId_challengeId: { userId, challengeId }
                }
            });
            logger.info({ challengeId, userId }, 'User left challenge');
        }
        res.json({ success: true });
    } catch (e) {
        logger.error({ error: e.message, challengeId, userId }, 'Failed to leave challenge');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /challenges/:id/complete - Mark long-term challenge as complete
router.post('/:id/complete', validate('completeChallenge'), async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    logger.info({ challengeId: id, userId }, 'Completing long-term challenge');

    try {
        // Verify challenge exists and is long-term
        const challenge = await prisma.challenge.findUnique({
            where: { id }
        });

        if (!challenge) {
            logger.warn({ challengeId: id }, 'Challenge not found');
            return res.status(404).json({ error: 'Challenge not found' });
        }

        if (!challenge.isLongTerm) {
            logger.warn({ challengeId: id }, 'Challenge is not long-term');
            return res.status(400).json({ error: 'Only long-term challenges can be completed' });
        }

        // Update participant completion timestamp
        const participant = await prisma.participant.update({
            where: {
                userId_challengeId: { userId, challengeId: id }
            },
            data: {
                completedAt: new Date()
            }
        });

        // Also create a check record for today so it shows up in social context
        const today = new Date().toISOString().split('T')[0];
        try {
            await prisma.check.upsert({
                where: { userId_challengeId_date: { userId, challengeId: id, date: today } },
                update: { completed: true },
                create: { userId, challengeId: id, date: today, completed: true }
            });
        } catch (checkError) {
            logger.error({ error: checkError.message }, 'Failed to create completion check record');
            // Don't fail the whole request if check creation fails
        }

        logger.info({ challengeId: id, userId, completedAt: participant.completedAt }, 'Long-term challenge completed');
        res.json({ success: true, completedAt: participant.completedAt.getTime() });
    } catch (e) {
        logger.error({ error: e.message, challengeId: id, userId }, 'Failed to complete challenge');
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
