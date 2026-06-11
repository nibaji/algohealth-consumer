## Unreleased
- 2026-06-11: Implemented family onboarding and management flows. Added onboarding selector screen (`app/onboarding.tsx`), create family screen with invite code clipboard copying and multi-member addition (`app/family/create.tsx`), and join family screen (`app/family/join.tsx`). Added a family feature types module and a backend service client (`src/services/family/familyService.ts`), updated route guards in `app/_layout.tsx`, and enhanced the home screen dashboard (`app/index.tsx`) to render active family details and members.
- 2026-05-13: Cleaned up remaining unused UI dead code (`icon-symbol.tsx`, `use-color-scheme.ts`, and `reset-project.js`).
- 2026-05-13: Created base UI components (`Typography`, `Button`, `TextInput`) integrated with the custom design system.
- 2026-05-13: Cleaned up Expo boilerplate (`ThemedText`, `ThemedView`, etc) and established barebones `index.tsx` and `_layout.tsx`.
- 2026-05-13: Fixed TypeScript import alias resolution bugs (`@/` -> `@/src/`) and cleaned up `app.json` schemas.
- 2026-05-13: Implemented complete authentication flow (Login, Register, Forgot Password, Reset Password) with automatic token refresh via `expo-secure-store`. Added `AuthContext` for global session state and route guarding.
