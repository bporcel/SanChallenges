import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { t } from '../../i18n/i18n';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleClearData = async () => {
        try {
            await AsyncStorage.clear();
            this.handleRetry();
        } catch (e) {
            console.error('Failed to clear data:', e);
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.emoji}>😵</Text>
                        <Text style={styles.title}>{t('error.boundary.title')}</Text>
                        <Text style={styles.message}>{t('error.boundary.message')}</Text>

                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={this.handleRetry}
                            >
                                <Text style={styles.retryButtonText}>
                                    {t('error.boundary.retry')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={this.handleClearData}
                            >
                                <Text style={styles.clearButtonText}>
                                    {t('error.boundary.clearData')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.l,
    },
    title: {
        ...typography.h1,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.m,
    },
    message: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    errorDetails: {
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 8,
        marginTop: spacing.l,
        width: '100%',
    },
    errorTitle: {
        ...typography.h3,
        color: colors.status.error,
        marginBottom: spacing.s,
    },
    errorText: {
        ...typography.caption,
        color: colors.text.primary,
        fontFamily: 'monospace',
        marginBottom: spacing.s,
    },
    errorStack: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontFamily: 'monospace',
        fontSize: 10,
    },
    actions: {
        width: '100%',
        gap: spacing.m,
    },
    retryButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 8,
        alignItems: 'center',
    },
    retryButtonText: {
        ...typography.body,
        color: colors.text.inverse,
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: colors.status.error,
        padding: spacing.m,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        ...typography.body,
        color: colors.text.inverse,
        fontWeight: 'bold',
    },
});
