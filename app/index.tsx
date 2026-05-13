import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';

export default function Index() {
  const { user, logout } = useAuth();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Typography.Heading style={styles.title}>
        Welcome to AlgoHealth
      </Typography.Heading>
      
      <Typography.Paragraph style={styles.description}>
        Hello, {user?.full_name || user?.email}! You are successfully authenticated.
      </Typography.Paragraph>

      <View style={styles.section}>
        <Button.Secondary title="Logout" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['6xl'],
    gap: theme.spacing.xl,
  },
  title: {
    color: theme.colors.primary.DEFAULT,
  },
  description: {
    color: theme.colors.text.secondary,
  },
  section: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  }
});
