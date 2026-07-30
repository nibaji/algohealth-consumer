export interface HowToUseSection {
  id: string;
  step: number;
  title: string;
  description: string;
  bullets?: readonly string[];
  note?: string;
}

export const HOW_TO_USE_SECTIONS: readonly HowToUseSection[] = [
  {
    id: 'account',
    step: 1,
    title: 'Create your account',
    description:
      'Choose Register, then enter your full name, email address, and a password of at least six characters. Use that email and password when you sign in later.',
  },
  {
    id: 'family',
    step: 2,
    title: 'Set up your family',
    description:
      'Create a new family and give it a name, join an existing family with its invite code, or accept a pending invitation.',
    bullets: [
      'Your family is the shared space for member profiles, health summaries, and medical records.',
      'You can skip family setup and return to it later from the home screen.',
    ],
  },
  {
    id: 'members',
    step: 3,
    title: 'Add family members',
    description:
      'From My Family, choose Add Member. Enter the member’s name, date of birth, gender, and relationship. Email and mobile number are optional.',
    bullets: [
      'An invited member remains pending until they accept the invitation.',
      'You can also copy the family invite code from the home screen and share it directly.',
    ],
  },
  {
    id: 'records',
    step: 4,
    title: 'Add complete medical records',
    description:
      'Expand a family member, choose Add Medical Record, select the visit date, and add the primary context, chief complaint, and notes. You can also attach documents or record an audio note.',
    bullets: [
      'Include allergies, medical and family history, ongoing conditions, surgeries, medicines, and available reports.',
      'Add dates wherever possible—for example, “Diabetes present since 1998” instead of only “Diabetes.”',
    ],
    note: 'Complete, dated information gives the health summary better context.',
  },
  {
    id: 'summary',
    step: 5,
    title: 'Review summaries and records',
    description:
      'Expand a member to view their AI Health Summary when one is available, along with their medical records.',
    bullets: [
      'Open a record to review its details and AI clinical summary.',
      'You can edit or delete the record, play audio, and download or share its attachments.',
    ],
  },
  {
    id: 'assistants',
    step: 6,
    title: 'Choose Ask or Consult',
    description:
      'Both experiences let you type, talk, or attach documents, but they serve different purposes.',
    bullets: [
      'Ask is for general health questions. It is temporary, is not tied to a family member, and is cleared when you close it.',
      'Consult is for a specific family member or medical concern. Consult conversations are saved and can be reopened from Consults.',
    ],
  },
  {
    id: 'alerts',
    step: 7,
    title: 'Check alerts',
    description:
      'Use the bell on the home screen to review clinical, reminder, and system alerts. Opening the Alerts page marks its unread alerts as read.',
    bullets: [
      'Android and iOS can receive push notifications after permission is granted.',
      'On the web, alerts are available inside the app without push notifications.',
    ],
  },
  {
    id: 'save-share',
    step: 8,
    title: 'Save, share, or print',
    description:
      'Open a medical record and use its attachment actions to download or share files. Saving and printing options depend on the share menu available on your device.',
  },
];
