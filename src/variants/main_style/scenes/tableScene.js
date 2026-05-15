import { bindImageButton, createRectButton, createGradientButton, playUiClick, drawEnhancedBorder, applyGoldTitleGradient } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

import { resolveVoiceKeyByHandRank } from "../audio/voice.js";

// 畫布固定尺寸（手機版基準）
const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 1440;
const CENTER_X = 360;
const CENTER_Y = 720;

// 場景圖層深度（數字越小越底層）
const BG_DEPTH = -30;
const TABLE_DEPTH = -20;

// 全頁字型與主題色
const UI_FONT_STACK = "sans-serif";
const UI_TEXT_COLOR = "#4a2f1d";
const UI_TEXT_OUTLINE_STYLE = { stroke: "#ffffff", strokeThickness: 1 };
const BET_AMOUNT_COLOR = "#ffffff";
const BET_AMOUNT_STROKE_STYLE = { stroke: "#000000", strokeThickness: 3 };
const BET_AMOUNT_SHADOW = { offsetX: 2, offsetY: 3, color: "#000000", blur: 16, fill: true, stroke: false };
const PANEL_TEXT_OUTLINE_STYLE = { stroke: "#000000", strokeThickness: 1 };
const SEAT_NAME_COLOR = UI_TEXT_COLOR;
const SEAT_INFO_COLOR = "#F9CD73";
const SEAT_CHIPS_OUTLINE_STYLE = { stroke: SEAT_NAME_COLOR, strokeThickness: 1 };
const OVERLAY_COLOR = 0x000000;
const OVERLAY_ALPHA = 0.56;
const REBUY_PANEL_COLOR = 0x13283a;
const REBUY_PANEL_ALPHA = 0.98;
const REBUY_TITLE_COLOR = "#f0c040";
const REBUY_NUMBER_COLOR = "#ecd5b5";
const REBUY_NUMBER_ERROR_COLOR = "#ff6b6b";
const REBUY_HINT_COLOR = "#d9b98a";
const REBUY_HINT_ERROR_COLOR = "#ff6b6b";
const REBUY_CONFIRM_COLOR = 0x24583b;
const REBUY_LEAVE_COLOR = 0x5b2c2c;
const REBUY_SLIDER_TRACK_COLOR = 0x4a2a10;
const REBUY_SLIDER_FILL_COLOR = 0xecd5b5;
const REBUY_SLIDER_KNOB_COLOR = 0xfff2dd;

// 文字大小設定
const MAIN_TEXT_FONT_SIZE = "22px";
const REBUY_TEXT_FONT_SIZE = "22px";
const REBUY_NUMBER_FONT_SIZE = "54px";
const SEAT_NAME_FONT_SIZE = "28px";
const SEAT_INFO_FONT_SIZE = "24px";

const AUDIO_TOGGLE_X = 80;
const AUDIO_TOGGLE_Y = 72;
const SFX_VOICE_TOGGLE_X = 170;
const SFX_VOICE_TOGGLE_Y = 72;
const CHANGE_TABLE_BUTTON_X = 625;
const CHANGE_TABLE_BUTTON_Y = 160;
const EXIT_TABLE_BUTTON_X = 625;
const EXIT_TABLE_BUTTON_Y = 62;
const EXIT_REPLAY_BUTTON_X = 520;
const EXIT_REPLAY_BUTTON_Y = 52;
const EXIT_REPLAY_BUTTON_WIDTH = 170;
const EXIT_REPLAY_BUTTON_HEIGHT = 48;
const REPLAY_SPEED_BUTTON_X = 350;
const REPLAY_SPEED_BUTTON_Y = 52;
const REPLAY_SPEED_BUTTON_WIDTH = 150;
const REPLAY_SPEED_BUTTON_HEIGHT = 48;

// 公牌區（5 張）
const COMMUNITY_SLOT_COUNT = 5;
const COMMUNITY_CARD_SCALE = 0.44;
const COMMUNITY_CARD_Y = 635;
const COMMUNITY_CARD_X_LIST = [260, 310, 360, 410, 460];
const COMMUNITY_CARD_DEPTH = 8;
const COMMUNITY_DEAL_FLY_CARD_DEPTH = 30;
const COMMUNITY_DEAL_FLY_DURATION = 280;
const COMMUNITY_DEAL_FLIP_HALF_DURATION = 110;
const COMMUNITY_DEAL_STAGGER_MS = 130;
const COMMUNITY_DEAL_POP_DURATION = 90;
const COMMUNITY_DEAL_POP_SCALE = 1.06;
const PLAYING_CARDS_ATLAS_KEY = "playing_cards_element";
const POT_COIN_DEPTH = 9;
const POT_STACK_ITEM_SIZE = 36;
const POT_STACK_ITEM_GAP = 6;
const POT_STACK_PER_COLOR = 3;
const POT_STACK_V_STEP = 9;
const ROUND_BET_COLLECT_COIN_DEPTH = 24;
const ROUND_BET_COLLECT_TEXT_DEPTH = 24.1;
const ROUND_BET_COLLECT_DURATION = 420;

const TABLE_FRAME_WIDTH = 743;
const TABLE_FRAME_HEIGHT = 1139;
const TABLE_DISPLAY_WIDTH = Math.round(VIEW_WIDTH * 1.08);
const TABLE_DISPLAY_HEIGHT = Math.round((TABLE_DISPLAY_WIDTH * TABLE_FRAME_HEIGHT) / TABLE_FRAME_WIDTH);
const TOP_BUTTON_WIDTH = 260;
const TOP_BUTTON_HEIGHT = 104;
const ROUND_BET_COLLECT_STAGGER_MS = 65;

// 底池文字（顯示在 coin 圖示正下方）
const POT_TEXT_GAP_Y = 4;

// 桌面中央底池標籤（coin stack 頂部上方）
const CENTER_POT_Y = 345;
const CENTER_POT_BADGE_H = 50;
const CENTER_POT_BADGE_R = 25;
const CENTER_POT_DEPTH = POT_COIN_DEPTH + 2;

// 玩家操作列（棄牌/過牌/跟注/全下）
const ACTION_ROW_Y = 1330;
const ACTION_BUTTON_ORDER = ["bet", "raise", "check", "call", "allin", "fold"];
const ACTION_BUTTON_INACTIVE_DISPLAY = ["raise", "call", "allin", "fold"];
const ACTION_BUTTON_INACTIVE_TINT = 0x444444;
const ACTION_BUTTON_GAP = 10;
const ACTION_BUTTON_WIDTH = 190;
const ACTION_BUTTON_HEIGHT = 124;
const ACTION_BUTTON_LAYOUT_PADDING = 8;
const ACTION_BUTTON_DEPTH = 128;

// 加注面板（按下 raise/bet 後出現在按鈕上方）
const RAISE_PANEL_OVERLAY_DEPTH = 125;
const RAISE_PANEL_DEPTH = 126;
const RAISE_PANEL_TEXT_DEPTH = 127;
const RAISE_PANEL_WIDTH = 560;
const RAISE_PANEL_HEIGHT = 270;
const RAISE_PANEL_OFFSET_Y = 190;
const RAISE_PANEL_MARGIN_X = 16;
const RAISE_PANEL_TITLE_Y_OFFSET = -102;
const RAISE_PANEL_AMOUNT_Y_OFFSET = -58;
const RAISE_PANEL_RANGE_Y_OFFSET = -24;
const RAISE_PANEL_SLIDER_Y_OFFSET = 22;
const RAISE_PANEL_SLIDER_TRACK_WIDTH = 420;
const RAISE_PANEL_SLIDER_TRACK_HEIGHT = 10;
const RAISE_PANEL_SLIDER_HIT_HEIGHT = 54;
const RAISE_PANEL_SLIDER_KNOB_RADIUS = 17;
const RAISE_PANEL_QUICK_Y_OFFSET = 78;
const RAISE_PANEL_QUICK_GAP = 12;
const RAISE_PANEL_QUICK_WIDTH = 118;
const RAISE_PANEL_QUICK_HEIGHT = 56;
const RAISE_PANEL_CONFIRM_X_OFFSET = 184;
const RAISE_PANEL_CONFIRM_Y_OFFSET = 118;
const RAISE_PANEL_CONFIRM_WIDTH = 150;
const RAISE_PANEL_CONFIRM_HEIGHT = 54;
const RAISE_PANEL_COVER_PADDING_X = 12;
const RAISE_PANEL_COLOR = 0x1c0e06;
const RAISE_PANEL_ALPHA = 0.97;
const RAISE_PANEL_BORDER_COLOR = 0xb87830;
const RAISE_PANEL_CORNER_RADIUS = 14;
const RAISE_PANEL_TOP_ACCENT_COLOR = 0xe07820;
const RAISE_PANEL_TOP_ACCENT_HEIGHT = 5;
const RAISE_PANEL_DIVIDER_COLOR = 0x5c3218;
const RAISE_PANEL_DIVIDER_W = 460;
const RAISE_PANEL_AMOUNT_BOX_COLOR = 0x0e0804;
const RAISE_PANEL_AMOUNT_BOX_W = 230;
const RAISE_PANEL_AMOUNT_BOX_H = 52;
const RAISE_PANEL_AMOUNT_BOX_CORNER = 8;
const RAISE_PANEL_STEP_BTN_SIZE = 48;
const RAISE_PANEL_STEP_BTN_GAP = 10;
const RAISE_PANEL_SLIDER_TRACK_CLR = 0x4a2a10;
const RAISE_PANEL_SLIDER_FILL_CLR = 0xecd5b5;
const RAISE_PANEL_KNOB_CLR = 0xfff2dd;
const RAISE_PANEL_KNOB_STROKE_CLR = 0xe07820;
const RAISE_PANEL_TITLE_COLOR = "#f0d898";
const RAISE_PANEL_AMOUNT_COLOR = "#ffffff";
const RAISE_PANEL_HINT_COLOR = "#9a7040";
const RAISE_PANEL_TITLE_FONT_SIZE = "26px";
const RAISE_PANEL_AMOUNT_FONT_SIZE = "42px";
const RAISE_PANEL_HINT_FONT_SIZE = "20px";
const RAISE_PANEL_QUICK_COLOR = 0x2a1408;
const RAISE_PANEL_QUICK_ACTIVE_COLOR = 0x5a3010;
const RAISE_PANEL_QUICK_STROKE_COLOR = 0x7a4818;
const RAISE_PANEL_QUICK_CORNER_RADIUS = 10;
const RAISE_PANEL_CONFIRM_COLOR = 0x5a2e00;
const RAISE_PANEL_CONFIRM_STROKE_COLOR = 0xe07820;
const RAISE_PANEL_CONFIRM_CORNER_RADIUS = 10;
const RAISE_PANEL_QUICK_MULTIPLIERS = [2, 3, 4];

// 換桌確認彈窗
const SWITCH_CONFIRM_OVERLAY_DEPTH = 200;
const SWITCH_CONFIRM_PANEL_DEPTH = 201;
const SWITCH_CONFIRM_TEXT_DEPTH = 202;
const SWITCH_CONFIRM_PANEL_WIDTH = 520;
const SWITCH_CONFIRM_PANEL_HEIGHT = 260;
const SWITCH_CONFIRM_PANEL_COLOR = 0x1a0f06;
const SWITCH_CONFIRM_BORDER_COLOR = 0xb87830;
const SWITCH_CONFIRM_CORNER_RADIUS = 16;
const SWITCH_CONFIRM_CANCEL_COLOR = 0x3a2010;
const SWITCH_CONFIRM_OK_COLOR = 0x24583b;

// 補碼彈窗（遮罩 + 視窗 + 按鈕）
const REBUY_OVERLAY_X = CENTER_X;
const REBUY_OVERLAY_Y = CENTER_Y;
const REBUY_OVERLAY_WIDTH = VIEW_WIDTH;
const REBUY_OVERLAY_HEIGHT = VIEW_HEIGHT;
const REBUY_PANEL_X = CENTER_X;
const REBUY_PANEL_Y = CENTER_Y;
const REBUY_PANEL_WIDTH = 560;
const REBUY_PANEL_HEIGHT = 520;
const REBUY_OVERLAY_DEPTH = 118;
const REBUY_PANEL_DEPTH = 119;
const REBUY_TEXT_DEPTH = 120;
const REBUY_TITLE_X = CENTER_X;
const REBUY_TITLE_Y = 515;
const REBUY_AMOUNT_X = CENTER_X;
const REBUY_AMOUNT_Y = 610;
const REBUY_RANGE_X = CENTER_X;
const REBUY_RANGE_Y = 675;
const REBUY_SLIDER_START_X = 190;
const REBUY_SLIDER_END_X = 530;
const REBUY_SLIDER_Y = 760;
const REBUY_SLIDER_TRACK_WIDTH = REBUY_SLIDER_END_X - REBUY_SLIDER_START_X;
const REBUY_SLIDER_TRACK_HEIGHT = 10;
const REBUY_SLIDER_HIT_HEIGHT = 48;
const REBUY_SLIDER_KNOB_RADIUS = 17;
const REBUY_HINT_X = CENTER_X;
const REBUY_HINT_Y = 820;
const REBUY_CONFIRM_X = 250;
const REBUY_LEAVE_X = 470;
const REBUY_BUTTON_Y = 905;
const REBUY_BUTTON_WIDTH = 180;
const REBUY_BUTTON_HEIGHT = 64;
const REBUY_STEP_BTN_SIZE = 52;
const REBUY_STEP_BTN_OFFSET_X = 128;

// 結算面板（派彩顯示）
const HAND_RESULT_OVERLAY_DEPTH = 130;
const HAND_RESULT_PANEL_DEPTH = 131;
const HAND_RESULT_TEXT_DEPTH = 132;
const HAND_RESULT_OVERLAY_ALPHA = 0.68;
const HAND_RESULT_PANEL_X = 360;
const HAND_RESULT_PANEL_Y = 720;
const HAND_RESULT_PANEL_WIDTH = 660;
const HAND_RESULT_PANEL_HEIGHT = 980;
const HAND_RESULT_PANEL_CORNER_RADIUS = 20;
const HAND_RESULT_PANEL_BORDER_COLOR = 0xb87830;
const HAND_RESULT_TITLE_Y = 250;
const HAND_RESULT_DIVIDER_Y = 296;
const HAND_RESULT_LIST_START_Y = 385;
const HAND_RESULT_ROW_GAP = 130;
const HAND_RESULT_ROW_WIDTH = 600;
const HAND_RESULT_ROW_HEIGHT = 124;
const HAND_RESULT_ROW_CORNER = 10;
const HAND_RESULT_ROW_HERO_TOP = 0x7a1820;
const HAND_RESULT_ROW_HERO_BOT = 0x340810;
const HAND_RESULT_ROW_NORMAL_TOP = 0x350810;
const HAND_RESULT_ROW_NORMAL_BOT = 0x160206;
const HAND_RESULT_TITLE_COLOR = "#f8e4b0";
const HAND_RESULT_TEXT_COLOR = "#ffffff";
const HAND_RESULT_HINT_COLOR = "#c8a878";
const HAND_RESULT_WIN_COLOR = "#62d26f";
const HAND_RESULT_LOSE_COLOR = "#ff6b6b";
const HAND_RESULT_NEUTRAL_COLOR = "#e8d2ad";
const HAND_RESULT_FOLD_COLOR = "#b8c1cc";
const HAND_RESULT_TITLE_FONT_SIZE = "42px";
const HAND_RESULT_ROW_FONT_SIZE = "26px";
const HAND_RESULT_HINT_FONT_SIZE = "24px";
const HAND_RESULT_HINT_Y = 1135;
const HAND_RESULT_AUTO_CLOSE_SECONDS = 6;
const HAND_RESULT_TITLE_OUTLINE_STYLE = { stroke: "#3a1a00", strokeThickness: 2 };
const HAND_RESULT_NAME_X_OFFSET = -286;
const HAND_RESULT_CONTRIB_X_OFFSET = -60;
const HAND_RESULT_WIN_X_OFFSET = 80;
const HAND_RESULT_NET_X_OFFSET = 220;
const HAND_RESULT_RANK_X_OFFSET = -286;
const HAND_RESULT_CARDS_START_X_OFFSET = 18;
const HAND_RESULT_HEADER_FONT_SIZE = "22px";
const HAND_RESULT_HEADER_Y = 308;
const HAND_RESULT_NAME_Y_OFFSET = -28;
const HAND_RESULT_RANK_Y_OFFSET = 24;
const HAND_RESULT_CARDS_Y_OFFSET = 24;
const HAND_RESULT_CARD_WIDTH = 50;
const HAND_RESULT_CARD_HEIGHT = 70;
const HAND_RESULT_CARD_GAP = 3;

// 座位與頭像比例、輪到玩家特效參數
const DEFAULT_SEAT_COUNT = 6;
const DEFAULT_SEAT_START = 0;
const HERO_AVATAR_SCALE = 0.88;
const NORMAL_AVATAR_SCALE = 0.8;
const PERSPECTIVE_Y_TOP = 140;
const PERSPECTIVE_Y_BOT = 700;
const PERSPECTIVE_SCALE_MIN = 0.65;
function perspectiveAvatarScale(posY) {
  const t = Math.max(0, Math.min(1, (posY - PERSPECTIVE_Y_TOP) / (PERSPECTIVE_Y_BOT - PERSPECTIVE_Y_TOP)));
  return PERSPECTIVE_SCALE_MIN + t * (NORMAL_AVATAR_SCALE - PERSPECTIVE_SCALE_MIN);
}
const ACTIVE_AVATAR_ALPHA = 1;
const WAITING_AVATAR_ALPHA = 0.38;
const FOLDED_AVATAR_ALPHA = 0.55;
const TURN_GLOW_COLOR = 0xfff1a8;
const TURN_GLOW_OUTER_RADIUS = 76;
const TURN_GLOW_INNER_RADIUS = 62;
const TURN_GLOW_OUTER_ALPHA = 0.85;
const TURN_GLOW_INNER_ALPHA = 1;
const TURN_GLOW_FILL_ALPHA_OUTER = 0.45;
const TURN_GLOW_FILL_ALPHA_INNER = 0.14;
const TURN_GLOW_STROKE_WIDTH_OUTER = 10;
const TURN_GLOW_STROKE_WIDTH_INNER = 6;
const TURN_GLOW_PULSE_DURATION = 360;
const TURN_GLOW_SCALE_TO = 1.2;
const TURN_SWEEP_ARC_RADIUS = 86;
const TURN_SWEEP_STROKE_WIDTH = 8;
const TURN_SWEEP_STROKE_ALPHA = 1;
const TURN_SPIN_DURATION = 1800;
const TURN_SPIN_ARC_DEGREES = 360;
const TURN_JUMP_HEIGHT = 10;
const TURN_JUMP_DURATION = 280;
const TURN_COUNTDOWN_FONT_SIZE = "20px";
const TURN_COUNTDOWN_COLOR = "#ffffff";
const TURN_COUNTDOWN_ALPHA = 1;
const TURN_COUNTDOWN_BG_RADIUS = 18;
const TURN_COUNTDOWN_BG_COLOR = 0x080e18;
const TURN_COUNTDOWN_BG_ALPHA = 0.92;
const TURN_COUNTDOWN_RING_COLOR = 0xd4b97a;
const TURN_COUNTDOWN_RING_WARNING = 0xff5555;
const TURN_COUNTDOWN_RING_WIDTH = 2.5;
const TURN_COUNTDOWN_TICK_MS = 120;
const TURN_COUNTDOWN_WARNING_SECONDS = 5;
const TURN_COUNTDOWN_WARNING_COLOR = "#ff5555";
const TURN_COUNTDOWN_WARNING_BLINK_MS = 180;
const TURN_COUNTDOWN_CRITICAL_SECONDS = 3;
const TURN_AVATAR_HIGHLIGHT_TINT = 0xfff1a8;

// 發牌動畫參數（起點、落點偏移、角度、速度、音效）
const DEAL_CARD_FROM_X = 360;
const DEAL_CARD_FROM_Y = 380;
const DEAL_CARD_ATLAS_KEY = "game_table";
const DEAL_CARD_FRAME = "card_back";
const DEAL_CARD_NORMAL_SCALE = 0.36;
const DEAL_CARD_HERO_SCALE = 0.88;
const DEAL_CARD_START_ANGLE = -18;
const DEAL_CARD_FLY_DURATION = 280;
const DEAL_CARD_POP_DURATION = 80;
const DEAL_CARD_DEPTH = 27;
const DEAL_CARD_TARGET_OFFSET_X_LEFT =  56;
const DEAL_CARD_TARGET_OFFSET_X_RIGHT = 84;
// 右側三個翻轉座位手牌 X 偏移（同樣分 left/right）
const DEAL_CARD_MIRROR_TARGET_OFFSET_X_LEFT = 94;
const DEAL_CARD_MIRROR_TARGET_OFFSET_X_RIGHT = 66;
const DEAL_CARD_TARGET_OFFSET_Y = 17;
// 主玩家（hero）手牌位置獨立微調
const HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT = 230;        // 手機版：靠右
const HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT = 310;       // 手機版：靠右
const HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT_DESKTOP = 230;  // 桌機版：完全靠右
const HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT_DESKTOP = 310; // 桌機版：完全靠右
const HERO_DEAL_CARD_TARGET_OFFSET_Y = 17;

// 觸控裝置偵測（與 layout.js 相同邏輯）
const IS_TOUCH_DEVICE = Boolean(
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches
);
const DEAL_CARD_MAX_HOLE_COUNT = 2;
const DEAL_CARD_BACK_FRAME_WIDTH = 130;
const DEAL_CARD_BACK_FRAME_HEIGHT = 180;
const DEAL_CARD_SFX_KEY = "deal_cards";
const DEAL_CARD_SFX_VOLUME = 0.5;
const BET_CHIP_SFX_KEY = "bet_chip";
const BET_CHIP_SFX_VOLUME = 0.55;
const CHIP_FLY_SFX_KEY = "chip_fly";
const CHIP_FLY_SFX_VOLUME = 0.6;
const ALLIN_START_SFX_KEY = "allin_start";
const ALLIN_START_SFX_VOLUME = 0.82;
const PLAYER_WIN_SFX_KEY = "player_win";
const PLAYER_LOSE_SFX_KEY = "player_lose";
const PLAYER_RESULT_SFX_VOLUME = 0.9;
const WIN_ANIMATION_SFX_KEY = "win_animation";
const WIN_ANIMATION_SFX_VOLUME = 0.9;
const WIN_SPRITE_DEPTH = 190;
const WIN_SPRITE_ATLAS = "win";
const WIN_SPRITE_ANIM_KEY = "win_logo_anim";
const WIN_SPRITE_FRAME_FIRST = 25;
const WIN_SPRITE_FRAME_LAST = 119;
const WIN_SPRITE_FPS = 36;
const WIN_SPRITE_SIZE_FACTOR = 0.65;
const COUNTDOWN_TIMER_SFX_KEY = "countdown_timer";
const COUNTDOWN_TIMER_SFX_VOLUME = 0.4;
const DEAL_CARD_LEFT_ANGLE = -7;
const DEAL_CARD_RIGHT_ANGLE = 7;
const HOLE_CARD_FLIP_HALF_DURATION = 110;
const HOLE_CARD_FLIP_POP_DURATION = 90;
const HOLE_CARD_FLIP_POP_SCALE = 1.08;

// 座位元件圖層順序（頭像在下，文字/徽章/特效在上）
const SEAT_AVATAR_DEPTH = 21;
const SEAT_PROFILE_FRAME_DEPTH = 19;
const SEAT_PROFILE_BG_DEPTH = 18;
const SEAT_HOLE_CARD_DEPTH = 25;
const SEAT_TEXT_DEPTH = 23;
const SEAT_ROLE_BADGE_DEPTH = 23.5;
const SEAT_BET_COIN_DEPTH = 24;
const SEAT_BET_TEXT_DEPTH = 24.1;
const SEAT_ACTION_BADGE_DEPTH = 35;
const SEAT_FX_DEPTH = 17;
const SEAT_COUNTDOWN_DEPTH = 28;
const FLIP_AVATAR_INDEXES_6 = [1, 2, 3];
const AVATAR_Y_OFFSET = -32;
const PROFILE_BG_PADDING = 6;
const PROFILE_AVATAR_INNER_RATIO = 0.75;
const PROFILE_BG_COLORS = [0xffbd69, 0x79b8ff, 0xe599ff, 0x78ffbd, 0xff8da2, 0x8dff8d];

// 名字位置偏移（分一般玩家/自己；分左側樣式/右側樣式）
const NORMAL_NAME_X_OFFSET_LEFT = -72;
const NORMAL_NAME_X_OFFSET_RIGHT = 72;
const NORMAL_NAME_Y_OFFSET = 72;
const HERO_NAME_X_OFFSET_LEFT = -103;
const HERO_NAME_X_OFFSET_RIGHT = 103;
const HERO_NAME_Y_OFFSET = 95;

// 莊家/小盲/大盲徽章位置偏移（分左右樣式）
// 角色牌（庄/SB/BB）統一置於頭像正上方
const ROLE_BADGE_Y_ABOVE_HEAD = AVATAR_Y_OFFSET - 68;

// 籌碼與動作文字偏移（分左右樣式）
const NORMAL_INFO_X_OFFSET_LEFT = -72;
const NORMAL_INFO_X_OFFSET_RIGHT = 72;
const NORMAL_INFO_START_Y_OFFSET = 76;
const HERO_INFO_X_OFFSET_LEFT = -103;
const HERO_INFO_X_OFFSET_RIGHT = 103;
const HERO_INFO_START_Y_OFFSET = 100;
const NORMAL_ACTION_BADGE_Y_OFFSET = -104;
const HERO_ACTION_BADGE_Y_OFFSET = -132;
// 每個座位(0~5)各自獨立的下注金額「絕對座標」
// 座位順序對應 SEAT_POSITIONS_6：0下方、1右下、2右上、3上方、4左上、5左下
// 可手動微調：x/y 是下注金額文字座標
const SEAT_BET_AMOUNT_POSITIONS_6 = [
  { x: 250, y: 995 }, // 座位 0
  { x: 545, y: 610 },  // 座位 1
  { x: 510, y: 350 },  // 座位 2
  { x: 340, y: 315 },  // 座位 3
  { x: 190, y: 390 },  // 座位 4
  { x: 170, y: 545 },  // 座位 5
];

// 6 人桌座位座標（畫面座標；自己在下方）
const SEAT_POSITIONS_6 = [
  { x: 120, y: 975 }, // 玩家本人座位（下方）
  { x: 640, y: 675 },
  { x: 605, y: 405 },
  { x: 430, y: 215 },
  { x: 115, y: 295 },
  { x: 80, y: 605 },
];

function seatPositionsByCount() {
  return SEAT_POSITIONS_6;
}

function shouldFlipSeatAvatar(seatIndex) {
  return FLIP_AVATAR_INDEXES_6.includes(seatIndex);
}

function parseSeat(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.trunc(n);
}

function isSameSeat(a, b) {
  const sa = parseSeat(a);
  const sb = parseSeat(b);
  if (sa === null || sb === null) {
    return false;
  }
  return sa === sb;
}

function dealCardAngleByIndex(cardIndexRaw) {
  const cardIndex = Number(cardIndexRaw);
  if (Number.isFinite(cardIndex) && cardIndex % 2 === 1) {
    return DEAL_CARD_RIGHT_ANGLE;
  }
  return DEAL_CARD_LEFT_ANGLE;
}

function normalizeCardFrameKey(cardRaw) {
  if (cardRaw === null || cardRaw === undefined || cardRaw === "") {
    return null;
  }
  const value = String(cardRaw).trim();
  const match = value.match(/^([2-9]|10|[tTjJqQkKaA])([cChHsSdD])$/);
  if (!match) {
    return null;
  }
  const rankRaw = String(match[1]).toUpperCase();
  const rank = rankRaw === "10" ? "T" : rankRaw;
  const suit = String(match[2]).toLowerCase();
  return `${rank}${suit}`;
}

function resolvePotCoinFrame(potRaw, bigBlindRaw) {
  const pot = Number(potRaw);
  const bigBlind = Number(bigBlindRaw);
  if (!Number.isFinite(pot) || !Number.isFinite(bigBlind) || bigBlind <= 0) {
    return null;
  }
  const bbMultiple = pot / bigBlind;
  if (bbMultiple < 1) {
    return null;
  }
  if (bbMultiple <= 10) {
    return "token_green";
  }
  if (bbMultiple <= 20) {
    return "token_blue";
  }
  if (bbMultiple <= 30) {
    return "token_purple";
  }
  return "token_red";
}

function formatAmount(valueRaw) {
  const n = Number(valueRaw);
  if (!Number.isFinite(n)) {
    return "0";
  }
  return n.toLocaleString("en-US");
}

function formatSignedAmount(valueRaw) {
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (value > 0) {
    return `+${formatAmount(value)}`;
  }
  if (value < 0) {
    return `-${formatAmount(Math.abs(value))}`;
  }
  return "0";
}

const HAND_RANK_LABEL_BY_KEY = {
  royal_flush: "皇家同花順",
  straight_flush: "同花順",
  four_of_a_kind: "鐵支",
  full_house: "葫蘆",
  flush: "同花",
  straight: "順子",
  three_of_a_kind: "三條",
  two_pair: "兩對",
  one_pair: "一對",
  high_card: "高牌",
};

const HAND_RANK_STRENGTH = {
  high_card: 1,
  one_pair: 2,
  two_pair: 3,
  three_of_a_kind: 4,
  straight: 5,
  flush: 6,
  full_house: 7,
  four_of_a_kind: 8,
  straight_flush: 9,
  royal_flush: 10,
};

function resolveHandRankLabel(rankRaw) {
  const key = String(rankRaw || "").toLowerCase();
  if (!key) {
    return "";
  }
  return HAND_RANK_LABEL_BY_KEY[key] || key;
}

function extractBest5CardFrames(best5Raw) {
  if (!Array.isArray(best5Raw) || best5Raw.length <= 0) {
    return [];
  }
  const frames = [];
  best5Raw.slice(0, 5).forEach((cardRaw) => {
    const key = normalizeCardFrameKey(cardRaw);
    if (key) {
      frames.push(key);
    }
  });
  return frames;
}

function sumRoundBetsFromMap(betsRaw) {
  if (!betsRaw || typeof betsRaw !== "object") {
    return 0;
  }
  return Object.values(betsRaw).reduce((sum, value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return sum;
    }
    return sum + n;
  }, 0);
}

function mergeSeatBetAmount(target, seatRaw, amountRaw) {
  if (!target || typeof target !== "object") {
    return;
  }
  const seat = parseSeat(seatRaw);
  const amount = Number(amountRaw);
  if (seat === null || !Number.isFinite(amount) || amount <= 0) {
    return;
  }
  const key = String(seat);
  const prev = Number(target[key] ?? 0);
  target[key] = Math.max(Number.isFinite(prev) ? prev : 0, amount);
}

function resolveRoundTotalBet(table) {
  const explicitRoundTotal = Number(table?.round_total_bet);
  if (Number.isFinite(explicitRoundTotal) && explicitRoundTotal >= 0) {
    return explicitRoundTotal;
  }
  return sumRoundBetsFromMap(table?.bets);
}

function resolveDisplayPot(table) {
  const pot = Number(table?.pot ?? 0);
  const roundTotalBet = resolveRoundTotalBet(table);
  if (!Number.isFinite(pot)) {
    return 0;
  }
  return Math.max(0, pot - roundTotalBet);
}

function isBettingRoundName(roundRaw) {
  const round = String(roundRaw || "").toLowerCase();
  return round === "preflop" || round === "flop" || round === "turn" || round === "river";
}

const ACTION_BRAND_FRAME_BY_ACTION = {
  allin: "brand_allin",
  bet: "brand_bet",
  call: "brand_call",
  check: "brand_check",
  fold: "brand_fold",
  raise: "brand_raise",
  call_timeout: "brand_call",
  check_timeout: "brand_check",
  fold_timeout: "brand_fold",
  fold_disconnect: "brand_fold",
};

export class TableScene extends Phaser.Scene {
  constructor() {
    super("table");
    this.state = null;
    this.seatCount = DEFAULT_SEAT_COUNT;
    this.seatStart = DEFAULT_SEAT_START;
    this.currentActiveSeat = null;
    this.currentTurnTimeout = null;
    this.currentTurnStartedAt = null;
    this.turnCountdownTicker = null;
    this.lastCountdownBeepSecond = null;
    this.countdownSfxInstance = null;
    this.lastSeenDealCardVersion = 0;
    this.tableContainer = null;
    this.tableLayoutListener = null;
    this.communitySlots = [];
    this.communityAnimationReady = false;
    this.lastRoundSnapshot = null;
    this.lastShowdownCollectHandId = null;
    this.showdownAnimatedSet = new Set();
    this.showdownFlipTimers = [];
    this.lastBetValueBySeat = {};
    this.lastHintHandId = null;
    this.lastRenderedTableId = null;
    this.newRoundHintTimer = null;

    this.roundBetCollectFx = [];
    this.roundBetCollectCarryAmount = 0;
    this.roundBetCollectCarryHandId = null;
    this.roundBetCollectHiddenSeats = new Set();
    this.lastSeenHandResultVersion = 0;
    this.handResultRows = [];
    this.handResultHeaderItems = [];
    this.isHandResultModalOpen = false;
    this.handResultAutoCloseTimer = null;
    this.handResultAutoCloseEndAt = 0;
    this.nextHandCountdownEnd = 0;
    this.lastSeenActionRequestKey = "";
    this.seatLastActionMap = {};
    this.seatActionMapReady = false;
    this.actionRoundKey = "";
    this.actionRoundBaselineAtBySeat = {};
    this.prevHeroTableSfxSnapshot = null;
    this.lastPlayedHeroResultHandKey = "";
    this.lastResolvedHeroSeat = null;
    this.voiceHooks = {
      playerAction: true,
      dealCommunity: true,
      showdown: true,
      award: true,
      newPlayer: true,
      newRound: true,
    };
    this.rebuySelectedBuyin = 0;
    this.rebuyOfferSignature = "";
    this.rebuyModel = null;
    this._rebuyDeclined = false;
    this._pendingLeaveAfterHandResult = false;
    this.raiseActionModel = null;
    this.raiseActionType = null;
    this.raiseSelectedValue = 0;
    this.raisePanelAnchorX = CENTER_X;
    this.raisePanelCoverLeftOffset = -RAISE_PANEL_WIDTH * 0.5;
    this.raisePanelCoverRightOffset = RAISE_PANEL_WIDTH * 0.5;
    this.raisePanelCoverCenterOffset = 0;
    this.raisePanelCoverWidth = RAISE_PANEL_WIDTH;
    this.raiseQuickButtons = [];
    this.isRaisePanelOpen = false;
    this.soundSettingsPanel = null;
  }

  preload() {
    const imageBase = `${window.__APP__?.assetBase || "assets/variants/main_style"}/images`;
    if (!this.textures.exists("win")) {
      this.load.atlas("win", `${imageBase}/win.webp`, `${imageBase}/win.json`);
    }
  }

  create() {
    this.useResponsiveLayout = true;
    this.bottomDy = 0; // 底部元素 y 偏移：layout.bottom - VIEW_HEIGHT
    this.modalDy = 0;  // 中央模態框 y 偏移：layout.centerY - CENTER_Y

    this.app = window.__APP__;
    this.store = this.app.store;
    this.lastSeenDealCardVersion = Number(this.store.getState?.().dealCardVersion ?? 0);
    this.lastSeenHandResultVersion = Number(this.store.getState?.().handResultVersion ?? 0);

    this.bgImage = this.add.image(layout.centerX, layout.centerY, "game_table", "bg").setDisplaySize(layout.width, layout.height).setDepth(BG_DEPTH);
    const tableImg = this.add.image(CENTER_X + 10, CENTER_Y - 20, "game_table", "tbale").setDisplaySize(TABLE_DISPLAY_WIDTH, TABLE_DISPLAY_HEIGHT).setDepth(TABLE_DEPTH);
    tableImg.postFX.addShadow(2, 10, 0.005, 2.5, 0x000000, 8, 0.85);

    this.bgm = this.sound.get("bgm_main");
    if (!this.bgm && this.cache.audio.exists("bgm_main")) {
      this.bgm = this.sound.add("bgm_main", {
        loop: true,
        volume: 0.2,
      });
    }
    const syncBgmToggle = () => {
      const outputVolume = Number(this.app.getBgmOutputVolume?.(1) ?? 0);
      if (this.bgm) {
        if (outputVolume > 0) {
          this.bgm.setVolume(outputVolume);
          if (this.bgm.isPaused) {
            this.bgm.resume();
          } else if (!this.bgm.isPlaying) {
            this.bgm.play();
          }
        } else if (this.bgm.isPlaying || this.bgm.isPaused) {
          this.bgm.pause();
        }
      }
      this.soundSettingsPanel?.refresh?.();
    };
    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: AUDIO_TOGGLE_X,
      buttonY: AUDIO_TOGGLE_Y,
      onSettingsChanged: () => {
        syncBgmToggle();
      },
    });
    syncBgmToggle();

    this.changeTableButton = this.add.image(CHANGE_TABLE_BUTTON_X, CHANGE_TABLE_BUTTON_Y, "game_table", "btn_change_table");
    this.changeTableButton.setDisplaySize(190, 76);
    bindImageButton(this, this.changeTableButton, {
      pressedScale: 0.96,
      onClick: () => {
        const isHandActive = this.state?.table?.status === "playing";
        if (isHandActive) {
          const heroSeat = this.resolveHeroSeatForDisplay(this.state?.table);
          const heroPlayer = heroSeat !== null && Array.isArray(this.state?.table?.players)
            ? this.state.table.players.find(p => isSameSeat(p?.seat, heroSeat))
            : null;
          const heroInHand = heroPlayer?.in_hand === true;
          if (heroInHand) {
            this.openSwitchRoomConfirmDialog(() => this.queueLeaveAction("switch"));
            return;
          }
        }
        this.store.beginSwitchRoom?.();
        const buyin = this.resolveSwitchRoomBuyin();
        this.app.sendPacket("switch_room", { buyin });
      },
    });

    this.buildSwitchRoomConfirmDialog();
    this.buildHeroWaitingJoinPrompt();

    this.exitTableButton = this.add.image(EXIT_TABLE_BUTTON_X, EXIT_TABLE_BUTTON_Y, "game_table", "btn_exit_table");
    this.exitTableButton.setDisplaySize(190, 76);
    bindImageButton(this, this.exitTableButton, {
      pressedScale: 0.96,
      onClick: () => {
        const isHandActive = this.state?.table?.status === "playing";
        const heroSwitchPending = this.store.getState?.().heroSwitchPending;
        if (isHandActive && !heroSwitchPending) {
          const heroSeat = this.resolveHeroSeatForDisplay(this.state?.table);
          const heroPlayer = heroSeat !== null && Array.isArray(this.state?.table?.players)
            ? this.state.table.players.find(p => isSameSeat(p?.seat, heroSeat))
            : null;
          if (heroPlayer?.in_hand === true) {
            this.openSwitchRoomConfirmDialog(() => this.queueLeaveAction("leave"));
            return;
          }
        }
        const currentTableId = this.store.getState?.().table?.table_id ?? null;
        this.store.beginLeaveTable?.(currentTableId);
        this.app.sendPacket("leave_room", {});
        const _gameId = this.store.getState?.()?.table?.game_id || "texas_holdem";
        this.app.sendPacket("enter_game", { game_id: _gameId });
      },
    });

    this.exitReplayButton = createGradientButton(this, {
      x: EXIT_REPLAY_BUTTON_X,
      y: EXIT_REPLAY_BUTTON_Y,
      width: EXIT_REPLAY_BUTTON_WIDTH,
      height: EXIT_REPLAY_BUTTON_HEIGHT,
      cornerRadius: 8,
      topColor: 0xc02828,
      bottomColor: 0x6a1010,
      borderColor: 0xd43535,
      label: "離開回放",
      labelStyle: { stroke: "#000000", strokeThickness: 1, fontSize: "20px", color: "#ecd5b5" },
      visible: false,
      onClick: () => {
        this.app.stopHandReplay?.("manual_exit_button");
      },
    });
    this.replaySpeedButton = createGradientButton(this, {
      x: REPLAY_SPEED_BUTTON_X,
      y: REPLAY_SPEED_BUTTON_Y,
      width: REPLAY_SPEED_BUTTON_WIDTH,
      height: REPLAY_SPEED_BUTTON_HEIGHT,
      cornerRadius: 8,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "加速：關",
      labelStyle: { stroke: "#000000", strokeThickness: 1, fontSize: "20px", color: "#ecd5b5" },
      visible: false,
      onClick: () => {
        const currentFast = Boolean(this.app.isHandReplayFastMode?.());
        this.app.setHandReplayFastMode?.(!currentFast);
      },
    });

    this.communitySlots = [];
    for (let i = 0; i < COMMUNITY_SLOT_COUNT; i += 1) {
      const cardX = COMMUNITY_CARD_X_LIST[i];
      const cardDepth = COMMUNITY_CARD_DEPTH + i * 0.2;
      const frontCard = this.add
        .image(cardX, COMMUNITY_CARD_Y, PLAYING_CARDS_ATLAS_KEY, "Ac")
        .setScale(COMMUNITY_CARD_SCALE)
        .setDepth(cardDepth)
        .setVisible(false);
      const commCardMaskGfx = this.make.graphics({ add: false });
      commCardMaskGfx.fillStyle(0xffffff).fillRoundedRect(-140, -196, 280, 392, 25);
      frontCard.setMask(commCardMaskGfx.createGeometryMask());
      const commCardShadow = this.add.graphics().setDepth(cardDepth - 0.1).setVisible(false);
      commCardShadow.fillStyle(0x000000, 0.15).fillRoundedRect(-140, -196, 280, 392, 25);
      this.communitySlots.push({
        frontCard,
        commCardMaskGfx,
        commCardShadow,
        shownCard: null,
        pendingCard: null,
        flyCard: null,
        flyTween: null,
        flipTween: null,
        revealTween: null,
      });
    }

    const POT_STACK_FRAMES = ["token_black", "token_blue", "token_purple", "token_green", "token_yellow", "token_red"];
    const _hStep = POT_STACK_ITEM_SIZE + POT_STACK_ITEM_GAP;
    this.potCoinStack = [];
    for (let ci = 0; ci < POT_STACK_FRAMES.length; ci++) {
      const xOff = (ci - (POT_STACK_FRAMES.length - 1) / 2) * _hStep;
      for (let ti = 0; ti < POT_STACK_PER_COLOR; ti++) {
        const yOff = (POT_STACK_PER_COLOR - 1 - ti) * POT_STACK_V_STEP;
        this.potCoinStack.push(
          this.add.image(DEAL_CARD_FROM_X + xOff, DEAL_CARD_FROM_Y + yOff, DEAL_CARD_ATLAS_KEY, POT_STACK_FRAMES[ci])
            .setDisplaySize(POT_STACK_ITEM_SIZE, POT_STACK_ITEM_SIZE)
            .setDepth(POT_COIN_DEPTH + (ci * POT_STACK_PER_COLOR + ti) * 0.1)
            .setVisible(false)
        );
      }
    }
    const midTopIdx = Math.floor(POT_STACK_FRAMES.length / 2) * POT_STACK_PER_COLOR + (POT_STACK_PER_COLOR - 1);
    this.potCoinImage = this.potCoinStack[midTopIdx];

    this.potText = this.add.text(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, "", {
      fontSize: "42px",
      color: BET_AMOUNT_COLOR,
      fontStyle: "bold",
      fontFamily: UI_FONT_STACK,
      shadow: BET_AMOUNT_SHADOW,
    })
      .setVisible(false);
    this.updatePotTextPosition();

    this.centerPotBg = this.add.graphics().setDepth(CENTER_POT_DEPTH).setVisible(false);
    this.centerPotBg.setPosition(CENTER_X, CENTER_POT_Y);

    this.centerPotText = this.add
      .text(CENTER_X, CENTER_POT_Y, "", {
        fontSize: "26px",
        color: "#f0d898",
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(CENTER_POT_DEPTH + 0.1)
      .setVisible(false);

    const _cdShadow = { offsetX: 0, offsetY: 2, color: "#000000", blur: 6, fill: true };
    this.nextHandCountdownLabel = this.add
      .text(0, CENTER_POT_Y + 68, "下一局", {
        fontSize: "28px", color: "#ffffff", fontStyle: "bold",
        fontFamily: UI_FONT_STACK, shadow: _cdShadow,
      })
      .setOrigin(0.5).setDepth(CENTER_POT_DEPTH + 0.6).setVisible(false);
    this.nextHandCountdownNum = this.add
      .text(0, CENTER_POT_Y + 68, "", {
        fontSize: "28px", color: "#ffe050", fontStyle: "bold",
        fontFamily: UI_FONT_STACK, shadow: _cdShadow,
      })
      .setOrigin(0.5).setDepth(CENTER_POT_DEPTH + 0.6).setVisible(false);

    this.tableHintText = this.add
      .text(CENTER_X, 520, "", {
        fontSize: "34px",
        color: "#f4deba",
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        shadow: { offsetX: 1, offsetY: 2, color: "#000000", blur: 8, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(POT_COIN_DEPTH + 0.5)
      .setAlpha(0.88)
      .setVisible(false);

    this.betFlyPool = Array.from({ length: 6 }, () =>
      this.add.image(0, 0, DEAL_CARD_ATLAS_KEY, "token_red")
        .setDisplaySize(28, 28)
        .setDepth(DEAL_CARD_DEPTH)
        .setVisible(false)
        .setActive(false)
    );

    // Win animation sprite (Phaser atlas, replaces DOM win.gif)
    this.winGifIsPlaying = false;
    this.pendingHandResult = null;

    if (!this.anims.exists(WIN_SPRITE_ANIM_KEY)) {
      const frames = [];
      for (let i = WIN_SPRITE_FRAME_FIRST; i <= WIN_SPRITE_FRAME_LAST; i++) {
        frames.push({ key: WIN_SPRITE_ATLAS, frame: `win_logo${i}` });
      }
      this.anims.create({
        key: WIN_SPRITE_ANIM_KEY,
        frames,
        frameRate: WIN_SPRITE_FPS,
        repeat: 0,
      });
    }

    this.winSprite = this.add
      .sprite(CENTER_X, CENTER_Y, WIN_SPRITE_ATLAS, `win_logo${WIN_SPRITE_FRAME_FIRST}`)
      .setDepth(WIN_SPRITE_DEPTH)
      .setVisible(false);
    this.winSprite.on("animationcomplete", () => {
      this.time.delayedCall(2000, () => {
        this.winSprite?.setVisible(false);
        this.winGifIsPlaying = false;
        if (this.pendingHandResult !== null) {
          const result = this.pendingHandResult;
          this.pendingHandResult = null;
          this.openHandResultModal(result);
        }
      });
    });

    this.seatViews = [];
    this.buildSeatViews(DEFAULT_SEAT_COUNT, DEFAULT_SEAT_START);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, () => {
      if (!this.seatViews) return;
      for (const sv of this.seatViews) {
        if (!sv.holeCards) continue;
        for (const hc of sv.holeCards) {
          if (hc.cardMaskGfx && hc.sprite) {
            hc.cardMaskGfx.setPosition(hc.sprite.x, hc.sprite.y)
              .setAngle(hc.sprite.angle)
              .setScale(hc.sprite.scaleX, hc.sprite.scaleY);
          }
          if (hc.cardShadow && hc.sprite) {
            hc.cardShadow
              .setPosition(hc.sprite.x + 2, hc.sprite.y + 3)
              .setAngle(hc.sprite.angle)
              .setScale(
                hc.sprite.scaleX * (hc.sprite.width / DEAL_CARD_BACK_FRAME_WIDTH),
                hc.sprite.scaleY * (hc.sprite.height / DEAL_CARD_BACK_FRAME_HEIGHT)
              )
              .setVisible(hc.sprite.visible && hc.sprite.alpha > 0);
          }
        }
      }
      for (const slot of this.communitySlots) {
        if (slot.commCardMaskGfx && slot.frontCard) {
          slot.commCardMaskGfx.setPosition(slot.frontCard.x, slot.frontCard.y)
            .setScale(slot.frontCard.scaleX, slot.frontCard.scaleY);
        }
        if (slot.commCardShadow && slot.frontCard) {
          slot.commCardShadow
            .setPosition(slot.frontCard.x + 2, slot.frontCard.y + 3)
            .setScale(slot.frontCard.scaleX, slot.frontCard.scaleY)
            .setVisible(slot.frontCard.visible && slot.frontCard.alpha > 0);
        }
      }
    }, this);
    this.turnCountdownTicker = this.time.addEvent({
      delay: TURN_COUNTDOWN_TICK_MS,
      loop: true,
      callback: () => {
        this.refreshTurnCountdownOverlay();
        this.refreshNextHandCountdown();
      },
    });
    this.countdownSfxSound = this.cache.audio.exists(COUNTDOWN_TIMER_SFX_KEY)
      ? this.sound.add(COUNTDOWN_TIMER_SFX_KEY)
      : null;

    this.actionButtons = {};
    ACTION_BUTTON_ORDER.forEach((action) => {
      const frame = `btn_${action}`;
      if (!this.textures.get(DEAL_CARD_ATLAS_KEY)?.has(frame)) {
        return;
      }
      const image = this.add
        .image(CENTER_X, ACTION_ROW_Y, DEAL_CARD_ATLAS_KEY, frame)
        .setDisplaySize(ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT)
        .setDepth(ACTION_BUTTON_DEPTH)
        .setVisible(false);
      bindImageButton(this, image, {
        onClick: () => this.sendAction(action),
      });
      this.actionButtons[action] = image;
    });

    this.raisePanelOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.001)
      .setDepth(RAISE_PANEL_OVERLAY_DEPTH)
      .setVisible(false);
    this.raisePanelOverlay.setInteractive({ useHandCursor: false });
    this.raisePanelOverlay.on("pointerdown", () => this.closeRaiseActionPanel());

    const _rpY = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y;

    const _rpCorners = { tl: RAISE_PANEL_CORNER_RADIUS, tr: RAISE_PANEL_CORNER_RADIUS, bl: 0, br: 0 };
    this._raisePanelBgMask = this.make.graphics({ add: false });
    this._raisePanelBgMask.fillStyle(0xffffff);
    this._raisePanelBgMask.fillRoundedRect(-RAISE_PANEL_WIDTH / 2, -RAISE_PANEL_HEIGHT / 2, RAISE_PANEL_WIDTH, RAISE_PANEL_HEIGHT, _rpCorners);
    this._raisePanelBgMask.setPosition(CENTER_X, _rpY);

    this.raisePanelBg = this.add.graphics();
    this.raisePanelBg._drawPanel = (w, h) => {
      this.raisePanelBg.clear();
      this.raisePanelBg.fillGradientStyle(0x2e1a0c, 0x2e1a0c, 0x050201, 0x050201, 0.97, 0.97, 0.97, 0.97);
      this.raisePanelBg.fillRect(-w / 2, -h / 2, w, h);
      this.raisePanelBg.lineStyle(2.5, RAISE_PANEL_BORDER_COLOR, 0.9);
      this.raisePanelBg.strokeRoundedRect(-w / 2, -h / 2, w, h, _rpCorners);
      this._raisePanelBgMask.clear();
      this._raisePanelBgMask.fillStyle(0xffffff);
      this._raisePanelBgMask.fillRoundedRect(-w / 2, -h / 2, w, h, _rpCorners);
      this.raisePanelBg.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains,
      );
    };
    this.raisePanelBg.setMask(this._raisePanelBgMask.createGeometryMask());
    this.raisePanelBg._drawPanel(RAISE_PANEL_WIDTH, RAISE_PANEL_HEIGHT);
    this.raisePanelBg.setPosition(CENTER_X, _rpY).setDepth(RAISE_PANEL_DEPTH).setVisible(false);
    this.raisePanelBg.on("pointerdown", () => {});

    this.raisePanelTopAccent = null;

    this.raisePanelDivider = this.add.graphics();
    this.raisePanelDivider.lineStyle(1, RAISE_PANEL_DIVIDER_COLOR, 0.9);
    this.raisePanelDivider.lineBetween(-RAISE_PANEL_DIVIDER_W / 2, 0, RAISE_PANEL_DIVIDER_W / 2, 0);
    this.raisePanelDivider.setPosition(CENTER_X, _rpY + RAISE_PANEL_TITLE_Y_OFFSET + 22).setDepth(RAISE_PANEL_TEXT_DEPTH - 0.1).setVisible(false);

    this.raisePanelAmountBg = this.add.graphics();
    this.raisePanelAmountBg.fillStyle(RAISE_PANEL_AMOUNT_BOX_COLOR, 1);
    this.raisePanelAmountBg.fillRoundedRect(
      -RAISE_PANEL_AMOUNT_BOX_W / 2, -RAISE_PANEL_AMOUNT_BOX_H / 2,
      RAISE_PANEL_AMOUNT_BOX_W, RAISE_PANEL_AMOUNT_BOX_H,
      RAISE_PANEL_AMOUNT_BOX_CORNER,
    );
    this.raisePanelAmountBg.setPosition(CENTER_X, _rpY + RAISE_PANEL_AMOUNT_Y_OFFSET).setDepth(RAISE_PANEL_TEXT_DEPTH - 0.05).setVisible(false);

    this.raisePanelTitle = this.add
      .text(CENTER_X, _rpY + RAISE_PANEL_TITLE_Y_OFFSET, "選擇加注金額", {
        fontSize: RAISE_PANEL_TITLE_FONT_SIZE,
        color: RAISE_PANEL_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setOrigin(0.5)
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);

    this.raisePanelAmountText = this.add
      .text(CENTER_X, _rpY + RAISE_PANEL_AMOUNT_Y_OFFSET, "0", {
        fontSize: RAISE_PANEL_AMOUNT_FONT_SIZE,
        color: RAISE_PANEL_AMOUNT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setOrigin(0.5)
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);

    this.raisePanelRangeText = this.add
      .text(CENTER_X, _rpY + RAISE_PANEL_RANGE_Y_OFFSET, "", {
        fontSize: RAISE_PANEL_HINT_FONT_SIZE,
        color: RAISE_PANEL_HINT_COLOR,
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setOrigin(0.5)
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);

    const _rpPillR = RAISE_PANEL_SLIDER_TRACK_HEIGHT / 2;
    this.raisePanelSliderTrack = this.add.graphics()
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);
    this.raisePanelSliderTrack.fillStyle(RAISE_PANEL_SLIDER_TRACK_CLR, 1);
    this.raisePanelSliderTrack.fillRoundedRect(
      -RAISE_PANEL_SLIDER_TRACK_WIDTH / 2, -_rpPillR,
      RAISE_PANEL_SLIDER_TRACK_WIDTH, RAISE_PANEL_SLIDER_TRACK_HEIGHT, _rpPillR,
    );
    this.raisePanelSliderTrack.setPosition(CENTER_X, _rpY + RAISE_PANEL_SLIDER_Y_OFFSET);

    this.raisePanelSliderFill = this.add.graphics()
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.1)
      .setVisible(false);
    this.raisePanelSliderFill._pillR = _rpPillR;
    this.raisePanelSliderFill._drawFill = (fillW) => {
      this.raisePanelSliderFill.clear();
      if (fillW > 0) {
        this.raisePanelSliderFill.fillStyle(RAISE_PANEL_SLIDER_FILL_CLR, 1);
        this.raisePanelSliderFill.fillRoundedRect(
          0, -_rpPillR,
          Math.max(fillW, RAISE_PANEL_SLIDER_TRACK_HEIGHT), RAISE_PANEL_SLIDER_TRACK_HEIGHT, _rpPillR,
        );
      }
    };
    this.raisePanelSliderFill.setPosition(CENTER_X - RAISE_PANEL_SLIDER_TRACK_WIDTH * 0.5, _rpY + RAISE_PANEL_SLIDER_Y_OFFSET);

    this.raisePanelSliderHit = this.add
      .rectangle(CENTER_X, _rpY + RAISE_PANEL_SLIDER_Y_OFFSET, RAISE_PANEL_SLIDER_TRACK_WIDTH, RAISE_PANEL_SLIDER_HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.2)
      .setVisible(false);
    this.raisePanelSliderHit.setInteractive({ useHandCursor: true });
    this.raisePanelSliderHit.on("pointerdown", (pointer) => {
      this.handleRaisePanelSliderPointer(pointer?.worldX ?? pointer?.x ?? CENTER_X);
    });

    this.raisePanelSliderKnob = this.add
      .circle(CENTER_X, _rpY + RAISE_PANEL_SLIDER_Y_OFFSET, RAISE_PANEL_SLIDER_KNOB_RADIUS, RAISE_PANEL_KNOB_CLR, 1)
      .setStrokeStyle(2.5, RAISE_PANEL_KNOB_STROKE_CLR, 1)
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.3)
      .setVisible(false);
    this.raisePanelSliderKnob.setInteractive({ useHandCursor: true });
    this.raisePanelSliderKnob.on("pointerdown", () => {});
    this.input.setDraggable(this.raisePanelSliderKnob, true);
    this.raisePanelSliderKnob.on("drag", (_pointer, dragX) => {
      this.handleRaisePanelSliderPointer(dragX);
    });

    this.raisePanelMinusBtn = createGradientButton(this, {
      x: CENTER_X - RAISE_PANEL_AMOUNT_BOX_W / 2 - RAISE_PANEL_STEP_BTN_GAP - RAISE_PANEL_STEP_BTN_SIZE / 2,
      y: _rpY + RAISE_PANEL_AMOUNT_Y_OFFSET,
      width: RAISE_PANEL_STEP_BTN_SIZE,
      height: RAISE_PANEL_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: RAISE_PANEL_QUICK_STROKE_COLOR,
      label: "−",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: RAISE_PANEL_TEXT_DEPTH + 0.35,
      onClick: () => this.stepRaisePanelValue(-1),
      visible: false,
    });

    this.raisePanelPlusBtn = createGradientButton(this, {
      x: CENTER_X + RAISE_PANEL_AMOUNT_BOX_W / 2 + RAISE_PANEL_STEP_BTN_GAP + RAISE_PANEL_STEP_BTN_SIZE / 2,
      y: _rpY + RAISE_PANEL_AMOUNT_Y_OFFSET,
      width: RAISE_PANEL_STEP_BTN_SIZE,
      height: RAISE_PANEL_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: RAISE_PANEL_QUICK_STROKE_COLOR,
      label: "+",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: RAISE_PANEL_TEXT_DEPTH + 0.35,
      onClick: () => this.stepRaisePanelValue(1),
      visible: false,
    });

    this.raiseQuickButtons = [];
    const quickItems = [
      ...RAISE_PANEL_QUICK_MULTIPLIERS.map((multiplier) => ({ kind: "bb", value: multiplier, label: `${multiplier}BB` })),
      { kind: "pot", value: 0, label: "底池" },
    ];
    const quickStep = RAISE_PANEL_QUICK_WIDTH + RAISE_PANEL_QUICK_GAP;
    const allInIndex = quickItems.length - 1;
    const allInCenterOffset = (allInIndex - 1.5) * quickStep;
    this.raisePanelConfirmInlineXOffset = allInCenterOffset
      + RAISE_PANEL_QUICK_WIDTH * 0.5
      + RAISE_PANEL_QUICK_GAP
      + RAISE_PANEL_CONFIRM_WIDTH * 0.5;

    const quickLeftOffset = (0 - 1.5) * quickStep - RAISE_PANEL_QUICK_WIDTH * 0.5;
    const quickRightOffset = allInCenterOffset + RAISE_PANEL_QUICK_WIDTH * 0.5;
    const confirmLeftOffset = this.raisePanelConfirmInlineXOffset - RAISE_PANEL_CONFIRM_WIDTH * 0.5;
    const confirmRightOffset = this.raisePanelConfirmInlineXOffset + RAISE_PANEL_CONFIRM_WIDTH * 0.5;
    this.raisePanelCoverLeftOffset = Math.min(
      -RAISE_PANEL_WIDTH * 0.5,
      quickLeftOffset,
      confirmLeftOffset,
    ) - RAISE_PANEL_COVER_PADDING_X;
    this.raisePanelCoverRightOffset = Math.max(
      RAISE_PANEL_WIDTH * 0.5,
      quickRightOffset,
      confirmRightOffset,
    ) + RAISE_PANEL_COVER_PADDING_X;
    this.raisePanelCoverWidth = this.raisePanelCoverRightOffset - this.raisePanelCoverLeftOffset;
    this.raisePanelCoverCenterOffset = (this.raisePanelCoverLeftOffset + this.raisePanelCoverRightOffset) * 0.5;
    this.raisePanelBg._drawPanel(this.raisePanelCoverWidth, RAISE_PANEL_HEIGHT);

    quickItems.forEach((item, index) => {
      const x = CENTER_X + (index - 1.5) * (RAISE_PANEL_QUICK_WIDTH + RAISE_PANEL_QUICK_GAP);
      const y = _rpY + RAISE_PANEL_QUICK_Y_OFFSET;
      const button = createGradientButton(this, {
        x,
        y,
        width: RAISE_PANEL_QUICK_WIDTH,
        height: RAISE_PANEL_QUICK_HEIGHT,
        cornerRadius: RAISE_PANEL_QUICK_CORNER_RADIUS,
        topColor: 0x3a1c08,
        bottomColor: 0x140804,
        borderColor: RAISE_PANEL_QUICK_STROKE_COLOR,
        label: item.label,
        labelStyle: { fontSize: "30px", color: "#ecd5b5" },
        depth: RAISE_PANEL_TEXT_DEPTH + 0.35,
        onClick: () => this.applyRaiseQuickChoice(item),
        visible: false,
      });
      this.raiseQuickButtons.push({ ...item, button });
    });

    this.raisePanelConfirm = createGradientButton(this, {
      x: CENTER_X + this.raisePanelConfirmInlineXOffset,
      y: _rpY + RAISE_PANEL_QUICK_Y_OFFSET,
      width: RAISE_PANEL_CONFIRM_WIDTH,
      height: RAISE_PANEL_CONFIRM_HEIGHT,
      cornerRadius: RAISE_PANEL_CONFIRM_CORNER_RADIUS,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "確認",
      labelStyle: { fontSize: "28px", color: "#ffffff" },
      depth: RAISE_PANEL_TEXT_DEPTH + 0.45,
      onClick: () => this.confirmRaiseAction(),
      visible: false,
    });

    this.rebuyOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, OVERLAY_COLOR, OVERLAY_ALPHA)
      .setDepth(REBUY_OVERLAY_DEPTH)
      .setVisible(false);
    this.rebuyOverlay.setInteractive({ useHandCursor: false });
    this.rebuyOverlay.on("pointerdown", () => {});

    const _rebuyPanelCR = 16;
    const _rebuyPanelL = REBUY_PANEL_X - REBUY_PANEL_WIDTH / 2;
    const _rebuyPanelT = REBUY_PANEL_Y - REBUY_PANEL_HEIGHT / 2;
    this._rebuyMaskGfx = this.make.graphics({ add: false });
    this._rebuyMaskGfx.fillStyle(0xffffff);
    this._rebuyMaskGfx.fillRoundedRect(_rebuyPanelL, _rebuyPanelT, REBUY_PANEL_WIDTH, REBUY_PANEL_HEIGHT, _rebuyPanelCR);
    this.rebuyPanel = this.add.graphics();
    this.rebuyPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.rebuyPanel.fillRect(_rebuyPanelL, _rebuyPanelT, REBUY_PANEL_WIDTH, REBUY_PANEL_HEIGHT);
    this.rebuyPanel.setMask(this._rebuyMaskGfx.createGeometryMask());
    this.rebuyPanel.setDepth(REBUY_PANEL_DEPTH).setVisible(false);
    this.rebuyPanel.setInteractive(
      new Phaser.Geom.Rectangle(_rebuyPanelL, _rebuyPanelT, REBUY_PANEL_WIDTH, REBUY_PANEL_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    );
    this.rebuyPanel.on("pointerdown", () => {});

    this.rebuyPanelBorder = this.add.graphics();
    drawEnhancedBorder(this.rebuyPanelBorder, _rebuyPanelL, _rebuyPanelT, REBUY_PANEL_WIDTH, REBUY_PANEL_HEIGHT, _rebuyPanelCR);
    this.rebuyPanelBorder.setDepth(REBUY_PANEL_DEPTH - 0.5).setVisible(false);

    const _rebuyTitleLabelY = REBUY_PANEL_Y - REBUY_PANEL_HEIGHT / 2;
    this.rebuyTitleLabel = this.add
      .image(REBUY_TITLE_X, _rebuyTitleLabelY, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(280, 98)
      .setDepth(REBUY_TEXT_DEPTH - 0.5)
      .setVisible(false);

    this.rebuyTitle = this.add
      .text(REBUY_TITLE_X, _rebuyTitleLabelY + 8, "補籌碼", {
        fontSize: "34px",
        color: REBUY_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(REBUY_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.rebuyTitle);

    this.rebuyAmountBg = this.add.graphics();
    this.rebuyAmountBg.fillStyle(0x0e0206, 1);
    this.rebuyAmountBg.fillRoundedRect(-110, -34, 220, 68, 10);
    this.rebuyAmountBg.setPosition(REBUY_AMOUNT_X, REBUY_AMOUNT_Y).setDepth(REBUY_TEXT_DEPTH - 0.05).setVisible(false);

    this.rebuyAmountText = this.add
      .text(REBUY_AMOUNT_X, REBUY_AMOUNT_Y, "0", {
        fontSize: "42px",
        color: REBUY_NUMBER_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(REBUY_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.rebuyRangeText = this.add
      .text(REBUY_RANGE_X, REBUY_RANGE_Y, "", {
        fontSize: REBUY_TEXT_FONT_SIZE,
        color: REBUY_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(REBUY_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    const _rebuyTr = REBUY_SLIDER_TRACK_HEIGHT / 2;
    this.rebuySliderTrack = this.add.graphics();
    this.rebuySliderTrack.fillStyle(REBUY_SLIDER_TRACK_COLOR, 1);
    this.rebuySliderTrack.fillRoundedRect(
      -REBUY_SLIDER_TRACK_WIDTH / 2, -REBUY_SLIDER_TRACK_HEIGHT / 2,
      REBUY_SLIDER_TRACK_WIDTH, REBUY_SLIDER_TRACK_HEIGHT, _rebuyTr,
    );
    this.rebuySliderTrack.setPosition(CENTER_X, REBUY_SLIDER_Y).setDepth(REBUY_TEXT_DEPTH).setVisible(false);

    this.rebuySliderFill = this.add.graphics();
    this.rebuySliderFill.setPosition(REBUY_SLIDER_START_X, REBUY_SLIDER_Y).setDepth(REBUY_TEXT_DEPTH + 0.1).setVisible(false);

    this.rebuySliderHit = this.add
      .rectangle(CENTER_X, REBUY_SLIDER_Y, REBUY_SLIDER_TRACK_WIDTH, REBUY_SLIDER_HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(REBUY_TEXT_DEPTH + 0.2)
      .setVisible(false);
    this.rebuySliderHit.setInteractive({ useHandCursor: true });
    this.rebuySliderHit.on("pointerdown", (pointer) => {
      this.handleRebuySliderPointer(pointer?.worldX ?? pointer?.x ?? REBUY_SLIDER_START_X);
    });

    this.rebuySliderKnob = this.add
      .circle(REBUY_SLIDER_START_X, REBUY_SLIDER_Y, REBUY_SLIDER_KNOB_RADIUS, REBUY_SLIDER_KNOB_COLOR, 1)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(REBUY_TEXT_DEPTH + 0.3)
      .setVisible(false);
    this.rebuySliderKnob.setInteractive({ useHandCursor: true });
    this.rebuySliderKnob.on("pointerdown", () => {});
    this.input.setDraggable(this.rebuySliderKnob, true);
    this.rebuySliderKnob.on("drag", (_pointer, dragX) => {
      this.handleRebuySliderPointer(dragX);
    });

    this.rebuyHintText = this.add
      .text(REBUY_HINT_X, REBUY_HINT_Y, "", {
        fontSize: REBUY_TEXT_FONT_SIZE,
        color: REBUY_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
        align: "center",
      })
      .setDepth(REBUY_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.rebuyMinusBtn = createGradientButton(this, {
      x: REBUY_AMOUNT_X - REBUY_STEP_BTN_OFFSET_X,
      y: REBUY_AMOUNT_Y,
      width: REBUY_STEP_BTN_SIZE,
      height: REBUY_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: 0x7a4818,
      label: "−",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: REBUY_TEXT_DEPTH + 0.4,
      onClick: () => this.stepRebuyAmount(-1),
      visible: false,
    });

    this.rebuyPlusBtn = createGradientButton(this, {
      x: REBUY_AMOUNT_X + REBUY_STEP_BTN_OFFSET_X,
      y: REBUY_AMOUNT_Y,
      width: REBUY_STEP_BTN_SIZE,
      height: REBUY_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: 0x7a4818,
      label: "+",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: REBUY_TEXT_DEPTH + 0.4,
      onClick: () => this.stepRebuyAmount(1),
      visible: false,
    });

    this.rebuyConfirm = createGradientButton(this, {
      x: REBUY_CONFIRM_X,
      y: REBUY_BUTTON_Y,
      width: REBUY_BUTTON_WIDTH,
      height: REBUY_BUTTON_HEIGHT,
      cornerRadius: 10,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "確認補碼",
      labelStyle: { fontSize: "26px", color: "#ecd5b5" },
      depth: REBUY_TEXT_DEPTH + 0.4,
      onClick: () => this.submitRebuySelection(),
      visible: false,
    });

    this.rebuyLeave = createGradientButton(this, {
      x: REBUY_LEAVE_X,
      y: REBUY_BUTTON_Y,
      width: REBUY_BUTTON_WIDTH,
      height: REBUY_BUTTON_HEIGHT,
      cornerRadius: 10,
      topColor: 0xc02828,
      bottomColor: 0x6a1010,
      borderColor: 0xd43535,
      label: "離開牌局",
      labelStyle: { fontSize: "26px", color: "#ecd5b5" },
      depth: REBUY_TEXT_DEPTH + 0.4,
      onClick: () => this.leaveTableByRebuy(),
      visible: false,
    });

    this.handResultOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, OVERLAY_COLOR, HAND_RESULT_OVERLAY_ALPHA)
      .setDepth(HAND_RESULT_OVERLAY_DEPTH)
      .setVisible(false);
    this.handResultOverlay.setInteractive({ useHandCursor: true });
    this.handResultOverlay.on("pointerdown", () => this.closeHandResultModal());

    {
      const pL = HAND_RESULT_PANEL_X - HAND_RESULT_PANEL_WIDTH / 2;
      const pT = HAND_RESULT_PANEL_Y - HAND_RESULT_PANEL_HEIGHT / 2;
      const pCR = HAND_RESULT_PANEL_CORNER_RADIUS;
      const hrMask = this.make.graphics({ add: false });
      hrMask.fillStyle(0xffffff);
      hrMask.fillRoundedRect(pL, pT, HAND_RESULT_PANEL_WIDTH, HAND_RESULT_PANEL_HEIGHT, pCR);
      this._handResultPanelMask = hrMask;
      const panelGrad = this.add.graphics();
      panelGrad.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97);
      panelGrad.fillRect(pL, pT, HAND_RESULT_PANEL_WIDTH, HAND_RESULT_PANEL_HEIGHT);
      panelGrad.setMask(hrMask.createGeometryMask());
      panelGrad.setDepth(HAND_RESULT_PANEL_DEPTH).setVisible(false);
      this.handResultPanel = panelGrad;
      const panelBorder = this.add.graphics();
      drawEnhancedBorder(panelBorder, pL, pT, HAND_RESULT_PANEL_WIDTH, HAND_RESULT_PANEL_HEIGHT, pCR);
      panelBorder.setDepth(HAND_RESULT_PANEL_DEPTH - 0.5).setVisible(false);
      this.handResultPanelBorder = panelBorder;
    }

    const _hrTitleLabelY = HAND_RESULT_PANEL_Y - HAND_RESULT_PANEL_HEIGHT / 2;
    this.handResultTitleLabel = this.add
      .image(CENTER_X, _hrTitleLabelY, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(320, 112)
      .setDepth(HAND_RESULT_TEXT_DEPTH - 0.5)
      .setVisible(false);

    this.handResultTitle = this.add
      .text(CENTER_X, _hrTitleLabelY + 8, "本局結算", {
        fontSize: HAND_RESULT_TITLE_FONT_SIZE,
        color: HAND_RESULT_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.handResultTitle);

    this.handResultDivider = this.add.graphics()
      .setDepth(HAND_RESULT_TEXT_DEPTH)
      .setVisible(false);
    this.handResultDivider.lineStyle(1.5, HAND_RESULT_PANEL_BORDER_COLOR, 0.55);
    this.handResultDivider.lineBetween(
      CENTER_X - HAND_RESULT_ROW_WIDTH / 2,
      HAND_RESULT_DIVIDER_Y,
      CENTER_X + HAND_RESULT_ROW_WIDTH / 2,
      HAND_RESULT_DIVIDER_Y,
    );

    this.handResultHint = this.add
      .text(CENTER_X, HAND_RESULT_HINT_Y, "點擊任意處關閉", {
        fontSize: HAND_RESULT_HINT_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    onLayoutResize(this, () => this.applyLayout());
    this.applyLayout();

    this.unsubscribe = this.store.subscribe((state) => {
      this.state = state;
      this.consumeVoiceCuesByAnimationHooks();
      this.renderState();
    });

    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      if (this.winSprite) { this.winSprite.destroy(); this.winSprite = null; }
      if (this.turnCountdownTicker) {
        this.turnCountdownTicker.remove();
        this.turnCountdownTicker = null;
      }
      this.communitySlots?.forEach((slot) => {
        this.stopCommunitySlotAnimation(slot);
      });
      this.clearRoundBetCollectFx();
      this.lastShowdownCollectHandId = null;
      this.clearShowdownFlipTimers();
      this.showdownAnimatedSet = new Set();
      this.lastBetValueBySeat = {};
      this.roundBetCollectCarryAmount = 0;
      this.roundBetCollectCarryHandId = null;
      this.roundBetCollectHiddenSeats.clear();
      this.seatLastActionMap = {};
      this.seatActionMapReady = false;
      this.prevHeroTableSfxSnapshot = null;
      this.lastPlayedHeroResultHandKey = "";
      this.lastResolvedHeroSeat = null;
      this.closeRaiseActionPanel();
      this.closeHandResultModal();
      this.exitReplayButton?.destroy?.();
      this.replaySpeedButton?.destroy?.();
    });
  }

  applyLayout() {
    // 1. 背景填滿 viewport
    this.bgImage?.setPosition(layout.centerX, layout.centerY).setDisplaySize(layout.width, layout.height);

    // 2. 計算偏移量（底部需額外減去設備 safe area，避免被 home indicator 遮擋）
    const newBottomDy = layout.bottom - VIEW_HEIGHT - layout.safeAreaBottom;
    const newModalDy = layout.centerY - CENTER_Y;
    this.bottomDy = newBottomDy;
    this.modalDy = newModalDy;

    // 3. Action row 按鈕 anchor 到 viewport 底部
    const newActionY = ACTION_ROW_Y + newBottomDy;
    ACTION_BUTTON_ORDER.forEach((action) => {
      const btn = this.actionButtons?.[action];
      if (btn) btn.y = newActionY;
    });

    // Raise panel：如果是開的，重新定位；否則初始位置會在下次 open 時自動套用 bottomDy
    if (this.isRaisePanelOpen) {
      this.updateRaisePanelPosition(this.raisePanelAnchorX || CENTER_X);
      this.updateRaisePanelVisual();
    }

    // 4. Modals：overlay 跟 viewport 中央，panel 內容透過 dy 偏移
    const dy = newModalDy;

    // Raise panel overlay (full-screen blocker)
    this.raisePanelOverlay?.setPosition(layout.centerX, layout.centerY);

    // Rebuy modal
    this.rebuyOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.rebuyPanel) this.rebuyPanel.y = dy;
    if (this.rebuyPanelBorder) this.rebuyPanelBorder.y = dy;
    if (this._rebuyMaskGfx) this._rebuyMaskGfx.y = dy;
    const _rebuyTitleY = REBUY_PANEL_Y - REBUY_PANEL_HEIGHT / 2;
    this.rebuyTitleLabel?.setPosition(REBUY_TITLE_X, _rebuyTitleY + dy);
    this.rebuyTitle?.setPosition(REBUY_TITLE_X, _rebuyTitleY + 8 + dy);
    this.rebuyAmountBg?.setPosition(REBUY_AMOUNT_X, REBUY_AMOUNT_Y + dy);
    this.rebuyAmountText?.setPosition(REBUY_AMOUNT_X, REBUY_AMOUNT_Y + dy);
    this.rebuyRangeText?.setPosition(REBUY_RANGE_X, REBUY_RANGE_Y + dy);
    this.rebuySliderTrack?.setPosition(CENTER_X, REBUY_SLIDER_Y + dy);
    this.rebuySliderFill?.setPosition(REBUY_SLIDER_START_X, REBUY_SLIDER_Y + dy);
    this.rebuySliderHit?.setPosition(CENTER_X, REBUY_SLIDER_Y + dy);
    this.rebuySliderKnob?.setPosition(this.rebuySliderKnob.x, REBUY_SLIDER_Y + dy);
    this.rebuyHintText?.setPosition(REBUY_HINT_X, REBUY_HINT_Y + dy);
    this.rebuyMinusBtn?.setPosition?.(REBUY_AMOUNT_X - REBUY_STEP_BTN_OFFSET_X, REBUY_AMOUNT_Y + dy);
    this.rebuyPlusBtn?.setPosition?.(REBUY_AMOUNT_X + REBUY_STEP_BTN_OFFSET_X, REBUY_AMOUNT_Y + dy);
    this.rebuyConfirm?.setPosition?.(REBUY_CONFIRM_X, REBUY_BUTTON_Y + dy);
    this.rebuyLeave?.setPosition?.(REBUY_LEAVE_X, REBUY_BUTTON_Y + dy);

    // Hand result modal
    this.handResultOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.handResultPanel) this.handResultPanel.y = dy;
    if (this.handResultPanelBorder) this.handResultPanelBorder.y = dy;
    if (this._handResultPanelMask) this._handResultPanelMask.y = dy;
    if (this.handResultDivider) this.handResultDivider.y = dy;
    const _hrTitleY = HAND_RESULT_PANEL_Y - HAND_RESULT_PANEL_HEIGHT / 2;
    this.handResultTitleLabel?.setPosition(CENTER_X, _hrTitleY + dy);
    this.handResultTitle?.setPosition(CENTER_X, _hrTitleY + 8 + dy);
    this.handResultHint?.setPosition(CENTER_X, HAND_RESULT_HINT_Y + dy);

    // Switch confirm dialog
    this.switchConfirmOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.switchConfirmPanelGrad) this.switchConfirmPanelGrad.y = dy;
    if (this.switchConfirmPanel) this.switchConfirmPanel.y = dy;
    if (this.switchConfirmPanelMask) this.switchConfirmPanelMask.y = dy;
    const _swPanelH = 310;
    const _swTitleY = CENTER_Y - _swPanelH / 2;
    this.switchConfirmTitleLabel?.setPosition(CENTER_X, _swTitleY + dy);
    this.switchConfirmTitle?.setPosition(CENTER_X, _swTitleY + 8 + dy);
    this.switchConfirmBody?.setPosition(CENTER_X, CENTER_Y - 35 + dy);
    const _swBtnY = CENTER_Y + 90;
    this.switchConfirmCancelBtn?.setPosition?.(CENTER_X - 118, _swBtnY + dy);
    this.switchConfirmOkBtn?.setPosition?.(CENTER_X + 118, _swBtnY + dy);

    // Hero waiting prompt
    this.heroWaitPromptOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.heroWaitPromptGrad) this.heroWaitPromptGrad.y = dy;
    if (this.heroWaitPromptBorder) this.heroWaitPromptBorder.y = dy;
    if (this._heroWaitPromptMaskGfx) this._heroWaitPromptMaskGfx.y = dy;
    if (this.heroWaitPromptOkGrad) this.heroWaitPromptOkGrad.y = dy;
    if (this._heroWaitPromptOkMask) this._heroWaitPromptOkMask.y = dy;
    // OkGfx 用的是相對座標 + setPosition，所以要用 setPosition 把它移到新位置
    this.heroWaitPromptOkGfx?.setPosition(CENTER_X, CENTER_Y + 90 + dy);
    const _hwH = 280;
    const _hwT = CENTER_Y - _hwH / 2;
    this.heroWaitPromptTitleLabel?.setPosition(CENTER_X, _hwT + dy);
    this.heroWaitPromptTitle?.setPosition(CENTER_X, _hwT + 8 + dy);
    this.heroWaitPromptBody?.setPosition(CENTER_X, CENTER_Y - 20 + dy);
    this.heroWaitPromptOkLabel?.setPosition(CENTER_X, CENTER_Y + 90 + dy);

    // 5. Hero seat (slot 0): 螢幕較短時跟著 bottomDy 上移，維持與 action 按鈕的固定間距
    // 上移量最多 -130：英雄座位已上移至 y=910，最多再上移 130 保留與公牌底部(612)約 168px 緩衝
    const heroSeatDy = Math.max(Math.min(0, newBottomDy), -130);
    const heroSeatDelta = heroSeatDy - (this._heroSeatDy ?? 0);
    this._heroSeatDy = heroSeatDy;
    if (Math.abs(heroSeatDelta) >= 0.5) {
      const s0 = this.seatViews?.[0];
      if (s0) {
        s0.posY += heroSeatDelta;
        [
          s0.profileBg, s0.profileFrame, s0.avatar, s0.foldOverlay,
          s0.roleBadge, s0.waitingBadge, s0.nametag, s0.name, s0.chips,
          s0.actionBadge, s0.betCoin, s0.betAmount,
          s0.sitPromptBg, s0.sitPromptCircle, s0.sitPromptPlus, s0.sitPromptLabel,
          s0.sweepArc, s0.glowOuter, s0.glowInner,
          s0.turnCountdownBg, s0.turnCountdown,
        ].forEach(obj => { if (obj?.y != null) obj.y += heroSeatDelta; });
        s0.betCoinStack?.forEach(s => { if (s?.y != null) s.y += heroSeatDelta; });
        s0.holeCards?.forEach(hc => { if (hc?.sprite?.y != null) hc.sprite.y += heroSeatDelta; });
      }
    }
  }

  resolveHeroSeatForDisplay(tableRaw = null) {
    const table = tableRaw || this.state?.table || null;
    const stateHeroSeat = parseSeat(this.state?.heroSeat);
    const players = Array.isArray(table?.players) ? table.players : [];
    if (stateHeroSeat !== null) {
      if (players.length <= 0 || players.some((player) => isSameSeat(player?.seat, stateHeroSeat))) {
        this.lastResolvedHeroSeat = stateHeroSeat;
        return stateHeroSeat;
      }
    }

    const localUsername = String(this.state?.user?.username ?? "").trim();
    if (localUsername && players.length > 0) {
      const localPlayer = players.find((player) => String(player?.username ?? "").trim() === localUsername);
      const localSeat = parseSeat(localPlayer?.seat);
      if (localSeat !== null) {
        this.lastResolvedHeroSeat = localSeat;
        return localSeat;
      }
    }

    const fallbackHeroSeat = parseSeat(this.lastResolvedHeroSeat);
    if (fallbackHeroSeat !== null) {
      if (players.length <= 0 || players.some((player) => isSameSeat(player?.seat, fallbackHeroSeat))) {
        return fallbackHeroSeat;
      }
    }
    return stateHeroSeat;
  }

  updatePotTextPosition() {
    if (!this.potCoinImage || !this.potText) {
      return;
    }
    const coinBottomY = this.potCoinImage.y + (POT_STACK_PER_COLOR - 1) * POT_STACK_V_STEP + this.potCoinImage.displayHeight * 0.5;
    this.potText.setPosition(DEAL_CARD_FROM_X, coinBottomY + POT_TEXT_GAP_Y).setOrigin(0.5, 0);
    const badgeY = coinBottomY + POT_TEXT_GAP_Y + CENTER_POT_BADGE_H / 2;
    this.centerPotBg?.setPosition(DEAL_CARD_FROM_X, badgeY);
    this.centerPotText?.setPosition(DEAL_CARD_FROM_X, badgeY);
  }

  playSfx(key, volume = 1) {
    if (!key) {
      return;
    }
    const outputScale = Number(this.app?.getSfxOutputVolume?.(1) ?? 0);
    if (outputScale <= 0) {
      return;
    }
    if (!this.cache.audio.exists(key)) {
      return;
    }
    const safeVolume = Math.max(0, Math.min(1, Number(volume) || 1));
    const outVolume = Math.max(0, Math.min(1, safeVolume * outputScale));
    if (outVolume <= 0) {
      return;
    }
    this.sound.play(key, { volume: outVolume });
  }

  playCountdownSfx() {
    if (!this.countdownSfxSound) return;
    const outputScale = Number(this.app?.getSfxOutputVolume?.(1) ?? 0);
    if (outputScale <= 0) return;
    const outVolume = Math.max(0, Math.min(1, COUNTDOWN_TIMER_SFX_VOLUME * outputScale));
    if (outVolume <= 0) return;
    try {
      if (this.countdownSfxSound.isPlaying) this.countdownSfxSound.stop();
      this.countdownSfxSound.setVolume(outVolume);
      this.countdownSfxSound.play();
    } catch (_) {}
  }

  stopCountdownSfx() {
    try {
      if (this.countdownSfxSound?.isPlaying) this.countdownSfxSound.stop();
    } catch (_) {}
  }

  trackSeatActionSfx(seatRaw, actionRaw, nextSeatActionMap) {
    const seat = parseSeat(seatRaw);
    if (seat === null || !nextSeatActionMap) {
      return;
    }
    const seatKey = String(seat);
    const action = String(actionRaw || "").toLowerCase();
    nextSeatActionMap[seatKey] = action;
    if (!this.seatActionMapReady) {
      return;
    }
    const prevAction = String(this.seatLastActionMap?.[seatKey] || "").toLowerCase();
    if (!action || action === prevAction) {
      return;
    }
    if (action === "allin") {
      this.playSfx(ALLIN_START_SFX_KEY, ALLIN_START_SFX_VOLUME);
    }
  }

  clearHandResultRows() {
    if (Array.isArray(this.handResultHeaderItems)) {
      this.handResultHeaderItems.forEach((item) => item?.destroy?.());
      this.handResultHeaderItems = [];
    }
    if (!Array.isArray(this.handResultRows) || this.handResultRows.length <= 0) {
      this.handResultRows = [];
      return;
    }
    this.handResultRows.forEach((item) => {
      if (item?.bg?.destroy) {
        item.bg.destroy();
      }
      if (item?.text?.destroy) {
        item.text.destroy();
      }
      if (item?.betText?.destroy) {
        item.betText.destroy();
      }
      if (item?.winText?.destroy) {
        item.winText.destroy();
      }
      if (item?.netText?.destroy) {
        item.netText.destroy();
      }
      if (item?.rankText?.destroy) {
        item.rankText.destroy();
      }
      if (Array.isArray(item?.cardImages)) {
        item.cardImages.forEach((cardImage) => {
          if (cardImage?.destroy) {
            cardImage.destroy();
          }
        });
      }
    });
    this.handResultRows = [];
  }

  closeHandResultModal() {
    this.isHandResultModalOpen = false;
    if (this.handResultAutoCloseTimer) {
      this.handResultAutoCloseTimer.remove();
      this.handResultAutoCloseTimer = null;
    }
    this.handResultAutoCloseEndAt = 0;
    const countdownSecs = this.state?.nextHandCountdownSeconds ?? 0;
    if (countdownSecs > 0 && this.nextHandCountdownEnd <= 0) {
      this.nextHandCountdownEnd = Date.now() + countdownSecs * 1000;
    }
    this.clearHandResultRows();
    this.handResultOverlay?.setVisible(false);
    this.handResultPanel?.setVisible(false);
    this.handResultPanelBorder?.setVisible(false);
    this.handResultDivider?.setVisible(false);
    this.handResultTitleLabel?.setVisible(false);
    this.handResultTitle?.setVisible(false);
    this.handResultHint?.setVisible(false);

    if (this._pendingLeaveAfterHandResult) {
      this._pendingLeaveAfterHandResult = false;
      const currentTableId = this.store.getState?.().table?.table_id ?? null;
      this.store.beginLeaveTable?.(currentTableId);
      this.app.sendPacket("leave_room", {});
      const _gameId = this.store.getState?.()?.table?.game_id || "texas_holdem";
      this.app.sendPacket("enter_game", { game_id: _gameId });
    }
  }

  buildHandResultDisplayRows(handResult) {
    const rawRows = Array.isArray(handResult?.player_results) ? handResult.player_results : [];
    const tablePlayers = Array.isArray(this.state?.table?.players) ? this.state.table.players : [];
    const playerBySeat = new Map();
    tablePlayers.forEach((player) => {
      const seat = parseSeat(player?.seat);
      if (seat !== null) playerBySeat.set(String(seat), player);
    });
    const rows = rawRows.map((item, index) => {
      const seat = parseSeat(item?.seat);
      const _nameChars = [...String(item?.username || `玩家${index + 1}`)];
      const username = _nameChars.slice(0, 4).join("");
      const contribAmount = Number(item?.contrib_amount ?? 0);
      const winAmount = Number(item?.win_amount ?? 0);
      const netRaw = Number(item?.net_amount);
      const netAmount = Number.isFinite(netRaw)
        ? netRaw
        : ((Number.isFinite(winAmount) ? winAmount : 0) - (Number.isFinite(contribAmount) ? contribAmount : 0));
      const cardFrames = extractBest5CardFrames(item?.best5);
      const rankText = resolveHandRankLabel(item?.hand_rank);
      const tablePlayer = seat === null ? null : playerBySeat.get(String(seat));
      const lastAction = String(tablePlayer?.last_action || "").toLowerCase();
      const isKnownFold = lastAction.startsWith("fold") || (tablePlayer?.in_hand === false && !(Number.isFinite(winAmount) && winAmount > 0));
      const isFold = isKnownFold || (!rankText && cardFrames.length <= 0 && (!Number.isFinite(winAmount) || winAmount <= 0));
      const betText = formatAmount(contribAmount);
      const winText = formatAmount(winAmount);
      const netText = formatSignedAmount(netAmount);
      const resultText = isFold ? "棄牌" : (rankText || "--");
      const amountColor = netAmount > 0
        ? HAND_RESULT_WIN_COLOR
        : (netAmount < 0 ? HAND_RESULT_LOSE_COLOR : HAND_RESULT_NEUTRAL_COLOR);
      return {
        seat,
        username,
        netAmount,
        contribAmount,
        winAmount,
        betText,
        winText,
        netText,
        resultText,
        amountColor,
        cardFrames,
        isFold,
      };
    });
    rows.sort((a, b) => {
      if (b.netAmount !== a.netAmount) {
        return b.netAmount - a.netAmount;
      }
      const seatA = Number.isFinite(a.seat) ? a.seat : 999;
      const seatB = Number.isFinite(b.seat) ? b.seat : 999;
      return seatA - seatB;
    });
    return rows;
  }

  openHandResultModal(handResult) {
    if (!this.sys?.displayList) return;
    const rows = this.buildHandResultDisplayRows(handResult);
    if (rows.length <= 0) {
      this.closeHandResultModal();
      return;
    }
    this.clearHandResultRows();
    this.isHandResultModalOpen = true;
    this.handResultAutoCloseEndAt = Date.now() + HAND_RESULT_AUTO_CLOSE_SECONDS * 1000;
    this.handResultHint?.setText(`點擊任意處關閉（${HAND_RESULT_AUTO_CLOSE_SECONDS} 秒）`);
    if (this.handResultAutoCloseTimer) {
      this.handResultAutoCloseTimer.remove();
    }
    let autoCloseDisplaySecs = HAND_RESULT_AUTO_CLOSE_SECONDS;
    this.handResultAutoCloseTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        autoCloseDisplaySecs = Math.max(0, autoCloseDisplaySecs - 1);
        if (autoCloseDisplaySecs > 0) {
          this.handResultHint?.setText(`點擊任意處關閉（${autoCloseDisplaySecs} 秒）`);
        } else {
          this.closeHandResultModal();
        }
      },
    });
    this.app?.playVoiceByKey?.("voice_congrats_winner");
    this.handResultOverlay?.setVisible(true);
    this.handResultPanel?.setVisible(true);
    this.handResultPanelBorder?.setVisible(true);
    this.handResultTitleLabel?.setVisible(true);
    this.handResultTitle?.setVisible(true);
    this.handResultHint?.setVisible(true);

    const heroSeat = this.resolveHeroSeatForDisplay(this.state?.table);
    const dy = this.modalDy || 0;
    const makeHeaderText = (x, y, str, originX = 0) => this.add
      .text(x, y + dy, str, {
        fontSize: HAND_RESULT_HEADER_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        stroke: "#000000",
        strokeThickness: 1.5,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
      .setOrigin(originX, 0.5);
    this.handResultHeaderItems = [
      makeHeaderText(CENTER_X + HAND_RESULT_NAME_X_OFFSET, HAND_RESULT_HEADER_Y, "玩家", 0),
      makeHeaderText(CENTER_X + HAND_RESULT_CONTRIB_X_OFFSET, HAND_RESULT_HEADER_Y, "下注", 1),
      makeHeaderText(CENTER_X + HAND_RESULT_WIN_X_OFFSET, HAND_RESULT_HEADER_Y, "贏分", 1),
      makeHeaderText(CENTER_X + HAND_RESULT_NET_X_OFFSET, HAND_RESULT_HEADER_Y, "結果", 1),
    ];

    rows.forEach((row, index) => {
      const rowY = HAND_RESULT_LIST_START_Y + index * HAND_RESULT_ROW_GAP + dy;
      const nameY = rowY + HAND_RESULT_NAME_Y_OFFSET;
      const rankY = rowY + HAND_RESULT_RANK_Y_OFFSET;
      const cardsY = rowY + HAND_RESULT_CARDS_Y_OFFSET;
      const isHeroRow = heroSeat !== null && row.seat !== null && row.seat === heroSeat;
      const rowL = CENTER_X - HAND_RESULT_ROW_WIDTH / 2;
      const rowT = rowY - HAND_RESULT_ROW_HEIGHT / 2;
      const rowMask = this.make.graphics({ add: false });
      rowMask.fillStyle(0xffffff);
      rowMask.fillRoundedRect(rowL, rowT, HAND_RESULT_ROW_WIDTH, HAND_RESULT_ROW_HEIGHT, HAND_RESULT_ROW_CORNER);
      const bg = this.add.graphics();
      bg.fillGradientStyle(
        isHeroRow ? HAND_RESULT_ROW_HERO_TOP : HAND_RESULT_ROW_NORMAL_TOP,
        isHeroRow ? HAND_RESULT_ROW_HERO_TOP : HAND_RESULT_ROW_NORMAL_TOP,
        isHeroRow ? HAND_RESULT_ROW_HERO_BOT : HAND_RESULT_ROW_NORMAL_BOT,
        isHeroRow ? HAND_RESULT_ROW_HERO_BOT : HAND_RESULT_ROW_NORMAL_BOT,
        1, 1, 1, 1,
      );
      bg.fillRect(rowL, rowT, HAND_RESULT_ROW_WIDTH, HAND_RESULT_ROW_HEIGHT);
      bg.setMask(rowMask.createGeometryMask());
      bg.lineStyle(1.5, isHeroRow ? 0xc84050 : 0x6a1828, 0.7);
      bg.strokeRoundedRect(rowL, rowT, HAND_RESULT_ROW_WIDTH, HAND_RESULT_ROW_HEIGHT, HAND_RESULT_ROW_CORNER);
      bg.setDepth(HAND_RESULT_TEXT_DEPTH);

      const text = this.add
        .text(CENTER_X + HAND_RESULT_NAME_X_OFFSET, nameY, row.username, {
          fontSize: HAND_RESULT_ROW_FONT_SIZE,
          color: HAND_RESULT_TEXT_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
        .setOrigin(0, 0.5);

      const betText = this.add
        .text(CENTER_X + HAND_RESULT_CONTRIB_X_OFFSET, nameY, row.betText, {
          fontSize: HAND_RESULT_ROW_FONT_SIZE,
          color: HAND_RESULT_NEUTRAL_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
        .setOrigin(1, 0.5);

      const winText = this.add
        .text(CENTER_X + HAND_RESULT_WIN_X_OFFSET, nameY, row.winText, {
          fontSize: HAND_RESULT_ROW_FONT_SIZE,
          color: row.winAmount > 0 ? HAND_RESULT_WIN_COLOR : HAND_RESULT_NEUTRAL_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
        .setOrigin(1, 0.5);

      const netText = this.add
        .text(CENTER_X + HAND_RESULT_NET_X_OFFSET, nameY, row.netText, {
          fontSize: HAND_RESULT_ROW_FONT_SIZE,
          color: row.amountColor,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
        .setOrigin(1, 0.5);

      const cardImages = [];
      if (!row.isFold) {
        row.cardFrames.forEach((frame, cardIndex) => {
          if (!this.textures.get(PLAYING_CARDS_ATLAS_KEY)?.has(frame)) {
            return;
          }
          const x = CENTER_X + HAND_RESULT_CARDS_START_X_OFFSET + cardIndex * (HAND_RESULT_CARD_WIDTH + HAND_RESULT_CARD_GAP);
          const shadow = this.add.graphics()
            .setDepth(HAND_RESULT_TEXT_DEPTH + 0.11);
          shadow.fillStyle(0x000000, 0.18);
          shadow.fillRoundedRect(x + 2, cardsY - HAND_RESULT_CARD_HEIGHT / 2 + 3, HAND_RESULT_CARD_WIDTH, HAND_RESULT_CARD_HEIGHT, 3);
          cardImages.push(shadow);
          const cardImage = this.add
            .image(x, cardsY, PLAYING_CARDS_ATLAS_KEY, frame)
            .setDisplaySize(HAND_RESULT_CARD_WIDTH, HAND_RESULT_CARD_HEIGHT)
            .setDepth(HAND_RESULT_TEXT_DEPTH + 0.12)
            .setOrigin(0, 0.5);
          cardImages.push(cardImage);
        });
      }

      const rankText = this.add
        .text(CENTER_X + HAND_RESULT_RANK_X_OFFSET, rankY, row.resultText, {
          fontSize: HAND_RESULT_HINT_FONT_SIZE,
          color: row.isFold ? HAND_RESULT_FOLD_COLOR : HAND_RESULT_HINT_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
        .setOrigin(0, 0.5);

      this.handResultRows.push({
        bg,
        text,
        betText,
        winText,
        netText,
        rankText,
        cardImages,
      });
    });
  }

  createHeroTableSfxSnapshot(table) {
    if (!table) {
      return null;
    }
    const tableId = String(table.table_id ?? "");
    if (!tableId) {
      return null;
    }
    const handId = Number(table.hand_id);
    const status = String(table.status || "").toLowerCase();
    const heroSeat = this.resolveHeroSeatForDisplay(table);
    if (heroSeat === null) {
      return { tableId, handId, status, heroChips: null };
    }
    const heroPlayer = Array.isArray(table.players)
      ? table.players.find((player) => isSameSeat(player?.seat, heroSeat))
      : null;
    const heroChips = Number(heroPlayer?.chips);
    return {
      tableId,
      handId,
      status,
      heroChips: Number.isFinite(heroChips) ? heroChips : null,
    };
  }

  tryPlayHeroResultSfx(currentTable) {
    const current = this.createHeroTableSfxSnapshot(currentTable);
    const previous = this.prevHeroTableSfxSnapshot;
    this.prevHeroTableSfxSnapshot = current;
    if (!current || !previous) {
      return;
    }
    if (current.tableId !== previous.tableId) {
      return;
    }
    if (!Number.isFinite(current.handId) || !Number.isFinite(previous.handId)) {
      return;
    }
    if (!Number.isFinite(current.heroChips) || !Number.isFinite(previous.heroChips)) {
      return;
    }
    const progressedToNextHand = current.handId > previous.handId;
    const settledSameHand = current.handId === previous.handId
      && previous.status !== "waiting"
      && current.status === "waiting";
    if (!progressedToNextHand && !settledSameHand) {
      return;
    }
    const resultHandId = progressedToNextHand ? previous.handId : current.handId;
    const handResultKey = `${current.tableId}|${resultHandId}`;
    if (this.lastPlayedHeroResultHandKey === handResultKey) {
      return;
    }
    const chipsDelta = current.heroChips - previous.heroChips;
    if (chipsDelta > 0) {
      this.playSfx(PLAYER_WIN_SFX_KEY, PLAYER_RESULT_SFX_VOLUME);
      this.lastPlayedHeroResultHandKey = handResultKey;
      return;
    }
    if (chipsDelta < 0) {
      this.playSfx(PLAYER_LOSE_SFX_KEY, PLAYER_RESULT_SFX_VOLUME);
      this.lastPlayedHeroResultHandKey = handResultKey;
    }
  }

  clearRoundBetCollectFx() {
    if (!Array.isArray(this.roundBetCollectFx) || this.roundBetCollectFx.length <= 0) {
      this.roundBetCollectFx = [];
      return;
    }
    this.roundBetCollectFx.forEach((item) => {
      this.tweens.killTweensOf(item);
      item.destroy?.();
    });
    this.roundBetCollectFx = [];
  }

  getRoundBetCollectTotalAmount(betsRaw) {
    return sumRoundBetsFromMap(betsRaw);
  }

  markRoundBetCollectVisualState(betsRaw, handIdRaw) {
    const handId = Number(handIdRaw);
    if (!Number.isFinite(handId)) {
      return;
    }
    const totalAmount = this.getRoundBetCollectTotalAmount(betsRaw);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return;
    }
    this.roundBetCollectCarryHandId = handId;
    this.roundBetCollectCarryAmount = totalAmount;
    this.roundBetCollectHiddenSeats.clear();
    Object.entries(betsRaw || {}).forEach(([seatRaw, amountRaw]) => {
      const amount = Number(amountRaw);
      const seat = parseSeat(seatRaw);
      if (seat === null || !Number.isFinite(amount) || amount <= 0) {
        return;
      }
      this.roundBetCollectHiddenSeats.add(seat);
    });
  }

  syncRoundBetCollectVisualState(table) {
    if (!table) {
      this.roundBetCollectCarryAmount = 0;
      this.roundBetCollectCarryHandId = null;
      this.roundBetCollectHiddenSeats.clear();
      return;
    }
    const handId = Number(table.hand_id);
    if (!Number.isFinite(handId) || this.roundBetCollectCarryHandId !== handId) {
      this.roundBetCollectCarryAmount = 0;
      this.roundBetCollectCarryHandId = null;
      this.roundBetCollectHiddenSeats.clear();
      return;
    }
    const activeSeatSet = new Set();
    Object.entries(table.bets || {}).forEach(([seatRaw, amountRaw]) => {
      const amount = Number(amountRaw);
      const seat = parseSeat(seatRaw);
      if (seat === null || !Number.isFinite(amount) || amount <= 0) {
        return;
      }
      activeSeatSet.add(seat);
    });
    // 仍有下注時：同步隱藏集合到「目前有下注的座位」。
    if (activeSeatSet.size > 0) {
      this.roundBetCollectHiddenSeats = activeSeatSet;
      return;
    }

    // 沒有下注時：若飛籌碼動畫還在跑，先保留隱藏狀態，避免同幀/下一幀又被畫回去。
    if ((this.roundBetCollectFx?.length || 0) > 0) {
      return;
    }

    this.roundBetCollectCarryAmount = 0;
    this.roundBetCollectCarryHandId = null;
    this.roundBetCollectHiddenSeats.clear();
  }

  shouldPlayRoundBetCollectAnimation(prevSnapshot, nextSnapshot) {
    if (!prevSnapshot || !nextSnapshot) {
      return false;
    }
    if (!prevSnapshot.tableId || !nextSnapshot.tableId || prevSnapshot.tableId !== nextSnapshot.tableId) {
      return false;
    }
    if (!Number.isFinite(prevSnapshot.handId) || !Number.isFinite(nextSnapshot.handId) || prevSnapshot.handId !== nextSnapshot.handId) {
      return false;
    }
    if (String(prevSnapshot.round || "") === String(nextSnapshot.round || "")) {
      return false;
    }
    if (!isBettingRoundName(prevSnapshot.round)) {
      return false;
    }
    // 收籌碼動畫只根據當下桌上可見下注（table.bets），不使用累積值，避免出現「桌上無籌碼仍飛」。
    const prevVisibleBets = prevSnapshot?.bets || {};
    return sumRoundBetsFromMap(prevVisibleBets) > 0;
  }

  shouldPlayBetChipSfx(prevSnapshot, nextSnapshot) {
    if (!prevSnapshot || !nextSnapshot) {
      return false;
    }
    if (!prevSnapshot.tableId || !nextSnapshot.tableId || prevSnapshot.tableId !== nextSnapshot.tableId) {
      return false;
    }
    if (!Number.isFinite(prevSnapshot.handId) || !Number.isFinite(nextSnapshot.handId) || prevSnapshot.handId !== nextSnapshot.handId) {
      return false;
    }
    const prevBets = prevSnapshot.bets || {};
    const nextBets = nextSnapshot.bets || {};
    return Object.entries(nextBets).some(([seatRaw, amountRaw]) => {
      const nextAmount = Number(amountRaw);
      if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
        return false;
      }
      const prevAmount = Number(prevBets[seatRaw] ?? 0);
      return nextAmount > prevAmount;
    });
  }

  buildRoundAccumulatedBets(table, prevSnapshot, nextSnapshot) {
    const result = {};
    const sameRoundAsPrev = Boolean(
      prevSnapshot
      && prevSnapshot.tableId === nextSnapshot.tableId
      && Number(prevSnapshot.handId) === Number(nextSnapshot.handId)
      && String(prevSnapshot.round || "") === String(nextSnapshot.round || "")
    );
    if (sameRoundAsPrev && prevSnapshot?.roundAccumulatedBets && typeof prevSnapshot.roundAccumulatedBets === "object") {
      Object.entries(prevSnapshot.roundAccumulatedBets).forEach(([seatRaw, amountRaw]) => {
        mergeSeatBetAmount(result, seatRaw, amountRaw);
      });
    }
    Object.entries(table?.bets || {}).forEach(([seatRaw, amountRaw]) => {
      mergeSeatBetAmount(result, seatRaw, amountRaw);
    });
    // 注意：這裡只使用 table.bets（本輪下注），不使用 player.bet。
    // 部分後端流程中 player.bet 可能是跨輪/歷史值，會造成 river 全員過牌時誤觸發收籌碼動畫。
    return result;
  }

  playRoundBetCollectAnimation(betsRaw) {
    if (!betsRaw || typeof betsRaw !== "object") {
      return;
    }
    const targetX = Number(this.potCoinImage?.x ?? DEAL_CARD_FROM_X);
    const targetY = Number(this.potCoinImage?.y ?? DEAL_CARD_FROM_Y);
    const activeEntries = Object.entries(betsRaw)
      .map(([seatRaw, amountRaw]) => ({ seat: parseSeat(seatRaw), amount: Number(amountRaw) }))
      .filter((item) => item.seat !== null && Number.isFinite(item.amount) && item.amount > 0);
    if (activeEntries.length <= 0) {
      return;
    }

    this.playSfx(CHIP_FLY_SFX_KEY, CHIP_FLY_SFX_VOLUME);

    activeEntries.forEach((item, index) => {
      const seatView = this.findSeatViewBySeatNo(item.seat);
      if (!seatView) {
        return;
      }
      // 飛籌碼開始就先把座位上的下注顯示隱藏，避免延遲消失。
      this.roundBetCollectHiddenSeats.add(item.seat);
      this.hideSeatBetCoins(seatView);
      seatView.betAmount.setText("").setVisible(false);
      const startX = Number(seatView.betAmount?.x ?? seatView.posX);
      const startY = Number(seatView.betAmount?.y ?? seatView.posY);
      const _flyChipValues = [1000, 500, 100, 50, 25, 5];
      const _flyChipFrames = ["token_black", "token_blue", "token_purple", "token_green", "token_yellow", "token_red"];
      let _flyFrame = "token_red";
      for (let _i = 0; _i < _flyChipValues.length; _i++) {
        if (item.amount >= _flyChipValues[_i]) { _flyFrame = _flyChipFrames[_i]; break; }
      }
      const fxCoin = this.add
        .image(startX, startY, DEAL_CARD_ATLAS_KEY, _flyFrame)
        .setDisplaySize(32, 32)
        .setDepth(ROUND_BET_COLLECT_COIN_DEPTH);
      const fxAmount = this.add
        .text(startX, startY, formatAmount(item.amount), {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: BET_AMOUNT_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...BET_AMOUNT_STROKE_STYLE,
          shadow: BET_AMOUNT_SHADOW,
        })
        .setOrigin(0.5)
        .setDepth(ROUND_BET_COLLECT_TEXT_DEPTH);
      this.roundBetCollectFx.push(fxCoin, fxAmount);

      this.tweens.add({
        targets: [fxCoin, fxAmount],
        x: targetX,
        y: targetY,
        alpha: 0.2,
        duration: ROUND_BET_COLLECT_DURATION,
        delay: index * ROUND_BET_COLLECT_STAGGER_MS,
        ease: "Cubic.In",
        onComplete: () => {
          fxCoin.destroy();
          fxAmount.destroy();
          this.roundBetCollectFx = this.roundBetCollectFx.filter((obj) => obj !== fxCoin && obj !== fxAmount);
        },
      });
    });
  }

  resolveRaiseActionModel(action) {
    const actionRequest = this.state?.actionRequest || {};
    const table = this.state?.table || {};
    const heroSeat = this.resolveHeroSeatForDisplay(table);
    const heroPlayer = heroSeat === null
      ? null
      : (Array.isArray(table.players) ? table.players.find((player) => isSameSeat(player?.seat, heroSeat)) : null);
    const myBet = Number(actionRequest.my_bet ?? heroPlayer?.bet ?? table?.bets?.[String(heroSeat)] ?? 0);
    const heroChips = Number(heroPlayer?.chips ?? 0);
    const toCallRaw = Number(actionRequest.to_call ?? 0);
    const toCall = Number.isFinite(toCallRaw) && toCallRaw > 0 ? Math.floor(toCallRaw) : 0;
    const potRaw = Number(actionRequest.pot ?? table.pot ?? 0);
    const pot = Number.isFinite(potRaw) && potRaw > 0 ? Math.floor(potRaw) : 0;
    const bigBlind = Number(actionRequest.big_blind ?? table.big_blind ?? 0);
    const minRaiseToRaw = Number(actionRequest.min_raise_to ?? 0);
    const minRaiseTo = Number.isFinite(minRaiseToRaw) && minRaiseToRaw > 0
      ? Math.floor(minRaiseToRaw)
      : Math.max(1, Math.floor(bigBlind * 2));
    const maxRaiseTo = Math.max(minRaiseTo, Math.floor(Math.max(0, myBet) + Math.max(0, heroChips)));
    const defaultValue = Math.max(minRaiseTo, Math.min(maxRaiseTo, Math.floor(bigBlind * 2)));
    // 底池快捷：以「底池加注」為目標（有 to_call 時，採用標準 pot-size raise）
    const potQuickBase = Math.floor(myBet) + pot + toCall * 2;
    const potQuickValue = Phaser.Math.Clamp(
      Number.isFinite(potQuickBase) ? potQuickBase : minRaiseTo,
      minRaiseTo,
      maxRaiseTo,
    );
    return {
      action,
      sliderMin: minRaiseTo,
      sliderMax: maxRaiseTo,
      bigBlind: Math.max(0, Math.floor(bigBlind)),
      toCall,
      pot,
      potQuickValue,
      myBet: Math.max(0, Math.floor(myBet)),
      heroChips: Math.max(0, Math.floor(heroChips)),
      defaultValue,
      isMovable: maxRaiseTo > minRaiseTo,
    };
  }

  normalizeRaisePanelSelected(value, model) {
    if (!model) {
      return 0;
    }
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) {
      return model.sliderMin;
    }
    return Phaser.Math.Clamp(n, model.sliderMin, model.sliderMax);
  }

  stepRaisePanelValue(dir) {
    const model = this.raiseActionModel;
    if (!model || !model.isMovable) return;
    const step = model.bigBlind > 0 ? model.bigBlind : 1;
    this.raiseSelectedValue = this.normalizeRaisePanelSelected(
      this.raiseSelectedValue + dir * step,
      model,
    );
    this.updateRaisePanelVisual();
  }

  setRaisePanelSliderInteractive(enabled) {
    if (enabled) {
      this.raisePanelSliderHit.setInteractive({ useHandCursor: true });
      this.raisePanelSliderKnob.setInteractive({ useHandCursor: true });
      this.input.setDraggable(this.raisePanelSliderKnob, true);
      return;
    }
    this.raisePanelSliderHit.disableInteractive();
    this.raisePanelSliderKnob.disableInteractive();
  }

  updateRaisePanelPosition(anchorXRaw) {
    const leftOffset = Number.isFinite(this.raisePanelCoverLeftOffset)
      ? this.raisePanelCoverLeftOffset
      : (-RAISE_PANEL_WIDTH * 0.5);
    const rightOffset = Number.isFinite(this.raisePanelCoverRightOffset)
      ? this.raisePanelCoverRightOffset
      : (RAISE_PANEL_WIDTH * 0.5);
    const minX = RAISE_PANEL_MARGIN_X - leftOffset;
    const maxX = VIEW_WIDTH - RAISE_PANEL_MARGIN_X - rightOffset;
    const fallbackX = Math.max(0, Math.min(VIEW_WIDTH, (minX + maxX) * 0.5));
    const anchorX = minX <= maxX
      ? Phaser.Math.Clamp(Number(anchorXRaw) || CENTER_X, minX, maxX)
      : fallbackX;
    this.raisePanelAnchorX = anchorX;
    const panelY = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + (this.bottomDy || 0);
    const panelCenterOffset = Number.isFinite(this.raisePanelCoverCenterOffset) ? this.raisePanelCoverCenterOffset : 0;

    this.raisePanelBg.setPosition(anchorX + panelCenterOffset, panelY);
    this._raisePanelBgMask?.setPosition(anchorX + panelCenterOffset, panelY);
    this.raisePanelDivider?.setPosition(anchorX, panelY + RAISE_PANEL_TITLE_Y_OFFSET + 22);
    this.raisePanelAmountBg?.setPosition(anchorX, panelY + RAISE_PANEL_AMOUNT_Y_OFFSET);
    this.raisePanelTitle.setPosition(anchorX, panelY + RAISE_PANEL_TITLE_Y_OFFSET);
    this.raisePanelAmountText.setPosition(anchorX, panelY + RAISE_PANEL_AMOUNT_Y_OFFSET);
    this.raisePanelRangeText.setPosition(anchorX, panelY + RAISE_PANEL_RANGE_Y_OFFSET);

    const _btnAmountY = panelY + RAISE_PANEL_AMOUNT_Y_OFFSET;
    this.raisePanelMinusBtn?.setPosition(
      anchorX - RAISE_PANEL_AMOUNT_BOX_W / 2 - RAISE_PANEL_STEP_BTN_GAP - RAISE_PANEL_STEP_BTN_SIZE / 2,
      _btnAmountY,
    );
    this.raisePanelPlusBtn?.setPosition(
      anchorX + RAISE_PANEL_AMOUNT_BOX_W / 2 + RAISE_PANEL_STEP_BTN_GAP + RAISE_PANEL_STEP_BTN_SIZE / 2,
      _btnAmountY,
    );

    this.raisePanelSliderTrack.setPosition(anchorX, panelY + RAISE_PANEL_SLIDER_Y_OFFSET);
    this.raisePanelSliderHit.setPosition(anchorX, panelY + RAISE_PANEL_SLIDER_Y_OFFSET);

    this.raiseQuickButtons.forEach((item, index) => {
      const quickX = anchorX + (index - 1.5) * (RAISE_PANEL_QUICK_WIDTH + RAISE_PANEL_QUICK_GAP);
      const quickY = panelY + RAISE_PANEL_QUICK_Y_OFFSET;
      item.button.setPosition(quickX, quickY);
    });

    this.raisePanelConfirm.setPosition(
      anchorX + (this.raisePanelConfirmInlineXOffset ?? RAISE_PANEL_CONFIRM_X_OFFSET),
      panelY + RAISE_PANEL_QUICK_Y_OFFSET,
    );
  }

  updateRaisePanelVisual() {
    const model = this.raiseActionModel;
    if (!model) {
      return;
    }
    this.raisePanelAmountText.setText(formatAmount(this.raiseSelectedValue));
    this.raisePanelRangeText.setText(`範圍 ${formatAmount(model.sliderMin)} ~ ${formatAmount(model.sliderMax)}`);

    const span = model.sliderMax - model.sliderMin;
    const progress = span > 0
      ? Phaser.Math.Clamp((this.raiseSelectedValue - model.sliderMin) / span, 0, 1)
      : 0;
    const fillWidth = Math.floor(RAISE_PANEL_SLIDER_TRACK_WIDTH * progress);
    const sliderStartX = this.raisePanelAnchorX - RAISE_PANEL_SLIDER_TRACK_WIDTH * 0.5;
    const sliderY = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET + (this.bottomDy || 0);
    this.raisePanelSliderFill.setPosition(sliderStartX, sliderY);
    this.raisePanelSliderFill._drawFill(fillWidth);
    this.raisePanelSliderKnob.setPosition(
      sliderStartX + RAISE_PANEL_SLIDER_TRACK_WIDTH * progress,
      sliderY,
    );

    const sliderAlpha = model.isMovable ? 1 : 0.5;
    this.raisePanelSliderTrack.setAlpha(sliderAlpha);
    this.raisePanelSliderFill.setAlpha(sliderAlpha);
    this.raisePanelSliderKnob.setAlpha(sliderAlpha);
    this.raisePanelMinusBtn?.setEnabled(model.isMovable);
    this.raisePanelPlusBtn?.setEnabled(model.isMovable);

    this.raiseQuickButtons.forEach((item) => {
      let targetValue = model.sliderMin;
      if (item.kind === "bb") {
        targetValue = model.bigBlind > 0 ? model.bigBlind * item.value : model.sliderMin;
      } else if (item.kind === "pot") {
        targetValue = model.potQuickValue;
      }
      const clamped = this.normalizeRaisePanelSelected(targetValue, model);
      const isActive = clamped === this.raiseSelectedValue;
      item.button.setGradient(
        isActive ? 0x7a4010 : 0x3a1c08,
        isActive ? 0x3a1808 : 0x140804,
        isActive ? RAISE_PANEL_BORDER_COLOR : RAISE_PANEL_QUICK_STROKE_COLOR,
      );
    });
  }

  handleRaisePanelSliderPointer(pointerX) {
    const model = this.raiseActionModel;
    if (!model || !model.isMovable) {
      return;
    }
    const sliderStartX = this.raisePanelAnchorX - RAISE_PANEL_SLIDER_TRACK_WIDTH * 0.5;
    const progress = Phaser.Math.Clamp((Number(pointerX) - sliderStartX) / RAISE_PANEL_SLIDER_TRACK_WIDTH, 0, 1);
    const nextValue = Math.round(model.sliderMin + (model.sliderMax - model.sliderMin) * progress);
    this.raiseSelectedValue = this.normalizeRaisePanelSelected(nextValue, model);
    this.updateRaisePanelVisual();
  }

  applyRaiseQuickChoice(item) {
    const model = this.raiseActionModel;
    if (!model) {
      return;
    }
    let nextValue = model.sliderMin;
    if (item?.kind === "bb") {
      nextValue = model.bigBlind > 0 ? model.bigBlind * Number(item.value) : model.sliderMin;
    } else if (item?.kind === "pot") {
      nextValue = model.potQuickValue;
    }
    this.raiseSelectedValue = this.normalizeRaisePanelSelected(nextValue, model);
    this.updateRaisePanelVisual();
  }

  openRaiseActionPanel(action) {
    const button = this.actionButtons?.[action];
    if (!button || !button.visible) {
      return;
    }
    const model = this.resolveRaiseActionModel(action);
    this.raiseActionType = action;
    this.raiseActionModel = model;
    this.raiseSelectedValue = this.normalizeRaisePanelSelected(model.defaultValue, model);
    this.updateRaisePanelPosition(Number(button.x) || CENTER_X);
    this.isRaisePanelOpen = true;

    this.raisePanelOverlay.setVisible(true);
    this.raisePanelBg.setVisible(true);
    this.raisePanelTopAccent?.setVisible(true);
    this.raisePanelDivider?.setVisible(true);
    this.raisePanelAmountBg?.setVisible(true);
    this.raisePanelTitle.setVisible(true);
    this.raisePanelAmountText.setVisible(true);
    this.raisePanelMinusBtn?.setVisible(true);
    this.raisePanelPlusBtn?.setVisible(true);
    this.raisePanelRangeText.setVisible(true);
    this.raisePanelSliderTrack.setVisible(true);
    this.raisePanelSliderFill.setVisible(true);
    this.raisePanelSliderHit.setVisible(true);
    this.raisePanelSliderKnob.setVisible(true);
    this.raisePanelConfirm.setVisible(true);
    this.raisePanelConfirm.setEnabled(true);
    this.raiseQuickButtons.forEach((item) => { item.button.setVisible(true); item.button.setEnabled(true); });
    this.setRaisePanelSliderInteractive(model.isMovable);
    this.updateRaisePanelVisual();
  }

  closeRaiseActionPanel() {
    this.isRaisePanelOpen = false;
    this.soundSettingsPanel = null;
    this.raiseActionType = null;
    this.raiseActionModel = null;
    this.raiseSelectedValue = 0;
    this.raisePanelOverlay?.setVisible(false);
    this.raisePanelBg?.setVisible(false);
    this.raisePanelTopAccent?.setVisible(false);
    this.raisePanelDivider?.setVisible(false);
    this.raisePanelAmountBg?.setVisible(false);
    this.raisePanelTitle?.setVisible(false);
    this.raisePanelAmountText?.setVisible(false);
    this.raisePanelMinusBtn?.setVisible(false);
    this.raisePanelPlusBtn?.setVisible(false);
    this.raisePanelRangeText?.setVisible(false);
    this.raisePanelSliderTrack?.setVisible(false);
    this.raisePanelSliderFill?.setVisible(false);
    this.raisePanelSliderHit?.setVisible(false);
    this.raisePanelSliderKnob?.setVisible(false);
    this.raisePanelConfirm?.setVisible(false);
    this.raiseQuickButtons?.forEach((item) => item.button.setVisible(false));
    this.setRaisePanelSliderInteractive(false);
  }

  buildSwitchRoomConfirmDialog() {
    this.switchConfirmOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.6)
      .setDepth(SWITCH_CONFIRM_OVERLAY_DEPTH)
      .setVisible(false)
      .setInteractive();

    const panelH = 310;
    const cr = SWITCH_CONFIRM_CORNER_RADIUS;
    const W = SWITCH_CONFIRM_PANEL_WIDTH;

    // Gradient fill masked to rounded-rect shape (single layer, no seam)
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRoundedRect(CENTER_X - W / 2, CENTER_Y - panelH / 2, W, panelH, cr);
    this.switchConfirmPanelMask = maskGfx;

    const panelGradGfx = this.add.graphics();
    panelGradGfx.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.97, 0.97, 0.97, 0.97);
    panelGradGfx.fillRect(CENTER_X - W / 2, CENTER_Y - panelH / 2, W, panelH);
    panelGradGfx.setMask(maskGfx.createGeometryMask());
    panelGradGfx.setDepth(SWITCH_CONFIRM_PANEL_DEPTH).setVisible(false);
    this.switchConfirmPanelGrad = panelGradGfx;

    const panelGfx = this.add.graphics();
    drawEnhancedBorder(panelGfx, CENTER_X - W / 2, CENTER_Y - panelH / 2, W, panelH, cr);
    panelGfx.setDepth(SWITCH_CONFIRM_PANEL_DEPTH - 0.5).setVisible(false);
    this.switchConfirmPanel = panelGfx;

    const _switchTitleLabelY = CENTER_Y - panelH / 2;
    this.switchConfirmTitleLabel = this.add
      .image(CENTER_X, _switchTitleLabelY, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(320, 112)
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH - 0.5)
      .setVisible(false);

    this.switchConfirmTitle = this.add
      .text(CENTER_X, _switchTitleLabelY + 8, "系統提示", {
        fontSize: "34px", color: "#f0c040", fontStyle: "bold",
        fontFamily: UI_FONT_STACK, stroke: "#000000", strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH)
      .setVisible(false);
    applyGoldTitleGradient(this.switchConfirmTitle);

    this.switchConfirmBody = this.add
      .text(CENTER_X, CENTER_Y - 35, "遊戲進行中，必須等本局結束才可離開\n確認後將自動棄牌並於本局結束後換桌", {
        fontSize: "24px", color: "#e8d2ad", fontFamily: UI_FONT_STACK,
        align: "center", lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH)
      .setVisible(false);

    const btnY = CENTER_Y + 90;

    this.switchConfirmCancelBtn = createGradientButton(this, {
      x: CENTER_X - 118, y: btnY,
      width: 210, height: 70, cornerRadius: 10,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "取消",
      labelStyle: { fontSize: "28px", color: "#e8d2ad", fontStyle: "bold", fontFamily: UI_FONT_STACK },
      depth: SWITCH_CONFIRM_TEXT_DEPTH,
      onClick: () => this.closeSwitchRoomConfirmDialog(),
      visible: false,
    });

    this.switchConfirmOkBtn = createGradientButton(this, {
      x: CENTER_X + 118, y: btnY,
      width: 210, height: 70, cornerRadius: 10,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認",
      labelStyle: { fontSize: "28px", color: "#ffffff", fontStyle: "bold", fontFamily: UI_FONT_STACK },
      depth: SWITCH_CONFIRM_TEXT_DEPTH,
      onClick: () => { this.closeSwitchRoomConfirmDialog(); this._switchConfirmCallback?.(); },
      visible: false,
    });
  }

  openSwitchRoomConfirmDialog(onConfirm) {
    this.switchConfirmOverlay?.setVisible(true);
    this.switchConfirmPanelGrad?.setVisible(true);
    this.switchConfirmPanel?.setVisible(true);
    this.switchConfirmTitleLabel?.setVisible(true);
    this.switchConfirmTitle?.setVisible(true);
    this.switchConfirmBody?.setVisible(true);
    this._switchConfirmCallback = onConfirm;
    this.switchConfirmCancelBtn?.setVisible(true);
    this.switchConfirmOkBtn?.setVisible(true);
  }

  closeSwitchRoomConfirmDialog() {
    this.switchConfirmOverlay?.setVisible(false);
    this.switchConfirmPanelGrad?.setVisible(false);
    this.switchConfirmPanel?.setVisible(false);
    this.switchConfirmTitleLabel?.setVisible(false);
    this.switchConfirmTitle?.setVisible(false);
    this.switchConfirmBody?.setVisible(false);
    this.switchConfirmCancelBtn?.setVisible(false);
    this.switchConfirmOkBtn?.setVisible(false);
  }

  buildHeroWaitingJoinPrompt() {
    const W = 520;
    const H = 280;
    const cr = 16;
    const L = CENTER_X - W / 2;
    const T = CENTER_Y - H / 2;

    this.heroWaitPromptOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.6)
      .setDepth(SWITCH_CONFIRM_OVERLAY_DEPTH)
      .setVisible(false)
      .setInteractive();

    this._heroWaitPromptMaskGfx = this.make.graphics({ add: false });
    this._heroWaitPromptMaskGfx.fillStyle(0xffffff);
    this._heroWaitPromptMaskGfx.fillRoundedRect(L, T, W, H, cr);
    this.heroWaitPromptGrad = this.add.graphics();
    this.heroWaitPromptGrad.fillGradientStyle(0x2e1a0c, 0x2e1a0c, 0x050201, 0x050201, 0.97, 0.97, 0.97, 0.97);
    this.heroWaitPromptGrad.fillRect(L, T, W, H);
    this.heroWaitPromptGrad.setMask(this._heroWaitPromptMaskGfx.createGeometryMask());
    this.heroWaitPromptGrad.setDepth(SWITCH_CONFIRM_PANEL_DEPTH).setVisible(false);

    this.heroWaitPromptBorder = this.add.graphics();
    drawEnhancedBorder(this.heroWaitPromptBorder, L, T, W, H, cr);
    this.heroWaitPromptBorder.setDepth(SWITCH_CONFIRM_PANEL_DEPTH - 0.5).setVisible(false);

    this.heroWaitPromptTitleLabel = this.add
      .image(CENTER_X, T, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(320, 112)
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH - 0.5).setVisible(false);
    this.heroWaitPromptTitle = this.add
      .text(CENTER_X, T + 8, "系統提示", {
        fontSize: "34px", color: "#f0c040", fontStyle: "bold",
        fontFamily: UI_FONT_STACK, stroke: "#000000", strokeThickness: 1,
      })
      .setOrigin(0.5).setDepth(SWITCH_CONFIRM_TEXT_DEPTH).setVisible(false);
    applyGoldTitleGradient(this.heroWaitPromptTitle);
    this.heroWaitPromptBody = this.add
      .text(CENTER_X, CENTER_Y - 20, "遊戲進行中，\n請等舊局結束後才可入座", {
        fontSize: "26px", color: "#e8d2ad", fontFamily: UI_FONT_STACK,
        align: "center", lineSpacing: 8,
      })
      .setOrigin(0.5).setDepth(SWITCH_CONFIRM_TEXT_DEPTH).setVisible(false);

    const btnW = 160;
    const btnH = 58;
    const btnR = 10;
    const btnY = CENTER_Y + 90;
    this._heroWaitPromptOkMask = this.make.graphics({ add: false });
    this._heroWaitPromptOkMask.fillStyle(0xffffff);
    this._heroWaitPromptOkMask.fillRoundedRect(CENTER_X - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR);
    this.heroWaitPromptOkGrad = this.add.graphics();
    this.heroWaitPromptOkGrad.fillGradientStyle(0x5a3820, 0x5a3820, 0x1a0a04, 0x1a0a04, 1, 1, 1, 1);
    this.heroWaitPromptOkGrad.fillRect(CENTER_X - btnW / 2, btnY - btnH / 2, btnW, btnH);
    this.heroWaitPromptOkGrad.setMask(this._heroWaitPromptOkMask.createGeometryMask());
    this.heroWaitPromptOkGrad.setDepth(SWITCH_CONFIRM_PANEL_DEPTH + 0.1).setVisible(false);

    this.heroWaitPromptOkGfx = this.add.graphics();
    this.heroWaitPromptOkGfx.lineStyle(2.5, 0x7a4818, 0.9);
    this.heroWaitPromptOkGfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnR);
    this.heroWaitPromptOkGfx.setPosition(CENTER_X, btnY)
      .setDepth(SWITCH_CONFIRM_PANEL_DEPTH + 0.15).setVisible(false);
    this.heroWaitPromptOkGfx.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains,
    );
    this.heroWaitPromptOkGfx.on("pointerdown", () => { playUiClick(this); this.closeHeroWaitingJoinPrompt(); });

    this.heroWaitPromptOkLabel = this.add
      .text(CENTER_X, btnY, "確定", {
        fontSize: "28px", color: "#e8d2ad", fontStyle: "bold", fontFamily: UI_FONT_STACK,
      })
      .setOrigin(0.5).setDepth(SWITCH_CONFIRM_TEXT_DEPTH).setVisible(false);
  }

  showHeroWaitingJoinPrompt() {
    const canJoin = Boolean(this.app?.isHeroSwitchOldHandDone?.());
    this.heroWaitPromptBody?.setText(
      canJoin
        ? "舊局已結束，\n確認立即入座？"
        : "遊戲進行中，\n請等舊局結束後才可入座",
    );
    this.heroWaitPromptOkLabel?.setText(canJoin ? "確認入座" : "確定");
    this.heroWaitPromptOkGfx?.off("pointerdown");
    if (canJoin) {
      this.heroWaitPromptOkGfx?.on("pointerdown", () => {
        playUiClick(this);
        this.closeHeroWaitingJoinPrompt();
        this.app?.clearHeroSwitchMode?.();
        this.store?.clearSwitchPending?.();
      });
    } else {
      this.heroWaitPromptOkGfx?.on("pointerdown", () => { playUiClick(this); this.closeHeroWaitingJoinPrompt(); });
    }
    this.heroWaitPromptOverlay?.setVisible(true);
    this.heroWaitPromptGrad?.setVisible(true);
    this.heroWaitPromptBorder?.setVisible(true);
    this.heroWaitPromptTitleLabel?.setVisible(true);
    this.heroWaitPromptTitle?.setVisible(true);
    this.heroWaitPromptBody?.setVisible(true);
    this.heroWaitPromptOkGrad?.setVisible(true);
    this.heroWaitPromptOkGfx?.setVisible(true);
    this.heroWaitPromptOkLabel?.setVisible(true);
  }

  closeHeroWaitingJoinPrompt() {
    this.heroWaitPromptOverlay?.setVisible(false);
    this.heroWaitPromptGrad?.setVisible(false);
    this.heroWaitPromptBorder?.setVisible(false);
    this.heroWaitPromptTitleLabel?.setVisible(false);
    this.heroWaitPromptTitle?.setVisible(false);
    this.heroWaitPromptBody?.setVisible(false);
    this.heroWaitPromptOkGrad?.setVisible(false);
    this.heroWaitPromptOkGfx?.setVisible(false);
    this.heroWaitPromptOkLabel?.setVisible(false);
  }

  confirmRaiseAction() {
    if (!this.state?.actionRequest || !this.raiseActionType || !this.raiseActionModel) {
      return;
    }
    const raiseTo = this.normalizeRaisePanelSelected(this.raiseSelectedValue, this.raiseActionModel);
    const action = this.raiseActionType;
    this.closeRaiseActionPanel();
    this.app.sendPacket("player_action", { action, raise_to: raiseTo });
  }

  layoutActionButtons(allowedRaw) {
    const allowed = Array.isArray(allowedRaw)
      ? allowedRaw.map((item) => String(item || "").toLowerCase())
      : [];
    const visibleActions = ACTION_BUTTON_ORDER.filter((action) => allowed.includes(action) && this.actionButtons[action]);

    Object.values(this.actionButtons).forEach((button) => {
      button._inactive = false;
      button.setVisible(false).clearTint().disableInteractive();
    });

    if (this.app?.isHandReplayActive?.()) {
      this.closeRaiseActionPanel();
      return;
    }

    if (visibleActions.length <= 0) {
      this.closeRaiseActionPanel();
      const inactiveActions = ACTION_BUTTON_INACTIVE_DISPLAY.filter((a) => this.actionButtons[a]);
      const iCount = inactiveActions.length;
      const iMaxW = Math.floor((VIEW_WIDTH - ACTION_BUTTON_LAYOUT_PADDING - ACTION_BUTTON_GAP * Math.max(iCount - 1, 0)) / Math.max(iCount, 1));
      const iBtnW = Math.min(ACTION_BUTTON_WIDTH, iMaxW);
      const iBtnH = Math.round(iBtnW * ACTION_BUTTON_HEIGHT / ACTION_BUTTON_WIDTH);
      inactiveActions.forEach((a) => this.actionButtons[a].setDisplaySize(iBtnW, iBtnH));
      const iWidths = inactiveActions.map((a) => Number(this.actionButtons[a].displayWidth || 0));
      const iTotalWidth = iWidths.reduce((s, w) => s + w, 0) + ACTION_BUTTON_GAP * (inactiveActions.length - 1);
      let iCursorX = CENTER_X - iTotalWidth / 2;
      inactiveActions.forEach((action, i) => {
        const button = this.actionButtons[action];
        button._inactive = true;
        button.setPosition(iCursorX + iWidths[i] / 2, ACTION_ROW_Y + (this.bottomDy || 0))
          .setVisible(true)
          .setTint(ACTION_BUTTON_INACTIVE_TINT)
          .setInteractive({ useHandCursor: false, pixelPerfect: true, alphaTolerance: 10 });
        iCursorX += iWidths[i] + ACTION_BUTTON_GAP;
      });
      return;
    }

    const count = visibleActions.length;
    const maxBtnW = Math.floor((VIEW_WIDTH - ACTION_BUTTON_LAYOUT_PADDING - ACTION_BUTTON_GAP * Math.max(count - 1, 0)) / Math.max(count, 1));
    const btnW = Math.min(ACTION_BUTTON_WIDTH, maxBtnW);
    const btnH = Math.round(btnW * ACTION_BUTTON_HEIGHT / ACTION_BUTTON_WIDTH);
    visibleActions.forEach((a) => this.actionButtons[a].setDisplaySize(btnW, btnH));

    const widths = visibleActions.map((action) => Number(this.actionButtons[action].displayWidth || 0));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + ACTION_BUTTON_GAP * (visibleActions.length - 1);
    let cursorX = CENTER_X - totalWidth / 2;

    visibleActions.forEach((action, index) => {
      const button = this.actionButtons[action];
      const width = widths[index];
      const x = cursorX + width / 2;
      button.setPosition(x, ACTION_ROW_Y + (this.bottomDy || 0)).setVisible(true);
      button.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 10 });
      cursorX += width + ACTION_BUTTON_GAP;
    });

    if (this.isRaisePanelOpen) {
      const action = this.raiseActionType;
      const actionStillAllowed = Boolean(action && visibleActions.includes(action));
      const anchorButton = actionStillAllowed ? this.actionButtons[action] : null;
      if (!actionStillAllowed || !anchorButton?.visible) {
        this.closeRaiseActionPanel();
      } else {
        this.updateRaisePanelPosition(Number(anchorButton.x) || CENTER_X);
        this.updateRaisePanelVisual();
      }
    }
  }

  buildSeatViews(seatCount, seatStart = DEFAULT_SEAT_START) {
    if (!this.sys?.displayList) return;
    this.seatViews.forEach((item) => {
      if (item.jumpTween) {
        item.jumpTween.remove();
      }
      if (item.sweepTween) {
        item.sweepTween.remove();
      }
      if (item.glowOuterTween) {
        item.glowOuterTween.remove();
      }
      if (item.glowInnerTween) {
        item.glowInnerTween.remove();
      }
      if (item.nametagBreathTween) {
        item.nametagBreathTween.remove();
      }
      item.nametagGlow?.destroy();
      item.sweepArc.destroy();
      item.glowOuter.destroy();
      item.glowInner.destroy();
      item.profileBg?.destroy();
      item.profileFrame?.destroy();
      item.avatar.destroy();
      item.roleBadge.destroy();
      item.waitingBadge?.destroy();
      item.betCoinStack?.forEach(img => img.destroy());
      item.betAmount.destroy();
      item.turnCountdownBg.destroy();
      item.turnCountdown.destroy();
      item.holeCards?.forEach((holeCard) => {
        this.stopHoleCardFlipAnimation(holeCard);
        holeCard.sprite.destroy();
        holeCard.cardShadow?.destroy();
        holeCard.cardMaskGfx?.destroy();
      });
      item.foldOverlay?.destroy();
      item.nametag?.destroy();
      item.sitPromptBg?.destroy();
      item.name.destroy();
      item.chips.destroy();
      item.actionBadge.destroy();
      item.sitPromptCircle.destroy();
      item.sitPromptPlus.destroy();
      item.sitPromptLabel.destroy();
    });
    this.seatViews = [];

    const positions = seatPositionsByCount();
    positions.forEach((pos, idx) => {
      const seatNo = seatStart + idx;
      const avatarFlipX = shouldFlipSeatAvatar(idx);
      const sweepArc = this.add
        .arc(pos.x, pos.y, TURN_SWEEP_ARC_RADIUS, 0, TURN_SPIN_ARC_DEGREES, false, 0x000000, 0)
        .setStrokeStyle(TURN_SWEEP_STROKE_WIDTH, TURN_GLOW_COLOR, TURN_SWEEP_STROKE_ALPHA)
        .setDepth(SEAT_FX_DEPTH)
        .setVisible(false);
      const glowOuter = this.add
        .circle(pos.x, pos.y, TURN_GLOW_OUTER_RADIUS, TURN_GLOW_COLOR, TURN_GLOW_FILL_ALPHA_OUTER)
        .setStrokeStyle(TURN_GLOW_STROKE_WIDTH_OUTER, TURN_GLOW_COLOR, TURN_GLOW_OUTER_ALPHA)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(SEAT_FX_DEPTH)
        .setVisible(false);
      const glowInner = this.add
        .circle(pos.x, pos.y, TURN_GLOW_INNER_RADIUS, TURN_GLOW_COLOR, TURN_GLOW_FILL_ALPHA_INNER)
        .setStrokeStyle(TURN_GLOW_STROKE_WIDTH_INNER, TURN_GLOW_COLOR, TURN_GLOW_INNER_ALPHA)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(SEAT_FX_DEPTH)
        .setVisible(false);
      const profileFrame = this.add
        .image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "profile_frame_off")
        .setScale(1.72)
        .setDepth(SEAT_PROFILE_FRAME_DEPTH)
        .setVisible(false);
      const profileBgRadius = Math.min(profileFrame.displayWidth, profileFrame.displayHeight) * 0.44 - PROFILE_BG_PADDING;
      const profileBg = this.add
        .graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
        .fillStyle(PROFILE_BG_COLORS[Math.floor(Math.random() * PROFILE_BG_COLORS.length)], 1)
        .fillCircle(0, 0, profileBgRadius)
        .setDepth(SEAT_PROFILE_BG_DEPTH)
        .setVisible(false);
      const avatarBaseSize = Math.min(profileFrame.displayWidth, profileFrame.displayHeight) * PROFILE_AVATAR_INNER_RATIO;
      const avatar = this.add
        .image(pos.x, pos.y + AVATAR_Y_OFFSET, "avatar_element", "avatar_1")
        .setDisplaySize(avatarBaseSize, avatarBaseSize)
        .setFlipX(avatarFlipX)
        .setDepth(SEAT_AVATAR_DEPTH)
        .setVisible(false);
      const foldOverlay = this.add
        .arc(pos.x, pos.y + AVATAR_Y_OFFSET, 80, 0, 360, false, 0x000000, 0.55)
        .setDepth(SEAT_AVATAR_DEPTH + 1)
        .setVisible(false);
      const roleBadge = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "dealer_seat")
        .setDepth(SEAT_ROLE_BADGE_DEPTH)
        .setScale(0.63)
        .setVisible(false);
      const waitingBadge = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "waiting")
        .setScale(0.62)
        .setDepth(SEAT_ROLE_BADGE_DEPTH + 0.1)
        .setVisible(false);
      const betCoinStack = Array.from({ length: 3 }, (_, ti) =>
        this.add.image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "token_red")
          .setDisplaySize(32, 32)
          .setDepth(SEAT_BET_COIN_DEPTH + ti * 0.01)
          .setVisible(false)
      );
      const betCoin = betCoinStack[0];
      const betAmount = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: BET_AMOUNT_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...BET_AMOUNT_STROKE_STYLE,
          shadow: BET_AMOUNT_SHADOW,
        })
        .setDepth(SEAT_BET_TEXT_DEPTH)
        .setOrigin(0.5, 0)
        .setVisible(false);
      const holeCards = Array.from({ length: DEAL_CARD_MAX_HOLE_COUNT }, (_, cardIndex) => {
        const target = this.resolveDealTargetPosition({ posX: pos.x, posY: pos.y, avatarFlipX }, cardIndex);
        const angle = dealCardAngleByIndex(cardIndex);
        const sprite = this.add
          .image(target.x, target.y, DEAL_CARD_ATLAS_KEY, DEAL_CARD_FRAME)
          .setScale(DEAL_CARD_NORMAL_SCALE)
          .setDepth(SEAT_HOLE_CARD_DEPTH + cardIndex * 2)
          .setAngle(angle)
          .setVisible(false);
        const cardMaskGfx = null;
        const cardShadow = this.add.graphics()
          .setDepth(SEAT_HOLE_CARD_DEPTH + cardIndex * 2 - 0.5)
          .setVisible(false);
        cardShadow.fillStyle(0x000000, 0.15).fillRoundedRect(-65, -90, 130, 180, 4);
        return {
          sprite,
          cardMaskGfx,
          cardShadow,
          baseScaleX: sprite.scaleX,
          baseScaleY: sprite.scaleY,
          inFlight: false,
          isFlipping: false,
          faceFrameKey: null,
          targetFaceFrameKey: null,
          flipOutTween: null,
          flipInTween: null,
          flipPopTween: null,
        };
      });
      const turnCountdownBg = this.add
        .arc(pos.x, pos.y, TURN_COUNTDOWN_BG_RADIUS, 0, 360, false, TURN_COUNTDOWN_BG_COLOR, TURN_COUNTDOWN_BG_ALPHA)
        .setStrokeStyle(TURN_COUNTDOWN_RING_WIDTH, TURN_COUNTDOWN_RING_COLOR, 1)
        .setDepth(SEAT_COUNTDOWN_DEPTH - 0.1)
        .setVisible(false);
      const turnCountdown = this.add
        .text(pos.x, pos.y, "", {
          fontSize: TURN_COUNTDOWN_FONT_SIZE,
          color: TURN_COUNTDOWN_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setOrigin(0.5)
        .setAlpha(TURN_COUNTDOWN_ALPHA)
        .setDepth(SEAT_COUNTDOWN_DEPTH)
        .setVisible(false);
      const nametagGlow = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "nametag_glow")
        .setTint(0xfff1a8)
        .setDepth(SEAT_TEXT_DEPTH - 1)
        .setAlpha(0)
        .setVisible(false);
      const nametag = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "nametag")
        .setScale(1.20)
        .setDepth(SEAT_TEXT_DEPTH - 0.5)
        .setVisible(false);
      const name = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_NAME_FONT_SIZE,
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
        })
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      const chips = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: SEAT_INFO_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...SEAT_CHIPS_OUTLINE_STYLE,
          shadow: { offsetX: 1, offsetY: 2, color: "#000000", blur: 4, fill: true },
        })
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(0.5, 0)
        .setVisible(false);
      const actionBadge = this.add
        .image(pos.x, pos.y + NORMAL_ACTION_BADGE_Y_OFFSET, DEAL_CARD_ATLAS_KEY, "brand_check")
        .setDepth(SEAT_ACTION_BADGE_DEPTH)
        .setOrigin(0.5)
        .setScale(0.48)
        .setAlpha(1)
        .setVisible(false);
      const emptySeatRadius = Math.min(profileFrame.displayWidth, profileFrame.displayHeight) * 0.32;
      const sitPromptBgRadius = emptySeatRadius * 0.78;
      const sitPromptBg = this.add.graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
        .fillStyle(0x000000, 0.65)
        .fillCircle(0, 0, sitPromptBgRadius)
        .setDepth(SEAT_PROFILE_BG_DEPTH)
        .setVisible(false);
      const sitPromptCircle = this.add.graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
        .lineStyle(2, 0xffffff, 1)
        .setDepth(SEAT_PROFILE_BG_DEPTH + 0.1)
        .setVisible(false);
      for (let i = 0; i < 24; i += 1) {
        const startAngle = Phaser.Math.DegToRad(i * 15);
        const endAngle = Phaser.Math.DegToRad(i * 15 + 9);
        sitPromptCircle.beginPath();
        sitPromptCircle.arc(0, 0, sitPromptBgRadius, startAngle, endAngle, false);
        sitPromptCircle.strokePath();
      }
      const sitPromptPlus = this.add
        .text(pos.x, pos.y + AVATAR_Y_OFFSET, "+", {
          fontSize: "34px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setDepth(SEAT_AVATAR_DEPTH)
        .setOrigin(0.5)
        .setVisible(false);
      const sitPromptLabel = this.add
        .text(pos.x, pos.y + AVATAR_Y_OFFSET + emptySeatRadius + 12, "可入座", {
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(0.5)
        .setVisible(false);

      const seatView = {
        profileBg,
        profileFrame,
        avatar,
        avatarBaseSize,
        foldOverlay,
        roleBadge,
        waitingBadge,
        betCoin,
        betCoinStack,
        betAmount,
        nametagGlow,
        nametag,
        name,
        chips,
        actionBadge,
        sitPromptBg,
        sitPromptBgRadius,
        sitPromptCircle,
        sitPromptPlus,
        sitPromptLabel,
        sweepArc,
        glowOuter,
        glowInner,
        turnCountdownBg,
        turnCountdown,
        holeCards,
        posX: pos.x,
        posY: pos.y,
        slotIndex: idx,
        avatarFlipX,
        displaySeatNo: seatNo,
        turnActive: false,
        jumpTween: null,
        sweepTween: null,
        glowOuterTween: null,
        glowInnerTween: null,
        nametagGlowFx: null,
        nametagBreathTween: null,
        isHero: false,
      };
      this.applySeatHoleCardScale(seatView);
      this.updateSeatTextLayout(seatView, false);
      this.seatViews.push(seatView);
    });

    this.seatCount = seatCount;
    this.seatStart = seatStart;
    // 重建座位後需重置累積偏移，確保 applyLayout 立即正確定位英雄座位
    this._heroSeatDy = undefined;
    this.applyLayout?.();
  }

// Keep text anchored to avatar when switching hero/non-hero layout.
  updateSeatTextLayout(seatView, isHero) {
    seatView.isHero = Boolean(isHero);
    const isMirrored = Boolean(seatView?.avatarFlipX);
    const nameXOffset = isHero
      ? (isMirrored ? HERO_NAME_X_OFFSET_RIGHT : HERO_NAME_X_OFFSET_LEFT)
      : (isMirrored ? NORMAL_NAME_X_OFFSET_RIGHT : NORMAL_NAME_X_OFFSET_LEFT);
    const nameYOffset = isHero ? HERO_NAME_Y_OFFSET : NORMAL_NAME_Y_OFFSET;
    const infoXOffset = isHero
      ? (isMirrored ? HERO_INFO_X_OFFSET_RIGHT : HERO_INFO_X_OFFSET_LEFT)
      : (isMirrored ? NORMAL_INFO_X_OFFSET_RIGHT : NORMAL_INFO_X_OFFSET_LEFT);
    const infoStartYOffset = isHero ? HERO_INFO_START_Y_OFFSET : NORMAL_INFO_START_Y_OFFSET;

    const nameX = seatView.posX + nameXOffset;
    const nameY = seatView.posY + nameYOffset;
    const infoX = seatView.posX + infoXOffset;
    const infoY = seatView.posY + infoStartYOffset;
    const actionBadgeYOffset = isHero ? HERO_ACTION_BADGE_Y_OFFSET : NORMAL_ACTION_BADGE_Y_OFFSET;

    const nametagScale = isHero ? 1.46 : 1.20;
    const nameFontScale = isHero ? 0.80 : 0.65;
    seatView.nametag.setScale(nametagScale);
    const frameHalfH = seatView.profileFrame.displayHeight * 0.5;
    const nametagHalfH = seatView.nametag.displayHeight * 0.5;
    const nameTagCenterY = seatView.posY + AVATAR_Y_OFFSET + frameHalfH - 18;
    const nameFontSize = Math.round(32 * nameFontScale);
    seatView.nametag.setPosition(seatView.posX, nameTagCenterY).setOrigin(0.5, 0.5);
    seatView.nametagGlow
      .setScale(nametagScale)
      .setPosition(seatView.posX, nameTagCenterY)
      .setOrigin(0.5, 0.5);
    seatView.name.setFontSize(`${nameFontSize}px`).setPosition(seatView.posX, nameTagCenterY).setOrigin(0.5, 0.5);
    const chipsFontSize = isHero ? "28px" : SEAT_INFO_FONT_SIZE;
    const chipsYGap = isHero ? -14 : -10;
    seatView.chips.setFontSize(chipsFontSize).setPosition(seatView.posX, nameTagCenterY + nametagHalfH + chipsYGap).setOrigin(0.5, 0);
    seatView.actionBadge.setPosition(seatView.posX, seatView.posY + actionBadgeYOffset).setOrigin(0.5);
    const cdFxScale = isHero ? 1.32 : 1.12;
    const cdEdgeR = Math.round(TURN_GLOW_OUTER_RADIUS * cdFxScale * 0.68);
    const cdX = seatView.posX + cdEdgeR;
    const cdY = seatView.posY + AVATAR_Y_OFFSET + cdEdgeR;
    seatView.turnCountdownBg.setPosition(cdX, cdY);
    seatView.turnCountdown.setPosition(cdX, cdY);
    this.updateSeatRoleBadgeLayout(seatView);
    this.updateSeatBetLayout(seatView);
    this.updateSeatHoleCardPositions(seatView);
  }

  updateSeatRoleBadgeLayout(seatView) {
    if (!seatView?.roleBadge) {
      return;
    }
    const badgeY = seatView.posY + ROLE_BADGE_Y_ABOVE_HEAD;
    seatView.roleBadge.setPosition(seatView.posX, badgeY).setScale(0.63);
    seatView.waitingBadge?.setPosition(seatView.posX, badgeY + 38).setScale(0.62);
  }

  updateSeatBetLayout(seatView) {
    if (!seatView?.betCoin || !seatView?.betAmount) {
      return;
    }
    const slotIndex = Number(seatView.slotIndex);
    const perSeat = Number.isFinite(slotIndex) ? SEAT_BET_AMOUNT_POSITIONS_6[slotIndex] : null;
    const amountX = Number(perSeat?.x ?? seatView.posX + 56);
    let amountY = Number(perSeat?.y ?? seatView.posY + 84);
    if (slotIndex === 0) amountY += this._heroSeatDy || 0;
    seatView.betCoinStack?.forEach((img, ti) => img.setPosition(amountX, amountY - ti * 8));
    seatView.betAmount.setPosition(amountX, amountY);
  }

  showSeatBetCoins(seatView, betValue) {
    const stack = seatView.betCoinStack;
    if (!stack) return;
    const CHIP_VALUES = [1000, 500, 100, 50, 25, 5];
    const CHIP_FRAMES = ["token_black", "token_blue", "token_purple", "token_green", "token_yellow", "token_red"];
    let chipFrame = "token_red";
    let chipCount = 1;
    for (let i = 0; i < CHIP_VALUES.length; i++) {
      if (betValue >= CHIP_VALUES[i]) {
        chipFrame = CHIP_FRAMES[i];
        chipCount = Math.min(3, Math.floor(betValue / CHIP_VALUES[i]));
        break;
      }
    }
    stack.forEach((img, ti) => img.setFrame(chipFrame).setVisible(ti < chipCount));
  }

  hideSeatBetCoins(seatView) {
    seatView.betCoinStack?.forEach(img => img.setVisible(false));
  }

  resolveSeatRoleFrame(table, seatNoRaw) {
    if (!table) {
      return null;
    }
    if (isSameSeat(seatNoRaw, table.bb_seat)) {
      return "bb_seat";
    }
    if (isSameSeat(seatNoRaw, table.dealer_seat)) {
      return "dealer_seat";
    }
    if (isSameSeat(seatNoRaw, table.sb_seat)) {
      return "sb_seat";
    }
    return null;
  }

  resolveSeatActionBrandFrame(actionRaw) {
    const action = String(actionRaw || "").toLowerCase();
    if (!action) {
      return null;
    }
    const frame = ACTION_BRAND_FRAME_BY_ACTION[action] || null;
    if (!frame) {
      return null;
    }
    if (!this.textures.get(DEAL_CARD_ATLAS_KEY)?.has(frame)) {
      return null;
    }
    return frame;
  }

  findActiveSeat(table, actionRequest) {
    const turnSeat = table?.turn?.seat;
    const candidates = [
      actionRequest?.seat,
      actionRequest?.actor_seat,
      actionRequest?.current_seat,
      actionRequest?.turn_seat,
      table?.current_turn_seat,
      table?.next_to_act_seat,
      table?.active_seat,
      turnSeat,
    ];
    for (const value of candidates) {
      const seat = parseSeat(value);
      if (seat !== null) {
        return seat;
      }
    }
    return null;
  }

  resolveActiveTimeout(table, actionRequest) {
    const candidates = [
      actionRequest?.timeout,
      table?.current_turn_timeout,
      table?.turn?.timeout,
    ];
    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return null;
  }

  resolveActiveStartedAt(table) {
    const candidates = [table?.current_turn_started_at, table?.turn?.started_at];
    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return null;
  }

  getCurrentRemainSeconds() {
    const timeout = Number(this.currentTurnTimeout);
    if (!Number.isFinite(timeout) || timeout <= 0) {
      return null;
    }

    const startedAt = Number(this.currentTurnStartedAt);
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      return Math.max(0, Math.ceil(timeout));
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    return Math.max(0, Math.ceil(timeout - elapsedSeconds));
  }

  refreshNextHandCountdown() {
    const secs = this.state?.nextHandCountdownSeconds ?? 0;
    if (secs > 0 && this.nextHandCountdownEnd <= 0) {
      this.nextHandCountdownEnd = Date.now() + secs * 1000;
    }
    const endAt = this.nextHandCountdownEnd;
    const hide = () => {
      this.nextHandCountdownLabel?.setVisible(false);
      this.nextHandCountdownNum?.setVisible(false);
    };
    if (!endAt || this.isHandResultModalOpen) { hide(); return; }
    const secsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (secsLeft <= 0) { hide(); return; }
    const _y = CENTER_POT_Y + 68;
    const gap = 8;
    this.nextHandCountdownLabel?.setText("下一局").setVisible(true).setDepth(CENTER_POT_DEPTH + 0.6);
    this.nextHandCountdownNum?.setText(`${secsLeft} 秒`).setVisible(true).setDepth(CENTER_POT_DEPTH + 0.6);
    const lw = this.nextHandCountdownLabel?.width ?? 0;
    const nw = this.nextHandCountdownNum?.width ?? 0;
    const totalW = lw + gap + nw;
    this.nextHandCountdownLabel?.setPosition(CENTER_X - totalW / 2 + lw / 2, _y);
    this.nextHandCountdownNum?.setPosition(CENTER_X - totalW / 2 + lw + gap + nw / 2, _y);
  }

  refreshTurnCountdownOverlay() {
    if (!Array.isArray(this.seatViews) || this.seatViews.length === 0) {
      return;
    }

    const remainSeconds = this.getCurrentRemainSeconds();
    const isWarning = remainSeconds !== null && remainSeconds <= TURN_COUNTDOWN_WARNING_SECONDS;
    const isCritical = remainSeconds !== null && remainSeconds <= TURN_COUNTDOWN_CRITICAL_SECONDS;
    const blinkOn = Math.floor(Date.now() / TURN_COUNTDOWN_WARNING_BLINK_MS) % 2 === 0;
    if (isCritical && remainSeconds > 0 && Number.isFinite(remainSeconds) && remainSeconds !== this.lastCountdownBeepSecond) {
      this.lastCountdownBeepSecond = remainSeconds;
      this.playCountdownSfx();
    } else if (!isCritical || remainSeconds <= 0) {
      this.stopCountdownSfx();
    }
    for (const seatView of this.seatViews) {
      const isActiveSeat = isSameSeat(seatView.displaySeatNo, this.currentActiveSeat);
      if (!isActiveSeat || remainSeconds === null || !seatView.avatar.visible) {
        seatView.turnCountdownBg.setVisible(false);
        seatView.turnCountdown.setVisible(false);
        continue;
      }
      const ringColor = (isWarning || isCritical) ? TURN_COUNTDOWN_RING_WARNING : TURN_COUNTDOWN_RING_COLOR;
      const textColor = (isWarning || isCritical) ? TURN_COUNTDOWN_WARNING_COLOR : TURN_COUNTDOWN_COLOR;
      const alpha = isCritical ? (blinkOn ? 1 : 0.2) : 1;
      seatView.turnCountdownBg
        .setStrokeStyle(TURN_COUNTDOWN_RING_WIDTH, ringColor, 1)
        .setAlpha(alpha)
        .setVisible(true);
      seatView.turnCountdown
        .setColor(textColor)
        .setAlpha(alpha)
        .setText(String(remainSeconds))
        .setVisible(true);
    }
  }

  findSeatViewBySeatNo(seatNoRaw) {
    const seatNo = parseSeat(seatNoRaw);
    if (seatNo === null) {
      return null;
    }
    return this.seatViews.find((item) => isSameSeat(item.displaySeatNo, seatNo)) || null;
  }

  stopCommunitySlotAnimation(slot) {
    if (!slot) {
      return;
    }
    if (slot.flyTween) {
      slot.flyTween.remove();
      slot.flyTween = null;
    }
    if (slot.flipTween) {
      slot.flipTween.remove();
      slot.flipTween = null;
    }
    if (slot.revealTween) {
      slot.revealTween.remove();
      slot.revealTween = null;
    }
    if (slot.flyCard) {
      slot.flyCard.destroy();
      slot.flyCard = null;
    }
    this.tweens.killTweensOf(slot.frontCard);
  }

  setCommunityCardImmediate(index, cardRaw) {
    const slot = this.communitySlots?.[index];
    if (!slot) {
      return;
    }
    this.stopCommunitySlotAnimation(slot);
    const card = cardRaw === null || cardRaw === undefined || cardRaw === "" ? null : String(cardRaw);
    const frameKey = normalizeCardFrameKey(card);
    slot.pendingCard = null;
    slot.shownCard = card;
    if (frameKey && this.textures.exists(PLAYING_CARDS_ATLAS_KEY) && this.textures.get(PLAYING_CARDS_ATLAS_KEY).has(frameKey)) {
      slot.frontCard
        .setFrame(frameKey)
        .setScale(COMMUNITY_CARD_SCALE)
        .setVisible(true);
      return;
    }
    slot.frontCard.setScale(COMMUNITY_CARD_SCALE).setVisible(false);
  }

  animateCommunityCardReveal(index, cardRaw, delayMs = 0) {
    const slot = this.communitySlots?.[index];
    if (!slot) {
      return;
    }
    const card = cardRaw === null || cardRaw === undefined || cardRaw === "" ? null : String(cardRaw);
    const frameKey = normalizeCardFrameKey(card);
    if (!card || !frameKey || !this.textures.exists(PLAYING_CARDS_ATLAS_KEY) || !this.textures.get(PLAYING_CARDS_ATLAS_KEY).has(frameKey)) {
      this.setCommunityCardImmediate(index, null);
      if (card) {
        this.setCommunityCardImmediate(index, card);
      }
      return;
    }
    this.stopCommunitySlotAnimation(slot);
    slot.pendingCard = card;
    slot.frontCard.setScale(COMMUNITY_CARD_SCALE).setVisible(false);
    const targetX = COMMUNITY_CARD_X_LIST[index];
    const targetY = COMMUNITY_CARD_Y;
    const flyCard = this.add
      .image(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, DEAL_CARD_ATLAS_KEY, DEAL_CARD_FRAME)
      .setDepth(COMMUNITY_DEAL_FLY_CARD_DEPTH)
      .setScale(1);
    slot.flyCard = flyCard;
    slot.flyTween = this.tweens.add({
      targets: flyCard,
      x: targetX,
      y: targetY,
      duration: COMMUNITY_DEAL_FLY_DURATION,
      delay: Math.max(0, Number(delayMs) || 0),
      ease: "Cubic.Out",
      onStart: () => {
        this.playSfx(DEAL_CARD_SFX_KEY, DEAL_CARD_SFX_VOLUME);
      },
      onComplete: () => {
        if (slot.pendingCard !== card) {
          if (slot.flyCard === flyCard) {
            slot.flyCard = null;
          }
          flyCard.destroy();
          return;
        }
        slot.flipTween = this.tweens.add({
          targets: flyCard,
          scaleX: 0,
          duration: COMMUNITY_DEAL_FLIP_HALF_DURATION,
          ease: "Sine.In",
          onComplete: () => {
            if (slot.pendingCard !== card) {
              if (slot.flyCard === flyCard) {
                slot.flyCard = null;
              }
              flyCard.destroy();
              return;
            }
            if (slot.flyCard === flyCard) {
              slot.flyCard = null;
            }
            flyCard.destroy();
            slot.pendingCard = null;
            slot.shownCard = card;
            slot.frontCard
              .setFrame(frameKey)
              .setScale(0, COMMUNITY_CARD_SCALE)
              .setVisible(true);
            slot.revealTween = this.tweens.add({
              targets: slot.frontCard,
              scaleX: COMMUNITY_CARD_SCALE,
              duration: COMMUNITY_DEAL_FLIP_HALF_DURATION,
              ease: "Sine.Out",
              onComplete: () => {
                this.tweens.add({
                  targets: slot.frontCard,
                  scaleX: COMMUNITY_CARD_SCALE * COMMUNITY_DEAL_POP_SCALE,
                  scaleY: COMMUNITY_CARD_SCALE * COMMUNITY_DEAL_POP_SCALE,
                  duration: COMMUNITY_DEAL_POP_DURATION,
                  ease: "Quad.Out",
                  yoyo: true,
                });
              },
            });
          },
        });
      },
    });
  }

  renderCommunityCards(communityRaw, animateNewCards = true) {
    const community = Array.isArray(communityRaw) ? communityRaw : [];
    const revealQueue = [];
    for (let index = 0; index < COMMUNITY_SLOT_COUNT; index += 1) {
      const slot = this.communitySlots?.[index];
      if (!slot) {
        continue;
      }
      const targetCardRaw = community[index];
      const targetCard = targetCardRaw === null || targetCardRaw === undefined || targetCardRaw === "" ? null : String(targetCardRaw);
      if (!targetCard) {
        if (slot.shownCard !== null || (slot.pendingCard !== null && !animateNewCards)) {
          this.setCommunityCardImmediate(index, null);
        }
        continue;
      }
      if (slot.shownCard === targetCard || slot.pendingCard === targetCard) {
        continue;
      }
      if (animateNewCards && slot.shownCard === null && slot.pendingCard === null) {
        revealQueue.push({ index, card: targetCard });
        continue;
      }
      this.setCommunityCardImmediate(index, targetCard);
    }
    revealQueue.forEach((item, order) => {
      this.animateCommunityCardReveal(item.index, item.card, order * COMMUNITY_DEAL_STAGGER_MS);
    });
  }

  resolveDealTargetPosition(seatView, cardIndexRaw) {
    const cardIndex = Number(cardIndexRaw);
    const useRight = Number.isFinite(cardIndex) ? cardIndex % 2 === 1 : false;
    const isHeroSeat = isSameSeat(seatView?.displaySeatNo, this.resolveHeroSeatForDisplay(this.state?.table));
    const heroLeftOffset = IS_TOUCH_DEVICE
      ? HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT
      : HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT_DESKTOP;
    const heroRightOffset = IS_TOUCH_DEVICE
      ? HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT
      : HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT_DESKTOP;
    const targetOffsetLeft = isHeroSeat
      ? heroLeftOffset
      : (seatView?.avatarFlipX ? DEAL_CARD_MIRROR_TARGET_OFFSET_X_LEFT : DEAL_CARD_TARGET_OFFSET_X_LEFT);
    const targetOffsetRight = isHeroSeat
      ? heroRightOffset
      : (seatView?.avatarFlipX ? DEAL_CARD_MIRROR_TARGET_OFFSET_X_RIGHT : DEAL_CARD_TARGET_OFFSET_X_RIGHT);
    const baseOffsetX = useRight ? targetOffsetRight : targetOffsetLeft;
    const offsetX = isHeroSeat ? baseOffsetX : (seatView?.avatarFlipX ? -baseOffsetX : baseOffsetX);
    const heroUpShift = 0;
    const offsetY = (isHeroSeat ? HERO_DEAL_CARD_TARGET_OFFSET_Y : DEAL_CARD_TARGET_OFFSET_Y) + heroUpShift;
    const slotXAdjust = (!isHeroSeat && seatView?.slotIndex === 1) ? 20 : 0;
    return {
      x: seatView.posX + offsetX + slotXAdjust,
      y: seatView.posY + offsetY,
    };
  }

  normalizeHoleCount(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return 0;
    }
    return Math.min(DEAL_CARD_MAX_HOLE_COUNT, Math.floor(n));
  }

  getSeatHoleCardScale(seatView) {
    if (isSameSeat(seatView?.displaySeatNo, this.resolveHeroSeatForDisplay(this.state?.table))) {
      return DEAL_CARD_HERO_SCALE;
    }
    return DEAL_CARD_NORMAL_SCALE;
  }

  applySeatHoleCardScale(seatView) {
    if (!seatView?.holeCards?.length) {
      return;
    }
    const baseScale = this.getSeatHoleCardScale(seatView);
    seatView.holeCards.forEach((holeCard) => {
      holeCard.baseScaleX = baseScale;
      holeCard.baseScaleY = baseScale;
      if (!holeCard.inFlight && !holeCard.isFlipping && !holeCard.flipPopTween) {
        holeCard.sprite.setScale(baseScale);
      }
    });
  }

  resolveHoleFaceFrameKey(cardRaw) {
    const frameKey = normalizeCardFrameKey(cardRaw);
    if (!frameKey) {
      return null;
    }
    if (!this.textures.exists(PLAYING_CARDS_ATLAS_KEY)) {
      return null;
    }
    const atlas = this.textures.get(PLAYING_CARDS_ATLAS_KEY);
    if (!atlas?.has(frameKey)) {
      return null;
    }
    return frameKey;
  }

  resolveHoleFaceScale(baseScaleX, baseScaleY, frameKey) {
    const frame = this.textures.getFrame(PLAYING_CARDS_ATLAS_KEY, frameKey);
    const ratioX = frame?.width ? DEAL_CARD_BACK_FRAME_WIDTH / frame.width : 1;
    const ratioY = frame?.height ? DEAL_CARD_BACK_FRAME_HEIGHT / frame.height : 1;
    return {
      scaleX: baseScaleX * ratioX,
      scaleY: baseScaleY * ratioY,
    };
  }

  applyHoleCardVisual(holeCard, cardRaw, revealFace) {
    if (!holeCard?.sprite) {
      return;
    }
    const sprite = holeCard.sprite;
    const frameKey = revealFace ? this.resolveHoleFaceFrameKey(cardRaw) : null;
    if (frameKey) {
      const faceScale = this.resolveHoleFaceScale(holeCard.baseScaleX, holeCard.baseScaleY, frameKey);
      sprite
        .setTexture(PLAYING_CARDS_ATLAS_KEY, frameKey)
        .setScale(faceScale.scaleX, faceScale.scaleY);
      holeCard.faceFrameKey = frameKey;
      return;
    }
    sprite
      .setTexture(DEAL_CARD_ATLAS_KEY, DEAL_CARD_FRAME)
      .setScale(holeCard.baseScaleX, holeCard.baseScaleY);
    holeCard.faceFrameKey = null;
  }

  stopHoleCardFlipAnimation(holeCard) {
    if (!holeCard?.sprite) {
      return;
    }
    if (holeCard.flipOutTween) {
      holeCard.flipOutTween.remove();
      holeCard.flipOutTween = null;
    }
    if (holeCard.flipInTween) {
      holeCard.flipInTween.remove();
      holeCard.flipInTween = null;
    }
    if (holeCard.flipPopTween) {
      holeCard.flipPopTween.remove();
      holeCard.flipPopTween = null;
    }
    holeCard.isFlipping = false;
  }

  playBetFlyAnimation(seatView, betValue) {
    const slotIndex = Number(seatView.slotIndex);
    const betPos = Number.isFinite(slotIndex) ? SEAT_BET_AMOUNT_POSITIONS_6[slotIndex] : null;
    if (!betPos) return;
    const coin = this.betFlyPool?.find((c) => !c.active);
    if (!coin) return;
    const CHIP_VALUES = [1000, 500, 100, 50, 25, 5];
    const CHIP_FRAMES = ["token_black", "token_blue", "token_purple", "token_green", "token_yellow", "token_red"];
    let frame = "token_red";
    for (let i = 0; i < CHIP_VALUES.length; i++) {
      if (betValue >= CHIP_VALUES[i]) { frame = CHIP_FRAMES[i]; break; }
    }
    const betTargetY = betPos.y + (slotIndex === 0 ? (this._heroSeatDy || 0) : 0);
    coin.setFrame(frame).setPosition(seatView.posX, seatView.posY).setVisible(true).setActive(true);
    this.tweens.add({
      targets: coin,
      x: betPos.x,
      y: betTargetY,
      duration: 280,
      ease: "Quad.Out",
      onComplete: () => coin.setVisible(false).setActive(false),
    });
  }

  clearShowdownFlipTimers() {
    this.showdownFlipTimers?.forEach((id) => clearTimeout(id));
    this.showdownFlipTimers = [];
  }

  scheduleShowdownFlips() {
    const revealsBySeat = this.state?.showdownRevealsBySeat;
    if (!revealsBySeat || typeof revealsBySeat !== "object") return;
    const STAGGER_MS = 220;
    let delay = 0;
    for (const [seatKey, cards] of Object.entries(revealsBySeat)) {
      const seatView = this.findSeatViewBySeatNo(Number(seatKey));
      if (!seatView?.holeCards) continue;
      (Array.isArray(cards) ? cards : []).forEach((cardRaw, cardIndex) => {
        const frameKey = this.resolveHoleFaceFrameKey(cardRaw);
        if (!frameKey) return;
        const animKey = `${seatKey}_${cardIndex}_${frameKey}`;
        if (this.showdownAnimatedSet?.has(animKey)) return;
        const holeCard = seatView.holeCards[cardIndex];
        if (!holeCard) return;
        this.showdownAnimatedSet.add(animKey);
        holeCard.pendingShowdownFlip = true;
        const angle = dealCardAngleByIndex(cardIndex);
        const timerId = setTimeout(() => {
          holeCard.pendingShowdownFlip = false;
          if (holeCard.sprite?.active) {
            const seatStillOccupied = this.state?.table?.players?.some(
              p => isSameSeat(p?.seat, Number(seatKey))
            );
            if (!seatStillOccupied) return;
            this.playHoleCardFlipToFace(holeCard, frameKey, angle);
          }
        }, delay);
        this.showdownFlipTimers.push(timerId);
        delay += STAGGER_MS;
      });
    }
  }

  setHoleCardBackImmediate(holeCard) {
    if (!holeCard?.sprite) {
      return;
    }
    this.applyHoleCardVisual(holeCard, null, false);
  }

  playHoleCardFlipToFace(holeCard, frameKey, targetAngle = 0) {
    if (!holeCard?.sprite || !frameKey) {
      return;
    }
    if (holeCard.inFlight) {
      return;
    }
    const expectedFrameKey = String(frameKey);
    holeCard.targetFaceFrameKey = expectedFrameKey;

    if (holeCard.faceFrameKey === expectedFrameKey && !holeCard.isFlipping) {
      const faceScale = this.resolveHoleFaceScale(holeCard.baseScaleX, holeCard.baseScaleY, expectedFrameKey);
      holeCard.sprite
        .setTexture(PLAYING_CARDS_ATLAS_KEY, expectedFrameKey)
        .setScale(faceScale.scaleX, faceScale.scaleY)
        .setAngle(targetAngle)
        .setVisible(true)
        .setAlpha(1);
      return;
    }

    this.stopHoleCardFlipAnimation(holeCard);
    this.setHoleCardBackImmediate(holeCard);
    holeCard.isFlipping = true;
    holeCard.sprite
      .setVisible(true)
      .setAlpha(1)
      .setAngle(targetAngle);

    holeCard.flipOutTween = this.tweens.add({
      targets: holeCard.sprite,
      scaleX: 0,
      duration: HOLE_CARD_FLIP_HALF_DURATION,
      ease: "Sine.In",
      onComplete: () => {
        holeCard.flipOutTween = null;
        if (!holeCard.sprite.active || holeCard.inFlight || holeCard.targetFaceFrameKey !== expectedFrameKey) {
          holeCard.isFlipping = false;
          if (
            holeCard.sprite.active
            && !holeCard.inFlight
            && holeCard.targetFaceFrameKey
            && holeCard.targetFaceFrameKey !== expectedFrameKey
          ) {
            this.playHoleCardFlipToFace(holeCard, holeCard.targetFaceFrameKey, targetAngle);
          }
          return;
        }

        const faceScale = this.resolveHoleFaceScale(holeCard.baseScaleX, holeCard.baseScaleY, expectedFrameKey);
        holeCard.sprite
          .setTexture(PLAYING_CARDS_ATLAS_KEY, expectedFrameKey)
          .setScale(0, faceScale.scaleY);

        holeCard.flipInTween = this.tweens.add({
          targets: holeCard.sprite,
          scaleX: faceScale.scaleX,
          duration: HOLE_CARD_FLIP_HALF_DURATION,
          ease: "Sine.Out",
          onComplete: () => {
            holeCard.flipInTween = null;
            holeCard.isFlipping = false;
            if (!holeCard.sprite.active) {
              return;
            }
            holeCard.faceFrameKey = expectedFrameKey;
            holeCard.flipPopTween = this.tweens.add({
              targets: holeCard.sprite,
              scaleX: faceScale.scaleX * HOLE_CARD_FLIP_POP_SCALE,
              scaleY: faceScale.scaleY * HOLE_CARD_FLIP_POP_SCALE,
              duration: HOLE_CARD_FLIP_POP_DURATION,
              ease: "Quad.Out",
              yoyo: true,
              onComplete: () => {
                holeCard.flipPopTween = null;
              },
            });
            if (holeCard.targetFaceFrameKey && holeCard.targetFaceFrameKey !== expectedFrameKey) {
              this.playHoleCardFlipToFace(holeCard, holeCard.targetFaceFrameKey, targetAngle);
            }
          },
        });
      },
    });
  }

  resolveSeatHoleRenderOptions(player, isHero) {
    const seatNo = Number(player?.seat);
    const key = Number.isFinite(seatNo) ? String(seatNo) : "";
    const knownCards = Array.isArray(this.state?.holeCardsBySeat?.[key]) ? this.state.holeCardsBySeat[key] : [];
    const showdownCards = Array.isArray(this.state?.showdownRevealsBySeat?.[key]) ? this.state.showdownRevealsBySeat[key] : [];
    const revealCards = showdownCards.length > 0 ? showdownCards : knownCards;
    const revealFace = revealCards.length > 0;
    const fallbackVisibleCount = player?.in_hand === false ? 0 : Number(player?.hole_count ?? 0);
    const visibleCount = revealFace ? revealCards.length : fallbackVisibleCount;
    return {
      revealFace,
      cardValues: revealCards,
      visibleCount,
    };
  }

  consumeVoiceCuesByAnimationHooks() {
    const cues = this.app?.consumeVoiceCues?.(40) ?? [];
    for (const cue of cues) {
      this.dispatchVoiceCueHook(cue);
    }
  }

  dispatchVoiceCueHook(cue) {
    const packetType = String(cue?.packetType || "");
    if (packetType === "player_action") {
      this.onPlayerActionAnimationStart(cue);
      return;
    }
    if (packetType === "deal_community") {
      this.onDealCommunityAnimationStart(cue);
      return;
    }
    if (packetType === "showdown") {
      this.onShowdownAnimationStart(cue);
      return;
    }
    if (packetType === "award") {
      this.onAwardAnimationStart(cue);
      return;
    }
    if (packetType === "table_player_joined") {
      this.onNewPlayerAnimationStart(cue);
      return;
    }
    if (packetType === "hand_start") {
      this.onNewRoundAnimationStart(cue);
      return;
    }
  }

  // Hook: play voice when player action animation starts.
  onPlayerActionAnimationStart(cue) {
    if (!this.voiceHooks.playerAction) {
      return;
    }
    this.app.playVoiceByKey?.(cue?.key);
  }

  // Hook: play voice when community card animation starts.
  onDealCommunityAnimationStart(cue) {
    if (!this.voiceHooks.dealCommunity) {
      return;
    }
    this.app.playVoiceByKey?.(cue?.key);
  }

  resolveBestShowdownHandRankFromCue(cue) {
    const reveals = cue?.packet?.data?.reveals;
    if (!reveals || typeof reveals !== "object" || Array.isArray(reveals)) {
      return null;
    }
    let bestRank = null;
    let bestScore = 0;
    Object.values(reveals).forEach((info) => {
      const rank = String(info?.hand_rank || "").toLowerCase();
      const score = Number(HAND_RANK_STRENGTH[rank] || 0);
      if (score > bestScore) {
        bestScore = score;
        bestRank = rank;
      }
    });
    return bestRank;
  }

  resolveShowdownRankVoiceKey(cue) {
    const bestRank = this.resolveBestShowdownHandRankFromCue(cue);
    if (!bestRank) {
      return null;
    }
    return resolveVoiceKeyByHandRank(bestRank);
  }

  // Hook: play voice when showdown animation starts.
  onShowdownAnimationStart(cue) {
    if (!this.voiceHooks.showdown) {
      return;
    }
    if (cue?.key) {
      this.app.playVoiceByKey?.(cue.key);
    }
  }

  isAnyModalOpen() {
    return Boolean(this.soundSettingsPanel?.visible) || Boolean(this.switchConfirmOverlay?.visible);
  }

  showWinGif(worldX, worldY, worldWidth = 180 * WIN_SPRITE_SIZE_FACTOR) {
    if (!this.winSprite) return;
    const worldHeight = worldWidth * (800 / 900);
    this.winSprite
      .setPosition(worldX, worldY)
      .setDisplaySize(worldWidth, worldHeight)
      .setVisible(true);
    this.winSprite.play(WIN_SPRITE_ANIM_KEY);
    this.winGifIsPlaying = true;
    this.playSfx(WIN_ANIMATION_SFX_KEY, WIN_ANIMATION_SFX_VOLUME);
  }

  // Hook: play voice when award animation starts.
  onAwardAnimationStart(cue) {
    const playerResults = cue?.packet?.data?.player_results;
    let worldX = layout.centerX;
    let worldY = layout.centerY;
    let worldWidth = 180 * WIN_SPRITE_SIZE_FACTOR;
    if (Array.isArray(playerResults) && playerResults.length > 0) {
      const winner = playerResults.find((r) => Number(r.win_amount ?? 0) > 0 || Number(r.net_amount ?? 0) > 0);
      if (winner) {
        const winnerSeatView = this.findSeatViewBySeatNo(parseSeat(winner.seat));
        if (winnerSeatView) {
          worldX = winnerSeatView.posX;
          worldY = winnerSeatView.posY + AVATAR_Y_OFFSET;
          const frameDisplayW = winnerSeatView.profileFrame?.displayWidth || 160;
          worldWidth = frameDisplayW * 1.5 * WIN_SPRITE_SIZE_FACTOR;
        }
      }
    }
    this.showWinGif(worldX, worldY, worldWidth);
    if (!this.voiceHooks.award) {
      return;
    }
    const rankVoiceKey = this.resolveAwardRankVoiceKey(cue);
    if (!rankVoiceKey) {
      this.app.playVoiceByKey?.(cue?.key);
      return;
    }
    this.app.playVoiceByKey?.(cue?.key, 1, {
      onComplete: () => {
        this.app.playVoiceByKey?.(rankVoiceKey);
      },
    });
  }

  resolveAwardRankVoiceKey(cue) {
    const playerResults = cue?.packet?.data?.player_results;
    if (!Array.isArray(playerResults)) {
      return null;
    }
    const winner = playerResults.reduce((best, r) => {
      const win = Number(r?.win_amount ?? 0);
      return win > Number(best?.win_amount ?? 0) ? r : best;
    }, null);
    return resolveVoiceKeyByHandRank(winner?.hand_rank);
  }

  // Hook: play voice when new-player animation starts.
  onNewPlayerAnimationStart(cue) {
    if (!this.voiceHooks.newPlayer) {
      return;
    }
    this.app.playVoiceByKey?.(cue?.key);
  }

  // Hook: play voice when new-round animation starts.
  onNewRoundAnimationStart(cue) {
    if (!this.voiceHooks.newRound) {
      return;
    }
    this.app.playVoiceByKey?.(cue?.key);
  }

  updateSeatHoleCardPositions(seatView) {
    if (!seatView?.holeCards?.length) {
      return;
    }
    seatView.holeCards.forEach((holeCard, cardIndex) => {
      const target = this.resolveDealTargetPosition(seatView, cardIndex);
      holeCard.sprite.setPosition(target.x, target.y).setAngle(dealCardAngleByIndex(cardIndex));
    });
  }

  setSeatHoleCardsVisibleCount(seatView, holeCountRaw, renderOptions = null) {
    if (!seatView?.holeCards?.length) {
      return;
    }
    const holeCount = this.normalizeHoleCount(holeCountRaw);
    const revealFace = Boolean(renderOptions?.revealFace);
    const cardValues = Array.isArray(renderOptions?.cardValues) ? renderOptions.cardValues : [];
    seatView.holeCards.forEach((holeCard, cardIndex) => {
      const visible = cardIndex < holeCount;
      const targetAngle = dealCardAngleByIndex(cardIndex);
      const targetFaceFrameKey = revealFace && visible
        ? this.resolveHoleFaceFrameKey(cardValues[cardIndex])
        : null;
      holeCard.targetFaceFrameKey = targetFaceFrameKey;

      if (!visible) {
        holeCard.inFlight = false;
        holeCard.targetFaceFrameKey = null;
        this.stopHoleCardFlipAnimation(holeCard);
        this.setHoleCardBackImmediate(holeCard);
        holeCard.sprite
          .setVisible(false)
          .setAlpha(1)
          .setAngle(targetAngle);
        return;
      }

      if (holeCard.inFlight) {
        holeCard.sprite
          .setVisible(false)
          .setAlpha(1)
          .setAngle(targetAngle);
        return;
      }

      holeCard.sprite
        .setVisible(true)
        .setAlpha(1)
        .setAngle(targetAngle);

      if (targetFaceFrameKey) {
        if (holeCard.pendingShowdownFlip) {
          return;
        }
        if (holeCard.isFlipping || holeCard.flipPopTween) {
          return;
        }
        if (holeCard.faceFrameKey === targetFaceFrameKey) {
          const faceScale = this.resolveHoleFaceScale(holeCard.baseScaleX, holeCard.baseScaleY, targetFaceFrameKey);
          holeCard.sprite
            .setTexture(PLAYING_CARDS_ATLAS_KEY, targetFaceFrameKey)
            .setScale(faceScale.scaleX, faceScale.scaleY);
          return;
        }
        this.playHoleCardFlipToFace(holeCard, targetFaceFrameKey, targetAngle);
        return;
      }

      this.stopHoleCardFlipAnimation(holeCard);
      this.setHoleCardBackImmediate(holeCard);
    });
  }

  hideSeatHoleCards(seatView) {
    this.setSeatHoleCardsVisibleCount(seatView, 0);
  }

  refreshSeatHoleCardsFromState(seatView) {
    if (!seatView) {
      return;
    }
    const player = this.state?.table?.players?.find((item) => isSameSeat(item?.seat, seatView.displaySeatNo));
    if (!player) {
      this.hideSeatHoleCards(seatView);
      return;
    }
    const isHero = isSameSeat(player.seat, this.resolveHeroSeatForDisplay(this.state?.table));
    const holeRenderOptions = this.resolveSeatHoleRenderOptions(player, isHero);
    this.setSeatHoleCardsVisibleCount(seatView, holeRenderOptions.visibleCount, holeRenderOptions);
  }

  playDealCardEffect(dealCard) {
    if (!dealCard) {
      return;
    }
    const seatView = this.findSeatViewBySeatNo(dealCard.seat);
    if (!seatView) {
      return;
    }

    const target = this.resolveDealTargetPosition(seatView, dealCard.card_index);
    this.playSfx(DEAL_CARD_SFX_KEY, DEAL_CARD_SFX_VOLUME);
    const dealIndexRaw = Number(dealCard.card_index);
    const dealIndex = Number.isFinite(dealIndexRaw) ? Math.max(0, Math.min(DEAL_CARD_MAX_HOLE_COUNT - 1, Math.floor(dealIndexRaw))) : 0;
    const targetAngle = dealCardAngleByIndex(dealIndex);
    const targetScale = this.getSeatHoleCardScale(seatView);
    const landingCard = seatView.holeCards?.[dealIndex] || null;
    if (landingCard) {
      this.stopHoleCardFlipAnimation(landingCard);
      landingCard.inFlight = true;
      landingCard.baseScaleX = targetScale;
      landingCard.baseScaleY = targetScale;
      this.setHoleCardBackImmediate(landingCard);
      landingCard.sprite.setVisible(false);
    }
    const flyCard = this.add
      .image(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, DEAL_CARD_ATLAS_KEY, DEAL_CARD_FRAME)
      .setScale(targetScale)
      .setDepth(DEAL_CARD_DEPTH)
      .setAngle(DEAL_CARD_START_ANGLE);
    const flyBaseScaleX = flyCard.scaleX;
    const flyBaseScaleY = flyCard.scaleY;

    this.tweens.add({
      targets: flyCard,
      x: target.x,
      y: target.y,
      duration: DEAL_CARD_FLY_DURATION,
      ease: "Cubic.Out",
      onUpdate: (tween) => {
        flyCard.setAngle(DEAL_CARD_START_ANGLE + (targetAngle - DEAL_CARD_START_ANGLE) * tween.progress);
      },
      onComplete: () => {
        if (landingCard) {
          if (!landingCard.inFlight) {
            return;
          }
          landingCard.sprite
            .setPosition(target.x, target.y)
            .setVisible(true)
            .setScale(landingCard.baseScaleX, landingCard.baseScaleY)
            .setAngle(targetAngle);
          this.tweens.add({
            targets: landingCard.sprite,
            scaleX: landingCard.baseScaleX * 1.14,
            scaleY: landingCard.baseScaleY * 1.14,
            duration: DEAL_CARD_POP_DURATION,
            ease: "Quad.Out",
            yoyo: true,
            onComplete: () => {
              landingCard.inFlight = false;
              this.refreshSeatHoleCardsFromState(seatView);
            },
          });
        }
        this.tweens.add({
          targets: flyCard,
          scaleX: flyBaseScaleX * 1.14,
          scaleY: flyBaseScaleY * 1.14,
          duration: DEAL_CARD_POP_DURATION,
          ease: "Quad.Out",
          yoyo: true,
          onComplete: () => {
            flyCard.destroy();
          },
        });
      },
    });
  }

  setSeatTurnEffect(seatView, shouldActive) {
    if (shouldActive) {
      if (seatView.turnActive) {
        return;
      }
      const frameHalfW = (seatView.profileFrame?.displayWidth || TURN_GLOW_OUTER_RADIUS * 2) / 2;
      const fxScale = (frameHalfW / TURN_GLOW_OUTER_RADIUS) * 0.82;
      const glowTargetScale = fxScale * TURN_GLOW_SCALE_TO;
      const glowInnerTargetScale = fxScale * 1.05;
      const glowY = seatView.posY + AVATAR_Y_OFFSET;
      seatView.turnActive = true;
      seatView.avatar.setY(seatView.posY + AVATAR_Y_OFFSET);
      seatView.avatar.setTint(TURN_AVATAR_HIGHLIGHT_TINT);
      const cdEdgeR = Math.round(TURN_GLOW_OUTER_RADIUS * fxScale * 0.68);
      const cdX = seatView.posX + cdEdgeR;
      const cdY = seatView.posY + AVATAR_Y_OFFSET + cdEdgeR;
      seatView.turnCountdownBg.setPosition(cdX, cdY);
      seatView.turnCountdown.setPosition(cdX, cdY);
      this.updateSeatRoleBadgeLayout(seatView);
      this.updateSeatHoleCardPositions(seatView);

      seatView.glowOuter
        .setVisible(true)
        .setPosition(seatView.posX, glowY)
        .setScale(fxScale)
        .setAlpha(1);
      seatView.glowInner.setVisible(false);
      seatView.sweepArc.setVisible(false);

      seatView.glowOuterTween = this.tweens.add({
        targets: seatView.glowOuter,
        alpha: 0.65,
        scaleX: fxScale * 1.08,
        scaleY: fxScale * 1.08,
        duration: 900,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });
      return;
    }

    if (!seatView.turnActive) {
      seatView.turnCountdownBg.setVisible(false);
      seatView.turnCountdown.setVisible(false);
      seatView.sweepArc.setVisible(false);
      seatView.glowOuter.setVisible(false);
      seatView.glowInner.setVisible(false);
      seatView.avatar.setY(seatView.posY + AVATAR_Y_OFFSET);
      seatView.avatar.clearTint();
      this.updateSeatRoleBadgeLayout(seatView);
      this.updateSeatHoleCardPositions(seatView);
      return;
    }

    seatView.turnActive = false;
    if (seatView.sweepTween) {
      seatView.sweepTween.remove();
      seatView.sweepTween = null;
    }
    if (seatView.jumpTween) {
      seatView.jumpTween.remove();
      seatView.jumpTween = null;
    }
    if (seatView.glowOuterTween) {
      seatView.glowOuterTween.remove();
      seatView.glowOuterTween = null;
    }
    if (seatView.glowInnerTween) {
      seatView.glowInnerTween.remove();
      seatView.glowInnerTween = null;
    }
    seatView.sweepArc.setVisible(false).setScale(1).setAlpha(1).setAngle(0);
    seatView.glowOuter.setVisible(false).setScale(1).setAlpha(1);
    seatView.glowInner.setVisible(false).setScale(1).setAlpha(1);
    seatView.avatar.setY(seatView.posY + AVATAR_Y_OFFSET);
    seatView.avatar.clearTint();
    seatView.turnCountdownBg.setVisible(false);
    seatView.turnCountdown.setVisible(false);
    this.updateSeatRoleBadgeLayout(seatView);
    this.updateSeatHoleCardPositions(seatView);
  }

  buildDisplaySeatOrder(seatCount, seatStart, heroSeatRaw) {
    const seatOrder = Array.from({ length: seatCount }, (_, idx) => seatStart + idx);
    const heroSeat = parseSeat(heroSeatRaw);
    if (heroSeat === null || seatCount <= 0) {
      return seatOrder;
    }

    const heroOffset = ((heroSeat - seatStart) % seatCount + seatCount) % seatCount;
    const normalizedHeroSeat = seatStart + heroOffset;
    const mirroredOrder = [normalizedHeroSeat];

    for (let offset = 1; offset < seatCount; offset += 1) {
      const seatOffset = (heroOffset - offset + seatCount) % seatCount;
      mirroredOrder.push(seatStart + seatOffset);
    }
    return mirroredOrder;
  }

  renderState() {
    if (!this.state) {
      return;
    }
    const isReplayActive = Boolean(this.app?.isHandReplayActive?.());
    const isReplayFast = Boolean(this.app?.isHandReplayFastMode?.());
    this.exitReplayButton?.setVisible(isReplayActive);
    this.replaySpeedButton?.setVisible(isReplayActive);
    this.changeTableButton?.setVisible(!isReplayActive);
    this.exitTableButton?.setVisible(!isReplayActive);
    if (this.replaySpeedButton && isReplayActive) {
      this.replaySpeedButton.setLabel(isReplayFast ? "加速：開" : "加速：關");
      if (isReplayFast) {
        this.replaySpeedButton.setGradient(0x5de83a, 0x1e7a10, 0x7aff50);
      } else {
        this.replaySpeedButton.setGradient(0x3db428, 0x145018, 0x1aed30);
      }
    }

    const table = this.state.table;
    const actionRequest = this.state.actionRequest;

    if (table) {
      const currentRenderedTableId = String(table.table_id ?? "");
      if (
        this.lastRenderedTableId !== null
        && currentRenderedTableId !== ""
        && currentRenderedTableId !== this.lastRenderedTableId
      ) {
        // Hero moved to a different table (e.g. via switch_room): clear stale
        // transient UI from the previous table before rendering the new one.
        if (this.winSprite) {
          this.winSprite.anims?.stop();
          this.winSprite.setVisible(false);
        }
        this.winGifIsPlaying = false;
        this.pendingHandResult = null;
        if (this.newRoundHintTimer) {
          this.newRoundHintTimer.remove();
          this.newRoundHintTimer = null;
        }
        this.tweens.killTweensOf(this.tableHintText);
        this.tableHintText.setText("").setVisible(false).setAlpha(0.88);
        this.lastHintHandId = null;
        this.lastRoundSnapshot = null;
      }
      this.lastRenderedTableId = currentRenderedTableId;

      const nextSeatCount = DEFAULT_SEAT_COUNT;
      const seatNumbers = Array.isArray(table.players)
        ? table.players.map((item) => Number(item.seat)).filter((n) => Number.isFinite(n))
        : [];
      const minSeat = seatNumbers.length > 0 ? Math.min(...seatNumbers) : this.seatStart;
      const nextSeatStart = minSeat >= 1 ? 1 : DEFAULT_SEAT_START;

      if (nextSeatCount !== this.seatCount || nextSeatStart !== this.seatStart) {
        this.buildSeatViews(nextSeatCount, nextSeatStart);
      }

      const nextRoundSnapshot = {
        tableId: String(table.table_id ?? ""),
        handId: Number(table.hand_id),
        round: String(table.round || "").toLowerCase(),
        bets: table.bets && typeof table.bets === "object" ? { ...table.bets } : {},
      };
      const previousRoundSnapshot = this.lastRoundSnapshot;
      nextRoundSnapshot.roundAccumulatedBets = this.buildRoundAccumulatedBets(table, previousRoundSnapshot, nextRoundSnapshot);
      const shouldPlayBetCollect = this.shouldPlayRoundBetCollectAnimation(previousRoundSnapshot, nextRoundSnapshot);
      const collectBets = shouldPlayBetCollect
        ? { ...(previousRoundSnapshot?.bets || {}) }
        : null;
      if (this.shouldPlayBetChipSfx(previousRoundSnapshot, nextRoundSnapshot)) {
        this.playSfx(BET_CHIP_SFX_KEY, BET_CHIP_SFX_VOLUME);
      }
      if (collectBets) {
        this.markRoundBetCollectVisualState(collectBets, table.hand_id);
      }

      const heroSeatForDisplay = this.resolveHeroSeatForDisplay(table);
      const displaySeatOrder = this.buildDisplaySeatOrder(nextSeatCount, nextSeatStart, heroSeatForDisplay);
      for (let index = 0; index < this.seatViews.length; index += 1) {
        this.seatViews[index].displaySeatNo = displaySeatOrder[index];
      }
      const dealCardVersion = Number(this.state.dealCardVersion ?? 0);
      if (dealCardVersion < this.lastSeenDealCardVersion) {
        this.lastSeenDealCardVersion = dealCardVersion;
      }
      if (dealCardVersion > this.lastSeenDealCardVersion) {
        this.lastSeenDealCardVersion = dealCardVersion;
        this.playDealCardEffect(this.state.lastDealCard);
      }
      const activeSeat = this.findActiveSeat(table, actionRequest);
      this.currentActiveSeat = activeSeat;
      this.currentTurnTimeout = this.resolveActiveTimeout(table, actionRequest);
      this.currentTurnStartedAt = this.resolveActiveStartedAt(table);
      this.syncRoundBetCollectVisualState(table);
      let displayPot = resolveDisplayPot(table);
      if (
        this.roundBetCollectCarryAmount > 0
        && Number(this.roundBetCollectCarryHandId) === Number(table.hand_id)
        && resolveRoundTotalBet(table) > 0
      ) {
        displayPot += this.roundBetCollectCarryAmount;
      }
      const shouldShowPot = displayPot > 0;
      this.potText.setText("").setVisible(false);
      if (shouldShowPot) {
        this.centerPotText?.setText(`底池  ${formatAmount(displayPot)}`).setVisible(true);
        const _bw = (this.centerPotText?.width ?? 0) + 40;
        const _bh = CENTER_POT_BADGE_H;
        const _br = _bh / 2;
        this.centerPotBg?.clear();
        this.centerPotBg?.fillStyle(0x1a0d04, 0.84);
        this.centerPotBg?.fillRoundedRect(-_bw / 2, -_bh / 2, _bw, _bh, _br);
        this.centerPotBg?.lineStyle(1.5, 0x8a5020, 0.85);
        this.centerPotBg?.strokeRoundedRect(-_bw / 2, -_bh / 2, _bw, _bh, _br);
        this.centerPotBg?.setVisible(true);
      } else {
        this.centerPotBg?.setVisible(false);
        this.centerPotText?.setText("").setVisible(false);
      }
      if (shouldShowPot) {
        // Chip denominations matching create() order: black, blue, purple, green, yellow, red
        const CHIP_VALUES = [1000, 500, 100, 50, 25, 5];
        const NUM_COLORS = CHIP_VALUES.length;

        // Greedy breakdown: how many chips of each denomination
        let remaining = Math.round(displayPot);
        const chipCounts = new Array(NUM_COLORS).fill(0);
        for (let ci = 0; ci < NUM_COLORS; ci++) {
          chipCounts[ci] = Math.floor(remaining / CHIP_VALUES[ci]);
          remaining -= chipCounts[ci] * CHIP_VALUES[ci];
        }
        // Any sub-5 remainder: show at least one red chip
        if (remaining > 0) chipCounts[NUM_COLORS - 1] = Math.max(chipCounts[NUM_COLORS - 1], 1);

        // Stack height per column (0 = hidden, 1–3 chips visible)
        const stackHeights = chipCounts.map(count => Math.min(count, POT_STACK_PER_COLOR));

        // Active columns (height > 0), or fallback to 1 red chip
        const activeCols = stackHeights.reduce((arr, h, ci) => { if (h > 0) arr.push(ci); return arr; }, []);
        if (activeCols.length === 0) {
          activeCols.push(NUM_COLORS - 1);
          stackHeights[NUM_COLORS - 1] = 1;
        }

        // Hide all, then show only the needed chips repositioned and centered
        this.potCoinStack.forEach(img => img.setVisible(false));

        const refY = DEAL_CARD_FROM_Y;
        const hStep = POT_STACK_ITEM_SIZE + POT_STACK_ITEM_GAP;
        const totalActive = activeCols.length;
        activeCols.forEach((ci, activeIdx) => {
          const xOff = (activeIdx - (totalActive - 1) / 2) * hStep;
          const h = stackHeights[ci];
          for (let ti = 0; ti < h; ti++) {
            const yOff = (POT_STACK_PER_COLOR - 1 - ti) * POT_STACK_V_STEP;
            this.potCoinStack[ci * POT_STACK_PER_COLOR + ti]
              .setPosition(DEAL_CARD_FROM_X + xOff, refY + yOff)
              .setVisible(true);
          }
        });
      } else {
        this.potCoinStack.forEach((img) => img.setVisible(false));
      }
      this.updatePotTextPosition();

      const community = Array.isArray(table.community) ? table.community : [];
      const allowCommunityAnimation = this.communityAnimationReady;
      this.renderCommunityCards(community, allowCommunityAnimation);
      this.communityAnimationReady = true;
      const nextActionRoundKey = `${nextRoundSnapshot.tableId}|${nextRoundSnapshot.handId}|${nextRoundSnapshot.round}`;
      if (this.actionRoundKey !== nextActionRoundKey) {
        const hadActionRoundKey = Boolean(this.actionRoundKey);
        this.actionRoundKey = nextActionRoundKey;
        this.actionRoundBaselineAtBySeat = {};
        // 首次進桌維持現有動作；之後每次回合/手牌切換，才把當下 last_action_at 當作基準，避免沿用上一回合動作。
        if (hadActionRoundKey) {
          (this.seatViews || []).forEach((sv) => {
            sv.actionBadgeHideTimer?.remove();
            sv.actionBadgeHideTimer = null;
            this.tweens.killTweensOf(sv.actionBadge);
            sv.actionBadge?.setVisible(false).setAlpha(1).setScale(0.48);
          });
          const players = Array.isArray(table.players) ? table.players : [];
          players.forEach((player) => {
            const seat = parseSeat(player?.seat);
            if (seat === null) {
              return;
            }
            const actionAt = Number(player?.last_action_at);
            this.actionRoundBaselineAtBySeat[String(seat)] = Number.isFinite(actionAt) ? actionAt : 0;
          });
        }
      }
      const isHandPlaying = table.status === "playing";

      const nextSeatActionMap = {};
      const isShowdownActive = Object.keys(this.state?.showdownRevealsBySeat || {}).length > 0;

      // 只對 last_action_at 最大（最新）的玩家顯示動作標籤
      let maxRecentActionAt = 0;
      for (const _p of (Array.isArray(table.players) ? table.players : [])) {
        const _pAt = Number(_p.last_action_at);
        const _pKey = String(parseSeat(_p.seat) ?? "");
        const _pBaseline = Number(this.actionRoundBaselineAtBySeat?.[_pKey] ?? 0);
        if (Number.isFinite(_pAt) && _pAt > _pBaseline && _pAt > maxRecentActionAt) {
          maxRecentActionAt = _pAt;
        }
      }

      for (let index = 0; index < this.seatViews.length; index += 1) {
        const seatView = this.seatViews[index];
        const displaySeatNo = seatView.displaySeatNo;
        this.applySeatHoleCardScale(seatView);
        let player = table.players?.find((item) => Number(item.seat) === Number(displaySeatNo));
        const _currentTableId = String(this.state?.table?.table_id ?? "");
        const _oldTableId = this.app?.getHeroOldTableId?.() ?? "";
        // At old table after switch: server may have removed hero from player list — restore from snapshot
        if (!player && _oldTableId !== "" && _currentTableId === _oldTableId) {
          const _snap = this.app?.getHeroOldSeatData?.();
          if (_snap && isSameSeat(_snap.seat, displaySeatNo)) {
            player = _snap;
          }
        }
        if (!player) {
          this.updateSeatTextLayout(seatView, false);
          this.setSeatTurnEffect(seatView, false);
          seatView.nametag.setVisible(false);
          if (seatView.nametagBreathTween) {
            seatView.nametagBreathTween.remove();
            seatView.nametagBreathTween = null;
          }
          seatView.nametagGlow?.setVisible(false).setAlpha(0);
          seatView.name.setVisible(false).setText("");
          seatView.chips.setVisible(false).setText("");
          this.tweens.killTweensOf(seatView.actionBadge);
          seatView.actionBadgeHideTimer?.remove();
          seatView.actionBadgeHideTimer = null;
          seatView.actionBadge.setVisible(false).setAlpha(1).setScale(0.48);
          this.hideSeatBetCoins(seatView);
          seatView.betAmount.setVisible(false).setText("");
          seatView.profileBg.setVisible(false);
          seatView.profileFrame.setVisible(false);
          seatView.avatar.setVisible(false);
          seatView.foldOverlay.setVisible(false);
          seatView.roleBadge.setVisible(false);
          seatView.waitingBadge?.setVisible(false);
          seatView.sitPromptBg.setVisible(true);
          seatView.sitPromptCircle.setVisible(true);
          seatView.sitPromptPlus.setVisible(true);
          seatView.sitPromptLabel.setVisible(true);
          seatView.sitPromptBg.disableInteractive();
          seatView.sitPromptBg.off("pointerdown");
          this.hideSeatHoleCards(seatView);
          continue;
        }

        const isHero = isSameSeat(player.seat, heroSeatForDisplay);
        const avatarScale = isHero ? HERO_AVATAR_SCALE : perspectiveAvatarScale(seatView.posY);
        const frameScale = 1.437 * avatarScale / NORMAL_AVATAR_SCALE;
        const bgScale = 0.83 * avatarScale / NORMAL_AVATAR_SCALE;
        const avatarTexture = this.resolveAvatarTexture(player.avatar);
        seatView.profileBg.setVisible(true).setScale(bgScale);
        seatView.profileFrame.setVisible(true).setScale(frameScale).setFrame(isSameSeat(player.seat, activeSeat) ? "profile_frame_on" : "profile_frame_off");
        const frameSize = Math.min(seatView.profileFrame.displayWidth, seatView.profileFrame.displayHeight);
        const foldRadius = frameSize * 0.462;
        seatView.foldOverlay.setRadius(foldRadius).setPosition(seatView.posX, seatView.posY + AVATAR_Y_OFFSET);
        seatView.avatar.setVisible(true);
        const avatarInnerRatio = isHero ? PROFILE_AVATAR_INNER_RATIO : PROFILE_AVATAR_INNER_RATIO * 0.92;
        const avatarSize = frameSize * avatarInnerRatio;
        seatView.avatar.setDisplaySize(avatarSize, avatarSize);
        seatView.avatar.setY(seatView.posY + AVATAR_Y_OFFSET);
        seatView.avatar.setFlipX(false);
        seatView.avatar.setTexture(avatarTexture.atlasKey, avatarTexture.frameKey);
        this.updateSeatTextLayout(seatView, isHero);
        this.setSeatTurnEffect(seatView, isSameSeat(player.seat, activeSeat));
        const isWaiting = isHandPlaying && player.in_hand === false && (
          isHero
            ? Boolean(this.state?.heroJoinedWaiting)
            : Number(player.hole_count ?? 0) === 0
        );
        const roleFrame = this.resolveSeatRoleFrame(table, player.seat);
        if (roleFrame) {
          seatView.roleBadge.setFrame(roleFrame).setScale(0.63).setVisible(true);
        } else {
          seatView.roleBadge.setVisible(false);
        }
        seatView.waitingBadge?.setVisible(isWaiting);

        const rawName = String(player.username ?? "");
        seatView.name.setText(rawName.length > 4 ? rawName.slice(0, 4) : rawName);
        // Shrink font if name overflows nametag bounds
        const _ntW = seatView.nametag.displayWidth;
        const _maxNameW = _ntW * 0.82;
        if (_maxNameW > 0 && seatView.name.width > _maxNameW) {
          const _curPx = parseInt(seatView.name.style.fontSize, 10);
          seatView.name.setFontSize(`${Math.max(12, Math.floor(_curPx * _maxNameW / seatView.name.width))}px`);
        }
        seatView.chips.setText(formatAmount(player.chips));
        const isActiveTurn = isSameSeat(player.seat, activeSeat);
        seatView.nametag.setFrame("nametag").setVisible(true);
        if (isActiveTurn) {
          seatView.nametagGlow.setVisible(true);
          if (!seatView.nametagBreathTween) {
            seatView.nametagBreathTween = this.tweens.add({
              targets: seatView.nametagGlow,
              alpha: 0.45,
              duration: 900,
              ease: "Sine.InOut",
              yoyo: true,
              repeat: -1,
            });
          }
        } else {
          if (seatView.nametagBreathTween) {
            seatView.nametagBreathTween.remove();
            seatView.nametagBreathTween = null;
          }
          seatView.nametagGlow.setVisible(false).setAlpha(0);
        }
        const seatKey = String(parseSeat(player.seat) ?? "");
        const actionAt = Number(player.last_action_at);
        const baselineAt = Number(this.actionRoundBaselineAtBySeat?.[seatKey] ?? 0);
        const hasFreshAction = Number.isFinite(actionAt) && actionAt > baselineAt && actionAt === maxRecentActionAt;
        const actionForDisplay = (hasFreshAction && !isShowdownActive) ? player.last_action : null;
        this.trackSeatActionSfx(player.seat, actionForDisplay, nextSeatActionMap);
        const actionBrandFrame = this.resolveSeatActionBrandFrame(actionForDisplay);
        seatView.name.setVisible(true);
        seatView.chips.setVisible(true);
        seatView.sitPromptBg.setVisible(false);
        seatView.sitPromptCircle.setVisible(false);
        seatView.sitPromptPlus.setVisible(false);
        seatView.sitPromptLabel.setVisible(false);
        if (actionBrandFrame) {
          this.tweens.killTweensOf(seatView.actionBadge);
          seatView.actionBadge.setFrame(actionBrandFrame).setScale(0).setAlpha(1).setVisible(true);
          this.tweens.add({ targets: seatView.actionBadge, scaleX: 0.48, scaleY: 0.48, duration: 280, ease: "Back.Out" });
          seatView.actionBadgeHideTimer?.remove();
          seatView.actionBadgeHideTimer = this.time.delayedCall(1600, () => {
            seatView.actionBadgeHideTimer = null;
            this.tweens.add({
              targets: seatView.actionBadge,
              alpha: 0,
              duration: 400,
              ease: "Linear",
              onComplete: () => {
                if (seatView.actionBadge?.active) {
                  seatView.actionBadge.setVisible(false).setAlpha(1).setScale(0.48);
                }
              },
            });
          });
        } else {
          this.tweens.killTweensOf(seatView.actionBadge);
          seatView.actionBadgeHideTimer?.remove();
          seatView.actionBadgeHideTimer = null;
          seatView.actionBadge.setVisible(false).setAlpha(1).setScale(0.48);
        }
        const betValue = Number(table?.bets?.[String(player.seat)] ?? 0);
        const isCollectHidden = this.roundBetCollectHiddenSeats.has(Number(player.seat));
        const hasBet = Number.isFinite(betValue) && betValue > 0;
        const prevBetValue = Number(this.lastBetValueBySeat?.[seatKey] ?? 0);
        if (hasBet && betValue > prevBetValue && this.seatActionMapReady) {
          this.playBetFlyAnimation(seatView, betValue);
        }
        this.lastBetValueBySeat[seatKey] = hasBet ? betValue : 0;
        if (hasBet && !isCollectHidden) {
          this.showSeatBetCoins(seatView, betValue);
          seatView.betAmount.setText(formatAmount(betValue)).setVisible(true);
        } else {
          this.hideSeatBetCoins(seatView);
          seatView.betAmount.setText("").setVisible(false);
        }
        const isFolded = player.in_hand === false && !isWaiting;
        const isDimmed = isFolded || isWaiting;
        const dimTint = isDimmed ? 0x777777 : 0xffffff;
        seatView.avatar.setAlpha(1).setTint(dimTint);
        seatView.profileFrame.setAlpha(1).setTint(dimTint);
        seatView.profileBg.setAlpha(1);
        seatView.foldOverlay.setVisible(isDimmed);
        const holeRenderOptions = this.resolveSeatHoleRenderOptions(player, isHero);
        this.setSeatHoleCardsVisibleCount(seatView, holeRenderOptions.visibleCount, holeRenderOptions);
      }
      this.seatLastActionMap = nextSeatActionMap;
      this.seatActionMapReady = true;
      if (collectBets) {
        this.playRoundBetCollectAnimation(collectBets);
      }
      const showdownRevealCount = Object.keys(this.state?.showdownRevealsBySeat || {}).length;
      const currentHandId = Number(table.hand_id);
      if (
        showdownRevealCount > 0
        && Number.isFinite(currentHandId)
        && this.lastShowdownCollectHandId !== currentHandId
      ) {
        const currentVisibleBets = nextRoundSnapshot.bets || {};
        if (sumRoundBetsFromMap(currentVisibleBets) > 0) {
          this.markRoundBetCollectVisualState(currentVisibleBets, currentHandId);
          this.playRoundBetCollectAnimation({ ...currentVisibleBets });
        }
        this.lastShowdownCollectHandId = currentHandId;
      }
      if (showdownRevealCount > 0) {
        this.scheduleShowdownFlips();
        this.seatViews.forEach((sv) => {
          if (sv.actionBadge?.visible) {
            sv.actionBadgeHideTimer?.remove();
            sv.actionBadgeHideTimer = null;
            this.tweens.killTweensOf(sv.actionBadge);
            sv.actionBadge.setVisible(false).setAlpha(1).setScale(0.48);
          }
        });
      }
      const visibleCommCount = (this.communitySlots || []).filter((s) => s.shownCard !== null || s.pendingCard !== null).length;
      const currentHintHandId = Number(table.hand_id);
      const isNewHandStarted = isHandPlaying
        && Number.isFinite(currentHintHandId)
        && currentHintHandId > 0
        && currentHintHandId !== this.lastHintHandId;
      if (isNewHandStarted) {
        this.lastHintHandId = currentHintHandId;
        if (this.newRoundHintTimer) {
          this.newRoundHintTimer.remove();
          this.newRoundHintTimer = null;
        }
        this.tableHintText.setText("新局開始").setVisible(true).setAlpha(0.88);
        this.newRoundHintTimer = this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.tableHintText,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              this.tableHintText.setVisible(false).setAlpha(0.88);
              this.newRoundHintTimer = null;
            },
          });
        });
      } else if (!this.newRoundHintTimer) {
        let hintLabel = "";
        if (showdownRevealCount > 0) {
          hintLabel = "攤牌";
        } else if (visibleCommCount >= 5) {
          hintLabel = "河牌";
        } else if (visibleCommCount >= 4) {
          hintLabel = "轉牌";
        } else if (visibleCommCount >= 3) {
          hintLabel = "翻牌";
        }
        this.tableHintText.setText(hintLabel).setVisible(hintLabel !== "").setAlpha(0.88);
      }
      this.tryPlayHeroResultSfx(table);
      this.lastRoundSnapshot = nextRoundSnapshot;
      this.refreshTurnCountdownOverlay();
    } else {
      this.currentActiveSeat = null;
      this.currentTurnTimeout = null;
      this.currentTurnStartedAt = null;
      this.lastCountdownBeepSecond = null;
      this.stopCountdownSfx();
      this.lastResolvedHeroSeat = null;
      this.lastRoundSnapshot = null;
      this.lastShowdownCollectHandId = null;
      this.clearShowdownFlipTimers();
      this.showdownAnimatedSet = new Set();
      this.lastBetValueBySeat = {};
      this.roundBetCollectCarryAmount = 0;
      this.roundBetCollectCarryHandId = null;
      this.roundBetCollectHiddenSeats.clear();
      this.seatLastActionMap = {};
      this.seatActionMapReady = false;
      this.actionRoundKey = "";
      this.actionRoundBaselineAtBySeat = {};
      this.prevHeroTableSfxSnapshot = null;
      this.lastPlayedHeroResultHandKey = "";
      this.renderCommunityCards([], false);
      this.communityAnimationReady = false;
      this.clearRoundBetCollectFx();
      this.seatViews.forEach((seatView) => {
        this.setSeatTurnEffect(seatView, false);
        seatView.turnCountdownBg.setVisible(false);
        seatView.turnCountdown.setVisible(false);
        seatView.roleBadge.setVisible(false);
        seatView.nametag.setVisible(false);
        seatView.name.setVisible(false).setText("");
        seatView.chips.setVisible(false).setText("");
        seatView.actionBadgeHideTimer?.remove();
        seatView.actionBadgeHideTimer = null;
        this.tweens.killTweensOf(seatView.actionBadge);
        seatView.actionBadge.setVisible(false).setAlpha(1).setScale(0.48);
        this.hideSeatBetCoins(seatView);
        seatView.betAmount.setVisible(false).setText("");
        seatView.sitPromptBg.setVisible(false);
        seatView.sitPromptCircle.setVisible(false);
        seatView.sitPromptPlus.setVisible(false);
        seatView.sitPromptLabel.setVisible(false);
        this.hideSeatHoleCards(seatView);
      });
      this.potText.setText("").setVisible(false);
      this.centerPotBg?.setVisible(false);
      this.centerPotText?.setText("").setVisible(false);
      this.potCoinStack.forEach((img) => img.setVisible(false));
      this.updatePotTextPosition();
      this.lastHintHandId = null;
      if (this.newRoundHintTimer) { this.newRoundHintTimer.remove(); this.newRoundHintTimer = null; }
      this.tableHintText.setText("等待開始").setVisible(true).setAlpha(0.88);
      this.closeRaiseActionPanel();
    }

    const allowed = actionRequest?.allowed ?? [];
    if (allowed.length > 0) {
      const reqKey = `${actionRequest?.hand_id ?? ""}_${actionRequest?.seat ?? ""}`;
      if (reqKey !== this.lastSeenActionRequestKey) {
        this.lastSeenActionRequestKey = reqKey;
        const heroSeat = parseSeat(this.state?.heroSeat);
        const reqSeat = parseSeat(actionRequest?.seat);
        if (heroSeat !== null && reqSeat !== null && heroSeat === reqSeat) {
          this.app?.playVoiceByKey?.("voice_your_turn");
        }
      }
    } else {
      this.lastSeenActionRequestKey = "";
    }
    this.layoutActionButtons(allowed);

    this.renderRebuyModal(this.state.rebuyOffer);
    const handResultVersion = Number(this.state.handResultVersion ?? 0);
    if (handResultVersion > this.lastSeenHandResultVersion) {
      this.lastSeenHandResultVersion = handResultVersion;
      if (this.winGifIsPlaying) {
        this.pendingHandResult = this.state.handResult;
      } else {
        this.openHandResultModal(this.state.handResult);
      }
    } else if (!this.state.handResult && this.isHandResultModalOpen) {
      const countdownDone = this.handResultAutoCloseEndAt <= 0 || Date.now() >= this.handResultAutoCloseEndAt;
      if (countdownDone) {
        this.closeHandResultModal();
      }
    }

    const countdownSecs = this.state?.nextHandCountdownSeconds ?? 0;
    if (countdownSecs > 0) {
      if (this.nextHandCountdownEnd <= 0) {
        this.nextHandCountdownEnd = Date.now() + countdownSecs * 1000;
      }
    } else if (countdownSecs <= 0) {
      this.nextHandCountdownEnd = 0;
    }
  }

  buildRebuyOfferSignature(offer) {
    if (!offer) {
      return "";
    }
    return [
      String(offer.table_id ?? ""),
      String(offer.current_chips ?? ""),
      String(offer.min_buyin ?? ""),
      String(offer.max_buyin ?? ""),
      String(offer.default_buyin ?? ""),
      String(this.state?.walletBalance ?? ""),
    ].join("|");
  }

  buildRebuyModel(offer) {
    const currentChips = Math.max(0, Math.floor(Number(offer?.current_chips ?? 0)));
    const minBuyin = Math.max(0, Math.floor(Number(offer?.min_buyin ?? 0)));
    const maxBuyin = Math.max(minBuyin, Math.floor(Number(offer?.max_buyin ?? minBuyin)));
    const walletBalance = Math.max(0, Math.floor(Number(this.state?.walletBalance ?? 0)));
    const totalFunds = currentChips + walletBalance;
    const affordableMax = Math.min(maxBuyin, totalFunds);
    const canAffordMin = affordableMax >= minBuyin;
    const sliderMin = minBuyin;
    const sliderMax = canAffordMin ? affordableMax : Math.max(0, affordableMax);
    const fallbackDefault = Math.max(currentChips, minBuyin);
    const defaultBuyinRaw = Math.floor(Number(offer?.default_buyin ?? fallbackDefault));
    const defaultBuyin = Number.isFinite(defaultBuyinRaw) ? defaultBuyinRaw : fallbackDefault;
    const initialSelectedBuyin = canAffordMin
      ? Phaser.Math.Clamp(defaultBuyin, sliderMin, sliderMax)
      : sliderMax;
    return {
      currentChips,
      minBuyin,
      maxBuyin,
      walletBalance,
      totalFunds,
      affordableMax,
      canAffordMin,
      sliderMin,
      sliderMax,
      isSliderMovable: canAffordMin && sliderMax > sliderMin,
      initialSelectedBuyin,
    };
  }

  normalizeRebuySelectedBuyin(value, model) {
    if (!model) {
      return 0;
    }
    if (!model.canAffordMin) {
      return Math.max(0, Math.floor(Number(model.affordableMax ?? 0)));
    }
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) {
      return model.sliderMin;
    }
    return Phaser.Math.Clamp(n, model.sliderMin, model.sliderMax);
  }

  stepRebuyAmount(dir) {
    const model = this.rebuyModel;
    if (!model?.isSliderMovable) return;
    const bb = Math.max(1, Math.floor(Number(this.state?.table?.big_blind ?? this.state?.table?.bb ?? 1)));
    this.rebuySelectedBuyin = this.normalizeRebuySelectedBuyin(this.rebuySelectedBuyin + dir * bb, model);
    this.rebuyAmountText.setText(formatAmount(this.rebuySelectedBuyin));
    this.updateRebuySliderVisual(model);
  }

  setRebuySliderInteractive(enabled) {
    if (enabled) {
      this.rebuySliderHit.setInteractive({ useHandCursor: true });
      this.rebuySliderKnob.setInteractive({ useHandCursor: true });
      this.input.setDraggable(this.rebuySliderKnob, true);
      return;
    }
    this.rebuySliderHit.disableInteractive();
    this.rebuySliderKnob.disableInteractive();
  }

  updateRebuySliderVisual(model) {
    if (!model) {
      return;
    }
    const width = REBUY_SLIDER_TRACK_WIDTH;
    const span = model.sliderMax - model.sliderMin;
    let progress = 0;
    if (model.canAffordMin && span > 0) {
      progress = (this.rebuySelectedBuyin - model.sliderMin) / span;
    }
    progress = Phaser.Math.Clamp(progress, 0, 1);
    const fillWidth = Math.floor(width * progress);
    const knobX = REBUY_SLIDER_START_X + width * progress;
    const _rfr = REBUY_SLIDER_TRACK_HEIGHT / 2;
    this.rebuySliderFill.clear();
    if (fillWidth > 0) {
      this.rebuySliderFill.fillStyle(REBUY_SLIDER_FILL_COLOR, 1);
      this.rebuySliderFill.fillRoundedRect(0, -_rfr, fillWidth, REBUY_SLIDER_TRACK_HEIGHT, _rfr);
    }
    this.rebuySliderKnob.setPosition(knobX, REBUY_SLIDER_Y);
    const sliderAlpha = model.isSliderMovable ? 1 : 0.5;
    this.rebuySliderTrack.setAlpha(sliderAlpha);
    this.rebuySliderFill.setAlpha(sliderAlpha);
    this.rebuySliderKnob.setAlpha(sliderAlpha);
    this.rebuyMinusBtn?.setEnabled(model.isSliderMovable);
    this.rebuyPlusBtn?.setEnabled(model.isSliderMovable);
  }

  handleRebuySliderPointer(pointerX) {
    if (!this.rebuyModel?.isSliderMovable) {
      return;
    }
    const width = REBUY_SLIDER_TRACK_WIDTH;
    const span = this.rebuyModel.sliderMax - this.rebuyModel.sliderMin;
    if (width <= 0 || span <= 0) {
      return;
    }
    const progress = Phaser.Math.Clamp((Number(pointerX) - REBUY_SLIDER_START_X) / width, 0, 1);
    const nextBuyin = Math.round(this.rebuyModel.sliderMin + span * progress);
    this.rebuySelectedBuyin = this.normalizeRebuySelectedBuyin(nextBuyin, this.rebuyModel);
    this.rebuyAmountText.setText(formatAmount(this.rebuySelectedBuyin));
    this.updateRebuySliderVisual(this.rebuyModel);
  }

  renderRebuyModal(offer) {
    if (this._rebuyDeclined) offer = null;
    const hasRebuy = Boolean(offer);
    if (hasRebuy) {
      this.closeRaiseActionPanel();
    }
    this.rebuyOverlay.setVisible(hasRebuy);
    this.rebuyPanel.setVisible(hasRebuy);
    this.rebuyPanelBorder?.setVisible(hasRebuy);
    this.rebuyTitleLabel?.setVisible(hasRebuy);
    this.rebuyTitle.setVisible(hasRebuy);
    this.rebuyAmountBg?.setVisible(hasRebuy);
    this.rebuyAmountText.setVisible(hasRebuy);
    this.rebuyMinusBtn?.setVisible(hasRebuy);
    this.rebuyPlusBtn?.setVisible(hasRebuy);
    this.rebuyRangeText.setVisible(hasRebuy);
    this.rebuySliderTrack.setVisible(hasRebuy);
    this.rebuySliderFill.setVisible(hasRebuy);
    this.rebuySliderHit.setVisible(hasRebuy);
    this.rebuySliderKnob.setVisible(hasRebuy);
    this.rebuyHintText.setVisible(hasRebuy);
    this.rebuyConfirm.setVisible(hasRebuy);
    this.rebuyLeave.setVisible(hasRebuy);

    if (!hasRebuy) {
      this.rebuyOfferSignature = "";
      this.rebuyModel = null;
      this.setRebuySliderInteractive(false);
      return;
    }

    const model = this.buildRebuyModel(offer);
    this.rebuyModel = model;
    const signature = this.buildRebuyOfferSignature(offer);
    if (signature !== this.rebuyOfferSignature) {
      this.rebuyOfferSignature = signature;
      this.rebuySelectedBuyin = this.normalizeRebuySelectedBuyin(model.initialSelectedBuyin, model);
    } else {
      this.rebuySelectedBuyin = this.normalizeRebuySelectedBuyin(this.rebuySelectedBuyin, model);
    }

    this.rebuyAmountText
      .setText(formatAmount(this.rebuySelectedBuyin))
      .setColor(model.canAffordMin ? REBUY_NUMBER_COLOR : REBUY_NUMBER_ERROR_COLOR);
    this.rebuyRangeText.setText(`範圍 ${formatAmount(model.minBuyin)} ~ ${formatAmount(model.maxBuyin)}`);

    if (model.canAffordMin) {
      this.rebuyHintText
        .setText(`可用資金 ${formatAmount(model.totalFunds)}（拖動拉條調整補碼）`)
        .setColor(REBUY_HINT_COLOR);
    } else {
      this.rebuyHintText
        .setText(`資金不足：錢包+剩餘籌碼 ${formatAmount(model.totalFunds)} < 最低買入 ${formatAmount(model.minBuyin)}`)
        .setColor(REBUY_HINT_ERROR_COLOR);
    }

    this.rebuyConfirm.setEnabled(model.canAffordMin);
    this.rebuyLeave.setEnabled(true);
    this.setRebuySliderInteractive(model.isSliderMovable);
    this.updateRebuySliderVisual(model);
  }

  sendAction(action) {
    if (!this.state.actionRequest) {
      return;
    }
    const allowedActions = (this.state.actionRequest?.allowed ?? []).map((a) => String(a).toLowerCase());
    if (!allowedActions.includes(String(action).toLowerCase())) {
      return;
    }
    if (action === "raise" || action === "bet") {
      this.openRaiseActionPanel(action);
      return;
    }
    this.closeRaiseActionPanel();
    this.app.sendPacket("player_action", { action });
  }

  resolveSwitchRoomBuyin() {
    const table = this.state?.table || {};
    const minBuyin = Math.max(0, Math.floor(Number(table.min_buyin ?? 0)));
    const maxBuyin = Math.max(minBuyin, Math.floor(Number(table.max_buyin ?? minBuyin)));
    const heroSeat = this.resolveHeroSeatForDisplay(table);
    const heroPlayer = heroSeat === null
      ? null
      : (Array.isArray(table.players) ? table.players.find((player) => isSameSeat(player?.seat, heroSeat)) : null);
    const heroChips = Math.floor(Number(heroPlayer?.chips ?? 0));
    const fallback = maxBuyin > 0 ? maxBuyin : minBuyin;
    const base = Number.isFinite(heroChips) && heroChips > 0 ? heroChips : fallback;
    if (maxBuyin > 0) {
      return Math.max(minBuyin, Math.min(maxBuyin, base));
    }
    return Math.max(0, base);
  }

  submitRebuySelection() {
    const offer = this.state.rebuyOffer;
    if (!offer) {
      return;
    }
    const model = this.rebuyModel || this.buildRebuyModel(offer);
    if (!model.canAffordMin) {
      return;
    }
    const buyin = this.normalizeRebuySelectedBuyin(this.rebuySelectedBuyin, model);
    this.app.sendPacket("rebuy_decision", {
      buyin,
    });
  }

  leaveTableByRebuy() {
    this._rebuyDeclined = true;
    this.renderRebuyModal(null);

    if (this.isHandResultModalOpen) {
      this._pendingLeaveAfterHandResult = true;
      return;
    }

    const currentTableId = this.store.getState?.().table?.table_id ?? null;
    this.store.beginLeaveTable?.(currentTableId);
    this.app.sendPacket("leave_room", {});
    this.app.sendPacket("enter_game", { game_id: "texas_holdem" });
  }

  queueLeaveAction(type) {
    if (type === "switch") {
      const currentTableId = String(this.store.getState?.()?.table?.table_id ?? "");
      const _heroSeat = this.resolveHeroSeatForDisplay(this.store.getState?.()?.table);
      const _heroPlayer = this.store.getState?.()?.table?.players?.find(
        (p) => isSameSeat(p?.seat, _heroSeat),
      ) ?? null;
      this.app.setHeroOldSeatData?.(_heroPlayer);
      this.app.setHeroOldTableId?.(currentTableId);
      this.app.setHeroSwitchedMidHand?.(true);
      this.store.beginSwitchRoom?.();
      const buyin = this.resolveSwitchRoomBuyin();
      this.app.sendPacket("switch_room", { buyin, _heroWaiting: true });
    } else if (type === "leave") {
      const currentTableId = String(this.store.getState?.()?.table?.table_id ?? "");
      this.app.setPendingTableExit?.("leave", currentTableId, 0);
      this.store.beginLeaveTable?.(currentTableId);
      const _gameId = this.store.getState?.()?.table?.game_id || "texas_holdem";
      this.app.sendPacket?.("enter_game", { game_id: _gameId });
    }
  }

  resolveAvatarTexture(rawAvatarId) {
    // Normalise server format: "avatar_004" → "avatar_4", "avatar_11" → "avatar_11"
    const raw = String(rawAvatarId || "");
    const m = raw.match(/^avatar_0*(\d+)$/i);
    const frameKey = m ? `avatar_${Number(m[1])}` : "avatar_1";
    const avatarAtlas = this.textures.get("avatar_element");
    if (avatarAtlas?.has(frameKey)) {
      return { atlasKey: "avatar_element", frameKey };
    }
    // Fallback: first frame of avatar_element
    return { atlasKey: "avatar_element", frameKey: "avatar_1" };
  }
}



