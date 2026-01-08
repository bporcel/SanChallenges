import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useColors } from '../theme/colors';
import { useLayout, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { AuraState } from '../../domain/models/AuraState';
import { AuraService } from '../../domain/services/AuraService';
import { AuraIndicator } from './AuraIndicator';

interface AuraBadgeProps {
    value: number;
    label: string;
    auraState?: AuraState;
}

export const AuraBadge: React.FC<AuraBadgeProps> = ({ value, label, auraState = 'inactive' }) => {
    const colors = useColors();
    const layout = useLayout();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    const auraColor = AuraService.getAuraColor(auraState);
    const glowIntensity = AuraService.getAuraGlow(auraState);

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

    const styles = getStyles(colors, layout);

    return (
        <View style={styles.container}>
            {/* Outer Glow Layers */}
            {glowIntensity > 0 && (
                <>
                    <Animated.View
                        style={[
                            styles.glow,
                            styles.glowOuter,
                            {
                                backgroundColor: auraColor,
                                opacity: Animated.multiply(glowAnim, 0.1 * glowIntensity),
                                transform: [{ scale: Animated.multiply(pulseAnim, 1.3) }],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.glow,
                            styles.glowInner,
                            {
                                backgroundColor: auraColor,
                                opacity: Animated.multiply(glowAnim, 0.2 * glowIntensity),
                                transform: [{ scale: Animated.multiply(pulseAnim, 1.15) }],
                            },
                        ]}
                    />
                </>
            )}

            {/* Main Badge */}
            <Animated.View style={[
                styles.badge,
                {
                    borderColor: auraColor,
                    transform: [{ scale: pulseAnim }]
                }
            ]}>
                <AuraIndicator auraState={auraState} size="small" />
                <View style={styles.textContainer}>
                    <Text style={[styles.value, { color: auraColor }]}>{value}</Text>
                    <Text style={[styles.label, { color: auraColor }]}>{label}</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const getStyles = (colors: any, layout: any) => StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        paddingHorizontal: spacing.m,
    },
    glow: {
        position: 'absolute',
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
        paddingLeft: spacing.s,
        paddingRight: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: layout.borderRadius.round,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        zIndex: 1,
        gap: spacing.xs,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    label: {
        ...typography.caption,
        marginLeft: 2,
        fontWeight: '600',
        textTransform: 'lowercase',
    },
});
