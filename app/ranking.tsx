import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, LayoutAnimation, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { CheckRepository } from '../src/data/repositories/CheckRepository';
import { Challenge } from '../src/domain/models/Challenge';
import { UserRepository } from '../src/data/repositories/UserRepository';
import { User } from '../src/domain/models/User';
import { Card } from '../src/ui/components/Card';
import { RankingChangeIndicator } from '../src/ui/components/RankingChangeIndicator';
import { colors } from '../src/ui/theme/colors';
import { spacing, layout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { GamificationService } from '../src/domain/services/GamificationService';
import { LoadingOverlay } from '../src/ui/components/LoadingOverlay';
import { SocialContext } from '../src/ui/components/SocialContext';
import { SocialDataProvider, useSocialData } from '../src/ui/components/SocialDataContext';
import { AuraIndicator } from '../src/ui/components/AuraIndicator';
import { AuraService } from '../src/domain/services/AuraService';
import { t } from '../src/i18n/i18n';



interface UserRanking {
    userId: string;
    count: number;
    totalAura: number;
    displayName?: string;
    previousRank?: number | null;
    currentRank?: number;
    auraState?: string;
    currentStreak?: number;
}

interface RankChange {
    userDisplayName: string;
    rankChange: number;
}

export default function RankingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [rankings, setRankings] = useState<Record<string, UserRanking[]>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rankChanges, setRankChanges] = useState<Record<string, RankChange | null>>({});
    const { loadCheckInsForChallenges } = useSocialData();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await UserRepository.getUser();
            setCurrentUser(user);

            const allChallenges = await ChallengeRepository.getAll();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setChallenges(allChallenges);

            const newRankings: Record<string, UserRanking[]> = {};
            const changes: Record<string, RankChange | null> = {};

            // Optimization: Fetch rankings in parallel
            const rankingPromises = allChallenges.map(async (challenge) => {
                try {
                    const ranking = await CheckRepository.getRanking(challenge.id);

                    // Calculate total aura for each user
                    const rankingsWithAura: UserRanking[] = ranking.map(r => {
                        const totalAura = GamificationService.calculateChallengePoints(
                            challenge,
                            r.count,
                            (r as any).isCompleted
                        );
                        return {
                            ...r,
                            totalAura
                        };
                    });

                    // Check if current user's rank changed for the notification message
                    if (user) {
                        const userRanking = rankingsWithAura.find(r => r.userId === user.id);
                        if (userRanking && userRanking.previousRank !== undefined && userRanking.previousRank !== null) {
                            // Calculate current rank (handles ties)
                            let currentRank = 1;
                            const userIndex = rankingsWithAura.indexOf(userRanking);
                            for (let i = 0; i < userIndex; i++) {
                                if (rankingsWithAura[i].totalAura > userRanking.totalAura) {
                                    currentRank++;
                                }
                            }

                            const rankChange = userRanking.previousRank - currentRank;
                            if (rankChange !== 0) {
                                changes[challenge.id] = {
                                    userDisplayName: user.displayName,
                                    rankChange
                                };
                            }
                        }
                    }

                    return { challengeId: challenge.id, ranking: rankingsWithAura };
                } catch (e) {
                    console.error(`Failed to load ranking for ${challenge.id}`, e);
                    return { challengeId: challenge.id, ranking: [] };
                }
            });

            const results = await Promise.all(rankingPromises);

            for (const result of results) {
                if (result.ranking.length > 0) {
                    newRankings[result.challengeId] = result.ranking;
                }
            }

            setRankings(newRankings);
            setRankChanges(changes);

            // Fetch social context data for all challenges
            const challengeIds = allChallenges.map(c => c.id);
            await loadCheckInsForChallenges(challengeIds);
        } finally {
            setIsLoading(false);
        }
    }, [loadCheckInsForChallenges]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1: return { color: colors.rank.gold, fontSize: 20 };
            case 2: return { color: colors.rank.silver, fontSize: 18 };
            case 3: return { color: colors.rank.bronze, fontSize: 18 };
            default: return { color: colors.text.secondary, fontSize: 16 };
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const renderRankingItem = (item: UserRanking, index: number, allRankings: UserRanking[], challenge: Challenge) => {
        const isCurrentUser = item.userId === currentUser?.id;
        const prevUser = index > 0 ? allRankings[index - 1] : null;
        const pointDiff = prevUser ? prevUser.totalAura - item.totalAura : null;

        // Calculate rank (1-indexed, handles ties)
        let rank = 1;
        for (let i = 0; i < index; i++) {
            if (allRankings[i].totalAura > item.totalAura) {
                rank++;
            }
        }

        const displayName = isCurrentUser
            ? currentUser.displayName
            : (item.displayName || `User ${item.userId.substr(0, 6)}...`);

        return (
            <View
                key={item.userId}
                style={[
                    styles.rankingRow,
                    isCurrentUser && styles.currentUserRow
                ]}
            >
                <View style={styles.rankBadge}>
                    <Text style={[styles.rankNumber, getRankStyle(rank)]}>
                        {getRankIcon(rank)}
                    </Text>
                </View>
                <View style={styles.rankingMain}>
                    <View style={styles.userInfo}>
                        <Text style={[
                            styles.userId,
                            isCurrentUser && styles.currentUserText
                        ]}>
                            {displayName}
                        </Text>
                        {isCurrentUser && <Text style={styles.youBadge}>{t('ranking.you')}</Text>}
                        {/* Aura indicator */}
                        {item.auraState && (
                            <AuraIndicator
                                auraState={item.auraState as any}
                                size="small"
                            />
                        )}
                        {/* Ranking change indicator */}
                        {(item.previousRank !== undefined && item.previousRank !== null) && (
                            <RankingChangeIndicator
                                previousRank={item.previousRank}
                                currentRank={item.currentRank || rank}
                            />
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.pointsRow}>
                            <Text style={styles.points}>{item.totalAura} {t('common.pts')}</Text>
                            {(!challenge.isLongTerm || !(item as any).isCompleted) && (
                                <Text style={styles.checks}>
                                    • {item.count} {challenge.isLongTerm ? t('home.nudge') : t('ranking.checks')}
                                </Text>
                            )}
                        </View>
                        {(item as any).isCompleted && (
                            <Text style={styles.completedDate}>
                                {t('home.completedOn', { date: new Date((item as any).completedAt).toLocaleDateString() })}
                            </Text>
                        )}
                        {pointDiff !== null && pointDiff > 0 && !challenge.isLongTerm && (
                            <Text style={styles.pointDiff}>{t('ranking.toNext', { diff: pointDiff })}</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }: { item: Challenge }) => {
        const rankChange = rankChanges[item.id];

        return (
            <Card style={styles.item}>
                <Text style={styles.title}>{item.title}</Text>
                {rankChange && (
                    <View style={styles.changeMessage}>
                        <Text style={[
                            styles.changeText,
                            { color: rankChange.rankChange > 0 ? colors.status.success : colors.status.error }
                        ]}>
                            {rankChange.rankChange > 0
                                ? t('ranking.up', { count: rankChange.rankChange })
                                : t('ranking.down', { count: Math.abs(rankChange.rankChange) })
                            }
                        </Text>
                    </View>
                )}

                {/* Social Context */}
                {currentUser && (
                    <View style={{ marginBottom: spacing.m, paddingHorizontal: spacing.s }}>
                        <SocialContext
                            challengeId={item.id}
                            currentUserId={currentUser.id}
                            totalParticipants={item.participantCount || 1}
                            isLongTerm={item.isLongTerm}
                        />
                    </View>
                )}

                <View style={styles.rankingContainer}>
                    {rankings[item.id]?.length > 0 ? (
                        rankings[item.id].slice(0, 5).map((r, i) => renderRankingItem(r, i, rankings[item.id], item))
                    ) : (
                        <Text style={styles.noData}>{t('ranking.noData')}</Text>
                    )}
                </View>
            </Card>
        );
    };

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
                    <Text style={styles.headerTitle}>{t('ranking.title')}</Text>
                    <View style={{ width: 44 }} />
                </View>
                <Text style={styles.headerSubtitle}>{t('ranking.subtitle')}</Text>
            </View>
            <FlatList
                data={challenges}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('ranking.empty')}</Text>}
            />
            <LoadingOverlay visible={isLoading} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    list: {
        padding: spacing.m,
    },
    item: {
        marginBottom: spacing.m,
    },
    title: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.s,
    },
    rankingContainer: {
        marginTop: spacing.xs,
    },
    rankingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.s,
        borderRadius: layout.borderRadius.m,
        marginBottom: spacing.xs,
    },
    currentUserRow: {
        backgroundColor: colors.primaryLight + '30',
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    rankBadge: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNumber: {
        fontWeight: 'bold',
    },
    rankingMain: {
        flex: 1,
        marginLeft: spacing.s,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    userId: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '500',
        flexShrink: 1,
    },
    currentUserText: {
        color: colors.primary,
        fontWeight: '700',
    },
    youBadge: {
        ...typography.caption,
        color: colors.primary,
        marginLeft: spacing.xs,
        fontWeight: 'bold',
    },
    statsContainer: {
        marginTop: 2,
    },
    pointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    points: {
        ...typography.bodySmall,
        color: colors.secondary,
        fontWeight: 'bold',
    },
    checks: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
    pointDiff: {
        fontSize: 9,
        color: colors.text.tertiary,
        fontStyle: 'italic',
        marginTop: 1,
    },
    noData: {
        ...typography.body,
        fontStyle: 'italic',
        color: colors.text.tertiary,
        textAlign: 'center',
        padding: spacing.m,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: colors.text.tertiary,
    },
    changeMessage: {
        backgroundColor: colors.primaryLight + '20',
        borderRadius: layout.borderRadius.s,
        padding: spacing.s,
        marginBottom: spacing.s,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    changeText: {
        ...typography.bodySmall,
        fontWeight: '600',
        textAlign: 'center',
    },
    completedDate: {
        ...typography.caption,
        color: colors.status.success,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
