import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.radius.sm,
  style,
}) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// 1. Home Dashboard UI Skeleton
export const HomeSkeleton: React.FC = () => {
  return (
    <View style={styles.containerGap}>
      {/* Search/Filter header simulation */}
      <View style={styles.headerSkeletonRow}>
        <Skeleton width="75%" height={40} borderRadius={theme.radius.lg} />
        <Skeleton width="20%" height={40} borderRadius={theme.radius.lg} />
      </View>

      {/* Profile summary card skeleton */}
      <View style={styles.cardSkeleton}>
        <View style={styles.flexRowGap}>
          <Skeleton width={50} height={50} borderRadius={theme.radius.full} />
          <View style={styles.flexOneGap}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      </View>

      {/* Member accordions list skeleton */}
      <View style={styles.containerGap}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.memberCardSkeleton}>
            <Skeleton width={44} height={44} borderRadius={theme.radius.full} />
            <View style={styles.flexOneGap}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="30%" height={12} />
            </View>
            <Skeleton width={24} height={24} borderRadius={theme.radius.full} />
          </View>
        ))}
      </View>
    </View>
  );
};

// 2. Medical Record Details UI Skeleton
export const RecordDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.containerGap}>
      {/* Member card summary */}
      <View style={styles.memberCardSkeleton}>
        <Skeleton width={44} height={44} borderRadius={theme.radius.full} />
        <View style={styles.flexOneGap}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="30%" height={12} />
        </View>
      </View>

      {/* EMR details card */}
      <View style={styles.detailsCardSkeleton}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.detailItemSkeleton}>
            <Skeleton width="25%" height={12} />
            <Skeleton width="85%" height={16} />
          </View>
        ))}
      </View>

      {/* Audio player card */}
      <View style={styles.detailsCardSkeleton}>
        <Skeleton width="20%" height={12} />
        <View style={[styles.flexRowGap, { alignItems: 'center', marginTop: theme.spacing.sm }]}>
          <Skeleton width={36} height={36} borderRadius={theme.radius.full} />
          <Skeleton width="75%" height={16} />
        </View>
      </View>

      {/* AI summary card */}
      <View style={styles.aiSummaryCardSkeleton}>
        <View style={styles.flexRowGap}>
          <Skeleton width={16} height={16} borderRadius={theme.radius.full} />
          <Skeleton width="45%" height={14} />
        </View>
        <Skeleton width="100%" height={12} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
};

// 3. Chat Message Bubble Loader Skeleton
export const ChatMessageSkeleton: React.FC = () => {
  return (
    <View style={styles.containerGap}>
      {/* User Bubble loading state */}
      <View style={[styles.chatBubbleRow, styles.alignEnd]}>
        <View style={[styles.chatBubble, styles.bubbleUserSkeleton]}>
          <Skeleton width="70%" height={14} style={styles.opacityWhite} />
          <Skeleton width="40%" height={10} style={styles.opacityWhite} />
        </View>
      </View>

      {/* Bot Bubble loading state */}
      <View style={[styles.chatBubbleRow, styles.alignStart]}>
        <Skeleton width={28} height={28} borderRadius={theme.radius.full} />
        <View style={[styles.chatBubble, styles.bubbleBotSkeleton]}>
          <Skeleton width="85%" height={14} />
          <Skeleton width="60%" height={14} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
    </View>
  );
};

// 4. Edit Member Fields Skeleton
export const EditMemberSkeleton: React.FC = () => {
  return (
    <View style={styles.containerGap}>
      <View style={styles.formItemSkeleton}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="100%" height={48} borderRadius={theme.radius.lg} />
      </View>
      <View style={styles.formItemSkeleton}>
        <Skeleton width="35%" height={12} />
        <Skeleton width="100%" height={48} borderRadius={theme.radius.lg} />
      </View>
      <View style={styles.formItemSkeleton}>
        <Skeleton width="25%" height={12} />
        <View style={styles.flexRowGap}>
          <Skeleton width="48%" height={44} borderRadius={theme.radius.lg} />
          <Skeleton width="48%" height={44} borderRadius={theme.radius.lg} />
        </View>
      </View>
    </View>
  );
};

// 5. Invites List Item Skeleton
export const InvitesSkeleton: React.FC = () => {
  return (
    <View style={styles.containerGap}>
      {[1, 2].map((i) => (
        <View key={i} style={styles.inviteItemSkeleton}>
          <View style={styles.flexOneGap}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
          <View style={styles.flexRowGap}>
            <Skeleton width={56} height={32} borderRadius={theme.radius.md} />
            <Skeleton width={56} height={32} borderRadius={theme.radius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Basic App Boot Screen Skeleton
export const BootSkeleton: React.FC = () => {
  const { height } = useWindowDimensions();
  return (
    <View style={[styles.containerGap, { height: height, justifyContent: 'center', alignItems: 'center' }]}>
      <Skeleton width={80} height={80} borderRadius={theme.radius.xl} />
      <Skeleton width={180} height={20} />
      <Skeleton width={100} height={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: theme.colors.border.light,
  },
  containerGap: {
    gap: theme.spacing.lg,
  },
  flexOneGap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  flexRowGap: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerSkeletonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  cardSkeleton: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  memberCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  detailsCardSkeleton: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
  },
  detailItemSkeleton: {
    gap: theme.spacing.xs,
  },
  aiSummaryCardSkeleton: {
    backgroundColor: theme.colors.background.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    maxWidth: '85%',
  },
  alignEnd: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  alignStart: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  chatBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: 6,
  },
  bubbleUserSkeleton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderBottomRightRadius: 2,
    width: 200,
  },
  bubbleBotSkeleton: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: 2,
    width: 220,
  },
  opacityWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  formItemSkeleton: {
    gap: theme.spacing.xs,
  },
  inviteItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
  },
});
