# ✅ TravelAI — Improvement TODO (Score: 7.79 → 9.5+/10)

> **Evaluator:** Antigravity AI · **Date:** May 8, 2026  
> Items sorted by **impact × effort** ratio. Complete in order for maximum score gain.

---

## 🔴 PRIORITY 1 — Critical (Must Fix · ~2–3 hours total)

These are blockers that actively hurt your score with judges.

### 🔒 Security

- [ ] **[SECURITY] Remove API keys from `next.config.ts`**
  - **File:** `travel-ai/next.config.ts` lines 11–14
  - **Fix:** Delete the `env: { GEMINI_API_KEY, MAPS_API_KEY }` block entirely. Keys accessed only from `process.env` inside API route handlers are automatically server-side safe.
  - **Why critical:** These keys are currently embedded in the client-side JS bundle — visible to anyone via browser DevTools.
  - **Effort:** ⏱ 5 min | **Score impact:** +0.5 (Security)

- [ ] **[SECURITY] Inject `GEMINI_API_KEY` as a Cloud Run secret in production**
  - **File:** `cloudbuild.yaml` Step 3 + Cloud Run console
  - **Fix:** Add `--set-secrets=GEMINI_API_KEY=gemini-api-key:latest` to the `gcloud run deploy` command. Create the secret in Secret Manager first.
  - **Why critical:** The live demo runs in demo mode — judges see no real AI. This single change makes the live app fully functional.
  - **Effort:** ⏱ 15 min | **Score impact:** +0.7 (Google Services)

### ☁️ Google Services

- [ ] **[GOOGLE] Connect Firestore to the live deployment**
  - **File:** Cloud Run environment vars + `lib/google-services.ts`
  - **Fix:** Create a Firestore database in `h2s-promptswar-8may26` (Native mode). Set env var `FIRESTORE_PROJECT_ID=h2s-promptswar-8may26` in Cloud Run. Grant `roles/datastore.user` to the Cloud Run service account.
  - **Why critical:** All trip data is currently lost on every Cloud Run restart — judges lose demo state.
  - **Effort:** ⏱ 20 min | **Score impact:** +0.5 (Google Services)

- [ ] **[GOOGLE] Fix Firestore client — use singleton pattern**
  - **File:** `travel-ai/lib/google-services.ts` lines 62, 82, 97, 118, 133
  - **Fix:** Initialize `Firestore` once at module level inside a `getFirestore()` function, not inside each `db.*` method call (currently causes ~50–100ms extra latency per request).
  - **Effort:** ⏱ 20 min | **Score impact:** +0.3 (Efficiency + Google Services)

---

## 🟠 PRIORITY 2 — High Impact (Should Fix · ~4–5 hours total)

### 🧪 Testing

- [ ] **[TEST] Add real API route handler tests**
  - **File:** `travel-ai/__tests__/routes.test.ts` (new file)
  - **Fix:** Import and invoke the actual route handlers (`import { POST } from '@/app/api/trips/route'`). Current `api.test.ts` tests locally-defined mock builders — not the real route code.
  - **Effort:** ⏱ 60 min | **Score impact:** +0.4 (Testing)

- [ ] **[TEST] Add Gemini fallback/demo-mode unit test**
  - **File:** `travel-ai/__tests__/gemini.test.ts` (new file)
  - **Fix:** Mock `process.env.GEMINI_API_KEY = undefined` and verify `parseNaturalLanguageIntent` returns the fallback result without calling the Gemini SDK.
  - **Effort:** ⏱ 30 min | **Score impact:** +0.3 (Testing)

- [ ] **[TEST] Add at least 1 React component test**
  - **File:** `travel-ai/__tests__/OnboardingWizard.test.tsx` (new file)
  - **Fix:** Use `@testing-library/react` to render `<OnboardingWizard>` and assert step navigation and input rendering.
  - **Effort:** ⏱ 45 min | **Score impact:** +0.3 (Testing)

- [ ] **[TEST] Remove `--passWithNoTests` from `test:ci` script**
  - **File:** `travel-ai/package.json` line 13
  - **Fix:** `"test:ci": "jest --ci --coverage"` (remove `--passWithNoTests` to enforce coverage gates)
  - **Effort:** ⏱ 2 min | **Score impact:** +0.1 (Testing)

### 🔒 Security

- [ ] **[SECURITY] Fix default CORS wildcard `*`**
  - **File:** `travel-ai/middleware.ts` line 22
  - **Fix:** Default to the Cloud Run URL instead of `*`:
    ```typescript
    const origin = process.env.ALLOWED_ORIGIN || 'https://travel-ai-578619311654.us-central1.run.app';
    response.headers.set('Access-Control-Allow-Origin', origin);
    ```
  - **Effort:** ⏱ 5 min | **Score impact:** +0.2 (Security)

- [ ] **[SECURITY] Add prompt injection guard in Gemini client**
  - **File:** `travel-ai/lib/gemini.ts` lines 51–68
  - **Fix:** Run user input through `sanitizeString()` from `lib/security.ts` before interpolating it into the Gemini prompt template.
  - **Effort:** ⏱ 15 min | **Score impact:** +0.2 (Security)

### ♿ Accessibility

- [ ] **[A11Y] Make destination cards keyboard-accessible**
  - **File:** `travel-ai/app/page.tsx` lines 192–208
  - **Fix:** Add `role="button"`, `tabIndex={0}`, `aria-label`, and `onKeyDown` handler to `<motion.div>` destination cards.
  - **Effort:** ⏱ 15 min | **Score impact:** +0.3 (Accessibility)

- [ ] **[A11Y] Fix decorative emoji & loading spinner ARIA**
  - **File:** `travel-ai/app/page.tsx` lines 74–75, 133–136
  - **Fix:**
    - Logo emoji: `<span aria-hidden="true">✈️</span>`
    - Spinner SVG: add `aria-label="Loading"` and `role="img"` on the `<svg>` element
  - **Effort:** ⏱ 10 min | **Score impact:** +0.2 (Accessibility)

- [ ] **[A11Y] Add `aria-disabled` to loading submit button**
  - **File:** `travel-ai/app/page.tsx` line 128
  - **Fix:** `<button disabled={isLoading} aria-disabled={isLoading} ...>`
  - **Effort:** ⏱ 2 min | **Score impact:** +0.1 (Accessibility)

---

## 🟡 PRIORITY 3 — Medium Impact (Good to Have · ~3–4 hours)

### ☁️ Google Services

- [ ] **[GOOGLE] Replace simulated map with Google Maps Static API**
  - **File:** `travel-ai/components/map/MapView.tsx`
  - **Fix:** Use the Maps Static API to render a real map image with activity pin markers:
    ```
    https://maps.googleapis.com/maps/api/staticmap?center=Tokyo&zoom=13&size=800x400&markers=35.7148,139.7967&key=MAPS_API_KEY
    ```
    No JS SDK needed — just a URL with `markers=` params per activity.
  - **Effort:** ⏱ 45 min | **Score impact:** +0.4 (Google Services — moves Maps from "architecture-ready" to "active")

- [ ] **[GOOGLE] Add a minimal Pub/Sub publish on trip creation**
  - **File:** `travel-ai/app/api/trips/route.ts` + `lib/google-services.ts`
  - **Fix:** After saving a trip, publish a message to a `trip-created` Pub/Sub topic. Even fire-and-forget demonstrates the event-driven pattern.
  - **Effort:** ⏱ 30 min | **Score impact:** +0.2 (Google Services)

- [ ] **[GOOGLE] Enable Firebase Auth with Google Sign-In**
  - **File:** new `components/auth/GoogleSignIn.tsx`
  - **Fix:** Add a "Sign in with Google" button using Firebase Auth client SDK. Store `uid` in Zustand store and pass it to trip creation API calls.
  - **Effort:** ⏱ 60 min | **Score impact:** +0.3 (Google Services)

### ⚡ Efficiency

- [ ] **[PERF] Lazy-load seed data only in demo mode**
  - **File:** `travel-ai/lib/gemini.ts` line 265 + `travel-ai/app/page.tsx` line 47
  - **Fix 1:** Replace `require('./seed-data')` with `await import('./seed-data')`
  - **Fix 2:** In `page.tsx`, call `loadSampleData()` only inside the `catch` block, not unconditionally on every trip creation
  - **Effort:** ⏱ 15 min | **Score impact:** +0.2 (Efficiency)

- [ ] **[PERF] Add `loading.tsx` for dashboard route**
  - **File:** `travel-ai/app/dashboard/loading.tsx` (new file)
  - **Fix:** Create a skeleton loading UI using Next.js `loading.tsx` streaming convention to improve perceived performance.
  - **Effort:** ⏱ 20 min | **Score impact:** +0.1 (Efficiency + UX)

### 🧑‍💻 Code Quality

- [ ] **[CODE] Fix duplicate Tokyo/Paris emoji**
  - **File:** `travel-ai/app/page.tsx` line 12
  - **Fix:** Change Paris emoji from `🗼` (same as Tokyo) to `🥐` or `🎨`
  - **Effort:** ⏱ 1 min | **Score impact:** Cosmetic polish

---

## 🟢 PRIORITY 4 — Low Impact / Polish (Nice to Have · ~2–3 hours)

### 🧪 Testing

- [ ] **[TEST] Add E2E test with Playwright**
  - **Fix:** Install `@playwright/test`, write one flow: Landing → type query → submit → assert dashboard loads with a trip card.
  - **Effort:** ⏱ 60 min | **Score impact:** +0.3 (Testing)

### ☁️ Google Services

- [ ] **[GOOGLE] Add BigQuery event logging on itinerary generation**
  - **Fix:** Write one row to BigQuery (`trip_events` table) on itinerary generation: `trip_id`, `destination`, `budget`, `generated_at`. Demonstrates analytics integration.
  - **Effort:** ⏱ 45 min | **Score impact:** +0.2 (Google Services)

- [ ] **[GOOGLE] Implement Vertex AI Search stub → real call**
  - **File:** `travel-ai/lib/google-services.ts` lines 188–193
  - **Fix:** Uncomment and implement the `SearchServiceClient` call against a Discovery Engine data store with even 3 sample documents.
  - **Effort:** ⏱ 45 min | **Score impact:** +0.2 (Google Services)

### 🔒 Security

- [ ] **[SECURITY] Add Content-Security-Policy header**
  - **File:** `travel-ai/middleware.ts`
  - **Fix:** Add CSP header restricting script sources to `'self'` and `fonts.googleapis.com`. This is the gold standard XSS prevention layer.
  - **Effort:** ⏱ 20 min | **Score impact:** +0.2 (Security)

### ♿ Accessibility

- [ ] **[A11Y] Run Lighthouse accessibility audit**
  - **Fix:** `npx lighthouse https://travel-ai-578619311654.us-central1.run.app --only-categories=accessibility` and fix issues scoring below 90.
  - **Effort:** ⏱ 30 min | **Score impact:** +0.2 (Accessibility)

- [ ] **[A11Y] Add `aria-label` to all icon-only buttons in dashboard**
  - **Fix:** Any button rendering only an emoji/icon (close, expand, toggle) should have a descriptive `aria-label`.
  - **Effort:** ⏱ 20 min | **Score impact:** +0.1 (Accessibility)

---

## 📈 Projected Score After Completion

| Dimension | Current | After P1 | After P1+P2 | After All |
|-----------|---------|----------|-------------|-----------|
| Code Quality | 8.5 | 8.7 | 9.0 | **9.2** |
| Security | 8.0 | 9.0 | 9.5 | **9.8** |
| Efficiency | 7.5 | 7.8 | 8.2 | **8.5** |
| Testing | 7.0 | 7.0 | 8.0 | **9.0** |
| Accessibility | 7.5 | 7.5 | 8.5 | **9.0** |
| Google Services | 7.0 | 8.2 | 8.8 | **9.5** |
| Problem Alignment | 9.0 | 9.0 | 9.2 | **9.5** |
| **Overall** | **7.79** | **8.46** | **8.89** | **~9.5** |

> 🎯 **Priority 1 alone (3 hours) → raises score from 7.79 → 8.46**
> 🎯 **Priority 1 + 2 (8 hours total) → raises score to ~8.89**
> 🏆 **Full completion → ~9.5/10**

---

## ⏱ Suggested Execution Order (Time-Boxed)

```
Hour 1 — Security & Deployment (Highest ROI)
  ✦ Remove API keys from next.config.ts           [5 min]
  ✦ Inject GEMINI_API_KEY as Cloud Run secret     [15 min]
  ✦ Connect Firestore to deployment               [20 min]
  ✦ Fix Firestore singleton                       [20 min]

Hour 2 — Testing
  ✦ Add real API route handler tests              [60 min]

Hour 3 — Accessibility + CORS + Prompt Safety
  ✦ Keyboard-accessible destination cards         [15 min]
  ✦ Fix decorative emoji ARIA                     [10 min]
  ✦ Fix CORS default                              [5 min]
  ✦ Add prompt injection guard                    [15 min]
  ✦ Add Gemini fallback unit test                 [30 min]

Hour 4 — Google Services
  ✦ Google Maps Static API integration            [45 min]
  ✦ Pub/Sub publish on trip create                [30 min]
```

---

*Generated from project evaluation — May 8, 2026*
