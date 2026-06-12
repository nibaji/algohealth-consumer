import { UserProfileResponse } from '@/src/features/auth/authTypes';

export function isMemberSelf(
  member: { user_id?: string | null; email_id?: string | null; relation?: string | null } | null | undefined,
  user: UserProfileResponse | null
): boolean {
  if (!user || !member) return false;
  if (member.user_id) {
    return member.user_id === user.id;
  }
  if (member.email_id && user.email) {
    return member.email_id.toLowerCase() === user.email.toLowerCase();
  }
  return (member.relation || '').toLowerCase() === 'self';
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
