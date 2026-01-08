import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useColors } from '../theme/colors';
import { spacing, useLayout } from '../theme/spacing';
import { typography } from '../theme/typography';
import { t } from '../../i18n/i18n';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    visible,
    message = t('common.loadingMessage')
}) => {
    const colors = useColors();
    const layout = useLayout();
    const styles = getStyles(colors, layout);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.message}>{message}</Text>
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (colors: any, layout: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: layout.borderRadius.l,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    message: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.m,
        lineHeight: 20,
    },
});
