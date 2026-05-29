### switch_room 換桌

Client -> Server

用來切換到同遊戲、同場次的另一張桌。

一般玩家換桌會離開目前座位，重新坐到另一張可入座的桌。觀戰者換桌會維持觀戰模式，不會坐下、不會佔位，也不需要帶入籌碼。

`data` 欄位：

| 欄位 | 型別 | 必填 | 範例 | 說明 |
|---|---|---|---|---|
| `buyin` | integer | 否 | `1000` | 一般玩家換桌時的帶入籌碼。未帶時會依目前 game wallet / table chips 與該場上下限決定。觀戰模式會忽略此欄位。 |
| `table_id` | string | 否 | `texas_holdem_t25_50_yyyy` | 只有觀戰模式可帶。帶入時切到指定桌觀戰；未帶時隨機切到同遊戲同場次的另一桌。 |

成功回應：`table_joined`，接著可能收到 `wallet_state`、`table_state`、`table_countdown`、`hand_start`。

失敗回應：`error`，常見錯誤碼包含 `SWITCH_ROOM_NOT_SUPPORTED`、`SWITCH_ROOM_TABLE_FULL`、`SWITCH_ROOM_TABLE_SELECTION_NOT_ALLOWED`。

一般玩家換桌範例：

```json
{"type":"switch_room","data":{"buyin":1000}}
```

觀戰者隨機換桌範例：

```json
{"type":"switch_room","data":{}}
```

觀戰者指定換桌範例：

```json
{"type":"switch_room","data":{"table_id":"texas_holdem_t25_50_yyyy"}}
```

一般玩家成功範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"table_id":"texas_holdem_t25_50_yyyy","game_id":"texas_holdem","stakes_id":"t25_50"},"waiting_this_hand":true}}
```

觀戰者成功範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_yyyy","stakes_id":"t25_50","hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1000,"table":{"table_id":"texas_holdem_t25_50_yyyy","game_id":"texas_holdem","stakes_id":"t25_50","players":[]},"waiting_this_hand":false}}
```

錯誤範例：

```json
{"type":"error","data":{"code":"SWITCH_ROOM_TABLE_SELECTION_NOT_ALLOWED","message":"table_id is only allowed while spectating"}}
```
