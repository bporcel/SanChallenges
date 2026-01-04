import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
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

export default function JoinChallengeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!inviteCode) {
            Alert.alert(t('common.error'), t('join.errorCodeRequired'));
            return;
        }

        setLoading(true);
        try {
            await ChallengeRepository.join(inviteCode.toUpperCase());
            router.back();
        } catch (e) {
            Alert.alert(t('common.error'), t('join.errorFailed'));
        } finally {
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
                            <Text style={styles.headerTitle}>{t('join.title')}</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <Text style={styles.headerSubtitle}>{t('join.subtitle')}</Text>
                    </View>

                    <Card style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('join.labelCode')}</Text>
                            <TextInput
                                style={styles.input}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                placeholder={t('join.placeholderCode')}
                                placeholderTextColor={colors.text.tertiary}
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                            <Text style={styles.helperText}>{t('join.helperCode')}</Text>
                        </View>

                        <View style={styles.buttonGroup}>
                            <Button
                                title={loading ? t('join.joining') : t('join.joinButton')}
                                onPress={handleJoin}
                                disabled={loading}
                                size="large"
                                style={styles.joinButton}
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
        fontSize: 18,
        color: colors.text.primary,
        textAlign: 'center',
        letterSpacing: 2,
        fontWeight: 'bold',
    },
    helperText: {
        ...typography.caption,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    buttonGroup: {
        marginTop: spacing.s,
    },
    joinButton: {
        marginBottom: spacing.m,
    },
});
