## Unreleased

- 2026-06-12: Installed `expo-dev-client` dependency for Android development client builds. Changed in `package.json` and `bun.lock`.
- 2026-06-12: Implemented `useKeyboardVisibility` hook and standardized `KeyboardAvoidingView` logic/props across all screens/modals containing text inputs (using `behavior="padding"` and conditional `enabled={keyboardAvoidingEnabled}` based on platform and active keyboard visibility). Changed in `hooks/useKeyboardVisibility.ts`, `components/medical-records/consult-modal.tsx`, `components/medical-records/edit-member-modal.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`, `app/family/create.tsx`, `app/family/add-member.tsx`, `app/family/join.tsx`, and `app/medical-records/create.tsx`.



