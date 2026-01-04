type NetworkLog = {
    id: string;
    url: string;
    method: string;
    requestBody?: any;
    responseBody?: any;
    status?: number;
    timestamp: number;
    error?: string;
};

class NetworkLogger {
    private static instance: NetworkLogger;
    private logs: NetworkLog[] = [];
    private listeners: ((logs: NetworkLog[]) => void)[] = [];

    private constructor() {
        this.setupInterceptor();
    }

    public static getInstance(): NetworkLogger {
        if (!NetworkLogger.instance) {
            NetworkLogger.instance = new NetworkLogger();
        }
        return NetworkLogger.instance;
    }

    private setupInterceptor() {
        const originalFetch = global.fetch;
        global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const id = Math.random().toString(36).substring(7);
            const url = typeof input === 'string' ? input : (input as Request).url;
            const method = init?.method || 'GET';

            let requestBody;
            try {
                if (init?.body && typeof init.body === 'string') {
                    requestBody = JSON.parse(init.body);
                }
            } catch (e) {
                requestBody = '[Non-JSON or invalid body]';
            }

            const log: NetworkLog = {
                id,
                url,
                method,
                requestBody,
                timestamp: Date.now(),
            };

            this.addLog(log);

            try {
                const response = await originalFetch(input, init);

                // Process response in background to avoid blocking the app
                const processResponse = async () => {
                    try {
                        const clonedResponse = response.clone();
                        const contentType = clonedResponse.headers.get('content-type');
                        let responseBody;

                        if (contentType && contentType.includes('application/json')) {
                            responseBody = await clonedResponse.json();
                        } else {
                            responseBody = await clonedResponse.text();
                        }

                        this.updateLog(id, {
                            status: response.status,
                            responseBody,
                        });
                    } catch (err) {
                        this.updateLog(id, {
                            status: response.status,
                            responseBody: '[Error parsing response]',
                        });
                    }
                };

                processResponse();

                return response;
            } catch (error: any) {
                this.updateLog(id, {
                    error: error.message || 'Network request failed',
                });
                throw error;
            }
        };
    }

    private addLog(log: NetworkLog) {
        this.logs = [log, ...this.logs].slice(0, 50); // Keep last 50 logs
        this.notifyListeners();
    }

    private updateLog(id: string, update: Partial<NetworkLog>) {
        this.logs = this.logs.map(log => log.id === id ? { ...log, ...update } : log);
        this.notifyListeners();
    }

    public getLogs(): NetworkLog[] {
        return this.logs;
    }

    public clearLogs() {
        this.logs = [];
        this.notifyListeners();
    }

    public subscribe(listener: (logs: NetworkLog[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.logs));
    }
}

export const networkLogger = NetworkLogger.getInstance();
