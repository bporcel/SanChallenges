import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DebugPanel } from '../src/ui/DebugPanel';

export default function RootLayout() {
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
