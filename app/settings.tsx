import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { theme, shadows } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Icon, IconName } from '@/components/ui/Icon';
import { settingsStorage } from '@/src/services/settings/settingsStorage';
import { APP_VERSION } from '@/constants/version';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [muteBotSpeech, setMuteBotSpeech] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const val = await settingsStorage.getMuteBotSpeech();
      setMuteBotSpeech(val);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleToggleMuteSpeech = useCallback(async (value: boolean) => {
    setMuteBotSpeech(value);
    await settingsStorage.setMuteBotSpeech(value);
  }, []);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable 
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Icon 
            name={IconName.ChevronLeft} 
            size={20}
            tintColor={theme.colors.text.primary}
          />
        </Pressable>
        <Typography.Subheading style={styles.headerTitle}>
          App Settings
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {!loading ? (
          <Animated.View 
            entering={FadeInDown.duration(500)}
            style={styles.settingsBody}
          >
            {/* Preference card */}
            <View style={[styles.card, { borderCurve: 'continuous' }]}>
              <Typography.Subheading style={styles.sectionTitle}>
                Voice Assistant
              </Typography.Subheading>
              
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Typography.Paragraph style={styles.settingTitle}>
                    Mute Bot Speech by Default
                  </Typography.Paragraph>
                  <Typography.Label style={styles.settingDescription}>
                    Stop assistant messages from playing automatically. You will need to manually tap play on each message.
                  </Typography.Label>
                </View>
                <Switch
                  value={muteBotSpeech}
                  onValueChange={handleToggleMuteSpeech}
                  trackColor={{ false: theme.colors.border.light, true: theme.colors.primary.DEFAULT }}
                  thumbColor={theme.colors.background.surface}
                  ios_backgroundColor={theme.colors.border.light}
                />
              </View>
            </View>

            {/* About Card */}
            <View style={[styles.card, { borderCurve: 'continuous' }]}>
              <Typography.Subheading style={styles.sectionTitle}>
                About
              </Typography.Subheading>
              
              <View style={styles.infoRow}>
                <Typography.Paragraph style={styles.infoLabel}>
                  App Version
                </Typography.Paragraph>
                <Typography.Paragraph style={styles.infoValue}>
                  {APP_VERSION}
                </Typography.Paragraph>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Typography.Paragraph style={styles.infoLabel}>
                  Developer
                </Typography.Paragraph>
                <Typography.Paragraph style={styles.infoValue}>
                  AlgoHealth Team
                </Typography.Paragraph>
              </View>
            </View>

          </Animated.View>
        ) : null}
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
  settingsBody: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLeft: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  settingTitle: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  settingDescription: {
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
});
