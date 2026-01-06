import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { typography } from '../theme/typography';

interface AuraBadgeProps {
    value: number;
    label: string;
}

export const AuraBadge: React.FC<AuraBadgeProps> = ({ value, label }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        // Pulsing animation for the badge and glow
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 0.8,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.4,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, [pulseAnim, glowAnim]);

    return (
        <View style={styles.container}>
            {/* Outer Glow Layers */}
            <Animated.View
                style={[
                    styles.glow,
                    styles.glowOuter,
                    {
                        opacity: Animated.multiply(glowAnim, 0.2),
                        transform: [{ scale: Animated.multiply(pulseAnim, 1.3) }],
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.glow,
                    styles.glowInner,
                    {
                        opacity: Animated.multiply(glowAnim, 0.4),
                        transform: [{ scale: Animated.multiply(pulseAnim, 1.15) }],
                    },
                ]}
            />

            {/* Main Badge */}
            <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.label}>{label}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        paddingHorizontal: spacing.m,
    },
    glow: {
        position: 'absolute',
        backgroundColor: colors.aura.godly,
        borderRadius: layout.borderRadius.round,
    },
    glowOuter: {
        width: '110%',
        height: '130%',
    },
    glowInner: {
        width: '105%',
        height: '115%',
    },
    badge: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: layout.borderRadius.round,
        flexDirection: 'row',
        alignItems: 'baseline',
        borderWidth: 1,
        borderColor: colors.aura.godly,
        zIndex: 1,
        // Subtle inner shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: colors.aura.godly,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 5,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    value: {
        ...typography.h3,
        color: colors.aura.godly,
        fontWeight: 'bold',
    },
    label: {
        ...typography.caption,
        color: colors.aura.godly,
        marginLeft: 2,
        fontWeight: '600',
        textTransform: 'lowercase',
    },
});
