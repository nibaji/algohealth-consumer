import React, { useState, useCallback, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';

export default function JoinFamily() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleJoin = useCallback(() => {
    const code = inviteCode.trim();
    if (!code) {
      setError('Invite code is required');
      return;
    }
    
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await familyService.joinFamily({
          invite_code: code,
        });

        // Refetch user profile to update family_id context
        await refreshProfile();
        
        // Show success screen state
        setSuccess(true);
        
        // Delay navigation slightly for feedback satisfaction
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid invite code or failed to join';
        setError(message);
      }
    });
  }, [inviteCode, refreshProfile, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable 
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Icon 
            name="chevron.left" 
            size={20}
            tintColor={theme.colors.text.primary}
          />
        </Pressable>
        <Typography.Subheading style={styles.headerTitle}>
          Join a Family
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {success ? (
          // Success State View
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.successContainer}
          >
            <View style={[styles.successIconCircle, { backgroundColor: '#ECFDF5', borderCurve: 'continuous' }]}>
              <Icon 
                name="checkmark.seal.fill" 
                size={40}
                tintColor={theme.colors.status.success}
              />
            </View>
            <Typography.Heading style={styles.successTitle}>
              Joined Family!
            </Typography.Heading>
            <Typography.Paragraph style={styles.successDescription}>
              You have successfully joined the family health circle. Redirecting you to your health dashboard...
            </Typography.Paragraph>
          </Animated.View>
        ) : (
          // Form View
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.formContainer}
          >
            <View style={styles.infoSection}>
              <Typography.Heading style={styles.stepTitle}>
                Enter Invite Code
              </Typography.Heading>
              <Typography.Paragraph style={styles.stepDescription}>
                Ask the owner of the family circle for their unique family invite code. Once entered, you will gain access to shared records and members.
              </Typography.Paragraph>
            </View>

            <View style={styles.cardForm}>
              <TextInput
                label="Invite Code"
                placeholder="e.g. FAM-123456"
                value={inviteCode}
                onChangeText={setInviteCode}
                error={error ? error : undefined}
                autoCapitalize="characters"
                autoFocus
              />

              <Button.Primary
                title="Join Circle"
                onPress={handleJoin}
                loading={isPending}
                style={styles.submitButton}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
  },
  formContainer: {
    gap: theme.spacing.lg,
  },
  infoSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  stepTitle: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary.DEFAULT,
  },
  stepDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  
  // Success states
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.15)",
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successTitle: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.status.success,
    fontWeight: '700',
  },
  successDescription: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
  },
});
