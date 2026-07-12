import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { AlertProvider } from '@/src/contexts/AlertContext';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

// Prevent native splash screen from auto-hiding before session is restored
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore error on web/dev */
});

function InitialLayout() {
  const { user, isLoading, isFamilyPending, hasSkippedOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = 
      segments[0] === 'onboarding' || 
      (segments[0] === 'family' && (segments[1] === 'create' || segments[1] === 'join'));

    if (!user) {
      if (!inAuthGroup) {
        // Redirect to the login page.
        router.replace('/(auth)/login');
      }
    } else {
      const hasActiveFamily = user.family_id && !isFamilyPending;

      if (hasActiveFamily) {
        // User has an active family. Redirect away from auth and onboarding/family setup screens.
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/');
        }
      } else {
        // User has no active family (either no family_id or pending invite).
        // They need onboarding unless they explicitly skipped it.
        if (!hasSkippedOnboarding) {
          if (!inOnboardingGroup) {
            router.replace('/onboarding');
          }
        } else {
          // User skipped onboarding. They can be on the home screen or family setup screens.
          // If they land on the onboarding landing page or auth group, redirect them to home.
          if (inAuthGroup || segments[0] === 'onboarding') {
            router.replace('/');
          }
        }
      }
    }
  }, [user, isLoading, segments, router, isFamilyPending, hasSkippedOnboarding]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {
        /* Ignore error */
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return <SplashLoader />;
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
      <Stack.Screen name="family/add-member" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="medicalRecords/create" />
      <Stack.Screen name="medicalRecords/[id]" />
      <Stack.Screen name="consults/index" />
      <Stack.Screen name="consults/[sessionId]" />
    </Stack>
  );
}


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <InitialLayout />
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}

function SplashLoader() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 1 + (opacity.value - 0.4) * 0.08 }],
  }));

  return (
    <View style={styles.splashContainer}>
      <AnimatedImage
        source={require('@/assets/images/splash-icon.png')}
        style={[styles.splashImage, animatedStyle]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.splash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});

