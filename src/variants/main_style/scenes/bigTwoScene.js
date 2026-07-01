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

// 對手牌背（扇形顯示）
const OPP_CARD_MAX = 13;
const OPP_FAN_CARD_W = 36;
const OPP_FAN_CARD_H = 50;
const OPP_CARDS_Y_OFFSET = 245;
const OPP_FAN_RADIUS = 108;
const OPP_FAN_ANGLE_SPAN = 78; // degrees total
const OPP_FAN_BADGE_R = 16;
const BADGE_W = 50; // 張數徽章膠囊寬（容得下「13張」，與倒數圓形計時器區隔）
const BADGE_H = 30;
const BADGE_W_HERO = 56; // 底部中央家：較大膠囊，字較大、上下內距較多
const BADGE_H_HERO = 44;
// 過牌動作標籤（沿用德州撲克 game_table 圖集的 brand_check frame，不另存進 big_two_game_table）
const BT_ACTION_BADGE_DEPTH = 30; // 疊在頭像/張數徽章上方（短暫顯示）
const BT_ACTION_BADGE_SCALE = 0.48; // 與德州撲克相同
const BT_ACTION_BADGE_DY = -10; // 相對頭像中心的垂直位移（負為上移，可微調）

// 英雄手牌
const HERO_HAND_Y = 1351; // VIEW_H - HERO_CARD_H/2 - 24 (≈1.5rem bottom margin)
const HERO_HAND_X_OFFSET = -15;
const HERO_CARD_W = 84;
const HERO_CARD_H = 118;
const HERO_CARD_GAP = -34;
const HERO_CARD_LIFT = 28;
const HERO_HAND_START_X =
	CX +
	HERO_HAND_X_OFFSET -
	(13 * (HERO_CARD_W + HERO_CARD_GAP)) / 2 +
	HERO_CARD_W / 2;

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
const CENTER_CARD_GAP = -22; // 負值 → 中央出牌略為交疊（slight stack）
const CENTER_PLAY_Y = 630;
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
const BT_ACTION_BUTTON_ORDER = ["pass", "play", "select"];
const BT_ACTION_ATLAS = "big_two_game_table";
const BT_ACTION_ROW_Y = 1180; // 上移 30px（原 1210）：拉開操作按鈕下緣與「選中上抬」手牌的間距（約 4px→34px）。牌型面板 Y 由此推得，會一起上移。
// 過牌/出牌/選牌按鈕縮小（190×124 → 155×100）：原本按鈕下緣（y≈1272）會蓋住「選中上抬」的手牌
// （上抬後牌頂 y≈1264）。縮小後下緣升到 y≈1260，讓出空間、不再蓋到牌。牌型面板 Y 由按鈕高度推得，會自動跟隨。
const BT_ACTION_BUTTON_WIDTH = 155;
const BT_ACTION_BUTTON_HEIGHT = 100;
const BT_ACTION_BUTTON_GAP = 10;
const BT_ACTION_BUTTON_DEPTH = 60;
const BT_ACTION_INACTIVE_TINT = 0x444444; // 停用態灰底（同德州 ACTION_BUTTON_INACTIVE_TINT）

// 牌型選擇 Modal（出現在操作按鈕正上方）
const BT_COMBO_LABELS = ["單", "一對", "順子", "葫蘆", "鐵支", "同花順"];
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
const RESULT_COL_RANK_X = -220; // 欄位 x（相對彈窗中心 cx，與表頭一致）
const RESULT_COL_NAME_X = -70;
const RESULT_COL_REM_X = 230;
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
		this._btTurnPromptActive = false; // 目前是否正處於「英雄出牌回合」（用來只在回合開始播一次出牌語音）
		this._resultRowObjs = []; // 本局結果彈窗的動態列物件（表頭＋各列）
		this._lastResult = null; // 目前顯示中的結果資料（供 resize 重建）
		this.lastShownHandKey = null; // 已顯示過結算的 `${table_id}|${hand_id}`，real/synth 共用去重
		this.lastHeroCardsVer = 0;
		this.lastLastPlayVer = 0;
		this._comboArmed = false; // 出牌按鈕是否已由牌型鈕選到合法組合而啟用
		this._handReadySent = false; // 本次等待下一局是否已送出 hand_ready（每局一次）
		this._resultTimer = null;
		this.countdownSfxSound = null;
		this.lastCountdownBeepSecond = null;
		this.bgm = null;
		this.soundSettingsPanel = null;
		this._dealAnimating = false;
		this._dealRunId = 0;
		this.nextHandCountdownEnd = 0;
		this._centerFlyImages = [];
		this.lastHeroCardCount = 0;
		// 本局英雄是否有被發牌（＝有打這局）；手局結束「是否繼續遊戲」選單只給有打這局的人看。
		// 發牌時（_checkHeroCards isNewDeal）設 true；選單按下或離桌/換桌時設 false。
		this._heroPlayedCurrentHand = false;
	}

	create() {
		this.useResponsiveLayout = true;
		this.app = window.__APP__;
		this.store = this.app?.store;
		const s0 = this.store?.getState?.() || {};
		this.lastHandResultVer = Number(s0.bigTwoHandResultVersion ?? 0);
		this.lastHeroCardsVer = Number(s0.bigTwoHeroCardsVersion ?? 0);
		this.lastLastPlayVer = Number(s0.bigTwoLastPlayVersion ?? 0);

		this._buildBg();
		this._buildSeats();
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

		// 大老二「請選牌出牌」語音：於此場景自行載入（不動共用 bootScene / voice.js），
		// 英雄輪到出牌（回合開始）時播一次。載入完成前若剛好輪到，_playBtPrompt 會因 cache 未就緒而略過。
		if (!this.cache.audio.exists(BT_PLAY_PROMPT_KEY)) {
			this.load.audio(
				BT_PLAY_PROMPT_KEY,
				"assets/variants/main_style/audio/voice/play_bt.mp3",
			);
			this.load.start();
		}

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

		this.unsubscribe = this.store?.subscribe((state) => {
			this.state = state;
			this.renderState();
		});

		this.countdownTicker = this.time.addEvent({
			delay: 120,
			loop: true,
			callback: () => {
				this._renderCountdown();
				this._refreshNextHandCountdown();
			},
		});

		this.events.once("shutdown", () => {
			this.unsubscribe?.();
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
					fontSize: "16px",
					color: "#ffffff",
					fontStyle: "bold",
				})
				.setOrigin(0.5)
				.setDepth(26)
				.setVisible(false);

			// 對手牌背圖片組（扇形）
			const cardBacks = [];
			if (!isHero) {
				for (let c = 0; c < OPP_CARD_MAX; c++) {
					const cb = this.add
						.image(
							0,
							pos.y + OPP_CARDS_Y_OFFSET,
							"big_two_game_table",
							"card_back",
						)
						.setDisplaySize(OPP_FAN_CARD_W, OPP_FAN_CARD_H)
						.setDepth(20 + c * 0.01)
						.setVisible(false);
					cardBacks.push(cb);
				}
			}
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
				cardBacks,
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
	}

	_buildHeroHand() {
		this.heroCardImages = [];
		this.selectedIndices = new Set();
		for (let i = 0; i < 13; i++) {
			const lx = HERO_HAND_START_X + i * (HERO_CARD_W + HERO_CARD_GAP);
			const img = this.add
				.image(lx, HERO_HAND_Y, "playing_cards_element", "2c")
				.setDisplaySize(HERO_CARD_W, HERO_CARD_H)
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

		this.modalTitleLabel = this.add
			.image(CX, CY - MODAL_H / 2, "game_table", "title_label")
			.setOrigin(0.5)
			.setDisplaySize(280, 98)
			// 須高於乾淨金色內面板（MODAL_PNL_D + 0.6）與列底板（+0.7），否則標題橫幅下緣會被面板蓋住
			.setDepth(MODAL_PNL_D + 0.8)
			.setVisible(false);

		this.modalTitle = this.add
			.text(CX, CY - MODAL_H / 2 + 8, "本局結果", {
				fontFamily: "sans-serif",
				fontSize: "30px",
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
				CY + MODAL_H / 2 - 108,
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

			const pivot = sc(lp.x, lp.y + OPP_CARDS_Y_OFFSET);
			const n = sv.cardBacks.length;
			const halfSpanRad = Phaser.Math.DegToRad(OPP_FAN_ANGLE_SPAN / 2);
			sv.cardBacks.forEach((cb, c) => {
				const angleDeg =
					n > 1
						? -OPP_FAN_ANGLE_SPAN / 2 + (c * OPP_FAN_ANGLE_SPAN) / (n - 1)
						: 0;
				const ar = Phaser.Math.DegToRad(angleDeg);
				cb.setPosition(
					pivot.x + OPP_FAN_RADIUS * s * Math.sin(ar),
					pivot.y - OPP_FAN_RADIUS * s * Math.cos(ar),
				)
					.setDisplaySize(OPP_FAN_CARD_W * s, OPP_FAN_CARD_H * s)
					.setRotation(ar);
			});
			// 計數徽章：扇形右下角
			const badgeX =
				pivot.x +
				(OPP_FAN_RADIUS * Math.sin(halfSpanRad) + OPP_FAN_BADGE_R + 3) * s;
			const badgeY =
				pivot.y -
				(OPP_FAN_RADIUS * Math.cos(halfSpanRad) - OPP_FAN_BADGE_R) * s;
			// 底部中央家（vi 0，觀戰時）字體較大；膠囊本身已用較大尺寸繪製，縮放一致即可
			const badgeFontPx = Math.round((vi === 0 ? 19 : 16) * s);
			sv.cardCountBadgeBg?.setPosition(badgeX, badgeY).setScale(s);
			sv.cardCountBadge
				.setPosition(badgeX, badgeY)
				.setFontSize(`${badgeFontPx}px`);
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
		this.heroCardImages.forEach((img, i) => {
			const lx = HERO_HAND_START_X + i * (HERO_CARD_W + HERO_CARD_GAP);
			const sel = this.selectedIndices.has(i);
			const sp = sc(lx, HERO_HAND_Y - (sel ? HERO_CARD_LIFT : 0));
			img
				.setPosition(sp.x, sp.y)
				.setDisplaySize(HERO_CARD_W * s, HERO_CARD_H * s);
		});

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
		this.modalTitleLabel?.setPosition(cx, mt).setDisplaySize(280 * s, 98 * s);
		this.modalTitle?.setPosition(cx, mt + 8 * s);
		this.modalHint?.setPosition(cx, oy + (CY + MODAL_H / 2 - 108) * s);
		this.modalConfirmBtn?.setPosition?.(cx, oy + (CY + MODAL_H / 2 - 46) * s);
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
	}

	// 操作按鈕（過牌/出牌/選牌）＋牌型面板的響應式定位：與手牌相同用 sc()（含 oy 置中位移與 s 高度壓縮），
	// 讓整組跟著手牌一起縮放/位移。修正 iOS/手機瀏覽器上按鈕蓋住手牌的問題。僅動大老二自身物件，不影響撲克。
	_layoutActionCluster(s, ox, oy) {
		const sc = (lx, ly) => ({ x: ox + lx * s, y: oy + ly * s });

		// 三顆圖集操作按鈕（依 BT_ACTION_BUTTON_ORDER 橫排；與 _buildActionBtns 的座標計算一致）
		const order = BT_ACTION_BUTTON_ORDER.filter((a) => this.btActionButtons?.[a]);
		const totalW =
			order.length * BT_ACTION_BUTTON_WIDTH +
			(order.length - 1) * BT_ACTION_BUTTON_GAP;
		order.forEach((a, i) => {
			const dx =
				CX -
				totalW / 2 +
				BT_ACTION_BUTTON_WIDTH / 2 +
				i * (BT_ACTION_BUTTON_WIDTH + BT_ACTION_BUTTON_GAP);
			const p = sc(dx, BT_ACTION_ROW_Y);
			this.btActionButtons[a]
				.setPosition(p.x, p.y)
				.setDisplaySize(
					BT_ACTION_BUTTON_WIDTH * s,
					BT_ACTION_BUTTON_HEIGHT * s,
				);
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
		// 之上，蓋掉共用框金色填滿的混濁下緣（0x9a4810），仍露出外圈 5px 金邊與外緣高光（＝撲克外觀）。
		this.modalPanelGfx.clear();
		this.modalPanelGfx.fillGradientStyle(
			0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97,
		);
		this.modalPanelGfx.fillRoundedRect(l, t, pw, ph, cr);
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
				this._setHandEndMenuVisible(false);
				this.app?.sendPacket?.("leave_room", {});
			},
		});
	}

	_setHandEndMenuVisible(v) {
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

	// 深紅漸層面板 + 金框（比照德州撲克 0x680c15 → 0x170202）。每幀/resize 依縮放重畫。
	_drawHandEndMenu(cx, cy, s) {
		if (!this.heMenuPanelGfx) return;
		const pw = HE_W * s, ph = HE_H * s, cr = HE_CR * s;
		const l = cx - pw / 2, t = cy - ph / 2;
		this.heMenuBorderGfx.clear();
		drawEnhancedBorder(this.heMenuBorderGfx, l, t, pw, ph, cr);
		this.heMenuPanelGfx.clear();
		this.heMenuPanelGfx.fillGradientStyle(
			0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97,
		);
		this.heMenuPanelGfx.fillRoundedRect(l, t, pw, ph, cr);
	}

	// 現任中央牌：依牌數置中排列於 CENTER_PLAY_Y（不旋轉、在最前）。
	_positionCenterSet(images, count) {
		const s = this._s ?? 1,
			ox = this._ox ?? 0,
			oy = this._oy ?? 0;
		const n = count;
		if (n <= 0 || images.length !== n) return;
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
		if (secs > 0 && this.nextHandCountdownEnd <= 0) {
			this.nextHandCountdownEnd = Date.now() + secs * 1000;
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
		// 入座且等待下一局（人數已足）→ 自動送出 hand_ready 確認；每局一次，伺服器仍可拒絕
		const seated =
			!this.state?.isSpectator && Number(this.state?.heroSeat ?? -1) >= 0;
		if (seated && !this._handReadySent) {
			this._handReadySent = true;
			this.app?.sendPacket?.("hand_ready", {});
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
			const specNextHand =
				Boolean(this.state?.isSpectator) &&
				this._resultHandId != null &&
				curHid != null &&
				curHid !== this._resultHandId;
			if (tableSwitched || specNextHand) {
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
		this._refreshJoinWaitText();
		this._refreshNextHandCountdown();
		this._refreshRoomButtons();
		this._refreshHandEndMenu();
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
		const inActiveHand = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
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
		const roomBtnsVisible = !committed && !aboutToStart; // 結束/換桌是否顯示
		this.exitBtn?.setVisible(roomBtnsVisible);
		this.changeTableBtn?.setVisible(roomBtnsVisible);
		// 離座（stand_up）：只要「入座、手上無牌、非半局加入、且座位尚未滿」就顯示——桌上仍有空位時
		// 玩家尚未真正鎖定入局，應可退座（即使已達開局人數、甚至「下一局 X 秒」倒數中，只要沒坐滿）。
		// 座位坐滿（4 人）時才視為已承諾、隱藏。heroJoinedWaiting（半局加入）退座必被伺服器拒，故排除。
		this.standUpBtn?.setVisible(
			seated && !inActiveHand && !heroJoinedWaiting && !tableFull,
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
	// 非半局加入、且下一局倒數中（nextHandCountdownEnd 為未來）。進入下局鈕顯示剩餘秒數。
	// 註：續局預設由伺服器倒數結束自動進行（_refreshNextHandCountdown 仍會自動送 hand_ready）；
	//     本選單為「額外提供 離座/結束 的局間出口」，不阻擋預設續局。
	_refreshHandEndMenu() {
		const isSpectator = Boolean(this.state?.isSpectator);
		const heroSeat = Number(this.state?.heroSeat ?? -1);
		const seated = !isSpectator && heroSeat >= 0;
		const hasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
		const heroJoinedWaiting = Boolean(this.state?.heroJoinedWaiting);
		const cdEnd = this.nextHandCountdownEnd;
		const secsLeft =
			cdEnd > 0 && cdEnd > Date.now()
				? Math.max(0, Math.ceil((cdEnd - Date.now()) / 1000))
				: 0;
		const show =
			seated &&
			this._heroPlayedCurrentHand &&
			!hasCards &&
			!heroJoinedWaiting &&
			!this.isResultOpen &&
			secsLeft > 0;
		if (!show) {
			this._setHandEndMenuVisible(false);
			return;
		}
		// 選單顯示時隱藏中央「下一局 X 秒」純文字，避免與選單重疊（比照德州撲克）。
		this.preStartText?.setVisible(false);
		this.heMenuJoinBtn?.setLabel(`進入下局(${secsLeft})`);
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
				sv.cardBacks.forEach((c) => c.setVisible(false));
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
					const show = rem > 0 ? Math.min(rem, 13) : 13;
					sideCol.forEach((cb, c) => cb.setVisible(c < show));
					// 底部水平列（vi 0）：張數會隨出牌變動，需在每次渲染依目前張數重新置中（applyLayout 只在 resize 觸發）
					if (vi === 0) {
						const s = this._s ?? 1;
						sideCol.forEach((cb, c) => {
							if (c < show) {
								const pos = this._sideColCardPos(0, c);
								cb.setPosition(pos.x, pos.y).setDisplaySize(
									SIDE_BACK_CARD_W * s,
									SIDE_BACK_CARD_H * s,
								);
							}
						});
					}
				} else {
					sideCol.forEach((cb) => cb.setVisible(false));
				}
			}
			// 座上英雄（vi 0 非觀戰）：底部水平牌背列與張數徽章必須隱藏（英雄顯示正面手牌；避免觀戰殘留）
			if (vi === 0 && !this.state?.isSpectator) {
				this.seat0CardBackImages?.forEach((cb) => cb.setVisible(false));
				sv.cardCountBadge?.setVisible(false);
				sv.cardCountBadgeBg?.setVisible(false);
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
				sv.cardBacks.forEach((cb) => cb.setVisible(false));
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
			// 底部中央家：膠囊較高；置中、移到牌列「下方」（避免壓到該家名字/籌碼）
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

		// 英雄回合開始（可出牌，中央顯示「請選牌出牌」）→ 播一次出牌語音；用旗標做邊緣偵測避免每幀重播。
		if (canPlay && !this._btTurnPromptActive) {
			this._btTurnPromptActive = true;
			this._playBtPrompt();
		} else if (!canPlay) {
			this._btTurnPromptActive = false;
		}

		const hasSel = this.selectedIndices.size > 0;
		// 圖集操作按鈕：開局後（手上有牌）一律顯示；輪到英雄才啟用（亮），
		// 否則灰底停用。狀態跟隨伺服器（換手/逾時時 canPlay/canPass 變 false 即自動停用）。
		const inHand = hasCards;
		const setBtnState = (btn, enabled) => {
			if (!btn) return;
			btn.setVisible(inHand);
			btn._inactive = !(inHand && enabled);
			if (inHand && enabled) btn.clearTint();
			else btn.setTint(BT_ACTION_INACTIVE_TINT);
		};
		setBtnState(this.btActionButtons?.play, canPlay && this._comboArmed); // 出牌：須用牌型鈕選到組合才啟用
		setBtnState(this.btActionButtons?.pass, canPass);
		setBtnState(this.btActionButtons?.select, canPlay || canPass);
		// 退役漸層按鈕（改用圖集按鈕）
		this.playBtn?.setVisible(false);
		this.passBtn?.setVisible(false);

		// 选牌提示文字
		if (canPlay) {
			if (hasSel) {
				const name = this._detectCombo(this.selectedIndices);
				if (!this._canBeatLastPlay(this.selectedIndices)) {
					this.comboInfoText
						?.setText(`${name}（不能壓過）`)
						.setColor("#ff5555")
						.setVisible(true);
				} else {
					this.comboInfoText
						?.setText(name)
						.setColor("#ffe88a")
						.setVisible(true);
				}
			} else {
				this.comboInfoText
					?.setText("請選牌出牌")
					.setColor("#ffe88a")
					.setVisible(true);
			}
		} else {
			this.comboInfoText?.setVisible(false);
		}

		if (!canPlay && !canPass) {
			this.selectedIndices.clear();
			this._comboArmed = false; // 換手/逾時：重置出牌啟用狀態
			this._refreshCardVisuals();
			this._closeComboModal(); // 非英雄回合：收起牌型選擇面板（選牌按鈕同時灰底停用）
		}
	}

	_playUiClick() {
		const vol = Math.max(
			0,
			Math.min(1, 0.7 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0 || !this.cache.audio.exists("ui_click")) return;
		const sfx = this.sound.add("ui_click");
		sfx.setVolume(vol);
		sfx.play();
		sfx.once("complete", () => sfx.destroy());
	}

	// 「請選牌出牌」語音：英雄輪到出牌（回合開始）時播一次（音量跟隨 SFX 輸出音量）。
	_playBtPrompt() {
		const vol = Math.max(
			0,
			Math.min(1, Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0 || !this.cache.audio.exists(BT_PLAY_PROMPT_KEY)) return;
		const sfx = this.sound.add(BT_PLAY_PROMPT_KEY);
		sfx.setVolume(vol);
		sfx.play();
		sfx.once("complete", () => sfx.destroy());
	}

	// 出牌音效：沿用既有發牌音「deal_cards」，用於牌飛入中央牌堆（與發牌動畫同一張音效）
	_playCardSfx() {
		const vol = Math.max(
			0,
			Math.min(1, 0.5 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)),
		);
		if (vol <= 0 || !this.cache.audio.exists("deal_cards")) return;
		const sfx = this.sound.add("deal_cards");
		sfx.setVolume(vol);
		sfx.play();
		sfx.once("complete", () => sfx.destroy());
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
		if (isNewDeal) {
			this._heroPlayedCurrentHand = true; // 英雄被發牌＝有打這局（供手局結束選單判斷）
			this._dealAnimation(cards.length || 13);
		} else {
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
					if (sfxVol > 0 && this.cache.audio.exists("deal_cards")) {
						const sfx = this.sound.add("deal_cards");
						sfx.setVolume(sfxVol);
						sfx.play();
						sfx.once("complete", () => sfx.destroy());
					}
					const fly = this.add
						.image(fromX, fromY, "big_two_game_table", "card_back")
						.setDisplaySize(HERO_CARD_W * s, HERO_CARD_H * s)
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

		// 動畫全部結束後解除標記
		const totalMs = seq * DEAL_CARD_STAGGER_MS + DEAL_CARD_FLY_DURATION + 80;
		this.time.delayedCall(totalMs, () => {
			if (this._dealRunId !== runId) return;
			this._dealAnimating = false;
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
			sv.cardBacks.forEach((cb, c) => cb.setVisible(c < show));
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
			this.centerLabel?.setVisible(false);
			this.centerByText?.setVisible(false);
			this.lastLastPlayVer = Number(this.state?.bigTwoLastPlayVersion ?? 0); // 吃掉版本
			return;
		}

		const v = Number(this.state?.bigTwoLastPlayVersion ?? 0);
		if (v <= this.lastLastPlayVer) return;
		this.lastLastPlayVer = v;

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

		// 出牌来源坐标（哪个玩家出的，从哪里飞过来）
		const playSeat = Number(lastPlay.seat ?? -1);
		const seatView = this.seatViews.find((sv) => sv.displaySeat === playSeat);
		let fromX = ox + CX * s;
		let fromY = oy + CY * s;
		if (seatView) {
			if (seatView.isHero) {
				fromX = ox + CX * s;
				fromY = oy + HERO_HAND_Y * s;
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
		this._playCardSfx();

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
			this.app?.playVoiceByKey?.("voice_check");
			this._showPassBadge(latestSeat); // 對手過牌：頭像顯示 brand_check 標籤
		}
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
		this._showModal(res);
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
		const players = (Array.isArray(t.players) ? t.players : [])
			.map((p) => ({
				seat: Number(p.seat),
				name: p.username ?? p.name ?? null,
				hc: Number(p.hand_count ?? p.remaining_count ?? p.hole_count ?? 0),
			}))
			.filter((p) => p.name != null);
		if (players.length === 0) return;
		// 名次：張數少者在前（贏家=0 張最前）；winner = 0 張者
		const ranked = players.slice().sort((a, b) => a.hc - b.hc);
		const winner = ranked.find((p) => p.hc === 0) ?? ranked[0];
		this.lastShownHandKey = key;
		this._showModal({
			hand_id: hid,
			table_id: t.table_id,
			winner_seat: winner ? winner.seat : -1,
			finished_seats: ranked.map((p) => p.seat),
			_synth: true, // 由快照重建（無 base_score/pot）
		});
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

		if (this.selectedIndices.has(i)) this.selectedIndices.delete(i);
		else this.selectedIndices.add(i);

		this._refreshCardVisuals();
		this._comboArmed = false; // 手動點牌不算「牌型鈕選牌」→ 出牌按鈕停用
		this._updatePlayArmed();
		const hasSel = this.selectedIndices.size > 0;
		this.playBtn?.setEnabled?.(hasSel);
		if (hasSel) {
			const name = this._detectCombo(this.selectedIndices);
			if (!this._canBeatLastPlay(this.selectedIndices)) {
				this.comboInfoText
					?.setText(`${name}（不能壓過）`)
					.setColor("#ff5555")
					.setVisible(true);
			} else {
				this.comboInfoText?.setText(name).setColor("#ffe88a").setVisible(true);
			}
		} else {
			this.comboInfoText
				?.setText("請選牌出牌")
				.setColor("#ffe88a")
				.setVisible(true);
		}
	}

	_refreshCardVisuals() {
		const s = this._s ?? 1,
			oy = this._oy ?? 0;
		this.heroCardImages.forEach((img, i) => {
			if (!img.visible) return;
			const sel = this.selectedIndices.has(i);
			img.y = oy + (HERO_HAND_Y - (sel ? HERO_CARD_LIFT : 0)) * s;
			img.setTint(sel ? 0xffff88 : 0xffffff);
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

		if (n === 1) return { count: 1, category: 1, rank: ranks[0] };
		if (n === 2)
			return new Set(ranks).size === 1
				? { count: 2, category: 2, rank: ranks[0] }
				: null;
		if (n === 3)
			return new Set(ranks).size === 1
				? { count: 3, category: 3, rank: ranks[0] }
				: null;
		if (n === 5) {
			const sorted = [...ranks].sort((a, b) => a - b);
			const top = sorted[4];
			const isStraight =
				new Set(ranks).size === 5 && sorted[4] - sorted[0] === 4; // 比照 _detectCombo（僅自然順子）
			const isFlush = new Set(suits).size === 1;
			if (isStraight && isFlush) return { count: 5, category: 8, rank: top }; // 同花順
			if (isFlush) return { count: 5, category: 5, rank: top }; // 同花
			if (isStraight) return { count: 5, category: 4, rank: top }; // 順子
			const cnt = {};
			ranks.forEach((r) => {
				cnt[r] = (cnt[r] || 0) + 1;
			});
			const entries = Object.entries(cnt); // [rankStr, occurrences]
			const quad = entries.find(([, c]) => c === 4);
			if (quad) return { count: 5, category: 7, rank: Number(quad[0]) }; // 鐵支 / 四帶一
			const triple = entries.find(([, c]) => c === 3);
			const pair = entries.find(([, c]) => c === 2);
			if (triple && pair)
				return { count: 5, category: 6, rank: Number(triple[0]) }; // 葫蘆
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

	// mine/pile 為 _evaluateCombo 結果或 null。strict=false（提示用）：平手 fail-open；
	// strict=true（快速選牌用）：須嚴格大於（點數平手由花色決定，前端不判，故只選確定能壓過者）。
	_comboBeats(mine, pile, strict = false) {
		if (!mine) return true; // 非乾淨牌型 → fail-open
		if (!pile) return true; // 無牌堆 / 無法解析 → 任何皆可
		if (mine.category >= 7 && mine.count !== pile.count) return true; // 炸彈跨張數 → fail-open
		if (mine.count !== pile.count) return false;
		if (mine.category !== pile.category) return mine.category > pile.category;
		return strict ? mine.rank > pile.rank : mine.rank >= pile.rank;
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

	// 依牌型代號（0=單,1=一對,2=順子,3=葫蘆,4=鐵支,5=同花順）找出能壓過牌堆的「最小」組合手牌 index；無則 null
	_findCombo(typeIndex) {
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
		const heroCards = this.state?.bigTwoHeroCards ?? [];
		const hand = heroCards
			.map((c, idx) => {
				const n = normalizeCard(c);
				return n ? { idx, r: RANK[n[0]], s: n[1] } : null;
			})
			.filter(Boolean);
		const pileCards = this.state?.bigTwoLastPlay?.cards ?? [];
		const pile = pileCards.length ? this._evaluateCombo(pileCards) : null;

		// 依點數分組（升序）
		const byRank = new Map();
		hand.forEach((c) => {
			if (!byRank.has(c.r)) byRank.set(c.r, []);
			byRank.get(c.r).push(c);
		});
		const ranksAsc = [...byRank.keys()].sort((a, b) => a - b);

		// 依牌型列舉候選（每個候選為 index 陣列；整體已依該牌型大小升序）
		const candidates = [];
		if (typeIndex === 0) {
			// 單
			[...hand]
				.sort((a, b) => a.r - b.r)
				.forEach((c) => candidates.push([c.idx]));
		} else if (typeIndex === 1) {
			// 一對
			ranksAsc.forEach((r) => {
				const cs = byRank.get(r);
				if (cs.length >= 2) candidates.push([cs[0].idx, cs[1].idx]);
			});
		} else if (typeIndex === 2) {
			// 順子（自然順子，lo..lo+4）
			for (let lo = 0; lo <= 8; lo++) {
				if ([0, 1, 2, 3, 4].every((k) => byRank.has(lo + k))) {
					candidates.push(
						[0, 1, 2, 3, 4].map((k) => byRank.get(lo + k)[0].idx),
					);
				}
			}
		} else if (typeIndex === 3) {
			// 葫蘆（3+2，依三條點數升序，配最小對子）
			ranksAsc.forEach((tr) => {
				if (byRank.get(tr).length < 3) return;
				const pr = ranksAsc.find((r) => r !== tr && byRank.get(r).length >= 2);
				if (pr == null) return;
				candidates.push([
					...byRank
						.get(tr)
						.slice(0, 3)
						.map((c) => c.idx),
					...byRank
						.get(pr)
						.slice(0, 2)
						.map((c) => c.idx),
				]);
			});
		} else if (typeIndex === 4) {
			// 鐵支（四條 + 最小墊牌）
			ranksAsc.forEach((qr) => {
				if (byRank.get(qr).length < 4) return;
				const kicker = hand
					.filter((c) => c.r !== qr)
					.sort((a, b) => a.r - b.r)[0];
				if (!kicker) return;
				candidates.push([
					...byRank
						.get(qr)
						.slice(0, 4)
						.map((c) => c.idx),
					kicker.idx,
				]);
			});
		} else if (typeIndex === 5) {
			// 同花順
			const found = [];
			["d", "c", "h", "s"].forEach((suit) => {
				const inSuit = new Set(
					hand.filter((c) => c.s === suit).map((c) => c.r),
				);
				for (let lo = 0; lo <= 8; lo++) {
					if ([0, 1, 2, 3, 4].every((k) => inSuit.has(lo + k))) {
						found.push({
							lo,
							idxs: [0, 1, 2, 3, 4].map(
								(k) => hand.find((c) => c.s === suit && c.r === lo + k).idx,
							),
						});
					}
				}
			});
			found.sort((a, b) => a.lo - b.lo).forEach((x) => candidates.push(x.idxs));
		}

		// 取第一個能壓過牌堆者（候選已升序 → 即最小可壓過）
		for (const idx of candidates) {
			const ev = this._evaluateCombo(idx.map((i) => heroCards[i]));
			if (this._comboBeats(ev, pile, true)) return idx; // 嚴格大於：只選確定能壓過上一手者
		}
		return null;
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
		if (sfxVol > 0 && this.cache.audio.exists("bet_chip")) {
			const sfx = this.sound.add("bet_chip");
			sfx.setVolume(sfxVol);
			sfx.play();
			sfx.once("complete", () => sfx.destroy());
		}
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
		this._comboArmed = false; // 出牌後重置啟用狀態
		this._refreshCardVisuals();
		this.playBtn?.setVisible(false);
		this.passBtn?.setVisible(false);
		this.comboInfoText?.setVisible(false);
	}

	_onPass() {
		const ar = this.state?.actionRequest;
		const actionSeq = ar?.action_seq ?? this.state?.bigTwoActionSeq;
		const payload = { action: "pass" };
		if (actionSeq != null) payload.action_seq = actionSeq;
		this.app?.sendPacket?.("player_action", payload);
		// 過牌音效（沿用「check」語音）：英雄自己過牌時即時播放（不等伺服器廣播回來）
		this.app?.playVoiceByKey?.("voice_check");
		this._showPassBadge(Number(this.state?.heroSeat ?? -1)); // 頭像顯示 brand_check 標籤
		this.selectedIndices.clear();
		this._refreshCardVisuals();
		this.playBtn?.setVisible(false);
		this.passBtn?.setVisible(false);
		this.comboInfoText?.setVisible(false);
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
		const finished = Array.isArray(result?.finished_seats)
			? result.finished_seats
			: [];
		const order = finished.length
			? finished
			: winnerSeat >= 0
				? [winnerSeat]
				: [];

		// 表頭（無底色）
		const hdrCols = [
			{ x: RESULT_COL_RANK_X, t: "名次", origin: 0 },
			{ x: RESULT_COL_NAME_X, t: "玩家", origin: 0 },
			{ x: RESULT_COL_REM_X, t: "剩餘", origin: 1 },
		];
		hdrCols.forEach((c) => {
			const t = this.add
				.text(cx + c.x * s, oy + RESULT_HDR_Y * s, c.t, {
					fontFamily: "sans-serif",
					fontSize: `${Math.round(22 * s)}px`,
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
			const rem = Number(p?.hand_count ?? p?.remaining_count ?? 0);
			const isW = seat === winnerSeat;
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
						fontSize: `${Math.round(24 * s)}px`,
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
			mk(RESULT_COL_REM_X, rem > 0 ? `剩 ${rem} 張` : "出完", 1, "#e6e6e6");
		});
	}

	_showModal(result) {
		if (this.isResultOpen) return;
		this.isResultOpen = true;
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
		if (sfxVol > 0 && this.cache.audio.exists(sfxKey)) {
			const sfx = this.sound.add(sfxKey);
			sfx.setVolume(sfxVol);
			sfx.play();
			sfx.once("complete", () => sfx.destroy());
		}
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
		this.modalConfirmBtn?.setVisible(true);

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
		this.isResultOpen = false;
		[
			this.modalOverlay,
			this.modalPanelGfx,
			this.modalBorderGfx,
			this.modalTitleLabel,
			this.modalTitle,
			this.modalHint,
		].forEach((o) => o?.setVisible(false));
		this.modalConfirmBtn?.setVisible(false);
		// 銷毀本局結果的動態列（表頭＋各列底板與文字）
		(this._resultRowObjs || []).forEach((o) => o.destroy());
		this._resultRowObjs = [];
		this._lastResult = null;

		// 觀戰者：結算彈窗（含換桌晚進場由快照重建的版本）關閉後應留在原桌繼續觀戰，
		// 不可導回遊戲大廳——否則會與換桌互相干擾、且重建彈窗每 6 秒自動關閉會造成
		// forceBackToGameLobby + enter_game 的反覆重入（畫面卡頓/換桌失效）。僅入座者收場才導回大廳。
		if (this.state?.isSpectator) return;

		const gameId = this.state?.table?.game_id || "big_two";
		this.store?.forceBackToGameLobby?.();
		this.app?.sendPacket?.("enter_game", { game_id: gameId });
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
				onClick: () => this._applyComboFind(index),
				visible: false,
			});
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

	// 出牌按鈕外觀：英雄回合且 _comboArmed 才亮，否則灰底停用（即時更新，供 _applyComboFind / _toggleCard 呼叫）
	_updatePlayArmed() {
		const btn = this.btActionButtons?.play;
		if (!btn || !btn.visible) return;
		const armed = Boolean(this._comboArmed);
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
