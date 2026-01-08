import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'debug_date_offset';

class DateService {
    private static instance: DateService;
    private offsetDays: number = 0;

    private constructor() {
        this.loadOffset();
    }

    public static getInstance(): DateService {
        if (!DateService.instance) {
            DateService.instance = new DateService();
        }
        return DateService.instance;
    }

    private async loadOffset() {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.offsetDays = parseInt(saved, 10);
            }
        } catch (e) {
            // Ignore errors during static export
            console.log('DateService: Could not load offset (expected during build)');
        }
    }

    private listeners: (() => void)[] = [];

    public async setOffset(days: number) {
        this.offsetDays = days;
        await AsyncStorage.setItem(STORAGE_KEY, days.toString());
        this.notifyListeners();
    }

    public getToday(): string {
        const date = new Date();
        if (this.offsetDays !== 0) {
            date.setDate(date.getDate() + this.offsetDays);
        }
        return date.toISOString().split('T')[0];
    }

    public getOffset(): number {
        return this.offsetDays;
    }

    public async reset() {
        this.offsetDays = 0;
        await AsyncStorage.removeItem(STORAGE_KEY);
        this.notifyListeners();
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }
}

export const dateService = DateService.getInstance();
