# FRONTEND_MULTI_GAME_WS_SPEC_zh-TW

版本：v2026-05-20 07:48
用途：玩家前端 WebSocket 串接規格，涵蓋平台大廳、帳號、錢包、報表、德州撲克、大老二。

## 0. 文件維護固定流程

這一章是維護文件的人要遵守的流程，不是前端串接流程。

1. 本文件與所有 `.md` 規格文件一律使用 UTF-8 編碼；每次更新本文件前後都要執行 `python tools\ws_spec_audit.py`。
2. 第 3 章必須完整對齊玩家前端會使用的 Client -> Server `type`；合作商 `partner_*` 與管理端 `admin_*` 訊息不列在本文件。
3. 第 4 章必須完整對齊玩家前端會收到的 Server -> Client `type`；合作商 `partner_*_ok` 與管理端 `admin_*_ok` 訊息不列在本文件。
4. 合作商 WebSocket 規格固定維護在 `docs/PARTNER_WS_SPEC_zh-TW.md`。
5. 管理端 WebSocket 規格固定維護在 `docs/ADMIN_WS_SPEC_zh-TW.md`。
6. 每個訊息細項標題必須使用「英文 type + 中文名稱」，例如 `### 5.1 login 會員登入`、`### 5.2 guest_login 訪客登入`。
7. 每個 `type` 都必須有獨立訊息細項；不得把多個 Client -> Server 或 Server -> Client type 合併成同一小節說明。
8. 訊息細項源檔固定維護在 `docs/frontend_ws_messages/client/` 與 `docs/frontend_ws_messages/server/`；例如 `guest_login` 固定寫在 `docs/frontend_ws_messages/client/guest_login.md`。
9. 修改任一訊息細項時，先改該訊息自己的 `.md` 源檔，再執行 `python tools\merge_frontend_ws_spec.py` 合併回本文件；不要直接手改本文件中已合併出的細項內容。
10. 每個訊息細項固定包含：用途、方向、`data` 欄位、成功回應、失敗回應、前端處理、請求範例、成功範例、失敗範例。
11. 範例必須以實測封包或程式碼實際 payload 為依據；可替換 token、table_id、hand_id、username、金額、牌面等動態值，但不得編造不存在的欄位、事件或資料結構。
12. 通用訊息的範例必須同時提供德州撲克與大老二，不可只放其中一個遊戲讓前端猜另一個 payload。
13. 錯誤統一收到 `error`，前端請使用 `data.code` 分流，不要用 `message` 判斷流程。
14. 文件若新增遊戲或訊息，需同步維持「總表、正文細項、範例索引」三處排序一致。

維護檢查指令：

```powershell
python tools\merge_frontend_ws_spec.py
python tools\ws_spec_audit.py
```

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

## 1.2 麻將牌碼

麻將使用 tile code，不使用撲克牌 card code：

```text
m1-m9: 萬子
p1-p9: 筒子
s1-s9: 條子
z1-z4: 東、南、西、北
z5-z7: 中、發、白
```

目前 `mahjong` 規則為 `tw_16_no_flowers`：台灣 16 張、四人、無花牌。

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
| `mahjong` | 台灣十六張麻將 | 是 | 規則為 `tw_16_no_flowers`，使用 `m10`、`m100`、`m1000`、`m10000` 場次與第 1.2 節麻將牌碼。 |

## 3. Client -> Server 訊息總表

| type | 分類 | 說明 |
|---|---|---|
| `login` | 帳號 | 會員登入。 |
| `google_login` | 帳號 | 使用 Google ID token 或 authorization code 登入。 |
| `line_login` | 帳號 | 使用 LINE ID token 或 authorization code 登入。 |
| `facebook_login` | 帳號 | 使用 Facebook authorization code 登入。 |
| `instagram_login` | 帳號 | 使用 Instagram authorization code 登入。 |
| `threads_login` | 帳號 | 使用 Threads authorization code 登入。 |
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
| `take_seat` | 通用 | 觀戰者在目前桌選擇座位坐下。 |
| `stand_up` | 通用 | 玩家退座並留在原桌觀戰。 |
| `leave_room` | 通用 | 離開目前遊戲桌。 |
| `switch_room` | 通用 | 同場次換桌。 |
| `get_table_state` | 通用 | 要求伺服器回傳目前遊戲桌狀態。 |
| `player_action` | 通用 | 送出目前遊戲桌的回合操作。 |
| `rebuy_decision` | 通用 | 送出目前遊戲桌的補籌回覆。 |
| `hand_ready` | 通用 | 玩家確認準備進入下一手。 |
| `ready_for_next_hand` | 通用 | `hand_ready` 的別名，效果相同。 |
| `hand_replay` | 報表 | 查詢自己參與過的牌局回放。 |
| `hand_reports` | 報表 | 查詢自己的手牌報表。 |
| `daily_settlement_14d` | 報表 | 查詢自己的近 14 天每日結算。 |
| `get_my_progress` | 玩家進度 | 查詢自己的等級、戰績與成就。 |

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
| `seat_taken` | 通用 | 觀戰者選座成功。 |
| `spectator_mode` | 通用 | 玩家已切換為觀戰模式。 |
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
| `level_up` | 玩家進度 | 玩家升級或解鎖成就。 |
| `hand_ready_ack` | 通用 | 玩家準備下一手的確認結果。 |
| `hand_replay_ok` | 報表 | 手牌回放查詢成功。 |
| `hand_reports_ok` | 報表 | 手牌報表查詢成功。 |
| `daily_settlement_14d_ok` | 報表 | 近 14 天每日結算查詢成功。 |
| `my_progress_ok` | 玩家進度 | 玩家進度查詢成功。 |
| `error` | 錯誤 | 請求失敗或狀態不允許。 |
| `post_blinds` | 德州撲克 | 德州撲克盲注已支付。 |
| `betting_start` | 德州撲克 | 德州撲克下注輪開始。 |
| `betting_complete` | 德州撲克 | 德州撲克下注輪結束。 |
| `deal_community` | 德州撲克 | 德州撲克公共牌發牌。 |
| `showdown` | 德州撲克 | 德州撲克攤牌資訊。 |
| `hand_result` | 通用 | 單局結束時的結果與結算摘要。 |

## 5. 帳號與登入

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

### 5.2 google_login Google 登入

用途：使用 Google 帳號登入。支援 Google Identity Services 的 ID token flow，也支援自製按鈕搭配 OAuth authorization code popup flow。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `credential` | string | 條件 | 非空字串 | Google 官方 Sign in / One Tap callback 回傳的 ID token。`id_token`、`token` 為相容別名。 |
| `code` | string | 條件 | 非空字串 | 自製 Google 按鈕使用 `google.accounts.oauth2.initCodeClient()` popup flow 回傳的 authorization code。未傳 `credential` 時必填。 |
| `redirect_uri` | string | code flow 建議必填 | URL origin 或已授權 redirect URI | code flow 換 token 時使用。popup flow 請傳呼叫頁面的 `window.location.origin`，或由後端 `GOOGLE_OAUTH_REDIRECT_URI` 統一設定。 |
| `origin` | string | 否 | URL origin | `redirect_uri` 的相容別名。 |
| `client_id` | string | 否 | 必須在後端允許清單內 | 多 Google client id 時指定本次前端使用的 client id；未填使用後端預設第一組。 |

成功回應：`login_ok`。

失敗回應：`error`，常見 `GOOGLE_LOGIN_INVALID_DATA`、`GOOGLE_LOGIN_TOKEN_MISSING`、`GOOGLE_LOGIN_TIMEOUT`、`GOOGLE_LOGIN_BACKEND_ERROR`、`GOOGLE_LOGIN_FAILED`。

前端處理：自製按鈕不要把 Google `access_token` 當登入憑證送後端。請用 authorization code flow，scope 至少包含 `openid email profile`，Google callback 收到 `response.code` 後送本訊息。登入成功後保存 `token`，後續重連送 `auth_token`。

請求範例：

ID token flow：

```json
{"type":"google_login","data":{"credential":"google-id-token"}}
```

自製按鈕 code flow：

```json
{"type":"google_login","data":{"code":"google-authorization-code","redirect_uri":"https://game.example.com","client_id":"710155903331-63qeqmh24lnkrl0950r658mte2gmk5jm.apps.googleusercontent.com"}}
```

成功範例：

```json
{"type":"login_ok","data":{"member_no":"M202605200003","username":"Google 玩家","avatar":"/api/member-avatars/12/abc.png","is_guest":false,"is_companion":false,"token":"token-value","wallet_balance":10000,"progress_summary":{"level":1,"xp_total":0,"xp_to_next_level":100,"hands_played":0,"wins":0,"win_rate":0.0,"title_code":"rookie","title_label":"新手","badge_code":"starter","badge_label":"起步"}}}
```

失敗範例：

```json
{"type":"error","data":{"code":"GOOGLE_LOGIN_TOKEN_MISSING","message":"缺少 Google ID token 或授權碼"}}
```

### 5.3 line_login LINE 登入

用途：使用 LINE 帳號登入。支援 LINE ID token，也支援 authorization code flow。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `id_token` | string | 條件 | 非空字串 | LINE Login 回傳的 ID token。`credential`、`token` 為相容別名。 |
| `code` | string | 條件 | 非空字串 | LINE authorization code。未傳 `id_token` 時必填。 |
| `redirect_uri` | string | code flow 必填 | 必須與 LINE Login 設定一致 | 後端用 authorization code 換 ID token 時使用。 |
| `nonce` | string | 否 | 字串 | 若前端登入請求有帶 nonce，後端驗證 ID token 時會一併驗證。 |

成功回應：`login_ok`。

失敗回應：`error`，常見 `LINE_LOGIN_INVALID_DATA`、`LINE_LOGIN_TOKEN_MISSING`、`LINE_LOGIN_REDIRECT_URI_MISSING`、`LINE_LOGIN_TIMEOUT`、`LINE_LOGIN_BACKEND_ERROR`、`LINE_LOGIN_FAILED`。

前端處理：登入成功後保存 `token`，後續重連送 `auth_token`。使用 code flow 時必須傳 `redirect_uri`，且需與 LINE Developer Console 設定一致。

請求範例：

ID token flow：

```json
{"type":"line_login","data":{"id_token":"line-id-token","nonce":"nonce-value"}}
```

authorization code flow：

```json
{"type":"line_login","data":{"code":"line-authorization-code","redirect_uri":"https://game.example.com/line/callback"}}
```

成功範例：

```json
{"type":"login_ok","data":{"member_no":"M202605200004","username":"LINE 玩家","avatar":"avatar_001","is_guest":false,"is_companion":false,"token":"token-value","wallet_balance":10000,"progress_summary":{"level":1,"xp_total":0,"xp_to_next_level":100,"hands_played":0,"wins":0,"win_rate":0.0,"title_code":"rookie","title_label":"新手","badge_code":"starter","badge_label":"起步"}}}
```

失敗範例：

```json
{"type":"error","data":{"code":"LINE_LOGIN_REDIRECT_URI_MISSING","message":"缺少 LINE redirect_uri"}}
```

### 5.4 facebook_login Facebook 登入

Client 先完成 Facebook OAuth authorization code flow，拿到 `code` 後送到 WebSocket。
Server 會用後端設定的 Facebook App Secret 換取 access token，再讀取 Facebook profile，最後沿用平台第三方登入流程建立或登入會員。

Client -> Server:

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `code` | string | 是 | Facebook OAuth authorization code。 |
| `redirect_uri` | string | 建議 | 必須與前端啟動 OAuth 時使用的 redirect URI 完全一致；若省略則使用後端 `FACEBOOK_OAUTH_REDIRECT_URI`。 |
| `origin` | string | 否 | `redirect_uri` 的相容 fallback。 |

成功回應：`login_ok`

錯誤回應：`error`

常見錯誤碼：`FACEBOOK_LOGIN_INVALID_DATA`、`FACEBOOK_LOGIN_CODE_MISSING`、`FACEBOOK_LOGIN_TIMEOUT`、`FACEBOOK_LOGIN_BACKEND_ERROR`、`FACEBOOK_LOGIN_FAILED`

範例：

```json
{"type":"facebook_login","data":{"code":"facebook-authorization-code","redirect_uri":"https://game.example.com/auth/facebook/callback"}}
```

### 5.5 instagram_login Instagram 登入

Client 先完成 Instagram OAuth authorization code flow，拿到 `code` 後送到 WebSocket。
Server 會用後端設定的 Instagram App Secret 換取 access token，再讀取 Instagram profile，最後沿用平台第三方登入流程建立或登入會員。

Client -> Server:

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `code` | string | 是 | Instagram OAuth authorization code。 |
| `redirect_uri` | string | 建議 | 必須與前端啟動 OAuth 時使用的 redirect URI 完全一致；若省略則使用後端 `INSTAGRAM_OAUTH_REDIRECT_URI`。 |
| `origin` | string | 否 | `redirect_uri` 的相容 fallback。 |

成功回應：`login_ok`

錯誤回應：`error`

常見錯誤碼：`INSTAGRAM_LOGIN_INVALID_DATA`、`INSTAGRAM_LOGIN_CODE_MISSING`、`INSTAGRAM_LOGIN_TIMEOUT`、`INSTAGRAM_LOGIN_BACKEND_ERROR`、`INSTAGRAM_LOGIN_FAILED`

範例：

```json
{"type":"instagram_login","data":{"code":"instagram-authorization-code","redirect_uri":"https://game.example.com/auth/instagram/callback"}}
```

### 5.6 threads_login Threads 登入

Client 先完成 Threads OAuth authorization code flow，拿到 `code` 後送到 WebSocket。
Server 會用後端設定的 Threads App Secret 換取 access token，再讀取 Threads profile，最後沿用平台第三方登入流程建立或登入會員。

Client -> Server:

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `code` | string | 是 | Threads OAuth authorization code。 |
| `redirect_uri` | string | 建議 | 必須與前端啟動 OAuth 時使用的 redirect URI 完全一致；若省略則使用後端 `THREADS_OAUTH_REDIRECT_URI`。 |
| `origin` | string | 否 | `redirect_uri` 的相容 fallback。 |

成功回應：`login_ok`

錯誤回應：`error`

常見錯誤碼：`THREADS_LOGIN_INVALID_DATA`、`THREADS_LOGIN_CODE_MISSING`、`THREADS_LOGIN_TIMEOUT`、`THREADS_LOGIN_BACKEND_ERROR`、`THREADS_LOGIN_FAILED`

範例：

```json
{"type":"threads_login","data":{"code":"threads-authorization-code","redirect_uri":"https://game.example.com/auth/threads/callback"}}
```

### 5.7 guest_login 訪客登入

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

### 5.8 auth_token token 驗證與重連

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

### 5.9 register_verification_request 註冊驗證碼

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

### 5.10 register 註冊會員

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

### 5.11 forgot_password_request 忘記密碼驗證碼

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

### 5.12 forgot_password_reset 重設密碼

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

### 5.13 update_profile 更新個人資料

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

### 5.14 logout 登出

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

## 6. Client -> Server 遊戲操作

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

麻將範例:

```json
{"type":"enter_game","data":{"game_id":"mahjong"}}
```

成功範例：

大老二範例:

```json
{"type":"game_lobby_state","data":{"game_id":"big_two","game_name":"big_two","stakes":[{"id":"b10","base_score":10,"min_buyin":1000,"max_buyin":20000,"display":"底分 10"}],"total_table_count":1,"total_player_count":2}}
```

麻將範例:

```json
{"type":"game_lobby_state","data":{"game_id":"mahjong","game_name":"台灣十六張麻將","stakes":[{"id":"m10","ruleset":"tw_16_no_flowers","base_score":10,"small_blind":0,"big_blind":10,"min_buyin":1000,"max_buyin":20000,"display":"Taiwan 16 Mahjong 10 - buyin 1000 ~ 20000"}],"total_table_count":1,"total_player_count":4}}
```

失敗範例：

```json
{"type":"error","data":{"code":"ENTER_GAME_MISSING_ID","message":"缺少遊戲 id"}}
```

### 6.4 join_stakes 加入盲注場

Client -> Server

用來加入指定遊戲與盲注場。一般模式會坐進桌上成為玩家；觀戰模式會進入指定桌觀戰，但不會佔座位。

`data` 欄位：

| 欄位 | 型別 | 必填 | 範例 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 是 | `texas_holdem`、`big_two`、`mahjong` | 要加入的遊戲 ID。 |
| `stakes_id` | string | 是 | `t25_50`、`b10`、`m10` | 要加入的盲注/場次 ID，來源為 `game_lobby_state.stakes[].id`。 |
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

麻將一般入座範例：

```json
{"type":"join_stakes","data":{"game_id":"mahjong","stakes_id":"m10","buyin":1000}}
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

麻將成功範例：

```json
{"type":"table_joined","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","stakes_id":"m10","seat":0,"hero_seat":0,"is_spectator":false,"buyin":1000,"table_chips":1000,"wallet_balance":9000,"table":{"table_id":"mahjong_m10_xxxx","game_id":"mahjong","ruleset":"tw_16_no_flowers","stakes_id":"m10","base_score":10,"max_players":4,"available_seats":[1,2,3],"status":"waiting","players":[{"user_id":362,"username":"玩家","seat":0,"chips":1000,"hand_count":0,"melds":[],"discards":[]}],"mahjong_state":null}}}
```

錯誤範例：

```json
{"type":"error","data":{"code":"BUYIN_TOO_LOW","message":"帶入金額低於下限"}}
```

### 6.5 take_seat 選擇目前觀戰桌的座位

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

德州範例：

```json
{"type":"seat_taken","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hero_seat":2,"is_spectator":false,"can_act":false,"table_chips":1000,"waiting_this_hand":true,"table":{}}}
```

大老二範例：

```json
{"type":"seat_taken","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","hero_seat":2,"is_spectator":false,"can_act":false,"table_chips":1000,"waiting_this_hand":true,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[{"user_id":362,"username":"玩家","seat":2,"chips":1000}],"play_state":{"current_seat":0,"last_play":null,"passed_seats":[],"finished_seats":[]},"current_turn_seat":0,"current_turn_timeout":10,"current_turn_started_at":1780387590974,"current_turn_deadline_at":1780387600974}}}
```

麻將範例：

```json
{"type":"seat_taken","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","stakes_id":"m10","seat":2,"hero_seat":2,"is_spectator":false,"buyin":1000,"table_chips":1000,"table":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","ruleset":"tw_16_no_flowers","stakes_id":"m10","players":[{"user_id":362,"username":"玩家","seat":2,"chips":1000,"hand_count":0,"melds":[],"discards":[]}],"mahjong_state":null}}}
```

常見錯誤：

```json
{"type":"error","data":{"code":"TAKE_SEAT_CHIPS_TOO_LOW","message":"table chips must be >= 1000","table_chips":0,"min_buyin":1000}}
```

### 6.6 stand_up 退座並留在原桌觀戰

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

德州範例：

```json
{"type":"spectator_mode","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","previous_seat":2,"hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1500,"table":{}}}
```

大老二範例：

```json
{"type":"spectator_mode","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","previous_seat":2,"hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1500,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[],"last_hand_result":null}}}
```

麻將範例：

```json
{"type":"spectator_mode","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","previous_seat":2,"hero_seat":null,"is_spectator":true,"table":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","ruleset":"tw_16_no_flowers","stakes_id":"m10","players":[],"mahjong_state":null}}}
```

錯誤範例：

```json
{"type":"error","data":{"code":"STAND_UP_NOT_ALLOWED","message":"stand up is only allowed between hands"}}
```

注意事項：

- `stand_up` 不會把 game wallet / table chips 轉回主錢包。
- 玩家會留在目前桌上，並持續收到公開桌況事件。
- 玩家之後可以再送 `take_seat` 坐回座位；`take_seat` 會檢查目前 table chips 是否達到該桌最低帶入。
- 大老二只允許在真正手局間空檔退座；牌局進行中、半局加入等待中或不能安全變更座位時會回 `STAND_UP_NOT_ALLOWED`。

### 6.7 leave_room 離開目前遊戲桌

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

麻將範例:

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

麻將範例:

```json
{"type":"game_lobby_state","data":{"game_id":"mahjong","stakes":[{"id":"m10","ruleset":"tw_16_no_flowers","base_score":10,"min_buyin":1000,"max_buyin":20000}]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"LEAVE_ROOM_FAILED","message":"離開桌子失敗"}}
```

### 6.8 switch_room 換桌

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

### 6.9 get_table_state 同步目前遊戲桌狀態

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

麻將範例：

```json
{"type":"table_state","data":{"game_id":"mahjong","hero_seat":0,"table":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","ruleset":"tw_16_no_flowers","stakes_id":"m10","players":[],"mahjong_state":null}}}
```

失敗範例：

```json
{"type":"error","data":{"code":"NOT_IN_TABLE","message":"目前不在遊戲桌內"}}
```

### 6.10 player_action 送出回合操作

用途：送出目前遊戲桌的回合操作。德州、大老二與麻將共用同一個 Client -> Server type。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `action` | string | 是 | 依遊戲與 `action_request.allowed` / `action_request.allowed_actions` | 德州可為 `fold`、`call`、`check`、`bet`、`raise`、`allin`；大老二可為 `play_cards`、`pass`，後端也接受舊值 `play`；麻將可為 `discard`、`chi`、`pong`、`kong`、`hu`、`pass`。 |
| `raise_to` | integer | 條件 | 德州加注時需要 | 目標總下注額。 |
| `cards` | string[] | 條件 | 大老二出牌時需要 | 要出的牌。 |
| `tile` | string | 條件 | 麻將打牌、暗槓、加槓時常用 | 麻將牌碼，格式見第 1.2 節。 |
| `tiles` | string[] | 條件 | 麻將吃牌時需要 | 吃牌時使用的兩張手牌；必須符合 `action_request.allowed_actions[].combos`。 |
| `kind` | string | 條件 | 麻將槓牌時可能需要 | `exposed`、`concealed` 或 `added`。 |
| `action_seq` | integer | 條件 | 大老二 `action_request` 會提供 | 避免舊操作封包被重複接受。 |

成功回應：`player_action`，後續可能有 `turn`、`action_request`、`award`、`hand_end`。

失敗回應：`error`，常見 `ACTION_INVALID_DATA`、`ACTION_REJECTED`、`NOT_YOUR_TURN`。

前端處理：按鈕應依 `action_request.allowed` 或 `action_request.allowed_actions` 顯示。

請求範例：

德州範例：

```json
{"type":"player_action","data":{"action":"call"}}
```

大老二範例：

```json
{"type":"player_action","data":{"action":"play_cards","cards":["3d"],"action_seq":12}}
```

大老二備註：`play_cards` 與舊值 `play` 都會被後端視為出牌；目前廣播的 `player_action.data.action` 保持既有值 `"play"`，避免影響舊客戶端。

麻將打牌範例：

```json
{"type":"player_action","data":{"action":"discard","tile":"m1"}}
```

麻將吃碰槓胡範例：

```json
{"type":"player_action","data":{"action":"chi","tiles":["m1","m2"]}}
{"type":"player_action","data":{"action":"pong"}}
{"type":"player_action","data":{"action":"kong","kind":"concealed","tile":"z5"}}
{"type":"player_action","data":{"action":"hu"}}
{"type":"player_action","data":{"action":"pass"}}
```

成功範例：

德州範例：

```json
{"type":"player_action","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"action":"call","paid":50,"pot":500,"current_bet":50,"bets":{"5":50},"round_total_bet":500}}
```

大老二範例：

```json
{"type":"player_action","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"action":"play","cards":["3d"],"remaining_count":12}}
```

麻將範例：

```json
{"type":"player_action","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"action":"discard","tile":"m1","timeout":false}}
```

失敗範例：

```json
{"type":"error","data":{"code":"ACTION_REJECTED","message":"動作不合法"}}
```

### 6.11 rebuy_decision 補籌回覆

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

## 7. 報表與玩家進度

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

### 7.4 get_my_progress 查詢自己的玩家進度

用途：查詢目前登入玩家的等級、經驗值、總戰績、指定遊戲戰績與已解鎖成就。

方向：Client -> Server

`data` 欄位：

| 欄位 | 型別 | 必填 | 限制 | 說明 |
|---|---|---|---|---|
| `game_id` | string | 否 | 見第 2 章 game_id 表 | 不傳時伺服器會依目前所在遊戲推斷；仍無法推斷時使用預設遊戲。 |

成功回應：`my_progress_ok`。

失敗回應：`error`，常見 `MY_PROGRESS_INVALID_DATA`、`NOT_AUTHENTICATED`、`MY_PROGRESS_FAILED`。

前端處理：可在個人資訊面板、牌桌玩家資訊彈窗或結算後刷新進度。一般牌桌狀態只需要使用 `level`、`title`、`badge` 等輕量欄位；完整成就列表請用此訊息查詢，避免每次 `table_state` 都傳大量資料。

請求範例：

```json
{"type":"get_my_progress","data":{"game_id":"texas_holdem"}}
```

成功範例：

```json
{"type":"my_progress_ok","data":{"user_id":362,"game_id":"texas_holdem","progress_summary":{"level":12,"xp_total":13040,"xp_current_level":940,"xp_next_level":2500,"xp_to_next_level":1560,"hands_played":320,"wins":88,"losses":240,"pushes":12,"win_rate":0.275,"title_code":"sharp","title_label":"牌桌好手","badge_code":"winner","badge_label":"勝場"},"game_stats":{"level":12,"xp_total":13040,"hands_played":320,"wins":88,"win_rate":0.275},"achievements":[{"achievement_code":"first_win","display_name":"首勝","unlocked_at":"2026-06-04T12:00:00"}]}}
```

失敗範例：

```json
{"type":"error","data":{"code":"MY_PROGRESS_FAILED","message":"讀取玩家進度失敗"}}
```

## 8. Texas Hold'em 事件

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

## 9. 結果

### 9.1 hand_result 單局結束結果

用途：通知單局已結束，並回傳勝方、剩牌、分數變化與結算摘要。

方向：Server -> Client

事件範例：

大老二範例：

```json
{"type":"hand_result","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","hand_id":3,"winner_seat":0,"base_score":10,"finished_seats":[0,1],"pot":30,"results":[{"seat":0,"remaining_count":0,"score_delta":27,"is_winner":true},{"seat":1,"remaining_count":3,"score_delta":-30,"is_winner":false}]}}
```

大老二 `results[]` 欄位：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `seat` | integer | 座位號。 |
| `score_delta` | integer | 本局結算後的籌碼變化；等同結算明細中的 `net_amount`。 |
| `remaining_count` | integer | 結算時手上剩餘張數，贏家為 0。 |
| `is_winner` | boolean | 是否為本局贏家。 |

大老二 `finished_seats` 為官方結算排名順序，第一個座位等同 `winner_seat`。

麻將範例：

```json
{"type":"hand_result","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"winner_seats":[0],"win_tile":"m5","discarder_seat":null,"self_draw":true,"robbed_kong":false,"after_kong":false,"scores":{"0":{"winning":true,"total_tai":4,"patterns":[{"name":"dealer","tai":1},{"name":"men_qing","tai":1},{"name":"self_draw","tai":1},{"name":"men_qing_self_draw_bonus","tai":1}],"pair":["m5","m5"],"melds":[]}},"rake":{"pot_total":120,"base_score":10,"rake_percent":0,"rake_cap_amount":0,"rake_amount":0,"payout_total":120,"payment_details":[{"from_seat":1,"to_seat":0,"tai":4,"amount":40},{"from_seat":2,"to_seat":0,"tai":4,"amount":40},{"from_seat":3,"to_seat":0,"tai":4,"amount":40}]},"player_results":[{"seat":0,"user_id":362,"username":"玩家","hand_rank":"tai_4","final_hand":["m1","m2","m3","p1","p2","p3","s1","s2","s3","z1","z1","z1","m5","m5","z5","z5","z5"],"melds":[],"tai":4,"patterns":[{"name":"dealer","tai":1},{"name":"men_qing","tai":1},{"name":"self_draw","tai":1},{"name":"men_qing_self_draw_bonus","tai":1}],"contrib_amount":0,"win_amount":120,"net_amount":120,"is_winner":true,"result_type":"WIN"},{"seat":1,"user_id":363,"username":"對家","hand_rank":"not_winner","final_hand":[],"melds":[],"tai":0,"patterns":[],"contrib_amount":40,"win_amount":0,"net_amount":-40,"is_winner":false,"result_type":"LOSS"}]}}
```

## 10. Server -> Client 訊息

### 10.1 login_ok 會員登入成功

用途：通知登入成功並回傳 token 與帳號資料。

方向：Server -> Client

`data` 欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `member_no` | string/null | 會員編號。 |
| `username` | string | 顯示名稱。 |
| `avatar` | string | 頭像代碼或頭像 URL；Google 匯入後通常為 `/api/member-avatars/...`。 |
| `is_guest` | boolean | 是否為訪客帳號。 |
| `is_companion` | boolean | 是否為陪玩帳號。 |
| `token` | string | 後續 `auth_token` 使用的登入 token。 |
| `wallet_balance` | integer | 主錢包餘額。 |
| `progress_summary` | object | 玩家等級、經驗值、勝率、稱號與徽章摘要。 |

事件範例：

```json
{"type":"login_ok","data":{"member_no":"M202605200001","username":"玩家","avatar":"/api/member-avatars/12/abc.png","is_guest":false,"is_companion":false,"token":"token-value","wallet_balance":10000,"progress_summary":{"level":12,"xp_total":13040,"xp_to_next_level":1560,"hands_played":320,"wins":88,"win_rate":0.275,"title_code":"sharp","title_label":"牌桌好手","badge_code":"winner","badge_label":"勝場"}}}
```

### 10.2 auth_ok token 驗證成功

用途：通知 token 驗證成功。

方向：Server -> Client

`data` 欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `token` | string | 驗證成功的 token；若使用外部登入連結交換，可能是新產生的 token。 |
| `member_no` | string/null | 會員編號。 |
| `username` | string | 顯示名稱。 |
| `avatar` | string | 頭像代碼或頭像 URL。 |
| `is_guest` | boolean | 是否為訪客帳號。 |
| `is_companion` | boolean | 是否為陪玩帳號。 |
| `wallet_balance` | integer | 主錢包餘額。 |
| `progress_summary` | object | 玩家等級、經驗值、勝率、稱號與徽章摘要。 |

事件範例：

```json
{"type":"auth_ok","data":{"token":"token-value","member_no":"M202605200001","username":"玩家","avatar":"/api/member-avatars/12/abc.png","is_guest":false,"is_companion":false,"wallet_balance":10000,"progress_summary":{"level":12,"xp_total":13040,"xp_to_next_level":1560,"hands_played":320,"wins":88,"win_rate":0.275,"title_code":"sharp","title_label":"牌桌好手","badge_code":"winner","badge_label":"勝場"}}}
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
{"type":"lobby_state","data":{"games":[{"game_id":"texas_holdem","game_name":"德州撲克","is_active":true},{"game_id":"big_two","game_name":"大老二","is_active":true},{"game_id":"mahjong","game_name":"台灣十六張麻將","is_active":true}]}}
```

### 10.11 game_lobby_state 遊戲大廳狀態

用途：回傳指定遊戲的場次資訊。

方向：Server -> Client

事件範例：

大老二範例：

```json
{"type":"game_lobby_state","data":{"game_id":"big_two","stakes":[]}}
```

麻將範例：

```json
{"type":"game_lobby_state","data":{"game_id":"mahjong","game_name":"台灣十六張麻將","stakes":[{"id":"m10","ruleset":"tw_16_no_flowers","base_score":10,"small_blind":0,"big_blind":10,"min_buyin":1000,"max_buyin":20000,"display":"Taiwan 16 Mahjong 10 - buyin 1000 ~ 20000"},{"id":"m100","ruleset":"tw_16_no_flowers","base_score":100,"small_blind":0,"big_blind":100,"min_buyin":10000,"max_buyin":200000,"display":"Taiwan 16 Mahjong 100 - buyin 10000 ~ 200000"}],"total_table_count":1,"total_player_count":4}}
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

說明：`data.table.players[]` 與 `table_state` 相同，會帶 `level`、`title`、`title_label`、`badge`、`badge_label` 作為牌桌顯示用玩家進度摘要。

事件範例：

德州範例：

```json
{"type":"table_joined","data":{"game_id":"texas_holdem","hero_seat":5,"waiting_this_hand":true,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":5,"chips":1000}]}}}
```

大老二範例：

```json
{"type":"table_joined","data":{"game_id":"big_two","hero_seat":0,"waiting_this_hand":false,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":0,"chips":1000}]}}}
```

麻將範例：

```json
{"type":"table_joined","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","stakes_id":"m10","seat":0,"hero_seat":0,"is_spectator":false,"buyin":1000,"table_chips":1000,"wallet_balance":9000,"table":{"table_id":"mahjong_m10_xxxx","game_id":"mahjong","ruleset":"tw_16_no_flowers","stakes_id":"m10","base_score":10,"max_players":4,"available_seats":[1,2,3],"status":"waiting","hand_id":0,"dealer_seat":null,"dealer_streak":0,"players":[{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":0,"chips":1000,"hand_count":0,"melds":[],"discards":[]}],"mahjong_state":null}}}
```

### 10.14 seat_taken 選座成功

方向：Server -> Client

`take_seat` 成功後送給該玩家。

說明：`data.table.players[]` 與 `table_state` 相同，會帶 `level`、`title`、`title_label`、`badge`、`badge_label`。前端應以 `table` 更新整桌狀態，並以 `hero_seat` 設定自己的座位。

範例：

德州範例：

```json
{"type":"seat_taken","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","hero_seat":2,"is_spectator":false,"can_act":false,"table_chips":1000,"waiting_this_hand":true,"table":{"players":[{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":2,"chips":1000}]}}}
```

麻將範例：

```json
{"type":"seat_taken","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","stakes_id":"m10","seat":2,"hero_seat":2,"is_spectator":false,"buyin":1000,"table_chips":1000,"wallet_balance":9000,"table":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","ruleset":"tw_16_no_flowers","stakes_id":"m10","players":[{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":2,"chips":1000,"hand_count":0,"melds":[],"discards":[]}],"mahjong_state":null}}}
```

### 10.15 spectator_mode 已切換為觀戰模式

Server -> Client

`stand_up` 成功後送給該玩家；如果玩家本來就已經在觀戰，重複送 `stand_up` 時也可能收到這個回應。

範例：

德州範例：

```json
{"type":"spectator_mode","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","previous_seat":2,"hero_seat":null,"is_spectator":true,"can_act":false,"table_chips":1500,"table":{}}}
```

麻將範例：

```json
{"type":"spectator_mode","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","previous_seat":2,"hero_seat":null,"is_spectator":true,"table":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","ruleset":"tw_16_no_flowers","stakes_id":"m10","players":[],"mahjong_state":null}}}
```

### 10.16 table_player_joined 玩家加入桌子

用途：通知有玩家加入目前桌。

方向：Server -> Client

`player` 進度欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `level` | integer | 玩家等級。 |
| `title` / `title_label` | string | 稱號代碼與顯示文字。 |
| `badge` / `badge_label` | string | 徽章代碼與顯示文字。 |

事件範例：

德州範例：

```json
{"type":"table_player_joined","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","player":{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":5,"chips":1000,"in_hand":false}}}
```

大老二範例：

```json
{"type":"table_player_joined","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","player":{"user_id":362,"username":"玩家","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":0,"chips":1000,"in_hand":true}}}
```

### 10.17 table_countdown 開局倒數

用途：通知遊戲桌開局倒數。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_countdown","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","seconds":3}}
```

大老二範例：

```json
{"type":"table_countdown","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","seconds":3,"next_deal_at":1780387603974}}
```

大老二同時會在 `table_state.table.next_deal_at` 與 `table_state.table.start_countdown_seconds` 提供可重建的倒數狀態，供倒數開始後才入桌、重連或換桌的玩家使用。

麻將範例：

```json
{"type":"table_countdown","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","countdown":2}}
```

### 10.18 hand_start 牌局開始

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

麻將範例：

```json
{"type":"hand_start","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"dealer_seat":0,"dealer_streak":0,"ruleset":"tw_16_no_flowers"}}
```

### 10.19 table_state 遊戲桌狀態

用途：同步目前遊戲桌完整狀態。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"table_state","data":{"game_id":"texas_holdem","hero_seat":5,"table":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","stakes_id":"t25_50","players":[{"user_id":362,"username":"玩家","avatar":"/api/member-avatars/12/abc.png","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":5,"chips":1000}],"current_turn_seat":5,"current_turn_timeout":10,"current_turn_started_at":1780387590974,"current_turn_deadline_at":1780387600974}}}
```

`table.players[]` 玩家進度欄位：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `level` | integer | 玩家等級，最低為 1。 |
| `title` | string | 稱號代碼，例如 `rookie`、`sharp`、`veteran`。 |
| `title_label` | string | 稱號顯示文字。 |
| `badge` | string | 徽章代碼，例如 `starter`、`winner`、`big_win`。 |
| `badge_label` | string | 徽章顯示文字。 |

這些欄位是牌桌顯示用的輕量摘要；完整經驗值、勝率與成就列表請用 `get_my_progress` 查詢。

目前行動欄位（德州、大老二與麻將）：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `current_turn_seat` | integer/null | 目前可操作座位；沒有玩家可操作時為 `null`。 |
| `current_turn_timeout` | number | 前端可見倒數秒數。 |
| `current_turn_started_at` | integer/null | 後端開始此玩家行動的 Unix epoch milliseconds。 |
| `current_turn_deadline_at` | integer/null | 後端可見倒數截止時間，Unix epoch milliseconds。 |

前端處理（德州、大老二與麻將）：

- `table_state` 是權威狀態；如果前端用 `table_state.table` 覆蓋桌面資料，必須同步保存 `current_turn_*`。
- 操作按鈕只在 `current_turn_seat` 等於自己的座位，且 `Date.now() < current_turn_deadline_at` 時開啟。
- 若 `current_turn_deadline_at` 已過或為 `null`，應停用操作按鈕。
- 麻將 `phase:"claim"` 時，可能有多位玩家同時收到 `action_request`；前端應以自己實際收到的 `action_request.allowed_actions` 開啟吃、碰、槓、胡、過水按鈕。

開局等待欄位（目前大老二會在倒數中提供）：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `next_deal_at` | integer/null | 下一局預計發牌時間，Unix epoch milliseconds；沒有開局倒數時為 `null`。 |
| `start_countdown_seconds` | integer | 由後端快照推算的剩餘開局倒數秒數；沒有開局倒數時為 0。 |

大老二結算快照：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `last_hand_result` | object/null | 最近一局官方 `hand_result` payload；新一局開始時清為 `null`。晚進桌或換桌觀戰者可用它重建結算彈窗。 |

大老二範例：

```json
{"type":"table_state","data":{"game_id":"big_two","hero_seat":0,"table":{"game_id":"big_two","table_id":"big_two_b10_xxxx","stakes_id":"b10","players":[{"user_id":362,"username":"玩家","avatar":"/api/member-avatars/12/abc.png","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":0,"chips":1000}],"play_state":{"current_seat":0,"last_play":null,"passed_seats":[],"finished_seats":[]},"current_turn_seat":0,"current_turn_timeout":10,"current_turn_started_at":1780387590974,"current_turn_deadline_at":1780387600974,"next_deal_at":null,"start_countdown_seconds":0,"last_hand_result":null}}}
```

麻將範例：

```json
{"type":"table_state","data":{"game_id":"mahjong","hero_seat":0,"table":{"table_id":"mahjong_m10_xxxx","game_id":"mahjong","ruleset":"tw_16_no_flowers","stakes_id":"m10","base_score":10,"max_players":4,"available_seats":[],"status":"playing","hand_id":1,"dealer_seat":0,"dealer_streak":0,"players":[{"user_id":362,"username":"玩家","avatar":"/api/member-avatars/12/abc.png","level":12,"title":"sharp","title_label":"牌桌好手","badge":"winner","badge_label":"勝場","seat":0,"chips":1000,"hand_count":17,"melds":[],"discards":[]}],"mahjong_state":{"phase":"discard","current_seat":0,"dealer_seat":0,"dealer_streak":0,"prevailing_wind":"z1","seat_winds":{"0":"z1","1":"z2","2":"z3","3":"z4"},"wall_remaining":83,"last_discard":{},"pending_claim":null},"current_turn_seat":0,"current_turn_timeout":12,"current_turn_started_at":1780387590974,"current_turn_deadline_at":1780387602974}}}
```

### 10.20 rebuy_offer 補籌提示

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

### 10.21 rebuy_ack 補籌回覆已收到

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

### 10.22 rebuy_result 補籌結果

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

### 10.23 action_request 請求操作

用途：通知目前玩家可以做哪些操作。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"action_request","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"to_call":50,"current_bet":100,"my_bet":50,"min_raise_to":150,"big_blind":50,"pot":500,"round_total_bet":500,"allowed":["fold","call","raise","allin"],"timeout":10,"started_at_ms":1780387590974,"deadline_at_ms":1780387600974}}
```

前端處理：

- 德州與大老二的 `started_at_ms` / `deadline_at_ms` 為後端時間的 Unix epoch milliseconds。
- 倒數請以 `deadline_at_ms - Date.now()` 計算，不要只用收到封包當下加 `timeout`。
- 當目前時間大於等於 `deadline_at_ms` 時，應立即停用操作按鈕，不再送 `player_action`。
- 後端仍有內部收單寬限秒數處理網路抖動；此寬限不顯示給玩家，也不應延長前端可操作時間。
- 麻將目前使用 `timeout_sec` 與 `allowed_actions`；倒數也可由最近一次 `table_state.table.current_turn_deadline_at` 顯示。

大老二範例：

```json
{"type":"action_request","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"allowed":["play","pass"],"timeout":10,"started_at_ms":1780387590974,"deadline_at_ms":1780387600974,"action_seq":12}}
```

大老二備註：`allowed` 目前沿用舊值 `play`；前端送 `player_action` 時可使用 `play_cards` 或 `play`，兩者都代表出牌。

麻將打牌範例：

```json
{"type":"action_request","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"request_kind":"discard","action_no":21,"timeout_sec":12,"allowed_actions":[{"action":"discard","tiles":["m1","m2","m3"]},{"action":"hu","win_type":"self_draw"},{"action":"kong","kind":"concealed","tile":"z5"}],"actions":[{"action":"discard","tiles":["m1","m2","m3"]},{"action":"hu","win_type":"self_draw"},{"action":"kong","kind":"concealed","tile":"z5"}],"current_tile":"m5","wall_remaining":83}}
```

麻將吃碰槓胡範例：

```json
{"type":"action_request","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":1,"request_kind":"claim","action_no":22,"timeout_sec":5,"allowed_actions":[{"action":"hu","tile":"m3","priority":3,"win_type":"discard"},{"action":"pong","tile":"m3","priority":2},{"action":"chi","tile":"m3","combos":[["m1","m2"],["m2","m4"]],"priority":1},{"action":"pass","priority":0}],"actions":[{"action":"hu","tile":"m3","priority":3,"win_type":"discard"},{"action":"pong","tile":"m3","priority":2},{"action":"chi","tile":"m3","combos":[["m1","m2"],["m2","m4"]],"priority":1},{"action":"pass","priority":0}],"claim_tile":"m3","discarder_seat":0,"robbed_kong":false}}
```

### 10.24 deal_card 公開派牌動畫

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

麻將範例：

```json
{"type":"deal_card","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"count":1,"wall_remaining":82,"supplement":false}}
```

### 10.25 deal_private 自己的私牌

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

麻將範例：

```json
{"type":"deal_private","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"tile":"m5","card":"m5","supplement":false}}
```

### 10.26 hole_cards 同步自己的手牌

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

麻將範例：

```json
{"type":"hole_cards","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"cards":["m1","m2","m3","s7","s8","s9","z1","z1","z1","z5","z5","z5","m5","m5"],"melds":[{"type":"pong","tiles":["p1","p1","p1"],"claimed_tile":"p1","from_seat":3,"concealed":false}]}}
```

### 10.27 turn 輪到座位

用途：通知目前輪到哪個座位。

方向：Server -> Client

事件範例：

德州範例：

```json
{"type":"turn","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10,"seat":5,"timeout":10,"round":"preflop","started_at_ms":1780387590974,"deadline_at_ms":1780387600974}}
```

前端處理（德州、大老二與麻將）：

- `turn` 是全桌廣播，用來顯示目前輪到哪個座位。
- 倒數顯示請以 `deadline_at_ms` 為準；若 `table_state.table.current_turn_deadline_at` 同步出現，兩者應為同一個後端截止時間。
- `deadline_at_ms` 到期後應立即清掉可操作狀態或停用按鈕。

大老二範例：

```json
{"type":"turn","data":{"game_id":"big_two","table_id":"big_two_b10_xxxx","hand_id":3,"seat":0,"timeout":10,"started_at_ms":1780387590974,"deadline_at_ms":1780387600974,"action_seq":12}}
```

麻將範例：

```json
{"type":"turn","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"action_no":21,"request_kind":"discard","timeout_sec":12}}
```

### 10.28 player_action 玩家操作結果

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

麻將打牌範例：

```json
{"type":"player_action","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":0,"action":"discard","tile":"m1","timeout":false}}
```

麻將吃碰槓範例：

```json
{"type":"player_action","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":1,"action":"chi","tile":"m3","from_seat":0,"tiles":["m1","m2"]}}
{"type":"player_action","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"seat":2,"action":"kong","kind":"concealed","tile":"z5"}}
```

### 10.29 award 派彩結果

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

麻將範例：

```json
{"type":"award","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"winner_seats":[0],"win_tile":"m5","discarder_seat":null,"self_draw":true,"scores":{"0":{"winning":true,"total_tai":4,"patterns":[{"name":"dealer","tai":1},{"name":"men_qing","tai":1},{"name":"self_draw","tai":1},{"name":"men_qing_self_draw_bonus","tai":1}]}},"rake":{"pot_total":120,"base_score":10,"rake_percent":0,"rake_cap_amount":0,"rake_amount":0,"payout_total":120,"payment_details":[{"from_seat":1,"to_seat":0,"tai":4,"amount":40},{"from_seat":2,"to_seat":0,"tai":4,"amount":40},{"from_seat":3,"to_seat":0,"tai":4,"amount":40}]},"awards":[{"seat":0,"username":"玩家","amount":120,"hand_rank":"tai_4"}],"player_results":[{"seat":0,"username":"玩家","hand_rank":"tai_4","tai":4,"win_amount":120,"net_amount":120,"is_winner":true,"result_type":"WIN"},{"seat":1,"username":"對家","hand_rank":"not_winner","tai":0,"contrib_amount":40,"net_amount":-40,"is_winner":false,"result_type":"LOSS"}]}}
```

### 10.30 hand_end 牌局結束

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

麻將範例：

```json
{"type":"hand_end","data":{"game_id":"mahjong","table_id":"mahjong_m10_xxxx","hand_id":1,"winner_seats":[0],"win_tile":"m5","discarder_seat":null,"self_draw":true,"robbed_kong":false,"after_kong":false,"scores":{"0":{"winning":true,"total_tai":4,"patterns":[{"name":"dealer","tai":1},{"name":"men_qing","tai":1},{"name":"self_draw","tai":1},{"name":"men_qing_self_draw_bonus","tai":1}]}},"awards":[{"seat":0,"username":"玩家","amount":120,"hand_rank":"tai_4"}],"reveals":{"winner_seats":[0],"hands":{"0":["m1","m2","m3","p1","p2","p3","s1","s2","s3","z1","z1","z1","m5","m5","z5","z5","z5"],"1":[],"2":[],"3":[]},"melds":{"0":[],"1":[],"2":[],"3":[]},"scores":{"0":{"winning":true,"total_tai":4,"patterns":[{"name":"dealer","tai":1},{"name":"men_qing","tai":1},{"name":"self_draw","tai":1},{"name":"men_qing_self_draw_bonus","tai":1}]}}},"player_results":[{"seat":0,"username":"玩家","hand_rank":"tai_4","tai":4,"win_amount":120,"net_amount":120,"is_winner":true,"result_type":"WIN"},{"seat":1,"username":"對家","hand_rank":"not_winner","tai":0,"contrib_amount":40,"net_amount":-40,"is_winner":false,"result_type":"LOSS"}]}}
```

### 10.31 level_up 玩家升級或解鎖成就

用途：牌局結算後通知桌上玩家，有玩家等級提升或解鎖成就。

方向：Server -> Client

`data` 欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `user_id` | integer | 發生進度變化的玩家 ID。 |
| `game_id` | string | 遊戲代碼。 |
| `table_id` | string | 桌號 ID。 |
| `hand_id` | integer | 觸發進度變化的手牌 ID。 |
| `previous_level` | integer | 變化前等級。 |
| `level` | integer | 變化後等級。 |
| `xp_awarded` | integer | 本手獲得經驗值。 |
| `progress_summary` | object | 變化後的玩家全域進度摘要。 |
| `unlocked_achievements` | array | 本手新解鎖成就；只升級未解鎖成就時為空陣列。 |

事件範例：

```json
{"type":"level_up","data":{"user_id":362,"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":88,"previous_level":11,"level":12,"xp_awarded":42,"progress_summary":{"level":12,"xp_total":13040,"xp_to_next_level":1560,"title_code":"sharp","title_label":"牌桌好手","badge_code":"winner","badge_label":"勝場"},"unlocked_achievements":[{"achievement_code":"wins_10","display_name":"十勝玩家","progress_value":10}]}}
```

前端處理：若 `level > previous_level`，可播放升級提示並更新本地玩家資料；若 `unlocked_achievements` 非空，可顯示成就提示。收到後也應更新 `table_state.table.players[*]` 中同 `user_id` 的 `level`、`title`、`badge` 顯示。此事件可能廣播給整桌，因此前端要用 `user_id` 判斷是否為自己。

### 10.32 hand_replay_ok 手牌回放查詢成功

用途：回傳手牌回放資料。

方向：Server -> Client

事件範例：

```json
{"type":"hand_replay_ok","data":{"hero_seat":0,"hero_hole_cards":[],"replay":{}}}
```

### 10.33 hand_reports_ok 手牌報表查詢成功

用途：回傳手牌報表列表。

方向：Server -> Client

事件範例：

```json
{"type":"hand_reports_ok","data":{"user_id":362,"items":[]}}
```

### 10.34 daily_settlement_14d_ok 14 天結算查詢成功

用途：回傳近 14 天每日結算。

方向：Server -> Client

事件範例：

```json
{"type":"daily_settlement_14d_ok","data":{"user_id":362,"items":[]}}
```

### 10.35 my_progress_ok 玩家進度查詢成功

用途：回傳 `get_my_progress` 的查詢結果，包含玩家總進度、指定遊戲進度與成就列表。

方向：Server -> Client

`data` 欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `user_id` | integer | 目前登入玩家 ID。 |
| `game_id` | string/null | 查詢的遊戲代碼。 |
| `progress_summary` | object | 玩家全域進度摘要。 |
| `game_stats` | object/null | 指定 `game_id` 的分遊戲進度；未指定時可為 `null`。 |
| `achievements` | array | 已解鎖成就，依解鎖時間由新到舊排序。 |

`progress_summary` / `game_stats` 常用欄位：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `level` | integer | 等級，最低為 1。 |
| `xp_total` | integer | 累積經驗值。 |
| `xp_current_level` | integer | 目前等級內已累積經驗。 |
| `xp_next_level` | integer | 從目前等級升到下一級所需總經驗。 |
| `xp_to_next_level` | integer | 距離下一級還需要的經驗。 |
| `hands_played` | integer | 累積遊玩手數。 |
| `wins` / `losses` / `pushes` | integer | 勝、敗、平手或只退回手數。 |
| `win_rate` | number | 勝率，0 到 1。 |
| `current_win_streak` | integer | 目前連勝。 |
| `best_win_streak` | integer | 最佳連勝。 |
| `biggest_win_amount` | number | 單手最大淨贏。 |
| `biggest_loss_amount` | number | 單手最大淨輸絕對值。 |
| `title_code` / `title_label` | string | 稱號代碼與顯示文字。 |
| `badge_code` / `badge_label` | string | 徽章代碼與顯示文字。 |

事件範例：

```json
{"type":"my_progress_ok","data":{"user_id":362,"game_id":"texas_holdem","progress_summary":{"level":12,"xp_total":13040,"xp_current_level":940,"xp_next_level":2500,"xp_to_next_level":1560,"hands_played":320,"wins":88,"losses":240,"pushes":12,"win_rate":0.275,"title_code":"sharp","title_label":"牌桌好手","badge_code":"winner","badge_label":"勝場"},"game_stats":{"level":12,"xp_total":13040,"hands_played":320,"wins":88,"win_rate":0.275},"achievements":[{"achievement_code":"first_win","category":"progress","display_name":"首勝","description":"贏得第一手遊戲。","progress_value":1,"unlocked_at":"2026-06-04T12:00:00"}]}}
```

前端處理：玩家資訊面板可直接以 `progress_summary` 顯示全域等級與稱號；遊戲內統計頁可優先使用 `game_stats`。若只需要牌桌座位上方顯示，使用 `table_state.table.players[*]` 的輕量欄位即可。

### 10.36 error 錯誤訊息

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

### 12.3 會員進台灣十六張麻將

1. 送 `login`。
2. 收 `login_ok`，保存 `token`。
3. 送 `enter_game`，`game_id=mahjong`。
4. 收 `game_lobby_state`，選擇 `m10`、`m100`、`m1000` 或 `m10000`。
5. 送 `join_stakes`。
6. 收 `table_joined`，切到桌面並等待四人開局。
7. 收 `hole_cards` 顯示自己的 16/17 張手牌與 `melds`。
8. 收 `action_request` 時依 `allowed_actions` 送 `discard`、`chi`、`pong`、`kong`、`hu` 或 `pass`。

## 13. Client -> Server 成功/失敗範例索引

| 訊息 | 請求範例 | 成功回應 | 失敗回應 |
|---|---|---|---|
| `login` | `{"type":"login","data":{"username":"user@example.com","password":"password123"}}` | `login_ok` | `LOGIN_FAILED` |
| `google_login` | `{"type":"google_login","data":{"code":"google-authorization-code","redirect_uri":"https://game.example.com"}}` | `login_ok` | `GOOGLE_LOGIN_TOKEN_MISSING` |
| `line_login` | `{"type":"line_login","data":{"code":"line-authorization-code","redirect_uri":"https://game.example.com/line/callback"}}` | `login_ok` | `LINE_LOGIN_REDIRECT_URI_MISSING` |
| `facebook_login` | `{"type":"facebook_login","data":{"code":"facebook-authorization-code","redirect_uri":"https://game.example.com/auth/facebook/callback"}}` | `login_ok` | `FACEBOOK_LOGIN_FAILED` |
| `instagram_login` | `{"type":"instagram_login","data":{"code":"instagram-authorization-code","redirect_uri":"https://game.example.com/auth/instagram/callback"}}` | `login_ok` | `INSTAGRAM_LOGIN_FAILED` |
| `threads_login` | `{"type":"threads_login","data":{"code":"threads-authorization-code","redirect_uri":"https://game.example.com/auth/threads/callback"}}` | `login_ok` | `THREADS_LOGIN_FAILED` |
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
| `enter_game` | `{"type":"enter_game","data":{"game_id":"mahjong"}}` | `game_lobby_state` | `ENTER_GAME_MISSING_ID` |
| `join_stakes` | `{"type":"join_stakes","data":{"game_id":"mahjong","stakes_id":"m10","buyin":1000}}` | `table_joined` | `BUYIN_TOO_LOW` |
| `take_seat` | `{"type":"take_seat","data":{"seat":2}}` | `seat_taken` | `TAKE_SEAT_CHIPS_TOO_LOW` |
| `stand_up` | `{"type":"stand_up","data":{}}` | `spectator_mode` | `STAND_UP_NOT_ALLOWED` |
| `leave_room` | `{"type":"leave_room","data":{}}` | `game_lobby_state` | `LEAVE_ROOM_FAILED` |
| `switch_room` | `{"type":"switch_room","data":{"buyin":1000}}` | `table_joined` | `SWITCH_ROOM_TABLE_FULL` |
| `get_table_state` | `{"type":"get_table_state","data":{}}` | `table_state` | `NOT_IN_TABLE` |
| `player_action` | `{"type":"player_action","data":{"action":"discard","tile":"m1"}}` | `player_action` | `ACTION_REJECTED` |
| `rebuy_decision` | `{"type":"rebuy_decision","data":{"accepted":true,"amount":1000}}` | `rebuy_ack` | `REBUY_NOT_PENDING` |
| `hand_replay` | `{"type":"hand_replay","data":{"game_id":"texas_holdem","table_id":"texas_holdem_t25_50_xxxx","hand_id":10}}` | `hand_replay_ok` | `HAND_REPLAY_FORBIDDEN` |
| `hand_reports` | `{"type":"hand_reports","data":{"game_id":"big_two","report_date":"2026-05-20"}}` | `hand_reports_ok` | `HAND_REPORTS_INVALID_DATA` |
| `daily_settlement_14d` | `{"type":"daily_settlement_14d","data":{"game_id":"big_two"}}` | `daily_settlement_14d_ok` | `DAILY_SETTLEMENT_FAILED` |
| `get_my_progress` | `{"type":"get_my_progress","data":{"game_id":"texas_holdem"}}` | `my_progress_ok` | `MY_PROGRESS_FAILED` |

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
| `level_up` | `{"type":"level_up","data":{"user_id":362,"previous_level":11,"level":12,"xp_awarded":42}}` |
| `hand_replay_ok` | `{"type":"hand_replay_ok","data":{"hero_seat":0,"hero_hole_cards":[],"replay":{}}}` |
| `hand_reports_ok` | `{"type":"hand_reports_ok","data":{"user_id":362,"items":[]}}` |
| `daily_settlement_14d_ok` | `{"type":"daily_settlement_14d_ok","data":{"user_id":362,"items":[]}}` |
| `my_progress_ok` | `{"type":"my_progress_ok","data":{"user_id":362,"progress_summary":{"level":12},"achievements":[]}}` |
| `post_blinds` | `{"type":"post_blinds","data":{"game_id":"texas_holdem","sb_amount":25,"bb_amount":50}}` |
| `betting_start` | `{"type":"betting_start","data":{"game_id":"texas_holdem","round":"flop"}}` |
| `betting_complete` | `{"type":"betting_complete","data":{"game_id":"texas_holdem","pot":750}}` |
| `deal_community` | `{"type":"deal_community","data":{"game_id":"texas_holdem","cards":["As","4d","Kd"]}}` |
| `showdown` | `{"type":"showdown","data":{"game_id":"texas_holdem","reveals":{}}}` |
| `hand_result` | `{"type":"hand_result","data":{"game_id":"mahjong","winner_seats":[0],"scores":{"0":{"total_tai":4,"patterns":[]}}}}` |
| `error` | `{"type":"error","data":{"code":"ACTION_REJECTED","message":"動作不合法"}}` |
