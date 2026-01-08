import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AuraState } from '../../domain/models/AuraState';
import { AuraService } from '../../domain/services/AuraService';
import { useColors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface AuraIndicatorProps {
    auraState: AuraState;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

export const AuraIndicator: React.FC<AuraIndicatorProps> = ({
    auraState,
    size = 'small',
    showLabel = false
}) => {
    const colors = useColors();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (auraState === 'legendary') {
            // Pulse animation for legendary
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
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

            // Glow animation for legendary
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        } else {
            // Reset animations if not legendary
            pulseAnim.setValue(1);
            glowAnim.setValue(0);
        }
    }, [auraState, pulseAnim, glowAnim]);

    const auraColor = AuraService.getAuraColor(auraState);
    const glowIntensity = AuraService.getAuraGlow(auraState);

    // Size dimensions
    const sizeMap = {
        small: 12,
        medium: 16,
        large: 20
    };
    const badgeSize = sizeMap[size];

    // Animated glow color for legendary (transitions between purple and gold)
    const animatedGlowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.aura.legendary, colors.aura.legendaryGlow]
    });

    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            {glowIntensity > 0 && (
                <View
                    style={[
                        styles.glow,
                        {
                            width: badgeSize * 2.5,
                            height: badgeSize * 2.5,
                            borderRadius: badgeSize * 1.25,
                            backgroundColor: auraState === 'legendary' ? 'transparent' : auraColor,
                            opacity: glowIntensity * 0.3,
                        }
                    ]}
                >
                    {auraState === 'legendary' && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: badgeSize * 1.25,
                                backgroundColor: animatedGlowColor,
                                opacity: 0.4,
                            }}
                        />
                    )}
                </View>
            )}
            <Animated.View
                style={[
                    styles.badge,
                    {
                        width: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                        backgroundColor: auraColor,
                    },
                    auraState === 'legendary' && { transform: [{ scale: pulseAnim }] }
                ]}
            />
            {showLabel && (
                <Text style={styles.label}>{AuraService.getAuraLabel(auraState)}</Text>
            )}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
    },
    badge: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        marginTop: spacing.xs,
        fontSize: 10,
        color: colors.text.secondary,
        fontWeight: '600',
    },
});
