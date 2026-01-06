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
import { t } from '../src/i18n/i18n';



interface UserRanking {
    userId: string;
    count: number;
    totalAura: number;
    displayName?: string;
    previousRank?: number | null;
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
                    // Calculate total points
                    const rankingWithAura = ranking.map(r => ({
                        ...r,
                        totalAura: r.count * (challenge.points || 0)
                    }));

                    // Load previous rankings from storage
                    const storageKey = `previous_rankings_${challenge.id}`;
                    const previousRankingsJson = await AsyncStorage.getItem(storageKey);
                    const previousRankings: Record<string, number> = previousRankingsJson
                        ? JSON.parse(previousRankingsJson)
                        : {};

                    // Attach previous ranks
                    const rankingsWithChanges = rankingWithAura.map((r: UserRanking, index: number) => {
                        // Calculate current rank (handle ties)
                        let currentRank = 1;
                        for (let i = 0; i < index; i++) {
                            if (rankingWithAura[i].totalAura > r.totalAura) {
                                currentRank++;
                            }
                        }

                        return {
                            ...r,
                            previousRank: previousRankings[r.userId] || null
                        };
                    });

                    // Check if current user's rank changed
                    if (user) {
                        const userRanking = rankingsWithChanges.find(r => r.userId === user.id);
                        if (userRanking && userRanking.previousRank !== null) {
                            let currentRank = 1;
                            const userIndex = rankingsWithChanges.indexOf(userRanking);
                            for (let i = 0; i < userIndex; i++) {
                                if (rankingsWithChanges[i].totalAura > userRanking.totalAura) {
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

                    // Save current rankings for next time
                    const currentRankMap: Record<string, number> = {};
                    rankingsWithChanges.forEach((r: UserRanking, index: number) => {
                        let rank = 1;
                        for (let i = 0; i < index; i++) {
                            if (rankingsWithChanges[i].totalAura > r.totalAura) {
                                rank++;
                            }
                        }
                        currentRankMap[r.userId] = rank;
                    });
                    await AsyncStorage.setItem(storageKey, JSON.stringify(currentRankMap));

                    return { challengeId: challenge.id, ranking: rankingsWithChanges };
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

    const renderRankingItem = (item: UserRanking, index: number, allRankings: UserRanking[]) => {
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
                        {/* Ranking change indicator */}
                        {item.previousRank !== undefined && (
                            <RankingChangeIndicator
                                previousRank={item.previousRank}
                                currentRank={rank}
                            />
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.pointsRow}>
                            <Text style={styles.points}>{item.totalAura} {t('common.pts')}</Text>
                            <Text style={styles.checks}> • {item.count} {t('ranking.checks')}</Text>
                        </View>
                        {pointDiff !== null && pointDiff > 0 && (
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
                                ? `¡Subiste ${rankChange.rankChange} posiciones! 🎉`
                                : `Bajaste ${Math.abs(rankChange.rankChange)} posiciones`
                            }
                        </Text>
                    </View>
                )}
                <View style={styles.rankingContainer}>
                    {rankings[item.id]?.length > 0 ? (
                        rankings[item.id].slice(0, 5).map((r, i) => renderRankingItem(r, i, rankings[item.id]))
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
        flexWrap: 'wrap',
    },
    userId: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '500',
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
});
