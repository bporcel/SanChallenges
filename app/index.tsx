import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, LayoutAnimation, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { CheckRepository } from '../src/data/repositories/CheckRepository';
import { Challenge } from '../src/domain/models/Challenge';
import { dateService } from '../src/data/DateService';
import { UserRepository } from '../src/data/repositories/UserRepository';
import { User } from '../src/domain/models/User';
import { EditNameModal } from '../src/ui/components/EditNameModal';
import { Card } from '../src/ui/components/Card';
import { Button } from '../src/ui/components/Button';
import { colors } from '../src/ui/theme/colors';
import { spacing, layout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { GamificationService } from '../src/domain/services/GamificationService';



export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [checkedToday, setCheckedToday] = useState<Record<string, boolean>>({});
    const [streaks, setStreaks] = useState<Record<string, number>>({});
    const [totalPoints, setTotalPoints] = useState(0);
    const [user, setUser] = useState<User | null>(null);
    const [isEditNameVisible, setIsEditNameVisible] = useState(false);

    const loadData = useCallback(async () => {
        const allChallenges = await ChallengeRepository.getAll();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setChallenges(allChallenges);

        const currentUser = await UserRepository.getUser();
        setUser(currentUser);

        const today = dateService.getToday();
        const checks: Record<string, boolean> = {};
        const currentStreaks: Record<string, number> = {};
        let points = 0;

        for (const challenge of allChallenges) {
            const challengeChecks = await CheckRepository.getByChallengeId(challenge.id);
            const isChecked = challengeChecks.some((c) => c.date === today && c.completed);
            checks[challenge.id] = isChecked;

            const completedChecks = challengeChecks.filter(c => c.completed);
            currentStreaks[challenge.id] = GamificationService.calculateStreak(challengeChecks);
            points += completedChecks.length * (challenge.points || 0);
        }

        setCheckedToday(checks);
        setStreaks(currentStreaks);
        setTotalPoints(points);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    useEffect(() => {
        return dateService.subscribe(() => {
            loadData();
        });
    }, [loadData]);

    const handleCheck = async (challengeId: string) => {
        const isChecked = checkedToday[challengeId];
        const today = dateService.getToday();

        await CheckRepository.create({
            id: Math.random().toString(36).substr(2, 9),
            challengeId,
            date: today,
            completed: !isChecked,
        });

        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        loadData(); // Reload to update points and streaks
    };

    const handleDelete = async (challengeId: string) => {
        Alert.alert(
            'Delete Challenge',
            'Are you sure you want to remove this challenge from your list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await ChallengeRepository.delete(challengeId);
                        loadData();
                    },
                },
            ]
        );
    };

    const handleUpdateName = async (newName: string) => {
        await UserRepository.updateDisplayName(newName);
        setIsEditNameVisible(false);
        loadData();
    };

    const renderItem = ({ item }: { item: Challenge }) => (
        <Card style={styles.item}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                </View>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{item.points} pts</Text>
                </View>
            </View>

            <View style={styles.itemFooter}>
                <View style={styles.streakContainer}>
                    <Text style={styles.streakText}>
                        {streaks[item.id] > 0 ? `🔥 ${streaks[item.id]} day streak` : '❄️ No streak'}
                    </Text>
                    <Text style={styles.inviteCodeSubtle}> • Code: {item.inviteCode}</Text>
                </View>
                <View style={styles.actions}>
                    <Button
                        title="Delete"
                        variant="ghost"
                        size="small"
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteButton}
                        textStyle={{ color: colors.status.error }}
                    />
                    <Button
                        title={checkedToday[item.id] ? 'Undo' : 'Check'}
                        variant={checkedToday[item.id] ? 'secondary' : 'primary'}
                        size="small"
                        onPress={() => handleCheck(item.id)}
                        style={styles.checkButton}
                    />
                </View>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            {user && (
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user.displayName}!</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.totalPointsBadge}>
                            <Text style={styles.totalPointsLabel}>Total Score</Text>
                            <Text style={styles.totalPointsValue}>{totalPoints}</Text>
                        </View>
                        <Button
                            title="Edit Name"
                            variant="ghost"
                            size="small"
                            onPress={() => setIsEditNameVisible(true)}
                        />
                    </View>
                </View>
            )}
            <FlatList
                data={challenges}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No challenges yet.</Text>
                        <Text style={styles.emptySubtext}>Create one to get started!</Text>
                    </View>
                }
            />
            <View style={styles.footer}>
                <Button
                    title="Create New Challenge"
                    onPress={() => router.push('/create')}
                    style={styles.footerButton}
                />
                <View style={styles.secondaryButtons}>
                    <Button
                        title="Join Challenge"
                        variant="secondary"
                        onPress={() => router.push('/join')}
                        style={{ flex: 1, marginRight: spacing.s }}
                    />
                    <Button
                        title="View Ranking"
                        variant="outline"
                        onPress={() => router.push('/ranking')}
                        style={{ flex: 1, marginLeft: spacing.s }}
                    />
                </View>
            </View>

            {user && (
                <EditNameModal
                    visible={isEditNameVisible}
                    currentName={user.displayName}
                    onSave={handleUpdateName}
                    onCancel={() => setIsEditNameVisible(false)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.m,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        ...typography.body,
        color: colors.text.secondary,
    },
    userName: {
        ...typography.h2,
        color: colors.text.primary,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    totalPointsBadge: {
        backgroundColor: colors.primary + '25', // ~15% opacity
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: layout.borderRadius.m,
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    totalPointsLabel: {
        ...typography.caption,
        color: colors.text.secondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    totalPointsValue: {
        ...typography.h3,
        color: colors.primary,
        lineHeight: 24,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text.secondary,
    },
    inviteCodeSubtle: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    list: {
        padding: spacing.m,
    },
    item: {
        marginBottom: spacing.m,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    itemInfo: {
        flex: 1,
        marginRight: spacing.m,
    },
    title: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.bodySmall,
        color: colors.text.secondary,
    },
    pointsBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: layout.borderRadius.m,
    },
    pointsText: {
        ...typography.caption,
        color: colors.text.inverse,
        fontWeight: 'bold',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.s,
    },
    inviteCode: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        marginRight: spacing.s,
    },
    checkButton: {
        minWidth: 80,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xxl,
    },
    emptyText: {
        ...typography.h3,
        color: colors.text.tertiary,
        marginBottom: spacing.s,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.text.tertiary,
    },
    footer: {
        padding: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    footerButton: {
        marginBottom: spacing.m,
    },
    secondaryButtons: {
        flexDirection: 'row',
    },
});

