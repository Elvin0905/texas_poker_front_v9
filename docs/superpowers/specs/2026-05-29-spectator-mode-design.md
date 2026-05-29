# 旁观模式 (Spectator Mode) 设计

日期：2026-05-29
状态：设计已确认，待实现

## 背景与目标

为德州扑克前端（Phaser 3，`src/variants/main_style`）加入完整旁观模式。玩家可以在不占座位的情况下观战，并在适当时机入座成为玩家，或从玩家退座回到观战。需同时支持**真服务器**与 **mock**（`mockSocketClient.js`）。

涉及的协议消息（规格见 `docs/`）：

- `join_stakes`（带 `mode:"spectator"`）— 直接以观战身份进桌
- `take_seat` → `seat_taken` — 从观战入座
- `stand_up` → `spectator_mode` — 退座并留在原桌观战
- `switch_room`（旁观态）— 观战换桌

## 四个流程

1. **直接观战进桌**：Lobby buyin 弹窗点"观战" → `join_stakes{mode:"spectator"}` → `table_joined`(`is_spectator:true, hero_seat:null`)。
2. **观战入座**：旁观时点击空位 → `take_seat{seat:N}` → `seat_taken`(`hero_seat:N, is_spectator:false, can_act:false, waiting_this_hand:true`)。
3. **退座观战**：局末菜单点"退座观战" → `stand_up{}` → `spectator_mode`(`previous_seat, hero_seat:null, is_spectator:true`)。
4. **观战换桌**：旁观态下 `switch_room`，保持旁观模式（不带 buyin）。

## 设计

### 1. 状态层（`src/shared/state/store.js`）

采用**显式 spectator 状态字段**（方案 A），避免用 `hero_seat===null` 推导导致的歧义（坐下但 `can_act:false` ≠ 旁观）。

维护于 `state.table` 上的字段：

- `is_spectator`（bool）
- `can_act`（bool）
- `hero_seat`（int | null，旁观时 `null`）
- `table_chips`（int，桌上筹码）
- `previous_seat`（int | null，退座前座位，供 UI 参考）

Packet handler 改动：

| Packet | 处理 |
|---|---|
| `table_joined` | 读取并写入 `is_spectator`/`can_act`/`hero_seat`/`table_chips`/`waiting_this_hand` |
| `spectator_mode`（新增 handler） | `is_spectator=true; can_act=false; hero_seat=null; previous_seat=data.previous_seat; table_chips=data.table_chips` |
| `seat_taken`（新增 handler） | `is_spectator=false; hero_seat=data.hero_seat; can_act=false; waiting_this_hand=true; table_chips=data.table_chips` |
| `table_state` | 若带 `is_spectator`/`can_act` 则同步 |
| `action_request` / `turn` | **仅在 `is_spectator===false` 时**才允许设 `can_act=true`；旁观永不可 act |

新增 client→server 方法：

- `standUp()` → 发 `{type:"stand_up","data":{}}`
- `takeSeat(seat)` → 发 `{type:"take_seat","data":{seat}}`
- `joinStakes(...)` 支持 `mode:"spectator"`（不带 buyin）

错误处理：`error` handler 已有；新增对 `TAKE_SEAT_CHIPS_TOO_LOW`、`STAND_UP_NOT_ALLOWED` 的转发（场景层弹提示）。

### 2. 场景层（`src/variants/main_style/scenes/tableScene.js`）

- **旁观态 UI 切换**：`is_spectator===true` 时隐藏 hero 行动按钮（加注/跟注/梭哈/弃牌），显示"观战中"指示文字/标记。
- **空位可点击入座**：现有"可入座"提示（`sitPromptBg/sitPromptCircle/sitPromptPlus/sitPromptLabel`）改为 interactive。仅旁观态显示且可点；点击 → `store.takeSeat(seatIndex)`。
- **stand_up 入口**：局末菜单（进入下局/换桌/结束）新增"退座观战"按钮 → `store.standUp()`。仅在 `is_spectator===false`（已入座）时显示。
- **隐藏右上角常驻按钮**：引入 flag `SHOW_TOPRIGHT_ROOM_BUTTONS = false`，暂时隐藏右上角"结束/换桌"按钮；需要时改回 `true`。
- **错误提示**：`TAKE_SEAT_CHIPS_TOO_LOW` → toast"桌上筹码不足，无法入座"；`STAND_UP_NOT_ALLOWED` → toast"只能在牌局之间退座"。

### 3. Mock 层（`src/shared/network/mockSocketClient.js`）

- `join_stakes` case：识别 `mode:"spectator"` / `spectator:true`，回 `table_joined`（`is_spectator:true, hero_seat:null, can_act:false, table_chips, waiting_this_hand:false`），**不**把 hero 加入 `table.players`。
- 新增 `stand_up` case：回 `spectator_mode`（`previous_seat`=当前 hero_seat，`hero_seat:null, is_spectator:true, table_chips`），并把 hero 从 players 移除、广播 `table_state`。只允许在局间（结算后到下局开始前）；否则回 `error{code:"STAND_UP_NOT_ALLOWED"}`。
- 新增 `take_seat` case：检查 `table_chips >= min_buyin`；成功回 `seat_taken`（`hero_seat:seat, is_spectator:false, waiting_this_hand:true`），把 hero 加入 players，广播 `table_player_joined`/`table_state`；不足回 `error{code:"TAKE_SEAT_CHIPS_TOO_LOW", table_chips, min_buyin}`。
- `switch_room` case：旁观态下保持旁观模式（不带 buyin、可带 `table_id`）。

### 4. Lobby 层（`src/variants/main_style/scenes/gameLobbyScene.js`）

- buyin 弹窗新增"观战"按钮 → 发 `join_stakes{game_id, stakes_id, mode:"spectator"}`（不带 buyin），随后切换到桌场景。

## 测试 / 验证计划

- Mock 下手动走通四个流程：观战进桌 → 入座 → 打一局 → 局末退座观战 → 换桌。
- 验证旁观态下行动按钮隐藏、空位可点；入座后按钮恢复。
- 验证 `TAKE_SEAT_CHIPS_TOO_LOW` 与 `STAND_UP_NOT_ALLOWED` 的 toast。
- 真服务器联调（字段对齐 `is_spectator`/`can_act`/`hero_seat`）。

## 非目标 (YAGNI)

- 不实现旁观者列表 / 旁观聊天。
- 不实现旁观→主钱包筹码转移（规格明确 `stand_up` 不转回）。
- 不引入完整状态机（用显式字段即可）。
