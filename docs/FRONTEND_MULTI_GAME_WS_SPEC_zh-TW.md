# FRONTEND_MULTI_GAME_WS_SPEC_zh-TW

版本：v2026-05-20 07:48
用途：玩家前端 WebSocket 串接規格，涵蓋平台大廳、帳號、錢包、報表、德州撲克、大老二。


## 1. WebSocket 基本封包格式

Client -> Server：

```json
{
  "type": "message_type",
  "data": {}
}
```

Server -> Client：

```json
{
  "type": "message_type",
  "data": {}
}
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `type` | string | 是 | 訊息名稱。前端依此決定 handler。 |
| `data` | object | 視訊息 | 訊息資料。沒有資料時傳 `{}`。 |

通用資料格式：

| 項目 | 說明 |
|---|---|
| 金額 | 伺服器目前以整數處理。 |
| 時間戳 | 事件中的 `last_action_at` 多為毫秒 timestamp。 |
| 卡牌 | 使用兩碼字串，例如 `3d`、`Ks`。 |
| 場次 | `stakes` 可翻成「場次」或「遊戲級別」；前端加入桌子時傳 `stakes_id`。 |

## 1.1 卡牌字串格式

牌用兩碼字串表示。

```text
As, Ah, Ad, Ac
Ks, Kh, Kd, Kc
Qs, Qh, Qd, Qc
Js, Jh, Jd, Jc
Ts, Th, Td, Tc
9s, 9h, 9d, 9c
8s, 8h, 8d, 8c
7s, 7h, 7d, 7c
6s, 6h, 6d, 6c
5s, 5h, 5d, 5c
4s, 4h, 4d, 4c
3s, 3h, 3d, 3c
2s, 2h, 2d, 2c
```

第一碼：

| 值 | 說明 |
|---|---|
| `A` | Ace |
| `K` | King |
| `Q` | Queen |
| `J` | Jack |
| `T` | Ten |
| `9`, `8`, `7`, `6`, `5`, `4`, `3`, `2` | 點數 |

第二碼：

| 值 | 說明 | 圖案 |
|---|---|---|
| `s` | spade | ♠ |
| `h` | heart | ♥ |
| `d` | diamond | ♦ |
| `c` | club | ♣ |

## 2. 遊戲與通用概念

| 名稱 | 說明 |
|---|---|
| 平台大廳 | `lobby_state`，列出可進入的遊戲。 |
| 遊戲大廳 | `game_lobby_state`，列出指定遊戲可選場次與人數。 |
| 遊戲桌 | 入桌成功收到 `table_joined`，後續以 `table_state` 同步狀態。 |
| 錢包 | `wallet_balance` 是玩家主錢包，`table_chips` 是目前桌上籌碼。 |
| token | 登入、訪客登入、註冊成功後會得到 `token`，重連使用 `auth_token`。 |
| ping | 所有遊戲共用 `ping` / `pong`。 |

| `game_id` | 遊戲 | WS 支援 | 說明 |
|---|---|---|---|
| `texas_holdem` | 德州撲克 | 是 | 進入遊戲後會收到可選場次，前端使用 `stakes[].id` 加入遊戲桌。 |
| `big_two` | 大老二 | 是 | 進入遊戲後會收到可選場次，前端使用 `stakes[].id` 加入遊戲桌。 |

## 3. Client -> Server 訊息總表

| type | 分類 | 說明 |
|---|---|---|
| `login` | 帳號 | 會員登入。 |
| `guest_login` | 帳號 | 訪客登入，可選是否為陪玩員。 |
| `auth_token` | 帳號 | 使用 token 驗證與重連。 |
| `register_verification_request` | 帳號 | 註冊前請求信箱或手機驗證碼。 |
| `register` | 帳號 | 使用驗證碼註冊會員。 |
| `forgot_password_request` | 帳號 | 忘記密碼流程請求驗證碼。 |
| `forgot_password_reset` | 帳號 | 使用驗證碼重設密碼。 |
| `update_profile` | 帳號 | 更新暱稱或頭像。 |
| `logout` | 帳號 | 登出並清除目前 token。 |
| `ping` | 通用 | 測量 WebSocket 延遲。 |
| `enter_lobby` | 通用 | 要求伺服器回傳平台大廳狀態。 |
| `enter_game` | 通用 | 進入指定遊戲大廳。 |
| `join_stakes` | 通用 | 依 `game_id` 與 `stakes_id` 系統配桌。 |
| `leave_room` | 通用 | 離開目前遊戲桌。 |
| `switch_room` | 通用 | 同場次換桌。 |
| `get_table_state` | 通用 | 要求伺服器回傳目前遊戲桌狀態。 |
| `player_action` | 通用 | 送出目前遊戲桌的回合操作。 |
| `rebuy_decision` | 通用 | 送出目前遊戲桌的補籌回覆。 |
| `hand_replay` | 報表 | 查詢自己參與過的牌局回放。 |
| `hand_reports` | 報表 | 查詢自己的手牌報表。 |
| `daily_settlement_14d` | 報表 | 查詢自己的近 14 天每日結算。 |

## 4. Server -> Client 訊息總表

| type | 分類 | 說明 |
|---|---|---|
| `login_ok` | 帳號 | 會員登入成功。 |
| `auth_ok` | 帳號 | token 驗證成功。 |
| `register_verification_code_sent` | 帳號 | 註冊驗證碼已建立。 |
| `forgot_password_code_sent` | 帳號 | 忘記密碼驗證碼已建立。 |
| `forgot_password_reset_ok` | 帳號 | 重設密碼成功。 |
| `logout_ok` | 帳號 | 登出成功。 |
| `update_profile_ok` | 帳號 | 更新個人資料成功。 |
| `forced_logout` | 帳號 | 被伺服器強制登出。 |
| `pong` | 通用 | ping 回應。 |
| `lobby_state` | 通用 | 平台大廳狀態。 |
| `game_lobby_state` | 通用 | 指定遊戲大廳狀態。 |
| `wallet_state` | 通用 | 錢包與桌上籌碼狀態。 |
| `table_joined` | 通用 | 入桌成功。 |
| `table_player_joined` | 通用 | 有玩家加入目前桌。 |
| `table_countdown` | 通用 | 遊戲桌開局倒數。 |
| `hand_start` | 通用 | 新一手或新一局開始。 |
| `table_state` | 通用 | 目前遊戲桌完整狀態。 |
| `rebuy_offer` | 通用 | 補籌提示。 |
| `rebuy_ack` | 通用 | 補籌回覆已收到。 |
| `rebuy_result` | 通用 | 補籌結果。 |
| `action_request` | 通用 | 請求目前玩家操作。 |
| `deal_card` | 通用 | 公開派牌動畫。 |
| `deal_private` | 通用 | 只給本人看的私牌。 |
| `hole_cards` | 通用 | 同步自己的完整手牌。 |
| `turn` | 通用 | 通知目前輪到哪個座位。 |
| `player_action` | 通用 | 廣播玩家操作結果。 |
| `award` | 通用 | 派彩結果。 |
| `hand_end` | 通用 | 牌局結束結果。 |
| `hand_replay_ok` | 報表 | 手牌回放查詢成功。 |
| `hand_reports_ok` | 報表 | 手牌報表查詢成功。 |
| `daily_settlement_14d_ok` | 報表 | 近 14 天每日結算查詢成功。 |
| `error` | 錯誤 | 請求失敗或狀態不允許。 |
| `post_blinds` | 德州撲克 | 德州撲克盲注已支付。 |
| `betting_start` | 德州撲克 | 德州撲克下注輪開始。 |
| `betting_complete` | 德州撲克 | 德州撲克下注輪結束。 |
| `deal_community` | 德州撲克 | 德州撲克公共牌發牌。 |
| `showdown` | 德州撲克 | 德州撲克攤牌資訊。 |
| `hand_result` | 大老二 | 大老二單局結束時的結果與結算摘要。 |

## 5. 帳號與認證訊息

### 5.1 login 會員登入

用途：會員以帳號密碼登入。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `username` | string | 是 | 非空字串 | 信箱、手機或一般帳號。 |
| `password` | string | 是 | 非空字串 | 密碼。 |

成功回應：`login_ok`。

失敗回應：`error`，常見 `LOGIN_INVALID_DATA`、`LOGIN_PARAM_MISSING`、`LOGIN_FAILED`、`LOGIN_BACKEND_ERROR`。

前端處理：保存 `token`，後續重連送 `auth_token`。

請求範例：

```json
{"type":"login","data":{"username":"user@example.com","password":"password123"}}
```

成功範例：

```json
{"type":"login_ok","data":{"member_no":"M202605200001","username":"玩家","avatar":"avatar_001","is_guest":false,"is_companion":false,"token":"token-value","wallet_balance":10000}}
```

失敗範例：

```json
{"type":"error","data":{"code":"LOGIN_FAILED","message":"帳號或密碼錯誤"}}
```

### 5.2 guest_login 訪客登入

用途：建立訪客身份登入。壓測或陪玩員可帶 `is_companion`。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `is_companion` | boolean | 否 | 預設 `false` | 是否標記為陪玩員。一般玩家前端可不傳。 |
| `username` | string | 否 | 字串 | 指定訪客顯示名稱；未填由伺服器產生。 |
| `avatar` | string | 否 | 字串 | 頭像代碼。 |

成功回應：`login_ok`。

失敗回應：`error`，常見 `GUEST_FAILED`、`GUEST_BACKEND_ERROR`。

前端處理：與正式會員登入相同保存 `token`。

請求範例：

```json
{"type":"guest_login","data":{}}
```

成功範例：

```json
{"type":"login_ok","data":{"member_no":"GUEST-100","username":"訪客100","avatar":"avatar_001","is_guest":true,"is_companion":false,"token":"guest-token","wallet_balance":10000}}
```

失敗範例：

```json
{"type":"error","data":{"code":"GUEST_BACKEND_ERROR","message":"訪客登入服務異常"}}
```

### 5.3 auth_token token 驗證與重連

用途：頁面重新整理、回到前景或 WebSocket 重連時恢復登入狀態。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `token` | string | 是 | 非空字串 | 先前登入取得的 token。 |
| `trigger` | string | 否 | 字串 | 前端可帶重連原因，例如 `visibility_resume`。 |

成功回應：`auth_ok`，後續可能補送 `lobby_state`、`game_lobby_state`、`table_state`、`wallet_state`。

失敗回應：`error`，常見 `AUTH_TOKEN_MISSING`、`AUTH_TOKEN_INVALID`。

前端處理：若驗證失敗，清除本地 token 並回登入畫面。

請求範例：

```json
{"type":"auth_token","data":{"token":"token-value","trigger":"visibility_resume"}}
```

成功範例：

```json
{"type":"auth_ok","data":{"token":"token-value","member_no":"M202605200001","username":"玩家","avatar":"avatar_001","is_guest":false,"wallet_balance":10000}}
```

失敗範例：

```json
{"type":"error","data":{"code":"AUTH_TOKEN_INVALID","message":"登入憑證無效"}}
```

### 5.4 register_verification_request 註冊驗證碼

用途：註冊前先請求信箱或手機驗證碼。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `username` | string | 是 | email、`09xxxxxxxx` 或 `+8869xxxxxxxx` | 要註冊的帳號。 |

成功回應：`register_verification_code_sent`。

失敗回應：`error`，常見 `REGISTER_VERIFICATION_INVALID_DATA`、`REGISTER_VERIFICATION_ACCOUNT_MISSING`。

前端處理：成功後顯示輸入驗證碼欄位；錯誤訊息不應提示固定測試碼。

請求範例：

```json
{"type":"register_verification_request","data":{"username":"0912345678"}}
```

成功範例：

```json
{"type":"register_verification_code_sent","data":{"accepted":true,"mock":true,"account_type":"phone","masked_account":"091****678","expires_in_sec":600,"message":"驗證碼已送出"}}
```

失敗範例：

```json
{"type":"error","data":{"code":"REGISTER_VERIFICATION_INVALID_DATA","message":"註冊驗證資料格式錯誤"}}
```

### 5.5 register 註冊會員

用途：使用註冊驗證碼建立正式會員。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `username` | string | 是 | email、`09xxxxxxxx` 或 `+8869xxxxxxxx` | 會員帳號。 |
| `password` | string | 是 | 非空字串 | 密碼。 |
| `code` | string | 是 | 6 位數字 | 註冊驗證碼。 |
| `avatar` | string | 否 | 字串 | 頭像代碼。 |

成功回應：`login_ok`。

失敗回應：`error`，常見 `REGISTER_INVALID_DATA`、`REGISTER_VERIFICATION_CODE_INVALID`、`REGISTER_FAILED`。

前端處理：註冊成功等同登入成功，保存 `token`。

請求範例：

```json
{"type":"register","data":{"username":"0912345678","password":"password123","code":"168888","avatar":"avatar_001"}}
```

成功範例：

```json
{"type":"login_ok","data":{"member_no":"M202605200002","username":"0912345678","avatar":"avatar_001","is_guest":false,"token":"token-value","wallet_balance":0}}
```

失敗範例：

```json
{"type":"error","data":{"code":"REGISTER_VERIFICATION_CODE_INVALID","message":"註冊驗證碼錯誤"}}
```

### 5.6 forgot_password_request 忘記密碼驗證碼

用途：以信箱或手機號碼請求忘記密碼驗證碼。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `account` | string | 是 | email、`09xxxxxxxx` 或 `+8869xxxxxxxx` | 要重設密碼的帳號。 |

成功回應：`forgot_password_code_sent`。

失敗回應：`error`，常見 `PASSWORD_RESET_INVALID_DATA`、`PASSWORD_RESET_ACCOUNT_MISSING`。

前端處理：進入輸入驗證碼與新密碼畫面。

請求範例：

```json
{"type":"forgot_password_request","data":{"account":"user@example.com"}}
```

成功範例：

```json
{"type":"forgot_password_code_sent","data":{"accepted":true,"mock":true,"account_type":"email","masked_account":"u***@example.com","expires_in_sec":600,"message":"驗證碼已送出"}}
```

失敗範例：

```json
{"type":"error","data":{"code":"PASSWORD_RESET_ACCOUNT_MISSING","message":"請輸入信箱或手機號碼"}}
```

### 5.7 forgot_password_reset 重設密碼

用途：使用驗證碼與新密碼完成重設。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `account` | string | 是 | email 或手機 | 要重設的帳號。 |
| `code` | string | 是 | 6 位數字 | 驗證碼。 |
| `password` | string | 是 | 非空字串 | 新密碼。 |
| `confirm_password` | string | 是 | 需等於 `password` | 確認新密碼。 |

成功回應：`forgot_password_reset_ok`。

失敗回應：`error`，常見 `PASSWORD_RESET_CODE_INVALID`、`PASSWORD_RESET_PASSWORD_MISMATCH`。

前端處理：成功後導回登入畫面。

請求範例：

```json
{"type":"forgot_password_reset","data":{"account":"user@example.com","code":"168888","password":"newpass123","confirm_password":"newpass123"}}
```

成功範例：

```json
{"type":"forgot_password_reset_ok","data":{"success":true,"message":"密碼已重設"}}
```

失敗範例：

```json
{"type":"error","data":{"code":"PASSWORD_RESET_CODE_INVALID","message":"驗證碼錯誤"}}
```

### 5.8 update_profile 更新個人資料

用途：更新玩家暱稱或頭像。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `username` | string | 否 | 字串 | 新暱稱。 |
| `avatar` | string | 否 | 字串 | 新頭像代碼。 |

成功回應：`update_profile_ok`。

失敗回應：`error`，常見 `PROFILE_INVALID_DATA`、`PROFILE_UPDATE_FAILED`。

前端處理：成功後更新本地玩家資訊。

請求範例：

```json
{"type":"update_profile","data":{"username":"新暱稱","avatar":"avatar_002"}}
```

成功範例：

```json
{"type":"update_profile_ok","data":{"user_id":362,"member_no":"M202605200001","username":"新暱稱","avatar":"avatar_002"}}
```

失敗範例：

```json
{"type":"error","data":{"code":"PROFILE_UPDATE_FAILED","message":"更新個人資料失敗"}}
```

### 5.9 logout 登出

用途：登出目前帳號並清除目前 token。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| 無 | - | 否 | 建議傳 `{}` | 伺服器不讀取任何 `data` 欄位，會依目前連線身份登出。 |

成功回應：`logout_ok`。

失敗回應：`error`，常見 `LOGOUT_FAILED`。

前端處理：成功後清除本地 token 與目前遊戲狀態。

請求範例：

```json
{"type":"logout","data":{}}
```

成功範例：

```json
{"type":"logout_ok","data":{"message":"已登出"}}
```

失敗範例：

```json
{"type":"error","data":{"code":"LOGOUT_FAILED","message":"登出失敗"}}
```

## 6. 通用 Client -> Server 訊息

### 6.1 ping 延遲測量

用途：測量 WebSocket 延遲，所有遊戲共用。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `client_ts` | integer | 否 | 毫秒 timestamp | 前端送出時間。 |

成功回應：`pong`。

失敗回應：通常不會失敗；封包格式錯誤時可能收到 `INVALID_MESSAGE`。

前端處理：用收到 `pong` 的時間扣掉送出時間計算延遲。

請求範例：

德州範例:

```json
{"type":"ping","data":{"client_ts":1770000000000}}
```

大老二範例:

```json
{"type":"ping","data":{"client_ts":1770000000000}}
```

成功範例：

德州範例:

```json
{"type":"pong","data":{"server_ts":1770000000100}}
```

大老二範例:

```json
{"type":"pong","data":{"server_ts":1770000000100}}
```

失敗範例：

```json
{"type":"error","data":{"code":"INVALID_MESSAGE","message":"訊息格式錯誤"}}
```

### 6.2 enter_lobby 進入平台大廳

用途：要求伺服器回傳平台大廳狀態。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| 無 | - | 否 | 建議傳 `{}` | 伺服器不讀取任何 `data` 欄位，會依目前連線身份與所在桌狀態回傳大廳或桌面狀態。 |

成功回應：`lobby_state`。

失敗回應：`error`，常見 `NOT_AUTHENTICATED`。

前端處理：顯示遊戲列表。

請求範例：

德州範例:

```json
{"type":"enter_lobby","data":{}}
```

大老二範例:

```json
{"type":"enter_lobby","data":{}}
```

成功範例：

```json
{"type":"lobby_state","data":{"games":[{"id":"texas_holdem","name":"texas_holdem","status":"available","implemented":true},{"id":"big_two","name":"big_two","status":"available","implemented":true}]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"NOT_AUTHENTICATED","message":"尚未登入"}}
```

### 6.3 enter_game 進入遊戲大廳

用途：進入指定遊戲大廳並取得場次資訊。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 是 | 見第 2 章 game_id 表 | 要進入的遊戲。 |

成功回應：`game_lobby_state`。

失敗回應：`error`，常見 `ENTER_GAME_MISSING_ID`、`GAME_NOT_IMPLEMENTED`。

前端處理：使用 `stakes[].id` 顯示可入桌場次。

請求範例：

德州範例:

```json
{"type":"enter_game","data":{"game_id":"texas_holdem"}}
```

大老二範例:

```json
{"type":"enter_game","data":{"game_id":"big_two"}}
```

成功範例：

```json
{"type":"game_lobby_state","data":{"game_id":"big_two","game_name":"big_two","stakes":[{"id":"b10","base_score":10,"min_buyin":1000,"max_buyin":20000,"display":"底分 10"}],"total_table_count":1,"total_player_count":2}}
```

失敗範例：

```json
{"type":"error","data":{"code":"ENTER_GAME_MISSING_ID","message":"缺少遊戲 id"}}
```

### 6.4 join_stakes 系統配桌

用途：依遊戲與場次加入桌子。玩家不能指定桌號。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 是 | 見第 2 章 game_id 表 | 要加入的遊戲。 |
| `stakes_id` | string | 是 | 來自 `game_lobby_state.stakes[].id` | 要加入的場次。 |
| `buyin` | integer | 是 | 場次允許範圍內 | 帶入籌碼。 |

成功回應：`table_joined`，後續可能收到 `wallet_state`、`table_countdown`、`hand_start`。

失敗回應：`error`，常見 `JOIN_STAKES_UNKNOWN_STAKES`、`BUYIN_TOO_LOW`、`JOIN_STAKES_TABLE_FULL`。

前端處理：收到 `table_joined` 後切到遊戲桌畫面。

請求範例：

德州範例:

```json
{"type":"join_stakes","data":{"game_id":"texas_holdem","stakes_id":"t25_50","buyin":1000}}
```

大老二範例:

```json
{"type":"join_stakes","data":{"game_id":"big_two","stakes_id":"b10","buyin":1000}}
```

成功範例：

德州範例:

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"table_id":"texas_holdem_t25_50_xxxx","game_id":"texas_holdem","stakes_id":"t25_50","players":[]},"waiting_this_hand":true}}
```

大老二範例:

```json
{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"table":{"table_id":"big_two_b10_xxxx","game_id":"big_two","stakes_id":"b10","players":[]},"waiting_this_hand":false}}
```

失敗範例：

```json
{"type":"error","data":{"code":"BUYIN_TOO_LOW","message":"帶入金額低於下限"}}
```

### 6.5 leave_room 離開目前遊戲桌

用途：離開目前遊戲桌並返回遊戲大廳。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| 無 | - | 否 | 建議傳 `{}` | 伺服器不讀取任何 `data` 欄位，會依目前連線所在遊戲桌執行離桌。 |

成功回應：通常會收到 `table_state` 的 `hero_seat:null`、`game_lobby_state`、`wallet_state`。

失敗回應：`error`，常見 `LEAVE_ROOM_FAILED`。

前端處理：以收到的 state 決定畫面，不要只靠送出請求立即切畫面。

請求範例：

德州範例:

```json
{"type":"leave_room","data":{}}
```

大老二範例:

```json
{"type":"leave_room","data":{}}
```

成功範例：

德州範例:

```json
{"type":"game_lobby_state","data":{"game_id":"texas_holdem","stakes":[]}}
```

大老二範例:

```json
{"type":"game_lobby_state","data":{"game_id":"big_two","stakes":[]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"LEAVE_ROOM_FAILED","message":"離開桌子失敗"}}
```

### 6.6 switch_room 同場次換桌

用途：同場次重新系統配桌。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `buyin` | integer | 否 | 正整數 | 換桌時帶入籌碼；未填通常沿用桌上籌碼。 |

成功回應：`table_joined`。

失敗回應：`error`，常見 `SWITCH_ROOM_NOT_SUPPORTED`、`SWITCH_ROOM_TABLE_FULL`。

前端處理：收到 `table_joined` 後更新桌面。

請求範例：

德州範例:

```json
{"type":"switch_room","data":{"buyin":1000}}
```

大老二範例:

```json
{"type":"switch_room","data":{"buyin":1000}}
```

成功範例：

德州範例:

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"table_id":"texas_holdem_t25_50_yyyy","game_id":"texas_holdem","stakes_id":"t25_50"},"waiting_this_hand":true}}
```

大老二範例:

```json
{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"table":{"table_id":"big_two_b10_xxxx","game_id":"big_two","stakes_id":"b10"},"waiting_this_hand":false}}
```

失敗範例：

```json
{"type":"error","data":{"code":"SWITCH_ROOM_TABLE_FULL","message":"換桌失敗，目標桌位已滿"}}
```

### 6.7 get_table_state 同步目前遊戲桌狀態

用途：要求伺服器回傳目前遊戲桌狀態。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| 無 | - | 否 | `data` 若有傳必須是 object，建議傳 `{}` | 伺服器不讀取任何 `data` 欄位，會依目前連線身份查詢所在遊戲桌。 |

成功回應：`table_state`。

失敗回應：`error`，常見 `NOT_IN_TABLE`。

前端處理：用於重連後或懷疑畫面不同步時刷新。

請求範例：

```json
{"type":"get_table_state","data":{}}
```

成功範例：

德州範例：

```json
{"type":"table_state","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[]}}}
```

大老二範例：

```json
{"type":"table_state","data":{"game_id":"big_two","hero_seat":0,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[]}}}
```

失敗範例：

```json
{"type":"error","data":{"code":"NOT_IN_TABLE","message":"目前不在遊戲桌內"}}
```

### 6.8 player_action 送出回合操作

用途：送出目前遊戲桌的回合操作。德州與大老二共用同一個 Client -> Server type。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `action` | string | 是 | 依遊戲與 `action_request.allowed` | 德州可為 `fold`、`call`、`check`、`bet`、`raise`、`allin`；大老二可為 `play_cards`、`pass`。 |
| `raise_to` | integer | 條件 | 德州加注時需要 | 目標總下注額。 |
| `cards` | string[] | 條件 | 大老二出牌時需要 | 要出的牌。 |
| `action_seq` | integer | 條件 | 大老二 `action_request` 會提供 | 避免舊操作封包被重複接受。 |

成功回應：`player_action`，後續可能有 `turn`、`action_request`、`award`、`hand_end`。

失敗回應：`error`，常見 `ACTION_INVALID_DATA`、`ACTION_REJECTED`、`NOT_YOUR_TURN`。

前端處理：按鈕應依 `action_request.allowed` 顯示。

請求範例：

德州範例：

```json
{"type":"player_action","data":{"action":"call"}}
```

大老二範例：

```json
{"type":"player_action","data":{"action":"play_cards","cards":["3d"],"action_seq":12}}
```

成功範例：

德州範例：

```json
{"type":"player_action","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"action":"call","paid":50,"pot":500,"current_bet":50,"bets":{"5":50},"round_total_bet":500}}
```

大老二範例：

```json
{"type":"player_action","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"action":"play_cards","cards":["3d"],"remaining_count":12}}
```

失敗範例：

```json
{"type":"error","data":{"code":"ACTION_REJECTED","message":"動作不合法"}}
```

### 6.9 rebuy_decision 補籌回覆

用途：送出目前遊戲桌的補籌回覆。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `accepted` | boolean | 是 | `true` 或 `false` | 是否補籌。 |
| `amount` | integer | 條件 | 正整數 | 要補的金額；依遊戲規則可能由伺服器決定。 |

成功回應：`rebuy_ack`，後續 `rebuy_result`。

失敗回應：`error`，常見 `REBUY_INVALID_DATA`、`REBUY_NOT_PENDING`。

前端處理：收到 `rebuy_offer` 時顯示彈窗，送出後等待結果。

請求範例：

德州範例：

```json
{"type":"rebuy_decision","data":{"accepted":true,"amount":1000}}
```

大老二範例：

```json
{"type":"rebuy_decision","data":{"accepted":true,"amount":1000}}
```

成功範例：

德州範例：

```json
{"type":"rebuy_ack","data":{"accepted":true}}
```

大老二範例：

```json
{"type":"rebuy_ack","data":{"accepted":true}}
```

失敗範例：

```json
{"type":"error","data":{"code":"REBUY_NOT_PENDING","message":"目前沒有等待回覆的補籌提示"}}
```

## 7. 報表訊息

### 7.1 hand_replay 查詢手牌回放

用途：查詢自己參與過的牌局回放。會員只能查自己的牌局；若該會員不是該手牌參與者，會回 `HAND_REPLAY_FORBIDDEN`。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 否 | 見第 2 章 game_id 表 | 不傳時伺服器會依目前所在遊戲推斷。 |
| `table_id` | string | 是 | 非空字串 | 牌局所在桌 id。 |
| `hand_id` | integer | 是 | 正整數 | 牌局 id。 |

成功回應：`hand_replay_ok`。

失敗回應：`error`，常見 `HAND_REPLAY_INVALID_DATA`、`HAND_REPLAY_FAILED`、`HAND_REPLAY_FORBIDDEN`。

前端處理：只能顯示 `hero_hole_cards` 與回放資料中允許看到的內容。

請求範例：

```json
{"type":"hand_replay","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10}}
```

成功範例：

```json
{"type":"hand_replay_ok","data":{"hero_seat":5,"hero_hole_cards":["As","Ah"],"replay":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"players":[],"timeline":[]}}}
```

失敗範例：

```json
{"type":"error","data":{"code":"HAND_REPLAY_FORBIDDEN","message":"只能查詢自己參與的牌局回放"}}
```

### 7.2 hand_reports 查詢手牌報表

用途：查詢自己的手牌報表。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 否 | 見第 2 章 game_id 表 | 不傳時伺服器會依目前所在遊戲推斷。 |
| `report_date` | string | 是 | `YYYY-MM-DD` | 報表日期。 |
| `limit` | integer | 否 | 1 到 100，預設 20 | 回傳筆數。 |
| `offset` | integer | 否 | 0 以上，預設 0 | 分頁起點。 |

成功回應：`hand_reports_ok`。

失敗回應：`error`，常見 `HAND_REPORTS_INVALID_DATA`、`HAND_REPORTS_FAILED`。

前端處理：顯示玩家自己的手牌結果列表。

請求範例：

```json
{"type":"hand_reports","data":{"game_id":"big_two","report_date":"2026-05-20","limit":20,"offset":0}}
```

成功範例：

```json
{"type":"hand_reports_ok","data":{"user_id":362,"report_date":"2026-05-20","game_id":"big_two","limit":20,"offset":0,"items":[]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"HAND_REPORTS_INVALID_DATA","message":"手牌報表查詢資料格式錯誤"}}
```

### 7.3 daily_settlement_14d 查詢 14 天結算

用途：查詢自己的近 14 天每日結算。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 否 | 見第 2 章 game_id 表 | 不傳時伺服器會依目前所在遊戲推斷。 |

成功回應：`daily_settlement_14d_ok`。

失敗回應：`error`，常見 `DAILY_SETTLEMENT_INVALID_DATA`、`DAILY_SETTLEMENT_FAILED`。

前端處理：顯示每日輸贏、抽水與手數統計。

請求範例：

```json
{"type":"daily_settlement_14d","data":{"game_id":"big_two"}}
```

成功範例：

```json
{"type":"daily_settlement_14d_ok","data":{"user_id":362,"game_id":"big_two","items":[]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"DAILY_SETTLEMENT_FAILED","message":"讀取每日結算失敗"}}
```

## 8. 德州撲克 Texas Hold'em

### 8.1 post_blinds 德州盲注

用途：通知盲注已支付。

方向：Server -> Client

事件範例：

```json
{"type":"post_blinds","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"sb_seat":3,"bb_seat":4,"sb_amount":25,"bb_amount":50,"pot":75,"current_bet":50}}
```

### 8.2 betting_start 德州下注輪開始

用途：通知德州某一輪下注開始。

方向：Server -> Client

事件範例：

```json
{"type":"betting_start","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"round":"flop","action_seat":3,"current_bet":0,"pot":500,"bets":{}}}
```

### 8.3 betting_complete 德州下注輪結束

用途：通知德州某一輪下注結束。

方向：Server -> Client

事件範例：

```json
{"type":"betting_complete","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"pot":750,"bets":{"0":50},"current_bet":50}}
```

### 8.4 deal_community 德州公共牌

用途：通知德州公共牌發出。

方向：Server -> Client

事件範例：

```json
{"type":"deal_community","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"round":"flop","cards":["As","4d","Kd"],"community":["As","4d","Kd"]}}
```

### 8.5 showdown 德州攤牌

用途：通知攤牌揭露資料。

方向：Server -> Client

事件範例：

```json
{"type":"showdown","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"reason":"showdown","reveals":{"0":{"seat":0,"hole":["As","Ah"],"best5":["As","Ah","Kd","4d","3c"],"hand_rank":"one_pair"}}}}
```

## 9. 大老二

### 9.1 hand_result 大老二單局結束結果

用途：通知大老二單局已結束，並回傳勝方、剩牌、分數變化與結算摘要。

方向：Server -> Client

事件範例：

```json
{"type":"hand_result","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","hand_id":3,"winner_seat":0,"results":[{"seat":0,"remaining_count":0,"score_delta":30},{"seat":1,"remaining_count":3,"score_delta":-30}]}}
```

## 10. 通用 Server -> Client 事件資料

### 10.1 login_ok 會員登入成功

用途：通知登入成功並回傳 token 與帳號資料。

方向：Server -> Client

事件範例：

```json
{"type":"login_ok","data":{"token":"token-value","wallet_balance":10000}}
```

### 10.2 auth_ok token 驗證成功

用途：通知 token 驗證成功。

方向：Server -> Client

事件範例：

```json
{"type":"auth_ok","data":{"token":"token-value","wallet_balance":10000}}
```

### 10.3 register_verification_code_sent 註冊驗證碼已建立

用途：通知註冊驗證碼已建立。

方向：Server -> Client

事件範例：

```json
{"type":"register_verification_code_sent","data":{"accepted":true,"mock":true}}
```

### 10.4 forgot_password_code_sent 忘記密碼驗證碼已建立

用途：通知忘記密碼驗證碼已建立。

方向：Server -> Client

事件範例：

```json
{"type":"forgot_password_code_sent","data":{"accepted":true,"mock":true}}
```

### 10.5 forgot_password_reset_ok 重設密碼成功

用途：通知密碼已重設。

方向：Server -> Client

事件範例：

```json
{"type":"forgot_password_reset_ok","data":{"success":true}}
```

### 10.6 logout_ok 登出成功

用途：通知登出成功。

方向：Server -> Client

事件範例：

```json
{"type":"logout_ok","data":{"message":"已登出"}}
```

### 10.7 update_profile_ok 更新個人資料成功

用途：通知個人資料更新成功。

方向：Server -> Client

事件範例：

```json
{"type":"update_profile_ok","data":{"user_id":362,"username":"新暱稱"}}
```

### 10.8 forced_logout 強制登出

用途：通知目前連線被伺服器強制登出。

方向：Server -> Client

事件範例：

```json
{"type":"forced_logout","data":{"code":"DUPLICATE_LOGIN","message":"帳號已在其他地方登入"}}
```

### 10.9 pong 延遲測量回應

用途：回應 `ping`。

方向：Server -> Client

事件範例：

```json
{"type":"pong","data":{"server_ts":1770000000100}}
```

### 10.10 lobby_state 平台大廳狀態

用途：回傳平台遊戲列表。

方向：Server -> Client

事件範例：

```json
{"type":"lobby_state","data":{"games":[]}}
```

### 10.11 game_lobby_state 遊戲大廳狀態

用途：回傳指定遊戲的場次資訊。

方向：Server -> Client

事件範例：

```json
{"type":"game_lobby_state","data":{"game_id":"big_two","stakes":[]}}
```

### 10.12 wallet_state 錢包狀態

用途：同步主錢包與目前桌上籌碼。

方向：Server -> Client

事件範例：

```json
{"type":"wallet_state","data":{"wallet_balance":10000,"table_chips":1000}}
```

### 10.13 table_joined 入桌成功

用途：通知玩家已進入遊戲桌。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"waiting_this_hand":true,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[]}}}
```

大老二範例：

```json
{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"waiting_this_hand":false,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[]}}}
```

### 10.14 table_player_joined 玩家加入桌子

用途：通知有玩家加入目前桌。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_player_joined","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","player":{"seat":5,"chips":1000,"in_hand":false}}}
```

大老二範例：

```json
{"type":"table_player_joined","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","player":{"seat":0,"chips":1000,"in_hand":true}}}
```

### 10.15 table_countdown 開局倒數

用途：通知遊戲桌開局倒數。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_countdown","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","seconds":3}}
```

大老二範例：

```json
{"type":"table_countdown","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","seconds":3}}
```

### 10.16 hand_start 牌局開始

用途：通知新一手或新一局開始。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"hand_start","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"dealer_seat":2,"sb_seat":3,"bb_seat":4,"table":{}}}
```

大老二範例：

```json
{"type":"hand_start","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"table":{}}}
```

### 10.17 table_state 遊戲桌狀態

用途：同步目前遊戲桌完整狀態。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_state","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[]}}}
```

大老二範例：

```json
{"type":"table_state","data":{"game_id":"big_two","hero_seat":0,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[]}}}
```

### 10.18 rebuy_offer 補籌提示

用途：提示玩家可以補籌。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"rebuy_offer","data":{"game_id":"texas_holdem","amount":1000}}
```

大老二範例：

```json
{"type":"rebuy_offer","data":{"game_id":"big_two","amount":1000}}
```

### 10.19 rebuy_ack 補籌回覆已收到

用途：通知補籌回覆已收到。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"rebuy_ack","data":{"accepted":true}}
```

大老二範例：

```json
{"type":"rebuy_ack","data":{"accepted":true}}
```

### 10.20 rebuy_result 補籌結果

用途：通知補籌是否成功。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"rebuy_result","data":{"success":true,"table_chips":1000}}
```

大老二範例：

```json
{"type":"rebuy_result","data":{"success":true,"table_chips":1000}}
```

### 10.21 action_request 請求操作

用途：通知目前玩家可以做哪些操作。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"action_request","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"to_call":50,"current_bet":100,"my_bet":50,"min_raise_to":150,"big_blind":50,"pot":500,"round_total_bet":500,"allowed":["fold","call","raise","allin"],"timeout":10}}
```

大老二範例：

```json
{"type":"action_request","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"allowed":["play_cards","pass"],"timeout":10,"action_seq":12}}
```

### 10.22 deal_card 公開派牌動畫

用途：通知前端播放派牌動畫。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"deal_card","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"card_index":0}}
```

大老二範例：

```json
{"type":"deal_card","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"card_index":0}}
```

### 10.23 deal_private 自己的私牌

用途：把實際牌面只送給該玩家本人。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"deal_private","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"card_index":0,"card":"As"}}
```

大老二範例：

```json
{"type":"deal_private","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"card_index":0,"card":"3d"}}
```

### 10.24 hole_cards 同步自己的手牌

用途：同步自己的完整手牌。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"hole_cards","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"cards":["As","Ah"]}}
```

大老二範例：

```json
{"type":"hole_cards","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"cards":["3d","4d","5d"]}}
```

### 10.25 turn 輪到座位

用途：通知目前輪到哪個座位。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"turn","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"timeout":10,"round":"preflop"}}
```

大老二範例：

```json
{"type":"turn","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"timeout":10,"action_seq":12}}
```

### 10.26 player_action 玩家操作結果

用途：廣播玩家操作結果。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"player_action","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"action":"call","paid":50,"pot":500,"current_bet":50,"bets":{"5":50},"round_total_bet":500}}
```

大老二範例：

```json
{"type":"player_action","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"action":"pass","remaining_count":12}}
```

### 10.27 award 派彩結果

用途：通知派彩結果。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"award","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"awards":[],"player_results":[]}}
```

大老二範例：

```json
{"type":"award","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"awards":[],"player_results":[]}}
```

### 10.28 hand_end 牌局結束

用途：通知牌局結束與結果。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"hand_end","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"reason":"showdown","player_results":[]}}
```

大老二範例：

```json
{"type":"hand_end","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"reason":"completed","player_results":[]}}
```

### 10.29 hand_replay_ok 手牌回放查詢成功

用途：回傳手牌回放資料。

方向：Server -> Client

事件範例：

```json
{"type":"hand_replay_ok","data":{"hero_seat":0,"hero_hole_cards":[],"replay":{}}}
```

### 10.30 hand_reports_ok 手牌報表查詢成功

用途：回傳手牌報表列表。

方向：Server -> Client

事件範例：

```json
{"type":"hand_reports_ok","data":{"user_id":362,"items":[]}}
```

### 10.31 daily_settlement_14d_ok 14 天結算查詢成功

用途：回傳近 14 天每日結算。

方向：Server -> Client

事件範例：

```json
{"type":"daily_settlement_14d_ok","data":{"user_id":362,"items":[]}}
```

### 10.32 error 錯誤訊息

用途：通知請求失敗或狀態不允許。

方向：Server -> Client

`data` 欄位：

| 欄位 | 型別 | 條件 | 說明 |
|---|---|---|---|
| `code` | string | 是 | 錯誤代碼，前端依此分流。 |
| `message` | string | 是 | 顯示文字，已盡量轉為中文。 |
| `reason` | string | 否 | 更細節的拒絕原因。 |

事件範例：

```json
{"type":"error","data":{"code":"ACTION_REJECTED","message":"動作不合法"}}
```

## 11. 前端狀態機建議

1. 未登入：只處理帳號類訊息。
2. 平台大廳：收到 `lobby_state` 顯示遊戲列表。
3. 遊戲大廳：收到 `game_lobby_state` 顯示場次列表。
4. 遊戲桌：收到 `table_joined` 或 `table_state` 顯示桌面。
5. 操作中：只在收到自己座位的 `action_request` 時開啟操作按鈕。
6. 結算中：收到 `award`、`hand_result`、`hand_end` 後顯示結果，再等待下一局狀態。
7. 錯誤：收到 `error` 時依 `data.code` 決定是否留在原畫面、提示、重登或重新同步。

## 12. 最小串接流程

### 12.1 會員進德州撲克

1. 送 `login`。
2. 收 `login_ok`，保存 `token`。
3. 送 `enter_game`，`game_id=texas_holdem`。
4. 收 `game_lobby_state`，選擇 `stakes[].id`。
5. 送 `join_stakes`。
6. 收 `table_joined`，切到桌面。
7. 收 `action_request` 時送 `player_action`。

### 12.2 訪客進大老二

1. 送 `guest_login`。
2. 收 `login_ok`，保存 `token`。
3. 送 `enter_game`，`game_id=big_two`。
4. 收 `game_lobby_state`，選擇 `stakes[].id`。
5. 送 `join_stakes`。
6. 收 `table_joined`，切到桌面。
7. 收 `hole_cards` 顯示自己的手牌。
8. 收 `action_request` 時送 `player_action`。

## 13. Client -> Server 成功/失敗範例索引

| 訊息 | 請求範例 | 成功回應 | 失敗回應 |
|---|---|---|---|
| `login` | `{"type":"login","data":{"username":"user@example.com","password":"password123"}}` | `login_ok` | `LOGIN_FAILED` |
| `guest_login` | `{"type":"guest_login","data":{}}` | `login_ok` | `GUEST_BACKEND_ERROR` |
| `auth_token` | `{"type":"auth_token","data":{"token":"token-value"}}` | `auth_ok` | `AUTH_TOKEN_INVALID` |
| `register_verification_request` | `{"type":"register_verification_request","data":{"username":"0912345678"}}` | `register_verification_code_sent` | `REGISTER_VERIFICATION_INVALID_DATA` |
| `register` | `{"type":"register","data":{"username":"0912345678","password":"password123","code":"168888"}}` | `login_ok` | `REGISTER_VERIFICATION_CODE_INVALID` |
| `forgot_password_request` | `{"type":"forgot_password_request","data":{"account":"user@example.com"}}` | `forgot_password_code_sent` | `PASSWORD_RESET_ACCOUNT_MISSING` |
| `forgot_password_reset` | `{"type":"forgot_password_reset","data":{"account":"user@example.com","code":"168888","password":"newpass123","confirm_password":"newpass123"}}` | `forgot_password_reset_ok` | `PASSWORD_RESET_CODE_INVALID` |
| `update_profile` | `{"type":"update_profile","data":{"username":"新暱稱"}}` | `update_profile_ok` | `PROFILE_UPDATE_FAILED` |
| `logout` | `{"type":"logout","data":{}}` | `logout_ok` | `LOGOUT_FAILED` |
| `ping` | `{"type":"ping","data":{}}` | `pong` | `INVALID_MESSAGE` |
| `enter_lobby` | `{"type":"enter_lobby","data":{}}` | `lobby_state` | `NOT_AUTHENTICATED` |
| `enter_game` | `{"type":"enter_game","data":{"game_id":"big_two"}}` | `game_lobby_state` | `ENTER_GAME_MISSING_ID` |
| `join_stakes` | `{"type":"join_stakes","data":{"game_id":"big_two","stakes_id":"b10","buyin":1000}}` | `table_joined` | `BUYIN_TOO_LOW` |
| `leave_room` | `{"type":"leave_room","data":{}}` | `game_lobby_state` | `LEAVE_ROOM_FAILED` |
| `switch_room` | `{"type":"switch_room","data":{"buyin":1000}}` | `table_joined` | `SWITCH_ROOM_TABLE_FULL` |
| `get_table_state` | `{"type":"get_table_state","data":{}}` | `table_state` | `NOT_IN_TABLE` |
| `player_action` | `{"type":"player_action","data":{"action":"pass"}}` | `player_action` | `ACTION_REJECTED` |
| `rebuy_decision` | `{"type":"rebuy_decision","data":{"accepted":true,"amount":1000}}` | `rebuy_ack` | `REBUY_NOT_PENDING` |
| `hand_replay` | `{"type":"hand_replay","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10}}` | `hand_replay_ok` | `HAND_REPLAY_FORBIDDEN` |
| `hand_reports` | `{"type":"hand_reports","data":{"game_id":"big_two","report_date":"2026-05-20"}}` | `hand_reports_ok` | `HAND_REPORTS_INVALID_DATA` |
| `daily_settlement_14d` | `{"type":"daily_settlement_14d","data":{"game_id":"big_two"}}` | `daily_settlement_14d_ok` | `DAILY_SETTLEMENT_FAILED` |

## 14. Server -> Client 逐項事件範例索引

| 訊息 | 事件範例 |
|---|---|
| `login_ok` | `{"type":"login_ok","data":{"token":"token-value","wallet_balance":10000}}` |
| `auth_ok` | `{"type":"auth_ok","data":{"token":"token-value","wallet_balance":10000}}` |
| `register_verification_code_sent` | `{"type":"register_verification_code_sent","data":{"accepted":true,"mock":true}}` |
| `forgot_password_code_sent` | `{"type":"forgot_password_code_sent","data":{"accepted":true,"mock":true}}` |
| `forgot_password_reset_ok` | `{"type":"forgot_password_reset_ok","data":{"success":true}}` |
| `logout_ok` | `{"type":"logout_ok","data":{"message":"已登出"}}` |
| `update_profile_ok` | `{"type":"update_profile_ok","data":{"user_id":362,"username":"新暱稱"}}` |
| `forced_logout` | `{"type":"forced_logout","data":{"code":"DUPLICATE_LOGIN","message":"帳號已在其他地方登入"}}` |
| `pong` | `{"type":"pong","data":{"server_ts":1770000000100}}` |
| `lobby_state` | `{"type":"lobby_state","data":{"games":[]}}` |
| `game_lobby_state` | `{"type":"game_lobby_state","data":{"game_id":"big_two","stakes":[]}}` |
| `wallet_state` | `{"type":"wallet_state","data":{"wallet_balance":10000,"table_chips":1000}}` |
| `table_joined` | `{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"table":{}}}` |
| `table_player_joined` | `{"type":"table_player_joined","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","player":{}}}` |
| `table_countdown` | `{"type":"table_countdown","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","seconds":3}}` |
| `hand_start` | `{"type":"hand_start","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"table":{}}}` |
| `table_state` | `{"type":"table_state","data":{"game_id":"big_two","hero_seat":0,"table":{}}}` |
| `rebuy_offer` | `{"type":"rebuy_offer","data":{"game_id":"texas_holdem","amount":1000}}` |
| `rebuy_ack` | `{"type":"rebuy_ack","data":{"accepted":true}}` |
| `rebuy_result` | `{"type":"rebuy_result","data":{"success":true,"table_chips":1000}}` |
| `action_request` | `{"type":"action_request","data":{"game_id":"big_two","seat":0,"allowed":["pass"],"timeout":10}}` |
| `deal_card` | `{"type":"deal_card","data":{"game_id":"big_two","seat":0,"card_index":0}}` |
| `deal_private` | `{"type":"deal_private","data":{"game_id":"big_two","seat":0,"card_index":0,"card":"3d"}}` |
| `hole_cards` | `{"type":"hole_cards","data":{"game_id":"big_two","seat":0,"cards":["3d"]}}` |
| `turn` | `{"type":"turn","data":{"game_id":"big_two","seat":0,"timeout":10}}` |
| `player_action` | `{"type":"player_action","data":{"game_id":"big_two","seat":0,"action":"pass"}}` |
| `award` | `{"type":"award","data":{"game_id":"texas_holdem","awards":[]}}` |
| `hand_end` | `{"type":"hand_end","data":{"game_id":"big_two","hand_id":3,"player_results":[]}}` |
| `hand_replay_ok` | `{"type":"hand_replay_ok","data":{"hero_seat":0,"hero_hole_cards":[],"replay":{}}}` |
| `hand_reports_ok` | `{"type":"hand_reports_ok","data":{"user_id":362,"items":[]}}` |
| `daily_settlement_14d_ok` | `{"type":"daily_settlement_14d_ok","data":{"user_id":362,"items":[]}}` |
| `post_blinds` | `{"type":"post_blinds","data":{"game_id":"texas_holdem","sb_amount":25,"bb_amount":50}}` |
| `betting_start` | `{"type":"betting_start","data":{"game_id":"texas_holdem","round":"flop"}}` |
| `betting_complete` | `{"type":"betting_complete","data":{"game_id":"texas_holdem","pot":750}}` |
| `deal_community` | `{"type":"deal_community","data":{"game_id":"texas_holdem","cards":["As","4d","Kd"]}}` |
| `showdown` | `{"type":"showdown","data":{"game_id":"texas_holdem","reveals":{}}}` |
| `hand_result` | `{"type":"hand_result","data":{"game_id":"big_two","winner_seat":0,"results":[]}}` | 大老二單局結束時的結果與結算摘要。 |
| `error` | `{"type":"error","data":{"code":"ACTION_REJECTED","message":"動作不合法"}}` |
