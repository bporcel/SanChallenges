import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { t } from '../../i18n/i18n';

interface StreakBadgeProps {
    streak: number;
    isBroken?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, isBroken = false }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (streak > 0 && !isBroken) {
            // Pulse animation for active streaks
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [streak, isBroken, pulseAnim]);

    const getStreakStyle = () => {
        if (isBroken || streak === 0) {
            return {
                backgroundColor: colors.streak.broken,
                icon: '💔',
                color: colors.text.tertiary,
            };
        }

        if (streak >= 14) {
            return {
                backgroundColor: colors.streak.fire,
                icon: '🔥',
                color: colors.text.inverse,
            };
        }

        if (streak >= 7) {
            return {
                backgroundColor: colors.streak.hot,
                icon: '🔥',
                color: colors.text.inverse,
            };
        }

        if (streak >= 3) {
            return {
                backgroundColor: colors.streak.warming,
                icon: '⚡',
                color: colors.background,
            };
        }

        return {
            backgroundColor: colors.streak.cold,
            icon: '🌱',
            color: colors.text.primary,
        };
    };

    const style = getStreakStyle();

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: style.backgroundColor },
                !isBroken && streak > 0 && { transform: [{ scale: pulseAnim }] },
            ]}
        >
            <Text style={styles.icon}>{style.icon}</Text>
            <Text style={[styles.text, { color: style.color }]}>
                {isBroken ? t('streak.broken') : t('streak.days', { count: streak })}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        gap: 4,
    },
    icon: {
        fontSize: 14,
    },
    text: {
        ...typography.caption,
        fontWeight: 'bold',
        fontSize: 11,
    },
});
