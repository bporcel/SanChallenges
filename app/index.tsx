import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, LayoutAnimation, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { CheckRepository } from '../src/data/repositories/CheckRepository';
import { Challenge } from '../src/domain/models/Challenge';
import { dateService } from '../src/data/DateService';
import { UserRepository } from '../src/data/repositories/UserRepository';
import { User } from '../src/domain/models/User';
import { EditNameModal } from '../src/ui/components/EditNameModal';
import { Card } from '../src/ui/components/Card';
import { Button } from '../src/ui/components/Button';
import { StreakBadge } from '../src/ui/components/StreakBadge';
import { GoalProgress } from '../src/ui/components/GoalProgress';
import { SocialContext } from '../src/ui/components/SocialContext';
import { CheckCelebration } from '../src/ui/components/CheckCelebration';
import { AuraBadge } from '../src/ui/components/AuraBadge';
import { colors } from '../src/ui/theme/colors';
import { spacing, layout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { GamificationService } from '../src/domain/services/GamificationService';
import { t } from '../src/i18n/i18n';



export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [checkedToday, setCheckedToday] = useState<Record<string, boolean>>({});
    const [streaks, setStreaks] = useState<Record<string, number>>({});
    const [totalAura, setTotalAura] = useState(0);
    const [user, setUser] = useState<User | null>(null);
    const [isEditNameVisible, setIsEditNameVisible] = useState(false);
    const [celebratingCheckId, setCelebratingCheckId] = useState<string | null>(null);
    const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

    const loadData = useCallback(async () => {
        const allChallenges = await ChallengeRepository.sync();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setChallenges(allChallenges);

        const currentUser = await UserRepository.getUser();
        setUser(currentUser);

        const today = dateService.getToday();
        const checks: Record<string, boolean> = {};
        const currentStreaks: Record<string, number> = {};
        let aura = 0;

        // Optimization: Fetch all checks once
        const allChecks = await CheckRepository.getAll();

        for (const challenge of allChallenges) {
            const challengeChecks = allChecks.filter(c => c.challengeId === challenge.id);
            const isChecked = challengeChecks.some((c) => c.date === today && c.completed);
            checks[challenge.id] = isChecked;

            const completedChecks = challengeChecks.filter(c => c.completed);
            currentStreaks[challenge.id] = GamificationService.calculateStreak(challengeChecks);
            aura += completedChecks.length * (challenge.points || 0);
        }

        setCheckedToday(checks);
        setStreaks(currentStreaks);
        setTotalAura(aura);

        // Load participant counts for social context
        const counts: Record<string, number> = {};
        for (const challenge of allChallenges) {
            // Estimate participant count from ranking data
            try {
                const ranking = await CheckRepository.getRanking(challenge.id);
                counts[challenge.id] = ranking.length;
            } catch (e) {
                counts[challenge.id] = 1; // At least the user
            }
        }
        setParticipantCounts(counts);
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

        // Show celebration animation only when checking (not unchecking)
        if (!isChecked) {
            setCelebratingCheckId(challengeId);
            // Haptic feedback for successful check
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Optimistic UI update - toggle immediately
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setCheckedToday(prev => ({ ...prev, [challengeId]: !isChecked }));

        // Update streak optimistically
        setStreaks(prev => ({
            ...prev,
            [challengeId]: !isChecked ? (prev[challengeId] || 0) + 1 : Math.max(0, (prev[challengeId] || 0) - 1)
        }));

        // Update points optimistically
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
            setTotalAura(prev => !isChecked ? prev + (challenge.points || 0) : prev - (challenge.points || 0));
        }

        // Then persist to storage and server
        await CheckRepository.create({
            id: Crypto.randomUUID(),
            challengeId,
            date: today,
            completed: !isChecked,
        });

        // Reload data to refresh social context
        loadData();
    };

    const handleDelete = async (challengeId: string) => {
        Alert.alert(
            t('home.deleteTitle'),
            t('home.deleteMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic UI update - remove immediately from state
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setChallenges(prev => prev.filter(c => c.id !== challengeId));

                        // Then persist to storage and server
                        await ChallengeRepository.delete(challengeId);
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

    const renderItem = ({ item }: { item: Challenge }) => {
        const isOwner = user?.id === item.creatorId;
        const isPrivateChallenge = item.isPrivate === true;
        const canCheck = !isPrivateChallenge || isOwner;

        // Calculate current day from challenge creation
        const createdDate = new Date(item.createdAt);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const currentDay = Math.max(1, daysDiff);
        const totalDays = item.duration || 30;

        return (
            <Card style={styles.item}>
                {/* Celebration overlay */}
                <CheckCelebration
                    visible={celebratingCheckId === item.id}
                    onComplete={() => setCelebratingCheckId(null)}
                />

                <View style={styles.cardMain}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                        </View>
                        <View style={styles.badgesContainer}>
                            {isPrivateChallenge && (
                                <View style={styles.privateBadge}>
                                    <Ionicons name="lock-closed" size={10} color={colors.text.inverse} />
                                    <Text style={styles.privateBadgeText}>{t('home.privateBadge')}</Text>
                                </View>
                            )}
                            <View style={styles.auraBadge}>
                                <Text style={styles.auraText}>{item.points} {t('common.pts')}</Text>
                            </View>
                        </View>
                    </View>
                    {item.description ? (
                        <Text style={styles.description}>{item.description}</Text>
                    ) : null}
                    {!isOwner && item.creatorName && (
                        <Text style={styles.createdByText}>{t('home.createdBy', { name: item.creatorName })}</Text>
                    )}

                    {/* Goal Progress */}
                    <GoalProgress currentDay={currentDay} totalDays={totalDays} />

                    {/* Social Context */}
                    {user && (
                        <View style={styles.socialContextContainer}>
                            <SocialContext
                                challengeId={item.id}
                                currentUserId={user.id}
                                totalParticipants={participantCounts[item.id] || 1}
                            />
                        </View>
                    )}
                </View>

                <View style={styles.cardStats}>
                    <StreakBadge streak={streaks[item.id] || 0} />
                    <Text style={styles.inviteCodeSubtle}>{t('home.code', { code: item.inviteCode })}</Text>
                </View>

                {isPrivateChallenge && !isOwner && (
                    <Text style={styles.ownerOnlyText}>{t('home.ownerOnlyCheck')}</Text>
                )}

                <View style={styles.cardActions}>
                    <Button
                        title={t('common.delete')}
                        variant="ghost"
                        size="small"
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteButton}
                        textStyle={{ color: colors.status.error }}
                    />
                    <Button
                        title={checkedToday[item.id] ? t('common.undo') : t('common.check')}
                        variant={checkedToday[item.id] ? 'secondary' : 'primary'}
                        size="small"
                        onPress={() => handleCheck(item.id)}
                        style={!canCheck ? [styles.checkButton, styles.disabledButton] : styles.checkButton}
                        disabled={!canCheck}
                    />
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {user && (
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.userNameContainer}
                            onPress={() => setIsEditNameVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.greeting}>{t('home.greeting')}</Text>
                            <Text style={styles.userName}>{user.displayName}</Text>
                            <Ionicons name="pencil-outline" size={14} color={colors.primary} style={styles.editIcon} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerRight}>
                        <AuraBadge value={totalAura} label={t('common.pts')} />
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
                        <Text style={styles.emptyText}>{t('home.noChallenges')}</Text>
                        <Text style={styles.emptySubtext}>{t('home.createFirst')}</Text>
                    </View>
                }
            />
            <View style={styles.footer}>
                <Button
                    title={t('home.createNew')}
                    onPress={() => router.push('/create')}
                    style={styles.footerButton}
                />
                <View style={styles.secondaryButtons}>
                    <Button
                        title={t('home.joinChallenge')}
                        variant="secondary"
                        onPress={() => router.push('/join')}
                        style={{ flex: 1, marginRight: spacing.s }}
                    />
                    <Button
                        title={t('home.viewRanking')}
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
        gap: spacing.s,
    },
    greeting: {
        ...typography.h2,
        color: colors.text.secondary,
        fontWeight: '400',
    },
    userNameContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
    },
    userName: {
        ...typography.h2,
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    editIcon: {
        marginLeft: spacing.xs,
        opacity: 0.6,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    list: {
        padding: spacing.m,
    },
    item: {
        marginBottom: spacing.m,
        padding: spacing.m,
    },
    cardMain: {
        marginBottom: spacing.s,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.s,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h3,
        color: colors.text.primary,
    },
    badgesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 2, // Fine-tune alignment with title text
    },
    description: {
        ...typography.bodySmall,
        color: colors.text.secondary,
    },
    cardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.xs,
        paddingVertical: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border + '40',
        marginTop: spacing.s,
    },
    streakText: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text.secondary,
    },
    inviteCodeSubtle: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.s,
        marginTop: spacing.s,
    },
    deleteButton: {
        paddingHorizontal: spacing.s,
    },
    checkButton: {
        minWidth: 100,
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
    titleContainer: {
        flex: 1,
    },
    privateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.text.tertiary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: layout.borderRadius.s,
        gap: 2,
        height: 20, // Fixed height for alignment
    },
    privateBadgeText: {
        ...typography.caption,
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: 'bold',
        lineHeight: 12,
    },
    auraBadge: {
        backgroundColor: colors.aura.mid,
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: layout.borderRadius.s,
        height: 20, // Match privateBadge height
        justifyContent: 'center',
        shadowColor: colors.aura.mid,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    auraText: {
        ...typography.caption,
        color: colors.text.inverse,
        fontWeight: 'bold',
        lineHeight: 12,
    },
    createdByText: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        opacity: 0.8,
    },
    ownerOnlyText: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontStyle: 'italic',
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    socialContextContainer: {
        marginTop: spacing.xs,
    },
});

