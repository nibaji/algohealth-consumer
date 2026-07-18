# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Features

- **Family Circles**: Create, join, and manage family circles. Delete members or leave circles based on owner/self permission guards.
- **Onboarding Invite Flows**: Automatically detect invitations with options to Accept, Reject, or Decide Later.
- **Pending Invites Widget**: Dashboard notification badge and modal to accept or reject pending invites at any time.
- **AI Health Consultant**: Start a saved consult from an individual family member, or use the Consults entry above the member list to browse and resume earlier sessions. The history screen includes an All/family-member horizontal filter. Member filters, consult lists, and consult history use layout-matched skeleton loading states. Consult chats support text, voice notes, and document attachments.
- **Ask**: Open an ephemeral general health query from the global Ask button beside Consults. Ask supports the full chat input, playback, formatting, copy, and text-to-speech experience, but messages are not saved and are discarded when the modal closes.
- **AI Health Summary**: Premium inline overview cards showcasing member health summaries in full above their record lists.
- **Medical Record Attachments**: Securely retrieves, plays back, and downloads voice notes and document attachments within the medical record detail view.

## Get started

### Consultation API flow

- `GET /consultation-chats/sessions` loads the newest consult sessions.
- `GET /consultation-chats/sessions/{session_id}` loads a session's full message history.
- `POST /consultation-chats/chat` starts or continues a chat. Omit `session_id` for the first message, then reuse the returned `session_id` for later turns.
- Chat screens render only user and assistant messages supplied by these endpoints; new consults start empty without a synthetic greeting. Successful sends adopt the response's `message_id`, `question_time`, and `answer_time` so the live thread matches its persisted history.
- Session rows display `title` when present and fall back to the session ID.
- When session list items include `family_member_id`, the Consults screen can filter history by the selected family member. Sessions without the field remain visible under All for backward compatibility.

### Ask API flow

- `POST /medical-records/ask-benish` sends a standalone general multipart question with document `files` and `audio_files`; the app does not attach a family member.
- Ask does not create or reuse a consultation session. Its modal state is memory-only and is cleared on close or app termination.

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
