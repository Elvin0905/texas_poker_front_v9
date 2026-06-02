### turn 輪到座位

用途：通知目前輪到哪個座位。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"turn","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"timeout":10,"round":"preflop","started_at_ms":1780387590974,"deadline_at_ms":1780387600974}}
```

德州前端處理：

- `turn` 是全桌廣播，用來顯示目前輪到哪個座位。
- 倒數顯示請以 `deadline_at_ms` 為準；若 `table_state.table.current_turn_deadline_at` 同步出現，兩者應為同一個後端截止時間。
- `deadline_at_ms` 到期後應立即清掉可操作狀態或停用按鈕。

大老二範例：

```json
{"type":"turn","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"timeout":10,"action_seq":12}}
```
