# TravelAI — Final Enhancement Checklist

The goal is to resolve all outstanding linting/TypeScript errors to maximize the Code Quality score, and implement a secure, multi-stage Docker build. 

Please fix the following issues:

### 1. Auto-fix ESLint Errors
- **Target:** Entire codebase (`travel-ai` directory)
- **Action:** Run `npm run lint -- --fix` to automatically resolve missing `useEffect` dependencies, trailing spaces, and unescaped quotes in JSX (`react/no-unescaped-entities`).

### 2. Fix TypeScript `any` types in Firestore
- **Target File:** `travel-ai/lib/firestore.ts`
- **Action:** 
  - Locate `let _firestore: any = null;` on line 12 and change its type to `FirebaseFirestore.Firestore | null` (or an appropriate interface).
  - Locate the `any` cast at line 79 (`d: any`) and replace it with `FirebaseFirestore.QueryDocumentSnapshot`.
  - Ensure there are zero `@typescript-eslint/no-explicit-any` warnings in this file.

### 3. Remove Unused Variables
- **Target Files:**
  - `travel-ai/components/map/MapView.tsx` (Remove unused `Image`, `buildStaticMapUrl`, `markers`, `center`)
  - `travel-ai/components/onboarding/OnboardingWizard.tsx` (Remove unused `router`, `progress`)
  - `travel-ai/lib/gemini.ts` (Remove `daysMatch` and prefix `intent` with an underscore `_intent` on line 267 if it must remain in the signature).
  - `travel-ai/lib/seed-data.ts` (Remove unused type imports like `Itinerary`, `DayPlan`, etc.)
- **Action:** Delete the imports or assignments that are declared but never read to resolve all `@typescript-eslint/no-unused-vars` warnings.

### 4. Enable Next.js Standalone Output
- **Target File:** `travel-ai/next.config.ts`
- **Action:** Add `output: 'standalone'` to the `nextConfig` object so Next.js compiles a minimal server for Docker.

### 5. Create Multi-Stage Dockerfile
- **Target File:** `travel-ai/Dockerfile` (Create this new file)
- **Action:** Write a production-ready, multi-stage Dockerfile (deps -> builder -> runner). 
  - **Crucial Security Requirement:** In the `runner` stage, create a system group `nodejs` (gid 1001) and user `nextjs` (uid 1001), and use `USER nextjs` to run the application as a non-root user. 
  - Expose and bind to `PORT=8080`.
  - Copy `.next/standalone` and `.next/static` correctly.
