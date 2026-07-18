import React, { useCallback } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ConsultChat } from '@/components/consults/ConsultChat';

const firstParam = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export default function ConsultSessionScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    sessionId?: string | string[];
    memberId?: string | string[];
    memberName?: string | string[];
  }>();
  const routeSessionId = firstParam(params.sessionId);
  const sessionId = routeSessionId === 'new' ? null : routeSessionId;
  const memberId = firstParam(params.memberId);
  const memberName = firstParam(params.memberName);

  const handleSessionCreated = useCallback((_newSessionId: string): void => {
    // The chat hook retains the server-created ID for subsequent turns.
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: memberName ? `${memberName}'s consult` : 'Health Consultant',
        }}
      />
      <ConsultChat
        sessionId={sessionId}
        familyMemberId={memberId}
        onSessionCreated={handleSessionCreated}
      />
    </>
  );
}
