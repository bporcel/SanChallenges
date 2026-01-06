import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { t } from '../../i18n/i18n';

interface GoalProgressProps {
    currentDay: number;
    totalDays: number;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ currentDay, totalDays }) => {
    const progress = Math.min(currentDay / totalDays, 1);

    // Color coding based on progress
    const getProgressColor = () => {
        if (progress >= 0.8) return colors.status.success;
        if (progress >= 0.5) return colors.status.warning;
        return colors.status.error;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{t('common.day', { current: currentDay, total: totalDays })}</Text>
                <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
            </View>
            <ProgressBar progress={progress} color={getProgressColor()} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        ...typography.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    percentage: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontSize: 10,
    },
});
