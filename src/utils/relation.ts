import { UserProfileResponse } from '@/src/features/auth/authTypes';

export function isMemberSelf(
  member: { user_id?: string | null; email_id?: string | null } | null | undefined,
  user: UserProfileResponse | null
): boolean {
  if (!user || !member) return false;
  if (member.email_id !== null && member.email_id !== undefined && user.email !== null && user.email !== undefined && member.email_id.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }
  if (!member.user_id) return false;
  return member.user_id === user.id;
}

export function getDisplayRelation(
  member: { user_id?: string | null; email_id?: string | null; relation: string } | null | undefined,
  user: UserProfileResponse | null
): string {
  if (!member) return '';
  const isSelf = isMemberSelf(member, user);
  const isFamilyHead = member.relation.toLowerCase() === 'self';

  if (isFamilyHead) {
    return isSelf ? 'Self' : 'Family Head';
  }

  return isSelf ? `Self (${member.relation})` : member.relation;
}

/**
 * Returns a human-readable relation label without needing a logged-in user
 * reference. Used for read-only contexts (e.g. invite modal member list).
 */
export function getDisplayRelationFromRelation(relation: string): string {
  const lower = relation.toLowerCase();
  if (lower === 'self') return 'Family Head';
  return relation;
}

/**
 * Sorts family members according to business rules:
 *   1. Logged-in user's own member (isMemberSelf)
 *   2. Family head (relation === 'Self'), if different from logged-in user
 *   3. Other accepted/non-pending members alphabetically
 *   4. Pending members alphabetically at the very bottom
 */
export function sortFamilyMembers<T extends { name: string; relation: string; invite_status?: string | null; user_id?: string | null; email_id?: string | null }>(
  members: T[],
  user: UserProfileResponse | null
): T[] {
  return [...members].sort((a, b) => {
    const aIsSelf = isMemberSelf(a, user);
    const bIsSelf = isMemberSelf(b, user);
    if (aIsSelf && !bIsSelf) return -1;
    if (!aIsSelf && bIsSelf) return 1;

    // Pending members go to the bottom
    const aIsPending = a.invite_status === 'pending';
    const bIsPending = b.invite_status === 'pending';
    if (aIsPending && !bIsPending) return 1;
    if (!aIsPending && bIsPending) return -1;

    // Among non-pending, family head (relation 'Self') comes first
    const aIsHead = a.relation.toLowerCase() === 'self';
    const bIsHead = b.relation.toLowerCase() === 'self';
    if (aIsHead && !bIsHead) return -1;
    if (!aIsHead && bIsHead) return 1;

    return a.name.localeCompare(b.name);
  });
}

