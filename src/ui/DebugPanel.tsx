import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { networkLogger } from '../data/NetworkLogger';
import { getApiUrl, setApiUrl, DEFAULT_API_URL } from '../config';
import { dateService } from '../data/DateService';

export const DebugPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState(networkLogger.getLogs());
    const [apiUrl, setApiUrlState] = useState('');
    const [dateOffset, setDateOffset] = useState(dateService.getOffset());

    useEffect(() => {
        getApiUrl().then(setApiUrlState);
        return networkLogger.subscribe(setLogs);
    }, []);

    const handleSaveUrl = async () => {
        await setApiUrl(apiUrl);
        Alert.alert('Success', 'API URL updated. Please restart the app for changes to take full effect.');
    };

    const handleResetUrl = async () => {
        await setApiUrl(null);
        const defaultUrl = DEFAULT_API_URL || '';
        setApiUrlState(defaultUrl);
        Alert.alert('Success', 'API URL reset to default. Please restart the app.');
    };

    const testConnection = async () => {
        try {
            const response = await fetch(`${apiUrl}/health`);
            if (response.ok) {
                const data = await response.json();
                Alert.alert('Success', `Connected to server! Status: ${data.status}`);
            } else {
                Alert.alert('Error', `Server returned status ${response.status}`);
            }
        } catch (e: any) {
            Alert.alert('Connection Failed', `Could not reach ${apiUrl}. Error: ${e.message}`);
        }
    };

    const handleSetDateOffset = async (offset: number) => {
        await dateService.setOffset(offset);
        setDateOffset(offset);
        Alert.alert('Success', `Date offset set to ${offset} days. App is now in ${dateService.getToday()}.`);
    };

    if (!isVisible) {
        return (
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsVisible(true)}
                onLongPress={() => networkLogger.clearLogs()}
            >
                <Text style={styles.buttonText}>DEBUG</Text>
            </TouchableOpacity>
        );
    }

    return (
        <Modal visible={isVisible} animationType="slide">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Debug Panel</Text>
                    <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>API Configuration</Text>
                        <TextInput
                            style={styles.input}
                            value={apiUrl}
                            onChangeText={setApiUrlState}
                            placeholder="API URL"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.configButtons}>
                            <TouchableOpacity onPress={testConnection} style={styles.testButton}>
                                <Text style={styles.testButtonText}>Test Connection</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveUrl} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Save & Restart</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleResetUrl} style={styles.resetButton}>
                                <Text style={styles.resetButtonText}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={styles.sectionTitle}>Time Travel (Day Simulation)</Text>
                        <Text style={styles.infoText}>Current simulated date: {dateService.getToday()}</Text>
                        <View style={styles.dateButtons}>
                            <TouchableOpacity onPress={() => handleSetDateOffset(dateOffset - 1)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>-1 Day</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSetDateOffset(0)} style={[styles.dateButton, styles.resetDateButton]}>
                                <Text style={styles.dateButtonText}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSetDateOffset(dateOffset + 1)} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>+1 Day</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.logsHeader}>
                        <Text style={styles.sectionTitle}>Network Logs</Text>
                        <TouchableOpacity onPress={() => networkLogger.clearLogs()}>
                            <Text style={styles.clearButtonText}>Clear Logs</Text>
                        </TouchableOpacity>
                    </View>

                    {logs.length === 0 ? (
                        <Text style={styles.emptyText}>No logs yet</Text>
                    ) : (
                        logs.map((log) => (
                            <View key={log.id} style={[styles.logItem, log.error || (log.status && log.status >= 400) ? styles.logError : null]}>
                                <View style={styles.logHeader}>
                                    <Text style={styles.method}>{log.method}</Text>
                                    <Text style={styles.status}>{log.status || 'PENDING'}</Text>
                                    <Text style={styles.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                                </View>
                                <Text style={styles.url}>{log.url}</Text>
                                {log.requestBody && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.bodyLabel}>Request:</Text>
                                        <Text style={styles.bodyText}>{JSON.stringify(log.requestBody, null, 2)}</Text>
                                    </View>
                                )}
                                {log.responseBody && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.bodyLabel}>Response:</Text>
                                        <Text style={styles.bodyText}>{JSON.stringify(log.responseBody, null, 2)}</Text>
                                    </View>
                                )}
                                {log.error && (
                                    <View style={styles.bodyContainer}>
                                        <Text style={styles.errorLabel}>Error:</Text>
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
});
