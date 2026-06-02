### table_state 遊戲桌狀態

用途：同步目前遊戲桌完整狀態。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_state","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[],"current_turn_seat":5,"current_turn_timeout":10,"current_turn_started_at":1780387590974,"current_turn_deadline_at":1780387600974}}}
```

德州目前行動欄位：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `current_turn_seat` | integer/null | 目前可操作座位；沒有玩家可操作時為 `null`。 |
| `current_turn_timeout` | number | 前端可見倒數秒數。 |
| `current_turn_started_at` | integer/null | 後端開始此玩家行動的 Unix epoch milliseconds。 |
| `current_turn_deadline_at` | integer/null | 後端可見倒數截止時間，Unix epoch milliseconds。 |

德州前端處理：

- `table_state` 是權威狀態；如果前端用 `table_state.table` 覆蓋桌面資料，必須同步保存 `current_turn_*`。
- 操作按鈕只在 `current_turn_seat` 等於自己的座位，且 `Date.now() < current_turn_deadline_at` 時開啟。
- 若 `current_turn_deadline_at` 已過或為 `null`，應停用操作按鈕。

大老二範例：

```json
{"type":"table_state","data":{"game_id":"big_two","hero_seat":0,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[]}}}
```
