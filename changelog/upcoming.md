## Unreleased

- 2026-06-17: Implemented voice note recording and document attachments in Health Consultant chatbot. Refactored chatbot modal by extracting subcomponents. Added deletion guards for family members based on owner/self permissions. Added onboarding invite reject and skip actions. Implemented dashboard invites modal with notification badge and pending member filtering. Rendered full AI health summary above member medical records and hid home page record AI badge.
- 2026-06-17: Implemented a centralized audio playback controller (`activePlayer`) in `ConsultModal` to ensure only one audio plays at a time. Added AppState and unmount listeners to pause audio when the app background is entered or the modal closes. Created a unified, reusable `AudioPlayerView` for both recording preview and message bubble players. Adjusted `invites-modal` header styling for safe areas on non-iOS platforms. Rendered a single-line `health_summary` preview inside the collapsed accordion header. Constrained the chat modal header layout to keep the close button on screen. Integrated `/family-members/` (`getFamilyMembers()`) to query detailed summaries and merged it on the dashboard.
  Changed in:
  - `src/features/family/familyTypes.ts`
  - `src/services/family/familyService.ts`
  - `src/services/medical-records/medicalRecordService.ts`
  - `src/contexts/AuthContext.tsx`
  - `app/_layout.tsx`
  - `app/onboarding.tsx`
  - `components/ui/icon.tsx`
  - `components/medical-records/invites-modal.tsx`
  - `components/medical-records/edit-member-modal.tsx`
  - `components/medical-records/member-accordion.tsx`
  - `components/medical-records/medical-record-card.tsx`
  - `components/medical-records/consult-message.tsx`
  - `components/medical-records/consult-input.tsx`
  - `components/medical-records/consult-modal.tsx`
  - `components/medical-records/audio-player-view.tsx`
  - `app/index.tsx`
  - `README.md`
