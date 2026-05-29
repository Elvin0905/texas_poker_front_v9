# Spectator Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full spectator mode to the Texas Hold'em frontend — players can watch a table without a seat, take an empty seat, stand up back to spectating, and switch tables while spectating — working against both the real server and the mock.

**Architecture:** Spectator state is held explicitly in the store (`isSpectator`, `canAct`, plus `heroSeat=null` while spectating). Incoming packets (`spectator_mode`, `seat_taken`, and `is_spectator`/`can_act` fields on `table_joined`/`table_state`) write those fields; the scene reads them to hide hero action buttons, show a "觀戰中" indicator, and make empty seats clickable. Outgoing actions (`stand_up`, `take_seat`, spectator `join_stakes`) are sent via the existing `this.app.sendPacket(type, data)` path. The mock (`mockSocketClient.js`) responds to the four packets and emits the matching events so every flow is testable offline.

**Tech Stack:** Vanilla ES modules, Phaser 3.90, Vite. No test framework — verification is `node --input-type=module --check <file>` for syntax plus manual mock walkthrough in the browser (`npm run dev`).

**Key facts established during planning:**
- Outgoing packets go through `this.app.sendPacket(type, data)` (scenes), NOT store methods. Store only handles INCOMING packets.
- The store `table_state` handler (store.js ~738) bounces hero to the lobby when `hero_seat` is null and not derivable. This MUST be guarded by `!isSpectator` or a spectator will be kicked out.
- Mock `performHeroTurn` (mockSocketClient.js ~949) already no-ops when hero is not in `this.table.players`. So if the spectator is simply absent from `players`, the existing hand simulation skips the hero with no further changes.
- Empty-seat "可入座" prompt objects (`sitPromptBg/Circle/Plus/Label`) already exist and are explicitly made non-interactive at tableScene.js ~5450-5451. The spectator change is to make `sitPromptBg` interactive when spectating.
- Action buttons are driven by `layoutActionButtons(allowed)` called at tableScene.js ~5794 with `allowed = actionRequest?.allowed`.
- Errors land in `store.state.lastError` with `store.state.errorVersion += 1` (store.js ~1229). The scene can watch `errorVersion` in `renderState()` to flash a toast.
- Top-right persistent buttons are `this.changeTableButton` (tableScene.js ~842) and `this.exitTableButton` (~886).
- Hand-end menu buttons are created at tableScene.js ~3003-3058 and toggled in `refreshHandEndMenu()` (~3770).
- Buyin modal confirm/cancel buttons are at gameLobbyScene.js ~736-766; `confirmJoinStakes()` at ~1291.

---

## File Structure

- Modify `src/shared/state/store.js` — spectator state fields + new/updated packet handlers (Tasks 1-4).
- Modify `src/shared/network/mockSocketClient.js` — spectator join, `take_seat`, `stand_up`, spectator `switch_room` (Tasks 5-8).
- Modify `src/variants/main_style/scenes/tableScene.js` — spectator UI: hide action buttons + indicator, clickable empty seats, stand-up button, hide top-right buttons, error toast (Tasks 9-13).
- Modify `src/variants/main_style/scenes/gameLobbyScene.js` — "觀戰" button in buyin modal (Task 14).

Each task ends with `node --input-type=module --check` on the edited file and a commit.

---

### Task 1: Add spectator state fields to the store

**Files:**
- Modify: `src/shared/state/store.js:156` (initial state) and the reset sites that already null `heroSeat`

- [ ] **Step 1: Add fields to initial state**

In the initial state object, immediately after the `heroSeat: null,` line (~156), add:

```js
      isSpectator: false, // 是否處於觀戰模式（不佔座位、不能行動）
      canAct: false, // 是否輪到 hero 且可操作（觀戰時永遠 false）
      previousSeat: null, // 退座前的座位（供 UI 參考）
      tableChips: 0, // 當前桌上籌碼（觀戰/入座檢查用）
```

- [ ] **Step 2: Reset spectator fields wherever heroSeat is reset**

There are reset sites that set `this.state.heroSeat = null;` (store.js ~251, ~307, ~364, ~477). At EACH of those four sites, on the line immediately after `this.state.heroSeat = null;`, add:

```js
        this.state.isSpectator = false;
        this.state.canAct = false;
```

(Leave `previousSeat`/`tableChips` alone at these sites — they are informational and harmless to retain.)

- [ ] **Step 3: Syntax check**

Run: `node --input-type=module --check src/shared/state/store.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add src/shared/state/store.js
git commit -m "feat(store): add spectator state fields"
```

---

### Task 2: Handle `spectator_mode` and `seat_taken` packets in the store

**Files:**
- Modify: `src/shared/state/store.js` — packet whitelist (~115-120) and add two `case` blocks after the `table_joined` case (which ends at ~628)

- [ ] **Step 1: Add packet types to the whitelist**

In the array starting at ~115 (`"table_joined", "table_state", ...`), add two entries so the packets are not dropped. After the `"turn",` entry (~119) add:

```js
    "spectator_mode",
    "seat_taken",
```

- [ ] **Step 2: Add the two handlers**

Immediately after the `table_joined` case's `break;` (~628), insert:

```js
      // 切換為觀戰模式（stand_up 成功，或本來就在觀戰）
      case "spectator_mode": {
        this.state.isSpectator = true;
        this.state.canAct = false;
        this.state.heroSeat = null;
        this.state.actionRequest = null;
        if (Object.prototype.hasOwnProperty.call(data, "previous_seat")) {
          this.state.previousSeat = data.previous_seat;
        }
        if (Number.isFinite(Number(data.table_chips))) {
          this.state.tableChips = Number(data.table_chips);
        }
        if (data.table && Object.keys(data.table).length > 0) {
          normalizeTableRoundTotalBet(data.table);
          this.syncHandContext(data.table);
          this.state.table = data.table;
        }
        break;
      }

      // 從觀戰入座成功
      case "seat_taken": {
        this.state.isSpectator = false;
        this.state.canAct = false;
        if (Number.isInteger(Number(data.hero_seat))) {
          this.state.heroSeat = Number(data.hero_seat);
        }
        this.state.heroJoinedWaiting = Boolean(data.waiting_this_hand);
        if (Number.isFinite(Number(data.table_chips))) {
          this.state.tableChips = Number(data.table_chips);
        }
        if (data.table && Object.keys(data.table).length > 0) {
          normalizeTableRoundTotalBet(data.table);
          this.syncHandContext(data.table);
          this.state.table = data.table;
        }
        break;
      }
```

- [ ] **Step 3: Syntax check**

Run: `node --input-type=module --check src/shared/state/store.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add src/shared/state/store.js
git commit -m "feat(store): handle spectator_mode and seat_taken packets"
```

---

### Task 3: Read spectator fields in `table_joined` / `table_state` and stop kicking spectators out

**Files:**
- Modify: `src/shared/state/store.js` — `table_joined` case (~601-628) and `table_state` case (~711-797)

- [ ] **Step 1: Read spectator fields in `table_joined`**

In the `table_joined` case, immediately after the existing `this.state.heroJoinedWaiting = Boolean(data.waiting_this_hand);` line (~616), add:

```js
        if (Object.prototype.hasOwnProperty.call(data, "is_spectator")) {
          this.state.isSpectator = Boolean(data.is_spectator);
        }
        if (Object.prototype.hasOwnProperty.call(data, "can_act")) {
          this.state.canAct = Boolean(data.can_act);
        }
        if (this.state.isSpectator) {
          this.state.heroSeat = null;
        }
        if (Number.isFinite(Number(data.table_chips))) {
          this.state.tableChips = Number(data.table_chips);
        }
```

Note: the existing `if (Number.isInteger(data.hero_seat))` block (~620) still runs; for a spectator join `hero_seat` is `null` so it is skipped, and the `if (this.state.isSpectator)` line above forces `heroSeat=null`.

- [ ] **Step 2: Guard the lobby-bounce in `table_state` so spectators are not kicked out**

The `table_state` case has a block (~738) that resets to the lobby when `hero_seat` is null and not derivable:

```js
        if (hasHeroSeatField && !hasValidHeroSeat && derivedHeroSeat === null) {
```

Change that condition to skip the bounce while spectating:

```js
        if (!this.state.isSpectator && hasHeroSeatField && !hasValidHeroSeat && derivedHeroSeat === null) {
```

- [ ] **Step 3: Sync spectator fields from `table_state`**

In the `table_state` case, immediately after the `if (hasValidHeroSeat) { ... } else if (derivedHeroSeat !== null) { ... }` block (ends ~762, just before `if (data.table) {` at ~763), add:

```js
        if (Object.prototype.hasOwnProperty.call(data, "is_spectator")) {
          this.state.isSpectator = Boolean(data.is_spectator);
        }
        if (Object.prototype.hasOwnProperty.call(data, "can_act")) {
          this.state.canAct = Boolean(data.can_act);
        }
        if (this.state.isSpectator) {
          this.state.heroSeat = null;
        }
        if (Number.isFinite(Number(data.table_chips))) {
          this.state.tableChips = Number(data.table_chips);
        }
```

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/shared/state/store.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/shared/state/store.js
git commit -m "feat(store): sync spectator fields and keep spectators on table_state"
```

---

### Task 4: Never set `canAct` for a spectator in `action_request` / `turn`

**Files:**
- Modify: `src/shared/state/store.js` — `action_request` case (~827) and `turn` case (~860)

- [ ] **Step 1: Ignore `action_request` while spectating**

At the very top of the `action_request` case body (right after `case "action_request":`, before `this.state.actionRequest = data;` at ~828), add:

```js
        if (this.state.isSpectator) {
          this.state.actionRequest = null;
          this.state.canAct = false;
          break;
        }
```

- [ ] **Step 2: Set `canAct` when a real action_request arrives for hero**

At the end of the `action_request` case body, immediately before its `break;` (~857), add:

```js
        {
          const reqSeat = Number(data.seat);
          this.state.canAct = Number.isInteger(reqSeat)
            && Number.isInteger(Number(this.state.heroSeat))
            && reqSeat === Number(this.state.heroSeat);
        }
```

- [ ] **Step 3: Clear `canAct` for spectator in `turn`**

At the top of the `turn` case body (right after `case "turn":`, before `if (this.state.table) {` at ~861), add:

```js
        if (this.state.isSpectator) {
          this.state.canAct = false;
        }
```

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/shared/state/store.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/shared/state/store.js
git commit -m "feat(store): gate canAct so spectators never get the turn"
```

---

### Task 5: Mock — spectator entry via `join_stakes`

**Files:**
- Modify: `src/shared/network/mockSocketClient.js` — `handleJoinStakes` (~278-330) and `emitTableState` (~1117)

- [ ] **Step 1: Initialize a spectator flag in the constructor / state**

Find where the mock initializes `this.heroSeat` / `this.table` (top of the class — `this.table = null;` at ~107). On the line after `this.table = null;`, add:

```js
    this.isSpectator = false;
    this.spectatorTableChips = 0;
```

- [ ] **Step 2: Branch `handleJoinStakes` for spectator mode**

Replace the body of `handleJoinStakes(data = {})` (~278-330) so it detects spectator mode and builds the table without the hero. The full new method:

```js
  handleJoinStakes(data = {}) {
    this.stopSimulation();
    this.handContribBySeat = {};

    const wantSpectate = String(data?.mode ?? "").toLowerCase();
    const isSpectator = data?.spectator === true
      || ["spectator", "spectate", "observer", "watch"].includes(wantSpectate);
    this.isSpectator = isSpectator;

    this.table = {
      table_id: TABLE_ID,
      game_id: GAME_ID,
      stakes_id: STAKES_ID,
      small_blind: SMALL_BLIND,
      big_blind: BIG_BLIND,
      min_buyin: MIN_BUYIN,
      max_buyin: MAX_BUYIN,
      max_players: 6,
      status: "waiting",
      round: "waiting",
      hand_id: 0,
      community: [],
      pot: 0,
      current_bet: 0,
      bets: {},
      round_total_bet: 0,
      dealer_seat: null,
      sb_seat: null,
      bb_seat: null,
      players: [],
    };

    if (isSpectator) {
      // 觀戰：不帶入籌碼也能進桌；take_seat 時才檢查。給足夠籌碼讓 happy-path 可測。
      this.spectatorTableChips = MAX_BUYIN;
      this.emit("table_joined", {
        game_id: GAME_ID,
        table_id: TABLE_ID,
        stakes_id: STAKES_ID,
        hero_seat: null,
        is_spectator: true,
        can_act: false,
        table_chips: this.spectatorTableChips,
        waiting_this_hand: false,
        table: clone(this.table),
      });
      this.walletBalance = 492000;
      this.emit("wallet_state", {
        wallet_balance: this.walletBalance,
        table_chips: this.spectatorTableChips,
      });
    } else {
      const requestedBuyin = Math.floor(Number(data?.buyin ?? MAX_BUYIN));
      const clampedBuyin = Math.max(MIN_BUYIN, Math.min(MAX_BUYIN, Number.isFinite(requestedBuyin) ? requestedBuyin : MAX_BUYIN));
      const heroSeed = PLAYER_SEEDS.find((item) => item.seat === this.heroSeat) || PLAYER_SEEDS[0];
      const heroName = this.profile.username || heroSeed.username;
      const heroPlayer = makeTablePlayer({ ...heroSeed, username: heroName, chips: clampedBuyin });
      this.table.players.push(heroPlayer);
      this.emit("table_joined", {
        hero_seat: this.heroSeat,
        is_spectator: false,
        can_act: false,
        waiting_this_hand: false,
        table: clone(this.table),
      });
      this.walletBalance = 492000;
      this.emit("wallet_state", {
        wallet_balance: this.walletBalance,
        table_chips: heroPlayer.chips,
      });
    }

    const runId = ++this.currentRunId;
    this.runFlow(runId).catch(() => {});
  }
```

Because `runFlow` (~339) seeds every `PLAYER_SEEDS` entry except `seed.seat === this.heroSeat`, the hero seat stays empty while spectating, and `performHeroTurn` (~949) no-ops because the hero is not in `players`.

- [ ] **Step 3: Make `emitTableState` report spectator status**

Replace the `emit("table_state", {...})` body inside `emitTableState()` (~1121-1124) with:

```js
    this.emit("table_state", {
      hero_seat: this.isSpectator ? null : this.heroSeat,
      is_spectator: this.isSpectator,
      can_act: false,
      table_chips: this.isSpectator ? this.spectatorTableChips : undefined,
      table: clone(this.table),
    });
```

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/shared/network/mockSocketClient.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/shared/network/mockSocketClient.js
git commit -m "feat(mock): support spectator entry via join_stakes"
```

---

### Task 6: Mock — `take_seat`

**Files:**
- Modify: `src/shared/network/mockSocketClient.js` — add a `case "take_seat"` in the `send` switch (after the `join_stakes` case ~189)

- [ ] **Step 1: Add the `take_seat` case**

Immediately after the `case "join_stakes": ... break;` block (~187-189), insert:

```js
      case "take_seat":
        this.handleTakeSeat(data);
        break;
```

- [ ] **Step 2: Add the `handleTakeSeat` method**

Add a new method right after `handleJoinStakes` (after its closing `}` ~330):

```js
  handleTakeSeat(data = {}) {
    const seat = Number(data?.seat);
    if (!this.table || !Number.isInteger(seat)) {
      this.emit("error", { code: "TAKE_SEAT_INVALID", message: "invalid seat" });
      return;
    }
    if (this.findPlayer(seat)) {
      this.emit("error", { code: "TAKE_SEAT_OCCUPIED", message: "seat is taken" });
      return;
    }
    if (this.spectatorTableChips < MIN_BUYIN) {
      this.emit("error", {
        code: "TAKE_SEAT_CHIPS_TOO_LOW",
        message: `table chips must be >= ${MIN_BUYIN}`,
        table_chips: this.spectatorTableChips,
        min_buyin: MIN_BUYIN,
      });
      return;
    }

    this.heroSeat = seat;
    this.isSpectator = false;
    const heroSeed = PLAYER_SEEDS.find((item) => item.seat === seat) || PLAYER_SEEDS[0];
    const heroName = this.profile.username || heroSeed.username;
    const heroPlayer = makeTablePlayer({
      ...heroSeed,
      seat,
      username: heroName,
      chips: this.spectatorTableChips,
    });
    heroPlayer.in_hand = false;
    this.table.players.push(heroPlayer);

    this.emit("seat_taken", {
      game_id: GAME_ID,
      table_id: TABLE_ID,
      hero_seat: seat,
      is_spectator: false,
      can_act: false,
      table_chips: this.spectatorTableChips,
      waiting_this_hand: true,
      table: clone(this.table),
    });
    this.emit("table_player_joined", {
      table_id: TABLE_ID,
      player: makeJoinedPayload({ ...heroSeed, seat, username: heroName }),
    });
    this.emitTableState();
  }
```

- [ ] **Step 3: Syntax check**

Run: `node --input-type=module --check src/shared/network/mockSocketClient.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add src/shared/network/mockSocketClient.js
git commit -m "feat(mock): handle take_seat from spectator"
```

---

### Task 7: Mock — `stand_up`

**Files:**
- Modify: `src/shared/network/mockSocketClient.js` — add `case "stand_up"` in the `send` switch and a `handleStandUp` method

- [ ] **Step 1: Add the `stand_up` case**

After the `take_seat` case added in Task 6, insert:

```js
      case "stand_up":
        this.handleStandUp(data);
        break;
```

- [ ] **Step 2: Add `handleStandUp`**

Add after `handleTakeSeat`:

```js
  handleStandUp() {
    if (!this.table) {
      this.emit("error", { code: "STAND_UP_NOT_ALLOWED", message: "not at table" });
      return;
    }
    // 只允許在牌局之間（非進行中）退座
    if (this.table.status === "playing") {
      this.emit("error", {
        code: "STAND_UP_NOT_ALLOWED",
        message: "stand up is only allowed between hands",
      });
      return;
    }
    const previousSeat = Number.isInteger(this.heroSeat) ? this.heroSeat : null;
    if (previousSeat !== null) {
      this.table.players = this.table.players.filter((p) => Number(p.seat) !== previousSeat);
    }
    this.isSpectator = true;
    this.heroSeat = null;

    this.emit("spectator_mode", {
      game_id: GAME_ID,
      table_id: TABLE_ID,
      stakes_id: STAKES_ID,
      previous_seat: previousSeat,
      hero_seat: null,
      is_spectator: true,
      can_act: false,
      table_chips: this.spectatorTableChips,
      table: clone(this.table),
    });
    this.emitTableState();
  }
```

Note: `this.heroSeat` is set to `null` so subsequent mock turns skip the (now empty) hero seat. After stand_up the seat the hero left is empty and can be re-taken via `take_seat`.

- [ ] **Step 3: Syntax check**

Run: `node --input-type=module --check src/shared/network/mockSocketClient.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add src/shared/network/mockSocketClient.js
git commit -m "feat(mock): handle stand_up to spectator"
```

---

### Task 8: Mock — spectator `switch_room`

**Files:**
- Modify: `src/shared/network/mockSocketClient.js` — `switch_room` case (~191-197)

- [ ] **Step 1: Keep spectator mode across switch**

Replace the `switch_room` case body (~191-197) with:

```js
      case "switch_room":
        if (this.isSpectator) {
          this.handleJoinStakes({ game_id: GAME_ID, stakes_id: STAKES_ID, mode: "spectator" });
        } else {
          this.handleJoinStakes({
            game_id: GAME_ID,
            stakes_id: STAKES_ID,
            buyin: Number(data.buyin ?? MAX_BUYIN),
          });
        }
        break;
```

- [ ] **Step 2: Syntax check**

Run: `node --input-type=module --check src/shared/network/mockSocketClient.js`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/shared/network/mockSocketClient.js
git commit -m "feat(mock): keep spectator mode on switch_room"
```

---

### Task 9: Scene — hide hero action buttons + show "觀戰中" indicator while spectating

**Files:**
- Modify: `src/variants/main_style/scenes/tableScene.js` — `layoutActionButtons` call site (~5794) and add an indicator object created near `tableHintText` (~1040)

- [ ] **Step 1: Create the spectator indicator text**

Immediately after `this.tableHintText = this.add ...` block is finished being assigned (find the statement starting at ~1040; insert after its terminating `;`), add:

```js
    this.spectatorBadge = this.add
      .text(CENTER_X, ACTION_ROW_Y, "觀戰中", {
        fontSize: "24px",
        color: "#ffe7a8",
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);
```

(`ACTION_ROW_Y` and `CENTER_X`/`CENTER_Y`/`UI_FONT_STACK` are module-level consts in scope here. Depth `50` sits above the felt and seats; raise it if the badge is occluded.)

- [ ] **Step 2: Reposition the badge on layout**

In `applyLayout()` where action buttons are repositioned (~1778-1782, the `ACTION_BUTTON_ORDER.forEach` block), add right after that forEach:

```js
    this.spectatorBadge?.setY(newActionY);
```

- [ ] **Step 3: Force-hide action buttons and show the badge when spectating**

At the `layoutActionButtons` call site (~5794), replace:

```js
    this.layoutActionButtons(this._actionSentPending ? [] : allowed);
```

with:

```js
    if (this.state?.isSpectator) {
      this.layoutActionButtons([]);
      this.closeRaiseActionPanel();
      this.spectatorBadge?.setVisible(true);
    } else {
      this.layoutActionButtons(this._actionSentPending ? [] : allowed);
      this.spectatorBadge?.setVisible(false);
    }
```

- [ ] **Step 4: Destroy the badge on shutdown**

In the `events.once("shutdown", ...)` handler (~1711), add:

```js
      this.spectatorBadge?.destroy(); this.spectatorBadge = null;
```

- [ ] **Step 5: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/tableScene.js`
Expected: no output (exit 0).

- [ ] **Step 6: Commit**

```bash
git add src/variants/main_style/scenes/tableScene.js
git commit -m "feat(table): hide action buttons and show spectating badge"
```

---

### Task 10: Scene — clickable empty seats to `take_seat` while spectating

**Files:**
- Modify: `src/variants/main_style/scenes/tableScene.js` — empty-seat render branch (~5446-5453)

- [ ] **Step 1: Make the sit prompt interactive only while spectating**

Replace the empty-seat prompt block (~5446-5451):

```js
          seatView.sitPromptBg.setVisible(true);
          seatView.sitPromptCircle.setVisible(true);
          seatView.sitPromptPlus.setVisible(true);
          seatView.sitPromptLabel.setVisible(true);
          seatView.sitPromptBg.disableInteractive();
          seatView.sitPromptBg.off("pointerdown");
```

with:

```js
          seatView.sitPromptBg.setVisible(true);
          seatView.sitPromptCircle.setVisible(true);
          seatView.sitPromptPlus.setVisible(true);
          seatView.sitPromptLabel.setVisible(true);
          seatView.sitPromptBg.off("pointerdown");
          if (this.state?.isSpectator) {
            const seatToTake = Number(seatView.seatIndex);
            seatView.sitPromptBg.setInteractive({ useHandCursor: true });
            seatView.sitPromptBg.once("pointerdown", () => {
              playUiClick(this);
              this.app.sendPacket("take_seat", { seat: seatToTake });
            });
          } else {
            seatView.sitPromptBg.disableInteractive();
          }
```

- [ ] **Step 2: Verify the seat index property name**

The `seatView` object is created at ~3519. Confirm it stores the seat index. Search the file:

Run: `grep -n "seatIndex\|seatNo:\|seat:" src/variants/main_style/scenes/tableScene.js | head`

If the seat number is stored under a different key (e.g. `seatView.seat` or the loop index variable), use that exact property in `Number(seatView.seatIndex)` above. If no seat index is stored on `seatView`, add `seatIndex: <loopVar>,` to the `seatView` literal at ~3519 using whatever index variable the surrounding `for`/`forEach` uses (the same one used to compute `pos`).

- [ ] **Step 3: Stop the pointer handler firing for occupied seats**

In the occupied-seat branch where the prompt is hidden (~5532-5535), add after `seatView.sitPromptLabel.setVisible(false);`:

```js
        seatView.sitPromptBg.disableInteractive();
        seatView.sitPromptBg.off("pointerdown");
```

Do the same at the other hide site (~5750-5753).

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/tableScene.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/variants/main_style/scenes/tableScene.js
git commit -m "feat(table): clickable empty seats send take_seat while spectating"
```

---

### Task 11: Scene — add "退座觀戰" button to the hand-end menu (seated players only)

**Files:**
- Modify: `src/variants/main_style/scenes/tableScene.js` — button creation (~3058), layout (~1853), shutdown (~1760), visibility toggles in `refreshHandEndMenu` (~3795 and ~3818)

- [ ] **Step 1: Create the stand-up button**

Immediately after the `this.handEndMenuExitBtn = createGradientButton(...)` block closes (~3058), add a second-row button centered below the existing row:

```js
    this.handEndMenuStandBtn = createGradientButton(this, {
      x: CENTER_X, y: HAND_END_MODAL_BTN_Y + HAND_END_MODAL_BTN_H + 18,
      width: HAND_END_MODAL_ACT_W, height: HAND_END_MODAL_BTN_H, cornerRadius: 12,
      topColor: 0x6a4b1a, bottomColor: 0x3a2708, borderColor: 0xd0a23c,
      label: "退座觀戰", labelStyle: _btnStyle,
      depth: HAND_END_MODAL_TEXT_DEPTH,
      onClick: () => {
        this._handEndMenuEnd = 0;
        this.refreshHandEndMenu();
        this.app.sendPacket("stand_up", {});
      },
      visible: false,
    });
```

- [ ] **Step 2: Initialize the field in the constructor**

Where the other hand-end menu buttons are nulled (~748-750), add:

```js
    this.handEndMenuStandBtn = null;
```

- [ ] **Step 3: Reposition on layout**

After the three existing `setPosition` calls (~1851-1853), add:

```js
    this.handEndMenuStandBtn?.setPosition?.(CENTER_X, HAND_END_MODAL_BTN_Y + HAND_END_MODAL_BTN_H + 18 + dy);
```

- [ ] **Step 4: Destroy on shutdown**

After the three existing `.destroy()` calls (~1758-1760), add:

```js
      this.handEndMenuStandBtn?.destroy();
```

- [ ] **Step 5: Toggle visibility in `refreshHandEndMenu`**

In the hide branch (~3793-3795), add after `this.handEndMenuExitBtn?.setVisible(false);`:

```js
      this.handEndMenuStandBtn?.setVisible(false);
```

In the show branch (~3816-3818), add after `this.handEndMenuExitBtn?.setVisible(true);`:

```js
    this.handEndMenuStandBtn?.setVisible(!this.state?.isSpectator);
```

(A spectator has no seat to stand up from, so the button is hidden for them.)

- [ ] **Step 6: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/tableScene.js`
Expected: no output (exit 0).

- [ ] **Step 7: Commit**

```bash
git add src/variants/main_style/scenes/tableScene.js
git commit -m "feat(table): add stand-up button to hand-end menu"
```

---

### Task 12: Scene — hide the top-right persistent 換桌/結束 buttons behind a flag

**Files:**
- Modify: `src/variants/main_style/scenes/tableScene.js` — add a module-level flag near the top consts (~125 area), and apply it after the two button creations (~881 and ~919)

- [ ] **Step 1: Add the flag**

Near the other module-level UI constants (e.g. after `const HAND_END_MODAL_BTN_H = 72;` at ~126), add:

```js
// 暫時隱藏右上角常駐「換桌 / 結束」按鈕；需要時改回 true。
const SHOW_TOPRIGHT_ROOM_BUTTONS = false;
```

- [ ] **Step 2: Apply to the change-table button**

After the `this.changeTableButton` setup finishes — the `bindImageButton(this, this.changeTableButton, {...})` call ends at ~881 — add:

```js
    if (!SHOW_TOPRIGHT_ROOM_BUTTONS) {
      this.changeTableButton.setVisible(false).disableInteractive();
    }
```

- [ ] **Step 3: Apply to the exit button**

After the exit button's interactivity is set (`this.exitTableButton.setInteractive({ useHandCursor: true });` at ~919), add:

```js
    if (!SHOW_TOPRIGHT_ROOM_BUTTONS) {
      this.exitTableButton.setVisible(false).disableInteractive();
    }
```

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/tableScene.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/variants/main_style/scenes/tableScene.js
git commit -m "feat(table): hide top-right room buttons behind a flag"
```

---

### Task 13: Scene — toast for `TAKE_SEAT_CHIPS_TOO_LOW` / `STAND_UP_NOT_ALLOWED`

**Files:**
- Modify: `src/variants/main_style/scenes/tableScene.js` — add a `lastSeenErrorVersion` tracker + a small toast helper + a check in `renderState`

- [ ] **Step 1: Add a toast helper method**

Add a new method on the scene class (place it next to other helper methods, e.g. just before `refreshHandEndMenu` at ~3770):

```js
  showSpectatorToast(message) {
    if (!message) return;
    if (this._spectatorToast) { this._spectatorToast.destroy(); this._spectatorToast = null; }
    const toast = this.add
      .text(CENTER_X, CENTER_Y - 120, message, {
        fontSize: "26px", color: "#ffffff", fontStyle: "bold",
        fontFamily: UI_FONT_STACK, backgroundColor: "#000000cc",
        padding: { x: 18, y: 10 }, align: "center",
      })
      .setOrigin(0.5)
      .setDepth(9999)
      .setAlpha(0);
    this._spectatorToast = toast;
    this.tweens.add({
      targets: toast, alpha: 1, duration: 160, yoyo: true, hold: 1600,
      onComplete: () => { toast.destroy(); if (this._spectatorToast === toast) this._spectatorToast = null; },
    });
  }
```

- [ ] **Step 2: Watch `errorVersion` in `renderState`**

Inside `renderState()` (the method bound at ~1708 that runs on every state change), add near the top of its body:

```js
    {
      const ev = Number(this.state?.errorVersion ?? 0);
      if (ev !== this._lastSeenErrorVersion) {
        this._lastSeenErrorVersion = ev;
        const code = String(this.state?.lastError?.code ?? "").toUpperCase();
        if (code === "TAKE_SEAT_CHIPS_TOO_LOW") {
          this.showSpectatorToast("桌上籌碼不足，無法入座");
        } else if (code === "STAND_UP_NOT_ALLOWED") {
          this.showSpectatorToast("只能在牌局之間退座");
        }
      }
    }
```

- [ ] **Step 3: Initialize the tracker**

Where scene instance fields are initialized (constructor / `create` early, e.g. near `this.lastSeenActionRequestKey`), add:

```js
    this._lastSeenErrorVersion = 0;
    this._spectatorToast = null;
```

If you cannot find a single init site, the `??`-guarded read in Step 2 (`this.state?.errorVersion ?? 0`) plus `this._lastSeenErrorVersion` being `undefined` on first run is safe: `0 !== undefined` is true so the first render could fire a stale toast. To prevent that, set `this._lastSeenErrorVersion = Number(this.state?.errorVersion ?? 0);` inside the `subscribe` setup at ~1705 BEFORE the first `renderState()` call.

- [ ] **Step 4: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/tableScene.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/variants/main_style/scenes/tableScene.js
git commit -m "feat(table): toast for take_seat/stand_up errors"
```

---

### Task 14: Lobby — "觀戰" button in the buyin modal

**Files:**
- Modify: `src/variants/main_style/scenes/gameLobbyScene.js` — add a `joinSpectator()` method, a button (~766), layout (~1065), destroy (~859), and visibility in `renderBuyinModal` (~1319)

- [ ] **Step 1: Add a `joinSpectator` method**

Add right after `confirmJoinStakes()` (after its closing `}` ~1307):

```js
  joinSpectator() {
    if (!this.buyinModalVisible || !this.buyinStake) {
      return;
    }
    const stakesId = String(this.buyinStake.stakes_id || this.buyinStake.id || "");
    if (!stakesId) {
      return;
    }
    const currentGameId = String(this.store.getState?.()?.gameLobby?.game_id || "texas_holdem");
    this.app.sendPacket("join_stakes", {
      game_id: currentGameId,
      stakes_id: stakesId,
      mode: "spectator",
    });
    this.closeBuyinModal();
  }
```

- [ ] **Step 2: Add the button**

After the `this.buyinCancelButton = createGradientButton(...)` block closes (~766), add:

```js
    this.buyinSpectateButton = createGradientButton(this, {
      x: CENTER_X,
      y: BUYIN_BUTTON_Y + BUYIN_BUTTON_HEIGHT + 16,
      width: BUYIN_BUTTON_WIDTH,
      height: BUYIN_BUTTON_HEIGHT,
      cornerRadius: 8,
      topColor: 0x1a5aaa,
      bottomColor: 0x0a2855,
      borderColor: 0x3d90f5,
      label: "觀戰",
      labelStyle: { fontSize: "26px", color: BUYIN_TITLE_COLOR, stroke: "#000000", strokeThickness: 1 },
      depth: BUYIN_TEXT_DEPTH + 0.4,
      onClick: () => this.joinSpectator(),
      visible: false,
    });
```

If `CENTER_X` is not a const in this scene, use `BUYIN_CONFIRM_X` (the modal is centered on those X anchors). Confirm by:

Run: `grep -n "CENTER_X\|BUYIN_CONFIRM_X\|BUYIN_BUTTON_Y" src/variants/main_style/scenes/gameLobbyScene.js | head`

- [ ] **Step 3: Toggle visibility in `renderBuyinModal`**

In `renderBuyinModal()` (~1309-1320), after `this.buyinCancelButton?.setVisible(...)` (note the actual confirm/cancel visibility lines — locate `this.buyinConfirmButton?.setVisible` near ~1320), add a matching line:

```js
    this.buyinSpectateButton?.setVisible(visible);
```

- [ ] **Step 4: Reposition on layout**

After the confirm/cancel `setPosition` calls (~1064-1065), add:

```js
    this.buyinSpectateButton?.setPosition?.(this.buyinConfirmButton?.x ?? BUYIN_CONFIRM_X, BUYIN_BUTTON_Y + BUYIN_BUTTON_HEIGHT + 16 + dy);
```

(Use the same `dy` variable the surrounding code uses for the other buyin buttons. If the confirm/cancel reposition block uses a different offset variable, mirror it.)

- [ ] **Step 5: Destroy with the other buyin buttons**

After `this.buyinCancelButton?.destroy?.();` (~859), add:

```js
      this.buyinSpectateButton?.destroy?.();
```

- [ ] **Step 6: Syntax check**

Run: `node --input-type=module --check src/variants/main_style/scenes/gameLobbyScene.js`
Expected: no output (exit 0).

- [ ] **Step 7: Commit**

```bash
git add src/variants/main_style/scenes/gameLobbyScene.js
git commit -m "feat(lobby): add spectate button to buyin modal"
```

---

## Manual Verification (after all tasks, in the real browser via `npm run dev`)

The mock makes all four flows testable offline. Walk through:

1. **Join as spectator:** Lobby → pick a stake → buyin modal → click "觀戰". Confirm: enter the table, no hero seat highlighted, action buttons hidden, "觀戰中" badge visible, empty seats show "可入座" and are clickable.
2. **Take a seat:** Click an empty seat → `take_seat` → seat is filled by hero, "觀戰中" badge disappears, hero plays from the next hand (waiting_this_hand).
3. **Play a hand**, let it end → hand-end menu shows the "退座觀戰" button.
4. **Stand up:** Click "退座觀戰" between hands → back to spectating (badge returns, seat empties, hero not kicked to lobby). Try clicking it mid-hand (if reachable) → "只能在牌局之間退座" toast.
5. **Take-seat error:** (To exercise) temporarily set the mock `this.spectatorTableChips = 0` in `handleJoinStakes` spectator branch → clicking a seat shows "桌上籌碼不足，無法入座".
6. **Top-right buttons:** confirm the 換桌/結束 buttons are hidden (flag off). Flip `SHOW_TOPRIGHT_ROOM_BUTTONS = true` to confirm they reappear.

Animation smoothness can only be judged in the real browser (Claude Preview throttles rAF) — but spectator flows are state-driven, so functional behavior is verifiable anywhere.

## Notes for the implementer

- Several "~line N" references are approximate — locate the anchor code shown in the step rather than trusting the number.
- Tasks 1-4 (store) are independent of mock and scene and can land first; the mock (5-8) lets you exercise the scene work (9-14) without the real server.
- The store gates `canAct`, so even if a stray `action_request` reached a spectator, Task 4 prevents the buttons from arming; Task 9 is defense-in-depth at the scene layer.
