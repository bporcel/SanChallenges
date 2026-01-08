import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useTheme, ThemeType } from '../theme/ThemeContext';
import { useColors } from '../theme/colors';
import { useLayout, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n/i18n';

interface ThemeSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
    const { theme, setTheme } = useTheme();
    const colors = useColors();
    const layout = useLayout();
    const styles = getStyles(colors, layout);

    const themes: { id: ThemeType; label: string; icon: string; description: string }[] = [
        {
            id: 'default',
            label: t('theme.default'),
            icon: 'moon',
            description: t('theme.defaultDesc')
        },
        {
            id: 'minimalist',
            label: t('theme.minimalist'),
            icon: 'leaf',
            description: t('theme.minimalistDesc')
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('theme.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.list}>
                        {themes.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.themeOption,
                                    theme === item.id && styles.activeOption
                                ]}
                                onPress={() => {
                                    setTheme(item.id);
                                    // Optionally close on select, but maybe keep open to see effect
                                }}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    theme === item.id && styles.activeIconContainer
                                ]}>
                                    <Ionicons
                                        name={item.icon as any}
                                        size={24}
                                        color={theme === item.id ? colors.primary : colors.text.tertiary}
                                    />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={[
                                        styles.optionLabel,
                                        theme === item.id && styles.activeOptionLabel
                                    ]}>
                                        {item.label}
                                    </Text>
                                    <Text style={styles.optionDesc}>{item.description}</Text>
                                </View>
                                {theme === item.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const getStyles = (colors: any, layout: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    content: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.xl,
        padding: spacing.l,
        maxHeight: '80%',
        ...layout.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    title: {
        ...typography.h2,
        color: colors.text.primary,
    },
    closeButton: {
        padding: spacing.s,
    },
    list: {
        marginBottom: spacing.m,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderRadius: layout.borderRadius.l,
        marginBottom: spacing.s,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeOption: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: layout.borderRadius.m,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    activeIconContainer: {
        backgroundColor: colors.primary + '20',
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    activeOptionLabel: {
        color: colors.primary,
    },
    optionDesc: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
});
