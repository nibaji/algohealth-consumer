## Unreleased

- 2026-06-12: Added dynamic configuration via `app.config.js` to automatically append `.dev` to the iOS `bundleIdentifier` and Android `package` name when building under the `development` build profile (facilitated by setting `APP_ENV=development` in `eas.json`). Changed in `eas.json` and `app.config.js`.
- 2026-06-12: Fixed family member self-relationship deduction by using dynamic user ID/email matching against the logged-in user profile, and mapping others with database "self" relation to "Family Head". Implemented an in-memory consult chat history cache per family member that is cleared on app start or user logout. Changed in `src/features/family/familyTypes.ts`, `src/utils/relation.ts`, `src/utils/consultCache.ts`, `src/contexts/AuthContext.tsx`, `components/medical-records/consult-modal.tsx`, `components/medical-records/member-accordion.tsx`, `components/medical-records/edit-member-modal.tsx`, `app/medical-records/[id].tsx`, and `app/medical-records/create.tsx`.
- 2026-06-12: Aligned relationship labels and logic to be with respect to the Family Head. Exposed the relationship selector for logged-in users who are not the Family Head, while keeping it read-only and marked as "Self (Family Head)" for the Family Head. Updated relation display helpers to format non-Family Head self views as "Self (Relation)" and non-self views as their direct relation. Changed in `src/utils/relation.ts`, `components/medical-records/edit-member-modal.tsx`, `app/family/add-member.tsx`, and `app/family/create.tsx`.
- 2026-06-12: Flattened the active family container UI on the home screen to remove card styling (borders, corners, shadow), allowing edge-to-edge layout with a white background and adjusted internal spacing to match content alignment. Changed in `app/index.tsx`.




