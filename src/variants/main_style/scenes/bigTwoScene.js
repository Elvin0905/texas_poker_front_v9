import {
	createGradientButton,
	drawEnhancedBorder,
	applyGoldTitleGradient,
	playWrongClick,
} from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const VIEW_W = 720;
const VIEW_H = 1440;
const CX = 360;
const CY = 720;

// 4 座位邏輯座標（view-index 0 = hero 永遠在底部）
const SEAT_POS = [
	{ x: CX, y: 950 }, // 0: hero bottom-center
	{ x: 625, y: 400 }, // 1: top-right（外移騰出中央寬度）
	{ x: 95, y: 230 }, // 2: top-center（左移）
	{ x: 95, y: 900 }, // 3: top-left（外移騰出中央寬度）
];

// 牌桌圖（與德州撲克相同）
const TABLE_FRAME_W = 743;
const TABLE_FRAME_H = 1139;
const TABLE_DISPLAY_W = Math.round(VIEW_W * 1.08);
const TABLE_DISPLAY_H = Math.round(
	(TABLE_DISPLAY_W * TABLE_FRAME_H) / TABLE_FRAME_W,
);
const TABLE_X_OFFSET = 10;
const TABLE_Y = 680;

// 頭像框（與德州撲克完全相同的常數）
const PROFILE_FRAME_SCALE = 1.72;
const PROFILE_AVATAR_INNER_RATIO = 0.75;
const PROFILE_BG_PADDING = 6;
const PROFILE_BG_COLORS = [
	0xffbd69, 0x79b8ff, 0xe599ff, 0x78ffbd, 0xff8da2, 0x8dff8d,
];
const AVATAR_Y_OFFSET = -32;
const WAIT_BADGE_W = 160; // 「等待中」徽章寬（game_table "waiting" frame 為 200x84）
const WAIT_BADGE_H = 67; // 維持 200:84 比例（160 * 84/200）

// 透視縮放（越上面越小，與德州撲克相同邏輯）
const BT_NORMAL_AVATAR_SCALE = 0.68;
const BT_HERO_AVATAR_SCALE = 0.88;
const BT_PERSPECTIVE_MIN = 0.65;
const BT_PERSPECTIVE_Y_TOP = 185; // 大老二最上座位的邏輯 Y
const BT_PERSPECTIVE_Y_BOT = 280; // 側邊座位的邏輯 Y

function btPerspectiveScale(logicalY) {
	const t = Math.max(
		0,
		Math.min(
			1,
			(logicalY - BT_PERSPECTIVE_Y_TOP) /
				(BT_PERSPECTIVE_Y_BOT - BT_PERSPECTIVE_Y_TOP),
		),
	);
	return BT_PERSPECTIVE_MIN + t * (BT_NORMAL_AVATAR_SCALE - BT_PERSPECTIVE_MIN);
}

// 名字牌（與德州撲克相同）
const NAMETAG_SCALE_NORMAL = 1.2;
const NAMETAG_SCALE_HERO = 1.46;
const CHIPS_Y_GAP_NORMAL = -10;
const CHIPS_Y_GAP_HERO = -14;

// 對手牌背（以側邊縱列／橫列呈現；舊的扇形樣式已移除）
const OPP_CARD_MAX = 13;
const OPP_CARDS_Y_OFFSET = 245; // 徽章初始 y 與發牌動畫落點參考
const BADGE_W = 50; // 張數徽章膠囊寬（容得下「13張」，與倒數圓形計時器區隔）
const BADGE_H = 30;
const BADGE_W_HERO = 56; // 底部中央家：較大膠囊，字較大、上下內距較多
const BADGE_H_HERO = 44;
const BADGE_BG_PAD_SCALE = 1.35; // 張數徽章底圖相對文字再放大的倍率，給文字與容器邊緣留內距（padding）
// 座上英雄（play mode）的張數徽章位置：相對頭像中心（SEAT_POS[0] + AVATAR_Y_OFFSET）的位移（設計座標）。
const HERO_BADGE_DX = -130; // 負＝頭像左側
const HERO_BADGE_DY = 40; // 正＝往下（名字牌方向）
// 過牌動作標籤（沿用德州撲克 game_table 圖集的 brand_check frame，不另存進 big_two_game_table）
const BT_ACTION_BADGE_DEPTH = 30; // 疊在頭像/張數徽章上方（短暫顯示）
const BT_ACTION_BADGE_SCALE = 0.48; // 與德州撲克相同
const BT_ACTION_BADGE_DY = -10; // 相對頭像中心的垂直位移（負為上移，可微調）

// 英雄手牌
const HERO_HAND_Y = 1351; // VIEW_H - HERO_CARD_H/2 - 24 (≈1.5rem bottom margin)
const HERO_HAND_X_OFFSET = 0;
const HERO_CARD_W = 84;
const HERO_CARD_H = 118;
const HERO_CARD_GAP = -34;
const HERO_CARD_LIFT = 28;
const HERO_HAND_WIDTH_RATIO = 0.99;
const HERO_HAND_CARD_SCALE = 1.08;
const HERO_HAND_MOBILE_BOTTOM_PADDING = 30;

// 英雄牌背橫排（avatar 右側）
const HERO_BACK_CARD_W = 54;
const HERO_BACK_CARD_H = 76;
const HERO_BACK_GAP = 30; // center-to-center
const HERO_BACK_X_OFFSET = 105; // first card center, right of seat x

// 側邊牌背縱排（SEAT_POS[1] 往下 / SEAT_POS[3] 往上）
const SIDE_BACK_CARD_W = 54;
const SIDE_BACK_CARD_H = 76;
const SIDE_BACK_GAP_Y = 30; // vertical center-to-center
const SIDE_COL_OUT_OFFSET = 28; // 對手牌背縱列相對頭像向外位移（左列左移、右列右移），騰出中央寬度
const SEAT0_ROW_Y_OFFSET = 210; // 觀戰時底部玩家水平牌背列位於頭像下方（籌碼數字之後）的距離（設計座標）
const SIDE_BACK_Y_OFFSET = 130; // first card distance from seat pos
const SEAT3_COL_UP_EXTRA = 45; // 左下牌列額外上移（該座位頭像較大），避免牌列底部貼到頭像

// 中央出牌區
const CENTER_CARD_W = 116; // 放大貼近撲克中央牌（縱列外移後，5 張上限 ~120；撲克為 124）
const CENTER_CARD_H = 173; // 維持撲克牌 282:420 比例（116 * 420/282）
const CENTER_CARD_GAP = -42; // 負值 → 中央出牌交疊（stack）；越負越窄／越交疊
const CENTER_PLAY_Y = 630;
// 現任中央牌共用柔和投影：單一輪廓避免每張牌各自投影造成重疊處出現粗黑縫。
const CENTER_CARD_SHADOW_OFFSET_X = 4;
const CENTER_CARD_SHADOW_OFFSET_Y = 7;
const CENTER_CARD_SHADOW_RADIUS = 9;
const CENTER_PREV_TINT = 0x6e6e6e; // 後方暗化牌的 tint（變暗、退到背景）
const CENTER_PREV_DEPTH = 8; // 後方暗化牌深度（低於現任牌的 10）
const PREV_MAX = 5; // 後方暗化扇形最多張數（滾動緩衝，超出由左側汰除）
const PREV_FAN_SPAN = 50; // 扇形總角度（度）
const PREV_FAN_RADIUS = 150; // 扇形半徑（設計座標；越大越平、重疊越少）
const PREV_FAN_PIVOT_DY = 110; // 扇形樞紐相對 CENTER_PLAY_Y 的下移量（樞紐在牌下方，牌向上展開）
const CENTER_LABEL_Y = 598;
const CENTER_BY_Y = 750;

// 操作按鈕（舊 gradient button 常數，保留供參考）
const ACTION_Y = 1400;
const PLAY_BTN_X = 510;
const PASS_BTN_X = 210;
const BTN_W = 210;
const BTN_H = 80;
const COMBO_INFO_Y = 1348;
// DEBUG：中央「請選牌出牌 / 牌型名稱」提示文字（comboInfoText）。正式遊玩關閉——此文字會蓋住手牌
// （見截圖），且牌型改由「牌型鈕」呈現。設為 true 可重新啟用除錯（不建立時，所有 ?. 呼叫自動略過）。
const SHOW_COMBO_INFO_TEXT = false;

// 操作按鈕（圖集版，同德州撲克 action button 模式）
const BT_ACTION_BUTTON_ORDER = ["pass", "play"]; // 選牌鈕退役，不納入橫向排列
const BT_ACTION_ATLAS = "big_two_game_table";
const BT_ACTION_ROW_Y = 1180; // 上移 30px（原 1210）：拉開操作按鈕下緣與「選中上抬」手牌的間距（約 4px→34px）。牌型面板 Y 由此推得，會一起上移。
// 過牌/出牌按鈕尺寸對齊德州撲克手機四鈕列的實際顯示尺寸（170×111），並加寬按鈕間距。
const BT_ACTION_BUTTON_WIDTH = 170;
const BT_ACTION_BUTTON_HEIGHT = 111;
const BT_ACTION_BUTTON_GAP = 24;
const BT_ACTION_BUTTON_DEPTH = 60;
const BT_ACTION_INACTIVE_TINT = 0x444444; // 停用態灰底（同德州 ACTION_BUTTON_INACTIVE_TINT）

// 牌型選擇 Modal（出現在操作按鈕正上方）
const BT_COMBO_LABELS = ["單", "一對", "順子", "葫蘆", "鐵支", "同花順"];
// Feature 1：不可出手牌的灰底外觀
const BT_CARD_GATED_TINT = 0x707070;
const BT_CARD_GATED_ALPHA = 0.5;
// _evaluateCombo category → 牌型鈕 index（單/一對/順子/葫蘆/鐵支/同花順）。三條(3)/同花(5) 無對應鈕 → 不列。
const BT_CAT_TO_COMBO_BTN = { 1: 0, 2: 1, 4: 2, 6: 3, 7: 4, 8: 5 };
// 大老二花色大小（點數相同時決勝）：♦ < ♥ < ♣ < ♠（依實機截圖：4♥壓4♦、2♣壓2♥、2♠最大）。後端順序不同改此表即可。
const SUIT_ORDER = { d: 0, h: 1, c: 2, s: 3 };
const BT_COMBO_BTN_H = 60;
const BT_COMBO_BTN_GAP = 10; // gap between buttons = side padding for equal spacing
const BT_COMBO_PANEL_PADDING = 10; // left/right padding inside panel (matches BTN_GAP)
const BT_COMBO_PANEL_H = 90;
const BT_COMBO_PANEL_CR = 14;
const BT_COMBO_PANEL_GAP_Y = 12; // gap between panel bottom and BT_ACTION_ROW_Y
const BT_COMBO_DEPTH = 65; // above BT_ACTION_BUTTON_DEPTH (60)

// 開局前提示（桌面中央）
const PRESTART_Y = 550;
const BIG_TWO_MIN_PLAYERS = 2;

// 頂部按鈕（與德州撲克相同位置）
const EXIT_X = 625;
const EXIT_Y = 62;
const CHANGE_TABLE_X = 625;
const CHANGE_TABLE_Y = 160;
// 離座按鈕：入座但本局尚未發牌（等待中）時顯示，送 stand_up 釋出席位、留桌轉觀戰（比照德州撲克）。
// 位置疊在離桌/換桌下方，介於換桌鈕(160)與右上座位頭像(座位1 y=400)之間，不重疊。
const STAND_UP_X = 625;
const STAND_UP_Y = 258;
const AUDIO_TOGGLE_X = 80;
const AUDIO_TOGGLE_Y = 72;

// 發牌動畫
const DEAL_CARD_FLY_DURATION = 260;
const DEAL_CARD_STAGGER_MS = 40;

// 轉到呼吸圈（與德州撲克完全相同）
const TURN_GLOW_COLOR = 0xfff1a8;
const TURN_GLOW_OUTER_RADIUS = 76;
const TURN_GLOW_FILL_ALPHA_OUTER = 0;
const TURN_GLOW_OUTER_ALPHA = 0.85;
const TURN_GLOW_STROKE_WIDTH_OUTER = 12;

// 倒數計時（與德州撲克相同）
const CD_BG_RADIUS = 18;
const CD_BG_COLOR = 0x080e18;
const CD_BG_ALPHA = 0.92;
const CD_RING_COLOR = 0xd4b97a;
const CD_RING_WARNING = 0xff5555;
const CD_RING_WIDTH = 2.5;
const CD_FONT_SIZE = "20px";
const CD_TEXT_COLOR = "#ffffff";
const CD_WARNING_COLOR = "#ff5555";
const CD_WARNING_SECONDS = 5;
const CD_CRITICAL_SECONDS = 3;
const CD_BLINK_MS = 180;
const CD_SFX_KEY = "countdown_timer";
const CD_SFX_VOLUME = 0.4;
const BT_PLAY_PROMPT_KEY = "bt_play_prompt"; // 「請選牌出牌」語音（play_bt.mp3，場景自行載入）
const BT_FIRST_PLAY_PROMPT_KEY = "bt_first_play_prompt"; // 領牌（手上有梅花3）時的首發語音（voice_first_play_bt.mp3）
const BT_NO_CARD_PASS_KEY = "bt_no_card_pass"; // 跟牌但無任何可壓中央牌堆的牌時的「只能過牌」語音（no_card_and_pass_bt.mp3）
const BT_CHECK_VOICE_KEY = "bt_check"; // 大老二專屬過牌語音（check_bt.mp3）；未載入時退回德州撲克 voice_check（check.mp3）
const BT_PLAYER_JOIN_KEY = "bt_player_join"; // 大老二專屬入座語音（player_join_bt.mp3）；英雄由觀戰入座時播一次
// 出牌落中央時的語音（任何玩家）：多張＝牌型語音（_evaluateCombo category → key）；單張走各張牌專屬語音（見 _playCardPlayVoice）。
// 三條(3)/同花(5) 目前無對應檔 → 不播。
const BT_COMBO_VOICE_KEY = { 2: "pair_bt", 4: "straight_bt", 6: "full_house_bt", 7: "quads_bt", 8: "straight_flush_bt" };

// ─── 局末翻牌（對手手牌 back→front）───────────────────────────────────────────
// 目標 UX：局末把對手的牌由牌背翻到正面（比照撲克攤牌）。動畫已就緒，但**需牌面資料**（見
// BIG_TWO_BACKEND_REQUESTS.md 需求 7）：伺服器目前不送對手牌面，故正式路徑在無 reveal 資料時為 no-op。
// BT_DEV_FLIP_PREVIEW=true 時，按「F」鍵可用假牌預覽/調整動畫；**正式版務必保持 false**。
const BT_DEV_FLIP_PREVIEW = true; // 開發預覽用（true 時局末以假牌自動演示攤牌翻牌）；正式版務必 false ← iOS 測試中暫開
const BT_FLIP_HALF_MS = 150; // 單張翻牌半程（背→側 / 側→正）時間
const BT_FLIP_STAGGER_MS = 55; // 每張之間錯開時間，形成波浪
const BT_REVEAL_HOLD_MS = 500; // 翻完後停留，讓玩家看清再彈結算 Modal
const BT_REVEAL_SIDE_GAP_Y = 30; // 局末翻牌左右直向列間距（設計座標）；與 play 時 SIDE_BACK_GAP_Y／橫列 HERO_BACK_GAP 一致，四邊間距統一、且不超出畫面（正確堆疊後 30 已可讀）

// ─── 局末贏家發光（比照德州撲克 _showWinLight：贏家頭像後方旋轉 light 圖）─────────────
// 只需 winner_seat（結算已帶），不需後端資料；與回合高亮 setSeatTurnEffect 為不同物件、互不影響。
const BT_AWARD_VOICE_KEY = "bt_award"; // 大老二專屬派彩語音（award_bt.mp3）；未載入時退回撲克 voice_award
const BT_WIN_ANIM_SFX_KEY = "win_animation"; // 贏家發光開始時的動畫音效（與撲克同一檔 win_animation.mp3；bootScene 已預載）
const BT_WIN_ANIM_SFX_VOLUME = 0.9; // 比照撲克 WIN_ANIMATION_SFX_VOLUME
const BT_WIN_GLOW_MS = 4500; // 贏家發光持續時間（比照撲克 WIN_LIGHT_DURATION_MS）
const BT_WIN_LIGHT_ROTATE_MS = 3200; // 旋轉一圈時間（比照撲克）
const BT_WIN_LIGHT_FADE_MS = 400; // 結束淡出時間（比照撲克）
const BT_WIN_LIGHT_DEPTH = 16; // 置於頭像底色圓（18）之下＝在頭像後方
const BT_WIN_LIGHT_SIZE_MULT = 1.6; // 相對頭像框寬的倍率（比照撲克 refWidth*1.6）
const BT_CONGRATS_VOICE_KEY = "bt_congrats_winner"; // 大老二專屬贏家語音（congrats_winner_bt.mp3）；未載入時退回撲克 voice_congrats_winner

// 結算 Modal
const MODAL_OVL_D = 200;
const MODAL_PNL_D = 201;
const MODAL_TXT_D = 202;
const MODAL_W = 580;
const MODAL_H = 540;
// 本局結果彈窗（仿撲克）：表頭（無底色）在上，每位玩家各自一列、各有底色面板。
// 注意：須在 CY / MODAL_W / MODAL_H 宣告之後（這些 const 有 TDZ，不能在宣告前引用）。
const RESULT_HDR_Y = CY - 150; // 表頭中心 y（設計座標）
const RESULT_ROW_Y0 = CY - 100; // 第一列中心 y
const RESULT_ROW_STEP = 64; // 列間距（含 gap）
const RESULT_ROW_W = MODAL_W - 56; // 列底板寬
const RESULT_ROW_H = 54; // 列底板高
const RESULT_COL_RANK_X = -250; // 欄位 x（相對彈窗中心 cx，與表頭一致）
const RESULT_COL_NAME_X = -120;
const RESULT_COL_SCORE_X = 95; // 得分（score_delta，右對齊）
const RESULT_COL_REM_X = 250;
const RESULT_ROW_BG_NORMAL = 0x3a1414; // 各列統一底色（暗紅，純撲克面板風格）
const RESULT_ROW_BORDER_NORMAL = 0x7a3030;
const RESULT_AUTO_CLOSE_SECONDS = 6; // 結算彈窗自動關閉秒數（比照撲克 HAND_RESULT_AUTO_CLOSE_SECONDS）
const MODAL_CR = 18;

// 手局結束「是否繼續遊戲」選單（比照德州撲克 buildHandEndModal：進入下局 / 離座 / 結束，三顆同排）。
// 深紅漸層面板 + 金框，與結算彈窗（金色）視覺區分；尺寸/座標沿用撲克（兩者皆 CX/CY=360/720 基準）。
const HE_OVL_D = 210; // 疊在結算彈窗（200~202）之上
const HE_PNL_D = 211;
const HE_TXT_D = 212;
const HE_W = 580;
const HE_H = 232;
const HE_CR = 16;
const HE_TITLE_Y = CY - HE_H / 2;
const HE_BODY_Y = CY - 15;
const HE_BTN_Y = CY + 55;
const HE_BTN_H = 64;
const HE_JOIN_W = 196; // 進入下局（含倒數）略寬
const HE_ACT_W = 128; // 離座 / 結束
const HE_JOIN_X = CX - 144;
const HE_STAND_X = CX + 34;
const HE_EXIT_X = CX + 178;
// （已移除）舊的 HE_MENU_WINDOW_SECONDS＝12 固定退路：原用於「結算彈窗關閉當下」讀不到 next_event_in 時。
// 實機伺服器確有送 hand_end.next_event_in（~8s，store.handEndNextEventIn），故改為比照德州撲克
// refreshHandEndMenu，於 _refreshHandEndMenu 以 handEndSeq 邊緣＋伺服器值起算，不再需要固定退路。
// 安全補送 hand_ready 的提前量：於 ready window（_handEndMenuEnd）到期「前」這麼多毫秒補送，
// 使其落在伺服器 ready window 之內、而非邊界（見 WS 規格 §6.12：window 為 hand_end 後至 table_countdown 前）。
const HE_READY_AUTOSEND_LEAD_MS = 1000;

// 局末結算：偵測到 round_end 快照後，先等官方 hand_result 事件（含每位玩家 score_delta 得分／reveals）到達
// 再開結算彈窗；逾時仍未到才退回快照重建（得分顯示「—」）。避免快照搶先開窗、把官方得分蓋掉。
// 實測伺服器有送 hand_result，但 round_end 狀態（table_state / hand_end）常與其前後數十毫秒交錯到達，
// 若不等待則常由快照先開窗。此值需略大於該時序抖動。
const BT_RESULT_REAL_WAIT_MS = 700;

// 下注面板（同德州撲克 raise panel，但獨立常數不互相影響）
const BET_PANEL_OVERLAY_DEPTH = 125;
const BET_PANEL_DEPTH = 126;
const BET_PANEL_TEXT_DEPTH = 127;
const BET_PANEL_WIDTH = 560;
const BET_PANEL_HEIGHT = 270;
const BET_PANEL_ANCHOR_Y = 1200;
const BET_PANEL_MARGIN_X = 16;
const BET_PANEL_TITLE_Y_OFFSET = -102;
const BET_PANEL_AMOUNT_Y_OFFSET = -58;
const BET_PANEL_RANGE_Y_OFFSET = -24;
const BET_PANEL_SLIDER_Y_OFFSET = 22;
const BET_PANEL_SLIDER_TRACK_W = 420;
const BET_PANEL_SLIDER_TRACK_H = 10;
const BET_PANEL_SLIDER_HIT_H = 54;
const BET_PANEL_SLIDER_KNOB_R = 17;
const BET_PANEL_QUICK_Y_OFFSET = 78;
const BET_PANEL_QUICK_GAP = 12;
const BET_PANEL_QUICK_W = 118;
const BET_PANEL_QUICK_H = 56;
const BET_PANEL_CONFIRM_W = 150;
const BET_PANEL_CONFIRM_H = 54;
const BET_PANEL_COVER_PADDING_X = 12;
const BET_PANEL_BORDER_COLOR = 0xb87830;
const BET_PANEL_CORNER_RADIUS = 14;
const BET_PANEL_DIVIDER_COLOR = 0x5c3218;
const BET_PANEL_DIVIDER_W = 460;
const BET_PANEL_AMOUNT_BOX_COLOR = 0x0e0804;
const BET_PANEL_AMOUNT_BOX_W = 230;
const BET_PANEL_AMOUNT_BOX_H = 52;
const BET_PANEL_AMOUNT_BOX_CR = 8;
const BET_PANEL_STEP_BTN_SIZE = 48;
const BET_PANEL_STEP_BTN_GAP = 10;
const BET_PANEL_SLIDER_TRACK_CLR = 0x4a2a10;
const BET_PANEL_SLIDER_FILL_CLR = 0xecd5b5;
const BET_PANEL_KNOB_CLR = 0xfff2dd;
const BET_PANEL_KNOB_STROKE_CLR = 0xe07820;
const BET_PANEL_TITLE_COLOR = "#f0d898";
const BET_PANEL_AMOUNT_COLOR = "#ffffff";
const BET_PANEL_HINT_COLOR = "#9a7040";
const BET_PANEL_TITLE_FONT_SIZE = "26px";
const BET_PANEL_AMOUNT_FONT_SIZE = "42px";
const BET_PANEL_HINT_FONT_SIZE = "20px";
const BET_PANEL_QUICK_STROKE_CLR = 0x7a4818;
const BET_PANEL_QUICK_CR = 10;
const BET_PANEL_CONFIRM_CR = 10;
const BET_PANEL_STEP = 100;
const BET_PANEL_QUICK_AMOUNTS = [100, 200, 300, 400];
const BET_UI_FONT = "sans-serif";
const BET_TEXT_OUTLINE = { stroke: "#000000", strokeThickness: 1 };

function normalizeCard(raw) {
	if (!raw) return null;
	const m = String(raw)
		.trim()
		.match(/^([2-9]|10|[tTjJqQkKaA])([cChHsSdD])$/);
	if (!m) return null;
	const r = m[1].toUpperCase() === "10" ? "T" : m[1].toUpperCase();
	return `${r}${m[2].toLowerCase()}`;
}

function fmt(val) {
	const n = Number(val);
	if (!Number.isFinite(n)) return "0";
	return n.toLocaleString("en-US");
}

function formatAmount(val) {
	const n = Number(val);
	if (!Number.isFinite(n)) return "0";
	return n.toLocaleString("en-US");
}

function avatarFrame(av) {
	const n = Number(String(av || "").replace(/[^0-9]/g, "")) || 1;
	return `avatar_${Math.max(1, Math.min(20, n))}`;
}

// 與德州撲克相同：兩色之間線性內插（給回合倒數圓環的漸層用）
function lerpColor(a, b, t) {
	const ar = (a >> 16) & 0xff,
		ag = (a >> 8) & 0xff,
		ab = a & 0xff;
	const br = (b >> 16) & 0xff,
		bg = (b >> 8) & 0xff,
		bb = b & 0xff;
	return (
		(Math.round(ar + (br - ar) * t) << 16) |
		(Math.round(ag + (bg - ag) * t) << 8) |
		Math.round(ab + (bb - ab) * t)
	);
}

export class BigTwoScene extends Phaser.Scene {
	constructor() {
		super("bigTwo");
		this.unsubscribe = null;
		this.state = null;
		this.seatViews = [];
		this.heroCardImages = [];
		this.selectedIndices = new Set();
		this._cardGateSet = null; // Feature 1：可用手牌 index 集合（null＝不套用閘門）
		this._cardGateActive = false;
		this.centerPlayImages = [];
		this.centerPrevImages = []; // 後方暗化扇形牌圖（由 _prevCardBuf 重建）
		this._curPlayCards = []; // 現任中央牌的卡面陣列（供 applyLayout 重排）
		this._prevCardBuf = []; // 後方暗化牌滾動緩衝（最近 ≤PREV_MAX 張，先進先出）
		this.isResultOpen = false;
		this._resultTableId = null; // 結算彈窗所屬桌號；換桌（含觀戰自動換桌）後偵測並關閉殘留彈窗
		this._resultHandId = null; // 結算彈窗所屬手號；觀戰時下一局開始（hand_id 變動）即關閉，避免蓋住下一局
		this._standUpBaseY = STAND_UP_Y; // 離座鈕目前所在格的基準 y（動態：單獨顯示時移到最上格 EXIT_Y）
		this.lastHandResultVer = 0;
		this._lastPassSoundAt = 0; // 已播過過牌音的最後 last_action_at（避免重播）
		this._passSoundTableId = null; // 換桌/初次只記錄不補播舊過牌
		this._prevHeroSeated = null; // 英雄上一次的入座狀態；null=尚未初始化（初次只記錄不補播入座音）
		this._btTurnPromptActive = false; // 目前是否正處於「英雄出牌回合」（用來只在回合開始播一次出牌語音）
		this._resultRowObjs = []; // 本局結果彈窗的動態列物件（表頭＋各列）
		this._lastResult = null; // 目前顯示中的結果資料（供 resize 重建）
		this.lastShownHandKey = null; // 已顯示過結算的 `${table_id}|${hand_id}`，real/synth 共用去重
		this.lastHeroCardsVer = 0;
		this.lastLastPlayVer = 0;
		this._comboArmed = false; // 出牌按鈕是否已由牌型鈕選到合法組合而啟用
		this._selectionArmed = false; // Feature 2：目前選取牌是否為可壓過牌堆的合法組合（出牌鈕啟用條件）
		this._comboLabelBtn = -1; // 目前顯示為「標籤」的牌型鈕 index（-1＝無），供置中/resize 使用
		this._handReadySent = false; // 本次等待下一局是否已送出 hand_ready（每局一次）
		this._resultTimer = null;
		this.countdownSfxSound = null;
		this.lastCountdownBeepSecond = null;
		this.bgm = null;
		this.soundSettingsPanel = null;
		this._dealAnimating = false;
		this._dealRunId = 0;
		this.nextHandCountdownEnd = 0;
		this._countdownArmedForSecs = 0; // 邊緣觸發：已據哪一次 table_countdown 秒數起算過（避免 store 值不歸零時無限重置倒數）
		this._centerFlyImages = [];
		this.lastHeroCardCount = 0;
		// 本局英雄是否有被發牌（＝有打這局）；手局結束「是否繼續遊戲」選單只給有打這局的人看。
		// 發牌時（_checkHeroCards isNewDeal）設 true；選單按下或離桌/換桌時設 false。
		this._heroPlayedCurrentHand = false;
		// 手局結束選單的客戶端視窗（比照德州撲克 _handEndMenuSeq / _handEndMenuEnd）：
		// 每次收到新的本局結算（bigTwoHandResultVersion 跳號）就重設視窗，不再依賴伺服器 table_countdown。
		this._handEndMenuSeq = 0;
		this._handEndMenuEnd = 0;
		// 本局是否已結算且下一局尚未發牌。大老二輸家於局末仍留有牌（只有贏家清空），
		// 故不能用「手上無牌」判斷局末；改用此旗標：收到結算時設 true，下一局發牌時設 false。
		this._handConcluded = false;
	}

	create() {
		this.useResponsiveLayout = true;
		this.app = window.__APP__;
		this.store = this.app?.store;
		const s0 = this.store?.getState?.() || {};
		this.lastHandResultVer = Number(s0.bigTwoHandResultVersion ?? 0);
		this.lastHeroCardsVer = Number(s0.bigTwoHeroCardsVersion ?? 0);
		// 場景建立時手牌已存在（重連 / 換場景 / mid-hand 重新進入）→ 退回一版讓 subscribe 首次 renderState 觸發
		// _checkHeroCards，並標記「首次同步」→ 靜態顯示、不重播發牌動畫。真正新發牌時場景建立時手牌為空，不受影響。
		this._heroInitialSync = (s0.bigTwoHeroCards?.length ?? 0) > 0;
		if (this._heroInitialSync) {
			this.lastHeroCardsVer = Math.max(0, this.lastHeroCardsVer - 1);
		}
		this.lastLastPlayVer = Number(s0.bigTwoLastPlayVersion ?? 0);
		// 場景建立時中央牌已存在（重連/換場景，store 於快照 seedBigTwoPileFromTable 補上）→ 退回一版讓首次
		// renderState 的 _checkLastPlay 觸發，並標記「首次同步」→ 靜態顯示、不重播飛入動畫與出牌音效。
		this._centerInitialSync = (s0.bigTwoLastPlay?.cards?.length ?? 0) > 0;
		if (this._centerInitialSync) {
			this.lastLastPlayVer = Math.max(0, this.lastLastPlayVer - 1);
		}

		this._buildBg();
		this._buildSeats();
		// 局末贏家發光圖（比照撲克，用 game_table 的 "light" frame）。置於頭像後方，預設隱藏。
		this._btWinLight = this.add
			.image(0, 0, "game_table", "light")
			.setDepth(BT_WIN_LIGHT_DEPTH)
			.setAlpha(0.88)
			.setVisible(false);
		this._buildCenterPlay();
		this._buildHeroHand();
		this._buildSideCardBacks();
		this._buildActionBtns();
		this._buildExitBtn();
		this.spectatorSitHint = this.buildSpectatorSitHint();
		this._buildPreStartUI();
		this._buildModal();
		this._buildHandEndMenu();
		this._buildBetPanel();
		this._buildComboModal();

		// UI check only — remove when wiring up trigger
		// this.openBetPanel(100, 10000); //

		this.countdownSfxSound = this.cache.audio.exists(CD_SFX_KEY)
			? this.sound.add(CD_SFX_KEY)
			: null;

		// 大老二「請選牌出牌」語音（BT_PLAY_PROMPT_KEY）與領牌首發語音（BT_FIRST_PLAY_PROMPT_KEY）
		// 已改於共用 bootScene 一併預載（進場前即就緒，避免首次輪到出牌時因非同步載入未就緒而無聲）。
		// 此處不再自行載入；_playBtPrompt 仍以 cache.audio.exists() 做播放前防護。

		// BGM
		this.bgm = this.sound.get("bgm_main");
		if (!this.bgm && this.cache.audio.exists("bgm_main")) {
			this.bgm = this.sound.add("bgm_main", { loop: true, volume: 0.2 });
		}
		this._syncBgm = () => {
			const vol = Number(this.app.getBgmOutputVolume?.(1) ?? 0);
			if (this.bgm) {
				if (vol > 0) {
					this.bgm.setVolume(vol);
					if (!this.bgm.isPlaying) this.bgm.play();
				} else {
					if (this.bgm.isPlaying) this.bgm.pause();
				}
			}
			this.soundSettingsPanel?.refresh?.();
		};
		this.soundSettingsPanel = new SoundSettingsPanel(this, {
			buttonX: AUDIO_TOGGLE_X,
			buttonY: AUDIO_TOGGLE_Y,
			onSettingsChanged: () => this._syncBgm(),
		});
		this._syncBgm();

		// 窗口隐藏时（最小化/切换标签）跳过发牌动画，直接显示所有牌
		this._onGameHidden = () => {
			if (!this._dealAnimating) return;
			this._dealRunId++;
			this._dealAnimating = false;
			this._showAllDealtCards();
		};
		this.game.events.on("hidden", this._onGameHidden, this);

		this.applyLayout();
		onLayoutResize(this, () => this.applyLayout());

		// 開發預覽：BT_DEV_FLIP_PREVIEW=true 時按「F」用假牌預覽對手翻牌動畫（正式版 flag=false → 不註冊、零影響）。
		if (BT_DEV_FLIP_PREVIEW && this.input?.keyboard) {
			this.input.keyboard.on("keydown-F", () =>
				this._revealOpponentHands(this._devDummyReveal()),
			);
		}

		this.unsubscribe = this.store?.subscribe((state) => {
			this.state = state;
			this.renderState();
		});

		// 視窗失焦（切到其他 app，如 Figma）時抑制音效，避免回前景一次爆音（分頁隱藏另由 document.hidden 判斷）。
		// 於 shutdown 移除，避免場景銷毀後殘留監聽。
		this._windowBlurred = false;
		this._onWinBlur = () => { this._windowBlurred = true; };
		this._onWinFocus = () => { this._windowBlurred = false; };
		window.addEventListener("blur", this._onWinBlur);
		window.addEventListener("focus", this._onWinFocus);

		this.countdownTicker = this.time.addEvent({
			delay: 120,
			loop: true,
			callback: () => {
				this._renderCountdown();
				this._refreshNextHandCountdown();
				// 手局結束選單也需 ticker 驅動：結算彈窗是由客戶端計時器關閉（非 store 變更），
				// 若只靠 renderState（store 訂閱）則彈窗關閉後不會重新評估，選單永遠不出現。
				this._refreshHandEndMenu();
				// 彈窗關閉後（計時器觸發、無 store 變更）維持牌面清空狀態，直到下一局發牌。
				this._hidePlaySurfaceIfHandEnded();
			},
		});

		this.events.once("shutdown", () => {
			this.unsubscribe?.();
			if (this._onWinBlur) window.removeEventListener("blur", this._onWinBlur);
			if (this._onWinFocus) window.removeEventListener("focus", this._onWinFocus);
			this._onWinBlur = null;
			this._onWinFocus = null;
			this._resultTimer?.remove();
			this._resultTimer = null;
			this.countdownTicker?.remove();
			this.countdownTicker = null;
			if (this.bgm?.isPlaying) this.bgm.stop();
			this.soundSettingsPanel?.destroy();
			this.spectatorSitHint?.destroy();
			this.spectatorSitHint = null;
			this.nextHandCountdownEnd = 0;
			this._dealRunId++; // invalidate any pending animation callbacks
			this.game.events.off("hidden", this._onGameHidden, this);
			this._centerFlyImages?.forEach((f) => f.destroy());
			this._centerFlyImages = [];
		});
	}

	// ─── BUILD ────────────────────────────────────────────────────────

	_buildBg() {
		this.bgImg = this.add
			.image(CX, CY, "big_two_game_table2", "bg")
			.setDisplaySize(VIEW_W, VIEW_H)
			.setDepth(-30);

		this.tableImg = this.add
			.image(CX, TABLE_Y, "big_two_game_table", "table")
			.setDisplaySize(TABLE_DISPLAY_W, TABLE_DISPLAY_H)
			.setDepth(-20);
		this.tableImg.postFX?.addShadow(2, 8, 0.005, 2.2, 0x000000, 6, 0.8);
	}

	// 一次性把張數徽章的「膠囊」畫成貼圖，之後用 Image 呈現（避免每幀重繪 Graphics 造成卡頓）。
	_ensurePillTextures() {
		const make = (key, w, h) => {
			if (this.textures.exists(key)) return;
			const g = this.make.graphics({ x: 0, y: 0, add: false });
			g.fillStyle(0x0d1b2a, 0.92);
			g.fillRoundedRect(1, 1, w - 2, h - 2, (h - 2) / 2);
			g.lineStyle(1.5, 0xffcc44, 1);
			g.strokeRoundedRect(1, 1, w - 2, h - 2, (h - 2) / 2);
			g.generateTexture(key, w, h);
			g.destroy();
		};
		make("bt_badge_pill", BADGE_W, BADGE_H);
		make("bt_badge_pill_hero", BADGE_W_HERO, BADGE_H_HERO);
		// 頭像底色圓：白色圓貼圖，用 Image + setTint 上色，取代每幀重繪的 fillCircle Graphics
		if (!this.textures.exists("bt_avatar_circle")) {
			const cr = 96;
			const g = this.make.graphics({ x: 0, y: 0, add: false });
			g.fillStyle(0xffffff, 1);
			g.fillCircle(cr, cr, cr);
			g.generateTexture("bt_avatar_circle", cr * 2, cr * 2);
			g.destroy();
		}
	}

	_buildSeats() {
		this.seatViews = [];
		this._ensurePillTextures();
		for (let vi = 0; vi < 4; vi++) {
			const pos = SEAT_POS[vi];
			const isHero = vi === 0;

			const glowOuter = this.add
				.circle(
					pos.x,
					pos.y + AVATAR_Y_OFFSET,
					TURN_GLOW_OUTER_RADIUS,
					TURN_GLOW_COLOR,
					TURN_GLOW_FILL_ALPHA_OUTER,
				)
				.setStrokeStyle(
					TURN_GLOW_STROKE_WIDTH_OUTER,
					TURN_GLOW_COLOR,
					TURN_GLOW_OUTER_ALPHA,
				)
				.setBlendMode(Phaser.BlendModes.ADD)
				.setDepth(17)
				.setVisible(false);

			// 回合倒數圓環（與德州撲克相同：頭像外緣漸層弧、隨剩餘時間遞減）。每 tick 重畫於頭像四周。
			const turnRing = this.add.graphics().setDepth(20);

			// 頭像背景色圓（depth 18 = SEAT_PROFILE_BG_DEPTH，蓋在 glow 上）
			const frameImg = this.add
				.image(
					pos.x,
					pos.y + AVATAR_Y_OFFSET,
					"game_table",
					"profile_frame_off",
				)
				.setScale(PROFILE_FRAME_SCALE)
				.setDepth(19)
				.setVisible(false);

			const profileBgColor =
				PROFILE_BG_COLORS[Math.floor(Math.random() * PROFILE_BG_COLORS.length)];
			const profileBgRadius =
				Math.min(frameImg.displayWidth, frameImg.displayHeight) * 0.44 -
				PROFILE_BG_PADDING;
			// 頭像底色圓：改用膠囊/圓貼圖 Image + setTint（不每幀重繪 Graphics）。大小由 applyLayout 設定。
			const avatarBg = this.add
				.image(pos.x, pos.y + AVATAR_Y_OFFSET, "bt_avatar_circle")
				.setTint(profileBgColor)
				.setDepth(18)
				.setVisible(false);

			// 頭像圖（depth 21 = SEAT_AVATAR_DEPTH）
			const avatarBaseSize =
				Math.min(frameImg.displayWidth, frameImg.displayHeight) *
				PROFILE_AVATAR_INNER_RATIO;
			const avatarImg = this.add
				.image(pos.x, pos.y + AVATAR_Y_OFFSET, "avatar_element", "avatar_1")
				.setDisplaySize(avatarBaseSize, avatarBaseSize)
				.setDepth(21)
				.setVisible(false);

			// 名字牌發光（depth 22 = SEAT_TEXT_DEPTH-1，在 nametag 後面）
			const nametagGlow = this.add
				.image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "nametag_glow")
				.setTint(0xfff1a8)
				.setDepth(22)
				.setAlpha(0)
				.setVisible(false);

			// 名字牌底圖（depth 22.5 = SEAT_TEXT_DEPTH-0.5，蓋在 glow 上）
			const nametagImg = this.add
				.image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "nametag")
				.setScale(isHero ? NAMETAG_SCALE_HERO : NAMETAG_SCALE_NORMAL)
				.setDepth(22.5)
				.setVisible(false);

			// 名字文字（depth 23 = SEAT_TEXT_DEPTH）
			const nameText = this.add
				.text(pos.x, pos.y + AVATAR_Y_OFFSET + 50, "", {
					fontFamily: "sans-serif",
					fontSize: isHero ? "24px" : "22px",
					color: "#ffffff",
					fontStyle: "bold",
				})
				.setOrigin(0.5)
				.setDepth(23)
				.setVisible(false);

			// 籌碼文字
			const chipsText = this.add
				.text(pos.x, pos.y + AVATAR_Y_OFFSET + 80, "", {
					fontFamily: "sans-serif",
					fontSize: "22px",
					color: "#F9CD73",
					fontStyle: "bold",
					stroke: "#4a2f1d",
					strokeThickness: 1,
					shadow: {
						offsetX: 1,
						offsetY: 2,
						color: "#000000",
						blur: 4,
						fill: true,
					},
				})
				.setOrigin(0.5)
				.setDepth(23)
				.setVisible(false);

			// 剩餘牌數徽章文字（對手）
			const cardCountBadge = this.add
				.text(pos.x, pos.y + OPP_CARDS_Y_OFFSET, "", {
					fontFamily: "sans-serif",
					fontSize: "20px", // 實際大小於 applyLayout 依座位以 24:20 覆寫；此為初始值
					color: "#ffffff",
					fontStyle: "bold",
				})
				.setOrigin(0.5)
				.setDepth(26)
				.setVisible(false);

			// 對手牌背改以側邊「縱列／橫列」呈現（seat0/1/3CardBackImages、heroCardBackImages，見 _buildSideCardBacks）；
			// 舊的「扇形牌背」已完全停用並移除。
			// 張數徽章背景：用一次性產生的「膠囊貼圖」Image（origin 0.5），渲染成本極低（不每幀重繪）。
			// 所有座位皆建立（含英雄座；英雄入座時隱藏，觀戰時底部中央家用較大的膠囊貼圖）。
			const cardCountBadgeBg = this.add
				.image(pos.x, pos.y, isHero ? "bt_badge_pill_hero" : "bt_badge_pill")
				.setDepth(25.5)
				.setVisible(false);

			// 倒數計時（與德州撲克相同：圓形背景 + 金框 + 白字）
			const cdBg = this.add
				.arc(
					pos.x,
					pos.y,
					CD_BG_RADIUS,
					0,
					360,
					false,
					CD_BG_COLOR,
					CD_BG_ALPHA,
				)
				.setStrokeStyle(CD_RING_WIDTH, CD_RING_COLOR, 1)
				.setDepth(24)
				.setVisible(false);
			const cdText = this.add
				.text(pos.x, pos.y, "", {
					fontFamily: "sans-serif",
					fontSize: CD_FONT_SIZE,
					color: CD_TEXT_COLOR,
					fontStyle: "bold",
				})
				.setOrigin(0.5)
				.setDepth(24.1)
				.setVisible(false);

			// 空座位提示（與德州撲克相同）
			const emptySeatRadius =
				Math.min(frameImg.displayWidth, frameImg.displayHeight) * 0.32;
			const sitPromptBgRadius = emptySeatRadius * 0.78;
			const sitPromptBg = this.add
				.graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
				.fillStyle(0x000000, 0.65)
				.fillCircle(0, 0, sitPromptBgRadius)
				.setDepth(18)
				.setVisible(false);
			const sitPromptCircle = this.add
				.graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
				.lineStyle(2, 0xffffff, 1)
				.setDepth(18.1)
				.setVisible(false);
			for (let i = 0; i < 24; i++) {
				const sa = Phaser.Math.DegToRad(i * 15);
				const ea = Phaser.Math.DegToRad(i * 15 + 9);
				sitPromptCircle.beginPath();
				sitPromptCircle.arc(0, 0, sitPromptBgRadius, sa, ea, false);
				sitPromptCircle.strokePath();
			}
			const sitPromptPlus = this.add
				.text(pos.x, pos.y + AVATAR_Y_OFFSET, "+", {
					fontSize: "34px",
					color: "#ffffff",
					fontStyle: "bold",
					fontFamily: "sans-serif",
					stroke: "#000000",
					strokeThickness: 2,
				})
				.setOrigin(0.5)
				.setDepth(21)
				.setVisible(false);
			const sitPromptLabel = this.add
				.text(pos.x, pos.y + AVATAR_Y_OFFSET + emptySeatRadius + 12, "可入座", {
					fontSize: "18px",
					color: "#ffffff",
					fontStyle: "bold",
					fontFamily: "sans-serif",
					stroke: "#000000",
					strokeThickness: 2,
				})
				.setOrigin(0.5)
				.setDepth(23)
				.setVisible(false);

			// 入座但本局尚未發牌（joined mid-hand）時的「等待中」徽章；沿用共用 game_table atlas 的 "waiting" frame（poker 不受影響）
			const waitingBadge = this.add
				.image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "waiting")
				.setDepth(27)
				.setVisible(false);

			// 等待中暗化遮罩（與德州撲克 foldOverlay 相同：頭像上方半透明黑圓，目前只用於英雄等待）。
			// 半徑由 applyLayout 依頭像底圓大小設定；depth 22 蓋在頭像(21)上、徽章(27/30)之下。
			const avatarDimOverlay = this.add
				.arc(pos.x, pos.y + AVATAR_Y_OFFSET, 1, 0, 360, false, 0x000000, 0.55)
				.setDepth(22)
				.setVisible(false);

			// 過牌動作標籤（沿用 game_table 的 brand_check frame，與德州撲克同一張圖）
			const actionBadge = this.textures.get("game_table")?.has?.("brand_check")
				? this.add
						.image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "brand_check")
						.setOrigin(0.5)
						.setDepth(BT_ACTION_BADGE_DEPTH)
						.setScale(BT_ACTION_BADGE_SCALE)
						.setVisible(false)
				: null;

			this.seatViews.push({
				posX: pos.x,
				posY: pos.y,
				slotIndex: vi,
				isHero,
				displaySeat: null,
				avatarBg,
				profileBgRadius,
				avatarDimOverlay,
				actionBadge,
				actionBadgeHideTimer: null,
				avatarImg,
				avatarBaseSize,
				frameImg,
				glowOuter,
				turnRing,
				nametagGlow,
				nametagImg,
				nameText,
				chipsText,
				cardCountBadge,
				cardCountBadgeBg,
				cdBg,
				cdText,
				waitingBadge,
				sitPromptBg,
				sitPromptBgRadius,
				sitPromptCircle,
				sitPromptPlus,
				sitPromptLabel,
				turnActive: false,
				glowOuterTween: null,
				nametagBreathTween: null,
			});
		}
	}

	_buildCenterPlay() {
		this.centerLabel = this.add
			.text(CX, CENTER_LABEL_Y, "最新出牌", {
				fontFamily: "sans-serif",
				fontSize: "22px",
				color: "#c8a060",
				stroke: "#000000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false);

		this.centerByText = this.add
			.text(CX, CENTER_BY_Y, "", {
				fontFamily: "sans-serif",
				fontSize: "30px",
				color: "#ffd060",
				fontStyle: "bold",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false);

		this.centerPlayImages = [];
		this.centerPrevImages = [];
		this._curPlayCards = [];
		this._prevCardBuf = [];
		this.centerPlayShadow = this.add.graphics().setDepth(9).setVisible(false);
	}

	_buildHeroHand() {
		this.heroCardImages = [];
		this.selectedIndices = new Set();
		const heroHand = this._getHeroHandLayout();
		for (let i = 0; i < 13; i++) {
			const lx = heroHand.startX + i * (heroHand.cardW + heroHand.gap);
			const img = this.add
				.image(lx, heroHand.y, "playing_cards_element", "2c")
				.setDisplaySize(heroHand.cardW, heroHand.cardH)
				.setDepth(50)
				.setVisible(false)
				.setInteractive({ useHandCursor: true });
			img.cardIndex = i;
			img.on("pointerdown", () => this._toggleCard(i));
			this.heroCardImages.push(img);
		}

		// 英雄牌背橫排（avatar 右側，13 張背面橫列）
		this.heroCardBackImages = [];
		for (let i = 0; i < 13; i++) {
			const cb = this.add
				.image(0, 0, "big_two_game_table", "card_back")
				.setDisplaySize(HERO_BACK_CARD_W, HERO_BACK_CARD_H)
				.setDepth(20 + i * 0.01)
				.setVisible(false);
			this.heroCardBackImages.push(cb);
		}
	}

	_buildSideCardBacks() {
		this.seat1CardBackImages = [];
		this.seat3CardBackImages = [];
		// 觀戰時底部中央玩家（vi 0）的水平牌背列（座上時 vi 0 為英雄，顯示正面手牌，不用此列）
		this.seat0CardBackImages = [];
		for (let i = 0; i < 13; i++) {
			this.seat0CardBackImages.push(
				this.add
					.image(0, 0, "big_two_game_table", "card_back")
					.setDisplaySize(HERO_BACK_CARD_W, HERO_BACK_CARD_H)
					.setDepth(20 + i * 0.01)
					.setVisible(false),
			);
		}
		for (let i = 0; i < 13; i++) {
			this.seat1CardBackImages.push(
				this.add
					.image(0, 0, "big_two_game_table", "card_back")
					.setDisplaySize(SIDE_BACK_CARD_W, SIDE_BACK_CARD_H)
					.setDepth(20 + i * 0.01)
					.setAngle(-90)
					.setVisible(false),
			);
			this.seat3CardBackImages.push(
				this.add
					.image(0, 0, "big_two_game_table", "card_back")
					.setDisplaySize(SIDE_BACK_CARD_W, SIDE_BACK_CARD_H)
					.setDepth(20 + i * 0.01)
					.setAngle(90)
					.setVisible(false),
			);
		}
	}

	_buildActionBtns() {
		this.playBtn = createGradientButton(this, {
			x: PLAY_BTN_X,
			y: ACTION_Y,
			width: BTN_W,
			height: BTN_H,
			cornerRadius: 14,
			topColor: 0xf5a623,
			bottomColor: 0x8a3800,
			borderColor: 0xffd060,
			label: "出牌",
			labelStyle: { fontSize: "32px", color: "#ffffff", fontStyle: "bold" },
			depth: 60,
			onClick: () => this._onPlay(),
			visible: false,
		});
		this.passBtn = createGradientButton(this, {
			x: PASS_BTN_X,
			y: ACTION_Y,
			width: BTN_W,
			height: BTN_H,
			cornerRadius: 14,
			topColor: 0x3a6090,
			bottomColor: 0x0e2035,
			borderColor: 0x55aaee,
			label: "過",
			labelStyle: { fontSize: "32px", color: "#ffffff", fontStyle: "bold" },
			depth: 60,
			onClick: () => this._onPass(),
			visible: false,
		});

		// 圖集版操作按鈕（同德州撲克模式，函數尚未接入）
		this.btActionButtons = {};
		BT_ACTION_BUTTON_ORDER.forEach((action) => {
			const frame = `btn_${action}`;
			if (!this.textures.get(BT_ACTION_ATLAS)?.has(frame)) return;
			const image = this.add
				.image(CX, BT_ACTION_ROW_Y, BT_ACTION_ATLAS, frame)
				.setDisplaySize(BT_ACTION_BUTTON_WIDTH, BT_ACTION_BUTTON_HEIGHT)
				.setDepth(BT_ACTION_BUTTON_DEPTH)
				.setVisible(false)
				.setInteractive({ useHandCursor: true });
			if (action === "select") {
				image.on("pointerdown", () => {
					if (image._inactive) return; // 停用態（非英雄回合）不可點
					this.comboModalBg?.visible
						? this._closeComboModal()
						: this.openComboModal();
				});
			}
			if (action === "play")
				image.on("pointerdown", () => {
					if (image._inactive) {
						playWrongClick(this); // 出牌鈕灰底停用（未選到合法組合/非英雄回合）時點擊→播錯誤音
						return;
					}
					this._onPlay();
				});
			if (action === "pass")
				image.on("pointerdown", () => {
					if (image._inactive) return;
					this._onPass();
				});
			this.btActionButtons[action] = image;
		});
		// 橫向排列圖集操作按鈕（原為 create() 的 UI-check，移到此處一次定位；維持隱藏）
		{
			const btns = BT_ACTION_BUTTON_ORDER.map(
				(a) => this.btActionButtons[a],
			).filter(Boolean);
			const totalW =
				btns.length * BT_ACTION_BUTTON_WIDTH +
				(btns.length - 1) * BT_ACTION_BUTTON_GAP;
			btns.forEach((btn, i) => {
				btn.setPosition(
					CX -
						totalW / 2 +
						BT_ACTION_BUTTON_WIDTH / 2 +
						i * (BT_ACTION_BUTTON_WIDTH + BT_ACTION_BUTTON_GAP),
					BT_ACTION_ROW_Y,
				);
			});
		}
		// 選牌鈕已退役：不在 BT_ACTION_BUTTON_ORDER 內故不建立（過牌/出牌 兩鈕置中無空位）。
		// 未來若要復用，將 "select" 加回 BT_ACTION_BUTTON_ORDER 即可（建構迴圈的 select 分支＋openComboModal 仍在）。
		// 選牌提示（顯示已選張數 / 牌型）——DEBUG：正式遊玩停用（會蓋住手牌）。
		// 不建立時保持為 null，後續所有 this.comboInfoText?.setText/setVisible(...) 皆自動略過（optional chaining）。
		this.comboInfoText = SHOW_COMBO_INFO_TEXT
			? this.add
					.text(CX, COMBO_INFO_Y, "", {
						fontFamily: "sans-serif",
						fontSize: "24px",
						color: "#ffe88a",
						fontStyle: "bold",
						stroke: "#000000",
						strokeThickness: 2,
					})
					.setOrigin(0.5)
					.setDepth(61)
					.setVisible(false)
			: null;
	}

	_buildExitBtn() {
		this.exitBtn = this.add
			.image(EXIT_X, EXIT_Y, "big_two_game_table2", "btn_exit_table")
			.setDisplaySize(190, 76)
			.setDepth(70)
			.setInteractive({ useHandCursor: true });
		this.exitBtn.on("pointerdown", () => {
			this._playUiClick();
			this._heroPlayedCurrentHand = false; // 離桌→清除「有打這局」，避免新桌殘留手局結束選單
			this._handConcluded = false;
			if (this.isResultOpen) this._closeModal(); // 收掉可能開著的結算彈窗
			this.app?.sendPacket?.("leave_room", {});
		});

		this.changeTableBtn = this.add
			.image(
				CHANGE_TABLE_X,
				CHANGE_TABLE_Y,
				"big_two_game_table2",
				"btn_change_table",
			)
			.setDisplaySize(190, 76)
			.setDepth(70)
			.setInteractive({ useHandCursor: true });
		this.changeTableBtn.on("pointerdown", () => {
			this._playUiClick();
			this._heroPlayedCurrentHand = false; // 換桌→清除「有打這局」，避免新桌殘留手局結束選單
			this._handConcluded = false;
			if (this.isResultOpen) this._closeModal(); // 收掉可能開著的結算彈窗，換桌不被卡住
			this.store?.beginSwitchRoom?.();
			this.app?.sendPacket?.("switch_room", {});
		});

		// 離座按鈕（比照德州撲克 stand_up）：入座但本局尚未發牌（等待中）時顯示。
		// 送 stand_up → 伺服器釋出席位、留在本桌轉為觀戰（觀戰渲染路徑已存在）。
		// 注意：stand_up 是否被後端處理需以實機點擊驗證；故仍保留離桌/換桌作為退路（見 _refreshRoomButtons）。
		this.standUpBtn = this.add
			.image(STAND_UP_X, STAND_UP_Y, "big_two_game_table2", "btn_standup_table")
			.setDisplaySize(190, 76)
			.setDepth(70)
			.setVisible(false)
			.setInteractive({ useHandCursor: true });
		this.standUpBtn.on("pointerdown", () => {
			this._playUiClick();
			if (this.isResultOpen) this._closeModal(); // 收掉可能開著的結算彈窗
			this.app?.sendPacket?.("stand_up", {});
		});
	}

	buildSpectatorSitHint() {
		// 觀戰提示直接用 atlas 圖（inview_hint，已含「觀戰中 請選位坐下」文字）。
		// 高度依該 frame 實際寬高比推算，不可寫死比例（重新打包圖集換長寬時避免走型）。
		const W = 360;
		const frame = this.textures.getFrame("big_two_game_table2", "inview_hint");
		const aspect =
			frame && frame.width && frame.height
				? frame.height / frame.width
				: 87 / 191;
		const H = Math.round(W * aspect);
		this._spectatorSitHintW = W;
		this._spectatorSitHintH = H;
		const container = this.add.container(0, 0).setDepth(60).setVisible(false);
		const bg = this.add
			.image(0, 0, "big_two_game_table2", "inview_hint")
			.setOrigin(0.5)
			.setDisplaySize(W, H);
		container.add([bg]);
		return container;
	}

	_buildModal() {
		this.modalOverlay = this.add
			.rectangle(CX, CY, VIEW_W * 2, VIEW_H * 2, 0x000000, 0.72)
			.setDepth(MODAL_OVL_D)
			.setVisible(false)
			.setInteractive({ useHandCursor: false });

		// 注意：modalPanelGfx 疊在 modalBorderGfx（含 drawEnhancedBorder 的金色填滿）之上，
		// 作為「乾淨金色內面板」蓋掉共用框的混濁漸層（內縮，仍露出金邊與外緣高光）。
		this.modalBorderGfx = this.add
			.graphics()
			.setDepth(MODAL_PNL_D + 0.5)
			.setVisible(false);
		this.modalPanelGfx = this.add
			.graphics()
			.setDepth(MODAL_PNL_D + 0.6)
			.setVisible(false);
		this.modalPanelMaskGfx = this.make.graphics({ add: false });
		this.modalPanelGfx.setMask(this.modalPanelMaskGfx.createGeometryMask());

		this.modalTitleLabel = this.add
			.image(CX, CY - MODAL_H / 2, "game_table", "title_label")
			.setOrigin(0.5)
			.setDisplaySize(320, 112)
			// 須高於乾淨金色內面板（MODAL_PNL_D + 0.6）與列底板（+0.7），否則標題橫幅下緣會被面板蓋住
			.setDepth(MODAL_PNL_D + 0.8)
			.setVisible(false);

		this.modalTitle = this.add
			.text(CX, CY - MODAL_H / 2 + 8, "本局結果", {
				fontFamily: "sans-serif",
				fontSize: "42px",
				fontStyle: "bold",
				color: "#ffe9a8",
				stroke: "#000000",
				strokeThickness: 4,
				shadow: {
					offsetX: 0,
					offsetY: 2,
					color: "#000000",
					blur: 4,
					fill: true,
				},
			})
			.setOrigin(0.5)
			.setDepth(MODAL_TXT_D)
			.setVisible(false);
		applyGoldTitleGradient(this.modalTitle);

		// 本局結果內容（表頭 + 每位玩家列）改為動態建立於 _buildResultRows，存於 this._resultRowObjs，
		// 顯示時建立、關閉時銷毀、resize 時重建（不再用固定的三欄文字 / 底分頁腳）。

		this.modalHint = this.add
			.text(
				CX,
				CY + MODAL_H / 2 - 60,
				`彈窗倒數（${RESULT_AUTO_CLOSE_SECONDS}）秒 自動關閉`,
				{
					fontFamily: "sans-serif",
					fontSize: "28px", // 比照撲克 HAND_RESULT_HINT_FONT_SIZE
					fontStyle: "bold",
					color: "#c9a96a", // 淺金棕：在深紅面板上可讀（比照撲克彈窗）
				},
			)
			.setOrigin(0.5)
			.setDepth(MODAL_TXT_D)
			.setVisible(false);

		this.modalConfirmBtn = createGradientButton(this, {
			x: CX,
			y: CY + MODAL_H / 2 - 46,
			width: 200,
			height: 62,
			cornerRadius: 10,
			topColor: 0x1a5aaa,
			bottomColor: 0x0a2855,
			borderColor: 0x3d90f5,
			label: "確定",
			labelStyle: { fontSize: "28px", color: "#ffffff" },
			depth: MODAL_TXT_D,
			onClick: () => this._closeModal(),
			visible: false,
		});
	}

	// ─── LAYOUT ───────────────────────────────────────────────────────

	_getHeroHandLayout(cardCount = 13) {
		const s = this._s || 1;
		const visibleW = layout.width / s;
		const targetTotalW = visibleW * HERO_HAND_WIDTH_RATIO;
		const cardScale = HERO_HAND_CARD_SCALE;
		const cardW = HERO_CARD_W * cardScale;
		const cardH = HERO_CARD_H * cardScale;
		const gap =
			cardCount > 1
				? (targetTotalW - cardCount * cardW) / (cardCount - 1)
				: 0;
		const totalW = cardCount * cardW + Math.max(0, cardCount - 1) * gap;
		const startX = CX + HERO_HAND_X_OFFSET - totalW / 2 + cardW / 2;
		const bottomPadding = Math.max(
			HERO_HAND_MOBILE_BOTTOM_PADDING,
			layout.safeAreaBottom || 0,
		);
		const y = VIEW_H - bottomPadding - cardH / 2;

		return { startX, y, cardW, cardH, gap, scale: cardScale };
	}

	applyLayout() {
		const cx = layout.centerX;
		const cy = layout.centerY;
		const sx = layout.width / VIEW_W;
		const sy = layout.height / VIEW_H;
		const s = Math.min(sx, sy);
		const ox = cx - (VIEW_W / 2) * s;
		const oy = cy - (VIEW_H / 2) * s;
		this._s = s;
		this._ox = ox;
		this._oy = oy;

		const sc = (lx, ly) => ({ x: ox + lx * s, y: oy + ly * s });

		// 背景 + 桌面
		this.bgImg?.setPosition(cx, cy).setDisplaySize(layout.width, layout.height);
		if (this.tableImg) {
			this.tableImg
				.setPosition(CX + TABLE_X_OFFSET, TABLE_Y)
				.setDisplaySize(TABLE_DISPLAY_W, TABLE_DISPLAY_H);
		}

		// 座位（與德州撲克相同：先更新 posX/posY，再呼叫 updateSeatTextLayout）
		this.seatViews.forEach((sv, vi) => {
			const lp = SEAT_POS[vi];
			const sp = sc(lp.x, lp.y);
			sv.posX = sp.x;
			sv.posY = sp.y;
			sv.isHero = vi === 0;
			this.updateSeatTextLayout(sv, s);

			// 「等待中」徽章：置於頭像中央
			const ap = sc(lp.x, lp.y + AVATAR_Y_OFFSET);
			sv.waitingBadge
				?.setPosition(ap.x, ap.y)
				.setDisplaySize(WAIT_BADGE_W * s, WAIT_BADGE_H * s);

			// 張數徽章：位置由 _positionCountBadges（依側邊縱列幾何，於本函式尾端與每次渲染時呼叫）統一定位；
			// 此處僅隨 resize 設定縮放與字級（底部中央家 vi 0 觀戰時字體較大）。
			const badgeFontPx = Math.round((vi === 0 ? 24 : 20) * s);
			sv.cardCountBadgeBg?.setScale(s * BADGE_BG_PAD_SCALE);
			sv.cardCountBadge?.setFontSize(`${badgeFontPx}px`);
		});

		// 對手牌背列（vi 0 底部水平 / 1 右 / 2 上 / 3 左）：以 _sideColCardPos 定位，與發牌動畫落點一致
		[0, 1, 2, 3].forEach((vi) => {
			const col = this._sideColForView(vi);
			if (!col?.length) return;
			col.forEach((cb, i) => {
				const p = this._sideColCardPos(vi, i);
				cb.setPosition(p.x, p.y).setDisplaySize(
					SIDE_BACK_CARD_W * s,
					SIDE_BACK_CARD_H * s,
				);
			});
		});
		this._positionCountBadges(); // 徽章貼齊側邊牌堆（觀戰與入座皆然；resize 後同步）

		// 觀戰提示（右下角，依場景縮放定位）
		if (this.spectatorSitHint) {
			const hw = this._spectatorSitHintW || 300;
			const hh = this._spectatorSitHintH || 64;
			const p = sc(VIEW_W - hw / 2 - 20, VIEW_H - hh / 2 - 50);
			this.spectatorSitHint.setPosition(p.x, p.y).setScale(s);
		}

		// 英雄手牌
		const heroHand = this._getHeroHandLayout();
		this.heroCardImages.forEach((img, i) => {
			const lx = heroHand.startX + i * (heroHand.cardW + heroHand.gap);
			const sel = this.selectedIndices.has(i);
			const sp = sc(lx, heroHand.y - (sel ? HERO_CARD_LIFT * heroHand.scale : 0));
			img
				.setPosition(sp.x, sp.y)
				.setDisplaySize(heroHand.cardW * s, heroHand.cardH * s);
		});
		this._refreshCardVisuals(); // 重排後重套選取/灰底外觀

		// 中央出牌區
		const lp = sc(CX, CENTER_LABEL_Y);
		this.centerLabel?.setPosition(lp.x, lp.y);
		const bp = sc(CX, CENTER_BY_Y);
		this.centerByText?.setPosition(bp.x, bp.y);
		this._layoutCenterCards();

		// 按鈕
		const pp = sc(PLAY_BTN_X, ACTION_Y);
		this.playBtn?.setPosition?.(pp.x, pp.y);
		const pap = sc(PASS_BTN_X, ACTION_Y);
		this.passBtn?.setPosition?.(pap.x, pap.y);
		const cip = sc(CX, COMBO_INFO_Y);
		this.comboInfoText
			?.setPosition(cip.x, cip.y)
			.setFontSize(`${Math.round(24 * s)}px`);

		// 頂部按鈕
		const ep = sc(EXIT_X, EXIT_Y);
		this.exitBtn?.setPosition(ep.x, ep.y);
		const ctp = sc(CHANGE_TABLE_X, CHANGE_TABLE_Y);
		this.changeTableBtn?.setPosition(ctp.x, ctp.y);
		const sup = sc(STAND_UP_X, this._standUpBaseY ?? STAND_UP_Y);
		this.standUpBtn?.setPosition(sup.x, sup.y);

		// 圖集操作按鈕（過牌/出牌/選牌）＋牌型面板：改由 sc() 一起定位/縮放（原本用原始設計座標，
		// 手機瀏覽器（URL bar 改變視窗高度）時 oy/s 未套用而與手牌錯位、蓋牌）。
		this._layoutActionCluster(s, ox, oy);

		// 開局前提示
		const psp = sc(CX, PRESTART_Y);
		this.preStartText?.setPosition(psp.x, psp.y);

		// 結算 Modal
		this.modalOverlay
			?.setPosition(cx, cy)
			.setSize(layout.width * 2, layout.height * 2);
		this._drawModal(cx, cy, s);
		const mt = oy + (CY - MODAL_H / 2) * s;
		this.modalTitleLabel?.setPosition(cx, mt).setDisplaySize(320 * s, 112 * s);
		this.modalTitle?.setPosition(cx, mt + 8 * s);
		this.modalHint?.setPosition(cx, oy + (CY + MODAL_H / 2 - 60) * s);
		// 本局結果列：開著時依新縮放/位移重建（表頭＋各列底板與文字皆為動態物件）
		if (this.isResultOpen && this._lastResult)
			this._buildResultRows(this._lastResult);

		// 手局結束「是否繼續遊戲」選單
		this.heMenuOverlay
			?.setPosition(cx, cy)
			.setSize(layout.width * 2, layout.height * 2);
		this._drawHandEndMenu(cx, cy, s);
		const het = oy + HE_TITLE_Y * s;
		this.heMenuTitleLabel?.setPosition(cx, het).setDisplaySize(320 * s, 112 * s);
		this.heMenuTitle?.setPosition(cx, het + 8 * s);
		const heb = sc(CX, HE_BODY_Y);
		this.heMenuBody?.setPosition(heb.x, heb.y);
		const hej = sc(HE_JOIN_X, HE_BTN_Y);
		this.heMenuJoinBtn?.setPosition?.(hej.x, hej.y);
		const hes = sc(HE_STAND_X, HE_BTN_Y);
		this.heMenuStandBtn?.setPosition?.(hes.x, hes.y);
		const hee = sc(HE_EXIT_X, HE_BTN_Y);
		this.heMenuExitBtn?.setPosition?.(hee.x, hee.y);
		[this.heMenuJoinBtn, this.heMenuStandBtn, this.heMenuExitBtn].forEach((btn) =>
			btn?.setScale?.(s),
		);
	}

	// 操作按鈕（過牌/出牌/選牌）＋牌型面板的響應式定位：與手牌相同用 sc()（含 oy 置中位移與 s 高度壓縮），
	// 讓整組跟著手牌一起縮放/位移。修正 iOS/手機瀏覽器上按鈕蓋住手牌的問題。僅動大老二自身物件，不影響撲克。
	_layoutActionCluster(s, ox, oy) {
		const sc = (lx, ly) => ({ x: ox + lx * s, y: oy + ly * s });

		// 圖集操作按鈕（依 BT_ACTION_BUTTON_ORDER 橫排）。
		// 位置跟隨場景響應式 Y 軸，但按鈕本身使用與德州撲克手機四鈕列一致的實際顯示尺寸，
		// 不再乘上 s，避免 iOS/手機瀏覽器高度壓縮時過牌/出牌被縮小。
		const order = BT_ACTION_BUTTON_ORDER.filter((a) => this.btActionButtons?.[a]);
		const totalW =
			order.length * BT_ACTION_BUTTON_WIDTH +
			(order.length - 1) * BT_ACTION_BUTTON_GAP;
		const rowP = sc(CX, BT_ACTION_ROW_Y);
		let cursorX = rowP.x - totalW / 2;
		order.forEach((a) => {
			const x = cursorX + BT_ACTION_BUTTON_WIDTH / 2;
			this.btActionButtons[a]
				.setPosition(x, rowP.y)
				.setDisplaySize(BT_ACTION_BUTTON_WIDTH, BT_ACTION_BUTTON_HEIGHT);
			cursorX += BT_ACTION_BUTTON_WIDTH + BT_ACTION_BUTTON_GAP;
		});

		// 牌型面板底圖 + 遮罩（drawn at local origin → 直接 setPosition/setScale 即可縮放跟隨）
		const panelY =
			BT_ACTION_ROW_Y -
			BT_ACTION_BUTTON_HEIGHT / 2 -
			BT_COMBO_PANEL_GAP_Y -
			BT_COMBO_PANEL_H / 2;
		const pp = sc(CX, panelY);
		this.comboModalBg?.setPosition(pp.x, pp.y).setScale(s);
		this._comboMaskGfx?.setPosition(pp.x, pp.y).setScale(s);

		// 六顆牌型按鈕（與 _buildComboModal 座標一致）：sc() 定位 + 依 s 縮放 gradGfx/text（尺寸與面板一致）
		const panelW = VIEW_W;
		const btnW =
			(panelW -
				2 * BT_COMBO_PANEL_PADDING -
				(BT_COMBO_LABELS.length - 1) * BT_COMBO_BTN_GAP) /
			BT_COMBO_LABELS.length;
		const rowLeftX = CX - panelW / 2 + BT_COMBO_PANEL_PADDING;
		this.comboModalButtons?.forEach((btn, i) => {
			const dx = rowLeftX + btnW / 2 + i * (btnW + BT_COMBO_BTN_GAP);
			const p = sc(dx, panelY);
			btn.setPosition(p.x, p.y);
			btn.gradGfx?.setScale(s);
			btn.text?.setScale(s);
		});
		// 牌型標籤（單一）：resize 後把目前顯示的那顆置中（pp = 面板中心 sc(CX, panelY)）。
		if (this._comboLabelBtn >= 0)
			this.comboModalButtons?.[this._comboLabelBtn]?.setPosition(pp.x, pp.y);
	}

	// 與德州撲克的 updateSeatTextLayout 相同邏輯，加入 s 縮放因子
	updateSeatTextLayout(sv, s) {
		const isHero = sv.isHero;
		const logicalY = SEAT_POS[sv.slotIndex].y;
		const avatarScale = isHero
			? BT_HERO_AVATAR_SCALE
			: btPerspectiveScale(logicalY);
		const frameScale = (1.437 * avatarScale) / BT_NORMAL_AVATAR_SCALE;
		const bgScale = (0.83 * avatarScale) / BT_NORMAL_AVATAR_SCALE;
		const nametagScale = isHero ? NAMETAG_SCALE_HERO : NAMETAG_SCALE_NORMAL;
		const nameFontScale = isHero ? 0.8 : 0.65;
		const nameFontSize = Math.round(32 * nameFontScale * s);
		const chipsFontSize = Math.round((isHero ? 35 : 30) * s);
		const chipsYGap = isHero ? CHIPS_Y_GAP_HERO : CHIPS_Y_GAP_NORMAL;

		sv.frameImg
			.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
			.setScale(frameScale * s);
		// 頭像底色圓貼圖：直徑 = 原 fillCircle 半徑 × bgScale × s × 2（與舊 Graphics 等大）
		const _bgD = 2 * (sv.profileBgRadius ?? 0) * bgScale * s;
		sv.avatarBg
			.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
			.setDisplaySize(_bgD, _bgD);
		// 等待中暗化遮罩：與頭像底圓同心同大小
		sv.avatarDimOverlay
			?.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
			.setRadius(Math.max(1, _bgD / 2));
		const avatarInnerRatio = isHero
			? PROFILE_AVATAR_INNER_RATIO
			: PROFILE_AVATAR_INNER_RATIO * 0.92;
		const avatarSize =
			Math.min(sv.frameImg.displayWidth, sv.frameImg.displayHeight) *
			avatarInnerRatio;
		sv.avatarImg
			.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
			.setDisplaySize(avatarSize, avatarSize);
		sv.glowOuter.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s);
		// 過牌動作標籤：置於頭像中心上方（縮放由顯示時的彈跳動畫管理）
		sv.actionBadge?.setPosition(
			sv.posX,
			sv.posY + (AVATAR_Y_OFFSET + BT_ACTION_BADGE_DY) * s,
		);

		// 倒數計時定位（與德州撲克相同）
		const cdFxScale = isHero ? 1.32 : 1.12;
		const cdEdgeR = Math.round(TURN_GLOW_OUTER_RADIUS * cdFxScale * 0.68) * s;
		const cdX = sv.posX + cdEdgeR;
		const cdY = sv.posY + AVATAR_Y_OFFSET * s + cdEdgeR;
		sv.cdBg.setPosition(cdX, cdY).setScale(s);
		sv.cdText.setPosition(cdX, cdY).setFontSize(`${Math.round(20 * s)}px`);

		// 空座位提示定位
		const avatarCY = sv.posY + AVATAR_Y_OFFSET * s;
		sv.sitPromptBg.setPosition(sv.posX, avatarCY).setScale(s);
		sv.sitPromptCircle.setPosition(sv.posX, avatarCY).setScale(s);
		sv.sitPromptPlus
			.setPosition(sv.posX, avatarCY)
			.setFontSize(`${Math.round(34 * s)}px`);
		const sitLabelY = avatarCY + (sv.sitPromptBgRadius / 0.78) * s + 12 * s;
		sv.sitPromptLabel
			.setPosition(sv.posX, sitLabelY)
			.setFontSize(`${Math.round(18 * s)}px`);

		const frameHalfH = sv.frameImg.displayHeight * 0.5;
		const nameTagCenterY = sv.posY + AVATAR_Y_OFFSET * s + frameHalfH - 18 * s;
		sv.nametagGlow
			.setScale(nametagScale * s)
			.setPosition(sv.posX, nameTagCenterY)
			.setOrigin(0.5, 0.5);
		sv.nametagImg
			.setScale(nametagScale * s)
			.setPosition(sv.posX, nameTagCenterY)
			.setOrigin(0.5, 0.5);
		const nametagHalfH = sv.nametagImg.displayHeight * 0.5;
		sv.nameText
			.setFontSize(`${nameFontSize}px`)
			.setPosition(sv.posX, nameTagCenterY)
			.setOrigin(0.5, 0.5);
		sv.chipsText
			.setFontSize(`${chipsFontSize}px`)
			.setPosition(sv.posX, nameTagCenterY + nametagHalfH + chipsYGap * s)
			.setOrigin(0.5, 0);
	}

	// 與德州撲克的 setSeatTurnEffect 相同邏輯
	setSeatTurnEffect(sv, shouldActive) {
		if (shouldActive) {
			if (sv.turnActive) return;
			const frameHalfW =
				(sv.frameImg?.displayWidth || TURN_GLOW_OUTER_RADIUS * 2) / 2;
			const fxScale = (frameHalfW / TURN_GLOW_OUTER_RADIUS) * 0.75;
			sv.turnActive = true;
			sv.glowOuter
				.setVisible(true)
				.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * (this._s ?? 1))
				.setScale(fxScale)
				.setAlpha(1);
			// 頭像回合脈動發光（入座與觀戰皆相同，維持原本效果）
			sv.glowOuterTween = this.tweens.add({
				targets: sv.glowOuter,
				alpha: 0.65,
				scaleX: fxScale * 1.17,
				scaleY: fxScale * 1.17,
				duration: 900,
				ease: "Sine.InOut",
				yoyo: true,
				repeat: -1,
			});
			return;
		}

		if (!sv.turnActive) {
			sv.glowOuter.setVisible(false);
			return;
		}

		sv.turnActive = false;
		if (sv.glowOuterTween) {
			sv.glowOuterTween.remove();
			sv.glowOuterTween = null;
		}
		sv.glowOuter.setVisible(false).setScale(1).setAlpha(1);
	}

	_drawModal(cx, cy, s) {
		if (!this.modalPanelGfx) return;
		const pw = MODAL_W * s,
			ph = MODAL_H * s,
			cr = MODAL_CR * s;
		const l = cx - pw / 2,
			t = cy - ph / 2;
		this.modalBorderGfx.clear();
		drawEnhancedBorder(this.modalBorderGfx, l, t, pw, ph, cr);
		// 內面板：比照德州撲克彈窗——深紅漸層（0x680c15 → 0x170202）。疊在 drawEnhancedBorder
		// 之上，並用獨立圓角遮罩裁切，避免共用金框填滿在左右邊緣露出黑色/混濁重疊。
		this.modalPanelMaskGfx.clear();
		this.modalPanelMaskGfx.fillStyle(0xffffff);
		this.modalPanelMaskGfx.fillRoundedRect(l, t, pw, ph, cr);
		this.modalPanelGfx.clear();
		this.modalPanelGfx.fillGradientStyle(
			0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97,
		);
		this.modalPanelGfx.fillRect(l, t, pw, ph);
	}

	// 手局結束「是否繼續遊戲」選單（比照德州撲克 buildHandEndModal）：深紅漸層面板 + 金框 + 三顆按鈕。
	// 與金色的結算彈窗（_buildModal）視覺區分，且兩者不同時出現（選單於結算關閉後才顯示）。
	_buildHandEndMenu() {
		this.heMenuOverlay = this.add
			.rectangle(CX, CY, VIEW_W * 2, VIEW_H * 2, 0x000000, 0.6)
			.setDepth(HE_OVL_D)
			.setVisible(false)
			.setInteractive({ useHandCursor: false });
		this.heMenuPanelGfx = this.add
			.graphics()
			.setDepth(HE_PNL_D + 0.3)
			.setVisible(false); // 深紅漸層面板（_drawHandEndMenu 重畫）
		this.heMenuPanelMaskGfx = this.make.graphics({ add: false });
		this.heMenuPanelGfx.setMask(this.heMenuPanelMaskGfx.createGeometryMask());
		this.heMenuBorderGfx = this.add
			.graphics()
			.setDepth(HE_PNL_D)
			.setVisible(false); // 金框（在面板之下，露出外緣金邊）
		this.heMenuTitleLabel = this.add
			.image(CX, HE_TITLE_Y, "game_table", "title_label")
			.setOrigin(0.5)
			.setDisplaySize(320, 112)
			.setDepth(HE_PNL_D + 0.6)
			.setVisible(false);
		this.heMenuTitle = this.add
			.text(CX, HE_TITLE_Y + 8, "系統通知", {
				fontSize: "34px",
				color: "#f0c040",
				fontStyle: "bold",
				stroke: "#000000",
				strokeThickness: 1,
			})
			.setOrigin(0.5)
			.setDepth(HE_TXT_D)
			.setVisible(false);
		applyGoldTitleGradient(this.heMenuTitle);
		this.heMenuBody = this.add
			.text(CX, HE_BODY_Y, "親愛的玩家，是否繼續遊戲？", {
				fontSize: "26px",
				color: "#e8d2ad",
				align: "center",
			})
			.setOrigin(0.5)
			.setDepth(HE_TXT_D)
			.setVisible(false);
		const _btnStyle = { fontSize: "26px", color: "#fff8e0", fontStyle: "bold" };
		// 進入下局（綠）：送 hand_ready 提前確認續局並關閉選單（伺服器倒數結束本就會自動續局）。
		this.heMenuJoinBtn = createGradientButton(this, {
			x: HE_JOIN_X, y: HE_BTN_Y, width: HE_JOIN_W, height: HE_BTN_H,
			cornerRadius: 12, topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
			label: "進入下局", labelStyle: _btnStyle, depth: HE_TXT_D, visible: false,
			onClick: () => {
				this._playUiClick();
				this._heroPlayedCurrentHand = false;
				this._handConcluded = false;
				this._handReadySent = true; // 玩家親自確認續局；標記已送，避免 _refreshNextHandCountdown 重送
				this._setHandEndMenuVisible(false);
				this.app?.sendPacket?.("hand_ready", {});
			},
		});
		// 離座（藍）：送 stand_up（局間→伺服器應允許退座成觀戰）。
		this.heMenuStandBtn = createGradientButton(this, {
			x: HE_STAND_X, y: HE_BTN_Y, width: HE_ACT_W, height: HE_BTN_H,
			cornerRadius: 12, topColor: 0x1a5aaa, bottomColor: 0x0a2855, borderColor: 0x3d90f5,
			label: "離座", labelStyle: _btnStyle, depth: HE_TXT_D, visible: false,
			onClick: () => {
				this._playUiClick();
				this._heroPlayedCurrentHand = false;
				this._handConcluded = false;
				this._handReadySent = true; // 離座轉觀戰；封鎖 stand_up 過渡期間的自動 hand_ready，避免又被排入下一局
				this._setHandEndMenuVisible(false);
				this.app?.sendPacket?.("stand_up", {});
			},
		});
		// 結束（紅）：送 leave_room 離桌回大廳。
		this.heMenuExitBtn = createGradientButton(this, {
			x: HE_EXIT_X, y: HE_BTN_Y, width: HE_ACT_W, height: HE_BTN_H,
			cornerRadius: 12, topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
			label: "結束", labelStyle: _btnStyle, depth: HE_TXT_D, visible: false,
			onClick: () => {
				this._playUiClick();
				this._heroPlayedCurrentHand = false;
				this._handConcluded = false;
				this._handReadySent = true; // 離桌回大廳；封鎖 leave_room 過渡期間的自動 hand_ready
				this._setHandEndMenuVisible(false);
				this.app?.sendPacket?.("leave_room", {});
			},
		});
	}

	_setHandEndMenuVisible(v) {
		this._handEndMenuShown = v; // 供 _refreshRoomButtons 判斷：選單顯示中則隱藏獨立的離座/結束/換桌，避免重複「離座」
		if (v) this.heMenuOverlay?.setVisible(true).setInteractive();
		else this.heMenuOverlay?.setVisible(false).disableInteractive();
		this.heMenuPanelGfx?.setVisible(v);
		this.heMenuBorderGfx?.setVisible(v);
		this.heMenuTitleLabel?.setVisible(v);
		this.heMenuTitle?.setVisible(v);
		this.heMenuBody?.setVisible(v);
		this.heMenuJoinBtn?.setVisible(v);
		this.heMenuStandBtn?.setVisible(v);
		this.heMenuExitBtn?.setVisible(v);
	}

	// 手局結束（_handConcluded）到下一局發牌前：清空上一局的「牌面」，讓玩家一眼看出本局已結束、新局將開始。
	// 只負責「隱藏」，不負責顯示——一律於 renderState 末端與 ticker 尾端呼叫（最後執行），故不會與各 render
	// 函式搶畫面；每幀最終狀態正確。_handConcluded=false（下一局已發牌）時為 no-op，由發牌動畫/正常渲染接手。
	_hidePlaySurfaceIfHandEnded() {
		if (!this._handConcluded) return;
		// 僅入座玩家套用（配合手局結束選單）；觀戰維持既有牌面顯示邏輯（turnOnOccupiedSeat 等），不清空。
		if (this.state?.isSpectator) return;
		if (this.isResultOpen || this._handEndMenuEnd > Date.now()) return; // 結算彈窗/手局結束選單期間保留牌面（比照撲克：留到下一局才清）
		// 局末翻牌（攤牌）進行中：保留所有「牌面」——中央牌堆＋牌型標籤、對手牌背/翻出的牌、英雄自己的手牌——
		// 讓四家與中央一起呈現，待翻完（_revealAnimating 清除，結算 Modal 前）再一次清場。
		if (!this._revealAnimating) {
			// 中央牌堆（現任／後方暗化／飛入中）＋ 牌型標籤
			this.centerPlayImages?.forEach((i) => i?.setVisible(false));
			this.centerPrevImages?.forEach((i) => i?.setVisible(false));
			this._centerFlyImages?.forEach((i) => i?.setVisible(false));
			this.centerPlayShadow?.setVisible(false);
			this.centerLabel?.setVisible(false);
			this.centerByText?.setVisible(false); // 中央牌型字（如「單張」）＝實際顯示的標籤，須一併隱藏
			// 對手牌背縱列／橫列（四個非英雄位）
			this.seat0CardBackImages?.forEach((cb) => cb?.setVisible(false));
			this.seat1CardBackImages?.forEach((cb) => cb?.setVisible(false));
			this.seat3CardBackImages?.forEach((cb) => cb?.setVisible(false));
			this.heroCardBackImages?.forEach((cb) => cb?.setVisible(false));
			// 英雄剩餘手牌（輸家局末仍留有牌）
			this.heroCardImages?.forEach((c) => c?.setVisible(false));
		} else if (
			Number(this.state?.heroSeat ?? -1) >= 0 &&
			Number(this.state?.heroSeat ?? -1) === Number(this._resultWinnerSeat ?? -1)
		) {
			// 攤牌中但英雄自己就是贏家（0 張）：仍隱藏英雄手牌，避免殘留剛打出的最後一張（中央牌堆已正確顯示）。
			this.heroCardImages?.forEach((c) => c?.setVisible(false));
		}
		// 操作按鈕（過牌／出牌／選牌）＋ 退役漸層鈕 ＋ 牌型面板 —— 一律隱藏（不屬攤牌展示）
		this.btActionButtons &&
			Object.values(this.btActionButtons).forEach((b) => b?.setVisible(false));
		this.playBtn?.setVisible(false);
		this.passBtn?.setVisible(false);
		this.comboInfoText?.setVisible(false);
		this._closeComboModal?.();
	}

	// 深紅漸層面板 + 金框（比照德州撲克 0x680c15 → 0x170202）。每幀/resize 依縮放重畫。
	_drawHandEndMenu(cx, cy, s) {
		if (!this.heMenuPanelGfx) return;
		const pw = HE_W * s, ph = HE_H * s, cr = HE_CR * s;
		const l = cx - pw / 2, t = cy - ph / 2;
		this.heMenuBorderGfx.clear();
		drawEnhancedBorder(this.heMenuBorderGfx, l, t, pw, ph, cr);
		this.heMenuPanelMaskGfx.clear();
		this.heMenuPanelMaskGfx.fillStyle(0xffffff);
		this.heMenuPanelMaskGfx.fillRoundedRect(l, t, pw, ph, cr);
		this.heMenuPanelGfx.clear();
		this.heMenuPanelGfx.fillGradientStyle(
			0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97,
		);
		this.heMenuPanelGfx.fillRect(l, t, pw, ph);
	}

	// 現任中央牌：依牌數置中排列於 CENTER_PLAY_Y（不旋轉、在最前）。
	_drawCenterPlayShadow(count) {
		const shadow = this.centerPlayShadow;
		if (!shadow) return;
		shadow.clear();
		if (count <= 0) {
			shadow.setVisible(false);
			return;
		}
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const n = count;
		const w = CENTER_CARD_W * s,
			h = CENTER_CARD_H * s,
			r = CENTER_CARD_SHADOW_RADIUS * s;
		// 每張牌各自一個位移陰影（depth 9，在所有中央牌之後）；交疊時後張會蓋住前張的陰影，
		// 形成堆疊層次感（陰影主要露在各張的右／下緣）。位移／圓角由 CENTER_CARD_SHADOW_* 常數控制。
		const totalW = n * (CENTER_CARD_W + CENTER_CARD_GAP) - CENTER_CARD_GAP;
		const startX = CX - totalW / 2 + CENTER_CARD_W / 2; // 第 i 張牌中心 x（設計座標）
		const layers = [
			{ pad: 6, alpha: 0.1 },
			{ pad: 3, alpha: 0.14 },
			{ pad: 0, alpha: 0.22 },
		];
		for (let i = 0; i < n; i++) {
			const cx =
				ox +
				(startX + i * (CENTER_CARD_W + CENTER_CARD_GAP)) * s +
				CENTER_CARD_SHADOW_OFFSET_X * s;
			const cy = oy + CENTER_PLAY_Y * s + CENTER_CARD_SHADOW_OFFSET_Y * s;
			const x = cx - w / 2,
				y = cy - h / 2;
			// 三層低透明度輪廓模擬柔邊。
			layers.forEach(({ pad, alpha }) => {
				const p = pad * s;
				shadow.fillStyle(0x000000, alpha);
				shadow.fillRoundedRect(x - p, y - p, w + p * 2, h + p * 2, r + p);
			});
		}
		shadow.setVisible(true);
	}

	_positionCenterSet(images, count) {
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const n = count;
		if (n <= 0 || images.length !== n) {
			this._drawCenterPlayShadow(0);
			return;
		}
		this._drawCenterPlayShadow(n);
		const totalW = n * (CENTER_CARD_W + CENTER_CARD_GAP) - CENTER_CARD_GAP;
		const startX = CX - totalW / 2 + CENTER_CARD_W / 2;
		images.forEach((img, i) => {
			img
				.setPosition(
					ox + (startX + i * (CENTER_CARD_W + CENTER_CARD_GAP)) * s,
					oy + CENTER_PLAY_Y * s,
				)
				.setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
				.setRotation(0);
		});
	}

	// 後方暗化扇形：依 _prevCardBuf（最近 ≤PREV_MAX 張）重建一組扇形牌圖（樞紐在下、向上展開）。
	_layoutPrevFan() {
		this.centerPrevImages.forEach((i) => i.destroy());
		this.centerPrevImages = [];
		const buf = this._prevCardBuf;
		const n = buf.length;
		if (n === 0) return;
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const pivotX = CX,
			pivotY = CENTER_PLAY_Y + PREV_FAN_PIVOT_DY;
		buf.forEach((card, i) => {
			const key = normalizeCard(card);
			const texture = key ? "playing_cards_element" : "big_two_game_table";
			const frame = key || "card_back";
			const angleDeg =
				n > 1 ? -PREV_FAN_SPAN / 2 + (i * PREV_FAN_SPAN) / (n - 1) : 0;
			const ar = Phaser.Math.DegToRad(angleDeg);
			const cx = pivotX + PREV_FAN_RADIUS * Math.sin(ar);
			const cy = pivotY - PREV_FAN_RADIUS * Math.cos(ar);
			const img = this.add
				.image(ox + cx * s, oy + cy * s, texture, frame)
				.setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
				.setRotation(ar)
				.setTint(CENTER_PREV_TINT)
				.setDepth(CENTER_PREV_DEPTH + i * 0.01); // 後加入者略高，扇形右側壓左側
			this.centerPrevImages.push(img);
		});
	}

	_layoutCenterCards() {
		this._layoutPrevFan();
		this._positionCenterSet(this.centerPlayImages, this._curPlayCards.length);
	}

	_buildPreStartUI() {
		this.preStartText = this.add
			.text(CX, PRESTART_Y, "", {
				fontFamily: "sans-serif",
				fontSize: "28px",
				color: "#ffffff",
				fontStyle: "bold",
				stroke: "#000000",
				strokeThickness: 2,
				shadow: {
					offsetX: 0,
					offsetY: 2,
					color: "#000000",
					blur: 6,
					fill: true,
				},
			})
			.setOrigin(0.5)
			.setDepth(30)
			.setVisible(false);
	}

	_refreshJoinWaitText() {
		// 入座但本局尚未發牌（joined mid-hand）→ 在英雄座位顯示「等待中」徽章。
		// 沿用伺服器已送達的 heroJoinedWaiting；英雄被發牌（hand_start）後此旗標清除、徽章自動隱藏。
		// 必須是「真正入座」的英雄（非觀戰）。觀戰時 vi=0 只是被打包顯示的他家，不可掛徽章。
		const heroWaiting =
			!this.state?.isSpectator &&
			Number(this.state?.heroSeat ?? -1) >= 0 &&
			Boolean(this.state?.heroJoinedWaiting) &&
			(this.state?.bigTwoHeroCards?.length ?? 0) === 0;
		this.seatViews.forEach((sv) => {
			const show = Boolean(sv.isHero && heroWaiting);
			sv.waitingBadge?.setVisible(show);
			// 等待中暗化遮罩（與德州撲克 foldOverlay 相同）：目前僅英雄等待時顯示
			sv.avatarDimOverlay?.setVisible(show);
		});
	}

	_refreshNextHandCountdown() {
		const secs = this.state?.nextHandCountdownSeconds ?? 0;
		// 邊緣觸發起算：只在「收到新的一次 table_countdown（秒數值改變）」時重新起算倒數，而非 level-trigger。
		// 原因：store.nextHandCountdownSeconds 只由 hand_start／換桌／離座清 0，倒數到期並不會歸零；若伺服器
		// 送了 table_countdown 卻始終不發牌（例：2 名閒置玩家、未達開局條件），舊的 level-trigger（secs>0 且
		// end<=0 就補起算）會在每次到期後一再重置，造成「下一局 X 秒」無限迴圈、永遠不會真的開局。
		// 改為記住已據以起算的秒數值：同一個未歸零的值到期後不再重起算 → 迴圈被打斷，落到下方「等待開局中」退路。
		if (secs > 0 && secs !== this._countdownArmedForSecs) {
			this.nextHandCountdownEnd = Date.now() + secs * 1000;
			this._countdownArmedForSecs = secs;
		} else if (secs <= 0) {
			this._countdownArmedForSecs = 0; // store 歸零（hand_start 等）→ 下一次非零值視為全新倒數，可再起算
		}
		const isPlaying = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
		if (isPlaying) {
			this.preStartText?.setVisible(false);
			return;
		}
		// 入座（非觀戰）但本局尚未發牌（joined mid-hand）：改以座位「等待中」徽章呈現，隱藏中央等待文字避免重複
		if (
			!this.state?.isSpectator &&
			Number(this.state?.heroSeat ?? -1) >= 0 &&
			this.state?.heroJoinedWaiting
		) {
			this.preStartText?.setVisible(false);
			return;
		}
		const seatedCount = Array.isArray(this.state?.table?.players)
			? this.state.table.players.length
			: 0;
		if (seatedCount < BIG_TWO_MIN_PLAYERS) {
			this.nextHandCountdownEnd = 0;
			this.preStartText?.setText("等待足數玩家開局").setVisible(true);
			return;
		}
		const seated =
			!this.state?.isSpectator && Number(this.state?.heroSeat ?? -1) >= 0;
		// 入座且等待下一局：有打這局的玩家 → 交由手局結束選單讓玩家自行決定（進入下局／離座／結束），
		// 不再立即自動送 hand_ready；待玩家點「進入下局」或選單視窗即將到期（安全補送）才送，避免無人操作卡住整桌。
		// 未打這局的入座玩家（等待入座下一局、無選單）→ 維持立即送出。
		// 安全補送時機（比照 WS 規格 §6.12「大老二在 hand_end 後開啟 ready window，時間到未確認則伺服器自動續局」）：
		// ready window 為 [hand_end, 後續 table_countdown) ≈ hand_end.next_event_in（~8s），即本地 _handEndMenuEnd。
		// 於視窗到期「前」HE_READY_AUTOSEND_LEAD_MS 補送，使 hand_ready 落在 window 之內、而非邊界或發牌之後
		// （後者會被以 ready_window_not_open／ready_window_expired 退回）。結算彈窗開啟期間不送。
		const menuDecides = seated && this._heroPlayedCurrentHand;
		const menuWindowAboutToClose =
			!this.isResultOpen &&
			this._handEndMenuEnd > 0 &&
			this._handEndMenuEnd - HE_READY_AUTOSEND_LEAD_MS <= Date.now();
		const shouldAutoSend = !menuDecides || menuWindowAboutToClose;
		if (seated && !this._handReadySent && shouldAutoSend) {
			this._handReadySent = true;
			this.app?.sendPacket?.("hand_ready", {});
		}
		if (menuDecides) {
			this.preStartText?.setVisible(false); // 中央倒數改由手局結束選單呈現
			return;
		}
		const secsLeft =
			this.nextHandCountdownEnd > 0
				? Math.max(
						0,
						Math.ceil((this.nextHandCountdownEnd - Date.now()) / 1000),
					)
				: 0;
		if (secsLeft > 0) {
			this.preStartText?.setText(`下一局  ${secsLeft} 秒`).setVisible(true);
		} else {
			this.nextHandCountdownEnd = 0;
			if (this.state?.isSpectator) {
				// 觀戰：人數已足但無進行中的牌局（目前回合未落在有玩家座位）→「等待開局中」；
				// 牌局進行中（回合在有玩家座位）→ 隱藏，避免文字蓋住中央牌面。
				const sps = Array.isArray(this.state?.table?.players)
					? this.state.table.players
					: [];
				let sTurn = Number(this.state?.table?.current_turn_seat ?? -1);
				if (!(sTurn >= 0))
					sTurn = Number(this.state?.table?.play_state?.current_seat ?? -1);
				const handInProgress =
					sTurn >= 0 && sps.some((p) => Number(p.seat) === sTurn);
				if (handInProgress) {
					this.preStartText?.setVisible(false);
				} else {
					this.preStartText?.setText("等待開局中").setVisible(true);
				}
			} else {
				this.preStartText?.setText("等待其他玩家確認中").setVisible(true);
			}
		}
	}

	// 每幀更新：只負責回合倒數圓環的平滑遞減（與德州撲克相同——以牆鐘時間每幀重畫，
	// 而非每 120ms tick 才畫，避免掃描弧一格一格跳）。非計時回合時 _refreshTurnRing 會快速返回。
	update() {
		this._refreshTurnRing();
	}

	// ─── RENDER ───────────────────────────────────────────────────────

	renderState() {
		if (!this.state) return;
		// 結算彈窗殘留偵測：換桌（含觀戰自動換桌）或觀戰下一局開始時，立即關閉殘留彈窗，
		// 避免上一桌/上一局的結算蓋在新桌/下一局上數秒。
		if (this.isResultOpen) {
			const t = this.state?.table;
			const curTid = t?.table_id ?? null;
			const tableSwitched =
				this._resultTableId != null &&
				curTid != null &&
				curTid !== this._resultTableId;
			// 下一局開始（hand_id 變動）→ 僅觀戰時關閉；入座玩家保留既有 6 秒倒數與手局結束選單流程。
			const curHid = t?.hand_id ?? null;
			// 下一局開始（hand_id 變動）：入座與觀戰皆關閉殘留結算彈窗（比照撲克 — 結算牌面留到下一局才清）。
			const nextHandStarted =
				this._resultHandId != null &&
				curHid != null &&
				curHid !== this._resultHandId;
			if (tableSwitched || nextHandStarted) {
				this._closeModal();
			}
		}
		this._renderSeats();
		this._renderActionUI();
		this._renderCountdown();
		this._checkHeroCards();
		this._checkLastPlay();
		this._checkHandResult();
		this._checkRoundEnd();
		this._checkPassSound();
		this._checkHeroSeatSound();
		this._refreshJoinWaitText();
		this._refreshNextHandCountdown();
		this._refreshRoomButtons();
		this._refreshHandEndMenu();
		this._hidePlaySurfaceIfHandEnded(); // 末端執行：本局結束後清空牌面（見函式註解）
	}

	// 結束/換桌/離座的顯示邏輯：
	// - 已承諾入局（座位上且手上有牌＝本局進行中）→ 全部隱藏，避免中途離桌/換桌/離座。
	// - 「即將開局」（已入座、手上無牌、非半局加入、且人數已足）→ 中央顯示「等待其他玩家確認中」或
	//   「下一局 X 秒」，牌局即將開始、視同已承諾 → 三鈕全藏。
	// - 入座但人數不足（中央「等待足數玩家開局」）→ 桌面閒置、無法開局 → 顯示離座/離桌/換桌。
	// - 半局加入等待中（heroJoinedWaiting，中央「等待中」徽章）→ 別家牌局進行中，保留離桌/換桌作退路；
	//   離座必被伺服器拒（「目前不能退座成觀戰」）故隱藏。
	// - 觀戰 → 沿用離桌/換桌（既有行為）。
	// 註：先前以 seatedCount>=MIN 即視為 committed 會在「等待中」也全藏；故 committed 僅看「手上有牌」，
	//     另用 aboutToStart 專門涵蓋「即將開局」（確認中／倒數中）兩態。
	_refreshRoomButtons() {
		const isSpectator = Boolean(this.state?.isSpectator);
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const seated = !isSpectator && heroSeat >= 0;
		// 「本局進行中」＝手上有牌且尚未結算。本局已結算（_handConcluded，結算彈窗開啟時設定）後，
		// 敗方玩家的 bigTwoHeroCards 要到下一局 hand_start 才清空，若仍視為 inActiveHand 會在局間一路把
		// 離座/結束/換桌都藏起來；故以 !_handConcluded 收斂，讓局間（結算彈窗關閉後）可顯示離座。
		const inActiveHand =
			(this.state?.bigTwoHeroCards?.length ?? 0) > 0 && !this._handConcluded;
		const heroJoinedWaiting = Boolean(this.state?.heroJoinedWaiting);
		const seatedCount = Array.isArray(this.state?.table?.players)
			? this.state.table.players.length
			: 0;
		const committed = seated && inActiveHand;
		// 即將開局：已入座、手上無牌、非半局加入、且人數已足。涵蓋中央「等待其他玩家確認中」與
		// 「下一局 X 秒」兩種狀態（兩者皆要求 seatedCount>=MIN）。此時牌局即將開始 → 隱藏離桌/換桌。
		const aboutToStart =
			seated &&
			!inActiveHand &&
			!heroJoinedWaiting &&
			seatedCount >= BIG_TWO_MIN_PLAYERS;
		// 座位是否已滿（4 席全入座）。未滿＝仍有空位、尚未真正「鎖定入局」。
		const tableFull = seatedCount >= SEAT_POS.length;
		// 手局結束選單顯示中：選單本身已含 進入下局／離座／結束，故隱藏獨立的離座/結束/換桌，避免重複「離座」。
		const menuShown = Boolean(this._handEndMenuShown);
		const roomBtnsVisible = !committed && !aboutToStart && !menuShown; // 結束/換桌是否顯示
		this.exitBtn?.setVisible(roomBtnsVisible);
		this.changeTableBtn?.setVisible(roomBtnsVisible);
		// 離座（stand_up）：只要「入座、手上無牌、非半局加入、且座位尚未滿」就顯示——桌上仍有空位時
		// 玩家尚未真正鎖定入局，應可退座（即使已達開局人數、甚至「下一局 X 秒」倒數中，只要沒坐滿）。
		// 座位坐滿（4 人）時才視為已承諾、隱藏。heroJoinedWaiting（半局加入）退座必被伺服器拒，故排除。
		this.standUpBtn?.setVisible(
			seated && !inActiveHand && !heroJoinedWaiting && !tableFull && !menuShown,
		);
		// 動態格位：離座單獨顯示（結束/換桌隱藏）時移到最上格（＝結束鈕位置），避免孤零零懸在下方；
		// 若結束/換桌也在（人數不足時三鈕同列）則維持第三格，避免重疊。每幀依目前縮放/位移重定位。
		this._standUpBaseY = roomBtnsVisible ? STAND_UP_Y : EXIT_Y;
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		this.standUpBtn?.setPosition(
			ox + STAND_UP_X * s,
			oy + this._standUpBaseY * s,
		);
	}

	// 手局結束「是否繼續遊戲」選單顯示邏輯（比照德州撲克 refreshHandEndMenu，改用大老二可得狀態）。
	// 條件：本局剛結束（英雄手上無牌）、英雄有打這局（_heroPlayedCurrentHand）、結算彈窗已關、
	// 非半局加入、且選單視窗尚未逾時。進入下局鈕顯示剩餘秒數。
	// 視窗來源：以 hand_end 事件邊緣（store.handEndSeq）＋伺服器 `hand_end.next_event_in`
	// （→ store `handEndNextEventIn`，實機已送 ~8s）於本函式起算（比照撲克 refreshHandEndMenu）。
	// 下一局發牌（手上有牌）即自動關閉。
	// 註：續局預設由伺服器自動進行（_refreshNextHandCountdown 仍會自動送 hand_ready）；本選單為
	//     「額外提供 離座/結束 的局間出口」，不阻擋預設續局；下一局發牌（手上有牌）即自動關閉。
	_refreshHandEndMenu() {
		// 視窗起算改為比照德州撲克 refreshHandEndMenu：以 hand_end 事件邊緣（store.handEndSeq 跳號）為觸發，
		// 直接採用伺服器 next_event_in（store.handEndNextEventIn，實機 ~8s）。不再於 _closeModal 以「結算彈窗
		// 關閉時刻（hand_result + 6s）」讀取——彼時 hand_end 常尚未到達（實測晚 ~1s），讀到 0 會退回固定 12s
		// 猜測值，使安全補送 hand_ready 落在伺服器發牌之後，被以 ready_window_not_open 退回。
		// 邊緣觸發 + nextEventIn>0 守衛：只在收到 hand_end 當下起算一次，值到達前不起算（不再有 12s 退路）。
		const seq = this.state?.handEndSeq ?? 0;
		const nextEventIn = Number(this.state?.handEndNextEventIn ?? 0);
		if (seq !== this._handEndMenuSeq && nextEventIn > 0) {
			this._handEndMenuSeq = seq;
			this._handEndMenuEnd = Date.now() + nextEventIn * 1000;
		}
		// 手局結束「是否繼續遊戲」選單：於結算彈窗關閉後顯示（視窗已於上方隨 hand_end 到達起算）。
		// _handConcluded 由 _showModal 設定（真事件與快照重建皆適用，不再依賴 hand_result 版本）。
		const isSpectator = Boolean(this.state?.isSpectator);
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const seated = !isSpectator && heroSeat >= 0;
		const heroJoinedWaiting = Boolean(this.state?.heroJoinedWaiting);
		const endAt = this._handEndMenuEnd;
		const secsLeft =
			endAt > 0 && endAt > Date.now()
				? Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
				: 0;
		const show =
			seated &&
			this._heroPlayedCurrentHand &&
			this._handConcluded &&
			!heroJoinedWaiting &&
			!this.isResultOpen &&
			!this._revealAnimating &&
			!this._btWinGlowActive &&
			secsLeft > 0;
		if (!show) {
			this._setHandEndMenuVisible(false);
			return;
		}
		this.preStartText?.setVisible(false);
		this.heMenuJoinBtn?.setLabel(`進入下局(${secsLeft})`);
		// 下一手 ready window 進度（來自通用 hand_ready_state / hand_ready_ack）：尚未全員就緒時，於選單顯示
		// 「已準備 n/m」。無資料或已全員就緒 → 顯示預設提示。（store.handReadyState 為新增欄位、撲克不受影響。）
		const rs = this.state?.handReadyState;
		const req = Number(rs?.required_count ?? 0);
		const rdy = Number(rs?.ready_count ?? 0);
		this.heMenuBody?.setText(
			req > 0 && !rs?.all_ready
				? `親愛的玩家，是否繼續遊戲？\n（已準備 ${rdy}/${req}）`
				: "親愛的玩家，是否繼續遊戲？",
		);
		this._setHandEndMenuVisible(true);
	}

	_renderSeats() {
		const table = this.state?.table;
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const players = Array.isArray(table?.players) ? table.players : [];
		// 目前出牌玩家：current_turn_seat 在觀戰時可能為 null/-1，改用 play_state.current_seat 補上，
		// 讓回合高亮（頭像/名牌呼吸光）能標示目前換誰出牌。（倒數秒數需 started/deadline，觀戰時伺服器未提供，故不顯示。）
		let turnSeat = Number(table?.current_turn_seat ?? -1);
		if (!(turnSeat >= 0))
			turnSeat = Number(table?.play_state?.current_seat ?? -1);
		// 牌局是否真的在進行：目前回合必須落在「有玩家的座位」上。若目前回合指向空位（例如玩家中途離桌、
		// 換桌殘留），則視為未在進行 → 觀戰時不顯示對手牌列/中央，避免「未開局卻顯示牌」。
		const turnOnOccupiedSeat =
			turnSeat >= 0 && players.some((p) => Number(p.seat) === turnSeat);

		this.seatViews.forEach((sv, vi) => {
			const seat = this._seatForView(vi, heroSeat, players);
			sv.displaySeat = seat;
			const player =
				seat !== null ? players.find((p) => Number(p.seat) === seat) : null;

			if (!player) {
				this.setSeatTurnEffect(sv, false);
				if (sv.nametagBreathTween) {
					sv.nametagBreathTween.remove();
					sv.nametagBreathTween = null;
				}
				[
					sv.avatarBg,
					sv.avatarImg,
					sv.frameImg,
					sv.nametagGlow,
					sv.nametagImg,
					sv.nameText,
					sv.chipsText,
					sv.cardCountBadge,
				].forEach((o) => o?.setVisible(false));
				sv.nametagGlow?.setAlpha(0);
				if (vi === 0)
					this.seat0CardBackImages?.forEach((cb) => cb.setVisible(false));
				if (vi === 1)
					this.seat1CardBackImages?.forEach((cb) => cb.setVisible(false));
				if (vi === 2)
					this.heroCardBackImages?.forEach((cb) => cb.setVisible(false));
				if (vi === 3)
					this.seat3CardBackImages?.forEach((cb) => cb.setVisible(false));
				sv.cardCountBadgeBg?.setVisible(false);
				sv.cdBg?.setVisible(false);
				sv.cdText?.setVisible(false);
				sv.sitPromptBg.setVisible(true);
				sv.sitPromptCircle.setVisible(true);
				sv.sitPromptPlus.setVisible(true);
				sv.sitPromptLabel.setVisible(true);
				// 觀戰者可點空位入座（take_seat）；其餘狀態不可點
				sv.sitPromptBg.off("pointerdown");
				if (this.state?.isSpectator && sv.displaySeat != null) {
					const seatToTake = Number(sv.displaySeat);
					sv.sitPromptBg.setInteractive(
						new Phaser.Geom.Circle(0, 0, sv.sitPromptBgRadius),
						Phaser.Geom.Circle.Contains,
					);
					sv.sitPromptBg.input.cursor = "pointer";
					sv.sitPromptBg.once("pointerdown", () => {
						this._playUiClick();
						this.app?.sendPacket?.("take_seat", { seat: seatToTake });
					});
				} else {
					sv.sitPromptBg.disableInteractive();
				}
				return;
			}

			sv.sitPromptBg.setVisible(false);
			sv.sitPromptCircle.setVisible(false);
			sv.sitPromptPlus.setVisible(false);
			sv.sitPromptLabel.setVisible(false);

			// 頭像
			const av = avatarFrame(player.avatar || player.avatar_id || "1");
			sv.avatarBg.setVisible(true);
			sv.avatarImg.setTexture("avatar_element", av).setVisible(true);
			sv.frameImg.setVisible(true);

			// 回合提示：有伺服器計時資料（入座）→ 用撲克式倒數圓環（由 _refreshTurnRing 每 tick 重畫），
			// 此時隱藏頭像發光；無計時資料（觀戰）→ 退而用頭像脈動發光標示輪到誰。
			// DEBUG（暫時停用）：關閉「無計時圓環時的頭像脈動發光」回合高亮（即圓環倒數的退路 fallback）。
			//   還原方式：取消下面三行的註解、並刪除最後一行的 setSeatTurnEffect(sv, false)。
			// const isTurn = seat === turnSeat;
			// const hasTurnTiming = Number(table?.current_turn_timeout ?? 0) > 0;
			// this.setSeatTurnEffect(sv, isTurn && !hasTurnTiming);
			this.setSeatTurnEffect(sv, false); // DEBUG：強制關閉回合高亮脈動發光（fallback）
			// 名字牌發光一律停用（回合提示改用圓環 / 頭像發光）
			if (sv.nametagBreathTween) {
				sv.nametagBreathTween.remove();
				sv.nametagBreathTween = null;
			}
			sv.nametagGlow?.setVisible(false).setAlpha(0);

			// 名字牌
			const rawName = String(
				player.username ?? player.name ?? player.nickname ?? "",
			);
			const name =
				rawName.length > 4 ? rawName.slice(0, 4) : rawName || `玩家${seat}`;
			sv.nametagImg.setVisible(true);
			sv.nameText.setText(name).setVisible(true);
			// 先還原 base 字體，再做 overflow / CJK 調整（與德州撲克相同）
			const _s = this._s ?? 1;
			const _basePx = Math.round(32 * (sv.isHero ? 0.8 : 0.65) * _s);
			sv.nameText.setFontSize(`${_basePx}px`);
			const _ntW = sv.nametagImg.displayWidth;
			const _maxW = _ntW * 0.82;
			if (_maxW > 0 && sv.nameText.width > _maxW) {
				const _curPx = parseInt(sv.nameText.style.fontSize, 10);
				sv.nameText.setFontSize(
					`${Math.max(12, Math.floor((_curPx * _maxW) / sv.nameText.width))}px`,
				);
			}
			if (/[一-鿿㐀-䶿]/.test(sv.nameText.text)) {
				sv.nameText.setFontSize(
					`${Math.max(12, parseInt(sv.nameText.style.fontSize, 10) - 4)}px`,
				);
			}
			sv.chipsText.setText(fmt(player.chips ?? 0)).setVisible(true);

			// 三個對手牌背縱列：與扇形牌背相同的顯示規則
			const sideCol =
				vi === 1
					? this.seat1CardBackImages
					: vi === 2
						? this.heroCardBackImages // 上方中央對手
						: vi === 3
							? this.seat3CardBackImages
							: // 觀戰時底部玩家（vi 0）才顯示水平牌背列；座上時 vi 0 為英雄（正面手牌），維持 null
								vi === 0 && this.state?.isSpectator
								? this.seat0CardBackImages
								: null;
			if (sideCol?.length) {
				const rem = Number(
					player.hand_count ?? player.remaining_count ?? player.hole_count ?? 0,
				);
				const heroHasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
				const newDealPending =
					Number(this.state?.bigTwoHeroCardsVersion ?? 0) >
					this.lastHeroCardsVer;
				if ((this._dealAnimating || newDealPending) && rem >= 13) {
					// 發牌揭示中且該家仍為滿手 → 不動，交給發牌動畫逐張亮出。
					// 一旦該家已出牌（rem<13），即使動畫旗標殘留也即時反映剩餘張數，避免縱列卡在 13。
				} else if (
					heroHasCards ||
					(this.state?.isSpectator &&
						rem > 0 &&
						player.in_hand &&
						turnOnOccupiedSeat)
				) {
					// 顯示牌背縱列的情況：入座且在本局中（heroHasCards），或觀戰中且「牌局確實在進行」（目前回合落在有玩家的座位）
					// 且該家在本局內（in_hand）且持牌（rem>0）。回合指向空位（卡局/換桌殘留）或該家未在局內 → 不顯示。
					// rem=0：本局已結束（贏家出完）→ 0 張，避免局末殘留 13 張牌背（尤其翻牌期間清場被抑制時）；
					// 尚未開局（發牌前佔位）→ 維持 13 張。
					const show = rem > 0 ? Math.min(rem, 13) : this._handConcluded ? 0 : 13;
					sideCol.forEach((cb, c) => cb.setVisible(c < show));
					// 四邊牌背列每幀「歸位＋重設尺寸」：牌背精靈的位置／縮放平常只由 applyLayout（僅 resize）設定，
					// 但翻牌動畫 _flipCardReveal 會改 scaleX（翻面），一旦翻牌被新局/清場打斷，scaleX 會卡在中間值
					// （如 0.19），該張牌就變窄→看起來忽緊忽鬆有缺口；且 _resetRevealedBacks 只還原貼圖/位置、不還原縮放。
					// 因此每幀依 _sideColCardPos 歸位並 setDisplaySize 重設回標準牌背尺寸，讓四邊都自癒（等同 applyLayout 但每幀）。
					// 翻牌進行中（_revealAnimating）跳過，避免蓋掉翻牌 scaleX 動畫與左右列的攤開位移。
					if (!this._revealAnimating) {
						const s = this._s ?? 1;
						sideCol.forEach((cb, c) => {
							if (c < show) {
								const pos = this._sideColCardPos(vi, c);
								cb.setPosition(pos.x, pos.y).setDisplaySize(
									SIDE_BACK_CARD_W * s,
									SIDE_BACK_CARD_H * s,
								);
							}
						});
					}
				} else if (!this._revealAnimating) {
					// 局末翻牌進行中不隱藏，讓翻出的牌面留在畫面（翻完 _revealAnimating 清除後再隱藏）。
					sideCol.forEach((cb) => cb.setVisible(false));
				}
			}
			// 座上英雄（vi 0 非觀戰）：底部水平牌背列隱藏（英雄顯示正面手牌）；張數徽章改顯示於頭像左側（紅框位置）。
			if (vi === 0 && !this.state?.isSpectator) {
				this.seat0CardBackImages?.forEach((cb) => cb.setVisible(false));
				const heroRem = Number(this.state?.bigTwoHeroCards?.length ?? 0);
				const showHeroBadge = heroRem > 0 && !this._handConcluded; // 本局進行中才顯示
				sv.cardCountBadge?.setText(`${heroRem}張`).setVisible(showHeroBadge);
				sv.cardCountBadgeBg?.setVisible(showHeroBadge);
			}

			// 扇形牌背已由縱列取代：永遠隱藏，只保留剩餘牌數徽章（觀戰時底部 vi 0 也顯示）
			if (!sv.isHero || this.state?.isSpectator) {
				const rem = Number(
					player.hand_count ?? player.remaining_count ?? player.hole_count ?? 0,
				);
				const heroHasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
				const newDealPending =
					Number(this.state?.bigTwoHeroCardsVersion ?? 0) >
					this.lastHeroCardsVer;
				// 已出完的玩家：本局進行中即時顯示名次（🏆 第1，其餘 2/3/4，金色）。
				// 注意：play_state.finished_seats 可能含「尚未出完」者（陳舊/預填），不可直接當名次用。
				// 僅取「真的 0 張」者，依 finished_seats 既有順序排名，避免把手上有牌的玩家標成已出完。
				const finishedSeats = Array.isArray(table?.play_state?.finished_seats)
					? table.play_state.finished_seats
					: [];
				const finishedOrder = finishedSeats.filter((fs) => {
					const fp = players.find((pp) => Number(pp.seat) === Number(fs));
					return (
						fp &&
						Number(
							fp.hand_count ?? fp.remaining_count ?? fp.hole_count ?? 0,
						) === 0
					);
				});
				const finishRank = finishedOrder.indexOf(seat) + 1; // 0 = 未出完
				if (finishRank > 0 && rem === 0 && turnOnOccupiedSeat) {
					sv.cardCountBadge
						.setText(finishRank === 1 ? "🏆" : `${finishRank}`)
						.setColor("#f0c040")
						.setVisible(true);
					sv.cardCountBadgeBg?.setVisible(true);
				} else if (
					// 與牌背縱列一致：入座在局中（heroHasCards），或觀戰中且該家正在本局內（in_hand）才顯示張數徽章
					rem > 0 &&
					!newDealPending &&
					(heroHasCards ||
						(this.state?.isSpectator && player.in_hand && turnOnOccupiedSeat))
				) {
					sv.cardCountBadge
						.setText(`${rem}張`)
						.setColor("#ffffff")
						.setVisible(true);
					sv.cardCountBadgeBg?.setVisible(true);
				} else {
					sv.cardCountBadge.setVisible(false);
					sv.cardCountBadgeBg?.setVisible(false);
				}
			}
		});
		this._positionCountBadges(); // 徽章貼齊側邊牌堆（觀戰與入座皆然；隨張數變動每次重定位）
	}

	// 對手牌背縱列：view index → 該縱列圖片陣列
	_sideColForView(vi) {
		return vi === 0
			? this.seat0CardBackImages
			: vi === 1
				? this.seat1CardBackImages
				: vi === 2
					? this.heroCardBackImages
					: vi === 3
						? this.seat3CardBackImages
						: null;
	}

	// 對手牌背縱列：第 i 張卡的位置與角度（applyLayout 與發牌動畫共用，確保落點一致）
	_sideColCardPos(vi, i) {
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const sc = (lx, ly) => ({ x: ox + lx * s, y: oy + ly * s });
		if (vi === 0) {
			// 觀戰：底部玩家水平牌背列，依「目前張數」置中於 CX、位於頭像與籌碼數字下方（少牌時不偏左）
			const ps = Array.isArray(this.state?.table?.players)
				? this.state.table.players
				: [];
			const seat0 = this._seatForView(
				0,
				Number(this.state?.heroSeat ?? -1),
				ps,
			);
			const p0 = ps.find((pl) => Number(pl.seat) === seat0);
			const hc = Number(
				p0?.hand_count ?? p0?.remaining_count ?? p0?.hole_count ?? 0,
			);
			const n = hc > 0 ? Math.min(hc, 13) : 13;
			const rowSpan = (n - 1) * HERO_BACK_GAP;
			const p = sc(
				CX - rowSpan / 2 + i * HERO_BACK_GAP,
				SEAT_POS[0].y + SEAT0_ROW_Y_OFFSET,
			);
			return { x: p.x, y: p.y, angle: 0 };
		}
		if (vi === 2) {
			const base = sc(SEAT_POS[2].x, SEAT_POS[2].y + AVATAR_Y_OFFSET);
			return {
				x: base.x + (HERO_BACK_X_OFFSET + i * HERO_BACK_GAP) * s,
				y: base.y,
				angle: 0,
			};
		}
		if (vi === 1) {
			const p = sc(
				SEAT_POS[1].x + SIDE_COL_OUT_OFFSET,
				SEAT_POS[1].y + SIDE_BACK_Y_OFFSET + i * SIDE_BACK_GAP_Y,
			);
			return { x: p.x, y: p.y, angle: -Math.PI / 2 };
		}
		if (vi === 3) {
			// 左下座位頭像較大（透視縮放），需多上移一些避免牌列底部貼到頭像
			const p = sc(
				SEAT_POS[3].x - SIDE_COL_OUT_OFFSET,
				SEAT_POS[3].y -
					SIDE_BACK_Y_OFFSET -
					SEAT3_COL_UP_EXTRA -
					i * SIDE_BACK_GAP_Y,
			);
			return { x: p.x, y: p.y, angle: Math.PI / 2 };
		}
		return null;
	}

	// 觀戰時張數徽章的位置（貼齊各家側邊牌堆，而非入座扇形角落）：
	// vi0 底部列→列上方置中；vi2 頂部列→列下方置中；vi1 右列→列底下方；vi3 左列→列底下方。
	_sideColBadgePos(vi, n) {
		const s = this._s ?? 1;
		const ox = this._ox ?? 0;
		const off = (SIDE_BACK_CARD_H / 2 + BADGE_H / 2 + 4) * s; // 牌邊到徽章中心的間距
		if (vi === 0) {
			if (!this.state?.isSpectator) {
				// 座上英雄（play mode）：徽章移到頭像左側（紅框位置），顯示自己的手牌張數。
				const oy = this._oy ?? 0;
				return {
					x: ox + (SEAT_POS[0].x + HERO_BADGE_DX) * s,
					y: oy + (SEAT_POS[0].y + AVATAR_Y_OFFSET + HERO_BADGE_DY) * s,
				};
			}
			// 觀戰底部中央家：膠囊較高；置中、移到牌列「下方」（避免壓到該家名字/籌碼）
			const c = this._sideColCardPos(0, 0);
			const offHero = (SIDE_BACK_CARD_H / 2 + BADGE_H_HERO / 2 + 8) * s;
			return { x: ox + CX * s, y: c.y + offHero };
		}
		if (vi === 2) {
			// 頂部水平列：置中、位於牌列下方（朝桌中）—— 維持
			const mid = this._sideColCardPos(2, Math.floor((n - 1) / 2));
			return { x: mid.x, y: mid.y + off };
		}
		const innerOff = (SIDE_BACK_CARD_W / 2 + BADGE_W / 2 + 2) * s; // 縱列到徽章中心的水平間距
		if (vi === 1) {
			// 右側縱列：徽章移到縱列「左側」（朝桌中），垂直置中於該列，避開玩家籌碼
			const mid = this._sideColCardPos(1, Math.floor((n - 1) / 2));
			return { x: mid.x - innerOff, y: mid.y };
		}
		if (vi === 3) {
			// 左側縱列：徽章移到縱列「右側」（朝桌中），垂直置中於該列，避開玩家籌碼
			const mid = this._sideColCardPos(3, Math.floor((n - 1) / 2));
			return { x: mid.x + innerOff, y: mid.y };
		}
		return null;
	}

	// 將張數徽章（文字＋膠囊背景）定位到各家側邊牌堆旁。觀戰與入座皆適用：
	// 對手牌背一律以側邊縱列/橫列呈現，故徽章都依牌堆定位；入座時底部英雄徽章本就隱藏（無妨）。
	_positionCountBadges() {
		const players = Array.isArray(this.state?.table?.players)
			? this.state.table.players
			: [];
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		this.seatViews.forEach((sv, vi) => {
			const seatNum = this._seatForView(vi, heroSeat, players);
			const pl = players.find((p) => Number(p.seat) === seatNum);
			const rem = Number(
				pl?.hand_count ?? pl?.remaining_count ?? pl?.hole_count ?? 0,
			);
			const n = rem > 0 ? Math.min(rem, 13) : 1;
			const pos = this._sideColBadgePos(vi, n);
			if (!pos) return;
			sv.cardCountBadge?.setPosition(pos.x, pos.y);
			sv.cardCountBadgeBg?.setPosition(pos.x, pos.y);
		});
	}

	_seatForView(vi, heroSeat, players) {
		const seats = players.map((p) => Number(p.seat)).sort((a, b) => a - b);
		// 已入座英雄：維持原本旋轉（英雄置底），空位回傳 null（座上玩家不需 take_seat）
		if (heroSeat >= 0 && seats.includes(heroSeat)) {
			if (seats.length === 0) return null;
			if (vi >= seats.length) return null;
			const hi = seats.indexOf(heroSeat);
			return seats[(hi + vi) % seats.length] ?? null;
		}
		// 觀戰 / 未入座：佔位玩家照原本 packed 排序（seats[vi]）；
		// 空位接在後面（依座號），讓空位也有座號可入座（take_seat）。
		if (vi < seats.length) return seats[vi];
		const empty = [0, 1, 2, 3].filter((s) => !seats.includes(s)); // 已升序
		return empty[vi - seats.length] ?? null;
	}

	_renderActionUI() {
		// 觀戰：隱藏所有操作 UI，顯示「請選位坐下」提示
		if (this.state?.isSpectator) {
			this.btActionButtons &&
				Object.values(this.btActionButtons).forEach((b) =>
					b?.setVisible(false),
				);
			this.playBtn?.setVisible(false);
			this.passBtn?.setVisible(false);
			this.comboInfoText?.setVisible(false);
			this.spectatorSitHint?.setVisible(true);
			return;
		}
		this.spectatorSitHint?.setVisible(false);

		const ar = this.state?.actionRequest;
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const turnSeat = Number(this.state?.table?.current_turn_seat ?? -1);
		const isMyTurn = heroSeat >= 0 && heroSeat === turnSeat;
		const hasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;

		let canPlay, canPass;
		if (ar && Array.isArray(ar.allowed) && ar.allowed.length > 0) {
			// 服务器明确告知可执行操作
			canPlay = ar.allowed.some((a) => a === "play_cards" || a === "play");
			canPass = ar.allowed.includes("pass");
		} else if (isMyTurn && hasCards) {
			// 服务器只发 turn 包没发 action_request，默认两个按钮都显示
			canPlay = true;
			canPass = true;
		} else {
			canPlay = false;
			canPass = false;
		}

		// 發牌動畫進行中（初次發牌 ~1.4–2.4s）視為「尚未可操作」：語音與按鈕先壓住，等發牌完成再一起出現。
		// （_dealAnimation 的 totalMs 回呼會在發完牌時再呼叫一次 _renderActionUI，屆時 dealing=false 才觸發。）
		// 注意：_renderActionUI 在 renderState 中早於 _checkHeroCards 執行，故發牌起始那一幀 _dealAnimating 尚未設起；
		// 用 newDealPending（手牌版本已跳、_checkHeroCards 尚未消化）補上，避免起始幀漏壓、語音提前播。
		const newDealPending =
			Number(this.state?.bigTwoHeroCardsVersion ?? 0) > this.lastHeroCardsVer;
		const dealing = Boolean(this._dealAnimating) || newDealPending;
		// 英雄回合開始（可出牌、且非發牌中）→ 播一次出牌語音；用旗標做邊緣偵測避免每幀重播。
		if (canPlay && !dealing && !this._btTurnPromptActive) {
			this._btTurnPromptActive = true;
			// 跟牌且手上無任何可壓中央牌堆的組合（_usableCardIndices 回空集合，同「全部灰牌」的訊號）
			// → 播「只能過牌」語音；領牌（回 null）或有可出牌 → 播一般請選牌出牌 / 首發語音。
			const usable = this._usableCardIndices();
			if (usable && usable.size === 0) this._playNoCardPassPrompt();
			else this._playBtPrompt();
		} else if (!canPlay || dealing) {
			this._btTurnPromptActive = false;
		}

		// 圖集操作按鈕：開局後（手上有牌）且發牌動畫結束才顯示；輪到英雄才啟用（亮），
		// 否則灰底停用。狀態跟隨伺服器（換手/逾時時 canPlay/canPass 變 false 即自動停用）。
		const inHand = hasCards && !dealing;
		const setBtnState = (btn, enabled) => {
			if (!btn) return;
			btn.setVisible(inHand);
			btn._inactive = !(inHand && enabled);
			if (inHand && enabled) btn.clearTint();
			else btn.setTint(BT_ACTION_INACTIVE_TINT);
		};
		// Feature 2：先更新牌型標籤與 _selectionArmed，出牌鈕依 _selectionArmed 啟用（不再靠牌型鈕自動選牌）。
		this._refreshComboLabel();
		setBtnState(this.btActionButtons?.play, canPlay && this._selectionArmed);
		setBtnState(this.btActionButtons?.pass, canPass);
		// 選牌鈕已退役（建構處隱藏並停用）；牌型面板改為被動標籤（_refreshComboLabel 控制顯示）。
		// 退役漸層按鈕（改用圖集按鈕）
		this.playBtn?.setVisible(false);
		this.passBtn?.setVisible(false);

		// Feature 1：計算「不可出手牌」閘門（僅英雄可出、跟牌、非發牌中）。領牌時 _usableCardIndices 回 null → 不套用。
		this._cardGateSet = canPlay && !dealing ? this._usableCardIndices() : null;
		this._cardGateActive = this._cardGateSet != null;
		this._refreshCardVisuals();

		if (!canPlay && !canPass) {
			this.selectedIndices.clear();
			this._selectionArmed = false; // 換手/逾時：重置出牌啟用狀態
			this._refreshCardVisuals();
			this._refreshComboLabel(); // 收起牌型標籤
		}
	}

	// 背景抑制：分頁隱藏（切分頁 → document.hidden）或視窗失焦（切到其他 app 如 Figma → window blur）時，
	// 音訊被暫停/掛起——此時仍建立音效只會在回前景時一次全部爆出（疊音、超大聲）。故一律不播。
	// 比照撲克語音佇列的可見性守門（main.js isDocumentVisible / consumeVoiceCues）。
	_audioSuppressed() {
		if (typeof document !== "undefined" && document.hidden) return true;
		return this._windowBlurred === true;
	}

	// 統一 SFX 播放：背景抑制時不播；播畢即銷毀，不累積實例。僅大老二使用，不影響撲克。
	_playSfx(key, vol) {
		if (this._audioSuppressed()) return;
		const v = Math.max(0, Math.min(1, Number(vol) || 0));
		if (v <= 0 || !this.cache.audio.exists(key)) return;
		const sfx = this.sound.add(key);
		sfx.setVolume(v);
		sfx.play();
		sfx.once("complete", () => sfx.destroy());
	}

	// 統一語音播放：背景抑制時不播。playVoiceByKey 本身為單通道（新語音中止舊語音）。
	_playVoice(key) {
		if (this._audioSuppressed()) return;
		this.app?.playVoiceByKey?.(key);
	}

	_playUiClick() {
		const vol = Math.max(
			0,
			Math.min(1, 0.7 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		this._playSfx("ui_click", vol);
	}

	// 「請選牌出牌」語音：英雄輪到出牌（回合開始）時播一次（音量跟隨 SFX 輸出音量）。
	// 若手上握有梅花3（3c，領牌）→ 改播首發語音 voice_first_play_bt；未載入則退回一般 play_bt。
	_playBtPrompt() {
		const vol = Math.max(
			0,
			Math.min(1, Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0) return;
		const hasClub3 = (this.state?.bigTwoHeroCards ?? []).some(
			(c) => normalizeCard(c) === "3c",
		);
		// 領牌且首發語音已就緒 → 用首發語音；否則（非領牌 or 未載入）退回一般 play_bt。
		const key =
			hasClub3 && this.cache.audio.exists(BT_FIRST_PLAY_PROMPT_KEY)
				? BT_FIRST_PLAY_PROMPT_KEY
				: BT_PLAY_PROMPT_KEY;
		if (!this.cache.audio.exists(key)) return;
		this._playSfx(key, vol);
	}

	// 跟牌但手上無任何可壓中央牌堆的牌 → 播「輪到我、但沒有可壓的牌，只能過牌」語音（no_card_and_pass_bt.mp3）。
	_playNoCardPassPrompt() {
		const vol = Math.max(
			0,
			Math.min(1, Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0) return;
		this._playSfx(BT_NO_CARD_PASS_KEY, vol);
	}

	// 出牌落到中央牌堆時的語音（任何玩家）：單張＝該張牌專屬（{rank}_{suit}_bt，10 用 "10"；找不到退回 single_bt），
	// 多張＝牌型（BT_COMBO_VOICE_KEY）。任何玩家出牌落中央皆呼叫；播放前以 cache.audio.exists 防護（缺檔靜默）。
	_playCardPlayVoice(cards) {
		if (!Array.isArray(cards) || cards.length === 0) return;
		const vol = Math.max(
			0,
			Math.min(1, Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0) return;
		let key = null;
		if (cards.length === 1) {
			const norm = normalizeCard(cards[0]); // 例："3s"、"Td"（10→T）
			if (norm) {
				const rank = norm[0] === "T" ? "10" : norm[0];
				key = `${rank}_${norm[1]}_bt`;
			}
			if (!key || !this.cache.audio.exists(key)) key = "single_bt"; // 缺該張專屬檔 → 退回 single
		} else {
			const ev = this._evaluateCombo(cards);
			key = ev ? BT_COMBO_VOICE_KEY[ev.category] : null;
		}
		if (!key || !this.cache.audio.exists(key)) return;
		this._playSfx(key, vol);
	}

	// 出牌音效：沿用既有發牌音「deal_cards」，用於牌飛入中央牌堆（與發牌動畫同一張音效）
	_playCardSfx() {
		const vol = Math.max(
			0,
			Math.min(1, 0.5 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		this._playSfx("deal_cards", vol);
	}

	playCountdownSfx() {
		if (!this.countdownSfxSound) return;
		const vol = Math.max(
			0,
			Math.min(
				1,
				CD_SFX_VOLUME * Number(this.app?.getSfxOutputVolume?.(1) ?? 0),
			),
		);
		if (vol <= 0) return;
		try {
			if (this.countdownSfxSound.isPlaying) this.countdownSfxSound.stop();
			this.countdownSfxSound.setVolume(vol);
			this.countdownSfxSound.play();
		} catch (_) {}
	}

	stopCountdownSfx() {
		try {
			if (this.countdownSfxSound?.isPlaying) this.countdownSfxSound.stop();
		} catch (_) {}
	}

	_renderCountdown() {
		const table = this.state?.table;
		const turnSeat = Number(table?.current_turn_seat ?? -1);
		const timeout = Number(table?.current_turn_timeout ?? 0);
		const startAt = Number(table?.current_turn_started_at ?? 0);

		const rem =
			timeout > 0 && startAt > 0
				? Math.max(0, timeout - (Date.now() - startAt) / 1000)
				: null;
		const remainSeconds = rem !== null ? Math.ceil(rem) : null;
		const isWarning =
			remainSeconds !== null && remainSeconds <= CD_WARNING_SECONDS;
		const isCritical =
			remainSeconds !== null && remainSeconds <= CD_CRITICAL_SECONDS;
		const blinkOn = Math.floor(Date.now() / CD_BLINK_MS) % 2 === 0;

		if (
			isCritical &&
			remainSeconds > 0 &&
			remainSeconds !== this.lastCountdownBeepSecond
		) {
			this.lastCountdownBeepSecond = remainSeconds;
			this.playCountdownSfx();
		} else if (!isCritical || remainSeconds <= 0) {
			this.stopCountdownSfx();
		}

		this.seatViews.forEach((sv) => {
			if (sv.displaySeat === turnSeat && remainSeconds !== null) {
				const ringColor = isWarning ? CD_RING_WARNING : CD_RING_COLOR;
				const textColor = isWarning ? CD_WARNING_COLOR : CD_TEXT_COLOR;
				const alpha = isCritical ? (blinkOn ? 1 : 0.2) : 1;
				sv.cdBg
					.setStrokeStyle(CD_RING_WIDTH, ringColor, 1)
					.setAlpha(alpha)
					.setVisible(true);
				sv.cdText
					.setColor(textColor)
					.setAlpha(alpha)
					.setText(`${remainSeconds}`)
					.setVisible(true);
			} else {
				sv.cdBg.setVisible(false);
				sv.cdText.setVisible(false);
			}
		});
	}

	// 回合倒數圓環（與德州撲克 refreshTurnRing 相同）：在輪到玩家的頭像外緣畫一圈漸層弧，
	// 依剩餘時間比例遞減（cyan→orange→red），最後幾秒閃爍。需要伺服器計時欄位
	// （current_turn_timeout / current_turn_started_at）；觀戰時這些為 0，故不畫環（改用頭像發光）。
	_refreshTurnRing() {
		if (!Array.isArray(this.seatViews) || this.seatViews.length === 0) return;
		const table = this.state?.table;
		const turnSeat = Number(table?.current_turn_seat ?? -1);
		const totalSeconds = Number(table?.current_turn_timeout ?? 0);
		const startedAt = Number(table?.current_turn_started_at ?? 0);
		// 無計時資料（觀戰）或非任何人回合 → 清空所有環
		if (!(totalSeconds > 0) || turnSeat < 0) {
			this.seatViews.forEach((sv) => sv.turnRing?.clear());
			return;
		}
		const elapsed = startedAt > 0 ? (Date.now() - startedAt) / 1000 : 0;
		const remain = totalSeconds - elapsed;
		const ratio = Math.min(1, Math.max(0, remain / totalSeconds));
		const isCritical = remain <= CD_CRITICAL_SECONDS;
		const blinkOn = Math.floor(Date.now() / CD_BLINK_MS) % 2 === 0;
		const alpha = isCritical ? (blinkOn ? 1 : 0.2) : 1;
		const s = this._s ?? 1;
		const SEGS = 16;
		this.seatViews.forEach((sv) => {
			const ring = sv.turnRing;
			if (!ring) return;
			ring.clear();
			if (
				sv.displaySeat !== turnSeat ||
				!sv.frameImg?.visible ||
				ratio <= 0.005
			)
				return;
			// 圓環取代頭像發光：有計時圓環的座位，強制關閉脈動發光，避免「圓環＋發光」並存
			// （發光由 _renderSeats 設定、圓環由 ticker 設定，這裡每 tick 兜底確保互斥）
			if (sv.glowOuterTween) {
				sv.glowOuterTween.remove();
				sv.glowOuterTween = null;
			}
			sv.turnActive = false;
			sv.glowOuter?.setVisible(false);
			const r =
				Math.min(sv.frameImg.displayWidth, sv.frameImg.displayHeight) * 0.48;
			const cx = sv.posX;
			const cy = sv.posY + AVATAR_Y_OFFSET * s;
			const startRad = -Math.PI / 2;
			const sweep = 2 * Math.PI * ratio;
			for (let i = 0; i < SEGS; i++) {
				const t = (i + 1) / SEGS;
				const segColor =
					t < 0.5
						? lerpColor(0x00e5ff, 0xff7700, t * 2)
						: lerpColor(0xff7700, 0xff2200, (t - 0.5) * 2);
				ring
					.lineStyle(9 * s, segColor, alpha)
					.beginPath()
					.arc(
						cx,
						cy,
						r,
						startRad + sweep * (i / SEGS),
						startRad + sweep * ((i + 1) / SEGS),
						false,
					)
					.strokePath();
			}
		});
	}

	_checkHeroCards() {
		const v = Number(this.state?.bigTwoHeroCardsVersion ?? 0);
		if (v <= this.lastHeroCardsVer) return;
		this.lastHeroCardsVer = v;
		this.selectedIndices.clear();
		this._comboArmed = false; // 新一局：重置出牌啟用狀態
		this._handReadySent = false; // 新一局已開：下次等待下一局時可再送 hand_ready
		const cards = this.state.bigTwoHeroCards || [];
		const prevCount = this.lastHeroCardCount;
		this.lastHeroCardCount = cards.length;
		// 靜態顯示（不重播發牌動畫）條件：重連 sessionStorage 還原（store 旗標，可能已被 hole_cards 清除）
		// 或「場景建立時手牌已存在」的首次同步（scene-local，較可靠）。一次性旗標，讀後即清。
		const restored = Boolean(this.state?.bigTwoHeroCardsRestored);
		if (this.state) this.state.bigTwoHeroCardsRestored = false;
		const initialSync = Boolean(this._heroInitialSync);
		this._heroInitialSync = false;
		const staticShow = restored || initialSync;

		this.heroCardImages.forEach((img, i) => {
			if (i < cards.length) {
				const key = normalizeCard(cards[i]);
				if (key) img.setTexture("playing_cards_element", key);
				img.clearTint().setData("code", cards[i]);
				img.setVisible(false);
			} else {
				img.setVisible(false);
			}
		});
		this.applyLayout();

		// 牌数增加（或首次）= 新一局发牌；减少 = 出牌后更新，直接显示剩余牌
		const isNewDeal = cards.length > prevCount || prevCount === 0;
		if (isNewDeal || staticShow) {
			this._heroPlayedCurrentHand = true; // 英雄有牌＝有打這局（供手局結束選單判斷）
			this._handConcluded = false; // 本局進行中 → 關閉手局結束選單視窗
		}
		if (isNewDeal && !staticShow) {
			this._dealAnimation(cards.length || 13);
		} else {
			// 重連還原 / 首次同步 / 出牌後更新：直接靜態顯示手牌（不發牌動畫）。
			this.heroCardImages.forEach((img, i) => {
				if (i < cards.length) img.setVisible(true);
			});
		}
	}

	_dealAnimation(cardCount) {
		const runId = ++this._dealRunId; // invalidates any previous in-flight animation
		const s = this._s ?? 1;
		const ox = this._ox ?? 0;
		const oy = this._oy ?? 0;
		const fromX = ox + (CX + TABLE_X_OFFSET) * s;
		const fromY = oy + (TABLE_Y - 100) * s;
		const heroHand = this._getHeroHandLayout();
		const sfxVol = Math.max(
			0,
			Math.min(1, 0.5 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);

		// 只對有玩家的對手席位做動畫
		const nonHeroViews = this.seatViews.filter(
			(sv) => !sv.isHero && sv.displaySeat !== null,
		);
		// 先隱藏對手牌背縱列，等動畫一張一張亮出來
		nonHeroViews.forEach((sv) =>
			this._sideColForView(sv.slotIndex)?.forEach((cb) => cb.setVisible(false)),
		);

		this._dealAnimating = true;
		let seq = 0; // 全局序號，控制 stagger 順序
		for (let r = 0; r < cardCount; r++) {
			// 依序派給每個對手
			nonHeroViews.forEach((sv) => {
				// 落點改為對手牌背縱列（與 applyLayout 共用 _sideColCardPos），動畫結構不變
				const pos = this._sideColCardPos(sv.slotIndex, r);
				const targetCard = this._sideColForView(sv.slotIndex)?.[r];
				const delay = seq * DEAL_CARD_STAGGER_MS;
				seq++;

				this.time.delayedCall(delay, () => {
					if (this._dealRunId !== runId) return;
					const fly = this.add
						.image(fromX, fromY, "big_two_game_table", "card_back")
						.setDisplaySize(SIDE_BACK_CARD_W * s, SIDE_BACK_CARD_H * s)
						.setDepth(56)
						.setAlpha(0.9);
					this.tweens.add({
						targets: fly,
						x: pos.x,
						y: pos.y,
						rotation: pos.angle,
						duration: DEAL_CARD_FLY_DURATION,
						ease: "Cubic.Out",
						onComplete: () => {
							if (this._dealRunId !== runId) {
								fly?.destroy();
								return;
							}
							fly.destroy();
							targetCard?.setVisible(true);
						},
					});
				});
			});

			// 派給英雄（翻面亮牌）
			const heroImg = this.heroCardImages[r];
			if (heroImg) {
				const delay = seq * DEAL_CARD_STAGGER_MS;
				seq++;

				this.time.delayedCall(delay, () => {
					if (this._dealRunId !== runId) return;
					this._playSfx("deal_cards", sfxVol);
					const fly = this.add
						.image(fromX, fromY, "big_two_game_table", "card_back")
						.setDisplaySize(heroHand.cardW * s, heroHand.cardH * s)
						.setDepth(56)
						.setAlpha(0.9);
					this.tweens.add({
						targets: fly,
						x: heroImg.x,
						y: heroImg.y,
						duration: DEAL_CARD_FLY_DURATION,
						ease: "Cubic.Out",
						onComplete: () => {
							if (this._dealRunId !== runId) {
								fly?.destroy();
								return;
							}
							fly.destroy();
							heroImg.setVisible(true);
						},
					});
				});
			}
		}

		// 動畫全部結束後解除標記，並重跑一次操作 UI：此時 dealing=false，
		// 過牌/出牌/選牌 按鈕出現、「請選牌出牌」語音的邊緣偵測觸發 → 兩者在最後一張牌落定時一起呈現。
		const totalMs = seq * DEAL_CARD_STAGGER_MS + DEAL_CARD_FLY_DURATION + 80;
		this.time.delayedCall(totalMs, () => {
			if (this._dealRunId !== runId) return;
			this._dealAnimating = false;
			this._renderActionUI();
		});
	}

	_showAllDealtCards() {
		const cards = this.state?.bigTwoHeroCards ?? [];
		this.heroCardImages.forEach((img, i) => {
			if (i < cards.length) img.setVisible(true);
		});
		this.seatViews.forEach((sv) => {
			if (sv.isHero || sv.displaySeat === null) return;
			const players = this.state?.table?.players ?? [];
			const player = players.find((p) => Number(p.seat) === sv.displaySeat);
			const rem = Number(
				player?.hand_count ??
					player?.remaining_count ??
					player?.hole_count ??
					0,
			);
			const show = rem > 0 ? Math.min(rem, OPP_CARD_MAX) : OPP_CARD_MAX;
			// 背景切換略過發牌動畫時，直接補齊「縱列牌背」（與 _dealAnimation 落點／_renderSeats 顯示一致）。
			const s = this._s ?? 1;
			this._sideColForView(sv.slotIndex)?.forEach((cb, c) => {
				if (c < show) {
					const pos = this._sideColCardPos(sv.slotIndex, c);
					cb.setPosition(pos.x, pos.y)
						.setRotation(pos.angle)
						.setDisplaySize(SIDE_BACK_CARD_W * s, SIDE_BACK_CARD_H * s)
						.setVisible(true);
				} else {
					cb.setVisible(false);
				}
			});
			if (rem > 0) {
				sv.cardCountBadge.setText(`${rem}張`).setVisible(true);
				sv.cardCountBadgeBg?.setVisible(true);
			}
		});
	}

	_checkLastPlay() {
		// 兩種情況維持乾淨中央（隱藏中央牌、前手扇形、牌型標籤，並吃掉版本號避免殘留／污染前手扇形）：
		// 1) 入座但本局等待中（等待中）；2) 觀戰但無任何玩家在本局內（無進行中的牌局，含換桌殘留）。
		const seatedWaiting =
			!this.state?.isSpectator &&
			Number(this.state?.heroSeat ?? -1) >= 0 &&
			Boolean(this.state?.heroJoinedWaiting) &&
			(this.state?.bigTwoHeroCards?.length ?? 0) === 0;
		// 觀戰時「牌局確實在進行」＝目前回合落在有玩家的座位上（與 _renderSeats 牌列判斷一致）。
		// 回合指向空位（卡局/換桌殘留）→ 視為未在進行 → 清空中央。
		const players = Array.isArray(this.state?.table?.players)
			? this.state.table.players
			: [];
		let _turnSeat = Number(this.state?.table?.current_turn_seat ?? -1);
		if (!(_turnSeat >= 0))
			_turnSeat = Number(this.state?.table?.play_state?.current_seat ?? -1);
		const turnOnOccupiedSeat =
			_turnSeat >= 0 && players.some((p) => Number(p.seat) === _turnSeat);
		const spectatorNoActiveHand =
			Boolean(this.state?.isSpectator) && !turnOnOccupiedSeat;
		if (seatedWaiting || spectatorNoActiveHand) {
			this._centerFlyImages?.forEach((f) => f.destroy());
			this._centerFlyImages = [];
			this.centerPlayImages.forEach((i) => i.destroy());
			this.centerPlayImages = [];
			this._curPlayCards = [];
			this.centerPrevImages.forEach((i) => i.destroy());
			this.centerPrevImages = [];
			this._prevCardBuf = [];
			this._drawCenterPlayShadow(0);
			this.centerLabel?.setVisible(false);
			this.centerByText?.setVisible(false);
			this.lastLastPlayVer = Number(this.state?.bigTwoLastPlayVersion ?? 0); // 吃掉版本
			return;
		}

		const v = Number(this.state?.bigTwoLastPlayVersion ?? 0);
		if (v <= this.lastLastPlayVer) return;
		this.lastLastPlayVer = v;
		// 重連/換場景首次同步：中央牌來自快照而非新出牌 → 靜態顯示（不飛入、不出聲）。一次性旗標，讀後即清。
		const centerStatic = Boolean(this._centerInitialSync);
		this._centerInitialSync = false;

		// 清除上一次的飛行精靈（永久牌圖改為「降級保留」，見下方）
		this._centerFlyImages?.forEach((f) => f.destroy());
		this._centerFlyImages = [];

		const lastPlay = this.state.bigTwoLastPlay;
		if (!lastPlay?.cards?.length) {
			// 清空中央（新一局 / 清除）：現任牌、後方扇形、滾動緩衝皆清除
			this.centerPlayImages.forEach((i) => i.destroy());
			this.centerPlayImages = [];
			this._curPlayCards = [];
			this._prevCardBuf = [];
			this._layoutPrevFan(); // 依空緩衝重建（會銷毀現有扇形）
			this._drawCenterPlayShadow(0);
			this.centerLabel?.setVisible(false);
			this.centerByText?.setVisible(false);
			return;
		}

		// 現任牌「沉入」後方暗化扇形：把上一手現任的卡面推入滾動緩衝（最多 PREV_MAX，超出由左側汰除），重建扇形
		if (this._curPlayCards.length) {
			this._prevCardBuf.push(...this._curPlayCards);
			if (this._prevCardBuf.length > PREV_MAX) {
				this._prevCardBuf = this._prevCardBuf.slice(-PREV_MAX);
			}
		}
		this._layoutPrevFan();

		// 銷毀舊的現任牌圖，建立新的現任牌
		this.centerPlayImages.forEach((i) => i.destroy());
		this.centerPlayImages = [];
		this._curPlayCards = lastPlay.cards.slice();

		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const cards = lastPlay.cards;
		const n = cards.length;
		const totalW = n * (CENTER_CARD_W + CENTER_CARD_GAP) - CENTER_CARD_GAP;
		const startX = CX - totalW / 2 + CENTER_CARD_W / 2;
		this._drawCenterPlayShadow(n);

		// 出牌来源坐标（哪个玩家出的，从哪里飞过来）
		const playSeat = Number(lastPlay.seat ?? -1);
		const seatView = this.seatViews.find((sv) => sv.displaySeat === playSeat);
		let fromX = ox + CX * s;
		let fromY = oy + CY * s;
		if (seatView) {
			if (seatView.isHero) {
				const heroHand = this._getHeroHandLayout();
				fromX = ox + CX * s;
				fromY = oy + heroHand.y * s;
			} else {
				const sp = SEAT_POS[seatView.slotIndex];
				fromX = ox + sp.x * s;
				fromY = oy + (sp.y + OPP_CARDS_Y_OFFSET) * s;
			}
		}

		// 中央下方標籤：顯示牌型（如「順子」）；隱藏固定的「最新出牌」與玩家名稱
		this.centerLabel?.setVisible(false);
		this.centerByText
			?.setText(this._comboLabelForCards(cards))
			.setVisible(true);

		// 牌飛入中央牌堆：播放出牌音效（沿用發牌音 deal_cards），每次出牌觸發一次
		if (!centerStatic) this._playCardSfx();
		// 任何玩家出牌 → 待牌飛落中央（fly duration≈200ms）後播出牌語音（單張＝該張牌、多張＝牌型）。
		if (!centerStatic && playSeat >= 0) {
			const playedCards = cards.slice();
			this.time.delayedCall(200, () => this._playCardPlayVoice(playedCards));
		}

		// 立即在目的地建立永久牌图（保证显示），fly 精灵只是视觉叠加
		cards.forEach((card, i) => {
			const key = normalizeCard(card);
			const tx = ox + (startX + i * (CENTER_CARD_W + CENTER_CARD_GAP)) * s;
			const ty = oy + CENTER_PLAY_Y * s;
			const texture = key ? "playing_cards_element" : "big_two_game_table";
			const frame = key || "card_back";

			// 永久牌图：立即创建，不依赖动画回调
			const img = this.add
				.image(tx, ty, texture, frame)
				.setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
				.setDepth(10);
			this.centerPlayImages.push(img);

			if (!centerStatic) {
			// fly 精灵：从玩家位置飞来覆盖在上面，完成后销毁
			const fly = this.add
				.image(fromX, fromY, texture, frame)
				.setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
				.setDepth(55);
			this._centerFlyImages.push(fly);

			this.tweens.add({
				targets: fly,
				x: tx,
				y: ty,
				duration: 200,
				delay: i * 45,
				ease: "Cubic.Out",
				onComplete: () => {
					fly.destroy();
					const idx = this._centerFlyImages.indexOf(fly);
					if (idx >= 0) this._centerFlyImages.splice(idx, 1);
				},
			});
			}
		});
	}

	// 過牌音效（對手）：玩家過牌時伺服器以 player_action 廣播，store 記錄 player.last_action="pass"
	// 與 last_action_at。偵測「非英雄座位」的新過牌並播放 voice_check；英雄自己過牌由按鈕即時播放，故略過。
	// 換桌或初次只記錄目前最新時戳、不補播舊過牌（依 table_id 變動重置）。
	_checkPassSound() {
		const table = this.state?.table;
		const players = Array.isArray(table?.players) ? table.players : [];
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		let latest = 0;
		let latestSeat = -1;
		for (const p of players) {
			if (Number(p.seat) === heroSeat) continue;
			if (String(p.last_action ?? "").toLowerCase() !== "pass") continue;
			const at = Number(p.last_action_at ?? 0);
			if (at > latest) {
				latest = at;
				latestSeat = Number(p.seat);
			}
		}
		const tid = table?.table_id ?? null;
		if (tid !== this._passSoundTableId) {
			this._passSoundTableId = tid;
			this._lastPassSoundAt = latest; // 換桌/初次：記錄不播
			return;
		}
		if (latest > this._lastPassSoundAt) {
			this._lastPassSoundAt = latest;
			this._playVoice(
				this.cache.audio.exists(BT_CHECK_VOICE_KEY) ? BT_CHECK_VOICE_KEY : "voice_check",
			);
			this._showPassBadge(latestSeat); // 對手過牌：頭像顯示 brand_check 標籤
		}
	}

	// 入座音效：英雄由觀戰（未入座）轉為入座時播一次 player_join_bt.mp3（比照德州撲克的入座/加入音，但為大老二專屬檔）。
	// 初次（null）只記錄狀態、不補播，避免重整/重連時在已入座狀態誤播。false→true 才播。
	_checkHeroSeatSound() {
		const seated = !this.state?.isSpectator && Number(this.state?.heroSeat ?? -1) >= 0;
		if (this._prevHeroSeated == null) {
			this._prevHeroSeated = seated;
			return;
		}
		if (seated && !this._prevHeroSeated && this.cache.audio.exists(BT_PLAYER_JOIN_KEY)) {
			this._playVoice(BT_PLAYER_JOIN_KEY);
		}
		// 由入座轉為未入座（離座 stand_up / 離桌）當下：立即清掉剛才那局殘留的牌面，避免退座後觀戰畫面仍顯示上一局。
		// 底層狀態（bigTwoHeroCards / bigTwoLastPlay）由 store spectator_mode 一併清除，兩者搭配確保後續 renderState 維持乾淨。
		if (!seated && this._prevHeroSeated) {
			this._resetBoardOnStandUp();
		}
		this._prevHeroSeated = seated;
	}

	// 退座（座位→觀戰）時的一次性清場：隱藏四家對手牌背、英雄手牌與中央牌堆/牌型標籤，並還原翻出的牌背。
	// 純顯示層重置（不動 store）；配合 store spectator_mode 清 bigTwoHeroCards/bigTwoLastPlay，避免殘留與透視切換的過場疊影。
	_resetBoardOnStandUp() {
		this.centerPlayImages?.forEach((i) => i?.setVisible(false));
		this.centerPrevImages?.forEach((i) => i?.setVisible(false));
		this._centerFlyImages?.forEach((i) => i?.setVisible(false));
		this.centerPlayShadow?.setVisible(false);
		this.centerLabel?.setVisible(false);
		this.centerByText?.setVisible(false);
		this.seat0CardBackImages?.forEach((cb) => cb?.setVisible(false));
		this.seat1CardBackImages?.forEach((cb) => cb?.setVisible(false));
		this.seat3CardBackImages?.forEach((cb) => cb?.setVisible(false));
		this.heroCardBackImages?.forEach((cb) => cb?.setVisible(false));
		this.heroCardImages?.forEach((c) => c?.setVisible(false));
		this._resetRevealedBacks?.();
	}

	// 在指定座位的頭像上顯示「過牌」動作標籤（brand_check），彈跳進場、1.6 秒後淡出（與德州撲克相同）。
	_showPassBadge(seat) {
		const sv = this.seatViews.find((v) => v.displaySeat === Number(seat));
		if (!sv?.actionBadge) return;
		const finalScale = BT_ACTION_BADGE_SCALE * (this._s ?? 1);
		this.tweens.killTweensOf(sv.actionBadge);
		sv.actionBadgeHideTimer?.remove();
		sv.actionBadgeHideTimer = null;
		sv.actionBadge
			.setFrame("brand_check")
			.setScale(0)
			.setAlpha(1)
			.setVisible(true);
		this.tweens.add({
			targets: sv.actionBadge,
			scaleX: finalScale,
			scaleY: finalScale,
			duration: 280,
			ease: "Back.Out",
		});
		sv.actionBadgeHideTimer = this.time.delayedCall(1600, () => {
			sv.actionBadgeHideTimer = null;
			this.tweens.add({
				targets: sv.actionBadge,
				alpha: 0,
				duration: 400,
				ease: "Linear",
				onComplete: () => {
					if (sv.actionBadge?.active)
						sv.actionBadge.setVisible(false).setAlpha(1).setScale(finalScale);
				},
			});
		});
	}

	_checkHandResult() {
		const v = Number(this.state?.bigTwoHandResultVersion ?? 0);
		if (v <= this.lastHandResultVer) return;
		this.lastHandResultVer = v;
		const res = this.state.bigTwoHandResult;
		if (!res) return;
		// 即時收到的官方結算：記下 key，避免 _checkRoundEnd 再用快照補一次
		const tid = res.table_id ?? this.state?.table?.table_id ?? "";
		const hid = res.hand_id ?? this.state?.table?.hand_id ?? "";
		this.lastShownHandKey = `${tid}|${hid}`;
		this._showResultWithReveal(res);
	}

	// 顯示結算：先局末翻牌（對手手牌 back→front），若有觸發則延後結算 Modal 至翻完（比照撲克攤牌順序）。
	// 需求 7 未上線且非開發預覽時 _maybeRevealHands 回 0 → Modal 立即彈出（與原行為一致，無回歸）。
	// 兩條結算路徑共用：_checkHandResult（真事件）與 _checkRoundEnd（快照 _synth，目前實機走這條）。
	_showResultWithReveal(res) {
		// 比照撲克順序：翻牌（若有資料）＋ 贏家發光，結算 Modal 延後到兩者中較久者結束才彈。
		this._resultWinnerSeat = Number(res?.winner_seat ?? -1); // 供攤牌保留手牌時排除贏家（贏家 0 張）
		const flipMs = this._maybeRevealHands(res); // 翻對手牌（需求 7 資料或開發預覽才有；否則 0）
		this._showWinnerGlow(res); // 開始贏家發光；改為於結算彈窗/選單期間於背景持續播放，不再延後彈窗（比照撲克）
		const wait = flipMs; // 只等翻牌動畫，結算彈窗盡早彈出，留時間給下一局前的手局結束選單
		if (wait <= 0) {
			this._showModal(res);
			return;
		}
		// 翻牌有觸發才保留對手牌面到整段結束（無翻牌則維持既有清場邏輯）。發光是獨立圖層，不需此旗標。
		if (flipMs > 0) this._revealAnimating = true;
		const key = this.lastShownHandKey;
		this.time.delayedCall(wait, () => {
			this._revealAnimating = false;
			// 比照撲克：翻牌牌面保留到結算彈窗期間，不在開彈窗前清除；發光由自身計時器淡出。
			// 實際清除交給 _closeModal（下一局 hand_id 變動時觸發）＋下一局發牌重繪。
			if (this.lastShownHandKey === key) this._showModal(res); // 期間未開新局才彈
		});
	}

	// 贏家發光：比照撲克 _showWinLight，在贏家頭像後方放旋轉的 light 圖，持續 BT_WIN_GLOW_MS 後淡出。
	// 只需 res.winner_seat（結算已帶，一定有贏家）；不需後端資料。恭喜語音改於結算彈窗開啟時播（見 _showModal）。
	// 回傳整體毫秒（發光＋淡出），供 _showResultWithReveal 延後 Modal；無法定位贏家座位則回 0。
	_showWinnerGlow(res) {
		const winnerSeat = Number(res?.winner_seat ?? -1);
		if (winnerSeat < 0 || !this._btWinLight) return 0;
		const sv = this.seatViews.find((v) => v.displaySeat === winnerSeat);
		if (!sv) return 0; // 防禦：定位不到座位則不發光（正常一定有）
		// 清掉前一次殘留
		this._hideWinnerGlow();
		const s = this._s ?? 1;
		const refW = (sv.frameImg?.displayWidth || 120 * s) * BT_WIN_LIGHT_SIZE_MULT;
		const cx = sv.posX;
		const cy = sv.posY + AVATAR_Y_OFFSET * s;
		this._btWinLight
			.setPosition(cx, cy)
			.setDisplaySize(refW, refW)
			.setAngle(0)
			.setAlpha(0.88)
			.setVisible(true);
		this._btWinLightTween = this.tweens.add({
			targets: this._btWinLight,
			angle: 360,
			duration: BT_WIN_LIGHT_ROTATE_MS,
			repeat: -1,
			ease: "Linear",
		});
		this._btWinGlowActive = true;
		// 贏家發光動畫音效：比照撲克 _showWinLight，於發光出現時播 win_animation.mp3（音量 0.9×SFX 輸出）。
		const winAnimVol = Math.max(
			0,
			Math.min(1, BT_WIN_ANIM_SFX_VOLUME * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		this._playSfx(BT_WIN_ANIM_SFX_KEY, winAnimVol);
		// 派彩語音：比照撲克 onAwardAnimationStart，於發光出現時（與 win_animation 同一刻）播 award_bt.mp3
		// （語音通道，未載入退回撲克 voice_award）。牌型語音不在此串接——大老二每次出牌時已各自報牌型。
		this._playVoice(
			this.cache.audio.exists(BT_AWARD_VOICE_KEY) ? BT_AWARD_VOICE_KEY : "voice_award",
		);
		// 恭喜贏家語音改到「結算彈窗開啟」時才播（比照撲克 openHandResultModal），見 _showModal。
		// 持續 BT_WIN_GLOW_MS 後淡出（淡出的 onComplete 由 _hideWinnerGlow 或本延時處理）
		this._btWinLightTimer = this.time.delayedCall(BT_WIN_GLOW_MS, () => {
			if (!this._btWinLight) return;
			this.tweens.add({
				targets: this._btWinLight,
				alpha: 0,
				duration: BT_WIN_LIGHT_FADE_MS,
				onComplete: () => this._hideWinnerGlow(),
			});
		});
		return BT_WIN_GLOW_MS + BT_WIN_LIGHT_FADE_MS;
	}

	// 收掉贏家發光（旋轉 tween、延時、圖層），還原初始狀態。可重入。
	_hideWinnerGlow() {
		this._btWinLightTimer?.remove();
		this._btWinLightTimer = null;
		if (this._btWinLightTween) {
			this.tweens.remove(this._btWinLightTween);
			this._btWinLightTween = null;
		}
		this._btWinLight?.setVisible(false).setAlpha(0.88).setAngle(0);
		this._btWinGlowActive = false;
	}

	// 觀戰換桌時常會在「本局已結束」後才進桌，因而錯過一次性的 hand_result 廣播事件
	// （hand_result 是事件、不在桌面快照內）。此時桌面 status=round_end 仍帶有贏家/張數，
	// 用快照重建一份結算顯示，讓晚進場的觀戰者也看得到。純顯示、不送封包。
	_checkRoundEnd() {
		const t = this.state?.table;
		if (!t || String(t.status) !== "round_end") return;
		const hid = t.hand_id;
		if (hid == null) return;
		const key = `${t.table_id ?? ""}|${hid}`;
		if (key === this.lastShownHandKey || this.isResultOpen) return;
		// 認領本手，避免每幀重複觸發；並先延後開窗，讓官方 hand_result 事件（_checkHandResult，含得分/reveals）
		// 有機會先開窗。逾時官方事件仍未到 → 用快照重建（得分「—」）。此舉修正「快照搶先蓋掉官方得分」。
		this.lastShownHandKey = key;
		this.time.delayedCall(BT_RESULT_REAL_WAIT_MS, () =>
			this._openRoundEndResult(key),
		);
	}

	// round_end 等待窗結束後實際開結算彈窗：優先用官方 hand_result（同一手、含 results[]）；否則以快照重建。
	_openRoundEndResult(key) {
		if (this.isResultOpen) return; // 官方事件已開窗（_checkHandResult）→ 不重開
		if (this.lastShownHandKey !== key) return; // 已換手
		const t = this.state?.table;
		if (!t || String(t.status) !== "round_end") return; // 已進入下一局等
		// 官方 hand_result 是否已到（同一手且帶 results[]）？有則直接用，得分/名次以伺服器為準。
		const real = this.state?.bigTwoHandResult;
		const realKey = real
			? `${real.table_id ?? this.state?.table?.table_id ?? ""}|${real.hand_id ?? ""}`
			: "";
		const realMatches =
			real &&
			realKey === key &&
			Array.isArray(real.results) &&
			real.results.length > 0;
		if (realMatches) {
			// 標記官方事件已消費，避免稍後 _checkHandResult 再開一次。
			this.lastHandResultVer = Number(
				this.state?.bigTwoHandResultVersion ?? 0,
			);
			this._showResultWithReveal(real);
			return;
		}
		// 退回快照重建（無 base_score/pot、得分「—」）。
		const players = (Array.isArray(t.players) ? t.players : [])
			.map((p) => ({
				seat: Number(p.seat),
				name: p.username ?? p.name ?? null,
				hc: Number(p.hand_count ?? p.remaining_count ?? p.hole_count ?? 0),
			}))
			.filter((p) => p.name != null);
		if (players.length === 0) return;
		const ranked = players.slice().sort((a, b) => a.hc - b.hc);
		const winner = ranked.find((p) => p.hc === 0) ?? ranked[0];
		this._showResultWithReveal({
			hand_id: t.hand_id,
			table_id: t.table_id,
			winner_seat: winner ? winner.seat : -1,
			finished_seats: ranked.map((p) => p.seat),
			_synth: true,
		});
	}

	// ─── 局末翻牌（對手手牌 back→front）─────────────────────────────────
	// 單張牌背 → 正面的翻牌動畫：scaleX 收到 0（側面）→ 換成正面 frame → 展開回原寬。
	// sprite：任一牌背 Image；faceFrame：normalizeCard 後的牌碼（playing_cards_element 圖集 frame）。
	_flipCardReveal(sprite, faceFrame, delayMs = 0) {
		if (!sprite || !sprite.active || !faceFrame) return;
		const dw = sprite.displayWidth; // 於翻牌前擷取原尺寸（換 frame 後圖集尺寸可能不同）
		const dh = sprite.displayHeight;
		this.tweens.add({
			targets: sprite,
			scaleX: 0,
			duration: BT_FLIP_HALF_MS,
			delay: delayMs,
			ease: "Quad.easeIn",
			onComplete: () => {
				if (!sprite.active) return;
				sprite.setTexture("playing_cards_element", faceFrame);
				sprite.setDisplaySize(dw, dh); // 以原顯示尺寸重設（scaleX 會被設成滿值）
				const targetSX = sprite.scaleX;
				sprite.scaleX = 0; // 從側面續展開
				this.tweens.add({
					targets: sprite,
					scaleX: targetSX,
					duration: BT_FLIP_HALF_MS,
					ease: "Quad.easeOut",
				});
			},
		});
	}

	// 某對手 view 的側邊牌背精靈陣列（seat0 底部橫列 / seat1 右 / hero 上 / seat3 左）。
	_backsForView(vi) {
		return (
			(vi === 1
				? this.seat1CardBackImages
				: vi === 2
					? this.heroCardBackImages
					: vi === 3
						? this.seat3CardBackImages
						: vi === 0
							? this.seat0CardBackImages
							: null) || []
		);
	}

	// 把 reveal 資料（{ seat: [牌碼...] }）翻到各對手座位（英雄本就正面、跳過）。
	// 強制顯示前 N 張牌背再翻（不依賴當下可見度：局末某幀 _renderSeats 可能已先把牌背隱藏，
	// 例如英雄贏時 heroHasCards 轉 false）。設 _revealAnimating 讓後續 render/清場保留牌面到翻完。
	// 回傳整體動畫毫秒（含停留），供 _checkHandResult 據以延後結算 Modal；無可翻則回 0。
	_revealOpponentHands(revealBySeat, winnerSeat = -1) {
		if (!revealBySeat) return 0;
		const spect = Boolean(this.state?.isSpectator);
		const s = this._s ?? 1;
		const players = Array.isArray(this.state?.table?.players) ? this.state.table.players : [];
		// 該座位「實際剩餘張數」：贏家一定 0 張（雙保險，即使快照 hand_count 未歸零也不翻）；
		// 其餘取桌面 hand_count。翻牌張數以此為上限，避免翻出比手上還多的牌（如開發假牌固定 13 張）。
		const remainingFor = (seat) => {
			if (Number(seat) === Number(winnerSeat)) return 0;
			const p = players.find((pl) => Number(pl.seat) === Number(seat));
			return Number(p?.hand_count ?? p?.remaining_count ?? p?.hole_count ?? 0);
		};
		let maxN = 0;
		this.seatViews.forEach((sv, vi) => {
			// 座上英雄（vi 0 非觀戰）本就正面顯示，跳過；觀戰時 vi 0 是對手，需翻。
			if ((sv.isHero && !spect) || sv.displaySeat == null) return;
			const cards = revealBySeat[sv.displaySeat] ?? revealBySeat[String(sv.displaySeat)];
			if (!Array.isArray(cards) || cards.length === 0) return;
			const backs = this._backsForView(vi);
			if (!backs.length) return;
			const n = Math.min(cards.length, backs.length, remainingFor(sv.displaySeat));
			if (n <= 0) return; // 贏家或無牌 → 不翻（也不強制顯示牌背）
			// 左右直向列（vi 1/3）翻牌時攤開，讓每張點數不被上一張蓋住。
			// 方向比照 _sideColCardPos：右列(vi1) i 往下排、左列(vi3) i 往上排（否則會排到頭像上方跑版）。
			const vertical = vi === 1 || vi === 3;
			const dir = vi === 3 ? -1 : 1; // 左列 -1（向上）、右列 +1（向下）
			const anchorY = vertical ? backs[0]?.y ?? 0 : 0;
			for (let i = 0; i < n; i++) {
				const cb = backs[i];
				const face = normalizeCard(cards[i]);
				if (!cb || !face) continue;
				cb.setVisible(true);
				if (vertical) {
					cb.y = anchorY + dir * i * BT_REVEAL_SIDE_GAP_Y * s;
					// 堆疊：低點數（i 小，如 3♦）在前，其餘依序往後（兩列一致）。
					cb.setDepth(20 + (n - 1 - i) * 0.01);
				}
				this._flipCardReveal(cb, face, i * BT_FLIP_STAGGER_MS);
			}
			if (n > maxN) maxN = n;
		});
		if (maxN === 0) return 0;
		// 只計算並回傳翻牌時長（含停留）；旗標/清場/Modal 時序由 _showResultWithReveal 統一管理
		// （因為還要與贏家發光時長取較久者，兩者同一個延時結束後才彈 Modal、才清場）。
		const flip = (maxN - 1) * BT_FLIP_STAGGER_MS + 2 * BT_FLIP_HALF_MS;
		return flip + BT_REVEAL_HOLD_MS;
	}

	// 翻牌結束後還原對手牌背精靈：貼圖換回 card_back，並把攤開過的左右直向列位置歸位（以 _sideColCardPos 重算）。
	// 這些精靈是常駐、位置由 applyLayout（僅 resize）設定，故翻牌改動過後必須明確還原，避免殘留到下一局。
	_resetRevealedBacks() {
		const s = this._s ?? 1;
		[
			this.seat0CardBackImages,
			this.seat1CardBackImages,
			this.seat3CardBackImages,
			this.heroCardBackImages,
		].forEach((arr) => {
			(arr || []).forEach((cb) => {
				if (!cb) return;
				// 翻牌動畫改的是 scaleX（翻面）；先停掉殘留的 flip tween，再把貼圖與縮放一起還原，
				// 否則被打斷的翻牌會讓牌背卡在中間 scaleX（變窄、看似缺口），且只有 resize 才會救回。
				this.tweens?.killTweensOf(cb);
				if (cb.texture?.key !== "big_two_game_table") {
					cb.setTexture("big_two_game_table", "card_back");
				}
				cb.setDisplaySize(SIDE_BACK_CARD_W * s, SIDE_BACK_CARD_H * s);
				cb.setVisible(false);
			});
		});
		// 左右直向列（vi 1/3）翻牌時改過 y 與 depth，依 _sideColCardPos 與原始深度公式歸位。
		[1, 3].forEach((vi) => {
			this._backsForView(vi).forEach((cb, i) => {
				if (!cb) return;
				const p = this._sideColCardPos(vi, i);
				cb.setPosition(p.x, p.y).setDepth(20 + i * 0.01); // 還原建立時的深度
			});
		});
	}

	// 從局末結算 payload 取出「各座位手牌」——支援後端需求 7 建議的三種形狀（比照姊妹遊戲）：
	//  (a) 麻將式 reveals.hands = { seat: [牌...] }；(b) 撲克式 reveals = { seat: { hole:[...] } }；
	//  (c) results[] 每筆帶 cards。皆無時回 null（＝需求 7 尚未上線，正式路徑 no-op）。
	// 從結算資料抽出「各座位要翻的牌」→ { seat: [cards] }。支援多種來源形狀（皆比照規格／沿用姊妹遊戲）：
	//  (a) 麻將式 reveals.hands = { seat: [cards] }
	//  (b) 規格大老二／撲克式 reveals = { seat: { hole, remaining, hand_rank } }
	//      —— 大老二局末翻的是「剩牌」，故優先 remaining（規格 hand_end.reveals[seat].remaining）；
	//         撲克攤牌無 remaining → 退回 hole（該玩家實際持牌）。
	//  (c) 規格 hand_end.player_results[].remaining_cards（或舊擬案 results[].cards）
	_extractRevealBySeat(res) {
		if (!res || typeof res !== "object") return null;
		const rev = res.reveals;
		if (rev && rev.hands && typeof rev.hands === "object") return rev.hands; // (a)
		if (rev && typeof rev === "object") {
			const out = {};
			let any = false;
			for (const k of Object.keys(rev)) {
				const v = rev[k];
				const cards = Array.isArray(v?.remaining)
					? v.remaining
					: Array.isArray(v?.hole)
						? v.hole
						: null;
				if (cards) {
					out[k] = cards;
					any = true;
				}
			}
			if (any) return out; // (b)
		}
		const list = Array.isArray(res.player_results)
			? res.player_results
			: Array.isArray(res.results)
				? res.results
				: null;
		if (list) {
			const out = {};
			let any = false;
			list.forEach((r) => {
				const cards = Array.isArray(r?.remaining_cards)
					? r.remaining_cards
					: Array.isArray(r?.cards)
						? r.cards
						: null;
				if (cards && r?.seat != null) {
					out[r.seat] = cards;
					any = true;
				}
			});
			if (any) return out; // (c)
		}
		return null;
	}

	// 局末翻牌入口（由 _checkHandResult 呼叫）。有真實 reveal 資料才翻——需求 7 未上線前正式路徑為 no-op。
	// BT_DEV_FLIP_PREVIEW=true 時，無真實資料則用假牌，讓局末整段流程（翻牌→停留→彈 Modal）可預覽。
	// 回傳整體動畫毫秒（0＝未觸發），供 _checkHandResult 延後結算 Modal。
	_maybeRevealHands(res) {
		let reveal = this._extractRevealBySeat(res);
		// 後備：局末公開牌可能不在結算物件內，而在稍後（或先前）的 hand_end 封包（store 存於 state.bigTwoReveals）。
		// 以 hand_id 對應本局才採用，避免用到上一局殘留的公開牌。
		if (!reveal) {
			const br = this.state?.bigTwoReveals;
			if (br) {
				const resHid = res?.hand_id ?? this.state?.table?.hand_id ?? null;
				const sameHand =
					br.hand_id == null || resHid == null || String(br.hand_id) === String(resHid);
				if (sameHand) reveal = this._extractRevealBySeat(br);
			}
		}
		if (!reveal && BT_DEV_FLIP_PREVIEW) reveal = this._devDummyReveal();
		if (!reveal) return 0;
		return this._revealOpponentHands(reveal, Number(res?.winner_seat ?? -1));
	}

	// 開發預覽用假資料：對每個對手座位給一副牌，僅供動畫預覽（BT_DEV_FLIP_PREVIEW=true 時按 F）。
	_devDummyReveal() {
		const dummy = [
			"3d", "4h", "5c", "6s", "7d", "8h", "9c",
			"10s", "jd", "qh", "kc", "2s", "2h",
		];
		const out = {};
		const spect = Boolean(this.state?.isSpectator);
		this.seatViews.forEach((sv) => {
			if ((sv.isHero && !spect) || sv.displaySeat == null) return; // 觀戰時 vi 0 也是對手
			out[sv.displaySeat] = dummy;
		});
		return out;
	}

	// ─── CARD ACTIONS ─────────────────────────────────────────────────

	_toggleCard(i) {
		const ar = this.state?.actionRequest;
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const turnSeat = Number(this.state?.table?.current_turn_seat ?? -1);
		const isMyTurn = heroSeat >= 0 && heroSeat === turnSeat;
		const allowed = Array.isArray(ar?.allowed) ? ar.allowed : [];
		const canSelect =
			isMyTurn || allowed.some((a) => a === "play_cards" || a === "play");
		if (!canSelect) return;
		if (!this.heroCardImages[i]?.visible) return;
		// Feature 1：非可用牌不可選，點擊播錯誤音
		if (this._cardGateActive && this._cardGateSet && !this._cardGateSet.has(i)) {
			playWrongClick(this);
			return;
		}

		if (this.selectedIndices.has(i)) this.selectedIndices.delete(i);
		else this.selectedIndices.add(i);

		this._refreshCardVisuals();
		this._refreshComboLabel(); // 更新牌型標籤 + _selectionArmed
		this._updatePlayArmed(); // 依 _selectionArmed 即時更新出牌鈕外觀
	}

	_refreshCardVisuals() {
		const s = this._s ?? 1,
			oy = this._oy ?? 0;
		const gateSet = this._cardGateActive ? this._cardGateSet : null;
		const heroHand = this._getHeroHandLayout();
		this.heroCardImages.forEach((img, i) => {
			if (!img.visible) return;
			const sel = this.selectedIndices.has(i);
			const gated = gateSet != null && !sel && !gateSet.has(i);
			img.y =
				oy +
				(heroHand.y - (sel ? HERO_CARD_LIFT * heroHand.scale : 0)) * s;
			img.setAlpha(gated ? BT_CARD_GATED_ALPHA : 1);
			img.setTint(sel ? 0xffff88 : gated ? BT_CARD_GATED_TINT : 0xffffff);
		});
	}

	_detectCombo(indices) {
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const selected = [...indices].map((i) => heroCards[i]).filter(Boolean);
		const n = selected.length;
		if (n === 0) return "";
		const RANK = {
			3: 0,
			4: 1,
			5: 2,
			6: 3,
			7: 4,
			8: 5,
			9: 6,
			T: 7,
			J: 8,
			Q: 9,
			K: 10,
			A: 11,
			2: 12,
		};
		const parsed = selected
			.map((c) => {
				const norm = normalizeCard(c);
				return norm ? { r: RANK[norm[0]], s: norm[1] } : null;
			})
			.filter(Boolean);
		if (parsed.length !== n) return `${n}張`;
		const ranks = parsed.map((c) => c.r);
		const suits = parsed.map((c) => c.s);
		if (n === 1) return "單張";
		if (n === 2) return new Set(ranks).size === 1 ? "對子" : `${n}張`;
		if (n === 3) return new Set(ranks).size === 1 ? "三條" : `${n}張`;
		if (n === 5) {
			const sorted = [...ranks].sort((a, b) => a - b);
			const isStraight =
				new Set(ranks).size === 5 && sorted[4] - sorted[0] === 4;
			const isFlush = new Set(suits).size === 1;
			if (isStraight && isFlush) return "同花順";
			if (isFlush) return "同花";
			if (isStraight) return "順子";
			const cnt = {};
			ranks.forEach((r) => {
				cnt[r] = (cnt[r] || 0) + 1;
			});
			const vals = Object.values(cnt).sort((a, b) => a - b);
			if (vals.length === 2 && vals[1] === 4) return "四帶一";
			if (vals.length === 2 && vals[1] === 3) return "葫蘆";
		}
		return `${n}張`;
	}

	// 牌型評估（純讀取，供出牌驗證比較用）；回傳 { count, category, rank } 或 null
	// 注意：不可改寫 _detectCombo()，此為獨立的比較用函數
	_evaluateCombo(cards) {
		const RANK = {
			3: 0,
			4: 1,
			5: 2,
			6: 3,
			7: 4,
			8: 5,
			9: 6,
			T: 7,
			J: 8,
			Q: 9,
			K: 10,
			A: 11,
			2: 12,
		};
		const list = Array.isArray(cards) ? cards : [];
		const parsed = list
			.map((c) => {
				const norm = normalizeCard(c);
				return norm ? { r: RANK[norm[0]], s: norm[1] } : null;
			})
			.filter(Boolean);
		const n = parsed.length;
		if (n === 0 || n !== list.length) return null; // 有牌無法解析 → fail-open

		const ranks = parsed.map((c) => c.r);
		const suits = parsed.map((c) => c.s);
		// 決勝花色（點數相同時用）：取「決定點數的那張牌」的花色序（♦<♣<♥<♠）。
		const sv = (s) => SUIT_ORDER[s] ?? -1;
		const maxSuitOfRank = (r) =>
			Math.max(...parsed.filter((c) => c.r === r).map((c) => sv(c.s)));

		if (n === 1)
			return { count: 1, category: 1, rank: ranks[0], suit: sv(parsed[0].s) };
		if (n === 2)
			return new Set(ranks).size === 1
				? { count: 2, category: 2, rank: ranks[0], suit: maxSuitOfRank(ranks[0]) }
				: null;
		if (n === 3)
			return new Set(ranks).size === 1
				? { count: 3, category: 3, rank: ranks[0], suit: maxSuitOfRank(ranks[0]) }
				: null;
		if (n === 5) {
			const sorted = [...ranks].sort((a, b) => a - b);
			const top = sorted[4];
			const isStraight =
				new Set(ranks).size === 5 && sorted[4] - sorted[0] === 4; // 比照 _detectCombo（僅自然順子）
			const isFlush = new Set(suits).size === 1;
			const topSuit = maxSuitOfRank(top); // 順子/同花順：頂張唯一 → 該張花色
			if (isStraight && isFlush)
				return { count: 5, category: 8, rank: top, suit: topSuit }; // 同花順
			if (isFlush)
				return { count: 5, category: 5, rank: top, suit: sv(suits[0]) }; // 同花
			if (isStraight)
				return { count: 5, category: 4, rank: top, suit: topSuit }; // 順子
			const cnt = {};
			ranks.forEach((r) => {
				cnt[r] = (cnt[r] || 0) + 1;
			});
			const entries = Object.entries(cnt); // [rankStr, occurrences]
			const quad = entries.find(([, c]) => c === 4);
			if (quad)
				return {
					count: 5,
					category: 7,
					rank: Number(quad[0]),
					suit: maxSuitOfRank(Number(quad[0])),
				}; // 鐵支 / 四帶一
			const triple = entries.find(([, c]) => c === 3);
			const pair = entries.find(([, c]) => c === 2);
			if (triple && pair)
				return {
					count: 5,
					category: 6,
					rank: Number(triple[0]),
					suit: maxSuitOfRank(Number(triple[0])),
				}; // 葫蘆
			return null;
		}
		return null;
	}

	// 由卡牌陣列取得牌型中文標籤（中央出牌區用）。_detectCombo 接收 index，故另用 _evaluateCombo。
	_comboLabelForCards(cards) {
		const list = Array.isArray(cards) ? cards : [];
		const ev = this._evaluateCombo(list);
		if (!ev) return `${list.length}張`;
		const LABELS = {
			1: "單張",
			2: "對子",
			3: "三條",
			4: "順子",
			5: "同花",
			6: "葫蘆",
			7: "四帶一",
			8: "同花順",
		};
		return LABELS[ev.category] ?? `${list.length}張`;
	}

	// mine/pile 為 _evaluateCombo 結果或 null。同張數同牌型時：先比點數，點數相同再比花色（♦<♣<♥<♠，
	// 取自 _evaluateCombo 的 suit 欄位）。若缺花色資訊才回退 fail-open（strict=false→可、strict=true→不可）。
	_comboBeats(mine, pile, strict = false) {
		if (!mine) return true; // 非乾淨牌型 → fail-open
		if (!pile) return true; // 無牌堆 / 無法解析 → 任何皆可
		if (mine.category >= 7 && mine.count !== pile.count) return true; // 炸彈跨張數 → fail-open
		if (mine.count !== pile.count) return false;
		if (mine.category !== pile.category) return mine.category > pile.category;
		if (mine.rank !== pile.rank) return mine.rank > pile.rank;
		// 點數相同 → 花色決勝（♦<♣<♥<♠）。有花色即可判定；無花色資訊才回退 fail-open。
		if (mine.suit >= 0 && pile.suit >= 0) return mine.suit > pile.suit;
		return strict ? false : true;
	}

	// Feature 2：評估目前選取牌 → { ev, beats, btn }。ev=_evaluateCombo；beats=能否壓過牌堆（領牌恆真）；btn=對應牌型鈕 index，無對應則 -1。
	_selectionEval() {
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const sel = [...this.selectedIndices].map((i) => heroCards[i]).filter(Boolean);
		const ev = this._evaluateCombo(sel);
		const pile = this._pileToBeat(); // 領牌（含英雄自己的牌堆、其他人皆過）→ null → 任何合法組合可出
		const beats = ev ? this._comboBeats(ev, pile, false) : false;
		const btn = ev ? (BT_CAT_TO_COMBO_BTN[ev.category] ?? -1) : -1;
		return { ev, beats, btn };
	}

	// Feature 2：牌型面板改為被動標籤——僅在選取牌構成可壓過牌堆的合法牌型時，顯示對應那一顆牌型鈕（高亮、不可點）；否則全部隱藏。
	// 同步設定 _selectionArmed（出牌鈕啟用條件）。label 顯示 ⟺ 出牌可按 ⟺ 有效且壓得過的選取。
	_refreshComboLabel() {
		const { beats, btn } = this._selectionEval();
		const armed = beats && btn >= 0;
		this._selectionArmed = armed;
		if (!armed) {
			this._comboLabelBtn = -1;
			this.comboModalBg?.setVisible(false);
			this.comboModalButtons?.forEach((b) => b.setVisible(false));
			return;
		}
		this._comboLabelBtn = btn;
		this.comboModalBg?.setVisible(true);
		// Method 1：牌型改為「標籤」而非按鈕——只顯示該牌型的文字，隱藏按鈕的漸層面＋邊框（gradGfx），
		// 其餘全隱藏。文字沿用 comboModalBg 深色面板作為底框。
		this.comboModalButtons?.forEach((b, i) => {
			b.setVisible(i === btn);
			b.gradGfx?.setVisible(false);
		});
		// 置中於面板（否則文字會停在原本最左槽位）。與 _layoutActionCluster 的 panelY 一致。
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const labelY =
			BT_ACTION_ROW_Y -
			BT_ACTION_BUTTON_HEIGHT / 2 -
			BT_COMBO_PANEL_GAP_Y -
			BT_COMBO_PANEL_H / 2;
		this.comboModalButtons?.[btn]?.setPosition(ox + CX * s, oy + labelY * s);
	}

	// 出牌驗證：選到的牌能否壓過目前牌堆。true=可壓過或不確定（不警告）；false=確定壓不過（警告）
	_canBeatLastPlay(indices) {
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const selected = [...indices].map((i) => heroCards[i]).filter(Boolean);
		const mine = this._evaluateCombo(selected);
		const pileCards = this.state?.bigTwoLastPlay?.cards ?? [];
		const pile = pileCards.length ? this._evaluateCombo(pileCards) : null;
		return this._comboBeats(mine, pile);
	}

	// 列舉某牌型（0=單,1=一對,2=順子,3=葫蘆,4=鐵支,5=同花順）在英雄手牌中的所有候選組合（每個為 index 陣列，依該牌型大小升序）。純讀取、無副作用。
	_enumerateCombos(typeIndex) {
		const RANK = { 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, T: 7, J: 8, Q: 9, K: 10, A: 11, 2: 12 };
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const hand = heroCards
			.map((c, idx) => {
				const n = normalizeCard(c);
				return n ? { idx, r: RANK[n[0]], s: n[1] } : null;
			})
			.filter(Boolean);
		const byRank = new Map();
		hand.forEach((c) => {
			if (!byRank.has(c.r)) byRank.set(c.r, []);
			byRank.get(c.r).push(c);
		});
		const ranksAsc = [...byRank.keys()].sort((a, b) => a - b);
		const candidates = [];
		if (typeIndex === 0) {
			[...hand].sort((a, b) => a.r - b.r).forEach((c) => candidates.push([c.idx]));
		} else if (typeIndex === 1) {
			ranksAsc.forEach((r) => {
				const cs = byRank.get(r);
				if (cs.length >= 2) candidates.push([cs[0].idx, cs[1].idx]);
			});
		} else if (typeIndex === 2) {
			for (let lo = 0; lo <= 8; lo++) {
				if ([0, 1, 2, 3, 4].every((k) => byRank.has(lo + k))) {
					candidates.push([0, 1, 2, 3, 4].map((k) => byRank.get(lo + k)[0].idx));
				}
			}
		} else if (typeIndex === 3) {
			ranksAsc.forEach((tr) => {
				if (byRank.get(tr).length < 3) return;
				const pr = ranksAsc.find((r) => r !== tr && byRank.get(r).length >= 2);
				if (pr == null) return;
				candidates.push([
					...byRank.get(tr).slice(0, 3).map((c) => c.idx),
					...byRank.get(pr).slice(0, 2).map((c) => c.idx),
				]);
			});
		} else if (typeIndex === 4) {
			ranksAsc.forEach((qr) => {
				if (byRank.get(qr).length < 4) return;
				const kicker = hand.filter((c) => c.r !== qr).sort((a, b) => a.r - b.r)[0];
				if (!kicker) return;
				candidates.push([...byRank.get(qr).slice(0, 4).map((c) => c.idx), kicker.idx]);
			});
		} else if (typeIndex === 5) {
			const found = [];
			["d", "c", "h", "s"].forEach((suit) => {
				const inSuit = new Set(hand.filter((c) => c.s === suit).map((c) => c.r));
				for (let lo = 0; lo <= 8; lo++) {
					if ([0, 1, 2, 3, 4].every((k) => inSuit.has(lo + k))) {
						found.push({ lo, idxs: [0, 1, 2, 3, 4].map((k) => hand.find((c) => c.s === suit && c.r === lo + k).idx) });
					}
				}
			});
			found.sort((a, b) => a.lo - b.lo).forEach((x) => candidates.push(x.idxs));
		}
		return candidates;
	}

	// 依牌型代號（0=單,1=一對,2=順子,3=葫蘆,4=鐵支,5=同花順）找出能「嚴格壓過」牌堆的最小組合手牌 index；無則 null。
	// 目前僅供 Feature 1 的 _usableCardIndices 共用列舉；牌型鈕自動選牌路徑已退役（見 Feature 2）。
	_findCombo(typeIndex) {
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const pileCards = this.state?.bigTwoLastPlay?.cards ?? [];
		const pile = pileCards.length ? this._evaluateCombo(pileCards) : null;
		for (const idx of this._enumerateCombos(typeIndex)) {
			const ev = this._evaluateCombo(idx.map((i) => heroCards[i]));
			if (this._comboBeats(ev, pile, true)) return idx; // 嚴格大於：只選確定能壓過者
		}
		return null;
	}

	// Feature 1：回傳「可用手牌 index 集合」——至少存在一種能壓過牌堆的合法組合含此牌。
	// 回傳 null = 不套用閘門（無牌堆/無法解析＝領牌或未知牌型 → fail-open，全部可選）。
	// 目前需要壓過的牌堆（_evaluateCombo 結果）。領牌時回 null：
	//  - 無牌堆（開局／有人出完清空），或
	//  - 牌堆是英雄「自己」上一手（其他人皆過牌 → 輪回英雄領新一輪，可自由出牌）。
	_pileToBeat() {
		const lastPlay = this.state?.bigTwoLastPlay;
		if (!lastPlay) return null;
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		if (heroSeat >= 0 && Number(lastPlay.seat ?? -1) === heroSeat) return null;
		const cards = lastPlay.cards ?? [];
		return cards.length ? this._evaluateCombo(cards) : null;
	}

	_usableCardIndices() {
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const pile = this._pileToBeat();
		if (!pile) return null;
		const usable = new Set();
		for (let t = 0; t <= 5; t++) {
			for (const idx of this._enumerateCombos(t)) {
				const ev = this._evaluateCombo(idx.map((i) => heroCards[i]));
				if (this._comboBeats(ev, pile, false)) idx.forEach((i) => usable.add(i)); // 非嚴格＝平手 fail-open
			}
		}
		return usable;
	}

	_onPlay() {
		if (this.selectedIndices.size === 0) return;
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const cards = [...this.selectedIndices]
			.sort((a, b) => a - b)
			.map((i) => heroCards[i])
			.filter(Boolean);
		if (!cards.length) return;
		const sfxVol = Math.max(
			0,
			Math.min(1, 0.55 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		this._playSfx("bet_chip", sfxVol);
		const ar = this.state?.actionRequest;
		// 伺服器可能用 "play" 或 "play_cards"，回送其在 allowed 宣告的 action 名稱（避免「不支援的動作」）
		const allowed = Array.isArray(ar?.allowed) ? ar.allowed : [];
		const playAction = allowed.includes("play_cards")
			? "play_cards"
			: allowed.includes("play")
				? "play"
				: "play_cards";
		const actionSeq = ar?.action_seq ?? this.state?.bigTwoActionSeq;
		const payload = { action: playAction, cards };
		if (actionSeq != null) payload.action_seq = actionSeq;
		this.app?.sendPacket?.("player_action", payload);
		this.selectedIndices.clear();
		this._selectionArmed = false; // 出牌後重置
		this._refreshCardVisuals();
		this._refreshComboLabel(); // 收起牌型標籤
	}

	_onPass() {
		const ar = this.state?.actionRequest;
		const actionSeq = ar?.action_seq ?? this.state?.bigTwoActionSeq;
		const payload = { action: "pass" };
		if (actionSeq != null) payload.action_seq = actionSeq;
		this.app?.sendPacket?.("player_action", payload);
		// 過牌音效（大老二專屬 check_bt，未載入退回德州撲克 voice_check）：英雄自己過牌時即時播放（不等伺服器廣播回來）
		this._playVoice(
			this.cache.audio.exists(BT_CHECK_VOICE_KEY) ? BT_CHECK_VOICE_KEY : "voice_check",
		);
		this._showPassBadge(Number(this.state?.heroSeat ?? -1)); // 頭像顯示 brand_check 標籤
		this.selectedIndices.clear();
		this._selectionArmed = false; // 過牌後重置
		this._refreshCardVisuals();
		this._refreshComboLabel(); // 收起牌型標籤
	}

	// ─── RESULT MODAL ─────────────────────────────────────────────────

	// 建立本局結果內容（仿撲克）：上方一排表頭（無底色），下方每位玩家各一列、各有底色面板。
	// 全部為動態物件，存入 this._resultRowObjs（顯示時建立、關閉時銷毀、resize 時重建）。
	_buildResultRows(result) {
		(this._resultRowObjs || []).forEach((o) => o.destroy());
		this._resultRowObjs = [];
		const s = this._s ?? 1;
		const ox = this._ox ?? 0;
		const oy = this._oy ?? 0;
		const cx = ox + CX * s;
		const players = this.state?.table?.players ?? [];
		const winnerSeat = Number(result?.winner_seat ?? -1);
		// 伺服器 hand_result.results[]（新版規格）帶每位玩家 score_delta / remaining_count / is_winner；
		// 舊資料或快照重建（_checkRoundEnd 的 _synth）可能沒有，故 rem/score 皆有退回值。
		const results = Array.isArray(result?.results) ? result.results : [];
		// [BTRESULT] 診斷（暫留）：確認 (a) 角色（入座/觀戰）(b) 走真事件或快照(_synth) (c) results[] 有無。
		// 需求 2 未實機生效前保留——待後端送出帶 results[] 的真 hand_result 事件、得分欄顯示正確後再移除。
		console.log(
			"[BTRESULT] isSpectator:",
			Boolean(this.state?.isSpectator),
			"heroSeat:",
			Number(this.state?.heroSeat ?? -1),
			"handResultVer:",
			Number(this.state?.bigTwoHandResultVersion ?? 0),
			"synth:",
			Boolean(result?._synth),
			"hasResults:",
			results.length,
			"keys:",
			Object.keys(result || {}).join(","),
		);
		const resBySeat = new Map(results.map((r) => [Number(r.seat), r]));
		const finished = Array.isArray(result?.finished_seats)
			? result.finished_seats
			: [];
		const order = finished.length
			? finished
			: results.length
				? results.map((r) => Number(r.seat))
				: winnerSeat >= 0
					? [winnerSeat]
					: [];

		// 表頭（無底色）
		const hdrCols = [
			{ x: RESULT_COL_RANK_X, t: "名次", origin: 0 },
			{ x: RESULT_COL_NAME_X, t: "玩家", origin: 0 },
			{ x: RESULT_COL_SCORE_X, t: "得分", origin: 1 },
			{ x: RESULT_COL_REM_X, t: "剩餘", origin: 1 },
		];
		hdrCols.forEach((c) => {
			const t = this.add
				.text(cx + c.x * s, oy + RESULT_HDR_Y * s, c.t, {
					fontFamily: "sans-serif",
					fontSize: `${Math.round(20 * s)}px`,
					color: "#e8d2ad", // 淺金：在深紅面板上可讀（比照撲克彈窗淺色文字）
					fontStyle: "bold",
				})
				.setOrigin(c.origin, 0.5)
				.setDepth(MODAL_TXT_D);
			this._resultRowObjs.push(t);
		});

		// 每位玩家一列（各有底色面板）
		order.forEach((seatRaw, idx) => {
			const seat = Number(seatRaw);
			const p = players.find((pl) => Number(pl.seat) === seat);
			const name = p
				? String(p.username || p.name || p.nickname || `座位${seat}`).slice(
						0,
						6,
					)
				: `座位${seat}`;
			const r = resBySeat.get(seat);
			const rem = Number(
				r?.remaining_count ?? p?.hand_count ?? p?.remaining_count ?? 0,
			);
			const isW = r ? Boolean(r.is_winner) : seat === winnerSeat;
			const scoreDelta =
				r && Number.isFinite(Number(r.score_delta))
					? Number(r.score_delta)
					: null;
			const rowY = oy + (RESULT_ROW_Y0 + idx * RESULT_ROW_STEP) * s;
			const w = RESULT_ROW_W * s;
			const h = RESULT_ROW_H * s;
			const rr = 10 * s;

			// 列底板：圓角矩形，全部統一暗紅（純撲克面板風格，不再特別標示贏家底色）。
			// depth 須高於內面板（MODAL_PNL_D + 0.6），否則會被面板蓋住。贏家仍以 🏆 第1名 文字區分。
			const bg = this.add.graphics().setDepth(MODAL_PNL_D + 0.7);
			bg.fillStyle(RESULT_ROW_BG_NORMAL, 0.92);
			bg.fillRoundedRect(cx - w / 2, rowY - h / 2, w, h, rr);
			bg.lineStyle(1.5 * s, RESULT_ROW_BORDER_NORMAL, 0.9);
			bg.strokeRoundedRect(cx - w / 2, rowY - h / 2, w, h, rr);
			this._resultRowObjs.push(bg);

			const mk = (xOff, txt, originX, color) => {
				const t = this.add
					.text(cx + xOff * s, rowY, txt, {
						fontFamily: "sans-serif",
						fontSize: `${Math.round(22 * s)}px`,
						color,
						fontStyle: "bold",
					})
					.setOrigin(originX, 0.5)
					.setDepth(MODAL_TXT_D);
				this._resultRowObjs.push(t);
			};
			mk(
				RESULT_COL_RANK_X,
				isW ? "🏆 第1名" : `第${idx + 1}名`,
				0,
				isW ? "#ffe08a" : "#f0c040",
			);
			mk(RESULT_COL_NAME_X, name, 0, "#ffffff");
			// 得分（score_delta）：正綠、負紅、0 中性；無資料（快照重建）顯示「—」。
			mk(
				RESULT_COL_SCORE_X,
				scoreDelta == null
					? "—"
					: `${scoreDelta > 0 ? "+" : ""}${scoreDelta}`,
				1,
				scoreDelta == null
					? "#9a8f7a"
					: scoreDelta > 0
						? "#4fd06a"
						: scoreDelta < 0
							? "#ff6b6b"
							: "#e6e6e6",
			);
			mk(RESULT_COL_REM_X, rem > 0 ? `剩 ${rem} 張` : "出完", 1, "#e6e6e6");
		});
	}

	_showModal(result) {
		if (this.isResultOpen) return;
		this.isResultOpen = true;
		this._handConcluded = true; // 結算彈窗開啟＝本局已結算（供手局結束選單/座位渲染；下一局發牌時 _checkHeroCards 設回 false）
		// 記下此結算彈窗所屬的桌號與手號；renderState 會偵測並立即關閉殘留彈窗：
		//  - table_id 變動（換桌，含觀戰自動換桌）→ 一律關閉，避免上一桌結算蓋在新桌上。
		//  - hand_id 變動（下一局開始）→ 僅觀戰時關閉，避免結算蓋住下一局數秒（入座玩家不在此關，保留手局結束選單）。
		this._resultTableId =
			result?.table_id ?? this.state?.table?.table_id ?? null;
		this._resultHandId = result?.hand_id ?? this.state?.table?.hand_id ?? null;

		const players = this.state?.table?.players ?? [];
		const winnerSeat = Number(result.winner_seat ?? -1);
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const sfxKey =
			heroSeat >= 0 && heroSeat === winnerSeat ? "player_win" : "player_lose";
		const sfxVol = Math.max(
			0,
			Math.min(1, 0.6 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		this._playSfx(sfxKey, sfxVol);
		// 恭喜贏家語音：比照撲克 openHandResultModal，於結算彈窗開啟時對所有玩家播一次（isResultOpen 保證每局一次）。
		this._playVoice(
			this.cache.audio.exists(BT_CONGRATS_VOICE_KEY) ? BT_CONGRATS_VOICE_KEY : "voice_congrats_winner",
		);
		// 本局結果內容（表頭 + 每位玩家列）：仿撲克 — 表頭在上、各列各有底色面板。
		// 實際建立交給下方 applyLayout（isResultOpen 已為 true）以目前縮放/位移一次定位。
		this._lastResult = result;

		[
			this.modalOverlay,
			this.modalPanelGfx,
			this.modalBorderGfx,
			this.modalTitleLabel,
			this.modalTitle,
			this.modalHint,
		].forEach((o) => o?.setVisible(true));

		// 觀戰：遮罩不攔截點擊，讓「換桌／結束」仍可隨時操作（瀏覽不同桌不被結算彈窗卡住）；
		// 入座：維持遮罩攔截，避免誤觸牌桌。
		if (this.state?.isSpectator) this.modalOverlay?.disableInteractive();
		else this.modalOverlay?.setInteractive({ useHandCursor: false });

		this.applyLayout();
		this.scene.bringToTop();

		// 彈窗倒數自動關閉（比照德州撲克 showHandResultModal）：每秒遞減並更新提示文字，歸零時關閉。
		let _autoCloseSecs = RESULT_AUTO_CLOSE_SECONDS;
		this.modalHint?.setText(`彈窗倒數（${_autoCloseSecs}）秒 自動關閉`);
		this._resultTimer?.remove();
		this._resultTimer = this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				_autoCloseSecs = Math.max(0, _autoCloseSecs - 1);
				if (_autoCloseSecs > 0) {
					this.modalHint?.setText(`彈窗倒數（${_autoCloseSecs}）秒 自動關閉`);
				} else {
					this._closeModal();
				}
			},
		});
	}

	_closeModal() {
		this._resultTimer?.remove();
		this._resultTimer = null;
		this._hideWinnerGlow?.(); // 防禦：關彈窗/換桌時確保贏家發光不殘留
		this._resetRevealedBacks?.(); // 關彈窗時還原對手翻出的牌面為牌背（下一局重繪前清乾淨）
		this.isResultOpen = false;
		[
			this.modalOverlay,
			this.modalPanelGfx,
			this.modalBorderGfx,
			this.modalTitleLabel,
			this.modalTitle,
			this.modalHint,
		].forEach((o) => o?.setVisible(false));
		// 銷毀本局結果的動態列（表頭＋各列底板與文字）
		(this._resultRowObjs || []).forEach((o) => o.destroy());
		this._resultRowObjs = [];
		this._lastResult = null;

		// 結算彈窗關閉後一律「留在原桌」，不再自動導回大廳：
		// - 觀戰者：留在原桌繼續觀戰（否則會與換桌互相干擾、重建彈窗每 6 秒自動關閉造成反覆重入）。
		// - 入座者：大老二為連續對局（伺服器同桌續發下一局，hand_id 遞增）。此處若 forceBackToGameLobby
		//   + enter_game 會把玩家踢回大廳（選擇場次），且手局結束選單（是否繼續遊戲）根本來不及顯示。
		//   續局/離座/離桌一律改由手局結束選單的三顆按鈕（hand_ready / stand_up / leave_room）決定，
		//   或由 _refreshNextHandCountdown 於倒數結束自動送 hand_ready。故本函式不再導航。
		// 「是否繼續」選單的客戶端視窗不再於此起算。改由 _refreshHandEndMenu 以 hand_end 事件邊緣
		// （store.handEndSeq）＋伺服器 next_event_in 起算（比照德州撲克 refreshHandEndMenu），避免在
		// 結算彈窗關閉時刻（hand_end 尚未到達）讀到 0 而退回 12s 猜測值。下一局發牌時 _checkHeroCards
		// 清 _handConcluded → 選單自動隱藏。
		return;
	}

	// ─── BET PANEL ────────────────────────────────────────────────────

	_buildBetPanel() {
		this.isBetPanelOpen = false;
		this.betSelectedValue = 0;
		this.betPanelMin = 0;
		this.betPanelMax = 0;

		this.betPanelOverlay = this.add
			.rectangle(CX, CY, 4000, 4000, 0x000000, 0.001)
			.setDepth(BET_PANEL_OVERLAY_DEPTH)
			.setVisible(false);
		this.betPanelOverlay.setInteractive({ useHandCursor: false });
		this.betPanelOverlay.on("pointerdown", () => this._closeBetPanel());

		const _corners = {
			tl: BET_PANEL_CORNER_RADIUS,
			tr: BET_PANEL_CORNER_RADIUS,
			bl: 0,
			br: 0,
		};

		this._betPanelBgMask = this.make.graphics({ add: false });
		this._betPanelBgMask.fillStyle(0xffffff);
		this._betPanelBgMask.fillRoundedRect(
			-BET_PANEL_WIDTH / 2,
			-BET_PANEL_HEIGHT / 2,
			BET_PANEL_WIDTH,
			BET_PANEL_HEIGHT,
			_corners,
		);
		this._betPanelBgMask.setPosition(CX, BET_PANEL_ANCHOR_Y);

		this.betPanelBg = this.add.graphics();
		this.betPanelBg._draw = (w, h) => {
			this.betPanelBg.clear();
			this.betPanelBg.fillGradientStyle(
				0x2e1a0c,
				0x2e1a0c,
				0x050201,
				0x050201,
				0.97,
				0.97,
				0.97,
				0.97,
			);
			this.betPanelBg.fillRect(-w / 2, -h / 2, w, h);
			this.betPanelBg.lineStyle(2.5, BET_PANEL_BORDER_COLOR, 0.9);
			this.betPanelBg.strokeRoundedRect(-w / 2, -h / 2, w, h, _corners);
			this._betPanelBgMask.clear();
			this._betPanelBgMask.fillStyle(0xffffff);
			this._betPanelBgMask.fillRoundedRect(-w / 2, -h / 2, w, h, _corners);
			this.betPanelBg.setInteractive(
				new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
				Phaser.Geom.Rectangle.Contains,
			);
		};
		this.betPanelBg.setMask(this._betPanelBgMask.createGeometryMask());
		this.betPanelBg._draw(BET_PANEL_WIDTH, BET_PANEL_HEIGHT);
		this.betPanelBg
			.setPosition(CX, BET_PANEL_ANCHOR_Y)
			.setDepth(BET_PANEL_DEPTH)
			.setVisible(false);
		this.betPanelBg.on("pointerdown", () => {});

		this.betPanelDivider = this.add.graphics();
		this.betPanelDivider.lineStyle(1, BET_PANEL_DIVIDER_COLOR, 0.9);
		this.betPanelDivider.lineBetween(
			-BET_PANEL_DIVIDER_W / 2,
			0,
			BET_PANEL_DIVIDER_W / 2,
			0,
		);
		this.betPanelDivider
			.setPosition(CX, BET_PANEL_ANCHOR_Y + BET_PANEL_TITLE_Y_OFFSET + 22)
			.setDepth(BET_PANEL_TEXT_DEPTH - 0.1)
			.setVisible(false);

		this.betPanelAmountBg = this.add.graphics();
		this.betPanelAmountBg.fillStyle(BET_PANEL_AMOUNT_BOX_COLOR, 1);
		this.betPanelAmountBg.fillRoundedRect(
			-BET_PANEL_AMOUNT_BOX_W / 2,
			-BET_PANEL_AMOUNT_BOX_H / 2,
			BET_PANEL_AMOUNT_BOX_W,
			BET_PANEL_AMOUNT_BOX_H,
			BET_PANEL_AMOUNT_BOX_CR,
		);
		this.betPanelAmountBg
			.setPosition(CX, BET_PANEL_ANCHOR_Y + BET_PANEL_AMOUNT_Y_OFFSET)
			.setDepth(BET_PANEL_TEXT_DEPTH - 0.05)
			.setVisible(false);

		this.betPanelTitle = this.add
			.text(CX, BET_PANEL_ANCHOR_Y + BET_PANEL_TITLE_Y_OFFSET, "選擇下注金額", {
				fontSize: BET_PANEL_TITLE_FONT_SIZE,
				color: BET_PANEL_TITLE_COLOR,
				fontStyle: "bold",
				fontFamily: BET_UI_FONT,
				...BET_TEXT_OUTLINE,
			})
			.setOrigin(0.5)
			.setDepth(BET_PANEL_TEXT_DEPTH)
			.setVisible(false);

		this.betPanelAmountText = this.add
			.text(CX, BET_PANEL_ANCHOR_Y + BET_PANEL_AMOUNT_Y_OFFSET, "0", {
				fontSize: BET_PANEL_AMOUNT_FONT_SIZE,
				color: BET_PANEL_AMOUNT_COLOR,
				fontStyle: "bold",
				fontFamily: BET_UI_FONT,
				...BET_TEXT_OUTLINE,
			})
			.setOrigin(0.5)
			.setDepth(BET_PANEL_TEXT_DEPTH)
			.setVisible(false);

		this.betPanelRangeText = this.add
			.text(CX, BET_PANEL_ANCHOR_Y + BET_PANEL_RANGE_Y_OFFSET, "", {
				fontSize: BET_PANEL_HINT_FONT_SIZE,
				color: BET_PANEL_HINT_COLOR,
				fontFamily: BET_UI_FONT,
				...BET_TEXT_OUTLINE,
			})
			.setOrigin(0.5)
			.setDepth(BET_PANEL_TEXT_DEPTH)
			.setVisible(false);

		const _pillR = BET_PANEL_SLIDER_TRACK_H / 2;
		this.betPanelSliderTrack = this.add
			.graphics()
			.setDepth(BET_PANEL_TEXT_DEPTH)
			.setVisible(false);
		this.betPanelSliderTrack.fillStyle(BET_PANEL_SLIDER_TRACK_CLR, 1);
		this.betPanelSliderTrack.fillRoundedRect(
			-BET_PANEL_SLIDER_TRACK_W / 2,
			-_pillR,
			BET_PANEL_SLIDER_TRACK_W,
			BET_PANEL_SLIDER_TRACK_H,
			_pillR,
		);
		this.betPanelSliderTrack.setPosition(
			CX,
			BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
		);

		this.betPanelSliderFill = this.add
			.graphics()
			.setDepth(BET_PANEL_TEXT_DEPTH + 0.1)
			.setVisible(false);
		this.betPanelSliderFill._drawFill = (fillW) => {
			this.betPanelSliderFill.clear();
			if (fillW > 0) {
				this.betPanelSliderFill.fillStyle(BET_PANEL_SLIDER_FILL_CLR, 1);
				this.betPanelSliderFill.fillRoundedRect(
					0,
					-_pillR,
					Math.max(fillW, BET_PANEL_SLIDER_TRACK_H),
					BET_PANEL_SLIDER_TRACK_H,
					_pillR,
				);
			}
		};
		this.betPanelSliderFill.setPosition(
			CX - BET_PANEL_SLIDER_TRACK_W * 0.5,
			BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
		);

		this.betPanelSliderHit = this.add
			.rectangle(
				CX,
				BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
				BET_PANEL_SLIDER_TRACK_W,
				BET_PANEL_SLIDER_HIT_H,
				0xffffff,
				0.001,
			)
			.setDepth(BET_PANEL_TEXT_DEPTH + 0.2)
			.setVisible(false);
		this.betPanelSliderHit.setInteractive({ useHandCursor: true });
		this.betPanelSliderHit.on("pointerdown", (pointer) => {
			this._handleBetSliderPointer(pointer?.worldX ?? pointer?.x ?? CX);
		});

		this.betPanelSliderKnob = this.add
			.circle(
				CX,
				BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
				BET_PANEL_SLIDER_KNOB_R,
				BET_PANEL_KNOB_CLR,
				1,
			)
			.setStrokeStyle(2.5, BET_PANEL_KNOB_STROKE_CLR, 1)
			.setDepth(BET_PANEL_TEXT_DEPTH + 0.3)
			.setVisible(false);
		this.betPanelSliderKnob.setInteractive({ useHandCursor: true });
		this.betPanelSliderKnob.on("pointerdown", () => {});
		this.input.setDraggable(this.betPanelSliderKnob, true);
		this.betPanelSliderKnob.on("drag", (_pointer, dragX) => {
			this._handleBetSliderPointer(dragX);
		});

		this.betPanelMinusBtn = createGradientButton(this, {
			x:
				CX -
				BET_PANEL_AMOUNT_BOX_W / 2 -
				BET_PANEL_STEP_BTN_GAP -
				BET_PANEL_STEP_BTN_SIZE / 2,
			y: BET_PANEL_ANCHOR_Y + BET_PANEL_AMOUNT_Y_OFFSET,
			width: BET_PANEL_STEP_BTN_SIZE,
			height: BET_PANEL_STEP_BTN_SIZE,
			cornerRadius: 10,
			topColor: 0x3a1c08,
			bottomColor: 0x140804,
			borderColor: BET_PANEL_QUICK_STROKE_CLR,
			label: "−",
			labelStyle: { fontSize: "36px", color: "#ecd5b5" },
			depth: BET_PANEL_TEXT_DEPTH + 0.35,
			onClick: () => this._stepBetValue(-1),
			visible: false,
		});

		this.betPanelPlusBtn = createGradientButton(this, {
			x:
				CX +
				BET_PANEL_AMOUNT_BOX_W / 2 +
				BET_PANEL_STEP_BTN_GAP +
				BET_PANEL_STEP_BTN_SIZE / 2,
			y: BET_PANEL_ANCHOR_Y + BET_PANEL_AMOUNT_Y_OFFSET,
			width: BET_PANEL_STEP_BTN_SIZE,
			height: BET_PANEL_STEP_BTN_SIZE,
			cornerRadius: 10,
			topColor: 0x3a1c08,
			bottomColor: 0x140804,
			borderColor: BET_PANEL_QUICK_STROKE_CLR,
			label: "+",
			labelStyle: { fontSize: "36px", color: "#ecd5b5" },
			depth: BET_PANEL_TEXT_DEPTH + 0.35,
			onClick: () => this._stepBetValue(1),
			visible: false,
		});

		this.betQuickButtons = [];
		const quickStep = BET_PANEL_QUICK_W + BET_PANEL_QUICK_GAP;
		const totalQuick = BET_PANEL_QUICK_AMOUNTS.length;

		// Center the entire row (quick buttons + confirm) around CX
		const totalRowW =
			totalQuick * BET_PANEL_QUICK_W +
			totalQuick * BET_PANEL_QUICK_GAP +
			BET_PANEL_CONFIRM_W;
		const rowLeftX = CX - totalRowW / 2;
		const confirmXOffset = totalRowW / 2 - BET_PANEL_CONFIRM_W / 2;
		this._betConfirmXOffset = confirmXOffset;

		BET_PANEL_QUICK_AMOUNTS.forEach((amount, index) => {
			const x = rowLeftX + BET_PANEL_QUICK_W / 2 + index * quickStep;
			const y = BET_PANEL_ANCHOR_Y + BET_PANEL_QUICK_Y_OFFSET;
			const button = createGradientButton(this, {
				x,
				y,
				width: BET_PANEL_QUICK_W,
				height: BET_PANEL_QUICK_H,
				cornerRadius: BET_PANEL_QUICK_CR,
				topColor: 0x3a1c08,
				bottomColor: 0x140804,
				borderColor: BET_PANEL_QUICK_STROKE_CLR,
				label: formatAmount(amount),
				labelStyle: { fontSize: "30px", color: "#ecd5b5" },
				depth: BET_PANEL_TEXT_DEPTH + 0.35,
				onClick: () => this._applyBetQuickChoice(amount),
				visible: false,
			});
			this.betQuickButtons.push({ amount, button });
		});

		const coverHalf = Math.max(
			BET_PANEL_WIDTH / 2,
			totalRowW / 2 + BET_PANEL_COVER_PADDING_X,
		);
		const coverLeft = -coverHalf;
		const coverRight = coverHalf;
		this.betPanelBg._draw(coverRight - coverLeft, BET_PANEL_HEIGHT);

		this.betPanelConfirm = createGradientButton(this, {
			x: CX + confirmXOffset,
			y: BET_PANEL_ANCHOR_Y + BET_PANEL_QUICK_Y_OFFSET,
			width: BET_PANEL_CONFIRM_W,
			height: BET_PANEL_CONFIRM_H,
			cornerRadius: BET_PANEL_CONFIRM_CR,
			topColor: 0x3db428,
			bottomColor: 0x145018,
			borderColor: 0x1aed30,
			label: "確認",
			labelStyle: { fontSize: "28px", color: "#ffffff" },
			depth: BET_PANEL_TEXT_DEPTH + 0.45,
			onClick: () => this._confirmBet(),
			visible: false,
		});
	}

	_normalizeBetSelected(value) {
		const n = Math.floor(Number(value));
		if (!Number.isFinite(n)) return this.betPanelMin;
		return Phaser.Math.Clamp(n, this.betPanelMin, this.betPanelMax);
	}

	_stepBetValue(dir) {
		this.betSelectedValue = this._normalizeBetSelected(
			this.betSelectedValue + dir * BET_PANEL_STEP,
		);
		this._updateBetPanelVisual();
	}

	_handleBetSliderPointer(pointerX) {
		const span = this.betPanelMax - this.betPanelMin;
		const sliderStartX = CX - BET_PANEL_SLIDER_TRACK_W * 0.5;
		const progress = Phaser.Math.Clamp(
			(Number(pointerX) - sliderStartX) / BET_PANEL_SLIDER_TRACK_W,
			0,
			1,
		);
		this.betSelectedValue = this._normalizeBetSelected(
			this.betPanelMin + span * progress,
		);
		this._updateBetPanelVisual();
	}

	_applyBetQuickChoice(amount) {
		this.betSelectedValue = this._normalizeBetSelected(amount);
		this._updateBetPanelVisual();
	}

	_updateBetPanelVisual() {
		this.betPanelAmountText.setText(formatAmount(this.betSelectedValue));
		this.betPanelRangeText.setText(
			`範圍 ${formatAmount(this.betPanelMin)} ~ ${formatAmount(this.betPanelMax)}`,
		);

		const span = this.betPanelMax - this.betPanelMin;
		const progress =
			span > 0
				? Phaser.Math.Clamp(
						(this.betSelectedValue - this.betPanelMin) / span,
						0,
						1,
					)
				: 0;
		const fillW = Math.floor(BET_PANEL_SLIDER_TRACK_W * progress);
		const sliderStartX = CX - BET_PANEL_SLIDER_TRACK_W * 0.5;
		this.betPanelSliderFill.setPosition(
			sliderStartX,
			BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
		);
		this.betPanelSliderFill._drawFill(fillW);
		this.betPanelSliderKnob.setPosition(
			sliderStartX + BET_PANEL_SLIDER_TRACK_W * progress,
			BET_PANEL_ANCHOR_Y + BET_PANEL_SLIDER_Y_OFFSET,
		);

		this.betQuickButtons.forEach(({ amount, button }) => {
			const clamped = this._normalizeBetSelected(amount);
			const isActive = clamped === this.betSelectedValue;
			button.setGradient(
				isActive ? 0x7a4010 : 0x3a1c08,
				isActive ? 0x3a1808 : 0x140804,
				isActive ? BET_PANEL_BORDER_COLOR : BET_PANEL_QUICK_STROKE_CLR,
			);
		});
	}

	openBetPanel(min, max) {
		this.betPanelMin = min;
		this.betPanelMax = max;
		this.betSelectedValue = this._normalizeBetSelected(min);
		this.isBetPanelOpen = true;

		[
			this.betPanelOverlay,
			this.betPanelBg,
			this.betPanelDivider,
			this.betPanelAmountBg,
			this.betPanelTitle,
			this.betPanelAmountText,
			this.betPanelRangeText,
			this.betPanelSliderTrack,
			this.betPanelSliderFill,
			this.betPanelSliderHit,
			this.betPanelSliderKnob,
		].forEach((o) => o?.setVisible(true));
		this.betPanelMinusBtn?.setVisible(true);
		this.betPanelPlusBtn?.setVisible(true);
		this.betPanelConfirm?.setVisible(true);
		this.betPanelConfirm?.setEnabled(true);
		this.betQuickButtons.forEach(({ button }) => {
			button.setVisible(true);
			button.setEnabled(true);
		});
		this.betPanelSliderHit.setInteractive({ useHandCursor: true });
		this.input.setDraggable(this.betPanelSliderKnob, true);
		this._updateBetPanelVisual();
	}

	_closeBetPanel() {
		this.isBetPanelOpen = false;
		this.betSelectedValue = 0;
		[
			this.betPanelOverlay,
			this.betPanelBg,
			this.betPanelDivider,
			this.betPanelAmountBg,
			this.betPanelTitle,
			this.betPanelAmountText,
			this.betPanelRangeText,
			this.betPanelSliderTrack,
			this.betPanelSliderFill,
			this.betPanelSliderHit,
			this.betPanelSliderKnob,
		].forEach((o) => o?.setVisible(false));
		this.betPanelMinusBtn?.setVisible(false);
		this.betPanelPlusBtn?.setVisible(false);
		this.betPanelConfirm?.setVisible(false);
		this.betQuickButtons?.forEach(({ button }) => button.setVisible(false));
		this.betPanelSliderHit?.disableInteractive();
		this.betPanelSliderKnob?.disableInteractive();
	}

	_confirmBet() {
		const amount = this.betSelectedValue;
		this._closeBetPanel();
		// TODO: wire up Big Two bet action here, e.g.:
		// this.app?.sendPacket?.("big_two_bet", { amount });
	}

	// ─── COMBO MODAL ──────────────────────────────────────────────────

	_buildComboModal() {
		const panelW = VIEW_W;
		const btnW =
			(panelW -
				2 * BT_COMBO_PANEL_PADDING -
				(BT_COMBO_LABELS.length - 1) * BT_COMBO_BTN_GAP) /
			BT_COMBO_LABELS.length;
		const rowLeftX = CX - panelW / 2 + BT_COMBO_PANEL_PADDING;
		const panelY =
			BT_ACTION_ROW_Y -
			BT_ACTION_BUTTON_HEIGHT / 2 -
			BT_COMBO_PANEL_GAP_Y -
			BT_COMBO_PANEL_H / 2;
		const _corners = {
			tl: BT_COMBO_PANEL_CR,
			tr: BT_COMBO_PANEL_CR,
			bl: BT_COMBO_PANEL_CR,
			br: BT_COMBO_PANEL_CR,
		};

		const maskGfx = this.make.graphics({ add: false });
		maskGfx.fillStyle(0xffffff);
		maskGfx.fillRoundedRect(
			-panelW / 2,
			-BT_COMBO_PANEL_H / 2,
			panelW,
			BT_COMBO_PANEL_H,
			_corners,
		);
		maskGfx.setPosition(CX, panelY);
		this._comboMaskGfx = maskGfx; // 存起來供 applyLayout 一起定位/縮放（否則遮罩不跟隨面板 → 圓角錯位）

		this.comboModalBg = this.add.graphics();
		this.comboModalBg.fillGradientStyle(
			0x2e1a0c,
			0x2e1a0c,
			0x050201,
			0x050201,
			0.97,
			0.97,
			0.97,
			0.97,
		);
		this.comboModalBg.fillRect(
			-panelW / 2,
			-BT_COMBO_PANEL_H / 2,
			panelW,
			BT_COMBO_PANEL_H,
		);
		this.comboModalBg.lineStyle(2.5, BET_PANEL_BORDER_COLOR, 0.9);
		this.comboModalBg.strokeRoundedRect(
			-panelW / 2,
			-BT_COMBO_PANEL_H / 2,
			panelW,
			BT_COMBO_PANEL_H,
			_corners,
		);
		this.comboModalBg.setMask(maskGfx.createGeometryMask());
		this.comboModalBg
			.setPosition(CX, panelY)
			.setDepth(BT_COMBO_DEPTH - 1)
			.setVisible(false);

		this.selectedComboIndex = -1;

		const btnY = panelY;
		this.comboModalButtons = BT_COMBO_LABELS.map((label, index) => {
			const x = rowLeftX + btnW / 2 + index * (btnW + BT_COMBO_BTN_GAP);
			return createGradientButton(this, {
				x,
				y: btnY,
				width: btnW,
				height: BT_COMBO_BTN_H,
				cornerRadius: BET_PANEL_QUICK_CR,
				topColor: 0x3a1c08,
				bottomColor: 0x140804,
				borderColor: BET_PANEL_QUICK_STROKE_CLR,
				label,
				labelStyle: { fontSize: "28px", color: "#ecd5b5" },
				depth: BT_COMBO_DEPTH,
				onClick: () => {}, // Feature 2：牌型鈕改為被動標籤（不處理點擊；_applyComboFind 保留供未來 選牌 模式）
				visible: false,
			});
		});
	}

	// 牌型鈕可用性：輪到英雄、且該牌型「湊得出且能壓過牌堆」（_findCombo 有解）才啟用（亮）；
	// 否則灰底停用（setEnabled(false) → 半透明）。停用態點擊由 createGradientButton 自動播錯誤音。
	// 每次 _renderActionUI 依當前手牌/牌堆更新；_findCombo 為純函數（無副作用），可安全重複呼叫。
	_refreshComboAvail(canPlay) {
		this.comboModalButtons?.forEach((btn, i) => {
			const hasCombo = canPlay && (this._findCombo(i)?.length ?? 0) > 0;
			btn.setEnabled?.(hasCombo);
		});
	}

	_setComboActive(index) {
		this.selectedComboIndex = index;
		this.comboModalButtons?.forEach((btn, i) => {
			const isActive = i === index;
			btn.setGradient(
				isActive ? 0x7a4010 : 0x3a1c08,
				isActive ? 0x3a1808 : 0x140804,
				isActive ? BET_PANEL_BORDER_COLOR : BET_PANEL_QUICK_STROKE_CLR,
			);
		});
	}

	// 出牌按鈕外觀：英雄回合且選取牌為可壓過牌堆的合法組合（_selectionArmed）才亮，否則灰底停用。
	_updatePlayArmed() {
		const btn = this.btActionButtons?.play;
		if (!btn || !btn.visible) return;
		const armed = Boolean(this._selectionArmed);
		btn._inactive = !armed;
		if (armed) btn.clearTint();
		else btn.setTint(BT_ACTION_INACTIVE_TINT);
	}

	// 點牌型按鈕：高亮 label，並自動選出能壓過牌堆的最小該牌型組合（無則紅字提示）
	_applyComboFind(typeIndex) {
		this._setComboActive(typeIndex);
		const idx = this._findCombo(typeIndex);
		if (!idx || idx.length === 0) {
			playWrongClick(this); // 該牌型無可出組合（沒有或壓不過牌堆）→ 播錯誤音（音量跟隨 SFX 設定）
			this.selectedIndices.clear();
			this._comboArmed = false; // 找不到 → 出牌按鈕停用
			this._refreshCardVisuals();
			this._updatePlayArmed();
			this.comboInfoText
				?.setText(`沒有可出的${BT_COMBO_LABELS[typeIndex]}`)
				.setColor("#ff5555")
				.setVisible(true);
			return;
		}
		this.selectedIndices = new Set(idx);
		this._comboArmed = true; // 牌型鈕選到合法組合 → 啟用出牌
		this._refreshCardVisuals();
		this._updatePlayArmed();
		this.comboInfoText
			?.setText(this._detectCombo(this.selectedIndices))
			.setColor("#ffe88a")
			.setVisible(true);
	}

	openComboModal() {
		this.selectedComboIndex = -1;
		this.comboModalBg?.setVisible(true);
		this.comboModalButtons?.forEach((btn) => {
			btn.setVisible(true);
			btn.setGradient(0x3a1c08, 0x140804, BET_PANEL_QUICK_STROKE_CLR);
		});
	}

	_closeComboModal() {
		this.selectedComboIndex = -1;
		this.comboModalBg?.setVisible(false);
		this.comboModalButtons?.forEach((btn) => btn.setVisible(false));
	}
}
