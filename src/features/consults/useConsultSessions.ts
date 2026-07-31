import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ConsultationSession } from '@/src/features/consults/consultTypes';
import { FamilyMemberResponse } from '@/src/features/family/familyTypes';
import { consultService } from '@/src/services/consults/consultService';
import { familyService } from '@/src/services/family/familyService';

interface MemberSessionResult {
  familyMemberId: string;
  sessions: ConsultationSession[];
}

interface UseConsultSessionsReturn {
  visibleSessions: ConsultationSession[];
  familyMembers: FamilyMemberResponse[];
  memberNameById: ReadonlyMap<string, string>;
  selectedMemberId: string | null;
  selectedMemberName: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  selectMember: (memberId: string | null) => void;
  refresh: () => void;
}

const loadMemberSessions = async (
  familyMembers: FamilyMemberResponse[]
): Promise<MemberSessionResult[]> => Promise.all(familyMembers.map(
  async (member): Promise<MemberSessionResult> => ({
    familyMemberId: member.id,
    sessions: await consultService.listSessions({ familyMemberId: member.id }),
  })
));

export const useConsultSessions = (): UseConsultSessionsReturn => {
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [sessionsByMemberId, setSessionsByMemberId] = useState<
    ReadonlyMap<string, ConsultationSession[]>
  >(() => new Map());
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
      const memberSessionResults = await loadMemberSessions(nextFamilyMembers);
      const nextSessionsByMemberId = new Map<string, ConsultationSession[]>();
      const familyMemberIdBySessionId = new Map<string, string>();

      memberSessionResults.forEach(({ familyMemberId, sessions: memberSessions }): void => {
        const attributedSessions = memberSessions.map((session): ConsultationSession => ({
          ...session,
          family_member_id: familyMemberId,
        }));
        nextSessionsByMemberId.set(familyMemberId, attributedSessions);
        attributedSessions.forEach((session): void => {
          familyMemberIdBySessionId.set(session.id, familyMemberId);
        });
      });

      setSessions(nextSessions.map((session): ConsultationSession => ({
        ...session,
        family_member_id: familyMemberIdBySessionId.get(session.id)
          ?? session.family_member_id
          ?? null,
      })));
      setSessionsByMemberId(nextSessionsByMemberId);
      setFamilyMembers(nextFamilyMembers);
      setSelectedMemberId((current): string | null => (
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

  const memberNameById = useMemo<ReadonlyMap<string, string>>(
    (): ReadonlyMap<string, string> => new Map(familyMembers.map(
      (member): [string, string] => [member.id, member.name]
    )),
    [familyMembers]
  );
  const visibleSessions = useMemo<ConsultationSession[]>(
    (): ConsultationSession[] => (
      selectedMemberId ? sessionsByMemberId.get(selectedMemberId) ?? [] : sessions
    ),
    [selectedMemberId, sessions, sessionsByMemberId]
  );
  const selectedMemberName = selectedMemberId
    ? memberNameById.get(selectedMemberId) ?? null
    : null;

  const selectMember = useCallback((memberId: string | null): void => {
    setSelectedMemberId(memberId);
  }, []);

  const refresh = useCallback((): void => {
    loadSessions(true);
  }, [loadSessions]);

  return {
    visibleSessions,
    familyMembers,
    memberNameById,
    selectedMemberId,
    selectedMemberName,
    isLoading,
    isRefreshing,
    error,
    selectMember,
    refresh,
  };
};
