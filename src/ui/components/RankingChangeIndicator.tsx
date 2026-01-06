import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface RankingChangeIndicatorProps {
    previousRank: number | null;
    currentRank: number;
}

export const RankingChangeIndicator: React.FC<RankingChangeIndicatorProps> = ({
    previousRank,
    currentRank,
}) => {
    if (previousRank === null) return null;

    const change = previousRank - currentRank;

    if (change === 0) {
        return (
            <View style={styles.container}>
                <Text style={[styles.text, { color: colors.text.tertiary }]}>—</Text>
            </View>
        );
    }

    const isImprovement = change > 0;
    const icon = isImprovement ? '↑' : '↓';
    const color = isImprovement ? colors.status.success : colors.status.error;

    return (
        <View style={[styles.container, { backgroundColor: color + '20' }]}>
            <Text style={[styles.icon, { color }]}>{icon}</Text>
            <Text style={[styles.text, { color }]}>{Math.abs(change)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    icon: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    text: {
        ...typography.caption,
        fontSize: 10,
        fontWeight: 'bold',
    },
});
