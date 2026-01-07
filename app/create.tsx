import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChallengeRepository } from '../src/data/repositories/ChallengeRepository';
import { Button } from '../src/ui/components/Button';
import { Card } from '../src/ui/components/Card';
import { colors } from '../src/ui/theme/colors';
import { spacing, layout } from '../src/ui/theme/spacing';
import { typography } from '../src/ui/theme/typography';
import { LoadingOverlay } from '../src/ui/components/LoadingOverlay';
import { GamificationService, AURA_REWARDS } from '../src/domain/services/GamificationService';
import { t } from '../src/i18n/i18n';

export default function CreateChallengeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('30');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLongTerm, setIsLongTerm] = useState(false);

    const [loading, setLoading] = useState(false);
    const handleCreate = async () => {
        if (!title) {
            Alert.alert(t('common.error'), t('create.errorTitleRequired'));
            return;
        }

        setLoading(true);
        try {
            const calculatedPoints = isLongTerm
                ? GamificationService.calculateCompletionPoints(parseInt(duration) || 30)
                : AURA_REWARDS.DAILY_CHECK;

            const newChallenge = {
                title,
                description,
                points: calculatedPoints,
                duration: parseInt(duration) || 30,
                isPrivate,
                isLongTerm,
            };

            await ChallengeRepository.create(newChallenge);
            router.back();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('create.errorFailed'));
            setLoading(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.header, { marginTop: Math.max(insets.top, 20) }]}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity
                                onPress={handleBack}
                                style={styles.backButtonCircle}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>{t('create.title')}</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <Text style={styles.headerSubtitle}>{t('create.subtitle')}</Text>
                    </View>

                    <Card style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('create.labelTitle')}</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('create.placeholderTitle')}
                                placeholderTextColor={colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('create.labelDescription')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder={t('create.placeholderDescription')}
                                placeholderTextColor={colors.text.tertiary}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Challenge Type Selector */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('create.typeLabel')}</Text>
                            <View style={styles.typeSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        !isLongTerm && styles.typeOptionActive
                                    ]}
                                    onPress={() => setIsLongTerm(false)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={24}
                                        color={!isLongTerm ? colors.primary : colors.text.tertiary}
                                    />
                                    <Text style={[
                                        styles.typeOptionTitle,
                                        !isLongTerm && styles.typeOptionTitleActive
                                    ]}>{t('create.typeDaily')}</Text>
                                    <Text style={styles.typeOptionDesc}>{t('create.typeDailyDesc')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        isLongTerm && styles.typeOptionActive
                                    ]}
                                    onPress={() => setIsLongTerm(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="flag"
                                        size={24}
                                        color={isLongTerm ? colors.primary : colors.text.tertiary}
                                    />
                                    <Text style={[
                                        styles.typeOptionTitle,
                                        isLongTerm && styles.typeOptionTitleActive
                                    ]}>{t('create.typeLongTerm')}</Text>
                                    <Text style={styles.typeOptionDesc}>{t('create.typeLongTermDesc')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Aura Rewards</Text>
                            <View style={styles.rewardPreview}>
                                <View style={styles.rewardItem}>
                                    <Ionicons name="flash" size={16} color={colors.aura.stable} />
                                    <Text style={styles.rewardText}>
                                        {isLongTerm
                                            ? `+${AURA_REWARDS.LONG_TERM_NUDGE} pts per daily work`
                                            : `+${AURA_REWARDS.DAILY_CHECK} pts per check-in`}
                                    </Text>
                                </View>
                                {isLongTerm && (
                                    <View style={styles.rewardItem}>
                                        <Ionicons name="trophy" size={16} color={colors.aura.legendary} />
                                        <Text style={styles.rewardText}>
                                            +{GamificationService.calculateCompletionPoints(parseInt(duration) || 30)} pts on completion
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('create.labelDuration')}</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                placeholder={t('create.placeholderDuration')}
                                placeholderTextColor={colors.text.tertiary}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helperText}>{t('create.helperDuration')}</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabelContainer}>
                                <Text style={styles.label}>{t('create.labelPrivate')}</Text>
                                <Text style={styles.helperText}>{t('create.helperPrivate')}</Text>
                            </View>
                            <Switch
                                value={isPrivate}
                                onValueChange={setIsPrivate}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={isPrivate ? colors.primary : colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.buttonGroup}>
                            <Button
                                title={loading ? t('create.creating') : t('create.createButton')}
                                onPress={handleCreate}
                                disabled={loading}
                                size="large"
                                style={styles.createButton}
                            />
                            <Button
                                title={t('common.cancel')}
                                variant="ghost"
                                onPress={() => router.back()}
                                disabled={loading}
                            />
                        </View>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
            <LoadingOverlay visible={loading} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.m,
    },
    header: {
        marginBottom: spacing.l,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    headerTitle: {
        ...typography.h1,
        color: colors.text.primary,
        textAlign: 'center',
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    formCard: {
        padding: spacing.l,
    },
    inputGroup: {
        marginBottom: spacing.l,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.s,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.m,
        borderRadius: layout.borderRadius.m,
        fontSize: 16,
        color: colors.text.primary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        ...typography.caption,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
    },
    buttonGroup: {
        marginTop: spacing.s,
    },
    createButton: {
        marginBottom: spacing.m,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
        paddingVertical: spacing.s,
    },
    switchLabelContainer: {
        flex: 1,
        marginRight: spacing.m,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    typeOption: {
        flex: 1,
        backgroundColor: colors.background,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: layout.borderRadius.m,
        padding: spacing.m,
        alignItems: 'center',
        gap: spacing.xs,
    },
    typeOptionActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    typeOptionTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text.secondary,
        textAlign: 'center',
    },
    typeOptionTitleActive: {
        color: colors.primary,
    },
    typeOptionDesc: {
        ...typography.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    rewardPreview: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius.m,
        padding: spacing.m,
        gap: spacing.s,
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    rewardText: {
        ...typography.bodySmall,
        color: colors.text.primary,
        fontWeight: '600',
    },
});
