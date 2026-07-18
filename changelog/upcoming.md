## Unreleased

- 2026-07-18: Added an All/family-member horizontal selector to Consults and client-side session filtering through the optional `family_member_id` list field. Consult history now loads sessions and family members together, preserves backward compatibility for sessions without member metadata, and carries member context into reopened chats. Changed in `app/consults/index.tsx`, `components/consults/ConsultMemberFilter.tsx`, `src/features/consults/consultTypes.ts`, and `README.md`.
