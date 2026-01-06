import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { CheckRepository } from '../../data/repositories/CheckRepository';
import { dateService } from '../../data/DateService';

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
                    setMessage('Nadie ha marcado hoy aún');
                } else if (userNames.length === 1) {
                    setMessage(`${userNames[0]} ya marcó hoy`);
                } else if (userNames.length === 2) {
                    setMessage(`${userNames[0]} y ${userNames[1]} ya marcaron hoy`);
                } else {
                    setMessage(`${userNames[0]}, ${userNames[1]} y ${userNames.length - 2} más ya marcaron hoy`);
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
