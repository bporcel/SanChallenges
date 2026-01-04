import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { layout } from '../theme/spacing';

interface ProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color = colors.secondary,
    height = 6
}) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: Math.max(0, Math.min(1, progress)),
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const widthInterpolated = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, { height }]}>
            <Animated.View
                style={[
                    styles.fill,
                    {
                        backgroundColor: color,
                        width: widthInterpolated,
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: colors.border,
        borderRadius: layout.borderRadius.round,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: layout.borderRadius.round,
    },
});
