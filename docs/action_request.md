### action_request 請求操作

用途：通知目前玩家可以做哪些操作。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"action_request","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"to_call":50,"current_bet":100,"my_bet":50,"min_raise_to":150,"big_blind":50,"pot":500,"round_total_bet":500,"allowed":["fold","call","raise","allin"],"timeout":10,"started_at_ms":1780387590974,"deadline_at_ms":1780387600974}}
```

德州前端處理：

- `started_at_ms` / `deadline_at_ms` 為後端時間的 Unix epoch milliseconds。
- 倒數請以 `deadline_at_ms - Date.now()` 計算，不要只用收到封包當下加 `timeout`。
- 當目前時間大於等於 `deadline_at_ms` 時，應立即停用操作按鈕，不再送 `player_action`。
- 後端仍有內部收單寬限秒數處理網路抖動；此寬限不顯示給玩家，也不應延長前端可操作時間。

大老二範例：

```json
{"type":"action_request","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"allowed":["play_cards","pass"],"timeout":10,"action_seq":12}}
```
