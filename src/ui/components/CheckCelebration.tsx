import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface CheckCelebrationProps {
    visible: boolean;
    onComplete?: () => void;
}

export const CheckCelebration: React.FC<CheckCelebrationProps> = ({ visible, onComplete }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const confettiAnims = useRef(
        Array.from({ length: 8 }, () => ({
            translateY: new Animated.Value(0),
            translateX: new Animated.Value(0),
            opacity: new Animated.Value(0),
            rotate: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        if (visible) {
            // Checkmark animation
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Confetti burst animation
            confettiAnims.forEach((anim, index) => {
                const angle = (index / confettiAnims.length) * Math.PI * 2;
                const distance = 60;

                Animated.parallel([
                    Animated.timing(anim.translateX, {
                        toValue: Math.cos(angle) * distance,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.translateY, {
                        toValue: Math.sin(angle) * distance,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(anim.opacity, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.opacity, {
                            toValue: 0,
                            duration: 500,
                            delay: 100,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.timing(anim.rotate, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start();
            });

            // Fade out checkmark
            setTimeout(() => {
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    // Reset animations
                    scaleAnim.setValue(0);
                    opacityAnim.setValue(0);
                    confettiAnims.forEach(anim => {
                        anim.translateX.setValue(0);
                        anim.translateY.setValue(0);
                        anim.opacity.setValue(0);
                        anim.rotate.setValue(0);
                    });
                    onComplete?.();
                });
            }, 600);
        }
    }, [visible, scaleAnim, opacityAnim, confettiAnims, onComplete]);

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Confetti particles */}
            {confettiAnims.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.confetti,
                        {
                            backgroundColor: [
                                colors.primary,
                                colors.secondary,
                                colors.accent,
                                colors.rank.gold,
                            ][index % 4],
                            transform: [
                                { translateX: anim.translateX },
                                { translateY: anim.translateY },
                                {
                                    rotate: anim.rotate.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    }),
                                },
                            ],
                            opacity: anim.opacity,
                        },
                    ]}
                />
            ))}

            {/* Center checkmark */}
            <Animated.View
                style={[
                    styles.checkmark,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                <View style={styles.checkmarkCircle}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    confetti: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    checkmark: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.status.success,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.status.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    checkmarkIcon: {
        fontSize: 32,
        color: colors.text.inverse,
        fontWeight: 'bold',
    },
});
