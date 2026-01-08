import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useSocialData } from './SocialDataContext';
import { t } from '../../i18n/i18n';

interface SocialContextProps {
    challengeId: string;
    currentUserId: string;
    totalParticipants: number;
    isLongTerm?: boolean;
}

export const SocialContext: React.FC<SocialContextProps> = ({
    challengeId,
    isLongTerm,
}) => {
    const colors = useColors();
    const [message, setMessage] = useState<string>('');
    const { checkInsData } = useSocialData();

    useEffect(() => {
        try {
            // Use prefetched data from context
            const data = checkInsData[challengeId] || {};
            const userNames = data.userNames || [];
            const completedUserNames = data.completedUserNames || [];

            // Prioritize showing completions today
            if (completedUserNames.length > 0) {
                if (completedUserNames.length === 1) {
                    setMessage(t('social.completed_one', { name: completedUserNames[0] }));
                } else if (completedUserNames.length === 2) {
                    setMessage(t('social.completed_two', { name1: completedUserNames[0], name2: completedUserNames[1] }));
                } else {
                    setMessage(t('social.completed_many', { name1: completedUserNames[0], name2: completedUserNames[1], count: completedUserNames.length - 2 }));
                }
                return;
            }

            const prefix = isLongTerm ? 'social.nudge_' : 'social.';

            // Determine the message based on user names
            if (userNames.length === 0) {
                setMessage(t(`${prefix}none`));
            } else if (userNames.length === 1) {
                setMessage(t(`${prefix}one`, { name: userNames[0] }));
            } else if (userNames.length === 2) {
                setMessage(t(`${prefix}two`, { name1: userNames[0], name2: userNames[1] }));
            } else {
                setMessage(t(`${prefix}many`, { name1: userNames[0], name2: userNames[1], count: userNames.length - 2 }));
            }
        } catch (error) {
            console.error('Error loading social context:', error);
        }
    }, [challengeId, checkInsData, isLongTerm]);

    if (!message) return null;

    const styles = getStyles(colors);

    return <Text style={styles.text}>{message}</Text>;
};

const getStyles = (colors: any) => StyleSheet.create({
    text: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontSize: 10,
        fontStyle: 'italic',
    },
});
