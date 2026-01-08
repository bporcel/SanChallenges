import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColors } from '../theme/colors';
import { useLayout } from '../theme/spacing';

interface ProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color,
    height = 6
}) => {
    const colors = useColors();
    const layout = useLayout();
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

    const styles = getStyles(colors, layout);

    return (
        <View style={[styles.container, { height }]}>
            <Animated.View
                style={[
                    styles.fill,
                    {
                        backgroundColor: color || colors.secondary,
                        width: widthInterpolated,
                    },
                ]}
            />
        </View>
    );
};

const getStyles = (colors: any, layout: any) => StyleSheet.create({
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
