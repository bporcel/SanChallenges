import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DebugPanel } from '../src/ui/DebugPanel';
import { initLocale } from '../src/i18n/i18n';

export default function RootLayout() {
    useEffect(() => {
        initLocale();
    }, []);

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
            </Stack>
            <StatusBar style="light" />
            <DebugPanel />
        </SafeAreaProvider>
    );
}
