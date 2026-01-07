const { prisma } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Aura States based on current streak
 * - Inactive: 0 days
 * - Weak: 1-2 days
 * - Stable: 3-6 days
 * - Strong: 7-13 days
 * - Legendary: 14+ days
 */
const AURA_STATES = {
    INACTIVE: 'inactive',
    WEAK: 'weak',
    STABLE: 'stable',
    STRONG: 'strong',
    LEGENDARY: 'legendary'
};

const AURA_THRESHOLDS = {
    [AURA_STATES.LEGENDARY]: 14,
    [AURA_STATES.STRONG]: 7,
    [AURA_STATES.STABLE]: 3,
    [AURA_STATES.WEAK]: 1,
    [AURA_STATES.INACTIVE]: 0
};

/**
 * Calculate aura state from streak number
 */
function calculateAuraState(streak) {
    if (streak >= AURA_THRESHOLDS[AURA_STATES.LEGENDARY]) return AURA_STATES.LEGENDARY;
    if (streak >= AURA_THRESHOLDS[AURA_STATES.STRONG]) return AURA_STATES.STRONG;
    if (streak >= AURA_THRESHOLDS[AURA_STATES.STABLE]) return AURA_STATES.STABLE;
    if (streak >= AURA_THRESHOLDS[AURA_STATES.WEAK]) return AURA_STATES.WEAK;
    return AURA_STATES.INACTIVE;
}

/**
 * Degrade aura state by 2 levels when streak breaks
 */
function degradeAuraState(currentState) {
    const states = [
        AURA_STATES.INACTIVE,
        AURA_STATES.WEAK,
        AURA_STATES.STABLE,
        AURA_STATES.STRONG,
        AURA_STATES.LEGENDARY
    ];

    const currentIndex = states.indexOf(currentState);
    const newIndex = Math.max(0, currentIndex - 2);
    return states[newIndex];
}

/**
 * Calculate global streak for a user across all daily challenges
 */
async function calculateGlobalStreak(userId, referenceDate = null) {
    const today = referenceDate || new Date().toISOString().split('T')[0];
    const refDate = new Date(today);
    const yesterday = new Date(refDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all daily challenges the user participates in
    const participations = await prisma.participant.findMany({
        where: { userId },
        include: {
            challenge: {
                select: { id: true, isLongTerm: true }
            }
        }
    });

    const dailyChallengeIds = participations
        .filter(p => !p.challenge.isLongTerm)
        .map(p => p.challenge.id);

    if (dailyChallengeIds.length === 0) {
        return 0;
    }

    // For each daily challenge, calculate the streak
    const streaks = await Promise.all(
        dailyChallengeIds.map(async (challengeId) => {
            const checks = await prisma.check.findMany({
                where: {
                    userId,
                    challengeId,
                    completed: true
                },
                orderBy: { date: 'desc' }
            });

            if (checks.length === 0) return 0;

            const lastCheckDate = checks[0].date;

            // Streak is broken if last check wasn't today or yesterday
            if (lastCheckDate !== today && lastCheckDate !== yesterday) {
                return 0;
            }

            // Count consecutive days
            let streak = 0;
            let currentDate = lastCheckDate;

            for (const check of checks) {
                if (check.date === currentDate) {
                    streak++;
                    const prevDate = new Date(currentDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    currentDate = prevDate.toISOString().split('T')[0];
                } else {
                    break;
                }
            }

            return streak;
        })
    );

    // Return the best streak across all challenges
    return Math.max(...streaks, 0);
}

/**
 * Update user's aura after a check action
 */
async function updateUserAuraOnCheck(userId, checkDate) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            logger.error({ userId }, 'User not found for aura update');
            return;
        }

        // Calculate new global streak using the check date as reference
        const newStreak = await calculateGlobalStreak(userId, checkDate);

        // Save previous streak for undo support
        await prisma.user.update({
            where: { id: userId },
            data: {
                previousStreak: user.currentStreak,
                currentStreak: newStreak,
                lastCheckDate: checkDate,
                updatedAt: new Date()
            }
        });

        logger.info({ userId, newStreak, previousStreak: user.currentStreak }, 'User aura updated');
    } catch (error) {
        logger.error({ error: error.message, userId }, 'Failed to update user aura');
    }
}

/**
 * Restore user's aura after an undo action
 */
async function restoreUserAuraOnUndo(userId, referenceDate = null) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            logger.error({ userId }, 'User not found for aura restore');
            return;
        }

        // Recalculate global streak after undo using reference date
        const recalculatedStreak = await calculateGlobalStreak(userId, referenceDate);

        await prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak: recalculatedStreak,
                updatedAt: new Date()
            }
        });

        logger.info({ userId, restoredStreak: recalculatedStreak }, 'User aura restored after undo');
    } catch (error) {
        logger.error({ error: error.message, userId }, 'Failed to restore user aura');
    }
}

/**
 * Get aura data for a user
 */
async function getUserAuraData(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            currentStreak: true,
            lastCheckDate: true
        }
    });

    if (!user) {
        return {
            currentStreak: 0,
            auraState: AURA_STATES.INACTIVE
        };
    }

    return {
        currentStreak: user.currentStreak,
        auraState: calculateAuraState(user.currentStreak),
        lastCheckDate: user.lastCheckDate
    };
}

module.exports = {
    AURA_STATES,
    AURA_THRESHOLDS,
    calculateAuraState,
    degradeAuraState,
    calculateGlobalStreak,
    updateUserAuraOnCheck,
    restoreUserAuraOnUndo,
    getUserAuraData
};
