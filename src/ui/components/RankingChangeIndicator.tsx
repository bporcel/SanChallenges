import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface RankingChangeIndicatorProps {
    previousRank: number | null;
    currentRank: number;
}

export const RankingChangeIndicator: React.FC<RankingChangeIndicatorProps> = ({
    previousRank,
    currentRank,
}) => {
    const colors = useColors();
    // If no previous rank is provided, we can't show a tendency, but we should show something
    // to be "robust". Let's default to neutral if missing.
    const prev = previousRank ?? currentRank;
    const change = prev - currentRank;

    if (change === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.surface + '80', borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.text, { color: colors.text.tertiary, fontSize: 8 }]}>●</Text>
            </View>
        );
    }

    const isImprovement = change > 0;
    const icon = isImprovement ? '↑' : '↓';
    const color = isImprovement ? colors.status.success : colors.status.error;

    return (
        <View style={[styles.container, { backgroundColor: color + '20', borderWidth: 1, borderColor: color + '40' }]}>
            <Text style={[styles.icon, { color }]}>{icon}</Text>
            <Text style={[styles.text, { color }]}>{Math.abs(change)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        gap: 1,
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
