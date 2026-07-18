import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Href, Stack, useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  ConsultMemberFilter,
  ConsultMemberFilterOption,
} from '@/components/consults/ConsultMemberFilter';
import { Icon, IconName } from '@/components/ui/Icon';
import { ConsultsListSkeleton, MemberChipsSkeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { ConsultationSession } from '@/src/features/consults/consultTypes';
import { FamilyMemberResponse } from '@/src/features/family/familyTypes';
import { consultService } from '@/src/services/consults/consultService';
import { familyService } from '@/src/services/family/familyService';

const formatCreatedAt = (value: string): string => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export default function ConsultsScreen(): React.JSX.Element {
  const router = useRouter();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberResponse[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [nextSessions, nextFamilyMembers] = await Promise.all([
        consultService.listSessions(),
        familyService.getFamilyMembers(),
      ]);
      setSessions(nextSessions);
      setFamilyMembers(nextFamilyMembers);
      setSelectedMemberId((current) => (
        current && nextFamilyMembers.some((member) => member.id === current) ? current : null
      ));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load consults');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback((): void => {
    loadSessions();
  }, [loadSessions]));

  const memberNameById = useMemo(
    () => new Map(familyMembers.map((member) => [member.id, member.name])),
    [familyMembers]
  );
  const filterOptions = useMemo<ConsultMemberFilterOption[]>(() => [
    { id: null, label: 'All' },
    ...familyMembers.map((member) => ({ id: member.id, label: member.name })),
  ], [familyMembers]);
  const filteredSessions = useMemo(
    () => selectedMemberId
      ? sessions.filter((session) => session.family_member_id === selectedMemberId)
      : sessions,
    [selectedMemberId, sessions]
  );
  const selectedMemberName = selectedMemberId ? memberNameById.get(selectedMemberId) ?? null : null;

  const handleSelectMember = useCallback((memberId: string | null): void => {
    setSelectedMemberId(memberId);
  }, []);

  const handleRefresh = useCallback((): void => {
    loadSessions(true);
  }, [loadSessions]);

  const renderSession = useCallback(({ item }: { item: ConsultationSession }): React.JSX.Element => {
    const memberName = item.family_member_id ? memberNameById.get(item.family_member_id) : null;
    const handlePress = (): void => router.push({
      pathname: '/consults/[sessionId]',
      params: {
        sessionId: item.id,
        ...(item.family_member_id ? { memberId: item.family_member_id } : {}),
        ...(memberName ? { memberName } : {}),
      },
    } as unknown as Href);
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.sessionRow, pressed ? styles.sessionRowPressed : null]}
      >
        <View style={styles.sessionIcon}>
          <Icon name={IconName.Sparkles} size={18} tintColor={theme.colors.primary.DEFAULT} />
        </View>
        <View style={styles.sessionContent}>
          <Typography.Paragraph style={styles.sessionTitle} truncate>
            {item.title || item.id}
          </Typography.Paragraph>
          <Typography.Label style={styles.sessionMeta}>
            {`${memberName ? `${memberName} · ` : ''}${item.message_count} ${item.message_count === 1 ? 'message' : 'messages'} · ${formatCreatedAt(item.created_at)}`}
          </Typography.Label>
        </View>
        <Icon name={IconName.ChevronRight} size={18} tintColor={theme.colors.text.tertiary} />
      </Pressable>
    );
  }, [memberNameById, router]);

  const keyExtractor = useCallback((item: ConsultationSession): string => item.id, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Consults' }} />
      {!isLoading && !error ? (
        <ConsultMemberFilter
          options={filterOptions}
          selectedId={selectedMemberId}
          onSelect={handleSelectMember}
        />
      ) : null}
      {isLoading ? (
        <View style={styles.loadingSkeleton}>
          <View style={styles.memberChipsSkeleton}>
            <MemberChipsSkeleton />
          </View>
          <ConsultsListSkeleton />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Typography.Paragraph selectable style={styles.errorText}>{error}</Typography.Paragraph>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.list}>
          <FlashList
            data={filteredSessions}
            renderItem={renderSession}
            keyExtractor={keyExtractor}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={SessionSeparator}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary.DEFAULT}
                colors={[theme.colors.primary.DEFAULT]}
              />
            }
            ListEmptyComponent={<EmptyConsults memberName={selectedMemberName} />}
          />
        </Animated.View>
      )}
    </View>
  );
}

const SessionSeparator = (): React.JSX.Element => <View style={styles.separator} />;

const EmptyConsults = ({ memberName }: { memberName: string | null }): React.JSX.Element => (
  <View style={styles.empty}>
    <Typography.Subheading style={styles.emptyTitle}>
      {memberName ? `No consults for ${memberName}` : 'No consults yet'}
    </Typography.Subheading>
    <Typography.Paragraph style={styles.emptyText}>
      {memberName ? 'Start a consult from their family member card.' : 'Start a new consult to ask a health question.'}
    </Typography.Paragraph>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.default },
  list: { flex: 1 },
  loadingSkeleton: { flex: 1 },
  memberChipsSkeleton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  listContent: { paddingVertical: theme.spacing.sm },
  sessionRow: {
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  sessionRowPressed: { backgroundColor: theme.colors.background.primaryLight },
  sessionIcon: {
    width: theme.spacing['2xl'],
    height: theme.spacing['2xl'],
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.purpleLight,
  },
  sessionContent: { flex: 1, gap: theme.spacing.xs },
  sessionTitle: { color: theme.colors.text.primary, fontWeight: '600' },
  sessionMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSize.xs },
  separator: { height: 1, backgroundColor: theme.colors.border.light, marginLeft: theme.spacing['6xl'] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  errorText: { color: theme.colors.text.error, textAlign: 'center' },
  empty: { alignItems: 'center', padding: theme.spacing['3xl'], gap: theme.spacing.sm },
  emptyTitle: { color: theme.colors.text.primary },
  emptyText: { color: theme.colors.text.secondary, textAlign: 'center' },
});
