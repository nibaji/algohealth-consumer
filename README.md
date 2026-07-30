# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) SDK 57 project using React Native 0.86.2 and React 19.2.3.

## Features

- **Family Circles**: Create, join, and manage family circles. Delete members or leave circles based on owner/self permission guards.
- **Onboarding Invite Flows**: Automatically detect invitations with options to Accept, Reject, or Decide Later.
- **Pending Invites Widget**: Dashboard notification badge and modal to accept or reject pending invites at any time.
- **Alerts and Push Notifications**: Android and iOS users receive Expo push notifications, see foreground notifications in-app, and can open Alerts from a push or the dashboard bell. Web users can review and mark clinical, reminder, and system alerts without any push registration.
- **In-app How-to Guide**: Open “How to Use the App?” from the question-mark button in the home header for current guidance on accounts, families, records, summaries, Ask, Consults, alerts, and sharing.
- **Route-aware Web Titles**: Browser tab titles reflect the current page while native navigation remains unchanged.
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

### Alerts and push notification flow

- On Android and iOS only, the app requests notification permission after authentication, obtains an Expo push token using the configured EAS project ID, and links it with `POST /alerts/add-device`.
- On Android and iOS, existing linked devices are checked with `GET /alerts/linked-devices` so app restarts do not create duplicate links. The returned device UUID is stored in SecureStore.
- Native logout removes the linked device with `DELETE /alerts/linked-devices/{device_id}` before clearing the local registration.
- `GET /alerts/unread-count` drives the dashboard bell badge on every platform. Native foreground pushes refresh the badge and display an in-app banner.
- Opening Alerts loads every page from `GET /alerts/`, then marks every unread alert through `PATCH /alerts/{alert_id}/read`. Failed read updates remain unread and can be retried with pull-to-refresh.
- On Android and iOS, tapping a push notification opens the Alerts screen.
- Web does not request notification permission, obtain or link push tokens, register push listeners, or delete linked devices. It only uses the alert listing, unread-count, and mark-as-read APIs.

The Alerts screen includes loading, empty, error, success, pull-to-refresh, and partial mark-as-read warning states.

Remote push notifications require an EAS development or production build with valid APNs and FCM credentials. Android remote push notifications are not available in Expo Go; local/foreground notification behavior can still be developed there where supported.

Android builds select their Firebase client configuration through `APP_ENV`. The development profile uses `google-services.dev.json` with `com.algohealthplus.consumer.dev`; preview and production use `google-services.prod.json` with `com.algohealthplus.consumer`. After installing a development build, start its matching Metro server with `bun run start:dev`.

### In-app how-to guide

Authenticated users can open **How to Use the App?** from the question-mark button immediately before Settings in the home header. The guide adapts the product requirement document to the features currently available in the app and clarifies where mobile and web behavior differs.

1. Install dependencies

   ```bash
   bun install
   ```

2. Start the app

   ```bash
   bun run start
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
