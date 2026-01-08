import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DebugPanel } from '../src/ui/DebugPanel';
import { initLocale } from '../src/i18n/i18n';
import { ErrorBoundary } from '../src/ui/components/ErrorBoundary';

import { SocialDataProvider } from '../src/ui/components/SocialDataContext';
import { ThemeProvider, useTheme } from '../src/ui/theme/ThemeContext';

function AppContent() {
    const { theme } = useTheme();
    const statusBarStyle = theme === 'minimalist' ? 'dark' : 'light';

    return (
        <SafeAreaProvider>
            <SocialDataProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                </Stack>
                <StatusBar style={statusBarStyle} />
                <DebugPanel />
            </SocialDataProvider>
        </SafeAreaProvider>
    );
}

export default function RootLayout() {
    useEffect(() => {
        initLocale();
    }, []);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </ErrorBoundary>
    );
}
