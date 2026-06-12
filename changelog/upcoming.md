## Unreleased

- 2026-06-12: Changed consult chatbot user-facing labels and welcome message text to display 'Health Consultant' instead of 'Benish AI' / 'Consult Benish'. Changed in `components/medical-records/consult-modal.tsx`.
- 2026-06-12: Refactored internal chatbot API types (`AskBenishRequest` -> `ConsultRequest`, `AskBenishResponse` -> `ConsultResponse`) and service method (`askBenish` -> `consult`) to use the new naming pattern. Changed in `src/features/medical-records/medicalRecordTypes.ts`, `src/services/medical-records/medicalRecordService.ts`, and `components/medical-records/consult-modal.tsx`.
