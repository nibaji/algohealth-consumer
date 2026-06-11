import React from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';

export default function Onboarding() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleJoinPress = React.useCallback(() => {
    router.push('/family/join');
  }, [router]);

  const handleCreatePress = React.useCallback(() => {
    router.push('/family/create');
  }, [router]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View 
          entering={FadeInDown.duration(600).springify()} 
          style={styles.header}
        >
          <Typography.Heading style={styles.title}>
            Setup Your Circle
          </Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Hello {user?.full_name || 'there'}! Manage your medical records, checkups, and family health circles in one secure place.
          </Typography.Paragraph>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(200).springify()}
          style={styles.cardsContainer}
        >
          {/* Create Family Card */}
          <Pressable 
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.card,
              pressed ? styles.cardPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                <Image 
                  source="sf:person.3.fill" 
                  style={[styles.icon, { tintColor: theme.colors.primary.DEFAULT }]} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Typography.Subheading style={styles.cardTitle}>
                  Create a Family
                </Typography.Subheading>
                <Typography.Paragraph style={styles.cardDescription}>
                  Start a new health circle, get an invite code, and add family members to manage their records together.
                </Typography.Paragraph>
              </View>
            </View>
            <Button.Primary 
              title="Create Family" 
              onPress={handleCreatePress}
              style={styles.cardButton}
            />
          </Pressable>

          {/* Join Family Card */}
          <Pressable 
            onPress={handleJoinPress}
            style={({ pressed }) => [
              styles.card,
              pressed ? styles.cardPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Image 
                  source="sf:key.fill" 
                  style={[styles.icon, { tintColor: theme.colors.status.success }]} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Typography.Subheading style={styles.cardTitle}>
                  Join a Family
                </Typography.Subheading>
                <Typography.Paragraph style={styles.cardDescription}>
                  Have an invite code from a family member? Enter it here to join their existing health circle.
                </Typography.Paragraph>
              </View>
            </View>
            <Button.Secondary 
              title="Join Family" 
              onPress={handleJoinPress}
              style={styles.cardButton}
            />
          </Pressable>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.footer}
        >
          <Pressable 
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed ? styles.logoutButtonPressed : null
            ]}
          >
            <Typography.Label style={styles.logoutText}>
              Sign Out of Account
            </Typography.Label>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing['6xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    color: theme.colors.primary.DEFAULT,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
    lineHeight: theme.lineHeight.md,
  },
  cardsContainer: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  },
  cardPressed: {
    borderColor: theme.colors.border.default,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  cardTextContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  cardButton: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  logoutButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
