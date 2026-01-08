import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { CheckRepository } from '../src/data/repositories/CheckRepository';
import { StatisticsService, YearlyStats } from '../src/domain/services/StatisticsService';
import { AuraService } from '../src/domain/services/AuraService';
import { Card } from '../src/ui/components/Card';
import { LoadingOverlay } from '../src/ui/components/LoadingOverlay';
import { useColors } from '../src/ui/theme/colors';
import { spacing, useLayout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { t } from '../src/i18n/i18n';

export default function StatsScreen() {
    const colors = useColors();
    const layout = useLayout();
    const styles = getStyles(colors, layout);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState<YearlyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const challenges = await ChallengeRepository.getAll();
            const checks = await CheckRepository.getAll();
            const currentYear = new Date().getFullYear();
            const yearlyStats = StatisticsService.calculateYearlyStats(challenges, checks, currentYear);
            setStats(yearlyStats);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const getMostConsistentMonth = () => {
        if (!stats) return null;
        return StatisticsService.getMostConsistentMonth(stats.months);
    };

    const getAuraColor = (state: string) => {
        return AuraService.getAuraColor(state as any);
    };

    const renderMonthBar = (month: { label: string; checksCount: number }, maxChecks: number) => {
        const height = maxChecks > 0 ? Math.max(4, (month.checksCount / maxChecks) * 60) : 4;
        const isActive = month.checksCount > 0;

        return (
            <View key={month.label} style={styles.monthBarContainer}>
                <View
                    style={[
                        styles.monthBar,
                        {
                            height,
                            backgroundColor: isActive ? colors.primary : colors.border,
                        }
                    ]}
                />
                <Text style={[styles.monthLabel, !isActive && styles.monthLabelInactive]}>
                    {month.label}
                </Text>
            </View>
        );
    };

    const mostConsistentMonth = getMostConsistentMonth();
    const maxMonthlyChecks = stats?.months.reduce((max, m) => Math.max(max, m.checksCount), 0) || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButtonCircle}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('stats.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>
                <Text style={styles.headerSubtitle}>
                    {t('stats.subtitle', { year: stats?.year || new Date().getFullYear() })}
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {stats && (
                    <>
                        {/* Challenges Section */}
                        <Card style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="flag-outline" size={20} color={colors.primary} />
                                <Text style={styles.sectionTitle}>{t('stats.challenges.title')}</Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stats.challenges.participated}</Text>
                                    <Text style={styles.statLabel}>{t('stats.challenges.participated')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.status.success }]}>
                                        {stats.challenges.completed}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.challenges.completed')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text.tertiary }]}>
                                        {stats.challenges.abandoned}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.challenges.abandoned')}</Text>
                                </View>
                            </View>
                        </Card>

                        {/* Consistency Section */}
                        <Card style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="checkmark-done-outline" size={20} color={colors.secondary} />
                                <Text style={styles.sectionTitle}>{t('stats.consistency.title')}</Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stats.checks.total}</Text>
                                    <Text style={styles.statLabel}>{t('stats.consistency.totalChecks')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stats.checks.avgPerWeek}</Text>
                                    <Text style={styles.statLabel}>{t('stats.consistency.avgPerWeek')}</Text>
                                </View>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.accent }]}>
                                        🔥 {stats.checks.bestStreak}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.consistency.bestStreak')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text.tertiary }]}>
                                        {stats.checks.missedDays}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.consistency.missedDays')}</Text>
                                </View>
                            </View>

                            {/* Monthly activity visualization */}
                            {mostConsistentMonth && (
                                <Text style={styles.insightText}>
                                    {t('stats.consistency.bestMonth', { month: mostConsistentMonth.label })}
                                </Text>
                            )}

                            <View style={styles.monthsContainer}>
                                {stats.months.map(month => renderMonthBar(month, maxMonthlyChecks))}
                            </View>
                        </Card>

                        {/* Aura Journey Section */}
                        <Card style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles-outline" size={20} color={colors.aura.legendary} />
                                <Text style={styles.sectionTitle}>{t('stats.aura.title')}</Text>
                            </View>

                            <View style={styles.auraMainStat}>
                                <View
                                    style={[
                                        styles.auraBadge,
                                        { backgroundColor: getAuraColor(stats.aura.mostCommonState) + '30' }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.auraStateText,
                                            { color: getAuraColor(stats.aura.mostCommonState) }
                                        ]}
                                    >
                                        {t(`aura.${stats.aura.mostCommonState}`)}
                                    </Text>
                                </View>
                                <Text style={styles.auraDescription}>
                                    {t('stats.aura.mostCommon')}
                                </Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.aura.strong }]}>
                                        {stats.aura.longestStrongPeriod}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.aura.longestStrong')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text.tertiary }]}>
                                        {stats.aura.auraBreaks}
                                    </Text>
                                    <Text style={styles.statLabel}>{t('stats.aura.breaks')}</Text>
                                </View>
                            </View>
                        </Card>

                        {/* Empty state message if no activity */}
                        {stats.challenges.participated === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>{t('stats.empty')}</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <LoadingOverlay visible={isLoading} />
        </SafeAreaView>
    );
}

const getStyles = (colors: any, layout: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.m,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text.primary,
        textAlign: 'center',
    },
    headerSubtitle: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    card: {
        marginBottom: spacing.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text.primary,
        marginLeft: spacing.s,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.m,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        ...typography.h2,
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    statLabel: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    insightText: {
        ...typography.bodySmall,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: spacing.m,
        fontStyle: 'italic',
    },
    monthsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 80,
        paddingTop: spacing.s,
    },
    monthBarContainer: {
        alignItems: 'center',
        flex: 1,
    },
    monthBar: {
        width: 16,
        borderRadius: 4,
        marginBottom: spacing.xs,
    },
    monthLabel: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontSize: 10,
    },
    monthLabelInactive: {
        color: colors.text.tertiary,
        opacity: 0.5,
    },
    auraMainStat: {
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    auraBadge: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.s,
        borderRadius: layout.borderRadius.l,
        marginBottom: spacing.xs,
    },
    auraStateText: {
        ...typography.h3,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    auraDescription: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    emptyState: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
});
