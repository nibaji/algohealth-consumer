## Unreleased

- 2026-06-12: Added dynamic configuration via `app.config.js` to automatically append `.dev` to the iOS `bundleIdentifier` and Android `package` name when building under the `development` build profile (facilitated by setting `APP_ENV=development` in `eas.json`). Changed in `eas.json` and `app.config.js`.
- 2026-06-12: Fixed family member self-relationship deduction by using dynamic user ID/email matching against the logged-in user profile, and mapping others with database "self" relation to "Family Head". Implemented an in-memory consult chat history cache per family member that is cleared on app start or user logout. Changed in `src/features/family/familyTypes.ts`, `src/utils/relation.ts`, `src/utils/consultCache.ts`, `src/contexts/AuthContext.tsx`, `components/medical-records/consult-modal.tsx`, `components/medical-records/member-accordion.tsx`, `components/medical-records/edit-member-modal.tsx`, `app/medical-records/[id].tsx`, and `app/medical-records/create.tsx`.


