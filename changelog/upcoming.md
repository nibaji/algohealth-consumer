## Unreleased
- 2026-05-13: Created base UI components (`Typography`, `Button`, `TextInput`) integrated with the custom design system.
- 2026-05-13: Cleaned up Expo boilerplate (`ThemedText`, `ThemedView`, etc) and established barebones `index.tsx` and `_layout.tsx`.
- 2026-05-13: Fixed TypeScript import alias resolution bugs (`@/` -> `@/src/`) and cleaned up `app.json` schemas.
- 2026-05-13: Implemented complete authentication flow (Login, Register, Forgot Password, Reset Password) with automatic token refresh via `expo-secure-store`. Added `AuthContext` for global session state and route guarding.
