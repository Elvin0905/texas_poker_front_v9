### seat_taken 選座成功

Server -> Client.

`take_seat` 成功後送給該玩家。

範例：

```json
{"type":"seat_taken","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","hero_seat":2,"is_spectator":false,"can_act":false,"table_chips":1000,"waiting_this_hand":true,"table":{}}}
```
