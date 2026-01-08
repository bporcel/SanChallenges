import { Challenge } from '../models/Challenge';
import { Check } from '../models/Check';
import { AuraService } from './AuraService';
import { GamificationService } from './GamificationService';
import { AuraState } from '../models/AuraState';

export interface YearlyStats {
    year: number;
    challenges: ChallengeStats;
    checks: CheckStats;
    aura: AuraStats;
    months: MonthlyBreakdown[];
}

export interface ChallengeStats {
    participated: number;
    completed: number;
    abandoned: number;
}

export interface CheckStats {
    total: number;
    avgPerWeek: number;
    bestStreak: number;
    missedDays: number;
}

export interface AuraStats {
    mostCommonState: AuraState;
    longestStrongPeriod: number;
    auraBreaks: number;
}

export interface MonthlyBreakdown {
    month: number;
    checksCount: number;
    label: string;
}

export const StatisticsService = {
    /**
     * Calculate yearly statistics from challenges and checks
     */
    calculateYearlyStats(
        challenges: Challenge[],
        checks: Check[],
        year: number = new Date().getFullYear()
    ): YearlyStats {
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;

        // Filter challenges and checks for the year
        const yearChallenges = challenges.filter(c => {
            const createdYear = new Date(c.createdAt).getFullYear();
            return createdYear === year;
        });

        const yearChecks = checks.filter(c =>
            c.date >= yearStart && c.date <= yearEnd && c.completed
        );

        return {
            year,
            challenges: this.calculateChallengeStats(yearChallenges, yearChecks),
            checks: this.calculateCheckStats(yearChecks, yearChallenges, year),
            aura: this.calculateAuraStats(yearChecks),
            months: this.calculateMonthlyBreakdown(yearChecks, year),
        };
    },

    /**
     * Challenge activity stats
     */
    calculateChallengeStats(challenges: Challenge[], checks: Check[]): ChallengeStats {
        let completed = 0;
        let abandoned = 0;

        for (const challenge of challenges) {
            const challengeChecks = checks.filter(c => c.challengeId === challenge.id);

            if (challenge.isLongTerm) {
                // Long-term: completed if has completedAt
                if (challenge.completedAt) {
                    completed++;
                } else if (challengeChecks.length === 0) {
                    // No engagement = abandoned
                    abandoned++;
                }
            } else {
                // Daily: completed if reached duration days of checks
                if (challengeChecks.length >= challenge.duration) {
                    completed++;
                } else {
                    // Check if challenge period has ended
                    const createdDate = new Date(challenge.createdAt);
                    const endDate = new Date(createdDate);
                    endDate.setDate(endDate.getDate() + challenge.duration);

                    if (new Date() > endDate && challengeChecks.length < challenge.duration) {
                        abandoned++;
                    }
                }
            }
        }

        return {
            participated: challenges.length,
            completed,
            abandoned,
        };
    },

    /**
     * Check activity stats
     */
    calculateCheckStats(checks: Check[], challenges: Challenge[], year: number): CheckStats {
        const total = checks.length;

        // Calculate weeks elapsed in the year
        const now = new Date();
        const yearStart = new Date(year, 0, 1);
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksElapsed = Math.max(1, Math.ceil((now.getTime() - yearStart.getTime()) / msPerWeek));

        const avgPerWeek = Math.round((total / weeksElapsed) * 10) / 10;

        // Calculate best streak from check dates
        const bestStreak = this.calculateBestStreak(checks);

        // Calculate missed days (days in active challenge periods without checks)
        const missedDays = this.calculateMissedDays(checks, challenges, year);

        return {
            total,
            avgPerWeek,
            bestStreak,
            missedDays,
        };
    },

    /**
     * Calculate the best streak from check dates
     */
    calculateBestStreak(checks: Check[]): number {
        if (checks.length === 0) return 0;

        // Get unique dates sorted
        const dates = [...new Set(checks.map(c => c.date))].sort();
        if (dates.length === 0) return 0;

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

            if (diffDays === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    },

    /**
     * Calculate missed days in active challenge periods
     */
    calculateMissedDays(checks: Check[], challenges: Challenge[], year: number): number {
        const checkDates = new Set(checks.map(c => c.date));
        let missedDays = 0;

        for (const challenge of challenges) {
            if (challenge.isLongTerm) continue; // Only count daily challenges

            const startDate = new Date(challenge.createdAt);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + challenge.duration);

            const today = new Date();
            const checkEnd = endDate < today ? endDate : today;

            // Iterate through each day in the challenge period
            const current = new Date(startDate);
            while (current <= checkEnd) {
                const dateStr = current.toISOString().split('T')[0];
                if (dateStr.startsWith(`${year}`) && !checkDates.has(dateStr)) {
                    // Check if there's a check for this challenge on this date
                    const hasCheck = checks.some(
                        c => c.challengeId === challenge.id && c.date === dateStr
                    );
                    if (!hasCheck) {
                        missedDays++;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        }

        return missedDays;
    },

    /**
     * Aura insights
     */
    calculateAuraStats(checks: Check[]): AuraStats {
        if (checks.length === 0) {
            return {
                mostCommonState: 'inactive',
                longestStrongPeriod: 0,
                auraBreaks: 0,
            };
        }

        // Get unique dates sorted
        const dates = [...new Set(checks.map(c => c.date))].sort();

        // Track aura states over time
        const stateCounts: Record<AuraState, number> = {
            inactive: 0,
            weak: 0,
            stable: 0,
            strong: 0,
            legendary: 0,
        };

        let currentStreak = 0;
        let longestStrongPeriod = 0;
        let currentStrongPeriod = 0;
        let auraBreaks = 0;

        for (let i = 0; i < dates.length; i++) {
            // Calculate streak up to this point
            if (i === 0) {
                currentStreak = 1;
            } else {
                const prev = new Date(dates[i - 1]);
                const curr = new Date(dates[i]);
                const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    // Streak broken
                    if (currentStreak > 0) {
                        auraBreaks++;
                    }
                    currentStreak = 1;
                }
            }

            const state = AuraService.getAuraState(currentStreak);
            stateCounts[state]++;

            // Track strong/legendary periods
            if (state === 'strong' || state === 'legendary') {
                currentStrongPeriod++;
                longestStrongPeriod = Math.max(longestStrongPeriod, currentStrongPeriod);
            } else {
                currentStrongPeriod = 0;
            }
        }

        // Find most common state
        const mostCommonState = (Object.entries(stateCounts) as [AuraState, number][])
            .sort((a, b) => b[1] - a[1])[0][0];

        return {
            mostCommonState,
            longestStrongPeriod,
            auraBreaks,
        };
    },

    /**
     * Monthly breakdown
     */
    calculateMonthlyBreakdown(checks: Check[], year: number): MonthlyBreakdown[] {
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const months: MonthlyBreakdown[] = [];

        for (let month = 0; month < 12; month++) {
            const monthStr = String(month + 1).padStart(2, '0');
            const monthPrefix = `${year}-${monthStr}`;

            const monthChecks = checks.filter(c => c.date.startsWith(monthPrefix));

            months.push({
                month: month + 1,
                checksCount: monthChecks.length,
                label: monthNames[month],
            });
        }

        return months;
    },

    /**
     * Get the most consistent month
     */
    getMostConsistentMonth(months: MonthlyBreakdown[]): MonthlyBreakdown | null {
        const activeMonths = months.filter(m => m.checksCount > 0);
        if (activeMonths.length === 0) return null;

        return activeMonths.reduce((max, m) =>
            m.checksCount > max.checksCount ? m : max
        );
    },
};
