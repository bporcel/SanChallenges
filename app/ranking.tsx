import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, LayoutAnimation, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { CheckRepository } from '../src/data/repositories/CheckRepository';
import { Challenge } from '../src/domain/models/Challenge';
import { UserRepository } from '../src/data/repositories/UserRepository';
import { User } from '../src/domain/models/User';
import { Card } from '../src/ui/components/Card';
import { colors } from '../src/ui/theme/colors';
import { spacing, layout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { GamificationService } from '../src/domain/services/GamificationService';
import { LoadingOverlay } from '../src/ui/components/LoadingOverlay';
import { t } from '../src/i18n/i18n';



interface UserRanking {
    userId: string;
    count: number;
    totalPoints: number;
    displayName?: string;
}

export default function RankingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [rankings, setRankings] = useState<Record<string, UserRanking[]>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await UserRepository.getUser();
            setCurrentUser(user);

            const allChallenges = await ChallengeRepository.getAll();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setChallenges(allChallenges);

            const newRankings: Record<string, UserRanking[]> = {};
            for (const challenge of allChallenges) {
                try {
                    const ranking = await CheckRepository.getRanking(challenge.id);
                    // Calculate total points
                    const rankingWithPoints = ranking.map(r => ({
                        ...r,
                        totalPoints: r.count * (challenge.points || 0)
                    }));
                    newRankings[challenge.id] = rankingWithPoints;
                } catch (e) {
                    console.error(`Failed to load ranking for ${challenge.id}`, e);
                }
            }
            setRankings(newRankings);
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
        const pointDiff = prevUser ? prevUser.totalPoints - item.totalPoints : null;

        // Calculate rank (1-indexed, handles ties)
        let rank = 1;
        for (let i = 0; i < index; i++) {
            if (allRankings[i].totalPoints > item.totalPoints) {
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
                <View style={styles.userInfo}>
                    <View>
                        <Text style={[
                            styles.userId,
                            isCurrentUser && styles.currentUserText
                        ]}>
                            {displayName}
                        </Text>
                    </View>
                    {isCurrentUser && <Text style={styles.youBadge}>{t('ranking.you')}</Text>}
                </View>
                <View style={styles.statsContainer}>
                    <Text style={styles.points}>{item.totalPoints} {t('common.pts')}</Text>
                    {pointDiff !== null && pointDiff > 0 && (
                        <Text style={styles.pointDiff}>{t('ranking.toNext', { diff: pointDiff })}</Text>
                    )}
                    <Text style={styles.checks}>{item.count} {t('ranking.checks')}</Text>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }: { item: Challenge }) => (
        <Card style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.rankingContainer}>
                {rankings[item.id]?.length > 0 ? (
                    rankings[item.id].slice(0, 5).map((r, i) => renderRankingItem(r, i, rankings[item.id]))
                ) : (
                    <Text style={styles.noData}>{t('ranking.noData')}</Text>
                )}
            </View>
        </Card>
    );

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
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.s,
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
        alignItems: 'flex-end',
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
});
