import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
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
import { t } from '../src/i18n/i18n';

export default function CreateChallengeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('');

    const [loading, setLoading] = useState(false);
    const handleCreate = async () => {
        if (!title) {
            Alert.alert(t('common.error'), t('create.errorTitleRequired'));
            return;
        }

        setLoading(true);
        try {
            const newChallenge = {
                title,
                description,
                points: parseInt(points) || 0,
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('create.labelPoints')}</Text>
                            <TextInput
                                style={styles.input}
                                value={points}
                                onChangeText={setPoints}
                                placeholder={t('create.placeholderPoints')}
                                placeholderTextColor={colors.text.tertiary}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helperText}>{t('create.helperPoints')}</Text>
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
});
