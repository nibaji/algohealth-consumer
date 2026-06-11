import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding' || segments[0] === 'family';

    if (!user) {
      if (!inAuthGroup) {
        // Redirect to the login page.
        router.replace('/(auth)/login');
      }
    } else {
      // User is logged in
      if (!user.family_id) {
        // If user is not in a family, they must go through onboarding (join/create family).
        if (!inOnboardingGroup) {
          router.replace('/onboarding');
        }
      } else {
        // User is in a family.
        // Redirect away from auth and onboarding landing screens (and family setup/creation screens).
        if (inAuthGroup || segments[0] === 'onboarding' || segments[0] === 'family') {
          router.replace('/');
        }
      }
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.default },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="family/create" />
      <Stack.Screen name="family/join" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="medical-records/create" />
      <Stack.Screen name="medical-records/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <InitialLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
  },
});
