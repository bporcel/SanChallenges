const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { prisma, ensureUser } = require('../utils/helpers');
const logger = require('../utils/logger');
const { calculateAuraState } = require('../services/AuraService');

// POST /users - Update user profile
router.post('/', validate('updateUser'), async (req, res) => {
    const { id, displayName } = req.body;
    logger.info({ userId: id }, 'Updating user profile');

    try {
        const user = await ensureUser(id, displayName);
        logger.info({ userId: id }, 'User profile synced/updated');

        // Include aura data in response
        const response = {
            ...user,
            updatedAt: user.updatedAt.getTime(),
            auraState: calculateAuraState(user.currentStreak)
        };

        res.json(response);
    } catch (e) {
        logger.error({ error: e.message, userId: id }, 'Failed to update user');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/:userId/challenges - Get all challenges for a user with participant counts
router.get('/:userId/challenges', async (req, res) => {
    const { userId } = req.params;
    try {
        const participations = await prisma.participant.findMany({
            where: { userId },
            include: {
                challenge: {
                    include: {
                        creator: true,
                        participants: {
                            select: { userId: true }
                        }
                    }
                }
            }
        });
        const challenges = participations.map(p => {
            // Helper to format challenge
            const c = p.challenge;
            return {
                ...c,
                createdAt: c.createdAt.getTime(),
                isPrivate: c.isPrivate || false,
                isLongTerm: c.isLongTerm || false,
                duration: c.duration || 30,
                creatorId: c.creatorId || null,
                creatorName: c.creator?.displayName || null,
                participantCount: c.participants.length,
                completedAt: p.completedAt ? p.completedAt.getTime() : null
            };
        });
        res.json(challenges);
    } catch (e) {
        logger.error({ error: e.message, userId }, 'Failed to fetch user challenges');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/:userId/checks - Get all checks for a user (for client sync)
router.get('/:userId/checks', async (req, res) => {
    const { userId } = req.params;
    logger.info({ userId }, 'Fetching all checks for user');

    try {
        const checks = await prisma.check.findMany({
            where: { userId },
            select: {
                id: true,
                challengeId: true,
                date: true,
                completed: true
            },
            orderBy: { date: 'desc' }
        });

        logger.info({ userId, count: checks.length }, 'User checks fetched');
        res.json(checks);
    } catch (e) {
        logger.error({ error: e.message, userId }, 'Failed to fetch user checks');
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
