import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { CheckRepository } from '../../data/repositories/CheckRepository';
import { dateService } from '../../data/DateService';
import { t } from '../../i18n/i18n';

interface SocialContextProps {
    challengeId: string;
    currentUserId: string;
    totalParticipants: number;
}

export const SocialContext: React.FC<SocialContextProps> = ({
    challengeId,
    currentUserId,
    totalParticipants,
}) => {
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const loadContext = async () => {
            try {
                // Fetch today's check-ins from the server
                const userNames = await CheckRepository.getTodayCheckIns(challengeId);

                // Determine the message based on user names
                if (userNames.length === 0) {
                    setMessage(t('social.none'));
                } else if (userNames.length === 1) {
                    setMessage(t('social.one', { name: userNames[0] }));
                } else if (userNames.length === 2) {
                    setMessage(t('social.two', { name1: userNames[0], name2: userNames[1] }));
                } else {
                    setMessage(t('social.many', { name1: userNames[0], name2: userNames[1], count: userNames.length - 2 }));
                }
            } catch (error) {
                console.error('Error loading social context:', error);
            }
        };

        loadContext();
    }, [challengeId, currentUserId]);

    if (!message) return null;

    return <Text style={styles.text}>{message}</Text>;
};

const styles = StyleSheet.create({
    text: {
        ...typography.caption,
        color: colors.text.tertiary,
        fontSize: 10,
        fontStyle: 'italic',
    },
});
