### spectator_mode 已切換為觀戰模式

Server -> Client

`stand_up` 成功後送給該玩家；如果玩家本來就已經在觀戰，重複送 `stand_up` 時也可能收到這個回應。

範例：

```json
{"type":"spectator_mode","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","previous_seat":2,"hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1500,"table":{}}}
```
