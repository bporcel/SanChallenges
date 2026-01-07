import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckRepository } from '../../data/repositories/CheckRepository';

interface SocialDataContextType {
    checkInsData: Record<string, any>;
    loadCheckInsForChallenges: (challengeIds: string[]) => Promise<void>;
}

const SocialDataContext = createContext<SocialDataContextType | undefined>(undefined);

export const SocialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [checkInsData, setCheckInsData] = useState<Record<string, any>>({});

    const loadCheckInsForChallenges = React.useCallback(async (challengeIds: string[]) => {
        if (challengeIds.length === 0) return;

        try {
            const data = await CheckRepository.getTodayCheckInsBulk(challengeIds);
            setCheckInsData(data);
        } catch (error) {
            console.error('Error loading bulk check-ins:', error);
        }
    }, []);

    return (
        <SocialDataContext.Provider value={{ checkInsData, loadCheckInsForChallenges }}>
            {children}
        </SocialDataContext.Provider>
    );
};

export const useSocialData = () => {
    const context = useContext(SocialDataContext);
    if (context === undefined) {
        throw new Error('useSocialData must be used within a SocialDataProvider');
    }
    return context;
};
