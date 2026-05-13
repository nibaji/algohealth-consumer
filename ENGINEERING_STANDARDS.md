# Engineering Standards

## Expo + React Native + TypeScript

This document defines **mandatory, non-negotiable engineering standards** for all contributors and automated tooling applied to this repository.

Any generated or manually modified code **MUST comply** with this document.

If any rule cannot be satisfied safely, contributors **MUST STOP** and request clarification.

---

## 1. Project Context

- Framework: Expo + React Native
- Language: TypeScript (strict mode)
- Backend: **READY**
- API mode: **REAL APIs ONLY**
- Refactor policy: **Refactor, not rewrite**

Temporary shortcuts are NOT permitted.

---

## 2. Absolute Constraints (DO NOT VIOLATE)

1. Do NOT change runtime behavior unless required for correctness or security
2. Do NOT remove features
3. Do NOT introduce new dependencies unless unavoidable
4. Do NOT weaken security for convenience
5. Do NOT bypass ESLint or TypeScript errors
6. If a requirement cannot be met safely → **STOP and explain**

---

## 3. Folder Ownership & Architecture

```
app/          → routing only (Expo Router)
components/   → UI only (no business logic)
features/     → business logic by domain
services/     → API, storage, side effects
hooks/        → reusable logic
store/        → global state only
utils/        → pure functions only
theme/        → design tokens (colors, spacing, typography)
types/        → shared types
```

Rules:

- Move misplaced logic into the correct folder
- No cross-feature imports
- No circular dependencies

---

## 4. File Size Limits (Hard Rules)

| File Type | Max Lines |
| --------- | --------- |
| Component | 250       |
| Hook      | 150       |
| Service   | 200       |
| Utility   | 100       |
| Constant  | 500       |

If exceeded → file **must be split**.

---

## 5. Import Rules

- **Absolute imports only**
- No relative imports like `../../`
- Path aliases must be used consistently

---

## 6. API Rules (Backend Ready)

- All API access MUST go through a centralized API client
- Components and hooks MUST NOT call APIs directly
- API responses MUST be validated
- Fail closed on errors

---

## 7. Security Rules (Non-Negotiable)

- Assume the client is compromised
- No secrets in source code
- No tokens in AsyncStorage or global state
- Access token → memory only
- Refresh token → SecureStore only
- No logging of tokens or PII
- Route guards required
- HTTPS only

---

## 8. TypeScript & Linting

- strict: true
- **Strictly No `any`**: The use of `any` is strictly prohibited in the source code. Use specific interfaces, union types, or `unknown` where types are truly dynamic.
- **Strict typing in API Clients**: All API request/response objects must be strictly typed.
- No implicit `any`.
- **Explicit Return Types**: All functions, components, and hooks MUST have explicit return types.
- ESLint rules must pass without disable comments.

---

## 9. Styling Rules (CRITICAL)

- No hardcoded color values
- All colors must come from theme tokens
- No inline magic numbers for spacing, sizing, or radii
- Use theme tokens for all spacing, font sizes, border radii, and other dimensional values
- No inline styles except for dynamic values computed at runtime
- All styling should be consistent with the design system

---

## 10. Low-Level Coding Principles

- Single responsibility per file
- Pure functions by default
- Explicit over implicit
- Readability over cleverness

---

## 11. JSX Conditional Rendering Rule (CRITICAL)

- Do NOT use `&&` for conditional rendering in JSX.
- Always use explicit ternary rendering with `null` fallback:
  - `condition ? <Component /> : null`
  - `condition ? value : null`
- This includes JSX nodes, inline text fragments, and conditional style entries in style arrays.

---

## 12. Reference Documentation

When working on this codebase, contributors must consult both:

- This Engineering Standards document
- The AI Agent Instructions: `AGENTS.md`

Both documents provide essential context for understanding the application architecture and making appropriate changes.

---

## 13. Date Formatting Standard

All date formatting in the application must follow the **dd-mm-yyyy** format. Use the standardized utility functions:

- `formatDateToDDMMYYYY()` - For formatting Date objects or timestamps
- `formatEpochToDDMMYYYY()` - For formatting epoch timestamps specifically
- `isValidDate()` - For validating date values

These functions are located in `src/utils/date.ts` and should be imported wherever date formatting is needed.

Examples:
- ✅ Correct: `formatDateToDDMMYYYY(new Date())` → "15-02-2026"
- ❌ Incorrect: `formatDateToYYYYMMDD()` → old format
- ❌ Incorrect: `date.toLocaleDateString()` → varies by locale
- ❌ Incorrect: `date.toISOString()` → machine format

---

## 14. Mandatory Refactor Process

1. Identify violations
2. Propose plan
3. Apply changes
4. Show changed files only
5. Explain changes

---

## 15. Code Quality Standards

After refactoring, ensure that:
- All ESLint errors and warnings are resolved
- Unused variables and imports are removed
- React Hooks rules are followed properly
- Type safety is maintained
- Dependencies are properly declared in useEffect and other hooks
- No unescaped entities in JSX
- Array types use T[] instead of Array<T>
- No require() style imports in TypeScript files

---

## 16. Failure Rule

If rules cannot be met safely:

BLOCKED — clarification required
