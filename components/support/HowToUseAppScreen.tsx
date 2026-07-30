import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  HOW_TO_USE_SECTIONS,
  HowToUseSection,
} from '@/components/support/howToUseContent';
import { howToUseAppStyles as styles } from '@/components/support/howToUseAppStyles';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';

const ENTRY_DURATION_MS = 400;

const Bullet = ({ text }: { text: string }): React.JSX.Element => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Typography.Paragraph selectable style={styles.bulletText}>
      {text}
    </Typography.Paragraph>
  </View>
);

const GuideCard = React.memo(({
  section,
}: {
  section: HowToUseSection;
}): React.JSX.Element => (
  <Animated.View
    entering={FadeInDown.duration(ENTRY_DURATION_MS)}
    style={styles.card}
  >
    <View style={styles.cardHeader}>
      <View style={styles.stepBadge}>
        <Typography.Label style={styles.stepText}>
          {section.step}
        </Typography.Label>
      </View>
      <Typography.Subheading
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        {section.title}
      </Typography.Subheading>
    </View>

    <Typography.Paragraph selectable style={styles.description}>
      {section.description}
    </Typography.Paragraph>

    {section.bullets ? (
      <View style={styles.bullets}>
        {section.bullets.map((bullet) => (
          <Bullet key={bullet} text={bullet} />
        ))}
      </View>
    ) : null}

    {section.note ? (
      <View style={styles.note}>
        <Icon
          name={IconName.InfoCircleFill}
          size={20}
          tintColor={theme.colors.status.warning}
        />
        <Typography.Label selectable style={styles.noteText}>
          {section.note}
        </Typography.Label>
      </View>
    ) : null}
  </Animated.View>
));

GuideCard.displayName = 'GuideCard';

const GuideHeader = (): React.JSX.Element => (
  <Animated.View
    entering={FadeInDown.duration(ENTRY_DURATION_MS)}
    style={styles.hero}
  >
    <View style={styles.heroIcon}>
      <Icon
        name={IconName.QuestionmarkCircleFill}
        size={theme.spacing.xl}
        tintColor={theme.colors.primary.DEFAULT}
      />
    </View>
    <Typography.Heading accessibilityRole="header" style={styles.heroTitle}>
      Your personal and family health assistant
    </Typography.Heading>
    <Typography.Paragraph selectable style={styles.heroDescription}>
      A quick guide to setting up your family space, keeping health records
      complete, and choosing the right assistant.
    </Typography.Paragraph>
  </Animated.View>
);

const GuideFooter = (): React.JSX.Element => (
  <View style={styles.footer}>
    <Icon
      name={IconName.Sparkles}
      size={20}
      tintColor={theme.colors.primary.DEFAULT}
    />
    <Typography.Paragraph selectable style={styles.footerText}>
      The more complete and dated your information is, the more useful your
      health history and summaries can be.
    </Typography.Paragraph>
  </View>
);

const GuideSeparator = (): React.JSX.Element => (
  <View style={styles.separator} />
);

export const HowToUseAppScreen = (): React.JSX.Element => {
  const renderItem = useCallback(
    ({ item }: { item: HowToUseSection }): React.JSX.Element => (
      <GuideCard section={item} />
    ),
    []
  );
  const keyExtractor = useCallback(
    (item: HowToUseSection): string => item.id,
    []
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={HOW_TO_USE_SECTIONS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={GuideSeparator}
        ListHeaderComponent={GuideHeader}
        ListFooterComponent={GuideFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
