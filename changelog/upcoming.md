## Unreleased

- 2026-06-12: Installed `expo-dev-client` dependency for Android development client builds. Changed in `package.json` and `bun.lock`.
- 2026-06-12: Standardized `KeyboardAvoidingView` logic/props across all screens/modals containing text inputs using a newly created `useKeyboardAvoiding` hook (configuring `behavior="padding"` and conditional `enabled` based on platform and keyboard visibility). Changed in `hooks/useKeyboardAvoiding.ts`, `hooks/useKeyboardVisibility.ts`, `components/medical-records/consult-modal.tsx`, `components/medical-records/edit-member-modal.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`, `app/family/create.tsx`, `app/family/add-member.tsx`, `app/family/join.tsx`, and `app/medical-records/create.tsx`.
- 2026-06-12: Fixed file upload crashes ("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported" on Hermes and "Unsupported FormDataPart implementation" under fetch) by routing FormData requests via XMLHttpRequest in the API client and using standard React Native `{ uri, name, type }` file parts. Changed in `src/services/api/apiClient.ts` and `app/medical-records/create.tsx`.





