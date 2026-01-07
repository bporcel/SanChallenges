const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { prisma } = require('../utils/helpers');
const logger = require('../utils/logger');
const { updateUserAuraOnCheck } = require('../services/AuraService');

// POST /checks - Sync check
router.post('/', validate('createCheck'), async (req, res) => {
    const { id, userId, challengeId, date, completed } = req.body;
    logger.info({ userId, challengeId, date }, 'Creating/updating check');

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

        logger.info({ checkId: check.id }, 'Check saved successfully');

        // Update user's aura after check (async, don't block response)
        if (completed !== false) {
            updateUserAuraOnCheck(userId, date).catch(err =>
                logger.error({ error: err.message, userId }, 'Aura update failed')
            );
        } else {
            const { restoreUserAuraOnUndo } = require('../services/AuraService');
            restoreUserAuraOnUndo(userId, date).catch(err =>
                logger.error({ error: err.message, userId }, 'Aura restore failed')
            );
        }

        res.json(check);
    } catch (e) {
        logger.error({ error: e.message }, 'Failed to save check');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /checks/today/bulk - Get today's checks for multiple challenges (bulk)
router.post('/today/bulk', validate('bulkCheckIns'), async (req, res) => {
    const { challengeIds } = req.body;
    logger.info({ count: challengeIds.length }, 'Fetching bulk check-ins');

    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch all checks for all challenges in one query
        const checks = await prisma.check.findMany({
            where: {
                challengeId: { in: challengeIds },
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

        // Group by challengeId
        const result = {};
        for (const challengeId of challengeIds) {
            const challengeChecks = checks.filter(c => c.challengeId === challengeId);
            const userNames = challengeChecks.map(c => c.user.displayName || 'Unknown');

            // Also find users who completed this challenge today
            const completions = await prisma.participant.findMany({
                where: {
                    challengeId,
                    completedAt: {
                        gte: new Date(today + 'T00:00:00Z'),
                        lte: new Date(today + 'T23:59:59Z')
                    }
                },
                include: { user: { select: { displayName: true } } }
            });
            const completedUserNames = completions.map(p => p.user.displayName || 'Unknown');

            result[challengeId] = {
                count: userNames.length,
                userNames,
                completedUserNames,
                date: today
            };
        }

        logger.info({ count: challengeIds.length }, 'Bulk check-ins fetched');
        res.json(result);
    } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch bulk check-ins');
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
