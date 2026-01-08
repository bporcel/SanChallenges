import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { networkLogger } from '../data/NetworkLogger';
import { getApiUrl, setApiUrl, DEFAULT_API_URL, LOCAL_API_URL, PROD_API_URL, EMULATOR_API_URL } from '../config';
import { dateService } from '../data/DateService';
import { t, setLocale, getCurrentLocale } from '../i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { CheckCelebration } from './components/CheckCelebration';
import { StreakBadge } from './components/StreakBadge';
import { RankingChangeIndicator } from './components/RankingChangeIndicator';
import { SocialContext } from './components/SocialContext';
import { AuraIndicator } from './components/AuraIndicator';
import { AuraService } from '../domain/services/AuraService';
import { AuraState } from '../domain/models/AuraState';
import { useTheme, ThemeType } from './theme/ThemeContext';

export const DebugPanel = () => {
    const { theme, setTheme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState(networkLogger.getLogs());
    const [apiUrl, setApiUrlState] = useState('');
    const [dateOffset, setDateOffset] = useState(dateService.getOffset());
    const [showTestCelebration, setShowTestCelebration] = useState(false);
    const [testStreak, setTestStreak] = useState(5);
    const [testAuraStreak, setTestAuraStreak] = useState(0);

    const clearRankingHistory = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const rankingKeys = keys.filter(k => k.startsWith('previous_rankings_'));
            if (rankingKeys.length > 0) {
                await AsyncStorage.multiRemove(rankingKeys);
                Alert.alert(t('common.success'), t('debug.rankingCleared'));
            } else {
                Alert.alert('Info', t('debug.noRankingHistory'));
            }
        } catch (e) {
            Alert.alert(t('common.error'), t('debug.rankingClearFailed'));
        }
    };

    const handleResetAllData = () => {
        Alert.alert(
            t('debug.resetAllTitle'),
            t('debug.resetAllMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('debug.reset'),
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert(t('common.success'), t('debug.resetAllSuccess'));
                    }
                }
            ]
        );
    };

    useEffect(() => {
        getApiUrl().then(setApiUrlState);
        return networkLogger.subscribe(setLogs);
    }, []);

    const handleSaveUrl = async () => {
        await setApiUrl(apiUrl);
        Alert.alert(t('common.success'), t('debug.apiUpdated'));
    };

    const handleResetUrl = async () => {
        await setApiUrl(null);
        const defaultUrl = DEFAULT_API_URL || '';
        setApiUrlState(defaultUrl);
        Alert.alert(t('common.success'), t('debug.apiReset'));
    };

    const testConnection = async () => {
        try {
            const response = await fetch(`${apiUrl}/health`);
            if (response.ok) {
                const data = await response.json();
                Alert.alert(t('common.success'), t('debug.connected', { status: data.status }));
            } else {
                Alert.alert(t('common.error'), t('debug.serverError', { status: response.status }));
            }
        } catch (e: any) {
            Alert.alert(t('debug.connectionFailed'), t('debug.reachError', { url: apiUrl, error: e.message }));
        }
    };

    const handleSetDateOffset = async (offset: number) => {
        await dateService.setOffset(offset);
        setDateOffset(offset);
        Alert.alert(t('common.success'), t('debug.dateOffsetSet', { offset, date: dateService.getToday() }));
    };

    if (!isVisible) {
        if (!__DEV__) return null;

        return (
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsVisible(true)}
                onLongPress={() => networkLogger.clearLogs()}
            >
                <Text style={styles.buttonText}>{t('debug.button')}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <Modal visible={isVisible} animationType="slide">
            <SafeAreaView style={styles.container}>
                <CheckCelebration
                    visible={showTestCelebration}
                    onComplete={() => setShowTestCelebration(false)}
                />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('debug.panelTitle')}</Text>
                    <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>{t('debug.close')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>UI Theme</Text>
                        <View style={styles.quickButtons}>
                            <TouchableOpacity
                                onPress={() => setTheme('default')}
                                style={[styles.quickButton, theme === 'default' && styles.activeQuickButton]}
                            >
                                <Text style={[styles.quickButtonText, theme === 'default' && styles.activeQuickButtonText]}>
                                    Default Dark
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTheme('minimalist')}
                                style={[styles.quickButton, theme === 'minimalist' && styles.activeQuickButton]}
                            >
                                <Text style={[styles.quickButtonText, theme === 'minimalist' && styles.activeQuickButtonText]}>
                                    Minimalist
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>{t('debug.language')}</Text>
                        <View style={styles.quickButtons}>
                            <TouchableOpacity
                                onPress={() => {
                                    setLocale('en');
                                    Alert.alert(t('common.success'), t('debug.languageChanged'));
                                }}
                                style={[styles.quickButton, getCurrentLocale() === 'en' && styles.activeQuickButton]}
                            >
                                <Text style={[styles.quickButtonText, getCurrentLocale() === 'en' && styles.activeQuickButtonText]}>
                                    {t('debug.english')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setLocale('es');
                                    Alert.alert(t('common.success'), t('debug.languageChanged'));
                                }}
                                style={[styles.quickButton, getCurrentLocale() === 'es' && styles.activeQuickButton]}
                            >
                                <Text style={[styles.quickButtonText, getCurrentLocale() === 'es' && styles.activeQuickButtonText]}>
                                    {t('debug.spanish')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>{t('debug.apiConfig')}</Text>
                        <TextInput
                            style={styles.input}
                            value={apiUrl}
                            onChangeText={setApiUrlState}
                            placeholder={t('debug.apiUrl')}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {Platform.OS === 'android' && apiUrl.includes('localhost') && (
                            <Text style={styles.warningText}>
                                ⚠️ 'localhost' doesn't work on Android. Use '10.0.2.2' for emulator or your local IP for devices.
                            </Text>
                        )}
                        <View style={styles.quickButtons}>
                            <TouchableOpacity
                                onPress={() => setApiUrlState(LOCAL_API_URL)}
                                style={styles.quickButton}
                            >
                                <Text style={styles.quickButtonText}>{t('debug.localIp')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setApiUrlState(EMULATOR_API_URL)}
                                style={styles.quickButton}
                            >
                                <Text style={styles.quickButtonText}>Emulator</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setApiUrlState(PROD_API_URL)}
                                style={styles.quickButton}
                            >
                                <Text style={styles.quickButtonText}>{t('debug.production')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.configButtons}>
                            <TouchableOpacity onPress={testConnection} style={styles.testButton}>
                                <Text style={styles.testButtonText}>{t('debug.testConnection')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveUrl} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>{t('debug.saveRestart')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleResetUrl} style={styles.resetButton}>
                                <Text style={styles.resetButtonText}>{t('debug.reset')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>{t('debug.timeTravel')}</Text>
                        <Text style={styles.infoText}>{t('debug.simulatedDate', { date: dateService.getToday() })}</Text>
                        <View style={styles.dateButtons}>
                            <TouchableOpacity onPress={() => handleSetDateOffset(dateOffset - 1)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>{t('debug.minusDay')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSetDateOffset(0)} style={[styles.dateButton, styles.resetDateButton]}>
                                <Text style={styles.dateButtonText}>{t('debug.today')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSetDateOffset(dateOffset + 1)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>{t('debug.plusDay')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>UX Testing</Text>

                        <View style={styles.debugRow}>
                            <TouchableOpacity
                                onPress={() => setShowTestCelebration(true)}
                                style={styles.testButton}
                            >
                                <Text style={styles.testButtonText}>Celebration 🎉</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleResetAllData()}
                                style={styles.resetButton}
                            >
                                <Text style={styles.resetButtonText}>Reset All Data ⚠️</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>Haptics Test</Text>
                        <View style={styles.quickButtons}>
                            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Light</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Medium</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Success</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>Streak Badges</Text>
                        <View style={styles.debugRow}>
                            <TouchableOpacity onPress={() => setTestStreak(Math.max(0, testStreak - 1))} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>-1</Text>
                            </TouchableOpacity>
                            <StreakBadge streak={testStreak} />
                            <TouchableOpacity onPress={() => setTestStreak(testStreak + 1)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>+1</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>Aura System</Text>
                        <View style={styles.debugRow}>
                            <TouchableOpacity onPress={() => setTestAuraStreak(Math.max(0, testAuraStreak - 1))} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>-1</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTestAuraStreak(Math.max(0, testAuraStreak - 7))} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>-7</Text>
                            </TouchableOpacity>

                            <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
                                <AuraIndicator auraState={AuraService.getAuraState(testAuraStreak)} size="large" showLabel />
                                <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Streak: {testAuraStreak}</Text>
                            </View>

                            <TouchableOpacity onPress={() => setTestAuraStreak(testAuraStreak + 1)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>+1</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTestAuraStreak(testAuraStreak + 7)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>+7</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.quickButtons}>
                            <TouchableOpacity onPress={() => setTestAuraStreak(0)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Reset (Inactive)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTestAuraStreak(3)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Set Stable (3)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTestAuraStreak(14)} style={styles.quickButton}>
                                <Text style={styles.quickButtonText}>Set Legendary (14)</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>Ranking Indicators</Text>
                        <View style={styles.debugRow}>
                            <RankingChangeIndicator previousRank={5} currentRank={3} />
                            <RankingChangeIndicator previousRank={2} currentRank={4} />
                            <RankingChangeIndicator previousRank={3} currentRank={3} />
                        </View>

                        <Text style={styles.subSectionTitle}>Social Context</Text>
                        <View style={styles.debugRow}>
                            <SocialContext challengeId="test" currentUserId="test" totalParticipants={5} />
                        </View>

                        <TouchableOpacity onPress={clearRankingHistory} style={[styles.resetButton, { marginTop: 10, alignSelf: 'flex-start' }]}>
                            <Text style={styles.resetButtonText}>Clear Ranking History</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logsHeader}>
                        <Text style={styles.sectionTitle}>{t('debug.networkLogs')}</Text>
                        <TouchableOpacity onPress={() => networkLogger.clearLogs()}>
                            <Text style={styles.clearButtonText}>{t('debug.clearLogs')}</Text>
                        </TouchableOpacity>
                    </View>

                    {logs.length === 0 ? (
                        <Text style={styles.emptyText}>{t('debug.noLogs')}</Text>
                    ) : (
                        logs.map((log) => (
                            <View key={log.id} style={[styles.logItem, log.error || (log.status && log.status >= 400) ? styles.logError : null]}>
                                <View style={styles.logHeader}>
                                    <Text style={styles.method}>{log.method}</Text>
                                    <Text style={styles.status}>{log.status || t('debug.pending')}</Text>
                                    <Text style={styles.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                                </View>
                                <Text style={styles.url}>{log.url}</Text>
                                {log.requestBody && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.bodyLabel}>{t('debug.request')}</Text>
                                        <Text style={styles.bodyText}>{JSON.stringify(log.requestBody, null, 2)}</Text>
                                    </View>
                                )}
                                {log.responseBody && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.bodyLabel}>{t('debug.response')}</Text>
                                        <Text style={styles.bodyText}>{JSON.stringify(log.responseBody, null, 2)}</Text>
                                    </View>
                                )}
                                {log.error && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.errorLabel}>{t('debug.errorLabel')}</Text>
                                        <Text style={styles.errorText}>{log.error}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 9999,
    },
    buttonText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: '#007aff',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    configSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#333',
        marginBottom: 12,
    },
    dateButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateButton: {
        backgroundColor: '#e5e5ea',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    resetDateButton: {
        backgroundColor: '#ff9500',
    },
    dateButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        fontSize: 14,
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    quickButtons: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    quickButton: {
        backgroundColor: '#f2f2f7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#d1d1d6',
    },
    quickButtonText: {
        fontSize: 11,
        color: '#007aff',
        fontWeight: '600',
    },
    activeQuickButton: {
        backgroundColor: '#007aff',
        borderColor: '#007aff',
    },
    activeQuickButtonText: {
        color: '#fff',
    },
    configButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    saveButton: {
        backgroundColor: '#007aff',
        padding: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    testButton: {
        backgroundColor: '#34c759',
        padding: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    resetButton: {
        backgroundColor: '#8e8e93',
        padding: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    logsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    clearButtonText: {
        color: '#ff3b30',
        fontSize: 12,
    },
    logList: {
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 32,
        color: '#888',
    },
    logItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logError: {
        backgroundColor: '#fff1f0',
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    method: {
        fontWeight: 'bold',
        marginRight: 8,
        fontSize: 12,
    },
    status: {
        fontWeight: 'bold',
        marginRight: 8,
        fontSize: 12,
    },
    timestamp: {
        color: '#888',
        fontSize: 10,
        flex: 1,
        textAlign: 'right',
    },
    url: {
        fontSize: 12,
        color: '#333',
        marginBottom: 8,
    },
    bodyContainer: {
        marginTop: 4,
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    bodyLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    bodyText: {
        fontSize: 10,
        fontFamily: 'monospace',
    },
    errorLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ff3b30',
        marginBottom: 2,
    },
    errorText: {
        fontSize: 10,
        color: '#ff3b30',
        fontFamily: 'monospace',
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        marginTop: 12,
        marginBottom: 4,
    },
    debugRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: 4,
    },
    warningText: {
        color: '#ff9500',
        fontSize: 10,
        marginBottom: 8,
        fontWeight: '600',
    },
});
