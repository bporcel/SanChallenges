export interface Challenge {
    id: string;
    title: string;
    description?: string;
    points: number;
    inviteCode: string;
    createdAt: number; // Timestamp
}
