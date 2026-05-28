# Matrix Sandbox & Practice — Design Spec
**Date:** 2026-05-28  
**Status:** Approved by user  
**Target repo:** `armaan-hub/Machine_Deep_Learning`

---

## Problem

The existing chapters (especially Ch.2) teach linear algebra visually but don't let the learner practice freely. The user wants to:
1. Input any rotation angle and see the resulting rotation matrix auto-filled
2. Multiply any matrix M by any vector v and see the result
3. Make a prediction before computing — then check if they're right
4. Practice in a quiz mode with random challenges and a score counter

---

## Solution

A new **standalone page** (`chapters/sandbox.html`) added to the project. It does not modify any existing chapter. It is linked from `index.html` as a special "Practice" card.

---

## Architecture

### File
`chapters/sandbox.html` — self-contained HTML using the same shared JS/CSS stack:
- `js/math-core.js` — `multiplyVec`, `matLerp`, `det2`
- `js/renderer.js` — `CanvasRenderer`
- `js/animation.js` — `AnimationEngine` (tween for v → Mv animation)
- `js/ui-shared.js` — `UIShared` (hash persistence, keyboard shortcuts)
- `css/theme.css`, `css/layout.css`, `css/components.css`

No new shared files needed. All sandbox logic is inline in the page's IIFE.

### Layout
Two-column: canvas left (fills height), sidebar right (340px, scrollable).

---

## Components

### 1. Mode Toggle
Two-button toggle in sidebar top:
- **Free Explore** (default): user controls everything
- **Practice Quiz**: system generates the challenge

State: `s.mode = 'explore' | 'quiz'`

---

### 2. Rotation Builder
- Number input for angle θ in degrees (−360 to 360), plus a range slider synced to it
- On change: auto-fills the matrix M with `[[cosθ, −sinθ], [sinθ, cosθ]]`
- Label updates to show e.g. "Rotation 90°"
- Clearing the angle input or editing any matrix cell breaks the rotation link: θ input is cleared and label changes to "Custom"

---

### 3. Matrix M Input
- 2×2 grid of `<input type="number" step="0.01">` cells
- Editable at all times (user can override rotation builder values)
- Info row below: shows `det = X` and matrix type (e.g. "Rotation", "Scale", "Shear", "Singular")
- In Practice Quiz mode: matrix is locked (read-only), user cannot change it

---

### 4. Vector v Input
- Two number inputs: x and y (step 0.1, default [1, 0])
- In Practice Quiz mode: locked (read-only)

---

### 5. Prediction Panel
- Two number inputs: predicted x and y of M·v
- Visible in both modes
- A **"Compute & Check"** button (or press Enter) triggers the reveal

---

### 6. Result Panel (revealed after Compute)
Shows three things:

**a) Step-by-step formula:**
```
[ a  b ] [ x ]   [ a·x + b·y ]   [ result_x ]
[ c  d ] [ y ] = [ c·x + d·y ] = [ result_y ]
```
Filled in with actual numbers. Uses monospace layout.

**b) Correctness badges:**
- Each component independently: ✅ Correct (within ±0.05) or ❌ Off (shows "got X, actual Y")

**c) Canvas animation:**
- On Compute: smooth tween animates v → Mv on canvas (500ms)
- Canvas always shows: ghost grid (identity), transformed grid (M applied), v vector (steel blue `#7a82a8`), Mv vector (gold `#f7c948`), user's prediction vector (purple `#a78bfa`, dotted)

---

### 7. Canvas
- `CanvasRenderer` grid showing identity ghost + current M applied to grid lines
- Three vectors drawn: `v` (input), `Mv` (actual output), `pred` (prediction, dotted, only shown after Compute)
- Angle arc drawn when matrix is a rotation (det ≈ 1, no shear)
- Click-to-set vector v: clicking canvas sets v to clicked world coordinate (snapped to nearest 0.5 unit)
- **Compute & Check** button is disabled (greyed out) if either prediction field is empty
- Resize handled via `window.addEventListener('resize', () => r.resize())`

---

### 8. Practice Quiz Mode
**New Challenge flow:**
1. User clicks "New Challenge" button
2. System picks random M from 8 preset-style matrices (integer or simple decimal entries — rotations, scales, shears, reflections, mixed)
3. System picks random v: integer components in range [−3, 3], not both zero
4. Matrix and vector inputs are shown but locked (read-only)
5. User fills in prediction and clicks Compute & Check
6. Score updates: `correct / total` (a "correct" attempt = both components within ±0.05)
7. "New Challenge" button remains available for next round

**Score display:** `Score: N / T` badge in page header, persists across challenges within the session (not saved to URL hash — resets on reload).

**Random matrix pool (8 entries):**
- Rotate 45°, Rotate 90°, Rotate 180°
- Scale ×2, Scale ×0.5
- Shear `[[1,1],[0,1]]`
- Reflect y-axis `[[-1,0],[0,1]]`
- Random integer 2×2 with det ≠ 0 (generated fresh: retry until `|det| > 0.1`)

---

## State Object

```js
const s = {
  mode: 'explore',      // 'explore' | 'quiz'
  M: [[1,0],[0,1]],     // current 2×2 matrix
  v: [1, 0],            // input vector
  pred: [null, null],   // user's prediction (null = not entered)
  result: null,         // actual Mv (null until Compute clicked)
  theta: null,          // degrees if rotation builder used, else null
  score: { correct: 0, total: 0 },
  revealed: false,      // whether result panel is shown
  animProg: 1,          // 0..1 for v→Mv tween
};
```

---

## URL Hash Persistence

Save/restore via `UIShared.saveHash / loadHash`:
- Key: `'sandbox'`
- Persisted: `{ M, v, mode, theta }`
- NOT persisted: `score`, `pred`, `result`, `revealed` (reset each load)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Compute & Check (if prediction filled) |
| N | New Challenge (in quiz mode) |
| R | Reset canvas / clear result |
| E | Switch to Explore mode |
| Q | Switch to Quiz mode |

---

## index.html Update

Add a "Practice" card to the chapter grid:
```
🔬 Matrix Sandbox & Practice
Free-form calculator + rotation builder + quiz mode
→ chapters/sandbox.html
```
Styled with a distinct border color (`#a78bfa`) to distinguish it from chapter cards.

---

## Out of Scope (v1.0)

- Score history / leaderboard
- 3D transformations
- Custom vector pools for quiz
- Keyboard-navigable matrix cells
- Export/share results

---

## Success Criteria

1. User can type `θ = 90` → matrix auto-fills to `[[0,−1],[1,0]]`
2. User can type any M and v → click Compute → see step-by-step formula with actual numbers
3. Prediction check correctly shows ✅/❌ per component
4. Practice Quiz generates a new challenge each time with a locked matrix/vector
5. Score counter increments correctly
6. Page works on `file://` protocol (no ES modules, no fetch)
7. No console errors on load or during any interaction
