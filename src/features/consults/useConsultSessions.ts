import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ConsultationSession } from '@/src/features/consults/consultTypes';
import { FamilyMemberResponse } from '@/src/features/family/familyTypes';
import { consultService } from '@/src/services/consults/consultService';
import { familyService } from '@/src/services/family/familyService';

interface UseConsultSessionsReturn {
  visibleSessions: ConsultationSession[];
  familyMembers: FamilyMemberResponse[];
  memberNameById: ReadonlyMap<string, string>;
  selectedMemberId: string | null;
  selectedMemberName: string | null;
  isLoading: boolean;
  isFilterLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  selectMember: (memberId: string | null) => void;
  refresh: () => void;
}

const attributeSessions = (
  sessions: ConsultationSession[],
  familyMemberId: string
): ConsultationSession[] => sessions.map((session): ConsultationSession => ({
  ...session,
  family_member_id: familyMemberId,
}));

export const useConsultSessions = (): UseConsultSessionsReturn => {
  const [allSessions, setAllSessions] = useState<ConsultationSession[]>([]);
  const [visibleSessions, setVisibleSessions] = useState<ConsultationSession[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberResponse[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersionRef = useRef(0);

  const loadAllSessions = useCallback(async (refresh = false): Promise<void> => {
    const requestVersion = ++requestVersionRef.current;
    setSelectedMemberId(null);
    setIsFilterLoading(false);
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
      if (requestVersion !== requestVersionRef.current) return;
      setAllSessions(nextSessions);
      setVisibleSessions(nextSessions);
      setFamilyMembers(nextFamilyMembers);
    } catch (err: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load consults');
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const loadMemberSessions = useCallback(async (
    familyMemberId: string,
    refresh = false
  ): Promise<void> => {
    const requestVersion = ++requestVersionRef.current;
    setSelectedMemberId(familyMemberId);
    setError(null);
    setIsFilterLoading(!refresh);
    setIsRefreshing(refresh);

    try {
      const sessions = await consultService.listSessions({ familyMemberId });
      if (requestVersion !== requestVersionRef.current) return;
      setVisibleSessions(attributeSessions(sessions, familyMemberId));
    } catch (err: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load consults');
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsFilterLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback((): (() => void) => {
    loadAllSessions();
    return (): void => {
      requestVersionRef.current += 1;
    };
  }, [loadAllSessions]));

  const memberNameById = useMemo<ReadonlyMap<string, string>>(
    (): ReadonlyMap<string, string> => new Map(familyMembers.map(
      (member): [string, string] => [member.id, member.name]
    )),
    [familyMembers]
  );
  const selectedMemberName = selectedMemberId
    ? memberNameById.get(selectedMemberId) ?? null
    : null;

  const selectMember = useCallback((memberId: string | null): void => {
    if (memberId) {
      loadMemberSessions(memberId);
      return;
    }
    requestVersionRef.current += 1;
    setSelectedMemberId(null);
    setVisibleSessions(allSessions);
    setIsFilterLoading(false);
    setIsRefreshing(false);
    setError(null);
  }, [allSessions, loadMemberSessions]);

  const refresh = useCallback((): void => {
    if (selectedMemberId) {
      loadMemberSessions(selectedMemberId, true);
      return;
    }
    loadAllSessions(true);
  }, [loadAllSessions, loadMemberSessions, selectedMemberId]);

  return {
    visibleSessions,
    familyMembers,
    memberNameById,
    selectedMemberId,
    selectedMemberName,
    isLoading,
    isFilterLoading,
    isRefreshing,
    error,
    selectMember,
    refresh,
  };
};
