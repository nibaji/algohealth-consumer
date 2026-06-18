# 🤖 AI Agent Instructions - AlgoHealth Consumer

**This is the SINGLE SOURCE OF TRUTH for all AI agents** (Qwen, Gemini, Claude, Copilot, etc.)

No other instruction files needed. Just read this one.

---

## 🚀 Quick Start (READ THIS FIRST)

When working on this codebase:

1. ✅ **Read this file** - All rules are here
2. ✅ **Check the codebase documentation** - For architecture details
3. ✅ **Run verification** before submitting: `bunx tsc --noEmit && bun run lint`
4. ✅ **Ensure skills are synced**: Run `node scripts/setup-skills.js` to ensure the required agent skills are installed globally in the Antigravity directory and symlinked into `.agents/skills/` (ignored by git).

### 🚨 CRITICAL: Always Update Docs & Changelog Before Committing

**For EVERY code change, you MUST:**
1. **Update `changelog/upcoming.md`** (if it exists) - Add date and summary of changes
2. **Update relevant documentation** - If behavior, API, UX, or architecture changed
3. **Only then commit** - Never commit without updating changelog and docs first

**This is NON-NEGOTIABLE.** Every commit must have corresponding documentation updates.

---

## 🏗️ Architecture Overview (Updated 2026-06-12 - SDK 56)

### Tech Stack
- **Expo SDK**: 56
- **React**: 19.2.3 (with React Compiler enabled)
- **React Native**: 0.85.3
- **JavaScript Engine**: Hermes V1 (opt-in)
- **Expo Router**: 56.2.10

### State Management
- **Context Providers** - Use React 19 syntax for contexts.
- **Feature Hooks** - Business logic in hooks.
- **Atomic State Preferred** - For complex global state, consider Zustand/Jotai pattern

### React 19 Patterns
```typescript
// Context Provider (no .Provider suffix)
<AuthContext value={{...}}>{children}</AuthContext>

// Context consumption (use instead of useContext)
import { use } from 'react';
const context = use(AuthContext);
```

### Component Structure
- **Split Components** - Large components split into focused files
- **Pressable** - Used throughout (replaced TouchableOpacity)
- **FlashList** - Used for all lists (replaced FlatList)
- **Reanimated** - All animations use react-native-reanimated (UI thread)

### Performance Guidelines (CallStack Best Practices)

**Priority Order:**
1. **FPS & Re-renders** (CRITICAL) - Profile first, fix unnecessary renders
2. **Bundle Size** (CRITICAL) - Analyze and optimize
3. **TTI Optimization** (HIGH) - Startup time matters
4. **Animations** (MEDIUM) - Use Reanimated for 60 FPS

**Profiling Commands:**
```bash
# Open React Native DevTools
# Press 'j' in Metro, or shake device → "Open DevTools"

# Analyze bundle size
npx react-native bundle --entry-file index.js --bundle-output output.js \
  --platform ios --dev false --minify true
npx source-map-explorer output.js --no-border-checks
```

**Common Fixes:**
- Replace ScrollView with FlashList for lists
- Use `useDeferredValue` for expensive computations
- Use Reanimated for all animations (UI thread, not JS thread)
- Profile before optimizing - measure first!

## 🚫 CRITICAL RULES (NON-NEGOTIABLE)

### TypeScript
- ❌ **NEVER use `any`** - Use specific types, interfaces, or `unknown`
- ❌ **NEVER use `as any`** - Fix the root cause
- ✅ **Always add explicit return types** to functions
- ✅ **Fix ALL TypeScript errors** before submitting

### Architecture
```
app/          → Routing ONLY (no business logic)
components/   → UI ONLY (no API calls, no complex state)
features/     → Business logic by domain
services/     → API calls and side effects
hooks/        → Reusable logic
utils/        → Pure functions only
theme/        → Design tokens
database/     → Storage wrappers
```
- ❌ **NEVER call APIs from components** - Use services
- ❌ **NO cross-feature imports** - Keep features isolated
- ❌ **NO circular dependencies**

### Styling
- ❌ **NEVER hardcode colors** - Use `theme.colors.*`
- ❌ **NEVER use magic numbers** - Use `theme.spacing.*`, `theme.fontSize.*`
- ✅ **All styling from `@/theme`**

### JSX Rendering
- ❌ **NEVER use `&&` for conditional rendering in JSX**
- ✅ **ALWAYS use** `condition ? <Component /> : null` (or `condition ? value : null`)

```typescript
// ✅ CORRECT
import { theme } from '@/theme';
padding: theme.spacing.lg,
color: theme.colors.primary.DEFAULT,

// ❌ WRONG
padding: 16,
color: '#007AFF',
```

### Animations (react-native-reanimated)
- ✅ **Use Reanimated for ALL animations** - Runs on UI thread, not JS thread
- ✅ **Only animate `transform` and `opacity`** - GPU-accelerated properties
- ✅ **Use `useSharedValue` + `useAnimatedStyle`** - Modern Reanimated v4 API

```typescript
// ✅ CORRECT (Reanimated v4 - UI thread)
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
scale.value = withTiming(1.2, { duration: 500 });

// ❌ WRONG (react-native Animated - JS thread)
import { Animated } from 'react-native';
const scale = useRef(new Animated.Value(1)).current;
Animated.timing(scale, { toValue: 1.2 }).start();
```

### Security
- ❌ **NEVER log tokens or PII**
- ❌ **NEVER store tokens in AsyncStorage** - Use SecureStore
- ✅ **Route guards required** for protected screens
- ✅ **Assume client is compromised**

---

## 🔧 Optimization Workflow (CallStack Method)

**For ANY performance issue, follow this cycle:**

```
1. MEASURE → 2. OPTIMIZE → 3. RE-MEASURE → 4. VALIDATE
```

### 1. Measure (Profile First!)
```bash
# Open React Native DevTools
# Press 'j' in Metro terminal or shake device → "Open DevTools"
# Go to Profiler tab → Record → Perform action → Stop
```

### 2. Optimize (Apply Targeted Fix)
| Problem | Fix |
|---------|-----|
| App feels slow/janky | Profile → Fix re-renders |
| List scroll jank | Use FlashList, memoize items |
| Animation drops frames | Use Reanimated (UI thread) |
| Slow startup (TTI) | Reduce bundle, lazy load |
| Large app size | Analyze bundle, remove deps |

### 3. Re-measure (Same Test)
Run the same profiling test to get updated metrics.

### 4. Validate (Confirm Improvement)
- FPS: 45 → 60 ✅
- TTI: 3.2s → 1.8s ✅
- Bundle: 2.1MB → 1.6MB ✅

**If metrics didn't improve, revert and try the next fix!**

---

## 📦 Expo Best Practices

### Running the App

**CRITICAL: Always try Expo Go first before creating custom builds.**

```bash
# 1. Start with Expo Go
npx expo start

# 2. Only create custom builds when required
npx expo run:ios    # ❌ Don't use unless necessary
npx expo run:android # ❌ Don't use unless necessary
```

**You need custom builds ONLY when using:**
- Local Expo modules (custom native code in `modules/`)
- Apple targets (widgets, app clips, extensions)
- Third-party native modules not in Expo Go
- Custom native configuration not expressible in `app.json`

**Expo Go supports out of the box:**
- All `expo-*` packages (camera, location, notifications, etc.)
- Expo Router navigation
- Most UI libraries (Reanimated, gesture handler, etc.)
- Push notifications, deep links

### EAS Build Configuration

Ensure `eas.json` has proper profiles:

```json
{
  "cli": {
    "version": ">= 16.0.1",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true
    },
    "development": {
      "autoIncrement": true,
      "developmentClient": true
    }
  }
}
```

**Key settings:**
- `developmentClient: true` - Bundles expo-dev-client for development builds
- `autoIncrement: true` - Automatically increments build numbers
- `appVersionSource: "remote"` - Uses EAS as source of truth for version numbers

### Code Style

- **File names**: Use PascalCase for components (e.g. `CommentCard.tsx`), camelCase for non-component files (e.g. `useComment.ts`, `commentService.ts`, `commentStyles.ts`). Use camelCase for folder names.
- **Imports**: Always use import statements at top, prefer path aliases over relative imports
- **Routes**: Routes belong in `app/` directory, never co-locate components there
- **Special characters**: Never use in file names
- **Cleanup**: Remove old route files when restructuring navigation

### Library Preferences

| Use | Don't Use |
|-----|-----------|
| `expo-audio` | `expo-av` (for audio) |
| `expo-video` | `expo-av` (for video) |
| `expo-image` with `source="sf:name"` | `expo-symbols`, `@expo/vector-icons` |
| `react-native-safe-area-context` | `SafeAreaView` from react-native |
| `process.env.EXPO_OS` | `Platform.OS` |
| `React.use` | `React.useContext` |
| `expo-image` | intrinsic `img` element |
| `expo-glass-effect` | Custom blur implementations |

### Responsiveness

- Always wrap root component in a scroll view for responsiveness
- Use `<ScrollView contentInsetAdjustmentBehavior="automatic" />` instead of `<SafeAreaView>`
- Apply `contentInsetAdjustmentBehavior="automatic"` to FlatList and SectionList
- Use flexbox instead of Dimensions API
- ALWAYS prefer `useWindowDimensions` over `Dimensions.get()`

### Styling Rules

- **Use StyleSheet.create()** for component styles (better performance, less GC pressure)
- **Inline styles** ONLY for truly dynamic values (e.g., `width: ${width}px`)
- Prefer flex gap over margin and padding
- Always account for safe area (stack headers, tabs, or ScrollView)
- Add entering/exiting animations for state changes
- Use `{ borderCurve: 'continuous' }` for rounded corners
- ALWAYS use navigation stack title instead of custom text element
- Use `contentContainerStyle` padding for ScrollView (reduces clipping)

**Why StyleSheet.create()?**
```tsx
// ✅ CORRECT: Sent to native once, better for FlashList, less GC pressure
const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: '#fff' }
});
<View style={styles.container} />

// ❌ WRONG: Creates new object every render
<View style={{ padding: 10, backgroundColor: '#fff' }} />
```

### Shadows

Use CSS `boxShadow` style prop. NEVER use legacy React Native shadow or elevation:

```tsx
// ✅ CORRECT
<View style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }} />

// ❌ WRONG
<View style={{ shadowColor: '#000', shadowOffset: {...} }} />
```

### Text Styling

- Add `selectable` prop to `<Text/>` displaying important data or errors
- Counters should use `{ fontVariant: 'tabular-nums' }` for alignment

### Navigation

```tsx
import { Link, Stack } from 'expo-router';

// Basic link
<Link href="/path" />

// Wrapping custom components
<Link href="/path" asChild>
  <Pressable>...</Pressable>
</Link>

// Stack with title
<Stack.Screen options={{ title: "Home" }} />

// Context menus
<Link href="/settings" asChild>
  <Link.Trigger>
    <Pressable><Card /></Pressable>
  </Link.Trigger>
  <Link.Menu>
    <Link.MenuAction title="Share" icon="square.and.arrow.up" />
  </Link.Menu>
</Link>
```

### Platform-Specific Code

```tsx
// ✅ CORRECT: Use EXPO_OS
if (process.env.EXPO_OS === 'ios') {
  // iOS-specific code
}

// ❌ WRONG: Don't use Platform.OS
if (Platform.OS === 'ios') {
  // Don't do this
}
```

### Native Modules

Only add native modules when absolutely necessary:

```bash
# Try Expo Go first
npx expo start

# If feature doesn't work, then add dev client
npx expo install expo-dev-client
npx expo run:ios
```

---

## 📁 Project Structure

```
algohealth-consumer/
├── app/                      # Expo Router (routing only)
├── assets/                   # Static assets (images, fonts)
├── components/               # UI components
├── constants/                # App constants and theme tokens
├── hooks/                    # Global reusable hooks
├── scripts/                  # Utility scripts
├── AGENTS.md                 # ← You are here
├── ENGINEERING_STANDARDS.md  # Detailed standards
└── README.md                 # Project overview
```

---

## 🔧 Common Tasks

### Adding a New Feature
1. Create feature folder: `src/features/yourFeature/`
2. Add types: `src/features/yourFeature/yourFeatureTypes.ts`
3. Create hook: `src/features/yourFeature/useYourFeature.ts`
4. Create service: `src/services/yourFeature/yourFeatureService.ts`
5. Create UI: `src/components/yourFeature/`

### Making API Calls
```typescript
// ✅ CORRECT: Use service layer
import { yourService } from '@/services/yourFeature/yourFeatureService';
const data = await yourService.getData();

// ❌ WRONG: Don't call API from component
const response = await axios.get('/api/endpoint');
```

### State Management
```typescript
// ✅ Use React hooks
const [messages, setMessages] = useState<BdMessage[]>([]);

// ✅ Memoize callbacks
const handleSend = useCallback((text: string) => {
  sendMessage(text);
}, [sendMessage]);

// ✅ Memoize computations
const filtered = useMemo(() => {
  return messages.filter(m => m.sender === 'user');
}, [messages]);
```

### File Size Limits
| Type      | Max Lines |
|-----------|-----------|
| Component | 250       |
| Hook      | 150       |
| Service   | 200       |
| Utility   | 100       |
| Constant  | 500       |

If exceeded → **split the file**.



---

## 🚫 Anti-Patterns to Avoid

```typescript
// ❌ Don't use any
const data: any = await fetchData();

// ✅ Do use specific types
interface UserData { id: string; name: string; }
const data: UserData = await fetchData();


// ❌ Don't call API from component
const handleSubmit = async () => {
  const response = await fetch('/api/submit', { ... });
};

// ✅ Do use service layer
const handleSubmit = async () => {
  await submitService.submit(data);
};


// ❌ Don't hardcode styles
const styles = StyleSheet.create({
  padding: 16,
  color: '#007AFF',
});

// ✅ Do use theme
const styles = StyleSheet.create({
  padding: theme.spacing.md,
  color: theme.colors.primary.DEFAULT,
});


// ❌ Don't create functions in render
<ListItem onPress={() => handlePress(id)} />

// ✅ Do memoize callbacks
const handlePress = useCallback((id: string) => {
  // ...
}, []);
<ListItem onPress={handlePress} />


// ❌ Don't use FlatList for large lists
<FlatList data={data} renderItem={...} />

// ✅ Do use FlashList
import { FlashList } from '@shopify/flash-list';
<FlashList data={data} renderItem={...} estimatedItemSize={80} />
```

---

## ✅ Pre-Submit Checklist

Before submitting code changes:

**🚨 DOCUMENTATION (MUST DO FIRST - BEFORE COMMIT):**
- [ ] **`changelog/upcoming.md` updated** (if applicable)
- [ ] **Relevant documentation updated** - If behavior/API/UX/architecture changed
- [ ] **Commit ONLY after** all documentation is updated

**CODE QUALITY:**
- [ ] **TypeScript**: `bunx tsc --noEmit` passes with zero errors
- [ ] **ESLint**: `bun run lint` passes with zero errors/warnings
- [ ] **No `any` types** used anywhere
- [ ] **No `as any` casts** used anywhere
- [ ] **Explicit return types** on all functions
- [ ] **Theme tokens** used for all styling
- [ ] **API calls** in service layer only
- [ ] **No console.log** with sensitive data (tokens, PII)
- [ ] **File sizes** within limits
- [ ] **Absolute imports** used (no `../../`)
- [ ] **useEffect dependencies** complete
- [ ] **Callbacks memoized** with `useCallback`
- [ ] **Components memoized** with `React.memo` if re-rendering often

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **AGENTS.md** (this file) | **THE ONLY FILE YOU NEED** - Complete instructions for all AI agents + React Native best practices |
| **ENGINEERING_STANDARDS.md** | Detailed standard practices |
| **README.md** | Project overview and setup |

---

## 📝 Documentation Update Guidelines

**🚨 CRITICAL RULE:** For **EVERY code change** (small or large), the AI agent MUST:
1. **Update `changelog/upcoming.md` FIRST** (if it exists)
2. **Update relevant architecture docs IF behavior/API/UX/architecture changed**
4. **ONLY THEN commit the changes**

**NEVER commit without updating documentation first.** This is a hard requirement.

### Required for Every Change

1. **Update Changelog FIRST**
   - Add entries to `changelog/upcoming.md` for every shipped code change before a new tag exists.
   - Keep entries concise and factual with date, scope, and affected files.
   - Format: `- YYYY-MM-DD: Brief description of change. Changed in \`file1.ts\`, \`file2.ts\`.`

2. **Assess Documentation Impact**
   - Check whether behavior, API, UX, architecture, or setup changed.
   - If changed, update relevant docs and/or `README.md`.
   - If not changed, add an explicit note in the final handoff: `No documentation impact`.

3. **When the user asks to tag/release:**
   - choose release identifier format: `YYYYMMDD.N` (always include `.N`)
     - first release of the day: `YYYYMMDD.1`
     - next same-day releases: `YYYYMMDD.2`, `YYYYMMDD.3`, ...
   - create `changelog/<release-version>.md` using the relevant content from `changelog/upcoming.md`
   - clear/move released content out of `changelog/upcoming.md`
   - update `CHANGELOG.md` index links
   - update app version strings to exactly match `<release-version>` in all app version sources (this format is iOS-safe because it is two numeric segments):
     - `package.json` (`version`)
     - `app.json` (`expo.version`)
     - `src/constants/version.ts` (`APP_VERSION`)

### When to Update Documentation

1. **New Feature Added**
   - Create new documentation if feature is substantial
   - Update `changelog/upcoming.md` (or dated changelog file only at tag time)

2. **API Changes**
   - Update request/response formats in relevant docs
   - Note endpoint changes (port, path, parameters)
   - Update schema definitions

3. **Architecture Changes**
   - Update architecture diagrams if any
   - Note new files/folders in project structure
   - Update state management patterns if changed

4. **Breaking Changes**
   - Add to `changelog/upcoming.md` until the release tag is created
   - Note migration steps if needed
   - Update affected component documentation

### Documentation Standards

- **Code Examples**: Use TypeScript with proper types
- **API Endpoints**: Include method, URL, headers, body, response
- **User Flows**: Use arrow diagrams (→) to show flow
- **UI States**: Document all states (loading, empty, error, success)
- **Testing**: Include checklist for manual verification

### Example: Adding a New Feature

\`\`\`markdown
### X. New Feature Name
**Location:** \`src/features/new-feature/\`, \`src/components/\`, \`src/services/\`

#### Components:
- \`NewFeatureModal\` - Main component description
- \`NewFeatureItem\` - Item component description

#### Key Functionality:
- **Feature 1** - Description
- **Feature 2** - Description

#### API Integration:
\`\`\`typescript
// Example usage
await apiService.newFeature.getData();
\`\`\`

#### Request Format:
\`\`\`
POST /endpoint
Body: { field: "value" }
\`\`\`
\`\`\`

---

## 🆘 When Stuck

If you encounter:
- ❌ Cannot fix TypeScript error without breaking type safety
- ❌ Need to add a new dependency
- ❌ Cannot satisfy a requirement safely
- ❌ Unclear about architecture or feature behavior

**STOP** and explain the issue to the user. Do not proceed with unsafe changes.

---

## 🎯 Performance Best Practices

### List Rendering
```typescript
// ✅ Use FlashList for all lists
import { FlashList } from '@shopify/flash-list';

// ✅ Memoize list items
const ListItem = React.memo(({ item }) => { ... });
ListItem.displayName = 'ListItem';

// ✅ Stabilize callbacks
const renderItem = useCallback(({ item }) => (
  <ListItem item={item} />
), []);

const keyExtractor = useCallback((item) => item.id, []);
```

### State Updates
```typescript
// ✅ Only update if data changed
setMessages(prev => {
  if (arraysAreEqual(prev, newMessages)) return prev;
  return newMessages;
});

// ✅ Use functional updates for dependent state
setMessages(prev => [...prev, newMessage]);
```

### Scroll Optimization
```typescript
// ✅ Load local data first, fetch server after scroll
const loadHistory = async (tabId) => {
  const local = await db.getMessages(tabId);
  setMessages(local); // Instant scroll
  
  setTimeout(async () => {
    const synced = await syncService.fetch(tabId);
    if (synced.length > local.length) {
      setMessages(prev => [...prev, ...synced]);
    }
  }, 500); // After scroll completes
};
```

---

## 📝 Code Examples

### Component Template
```typescript
import { theme } from '@/theme';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(() => {
    setLoading(true);
    onPress();
  }, [onPress]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
});

export default MyComponent;
```

### Hook Template
```typescript
import { useCallback, useState } from 'react';

interface UseMyHookReturn {
  data: string[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

export const useMyHook = (): UseMyHookReturn => {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await myService.getData();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, fetchData };
};
```

### Service Template
```typescript
import { apiClient } from '@/services/api/api-client';

interface GetDataResponse {
  id: string;
  name: string;
}

export const myService = {
  getData: async (): Promise<GetDataResponse[]> => {
    const response = await apiClient.get<GetDataResponse[]>('/endpoint');
    return response.data;
  },
  
  postData: async (data: { name: string }): Promise<GetDataResponse> => {
    const response = await apiClient.post<GetDataResponse>('/endpoint', data);
    return response.data;
  },
};
```

---

## 🎨 Theme System

All styling uses the centralized theme system:

```typescript
import { theme } from '@/theme';

// Colors
theme.colors.primary.DEFAULT
theme.colors.background.surface
theme.colors.text.primary
theme.colors.border.light

// Spacing (scale: none, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl, 10xl)
theme.spacing.md
theme.spacing.lg

// Font sizes
theme.fontSize.xs
theme.fontSize.sm
theme.fontSize.md
theme.fontSize.lg
theme.fontSize.xl

// Border radius
theme.radius.sm
theme.radius.md
theme.radius.lg
theme.radius.xl
theme.radius.full

// Shadows
import { shadows } from '@/theme';
shadows['md']
shadows['lg']
```

---

## ⚛️ React Native Best Practices

**Sources:** 
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills)
- [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills/tree/main/skills/react-native-best-practices)

### 🚨 CRITICAL Priority (Fix Immediately)

#### ❌ Never Use `&&` for JSX Conditional Rendering
```typescript
// ❌ WRONG: Do not use && in JSX rendering paths
{count && <Text>{count} items</Text>}
{name && <Text>{name}</Text>}
{isActive && 'Active'}
style={[styles.base, isActive && styles.active]}

// ✅ CORRECT: Always use ternary with explicit null fallback
{count > 0 ? <Text>{count} items</Text> : null}
{name ? <Text>{name}</Text> : null}
{isActive ? 'Active' : null}
style={[styles.base, isActive ? styles.active : null]}
```

This rule applies to all JSX render paths (components, text fragments, and style array entries).

#### ❌ Never Render Strings Outside Text Components
```typescript
// ❌ WRONG: Crashes in React Native
<View>Hello, {name}!</View>

// ✅ CORRECT: Wrap in Text component
<View>
  <Text>Hello, {name}!</Text>
</View>
```

#### ❌ Avoid Barrel Exports (Bundle Size)
```typescript
// ❌ WRONG: Loads ALL exports from components/index.ts
import { Button } from './components';

// ✅ CORRECT: Import directly from source
import Button from './components/Button';
```

#### ✅ Use FlashList for All Lists (Not ScrollView)
```typescript
// ❌ WRONG: ScrollView renders ALL items at once (crashes with 100+ items)
<ScrollView>
  {items.map((item) => <Item key={item.id} {...item} />)}
</ScrollView>

// ✅ CORRECT: FlashList virtualizes rendering
import { FlashList } from '@shopify/flash-list';
<FlashList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Item {...item} />}
  estimatedItemSize={50}
/>
```

### ⚡ HIGH Priority (Significant Performance)

#### ✅ Memoize List Items
```typescript
// ✅ Wrap list items in React.memo
const ListItem = React.memo(({ item, onPress }) => {
  return <TouchableOpacity onPress={onPress}>...</TouchableOpacity>;
});
ListItem.displayName = 'ListItem';
```

#### ✅ Hoist Callbacks and Avoid Inline Objects
```typescript
// ✅ Define callbacks at component root
const renderItem = useCallback(({ item }) => (
  <ListItem item={item} />
), []);

const keyExtractor = useCallback((item) => item.id, []);

// ✅ Pass to FlashList
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

#### ✅ Animate Transform and Opacity Only (GPU)
```typescript
// ✅ CORRECT: GPU-accelerated properties
animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
  opacity: fadeAnimation.value,
}));

// ❌ WRONG: Layout properties (triggers re-layout, causes jank)
animatedStyle = useAnimatedStyle(() => ({
  width: animatedWidth.value,
  marginLeft: offset.value,
}));
```

#### ✅ Use Pressable + GestureDetector Instead of TouchableOpacity
```typescript
// ✅ CORRECT: Better performance with Reanimated
import { Pressable } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

const tap = Gesture.Tap()
  .onStart(() => { scale.value = 0.95; })
  .onEnd(() => { scale.value = 1; });

<Pressable gesture={tap}>...</Pressable>
```

#### ✅ Use Native Navigators
```typescript
// ✅ CORRECT: Native stack and tabs
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// ❌ AVOID: JavaScript-based navigators (slower, no native animations)
import { createStackNavigator } from '@react-navigation/stack';
```

### 📦 Bundle Size Optimization

#### ✅ Analyze Bundle Size
```bash
# Create production bundle
npx react-native bundle \
  --entry-file index.js \
  --bundle-output output.js \
  --platform ios \
  --sourcemap-output output.js.map \
  --dev false --minify true

# Analyze what's in the bundle
npx source-map-explorer output.js --no-border-checks
```

#### ✅ Enable Tree Shaking
```typescript
// ✅ CORRECT: Direct imports enable tree shaking
import Button from './components/Button';
import Modal from './components/Modal';

// ❌ WRONG: Barrel imports prevent tree shaking
import { Button, Modal } from './components';
```

### 🧠 State Management

#### ✅ Minimize State, Derive Values
```typescript
// ❌ WRONG: Redundant state
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(items.length);
}, [items]);

// ✅ CORRECT: Derive from existing state
const [items, setItems] = useState([]);
const count = items.length; // Derived value, no state needed
```

#### ✅ Use Functional Updates
```typescript
// ✅ CORRECT: Functional update (always uses latest state)
setItems(prev => [...prev, newItem]);

// ❌ WRONG: Direct state reference (may use stale state)
setItems([...items, newItem]);
```

#### ✅ Use Atomic State for Complex Apps
```typescript
// ✅ Consider Jotai or Zustand for complex state
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const [count, setCount] = useAtom(countAtom);
```

### 🖼️ Images

#### ✅ Use expo-image for All Images
```typescript
// ✅ CORRECT: Optimized image loading
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### 📜 ScrollView Best Practices

#### ✅ Use contentInset for Header Spacing
```typescript
// ✅ CORRECT: Use contentInset instead of padding
<ScrollView
  contentInset={{ top: headerHeight }}
  automaticallyAdjustsScrollIndicatorInsets
>
  {content}
</ScrollView>
```

#### ✅ Use contentInsetAdjustmentBehavior for Safe Areas
```typescript
// ✅ CORRECT: iOS only
<ScrollView
  contentInsetAdjustmentBehavior="automatic"
>
  {content}
</ScrollView>
```

### 🔍 Performance Profiling

#### ✅ Profile Re-renders with DevTools
```bash
# Open React Native DevTools
# Press 'j' in Metro terminal or shake device → "Open DevTools"

# Profiler tab:
# 1. Click "Start profiling"
# 2. Perform the interaction
# 3. Click "Stop profiling"
# 4. Check flame graph for yellow components (slow renders)
```

#### ✅ Measure FPS for List Performance
```typescript
// ✅ Enable FPS overlay in development
// Shake device → Dev Settings → Show FPS Monitor

// Target: 60 FPS during scroll
// Problem: < 45 FPS indicates jank
```

---

## 🔐 Security Checklist

- [ ] No tokens in AsyncStorage (use SecureStore)
- [ ] No secrets in source code
- [ ] No logging of sensitive data
- [ ] Route guards on protected screens
- [ ] API validation on all responses
- [ ] Fail closed on errors
- [ ] HTTPS only
- [ ] Complete cleanup on logout

---

**© 2026 AlgoHealth Team** | Built with Expo, React Native, TypeScript
