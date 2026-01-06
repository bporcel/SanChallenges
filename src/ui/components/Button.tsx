import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { layout, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle
}) => {
    const getBackgroundColor = () => {
        if (disabled) return colors.text.tertiary;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'danger': return colors.status.error;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.surface;
        switch (variant) {
            case 'primary': return colors.text.inverse;
            case 'secondary': return colors.text.inverse;
            case 'danger': return colors.text.inverse;
            case 'outline': return colors.primary;
            case 'ghost': return colors.text.secondary;
            default: return colors.text.inverse;
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'small': return { paddingVertical: spacing.xs, paddingHorizontal: spacing.s };
            case 'large': return { paddingVertical: spacing.m, paddingHorizontal: spacing.l };
            default: return { paddingVertical: spacing.s + 4, paddingHorizontal: spacing.m };
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && { borderWidth: 1, borderColor: disabled ? colors.text.tertiary : colors.primary },
                getPadding(),
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <Text style={[
                    styles.text,
                    { color: getTextColor() },
                    size === 'small' && { fontSize: 12 },
                    size === 'large' && { fontSize: 18 },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: layout.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        ...typography.button,
        fontWeight: '600',
    }
});
