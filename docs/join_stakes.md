### join_stakes 加入盲注場

Client -> Server

用來加入指定遊戲與盲注場。一般模式會坐進桌上成為玩家；觀戰模式會進入指定桌觀戰，但不會佔座位。

`data` 欄位：

| 欄位 | 型別 | 必填 | 範例 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 是 | `texas_holdem`、`big_two` | 要加入的遊戲 ID。 |
| `stakes_id` | string | 是 | `t25_50`、`b10` | 要加入的盲注/場次 ID，來源為 `game_lobby_state.stakes[].id`。 |
| `buyin` | integer | 否 | `1000` | 帶入籌碼。一般入座未帶時會使用該場預設/最低帶入；觀戰模式未帶時不會先轉入籌碼，之後 `take_seat` 會檢查目前 game wallet / table chips 是否達到最低帶入。 |
| `mode` | string | 否 | `spectator` | 帶 `"spectator"` 時進入觀戰模式。也支援 `spectate`、`observer`、`watch`。 |
| `spectator` | boolean | 否 | `true` | 另一種進入觀戰模式的寫法；效果等同 `mode:"spectator"`。 |
| `table_id` | string | 否 | `texas_holdem_t25_50_xxxx` | 指定要觀戰的桌。只有觀戰模式可以帶 `table_id`；觀戰模式未帶時會隨機挑同遊戲同場次的桌；一般入座模式帶 `table_id` 會回錯誤。 |

成功回應：`table_joined`，後續可能收到 `wallet_state`、`table_countdown`、`hand_start`。

失敗回應：`error`，常見錯誤碼包含 `JOIN_STAKES_UNKNOWN_STAKES`、`BUYIN_TOO_LOW`、`JOIN_STAKES_TABLE_FULL`、`JOIN_STAKES_TABLE_SELECTION_NOT_ALLOWED`。

一般入座範例：

```json
{"type":"join_stakes","data":{"game_id":"texas_holdem","stakes_id":"t25_50","buyin":1000}}
```

觀戰模式範例：

```json
{"type":"join_stakes","data":{"game_id":"texas_holdem","stakes_id":"t25_50","table_id":"texas_holdem_t25_50_xxxx","mode":"spectator","buyin":1000}}
```

當 `mode` 為 `"spectator"` 時，可以帶 `table_id` 指定要觀戰的桌；未帶 `table_id` 時會隨機挑同遊戲同場次的桌。玩家會收到公開桌況事件，但不會被加入 `table.players`，也不能操作。之後可送 `take_seat` 在同一桌選擇空位坐下。`buyin` 可選；如果沒有帶入籌碼，之後 `take_seat` 會檢查玩家目前 game wallet / table chips 是否達到該桌最低帶入。

Big Two 一般入座範例：

```json
{"type":"join_stakes","data":{"game_id":"big_two","stakes_id":"b10","buyin":1000}}
```

Texas 成功範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"table_id":"texas_holdem_t25_50_xxxx","game_id":"texas_holdem","stakes_id":"t25_50","players":[]},"waiting_this_hand":true}}
```

觀戰成功範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1000,"table":{"table_id":"texas_holdem_t25_50_xxxx","game_id":"texas_holdem","stakes_id":"t25_50","players":[]},"waiting_this_hand":false}}
```

Big Two 成功範例：

```json
{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"table":{"table_id":"big_two_b10_xxxx","game_id":"big_two","stakes_id":"b10","players":[]},"waiting_this_hand":false}}
```

錯誤範例：

```json
{"type":"error","data":{"code":"BUYIN_TOO_LOW","message":"帶入金額低於下限"}}
```
