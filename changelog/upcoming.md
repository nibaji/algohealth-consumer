## Unreleased

- 2026-06-11: Add profile password reset flow with reset-code email request and token-based password update. Changed in `app/profile.tsx`, `components/profile/password-reset-card.tsx`, `components/profile/profile-details-card.tsx`, `src/features/auth/use-profile-password-reset.ts`.
- 2026-06-11: Fix TypeScript error in `useProfileDetails` hook — widen `refreshProfile` parameter type to accept `Promise<unknown>`. Changed in `src/features/auth/use-profile-details.ts`.
- 2026-06-11: Add .apk and .ipa to .gitignore. Changed in `.gitignore`.
- 2026-06-11: Enable HTTP URLs for Android and iOS in Expo configuration. Changed in `app.json`, `package.json`.
