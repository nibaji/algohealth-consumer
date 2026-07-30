const APP_NAME = 'AlgoHealth Plus';

const PAGE_TITLES: Readonly<Record<string, string>> = {
  index: 'Home',
  login: 'Sign In',
  register: 'Create Account',
  forgotPassword: 'Reset Password',
  onboarding: 'Get Started',
  'family/create': 'Create Family',
  'family/join': 'Join a Family',
  'family/addMember': 'Add Family Member',
  'medicalRecords/create': 'Add Medical Record',
  'medicalRecords/[id]': 'Record Details',
  profile: 'My Profile',
  settings: 'App Settings',
  'how-to-use': 'How to Use the App?',
  alerts: 'Alerts',
  consults: 'Consults',
  'consults/index': 'Consults',
  'consults/[sessionId]': 'Health Consultant',
};

const isRouteGroup = (segment: string): boolean =>
  segment.startsWith('(') && segment.endsWith(')');

export const buildWebPageTitle = (segments: string[]): string => {
  const route = segments.filter((segment) => !isRouteGroup(segment)).join('/') || 'index';
  const pageTitle = PAGE_TITLES[route];

  return pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME;
};
