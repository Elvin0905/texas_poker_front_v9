### stand_up 退座並留在原桌觀戰

Client -> Server

玩家已坐在桌上時，若在派彩/結算後到下一局開始前想退座，但仍留在同一桌觀戰，就送這個訊息。

`data` 欄位：

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| 無 | object | 否 | 送 `{}` 即可。 |

成功回應：`spectator_mode`，接著會收到公開的 `table_state` 更新。

送出範例：

```json
{"type":"stand_up","data":{}}
```

成功範例：

```json
{"type":"spectator_mode","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","previous_seat":2,"hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1500,"table":{}}}
```

錯誤範例：

```json
{"type":"error","data":{"code":"STAND_UP_NOT_ALLOWED","message":"stand up is only allowed between hands"}}
```

注意事項：

- `stand_up` 不會把 game wallet / table chips 轉回主錢包。
- 玩家會留在目前桌上，並持續收到公開桌況事件。
- 玩家之後可以再送 `take_seat` 坐回座位；`take_seat` 會檢查目前 table chips 是否達到該桌最低帶入。
