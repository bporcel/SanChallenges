import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { layout, spacing } from '../theme/spacing';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'outlined' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    onPress,
    variant = 'elevated'
}) => {
    const cardStyles = [
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                style={cardStyles}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyles}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    elevated: {
        ...layout.shadows.small,
    },
    outlined: {
        borderWidth: 1,
        borderColor: colors.border,
    }
});
