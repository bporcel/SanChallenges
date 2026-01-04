import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from './Button';
import { t } from '../../i18n/i18n';

interface EditNameModalProps {
    visible: boolean;
    currentName: string;
    onSave: (newName: string) => void;
    onCancel: () => void;
}

export function EditNameModal({ visible, currentName, onSave, onCancel }: EditNameModalProps) {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        if (visible) {
            setName(currentName);
        }
    }, [visible, currentName]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.overlay} onPress={onCancel}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredView}
                >
                    <Pressable style={styles.modalView} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>{t('editName.title')}</Text>
                            <Text style={styles.modalSubtitle}>{t('editName.subtitle')}</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('editName.label')}</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder={t('editName.placeholder')}
                                placeholderTextColor={colors.text.tertiary}
                                autoFocus={true}
                                maxLength={20}
                                selectionColor={colors.primary}
                            />
                            <Text style={styles.helperText}>{t('editName.helper', { count: name.length })}</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={t('common.cancel')}
                                variant="ghost"
                                onPress={onCancel}
                                style={styles.flexButton}
                            />
                            <Button
                                title={t('common.save')}
                                variant="primary"
                                onPress={handleSave}
                                disabled={!name.trim() || name === currentName}
                                style={styles.flexButton}
                            />
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Slate 900 with high opacity
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.m,
    },
    modalView: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.l,
        padding: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: spacing.l,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        ...typography.bodySmall,
        color: colors.text.secondary,
    },
    inputContainer: {
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius.m,
        padding: spacing.m,
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '500',
    },
    helperText: {
        ...typography.caption,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
        textAlign: 'right',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    flexButton: {
        flex: 1,
    },
});
