export interface Challenge {
    id: string;
    title: string;
    description?: string;
    points: number;
    duration: number;
    inviteCode: string;
    createdAt: number; // Timestamp
    isPrivate?: boolean;
    creatorId?: string;
    creatorName?: string;
}
