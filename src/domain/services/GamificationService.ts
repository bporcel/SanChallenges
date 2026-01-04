import { Check } from '../models/Check';
import { dateService } from '../../data/DateService';

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
        if (points >= 1000) return { label: 'Legend', color: '#8B5CF6' }; // Purple
        if (points >= 500) return { label: 'Elite', color: '#EF4444' }; // Red
        if (points >= 200) return { label: 'Pro', color: '#F59E0B' }; // Amber
        if (points >= 50) return { label: 'Active', color: '#10B981' }; // Emerald
        return { label: 'Beginner', color: '#6B7280' }; // Gray
    }
};
