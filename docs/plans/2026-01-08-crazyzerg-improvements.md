# CrazyZerg Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Улучшить геймплей: стрельба Гвардиана только по удержанию ЛКМ с наведением мышью; марины всегда двигаются (сложнее попасть); плюс набор небольших улучшений для “game feel”.

**Architecture:** Сохраняем прицеливание как “mouse → world aim point” (raycast по террейну) и добавляем “fire intent” (ЛКМ). `CombatSystem` стреляет только когда `isFiring === true` и есть валидная цель около точки прицела. Для маринов меняем поведение движения: вместо остановки в радиусе атаки — орбитальный/страйф-движ, сохраняя возможность стрелять.

**Tech Stack:** Three.js, TypeScript, Vite, Vitest.

---

## Feature Set (MVP)

1) **Guardian fires only on LMB hold** (no auto-fire without input)  
2) **Mouse aiming stays** (current ring indicator stays)  
3) **Marines keep moving while in range** (orbit/strafe)  

Non-goals (пока): pathfinding, cover system, сложные коллизии с препятствиями.

---

### Task 1: Add “fire intent” plumbing (pure helper)

**Files:**
- Create: `src/systems/fireIntent.ts`
- Test: `src/systems/fireIntent.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, expect, test } from 'vitest'
import { computeIsFiring } from './fireIntent'

describe('computeIsFiring', () => {
  test('LMB down => firing', () => {
    expect(computeIsFiring({ leftMouseDown: true, gameOver: false })).toBe(true)
  })
  test('game over => never firing', () => {
    expect(computeIsFiring({ leftMouseDown: true, gameOver: true })).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/systems/fireIntent.test.ts`
- Expected: FAIL because `computeIsFiring` doesn’t exist.

**Step 3: Write minimal implementation**
```ts
export function computeIsFiring(p: { leftMouseDown: boolean; gameOver: boolean }): boolean {
  return !p.gameOver && p.leftMouseDown
}
```

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/systems/fireIntent.test.ts`
- Expected: PASS.

**Step 5: Commit**
- `git add src/systems/fireIntent.ts src/systems/fireIntent.test.ts`
- `git commit -m "feat: add fire intent helper"`

---

### Task 2: Track LMB state in input

**Files:**
- Modify: `src/systems/InputSystem.ts`

**Step 1: Add left mouse down state**
- Add listeners `mousedown`/`mouseup` on `domElement`.
- Expose `isLeftMouseDown(): boolean`.

**Step 2: Manual verify**
- Run: `npm run dev`
- Expected: no errors; moving mouse still updates aim indicator.

**Step 3: Commit**
- `git add src/systems/InputSystem.ts`
- `git commit -m "feat: track left mouse button in input system"`

---

### Task 3: Make CombatSystem require LMB to fire

**Files:**
- Modify: `src/systems/CombatSystem.ts`
- Modify: `src/game/Game.ts`
- Modify tests: `src/systems/CombatSystem.test.ts`

**Step 1: Write failing test**
- Update `src/systems/CombatSystem.test.ts` to set `isFiring=false` and assert 0 projectiles.
- Add a second case: `isFiring=true` and assert projectile is created.
- Run: `npm test -- src/systems/CombatSystem.test.ts` (expect FAIL).

**Step 2: Implement minimal API**
- Add to `CombatSystem`:
  - `setFireIntent(isFiring: boolean): void`
- In `CombatSystem.update`, gate firing:
  - if `!isFiring` → skip firing (but keep projectile updates).
- In `Game.update`, compute `isFiring` using `computeIsFiring(...)` and call `combatSystem.setFireIntent(...)`.

**Step 3: Run tests**
- Run: `npm test -- src/systems/CombatSystem.test.ts`
- Expected: PASS.

**Step 4: Commit**
- `git add src/systems/CombatSystem.ts src/game/Game.ts src/systems/CombatSystem.test.ts`
- `git commit -m "feat: fire only while holding LMB"`

---

### Task 4: Aim selection policy (hard-to-hit friendly)

**Files:**
- Modify: `src/systems/aimAssist.ts`
- Modify: `src/systems/CombatSystem.ts`
- Test: `src/systems/aimAssist.test.ts`

**Step 1: Write failing tests for stricter aim**
- Reduce assist: set default `aimAssistRadius` to `2` (or add toggle).
- Add a test that `aimAssistRadius=0` means “no help” (returns `null` unless exact overlap).
- Run: `npm test -- src/systems/aimAssist.test.ts` (expect FAIL).

**Step 2: Implement**
- Make `aimAssistRadius` configurable in `Game` (constant at top): `const AIM_ASSIST_RADIUS = 2`.
- Pass it into `combatSystem.setAimAssistParams`.

**Step 3: Run tests**
- Run: `npm test -- src/systems/aimAssist.test.ts`
- Expected: PASS.

**Step 4: Commit**
- `git add src/systems/aimAssist.ts src/systems/aimAssist.test.ts src/systems/CombatSystem.ts src/game/Game.ts`
- `git commit -m "balance: reduce aim assist for manual shooting"`

---

### Task 5: Marines never stop moving (orbit/strafe movement)

**Files:**
- Modify: `src/entities/Enemy.ts`
- Test: `src/entities/EnemyMovement.test.ts`

**Step 1: Write failing test**
- Create a test that places a `Marine` inside `attackRange` of a target and calls `update(dt, targetPos, terrainHeight)`.
- Assert that `marine.position` changes after update (not stationary) even when within range.
- Run: `npm test -- src/entities/EnemyMovement.test.ts` (expect FAIL with current “stop in range” logic).

**Step 2: Implement minimal orbit behavior**
- In `Enemy.update`:
  - When within `attackRange`, set velocity to a perpendicular direction around the target (strafe).
  - Add small jitter timer (e.g., flip strafe direction every ~1–2s) to avoid perfect circles.
  - Clamp Y to `terrainHeight` as before.

**Step 3: Run test**
- Run: `npm test -- src/entities/EnemyMovement.test.ts`
- Expected: PASS.

**Step 4: Commit**
- `git add src/entities/Enemy.ts src/entities/EnemyMovement.test.ts`
- `git commit -m "feat: marines strafe instead of stopping in range"`

---

## Nice-to-Have Improvements (next iterations)

### Task 6: Telegraph + readability
- Add a subtle “target highlight” when aim-assist locks (tint/outline), and show `AIM_ASSIST_RADIUS` ring while firing.

### Task 7: Combat feel
- Add muzzle flash + short recoil animation for Marines and Guardian.
- Add impact sparks on hit + tiny dust on ground hits.

### Task 8: Difficulty scaling
- Wave scaling: more spawn points earlier, introduce “fast marine” variant, add accuracy falloff while strafing.

---

## Verification (every PR)

- Run: `npm test`
- Run: `npm run build`
- Manual: `npm run dev` (shooting only on LMB hold; marines keep moving; tracers visible; no console errors)

