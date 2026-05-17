# HypergeometricCalculator Documentation

This document explains how `src/pages/HypergeometricCalculator` works today, based on the current implementation and its direct dependencies.

Audience: developers who understand programming logic but are not deeply familiar with JavaScript/TypeScript.

---

## 1. Overview

The `HypergeometricCalculator` page is a probability analysis tool for card draws.

At a high level, it:

1. accepts a deck code from the user,
2. validates and decodes that deck from backend APIs,
3. lets the user define one or more target card groups,
4. computes draw probabilities using hypergeometric math,
5. optionally creates a shareable link that stores the calculator setup on the backend.

How it fits in the app:

- Route: `/#/calculator` (registered in `src/router.ts`).
- Main page component: `src/pages/HypergeometricCalculator/index.tsx`.
- Child UI/calculation presentation components:
  - `components/CardSelector.tsx`
  - `components/ProbabilityResults.tsx`
  - `components/HypergeometricModal.tsx`
- Extra components in the same folder but currently not used by the main page:
  - `components/SaveShareControls.tsx`
  - `components/ShareResults.tsx`

---

## 2. User Purpose

From the user perspective, this page answers practical questions such as:

- "What is the chance I open exactly 1 copy of this group?"
- "What is the chance I open at least N cards from this group?"
- "How do those chances change when I include searcher cards?"
- "What are quick shortcut odds for draw/excavate style effects?"

Expected output:

- per-group probability cards with percentages,
- range probability (min..max),
- "at least minimum" probability,
- optional "with searchers" probability,
- quick odds (`destiny`, `greed`, `prosperity 3/6`, `desires`),
- optional share link for this exact configuration.

---

## 3. Code Structure

### 3.1 Main file responsibilities (`index.tsx`)

`HypergeometricCalculator` is the orchestration layer. It owns:

- page-level state (`CalculatorState`),
- deck validation and loading,
- share loading/saving,
- hypergeometric and quick-odds computations,
- wiring child components with props/callbacks,
- conditional rendering of each section.

### 3.2 Child components

- `CardSelector.tsx`
  - manages group-building UI (name, selected target copies, min/max desired count, optional searchers).
  - enforces copy-allocation constraints so the same physical copy is not overused across groups.
- `ProbabilityResults.tsx`
  - presentation-only rendering of already computed `ProbabilityResult[]`.
  - formats percentages and visual bars.
- `HypergeometricModal.tsx`
  - help/education modal explaining concepts and formulas.
  - supports "don't show for 24h" through `localStorage`.

### 3.3 Related helper/context dependencies

- `src/contexts/CardsSearchContext/index.tsx`
  - provides `searchCards(params)` used to fetch full card metadata by ID list.
- `src/utils/Functions.ts`
  - `groupCardsByQuantity`, `isExtraDeckCard`, `isWhatType`, and `CardWithQuantity`.
- `src/utils/Api.ts`
  - HTTP wrapper (`api.main.get/post` etc.).
- `src/utils/ApiTypes.ts`
  - core shared types like `Card` and `CategorizedDeck`.
- `src/utils/auth.ts`
  - `AuthManager.getAuthHeader()` for authenticated share save.

---

## 4. Main Data Flow

### 4.1 Initial state

On first render:

- `deckCode = ''`
- `handSize = 5`
- no deck loaded (`isDeckValid = false`, `deckData = null`, `cards = []`)
- no target groups and no results.
- help modal may auto-open after ~1 second if not hidden recently.

### 4.2 User input flow

1. User pastes deck code.
2. User clicks validate button.
3. `validateDeckCode()` calls backend `convert?code=...`.
4. If valid, the returned list of unique IDs is resolved into card metadata via `searchCards({ method: 'POST', id: uniqueCards })`.
5. The deck is transformed into main-deck card rows with quantities (`allCards -> mainDeckCards`).
6. User builds groups in `CardSelector`.
7. User clicks "Calculate".

### 4.3 Validation flow

Validation exists at multiple points:

- deck code cannot be empty (`trim()` check),
- API result must contain expected success shape,
- calculations only run if deck is valid and at least one group exists,
- group form clamps min/max desired values against selected card count,
- copy-allocation checks prevent selecting more copies than available.

### 4.4 Calculation flow

`calculateProbabilities()` loops through each target group and computes:

- exact probabilities per copy count (`0..min(targetCopies, handSize)`),
- aggregate probability for the configured range,
- aggregate probability for at least minimum,
- optional combined-pool probability when searchers are provided,
- quick odds using helper formulas.

Results are stored in `state.results`.

### 4.5 Result rendering flow

- if `state.results` exists: render `ProbabilityResults`.
- if no groups selected: render empty-state prompt.
- if share was created: render share block with copy button.

---

## 5. State Variables

This section includes important state in both the main page and `CardSelector` (which contains substantial logic).

## 5.1 `HypergeometricCalculator` state (`CalculatorState` + local modal state)

- `deckCode`
  - **Type:** `string`
  - **Initial:** `''`
  - **Meaning:** user-provided encoded deck string.
  - **Updated in:** `handleDeckCodeChange`, `loadSharedConfiguration`.
  - **Used in:** `validateDeckCode`, share payload creation, deck-code input UI.

- `handSize`
  - **Type:** `number`
  - **Initial:** `5`
  - **Meaning:** how many cards are drawn in base probability calculations.
  - **Updated in:** `handleHandSizeChange`, `loadSharedConfiguration`.
  - **Used in:** all core calculations and result labels.

- `deckData`
  - **Type:** `any | null` (practically `CategorizedDeck`-like object)
  - **Initial:** `null`
  - **Meaning:** decoded deck structure from backend.
  - **Updated in:** `validateDeckCode`, `loadSharedConfiguration`.
  - **Used in:** deriving `allCards`, gate checks before calculations.

- `cards`
  - **Type:** `Card[]`
  - **Initial:** `[]`
  - **Meaning:** card metadata records returned by cards search API.
  - **Updated in:** `validateDeckCode`.
  - **Used in:** matching deck IDs to full card objects (`allCards` derivation).

- `isLoading`
  - **Type:** `boolean`
  - **Initial:** `false`
  - **Meaning:** async operation in progress (deck validation/share-load).
  - **Updated in:** `validateDeckCode`, `loadSharedConfiguration`.
  - **Used in:** validate button disabled/spinner.

- `isDeckValid`
  - **Type:** `boolean`
  - **Initial:** `false`
  - **Meaning:** whether the current deck input is loaded and usable.
  - **Updated in:** `validateDeckCode`, `loadSharedConfiguration`.
  - **Used in:** controls visibility of hand-size panel, selector, results area.

- `targetCards`
  - **Type:** `CardGroup[]`
  - **Initial:** `[]`
  - **Meaning:** user-defined target groups.
  - **Updated in:** `addTargetGroup`, `removeTargetGroup`, `updateTargetGroup`, `validateDeckCode` reset, `loadSharedConfiguration`.
  - **Used in:** calculations, selector rendering, share payload.

- `results`
  - **Type:** `ProbabilityResult[] | null`
  - **Initial:** `null`
  - **Meaning:** latest computed output for all groups.
  - **Updated in:** `calculateProbabilities`, reset in group/hand/deck changes.
  - **Used in:** `ProbabilityResults` rendering.

- `shareableId`
  - **Type:** `string | null`
  - **Initial:** `null`
  - **Meaning:** server-generated identifier for sharing saved calculator config.
  - **Updated in:** `createShareableLink`.
  - **Used in:** share success panel and copy-link function.

- `isSharing`
  - **Type:** `boolean`
  - **Initial:** `false`
  - **Meaning:** share creation request in progress.
  - **Updated in:** `createShareableLink`.
  - **Used in:** share button disabled/spinner.

- `autoCalculate`
  - **Type:** `boolean | undefined`
  - **Initial:** `false`
  - **Meaning:** trigger one-time auto-run after loading shared config.
  - **Updated in:** `loadSharedConfiguration` (`true`) and post-auto-run effect (`false`).
  - **Used in:** auto-calculate `useEffect`.

- `isModalOpen` (separate `useState`, not in `CalculatorState`)
  - **Type:** `boolean`
  - **Initial:** `false`
  - **Meaning:** whether help modal is visible.
  - **Updated in:** `handleOpenModal`, `handleCloseModal`, auto-open effect.
  - **Used in:** `HypergeometricModal` props.

## 5.2 `CardSelector` local state

- `searchTerm`: filter text for target/searcher list views.
- `selectedCards`: selected target **instance IDs** in current form (`"cardId-copyIndex"`).
- `groupName`: current form's group label.
- `minDesiredCount`: lower bound of desired draws for this group.
- `maxDesiredCount`: upper bound of desired draws for this group.
- `selectedSearchers`: selected searcher instance IDs in current form.
- `showAddGroup`: toggles group form visibility.
- `editingGroupIndex`: `null` for new group, numeric index for edit mode.

These states are updated by local UI handlers and committed to parent via `onAddTargetGroup` / `onUpdateTargetGroup`.

---

## 6. Functions

This section focuses on important functions in current production flow, then key helper functions in `CardSelector`.

## 6.1 Main component functions (`index.tsx`)

- `validateDeckCode(deckCode: string): Promise<void>`
  - **Purpose:** verify deck code and load card data.
  - **Parameters:** `deckCode` raw user input.
  - **Returns:** `Promise<void>`.
  - **Steps:**
    1. reject empty/whitespace-only code.
    2. set loading state.
    3. call `api.main.get('convert?code=...')`.
    4. if valid response: call `searchCards` with `uniqueCards` IDs.
    5. save normalized deck state and reset groups/results.
    6. on failure, show toast and clear deck-valid flags.
  - **Side effects:** network calls, toasts, global state updates.
  - **Related state:** `deckCode`, `deckData`, `isDeckValid`, `isLoading`, `targetCards`, `results`, `cards`.
  - **When used:** user clicks deck-validate button.

- `calculateHypergeometric(populationSize, successStatesInPopulation, sampleSize, observedSuccesses): number`
  - **Purpose:** exact probability `P(X = observedSuccesses)` for hypergeometric distribution.
  - **Parameters:** `N`, `K`, `n`, `k`.
  - **Returns:** decimal probability in `[0,1]`.
  - **Steps:**
    1. compute combinations with internal `combination(n,k)`.
    2. compute numerator/denominator formula.
    3. guard division-by-zero.
  - **Side effects:** none.
  - **Related state:** used by `calculateProbabilities`.
  - **When used:** per-group exact distribution loop.

- `calculateProbabilities(): void`
  - **Purpose:** build all user-visible probability outputs.
  - **Parameters:** none.
  - **Returns:** void.
  - **Steps (per group):**
    1. count target copies (`group.cards.length`).
    2. compute exact distribution for 0..max copies in hand.
    3. sum probabilities for configured range (`min..max`).
    4. sum probabilities for at least minimum.
    5. if searchers exist, compute combined success-pool approximation.
    6. compute quick odds:
       - destiny draw (`h+1`)
       - greed draw (`h+2`)
       - prosperity 3/6 (two-stage complement)
       - desires (conditional sum over possible banished target counts)
    7. push `ProbabilityResult`.
    8. save `results` in state.
  - **Side effects:** updates `state.results`.
  - **Related state:** `isDeckValid`, `deckData`, `targetCards`, `handSize`, `deckSize`.
  - **When used:** calculate button and auto-calculate effect.

- `createShareableLink(): Promise<void>`
  - **Purpose:** save current setup to backend and get share ID.
  - **Parameters:** none.
  - **Returns:** `Promise<void>`.
  - **Steps:** validate prerequisites -> set sharing flag -> `POST calculator/save` with auth header -> store `shareableId` or show error.
  - **Side effects:** network call, toasts, state updates.
  - **Related state:** `isDeckValid`, `deckCode`, `handSize`, `targetCards`, `isSharing`, `shareableId`.
  - **When used:** share button click.

- `copyShareLink(): Promise<void>`
  - **Purpose:** copy generated share URL.
  - **Parameters:** none.
  - **Returns:** `Promise<void>`.
  - **Steps:** build URL -> try `navigator.clipboard` -> fallback to hidden textarea + `document.execCommand('copy')`.
  - **Side effects:** clipboard write, temporary DOM mutation, success toast.
  - **Related state:** `shareableId`.
  - **When used:** "Copy link" button in share success panel.

- `loadSharedConfiguration(shareableId: string): Promise<void>`
  - **Purpose:** load previously saved calculator setup by URL share ID.
  - **Parameters:** `shareableId`.
  - **Returns:** `Promise<void>`.
  - **Steps:**
    1. set loading.
    2. fetch `calculator/shared/:id`.
    3. extract `deckCode`, `handSize`, `targetCards`.
    4. fetch decoded deck via `convert?code=...`.
    5. set state and `autoCalculate = true`.
  - **Side effects:** network calls, toasts, state updates.
  - **Related state:** `deckCode`, `handSize`, `targetCards`, `deckData`, `isDeckValid`, `autoCalculate`.
  - **When used:** initial mount effect when URL has `share=` param.

- `shouldShowModal(): boolean`
  - **Purpose:** check whether help modal cooldown has expired.
  - **Parameters:** none.
  - **Returns:** true if modal should auto-open.
  - **Steps:** read `localStorage` key -> compare timestamp with now.
  - **Side effects:** localStorage read.
  - **Related state:** indirect UI behavior.

- UI state update handlers
  - `handleDeckCodeChange(value)`
  - `handleHandSizeChange(value)`
  - `addTargetGroup(group)`
  - `removeTargetGroup(index)`
  - `updateTargetGroup(index, group)`
  - **Purpose:** pure state mutations and result invalidation (`results = null` on relevant edits).

## 6.2 Key `CardSelector` functions

- `handleAddGroup()`
  - validates current form (`groupName`, selected targets),
  - clamps min/max to selected count,
  - emits `onAddTargetGroup(newGroup)`,
  - resets form state.

- `handleUpdateGroup()`
  - same logic as add, but emits `onUpdateTargetGroup(editingGroupIndex, updatedGroup)`.

- `editGroup(index)`
  - loads chosen group into local editing form and opens form UI.

- `getUsedCopiesCount(cardId)` and `getUsedOverallCopiesCount(cardId)`
  - count usage of a card across existing groups (targets only or targets+searchers),
  - ignore currently edited group to avoid self-collision while editing.

- `findNextAvailableInstanceId(cardId, maxQty)`
  - allocates next free physical copy (`id-index`) not already used elsewhere or in current draft form.
  - central to preventing over-allocation bugs.

- `addOneCopy(card)` / `removeOneCopy(card)`
  - increment/decrement selected target copies in current form.

- `isSearcherInstanceAvailable(instanceId)`
  - ensures searcher copy is not already consumed by other groups.

---

## 7. Hypergeometric Formula Explanation

Core formula in simple terms:

- You have a deck (`N` total cards).
- Some cards are "success" cards (`K` target cards).
- You draw `n` cards.
- You want the probability of getting exactly `k` targets.

Formula:

`P(X = k) = C(K, k) * C(N - K, n - k) / C(N, n)`

Meaning of each part:

- `C(a, b)` ("a choose b") = number of ways to pick `b` objects from `a` objects.
- numerator:
  - choose `k` successes from `K`,
  - choose remaining `n-k` cards from non-target cards.
- denominator:
  - all possible ways to draw `n` cards from the deck.

How this maps to code:

- `calculateHypergeometric(...)` computes exactly this expression.
- The inner `combination(n, k)` computes `C(n,k)` iteratively.
- "At least minimum" is not a separate formula; code sums multiple exact probabilities:
  - `sum(P(X = k)) for k >= min`.
- "Range min..max" similarly sums exact outcomes inside that interval.

Quick odds formulas:

- `destinyDraw` and `greedDraw` are implemented as "at least one success in first `h+s` cards".
- `prosperityOdds` uses a two-stage complement:
  - no target in opening hand AND no target in excavated cards.
- `conditionalDesires` uses conditional probability with weighted cases over how many target cards were banished.

---

## 8. TypeScript Notes

Key types used:

- `Card` (`ApiTypes.ts`): full card metadata structure from cards API.
- `CardWithQuantity` (`Functions.ts`): `Card` + `qty: number`.
- `CategorizedDeck` (`ApiTypes.ts`): decoded deck data with `fullDeck.main/side` arrays.
- `CardGroup` (`types.ts`):
  - `name`
  - `cards: string[]` (instance IDs like `"123-0"`)
  - `minDesiredCount`, `maxDesiredCount`
  - `searcherCards: string[]`
- `ProbabilityResult` (`types.ts`): shape for each result card.
- `CalculatorState` (`types.ts`): main page state model.

Beginner-friendly TS observations:

- `React.FC<Props>` means "functional component with typed props".
- `useState<Type>(initial)` gives type-safe state.
- `useCallback` and `useMemo` are used to avoid recomputation/recreation on every render.
- Several types are broad (for example `deckData: any | null`), which reduces static safety and increases runtime-check burden.

---

## 9. UI Logic

Rendered sections are strongly conditional:

- Deck input box is always visible.
- Hand size panel appears only after successful deck validation.
- Card selector appears only after successful deck validation.
- Results panel appears only after successful deck validation.
- `ProbabilityResults` appears only when `state.results` is non-null.
- Empty prompt appears when there are no target groups.
- Share success box appears when `shareableId` exists.
- Help modal can auto-open (new user) or open via floating button.

Dynamic behavior details:

- validate button disabled when:
  - loading, or
  - deck code empty.
- calculate button disabled when no target groups.
- share button disabled when:
  - invalid deck,
  - no groups,
  - already sharing.
- hand-size input is numeric with UI constraints `min=1`, `max=20`.
- card selection uses plus/minus quantity controls per unique monster row.
- searcher list is instance-based and visually marks unavailable copies.

Validation and feedback:

- user-visible errors/success mostly via toast context (`showError`, `showSuccess`, `showWarning`).
- selector form uses disabled submit and input clamping to prevent invalid min/max combinations.

---

## 10. Edge Cases

Handled by current code:

- empty deck code -> immediate error and reset invalid state.
- invalid convert API response -> deck marked invalid.
- network errors during deck validation/share load/share save -> toasts + loading flags reset.
- impossible combinations in helper `combination(n,k)` (`k>n`, `k<0`) -> returns `0`.
- divide-by-zero guards in probability formulas -> returns `0`.
- group with zero target copies -> skipped from results.
- min/max desired values are clamped to selected target count.
- copy-allocation guards prevent selecting more physical copies than available.
- clipboard fallback for older browser behavior.

Important edge behavior to know:

- quick odds `destiny` and `prosperity` are intentionally displayed as not applicable (`—`) when group minimum desired is 2 or more.
- calculations use **main deck only** (`extra` and `side` are excluded for probability math).

---

## 11. Maintenance Notes

Points to be careful with:

- Copy identity model is string-based (`"cardId-instanceIndex"`). Do not switch formats casually; many parsing points depend on `split('-')`.
- `CardSelector` has non-trivial allocation logic. Changes should preserve:
  - no duplicate usage across groups,
  - correct behavior while editing existing groups.
- `calculateProbabilities` contains several local math helpers (`combination`, `probAtLeastOne`, `prosperityOdds`, `conditionalDesires`). Any modification should include numeric regression tests.
- Deck loading and card metadata loading are coupled:
  - `allCards` depends on both `deckData` and `cards`.
  - shared-config loading currently sets `deckData` but does not fetch `cards`; this can affect derived card list/deck size and therefore results.
- API payload shape handling varies across code paths:
  - some endpoints expect nested payloads (`response.data.data`),
  - consistency checks are crucial if backend contract changes.
- The page lazy-loads heavy child components; if moving logic between files, preserve suspense boundaries to avoid user-visible layout regressions.

---

## 12. Possible Improvements

Grounded improvements from the current implementation:

1. **Fix shared-config card metadata loading**
   - After `loadSharedConfiguration`, also call `searchCards` (same as `validateDeckCode`) so `cards` and derived `deckSize` are always correct.

2. **Strengthen typing**
   - Replace `deckData: any | null` with `CategorizedDeck | null` and normalize response shapes in one place.

3. **Consolidate combination logic**
   - `combination` appears in both `calculateHypergeometric` and `calculateProbabilities`; centralizing reduces drift risk.

4. **Separate math from UI component**
   - Move probability functions to a dedicated utility module with unit tests.
   - This makes changes safer and easier for less experienced TS developers.

5. **Document or improve searcher probability model**
   - Current approach treats "targets + searchers" as one success pool for "at least min" calculation.
   - If gameplay semantics require stricter modeling, consider richer conditional logic and explicit assumptions in UI text.

6. **Remove or integrate unused components**
   - `SaveShareControls.tsx` and `ShareResults.tsx` are currently not used by `index.tsx`.
   - Keeping unused components can confuse maintenance unless intentional and documented.

---

## File Map (Quick Reference)

- Main page: `src/pages/HypergeometricCalculator/index.tsx`
- Types: `src/pages/HypergeometricCalculator/types.ts`
- Group builder: `src/pages/HypergeometricCalculator/components/CardSelector.tsx`
- Results renderer: `src/pages/HypergeometricCalculator/components/ProbabilityResults.tsx`
- Help modal: `src/pages/HypergeometricCalculator/components/HypergeometricModal.tsx`
- Unused in current page: `src/pages/HypergeometricCalculator/components/SaveShareControls.tsx`, `src/pages/HypergeometricCalculator/components/ShareResults.tsx`
- Direct dependencies:
  - `src/contexts/CardsSearchContext/index.tsx`
  - `src/utils/Functions.ts`
  - `src/utils/Api.ts`
  - `src/utils/ApiTypes.ts`
  - `src/utils/auth.ts`
  - `src/router.ts`
