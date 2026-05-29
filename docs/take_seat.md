### take_seat 選擇目前觀戰桌的座位

Client -> Server.

在使用 `join_stakes` 並帶 `mode:"spectator"` 進入觀戰桌後，如果玩家要坐下指定座位，就送這個訊息。

`data` 欄位：
| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `seat` | integer | 是 | 要坐下的座位 index，必須是目前觀戰桌上的空位。 |

成功回應：`seat_taken`，接著桌上會廣播 `table_player_joined`、`table_state` 等更新。

送出範例：

```json
{"type":"take_seat","data":{"seat":2}}
```

成功範例：

```json
{"type":"seat_taken","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hero_seat":2,"is_spectator":false,"can_act":false,"table_chips":1000,"waiting_this_hand":true,"table":{}}}
```

常見錯誤：

```json
{"type":"error","data":{"code":"TAKE_SEAT_CHIPS_TOO_LOW","message":"table chips must be >= 1000","table_chips":0,"min_buyin":1000}}
```
