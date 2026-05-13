import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';

export default function Index() {
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
        This is a clean slate. The default Expo boilerplate has been removed and the custom theme system is applied!
      </Typography.Paragraph>

      <View style={styles.section}>
        <TextInput 
          label="Email Address" 
          placeholder="user@example.com"
        />
        <Button.Primary title="Get Started" onPress={() => {}} />
        <Button.Secondary title="Learn More" onPress={() => {}} />
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
