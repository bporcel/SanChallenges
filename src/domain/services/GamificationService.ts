import { Check } from '../models/Check';
import { dateService } from '../../data/DateService';
import { t } from '../../i18n/i18n';
import { colors } from '../../ui/theme/colors';
import { Challenge } from '../models/Challenge';

export const AURA_REWARDS = {
    DAILY_CHECK: 5,
    LONG_TERM_NUDGE: 2,
    LONG_TERM_MIN: 100,
    LONG_TERM_MAX: 500,
};
export const GamificationService = {
    calculateStreak(checks: Check[]): number {
        if (checks.length === 0) return 0;

        // Sort checks by date descending
        const sortedChecks = [...checks]
            .filter(c => c.completed)
            .sort((a, b) => b.date.localeCompare(a.date));

        if (sortedChecks.length === 0) return 0;

        const today = dateService.getToday();
        const yesterday = this.getYesterday(today);

        // If the last check was not today or yesterday, streak is broken
        const lastCheckDate = sortedChecks[0].date;
        if (lastCheckDate !== today && lastCheckDate !== yesterday) {
            return 0;
        }

        let streak = 0;
        let currentDate = lastCheckDate;

        for (const check of sortedChecks) {
            if (check.date === currentDate) {
                streak++;
                currentDate = this.getYesterday(currentDate);
            } else {
                break;
            }
        }

        return streak;
    },

    getYesterday(dateString: string): string {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    },

    getRankTier(points: number): { label: string; color: string } {
        if (points >= 1000) return { label: t('ranks.legend'), color: colors.aura.legendary };
        if (points >= 500) return { label: t('ranks.elite'), color: colors.aura.strong };
        if (points >= 200) return { label: t('ranks.pro'), color: colors.aura.stable };
        if (points >= 50) return { label: t('ranks.active'), color: colors.aura.weak };
        return { label: t('ranks.beginner'), color: colors.text.tertiary };
    },

    calculateCompletionPoints(duration: number): number {
        // Linear scale: 30 days = 100 pts, 365 days = 500 pts
        // Slope = (500 - 100) / (365 - 30) = 400 / 335 ≈ 1.194
        const points = 100 + (duration - 30) * (400 / 335);
        return Math.max(AURA_REWARDS.LONG_TERM_MIN, Math.min(AURA_REWARDS.LONG_TERM_MAX, Math.round(points)));
    },

    calculateChallengePoints(challenge: Challenge, checkCount: number, isCompleted: boolean): number {
        if (challenge.isLongTerm) {
            // 2 points per check (nudge) + completion reward
            return (checkCount * AURA_REWARDS.LONG_TERM_NUDGE) + (isCompleted ? (challenge.points || 0) : 0);
        } else {
            // 5 points per check
            return checkCount * AURA_REWARDS.DAILY_CHECK;
        }
    },

    calculateTotalAura(challenges: Challenge[], allChecks: Check[]): number {
        let total = 0;
        for (const challenge of challenges) {
            const challengeChecks = allChecks.filter(c => c.challengeId === challenge.id && c.completed);
            const isCompleted = challenge.isLongTerm ? !!challenge.completedAt : false;

            total += this.calculateChallengePoints(challenge, challengeChecks.length, isCompleted);
        }
        return total;
    }
};
