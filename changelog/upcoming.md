## Unreleased

- 2026-06-11: Add profile password reset flow with reset-code email request and token-based password update. Changed in `app/profile.tsx`, `components/profile/password-reset-card.tsx`, `components/profile/profile-details-card.tsx`, `src/features/auth/use-profile-password-reset.ts`.
- 2026-06-11: Add show/hide password toggle to password fields on login, register, and profile password reset screens. Changed in `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `components/profile/password-reset-card.tsx`.
- 2026-06-11: Add .apk and .ipa to .gitignore. Changed in `.gitignore`.
- 2026-06-11: Enable HTTP URLs for Android and iOS in Expo configuration. Changed in `app.json`, `package.json`.
