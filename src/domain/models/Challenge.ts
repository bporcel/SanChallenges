export interface Challenge {
    id: string;
    title: string;
    description?: string;
    points: number;
    duration: number;
    inviteCode: string;
    createdAt: number; // Timestamp
    isPrivate?: boolean;
    isLongTerm?: boolean;
    creatorId?: string;
    creatorName?: string;
    participantCount?: number; // Provided by server
    completedAt?: number; // Timestamp when user completed (for long-term challenges)
}
