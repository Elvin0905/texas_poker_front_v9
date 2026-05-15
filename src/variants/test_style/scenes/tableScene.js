import { bindImageButton, createRectButton } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";

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
const PANEL_TEXT_OUTLINE_STYLE = { stroke: "#000000", strokeThickness: 1 };
const SEAT_NAME_COLOR = UI_TEXT_COLOR;
const SEAT_INFO_COLOR = "#F9CD73";
const SEAT_CHIPS_OUTLINE_STYLE = { stroke: SEAT_NAME_COLOR, strokeThickness: 1 };
const OVERLAY_COLOR = 0x000000;
const OVERLAY_ALPHA = 0.56;
const REBUY_PANEL_COLOR = 0x13283a;
const REBUY_PANEL_ALPHA = 0.98;
const REBUY_TITLE_COLOR = "#ecd5b5";
const REBUY_NUMBER_COLOR = "#ecd5b5";
const REBUY_NUMBER_ERROR_COLOR = "#ff6b6b";
const REBUY_HINT_COLOR = "#d9b98a";
const REBUY_HINT_ERROR_COLOR = "#ff6b6b";
const REBUY_CONFIRM_COLOR = 0x24583b;
const REBUY_LEAVE_COLOR = 0x5b2c2c;
const REBUY_SLIDER_TRACK_COLOR = 0x38506a;
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
const CHANGE_TABLE_BUTTON_X = 630;
const CHANGE_TABLE_BUTTON_Y = 142;
const EXIT_TABLE_BUTTON_X = 630;
const EXIT_TABLE_BUTTON_Y = 52;
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
const COMMUNITY_CARD_WIDTH = 130;
const COMMUNITY_CARD_HEIGHT = 180;
const COMMUNITY_CARD_Y = 930;
const COMMUNITY_CARD_X_LIST = [103, 233, 363, 493, 623];
const COMMUNITY_CARD_DEPTH = 8;
const COMMUNITY_DEAL_FLY_CARD_DEPTH = 30;
const COMMUNITY_DEAL_FLY_DURATION = 280;
const COMMUNITY_DEAL_FLIP_HALF_DURATION = 110;
const COMMUNITY_DEAL_STAGGER_MS = 130;
const COMMUNITY_DEAL_POP_DURATION = 90;
const COMMUNITY_DEAL_POP_SCALE = 1.06;
const PLAYING_CARDS_ATLAS_KEY = "playing_cards_element";
const POT_COIN_DEPTH = 9;
const ROUND_BET_COLLECT_COIN_DEPTH = 24;
const ROUND_BET_COLLECT_TEXT_DEPTH = 24.1;
const ROUND_BET_COLLECT_DURATION = 420;
const ROUND_BET_COLLECT_STAGGER_MS = 65;

// 底池文字（顯示在 coin 圖示正下方）
const POT_TEXT_GAP_Y = 4;

// 玩家操作列（棄牌/過牌/跟注/全下）
const ACTION_ROW_Y = 1330;
const ACTION_BUTTON_ORDER = ["check", "call", "bet", "raise", "allin", "fold"];
const ACTION_BUTTON_GAP = 10;
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
const RAISE_PANEL_SLIDER_KNOB_RADIUS = 16;
const RAISE_PANEL_QUICK_Y_OFFSET = 78;
const RAISE_PANEL_QUICK_GAP = 12;
const RAISE_PANEL_QUICK_WIDTH = 118;
const RAISE_PANEL_QUICK_HEIGHT = 56;
const RAISE_PANEL_CONFIRM_X_OFFSET = 184;
const RAISE_PANEL_CONFIRM_Y_OFFSET = 118;
const RAISE_PANEL_CONFIRM_WIDTH = 150;
const RAISE_PANEL_CONFIRM_HEIGHT = 54;
const RAISE_PANEL_COVER_PADDING_X = 12;
const RAISE_PANEL_COLOR = 0x15283c;
const RAISE_PANEL_ALPHA = 0.97;
const RAISE_PANEL_TITLE_COLOR = "#ecd5b5";
const RAISE_PANEL_AMOUNT_COLOR = "#f9cd73";
const RAISE_PANEL_HINT_COLOR = "#d9b98a";
const RAISE_PANEL_TITLE_FONT_SIZE = "24px";
const RAISE_PANEL_AMOUNT_FONT_SIZE = "38px";
const RAISE_PANEL_HINT_FONT_SIZE = "20px";
const RAISE_PANEL_QUICK_COLOR = 0x264766;
const RAISE_PANEL_QUICK_ACTIVE_COLOR = 0x3f6e95;
const RAISE_PANEL_CONFIRM_COLOR = 0x2f7a4d;
const RAISE_PANEL_QUICK_MULTIPLIERS = [2, 3, 4];

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
const REBUY_BUTTON_TEXT_STYLE = { color: REBUY_TITLE_COLOR, ...PANEL_TEXT_OUTLINE_STYLE };

const SWITCH_CONFIRM_OVERLAY_DEPTH = 140;
const SWITCH_CONFIRM_PANEL_DEPTH = 141;
const SWITCH_CONFIRM_TEXT_DEPTH = 142;
const SWITCH_CONFIRM_PANEL_WIDTH = 600;
const SWITCH_CONFIRM_PANEL_HEIGHT = 360;
const SWITCH_CONFIRM_TITLE_Y = 590;
const SWITCH_CONFIRM_MESSAGE_Y = 695;
const SWITCH_CONFIRM_BUTTON_Y = 835;
const SWITCH_CONFIRM_CONFIRM_X = 245;
const SWITCH_CONFIRM_CANCEL_X = 475;
const SWITCH_CONFIRM_BUTTON_WIDTH = 190;
const SWITCH_CONFIRM_BUTTON_HEIGHT = 64;

// 結算面板（派彩顯示）
const HAND_RESULT_OVERLAY_DEPTH = 130;
const HAND_RESULT_PANEL_DEPTH = 131;
const HAND_RESULT_TEXT_DEPTH = 132;
const HAND_RESULT_OVERLAY_ALPHA = 0.68;
const HAND_RESULT_PANEL_COLOR = 0x1f2b3a;
const HAND_RESULT_PANEL_ALPHA = 0.97;
const HAND_RESULT_PANEL_X = 360;
const HAND_RESULT_PANEL_Y = 720;
const HAND_RESULT_PANEL_WIDTH = 660;
const HAND_RESULT_PANEL_HEIGHT = 1100;
const HAND_RESULT_TITLE_Y = 245;
const HAND_RESULT_HEADER_Y = 342;
const HAND_RESULT_LIST_START_Y = 430;
const HAND_RESULT_ROW_GAP = 142;
const HAND_RESULT_ROW_WIDTH = 600;
const HAND_RESULT_ROW_HEIGHT = 140;
const HAND_RESULT_ROW_HERO_COLOR = 0x4b2f1d;
const HAND_RESULT_ROW_NORMAL_COLOR = 0x0d1725;
const HAND_RESULT_TITLE_COLOR = "#f4deba";
const HAND_RESULT_TEXT_COLOR = "#ffffff";
const HAND_RESULT_HINT_COLOR = "#d6bd96";
const HAND_RESULT_WIN_COLOR = "#62d26f";
const HAND_RESULT_LOSE_COLOR = "#ff6b6b";
const HAND_RESULT_NEUTRAL_COLOR = "#e8d2ad";
const HAND_RESULT_FOLD_COLOR = "#b8c1cc";
const HAND_RESULT_TITLE_FONT_SIZE = "38px";
const HAND_RESULT_ROW_FONT_SIZE = "22px";
const HAND_RESULT_AMOUNT_FONT_SIZE = "30px";
const HAND_RESULT_DETAIL_FONT_SIZE = "21px";
const HAND_RESULT_HEADER_FONT_SIZE = "20px";
const HAND_RESULT_HINT_FONT_SIZE = "22px";
const HAND_RESULT_HINT_Y = 1245;
const HAND_RESULT_TEXT_OUTLINE_STYLE = { stroke: "#000000", strokeThickness: 2 };
const HAND_RESULT_TITLE_OUTLINE_STYLE = HAND_RESULT_TEXT_OUTLINE_STYLE;
const HAND_RESULT_PLAYER_X = 78;
const HAND_RESULT_CONTRIB_X = 316;
const HAND_RESULT_WIN_X = 454;
const HAND_RESULT_NET_X = 606;
const HAND_RESULT_DETAIL_X = 78;
const HAND_RESULT_CARDS_START_X = 190;
const HAND_RESULT_TOP_Y_OFFSET = -38;
const HAND_RESULT_DETAIL_Y_OFFSET = 28;
const HAND_RESULT_CARD_WIDTH = 66;
const HAND_RESULT_CARD_HEIGHT = 93;
const HAND_RESULT_CARD_GAP = 4;

// 座位與頭像比例、輪到玩家特效參數
const DEFAULT_SEAT_COUNT = 6;
const DEFAULT_SEAT_START = 0;
const HERO_AVATAR_SCALE = 1;
const NORMAL_AVATAR_SCALE = 0.7;
const ACTIVE_AVATAR_ALPHA = 1;
const WAITING_AVATAR_ALPHA = 0.38;
const FOLDED_AVATAR_ALPHA = 0.55;
const TURN_GLOW_COLOR = 0xfff1a8;
const TURN_GLOW_OUTER_RADIUS = 76;
const TURN_GLOW_INNER_RADIUS = 62;
const TURN_GLOW_OUTER_ALPHA = 0.85;
const TURN_GLOW_INNER_ALPHA = 1;
const TURN_GLOW_FILL_ALPHA_OUTER = 0.22;
const TURN_GLOW_FILL_ALPHA_INNER = 0.14;
const TURN_GLOW_STROKE_WIDTH_OUTER = 10;
const TURN_GLOW_STROKE_WIDTH_INNER = 6;
const TURN_GLOW_PULSE_DURATION = 360;
const TURN_GLOW_SCALE_TO = 1.2;
const TURN_SWEEP_ARC_RADIUS = 86;
const TURN_SWEEP_ARC_SPAN = 56;
const TURN_SWEEP_STROKE_WIDTH = 8;
const TURN_SWEEP_STROKE_ALPHA = 1;
const TURN_SWEEP_ROTATE_DURATION = 720;
const TURN_JUMP_HEIGHT = 10;
const TURN_JUMP_DURATION = 280;
const TURN_COUNTDOWN_FONT_SIZE = "84px";
const TURN_COUNTDOWN_COLOR = "#ffffff";
const TURN_COUNTDOWN_ALPHA = 0.58;
const TURN_COUNTDOWN_Y_OFFSET = 2;
const TURN_COUNTDOWN_TICK_MS = 120;
const TURN_COUNTDOWN_WARNING_SECONDS = 5;
const TURN_COUNTDOWN_WARNING_COLOR = "#ff5555";
const TURN_COUNTDOWN_WARNING_BLINK_MS = 180;
const TURN_COUNTDOWN_WARNING_ALPHA = 0.95;
const TURN_COUNTDOWN_CRITICAL_SECONDS = 3;
const TURN_COUNTDOWN_CRITICAL_SCALE_MAX = 1.45;
const TURN_COUNTDOWN_CRITICAL_PULSE_SPEED = 0.018;
const TURN_AVATAR_HIGHLIGHT_TINT = 0xfff1a8;

// 發牌動畫參數（起點、落點偏移、角度、速度、音效）
const DEAL_CARD_FROM_X = 360;
const DEAL_CARD_FROM_Y = 500;
const DEAL_CARD_ATLAS_KEY = "game_table";
const DEAL_CARD_FRAME = "card_back";
const DEAL_CARD_NORMAL_SCALE = 0.4;
const DEAL_CARD_HERO_SCALE = 1;
const DEAL_CARD_START_ANGLE = -18;
const DEAL_CARD_FLY_DURATION = 280;
const DEAL_CARD_POP_DURATION = 80;
const DEAL_CARD_DEPTH = 27;
const DEAL_CARD_TARGET_OFFSET_X_LEFT =  56;
const DEAL_CARD_TARGET_OFFSET_X_RIGHT = 84;
// 右側三個翻轉座位手牌 X 偏移（同樣分 left/right）
const DEAL_CARD_MIRROR_TARGET_OFFSET_X_LEFT = 84;
const DEAL_CARD_MIRROR_TARGET_OFFSET_X_RIGHT = 56;
const DEAL_CARD_TARGET_OFFSET_Y = 17;
// 主玩家（hero）手牌位置獨立微調
const HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT = 360;
const HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT = 440;
const HERO_DEAL_CARD_TARGET_OFFSET_Y = 17;
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
const DEAL_CARD_LEFT_ANGLE = -10;
const DEAL_CARD_RIGHT_ANGLE = 10;
const HOLE_CARD_FLIP_HALF_DURATION = 110;
const HOLE_CARD_FLIP_POP_DURATION = 90;
const HOLE_CARD_FLIP_POP_SCALE = 1.08;

// 座位元件圖層順序（頭像在下，文字/徽章/特效在上）
const SEAT_AVATAR_DEPTH = 21;
const SEAT_HOLE_CARD_DEPTH = 22;
const SEAT_TEXT_DEPTH = 23;
const SEAT_ROLE_BADGE_DEPTH = 20;
const SEAT_BET_COIN_DEPTH = 20.6;
const SEAT_BET_TEXT_DEPTH = 20.7;
const SEAT_FX_DEPTH = 26;
const SEAT_COUNTDOWN_DEPTH = 28;
const FLIP_AVATAR_INDEXES_6 = [1, 2, 3];

// 名字位置偏移（分一般玩家/自己；分左側樣式/右側樣式）
const NORMAL_NAME_X_OFFSET_LEFT = -72;
const NORMAL_NAME_X_OFFSET_RIGHT = 72;
const NORMAL_NAME_Y_OFFSET = 72;
const HERO_NAME_X_OFFSET_LEFT = -103;
const HERO_NAME_X_OFFSET_RIGHT = 103;
const HERO_NAME_Y_OFFSET = 95;

// 莊家/小盲/大盲徽章位置偏移（分左右樣式）
const NORMAL_ROLE_BADGE_X_OFFSET_RIGHT = 54;
const NORMAL_ROLE_BADGE_X_OFFSET_LEFT = -54;
const NORMAL_ROLE_BADGE_Y_OFFSET = 92;
const HERO_ROLE_BADGE_X_OFFSET_RIGHT = 158;
const HERO_ROLE_BADGE_X_OFFSET_LEFT = -138;
const HERO_ROLE_BADGE_Y_OFFSET = -50;

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
  { x: 350, y: 1120 }, // 座位 0
  { x: 550, y: 620 },  // 座位 1
  { x: 520, y: 320 },  // 座位 2
  { x: 280, y: 220 },  // 座位 3
  { x: 171, y: 414 },  // 座位 4
  { x: 136, y: 724 },  // 座位 5
];

// 6 人桌座位座標（畫面座標；自己在下方）
const SEAT_POSITIONS_6 = [
  { x: 150, y: 1140 }, // 玩家本人座位（下方）
  { x: 640, y: 700 },
  { x: 605, y: 390 },
  { x: 430, y: 140 },
  { x: 115, y: 280 },
  { x: 80, y: 590 },
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
    return "coin_low";
  }
  if (bbMultiple <= 20) {
    return "coin_normal";
  }
  if (bbMultiple <= 30) {
    return "coin_high";
  }
  return "coin_max";
}

function formatAmount(valueRaw) {
  const n = Number(valueRaw);
  if (!Number.isFinite(n)) {
    return "0";
  }
  return n.toLocaleString("en-US");
}

function formatResultAmount(valueRaw) {
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (value < 0) {
    return `-${formatAmount(Math.abs(value))}`;
  }
  return formatAmount(value);
}

function formatHandResultName(valueRaw, fallback) {
  const value = String(valueRaw || fallback || "").trim();
  if (!value) {
    return String(fallback || "");
  }
  const chars = Array.from(value);
  if (chars.length <= 10) {
    return value;
  }
  return `${chars.slice(0, 10).join("")}...`;
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
  let best5 = best5Raw;
  if (typeof best5Raw === "string") {
    try {
      best5 = JSON.parse(best5Raw);
    } catch (_) {
      best5 = [];
    }
  }
  if (!Array.isArray(best5) || best5.length <= 0) {
    return [];
  }
  const frames = [];
  best5.slice(0, 5).forEach((cardRaw) => {
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
    this.lastSeenDealCardVersion = 0;
    this.communitySlots = [];
    this.communityAnimationReady = false;
    this.lastRoundSnapshot = null;
    this.lastShowdownCollectHandId = null;
    this.roundBetCollectFx = [];
    this.roundBetCollectCarryAmount = 0;
    this.roundBetCollectCarryHandId = null;
    this.roundBetCollectHiddenSeats = new Set();
    this.lastSeenHandResultVersion = 0;
    this.handResultRows = [];
    this.isHandResultModalOpen = false;
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
    this.rebuyPurpose = "normal";
    this.switchRoomRebuyOffer = null;
    this.switchRoomConfirmVisible = false;
    this.pendingSwitchRoomNeedsFold = false;
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
    this.rebuySliderDragPointerId = null;
    this.onRebuySliderPointerMove = (pointer) => this.handleRebuySliderDragMove(pointer);
    this.onRebuySliderPointerUp = (pointer) => this.stopRebuySliderDrag(pointer);
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app.store;
    this.lastSeenDealCardVersion = Number(this.store.getState?.().dealCardVersion ?? 0);
    this.lastSeenHandResultVersion = Number(this.store.getState?.().handResultVersion ?? 0);

    this.add.image(CENTER_X, CENTER_Y, "game_table", "bg").setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT).setDepth(BG_DEPTH);
    this.add.image(CENTER_X, CENTER_Y, "game_table", "tbale").setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT).setDepth(TABLE_DEPTH);

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

    this.changeTableButton = this.add
      .image(CHANGE_TABLE_BUTTON_X, CHANGE_TABLE_BUTTON_Y, "game_table", "btn_change_table")
      .setScale(1);
    bindImageButton(this, this.changeTableButton, {
      onClick: () => {
        this.handleSwitchRoomClick();
      },
    });

    this.exitTableButton = this.add
      .image(EXIT_TABLE_BUTTON_X, EXIT_TABLE_BUTTON_Y, "game_table", "btn_exit_table")
      .setScale(1);
    bindImageButton(this, this.exitTableButton, {
      onClick: () => {
        const currentTableId = this.store.getState?.().table?.table_id ?? null;
        this.store.beginLeaveTable?.(currentTableId);
        this.app.sendPacket("leave_room", {});
        this.app.sendPacket("enter_lobby", {});
      },
    });

    this.exitReplayButton = createRectButton(this, {
      x: EXIT_REPLAY_BUTTON_X,
      y: EXIT_REPLAY_BUTTON_Y,
      width: EXIT_REPLAY_BUTTON_WIDTH,
      height: EXIT_REPLAY_BUTTON_HEIGHT,
      label: "離開回放",
      color: 0x6a2f2f,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1, fontSize: "20px" },
      visible: false,
      onClick: () => {
        this.app.stopHandReplay?.("manual_exit_button");
        // 需求：離開回放後直接回到德州選桌大廳，而不是停留在牌桌畫面
        this.store.setPage?.("gameLobby");
        this.app.sendPacket?.("enter_game", { game_id: "texas_holdem" });
      },
    });
    this.replaySpeedButton = createRectButton(this, {
      x: REPLAY_SPEED_BUTTON_X,
      y: REPLAY_SPEED_BUTTON_Y,
      width: REPLAY_SPEED_BUTTON_WIDTH,
      height: REPLAY_SPEED_BUTTON_HEIGHT,
      label: "加速：關",
      color: 0x2e4366,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1, fontSize: "20px" },
      visible: false,
      onClick: () => {
        const currentFast = Boolean(this.app.isHandReplayFastMode?.());
        this.app.setHandReplayFastMode?.(!currentFast);
      },
    });

    this.communitySlots = [];
    for (let i = 0; i < COMMUNITY_SLOT_COUNT; i += 1) {
      const cardX = COMMUNITY_CARD_X_LIST[i];
      const frontCard = this.add
        .image(cardX, COMMUNITY_CARD_Y, PLAYING_CARDS_ATLAS_KEY, "Ac")
        .setDisplaySize(COMMUNITY_CARD_WIDTH, COMMUNITY_CARD_HEIGHT)
        .setDepth(COMMUNITY_CARD_DEPTH)
        .setVisible(false);
      this.communitySlots.push({
        frontCard,
        shownCard: null,
        pendingCard: null,
        flyCard: null,
        flyTween: null,
        flipTween: null,
        revealTween: null,
      });
    }

    this.potCoinImage = this.add
      .image(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, DEAL_CARD_ATLAS_KEY, "coin_low")
      .setDepth(POT_COIN_DEPTH)
      .setVisible(false);

    this.potText = this.add.text(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, "", {
      fontSize: "42px",
      color: UI_TEXT_COLOR,
      fontStyle: "bold",
      fontFamily: UI_FONT_STACK,
      ...UI_TEXT_OUTLINE_STYLE,
    })
      .setVisible(false);
    this.updatePotTextPosition();

    this.seatViews = [];
    this.buildSeatViews(DEFAULT_SEAT_COUNT, DEFAULT_SEAT_START);
    this.turnCountdownTicker = this.time.addEvent({
      delay: TURN_COUNTDOWN_TICK_MS,
      loop: true,
      callback: () => this.refreshTurnCountdownOverlay(),
    });

    this.actionButtons = {};
    ACTION_BUTTON_ORDER.forEach((action) => {
      const frame = `btn_${action}`;
      if (!this.textures.get(DEAL_CARD_ATLAS_KEY)?.has(frame)) {
        return;
      }
      const image = this.add
        .image(CENTER_X, ACTION_ROW_Y, DEAL_CARD_ATLAS_KEY, frame)
        .setDepth(ACTION_BUTTON_DEPTH)
        .setVisible(false);
      bindImageButton(this, image, {
        onClick: () => this.sendAction(action),
      });
      this.actionButtons[action] = image;
    });

    this.raisePanelOverlay = this.add
      .rectangle(CENTER_X, CENTER_Y, VIEW_WIDTH, VIEW_HEIGHT, 0x000000, 0.001)
      .setDepth(RAISE_PANEL_OVERLAY_DEPTH)
      .setVisible(false);
    this.raisePanelOverlay.setInteractive({ useHandCursor: false });
    this.raisePanelOverlay.on("pointerdown", () => this.closeRaiseActionPanel());

    this.raisePanelBg = this.add
      .rectangle(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y, RAISE_PANEL_WIDTH, RAISE_PANEL_HEIGHT, RAISE_PANEL_COLOR, RAISE_PANEL_ALPHA)
      .setStrokeStyle(2, 0x6f8bad, 0.95)
      .setDepth(RAISE_PANEL_DEPTH)
      .setVisible(false);
    this.raisePanelBg.setInteractive({ useHandCursor: false });
    this.raisePanelBg.on("pointerdown", () => {});

    this.raisePanelTitle = this.add
      .text(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_TITLE_Y_OFFSET, "選擇加注金額", {
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
      .text(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_AMOUNT_Y_OFFSET, "0", {
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
      .text(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_RANGE_Y_OFFSET, "", {
        fontSize: RAISE_PANEL_HINT_FONT_SIZE,
        color: RAISE_PANEL_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setOrigin(0.5)
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);

    const raiseSliderStartX = CENTER_X - RAISE_PANEL_SLIDER_TRACK_WIDTH * 0.5;
    this.raisePanelSliderTrack = this.add
      .rectangle(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET, RAISE_PANEL_SLIDER_TRACK_WIDTH, RAISE_PANEL_SLIDER_TRACK_HEIGHT, REBUY_SLIDER_TRACK_COLOR, 1)
      .setDepth(RAISE_PANEL_TEXT_DEPTH)
      .setVisible(false);

    this.raisePanelSliderFill = this.add
      .rectangle(raiseSliderStartX, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET, 0, RAISE_PANEL_SLIDER_TRACK_HEIGHT, REBUY_SLIDER_FILL_COLOR, 1)
      .setOrigin(0, 0.5)
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.1)
      .setVisible(false);

    this.raisePanelSliderHit = this.add
      .rectangle(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET, RAISE_PANEL_SLIDER_TRACK_WIDTH, RAISE_PANEL_SLIDER_HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.2)
      .setVisible(false);
    this.raisePanelSliderHit.setInteractive({ useHandCursor: true });
    this.raisePanelSliderHit.on("pointerdown", (pointer) => {
      this.handleRaisePanelSliderPointer(pointer?.worldX ?? pointer?.x ?? CENTER_X);
    });

    this.raisePanelSliderKnob = this.add
      .circle(CENTER_X, ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET, RAISE_PANEL_SLIDER_KNOB_RADIUS, REBUY_SLIDER_KNOB_COLOR, 1)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(RAISE_PANEL_TEXT_DEPTH + 0.3)
      .setVisible(false);
    this.raisePanelSliderKnob.setInteractive({ useHandCursor: true });
    this.raisePanelSliderKnob.on("pointerdown", () => {});
    this.input.setDraggable(this.raisePanelSliderKnob, true);
    this.raisePanelSliderKnob.on("drag", (_pointer, dragX) => {
      this.handleRaisePanelSliderPointer(dragX);
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
    this.raisePanelBg.setSize(this.raisePanelCoverWidth, RAISE_PANEL_HEIGHT);

    quickItems.forEach((item, index) => {
      const x = CENTER_X + (index - 1.5) * (RAISE_PANEL_QUICK_WIDTH + RAISE_PANEL_QUICK_GAP);
      const y = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_QUICK_Y_OFFSET;
      const button = createRectButton(this, {
        x,
        y,
        width: RAISE_PANEL_QUICK_WIDTH,
        height: RAISE_PANEL_QUICK_HEIGHT,
        label: item.label,
        color: RAISE_PANEL_QUICK_COLOR,
        strokeColor: 0x7b93ad,
        labelStyle: {
          fontSize: "32px",
          color: "#ecd5b5",
          ...PANEL_TEXT_OUTLINE_STYLE,
        },
        onClick: () => this.applyRaiseQuickChoice(item),
        visible: false,
      });
      button.bg.setDepth(RAISE_PANEL_TEXT_DEPTH + 0.35);
      button.text.setDepth(RAISE_PANEL_TEXT_DEPTH + 0.4);
      this.raiseQuickButtons.push({ ...item, button });
    });

    this.raisePanelConfirm = createRectButton(this, {
      x: CENTER_X + this.raisePanelConfirmInlineXOffset,
      y: ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_QUICK_Y_OFFSET,
      width: RAISE_PANEL_CONFIRM_WIDTH,
      height: RAISE_PANEL_CONFIRM_HEIGHT,
      label: "確認下注",
      color: RAISE_PANEL_CONFIRM_COLOR,
      labelStyle: {
        fontSize: "32px",
        color: "#ecd5b5",
        ...PANEL_TEXT_OUTLINE_STYLE,
      },
      onClick: () => this.confirmRaiseAction(),
      visible: false,
    });
    this.raisePanelConfirm.bg.setDepth(RAISE_PANEL_TEXT_DEPTH + 0.45);
    this.raisePanelConfirm.text.setDepth(RAISE_PANEL_TEXT_DEPTH + 0.5);

    this.rebuyOverlay = this.add
      .rectangle(REBUY_OVERLAY_X, REBUY_OVERLAY_Y, REBUY_OVERLAY_WIDTH, REBUY_OVERLAY_HEIGHT, OVERLAY_COLOR, OVERLAY_ALPHA)
      .setDepth(REBUY_OVERLAY_DEPTH)
      .setVisible(false);
    this.rebuyOverlay.setInteractive({ useHandCursor: false });
    this.rebuyOverlay.on("pointerdown", () => {});

    this.rebuyPanel = this.add
      .rectangle(REBUY_PANEL_X, REBUY_PANEL_Y, REBUY_PANEL_WIDTH, REBUY_PANEL_HEIGHT, REBUY_PANEL_COLOR, REBUY_PANEL_ALPHA)
      .setDepth(REBUY_PANEL_DEPTH)
      .setVisible(false);
    this.rebuyPanel.setInteractive({ useHandCursor: false });
    this.rebuyPanel.on("pointerdown", () => {});

    this.rebuyTitle = this.add
      .text(REBUY_TITLE_X, REBUY_TITLE_Y, "補籌碼", {
        fontSize: REBUY_TEXT_FONT_SIZE,
        color: REBUY_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(REBUY_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.rebuyAmountText = this.add
      .text(REBUY_AMOUNT_X, REBUY_AMOUNT_Y, "0", {
        fontSize: REBUY_NUMBER_FONT_SIZE,
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

    this.rebuySliderTrack = this.add
      .rectangle(CENTER_X, REBUY_SLIDER_Y, REBUY_SLIDER_TRACK_WIDTH, REBUY_SLIDER_TRACK_HEIGHT, REBUY_SLIDER_TRACK_COLOR, 1)
      .setDepth(REBUY_TEXT_DEPTH)
      .setVisible(false);

    this.rebuySliderFill = this.add
      .rectangle(REBUY_SLIDER_START_X, REBUY_SLIDER_Y, 0, REBUY_SLIDER_TRACK_HEIGHT, REBUY_SLIDER_FILL_COLOR, 1)
      .setOrigin(0, 0.5)
      .setDepth(REBUY_TEXT_DEPTH + 0.1)
      .setVisible(false);

    this.rebuySliderHit = this.add
      .rectangle(CENTER_X, REBUY_SLIDER_Y, REBUY_SLIDER_TRACK_WIDTH, REBUY_SLIDER_HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(REBUY_TEXT_DEPTH + 0.2)
      .setVisible(false);
    this.rebuySliderHit.setInteractive({ useHandCursor: true });
    this.rebuySliderHit.on("pointerdown", (pointer) => {
      this.startRebuySliderDrag(pointer);
    });

    this.rebuySliderKnob = this.add
      .circle(REBUY_SLIDER_START_X, REBUY_SLIDER_Y, REBUY_SLIDER_KNOB_RADIUS, REBUY_SLIDER_KNOB_COLOR, 1)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(REBUY_TEXT_DEPTH + 0.3)
      .setVisible(false);
    this.rebuySliderKnob.setInteractive({ useHandCursor: true });
    this.rebuySliderKnob.on("pointerdown", (pointer) => {
      this.startRebuySliderDrag(pointer);
    });
    this.input.on("pointermove", this.onRebuySliderPointerMove);
    this.input.on("pointerup", this.onRebuySliderPointerUp);
    this.input.on("pointerupoutside", this.onRebuySliderPointerUp);

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

    this.rebuyConfirm = createRectButton(this, {
      x: REBUY_CONFIRM_X,
      y: REBUY_BUTTON_Y,
      width: REBUY_BUTTON_WIDTH,
      height: REBUY_BUTTON_HEIGHT,
      label: "確認補碼",
      color: REBUY_CONFIRM_COLOR,
      labelStyle: REBUY_BUTTON_TEXT_STYLE,
      onClick: () => this.submitRebuySelection(),
      visible: false,
    });
    this.rebuyConfirm.bg.setDepth(REBUY_TEXT_DEPTH + 0.4);
    this.rebuyConfirm.text.setDepth(REBUY_TEXT_DEPTH + 0.5);

    this.rebuyLeave = createRectButton(this, {
      x: REBUY_LEAVE_X,
      y: REBUY_BUTTON_Y,
      width: REBUY_BUTTON_WIDTH,
      height: REBUY_BUTTON_HEIGHT,
      label: "離開牌局",
      color: REBUY_LEAVE_COLOR,
      labelStyle: REBUY_BUTTON_TEXT_STYLE,
      onClick: () => this.handleRebuyCancelButton(),
      visible: false,
    });
    this.rebuyLeave.bg.setDepth(REBUY_TEXT_DEPTH + 0.4);
    this.rebuyLeave.text.setDepth(REBUY_TEXT_DEPTH + 0.5);

    this.switchConfirmOverlay = this.add
      .rectangle(CENTER_X, CENTER_Y, VIEW_WIDTH, VIEW_HEIGHT, OVERLAY_COLOR, 0.62)
      .setDepth(SWITCH_CONFIRM_OVERLAY_DEPTH)
      .setVisible(false);
    this.switchConfirmOverlay.setInteractive({ useHandCursor: false });
    this.switchConfirmOverlay.on("pointerdown", () => {});

    this.switchConfirmPanel = this.add
      .rectangle(CENTER_X, CENTER_Y, SWITCH_CONFIRM_PANEL_WIDTH, SWITCH_CONFIRM_PANEL_HEIGHT, REBUY_PANEL_COLOR, REBUY_PANEL_ALPHA)
      .setDepth(SWITCH_CONFIRM_PANEL_DEPTH)
      .setVisible(false);
    this.switchConfirmPanel.setInteractive({ useHandCursor: false });
    this.switchConfirmPanel.on("pointerdown", () => {});

    this.switchConfirmTitle = this.add
      .text(CENTER_X, SWITCH_CONFIRM_TITLE_Y, "轉桌確認", {
        fontSize: "34px",
        color: REBUY_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.switchConfirmMessage = this.add
      .text(CENTER_X, SWITCH_CONFIRM_MESSAGE_Y, "本手已投入籌碼，轉桌會先棄牌並離開牌桌。是否繼續？", {
        fontSize: "25px",
        color: REBUY_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        align: "center",
        wordWrap: { width: 500 },
        ...PANEL_TEXT_OUTLINE_STYLE,
      })
      .setDepth(SWITCH_CONFIRM_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.switchConfirmYes = createRectButton(this, {
      x: SWITCH_CONFIRM_CONFIRM_X,
      y: SWITCH_CONFIRM_BUTTON_Y,
      width: SWITCH_CONFIRM_BUTTON_WIDTH,
      height: SWITCH_CONFIRM_BUTTON_HEIGHT,
      label: "同意轉桌",
      color: REBUY_CONFIRM_COLOR,
      labelStyle: REBUY_BUTTON_TEXT_STYLE,
      onClick: () => this.confirmPendingSwitchRoom(),
      visible: false,
    });
    this.switchConfirmYes.bg.setDepth(SWITCH_CONFIRM_TEXT_DEPTH + 0.4);
    this.switchConfirmYes.text.setDepth(SWITCH_CONFIRM_TEXT_DEPTH + 0.5);

    this.switchConfirmNo = createRectButton(this, {
      x: SWITCH_CONFIRM_CANCEL_X,
      y: SWITCH_CONFIRM_BUTTON_Y,
      width: SWITCH_CONFIRM_BUTTON_WIDTH,
      height: SWITCH_CONFIRM_BUTTON_HEIGHT,
      label: "取消",
      color: REBUY_LEAVE_COLOR,
      labelStyle: REBUY_BUTTON_TEXT_STYLE,
      onClick: () => this.closeSwitchRoomConfirm(),
      visible: false,
    });
    this.switchConfirmNo.bg.setDepth(SWITCH_CONFIRM_TEXT_DEPTH + 0.4);
    this.switchConfirmNo.text.setDepth(SWITCH_CONFIRM_TEXT_DEPTH + 0.5);

    this.handResultOverlay = this.add
      .rectangle(CENTER_X, CENTER_Y, VIEW_WIDTH, VIEW_HEIGHT, OVERLAY_COLOR, HAND_RESULT_OVERLAY_ALPHA)
      .setDepth(HAND_RESULT_OVERLAY_DEPTH)
      .setVisible(false);
    this.handResultOverlay.setInteractive({ useHandCursor: true });
    this.handResultOverlay.on("pointerdown", () => this.closeHandResultModal());

    this.handResultPanel = this.add
      .rectangle(
        HAND_RESULT_PANEL_X,
        HAND_RESULT_PANEL_Y,
        HAND_RESULT_PANEL_WIDTH,
        HAND_RESULT_PANEL_HEIGHT,
        HAND_RESULT_PANEL_COLOR,
        HAND_RESULT_PANEL_ALPHA,
      )
      .setDepth(HAND_RESULT_PANEL_DEPTH)
      .setVisible(false);

    this.handResultTitle = this.add
      .text(CENTER_X, HAND_RESULT_TITLE_Y, "本局結算", {
        fontSize: HAND_RESULT_TITLE_FONT_SIZE,
        color: HAND_RESULT_TITLE_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...HAND_RESULT_TITLE_OUTLINE_STYLE,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.handResultHint = this.add
      .text(CENTER_X, HAND_RESULT_HINT_Y, "點擊任意處關閉", {
        fontSize: HAND_RESULT_HINT_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
        fontFamily: UI_FONT_STACK,
        ...HAND_RESULT_TEXT_OUTLINE_STYLE,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.unsubscribe = this.store.subscribe((state) => {
      this.state = state;
      this.consumeVoiceCuesByAnimationHooks();
      this.renderState();
    });

    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      if (this.turnCountdownTicker) {
        this.turnCountdownTicker.remove();
        this.turnCountdownTicker = null;
      }
      this.communitySlots?.forEach((slot) => {
        this.stopCommunitySlotAnimation(slot);
      });
      this.clearRoundBetCollectFx();
      this.lastShowdownCollectHandId = null;
      this.roundBetCollectCarryAmount = 0;
      this.roundBetCollectCarryHandId = null;
      this.roundBetCollectHiddenSeats.clear();
      this.seatLastActionMap = {};
      this.seatActionMapReady = false;
      this.prevHeroTableSfxSnapshot = null;
      this.lastPlayedHeroResultHandKey = "";
      this.lastResolvedHeroSeat = null;
      this.closeRaiseActionPanel();
      this.closeSwitchRoomConfirm();
      this.closeSwitchRoomRebuyModal();
      this.closeHandResultModal();
      this.exitReplayButton?.destroy?.();
      this.replaySpeedButton?.destroy?.();
      this.switchConfirmYes?.destroy?.();
      this.switchConfirmNo?.destroy?.();
      this.input.off("pointermove", this.onRebuySliderPointerMove);
      this.input.off("pointerup", this.onRebuySliderPointerUp);
      this.input.off("pointerupoutside", this.onRebuySliderPointerUp);
      this.rebuySliderDragPointerId = null;
    });
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
    const coinBottomY = this.potCoinImage.y + this.potCoinImage.displayHeight * 0.5;
    this.potText.setPosition(this.potCoinImage.x, coinBottomY + POT_TEXT_GAP_Y).setOrigin(0.5, 0);
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
    if (!Array.isArray(this.handResultRows) || this.handResultRows.length <= 0) {
      this.handResultRows = [];
      return;
    }
    this.handResultRows.forEach((item) => {
      if (item?.bg?.destroy) {
        item.bg.destroy();
      }
      if (Array.isArray(item?.children)) {
        item.children.forEach((child) => {
          if (child?.destroy) {
            child.destroy();
          }
        });
      }
      if (item?.text?.destroy) {
        item.text.destroy();
      }
      if (item?.nameText?.destroy) {
        item.nameText.destroy();
      }
      if (item?.amountText?.destroy) {
        item.amountText.destroy();
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
    this.clearHandResultRows();
    this.handResultOverlay?.setVisible(false);
    this.handResultPanel?.setVisible(false);
    this.handResultTitle?.setVisible(false);
    this.handResultHint?.setVisible(false);
  }

  buildHandResultDisplayRows(handResult) {
    const rawRows = Array.isArray(handResult?.player_results) ? handResult.player_results : [];
    const tablePlayers = Array.isArray(this.state?.table?.players) ? this.state.table.players : [];
    const playerBySeat = new Map();
    tablePlayers.forEach((player) => {
      const seat = parseSeat(player?.seat);
      if (seat !== null) {
        playerBySeat.set(String(seat), player);
      }
    });
    const rows = rawRows.map((item, index) => {
      const seat = parseSeat(item?.seat);
      const username = formatHandResultName(item?.username, `玩家${index + 1}`);
      const contribAmount = Number(item?.contrib_amount ?? 0);
      const winAmount = Number(item?.win_amount ?? 0);
      const netRaw = Number(item?.net_amount);
      const netAmount = Number.isFinite(netRaw)
        ? netRaw
        : ((Number.isFinite(winAmount) ? winAmount : 0) - (Number.isFinite(contribAmount) ? contribAmount : 0));
      const cardFrames = extractBest5CardFrames(item?.best5 ?? item?.best5_json);
      const rankText = resolveHandRankLabel(item?.hand_rank);
      const tablePlayer = seat === null ? null : playerBySeat.get(String(seat));
      const lastAction = String(tablePlayer?.last_action || "").toLowerCase();
      const isKnownFold = lastAction.startsWith("fold") || (tablePlayer?.in_hand === false && !(Number.isFinite(winAmount) && winAmount > 0));
      const isFold = isKnownFold || (!rankText && cardFrames.length <= 0 && (!Number.isFinite(winAmount) || winAmount <= 0));
      const netColor = netAmount > 0
        ? HAND_RESULT_WIN_COLOR
        : (netAmount < 0 ? HAND_RESULT_LOSE_COLOR : HAND_RESULT_NEUTRAL_COLOR);
      const statusText = isFold ? "棄牌" : (rankText || "--");
      return {
        seat,
        username,
        contribAmount,
        winAmount,
        netAmount,
        contribText: formatAmount(contribAmount),
        winText: formatAmount(winAmount),
        netText: formatResultAmount(netAmount),
        netColor,
        statusText,
        cardFrames: isFold ? [] : cardFrames,
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
    const rows = this.buildHandResultDisplayRows(handResult);
    if (rows.length <= 0) {
      this.closeHandResultModal();
      return;
    }
    this.clearHandResultRows();
    this.isHandResultModalOpen = true;
    this.handResultOverlay?.setVisible(true);
    this.handResultPanel?.setVisible(true);
    this.handResultTitle?.setVisible(true);
    this.handResultHint?.setVisible(true);

    const heroSeat = this.resolveHeroSeatForDisplay(this.state?.table);
    const createResultText = (x, y, text, style = {}, originX = 0) => this.add
      .text(x, y, text, {
        fontSize: HAND_RESULT_ROW_FONT_SIZE,
        color: HAND_RESULT_TEXT_COLOR,
        fontFamily: UI_FONT_STACK,
        ...HAND_RESULT_TEXT_OUTLINE_STYLE,
        ...style,
      })
      .setDepth(HAND_RESULT_TEXT_DEPTH + 0.1)
      .setOrigin(originX, 0.5);

    const headerChildren = [
      createResultText(HAND_RESULT_PLAYER_X, HAND_RESULT_HEADER_Y, "玩家", {
        fontSize: HAND_RESULT_HEADER_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
      }, 0),
      createResultText(HAND_RESULT_CONTRIB_X, HAND_RESULT_HEADER_Y, "投注", {
        fontSize: HAND_RESULT_HEADER_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
      }, 1),
      createResultText(HAND_RESULT_WIN_X, HAND_RESULT_HEADER_Y, "贏分", {
        fontSize: HAND_RESULT_HEADER_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
      }, 1),
      createResultText(HAND_RESULT_NET_X, HAND_RESULT_HEADER_Y, "結果", {
        fontSize: HAND_RESULT_HEADER_FONT_SIZE,
        color: HAND_RESULT_HINT_COLOR,
        fontStyle: "bold",
      }, 1),
    ];
    this.handResultRows.push({ children: headerChildren });

    rows.forEach((row, index) => {
      const rowY = HAND_RESULT_LIST_START_Y + index * HAND_RESULT_ROW_GAP;
      const topY = rowY + HAND_RESULT_TOP_Y_OFFSET;
      const detailY = rowY + HAND_RESULT_DETAIL_Y_OFFSET;
      const isHeroRow = heroSeat !== null && row.seat !== null && row.seat === heroSeat;
      const bg = this.add
        .rectangle(
          CENTER_X,
          rowY,
          HAND_RESULT_ROW_WIDTH,
          HAND_RESULT_ROW_HEIGHT,
          isHeroRow ? HAND_RESULT_ROW_HERO_COLOR : HAND_RESULT_ROW_NORMAL_COLOR,
          isHeroRow ? 0.9 : 0.82,
        )
        .setDepth(HAND_RESULT_TEXT_DEPTH);
      const nameText = createResultText(HAND_RESULT_PLAYER_X, topY, row.username, {
        fontStyle: "bold",
      }, 0);
      const contribText = createResultText(HAND_RESULT_CONTRIB_X, topY, row.contribText, {
        fontSize: HAND_RESULT_AMOUNT_FONT_SIZE,
        fontStyle: "bold",
      }, 1);
      const winText = createResultText(HAND_RESULT_WIN_X, topY, row.winText, {
        fontSize: HAND_RESULT_AMOUNT_FONT_SIZE,
        color: Number(row.winAmount) > 0 ? HAND_RESULT_WIN_COLOR : HAND_RESULT_NEUTRAL_COLOR,
        fontStyle: "bold",
      }, 1);
      const netText = createResultText(HAND_RESULT_NET_X, topY, row.netText, {
        fontSize: HAND_RESULT_AMOUNT_FONT_SIZE,
        color: row.netColor || HAND_RESULT_NEUTRAL_COLOR,
        fontStyle: "bold",
      }, 1);

      const rankText = createResultText(HAND_RESULT_DETAIL_X, detailY, row.statusText, {
        fontSize: HAND_RESULT_DETAIL_FONT_SIZE,
        color: row.isFold ? HAND_RESULT_FOLD_COLOR : HAND_RESULT_TEXT_COLOR,
        fontStyle: "bold",
      }, 0);

      const cardImages = [];
      if (!row.isFold) {
        row.cardFrames.forEach((frame, cardIndex) => {
          if (!this.textures.get(PLAYING_CARDS_ATLAS_KEY)?.has(frame)) {
            return;
          }
          const x = HAND_RESULT_CARDS_START_X + cardIndex * (HAND_RESULT_CARD_WIDTH + HAND_RESULT_CARD_GAP);
          const cardImage = this.add
            .image(x, detailY, PLAYING_CARDS_ATLAS_KEY, frame)
            .setDisplaySize(HAND_RESULT_CARD_WIDTH, HAND_RESULT_CARD_HEIGHT)
            .setDepth(HAND_RESULT_TEXT_DEPTH + 0.12)
            .setOrigin(0, 0.5);
          cardImages.push(cardImage);
        });
      }

      this.handResultRows.push({
        bg,
        children: [nameText, contribText, winText, netText, rankText],
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

  shouldPlayRoundBetCollectAnimation(prevSnapshot, nextSnapshot, updateSource = "") {
    if (!prevSnapshot || !nextSnapshot) {
      return false;
    }
    if (!prevSnapshot.tableId || !nextSnapshot.tableId || prevSnapshot.tableId !== nextSnapshot.tableId) {
      return false;
    }
    if (!Number.isFinite(prevSnapshot.handId) || !Number.isFinite(nextSnapshot.handId) || prevSnapshot.handId !== nextSnapshot.handId) {
      return false;
    }
    if (!isBettingRoundName(prevSnapshot.round)) {
      return false;
    }
    // 收籌碼動畫只根據當下桌上可見下注（table.bets），不使用累積值，避免出現「桌上無籌碼仍飛」。
    const prevVisibleBets = prevSnapshot?.bets || {};
    const prevBetTotal = sumRoundBetsFromMap(prevVisibleBets);
    if (prevBetTotal <= 0) {
      return false;
    }
    const prevRound = String(prevSnapshot.round || "");
    const nextRound = String(nextSnapshot.round || "");
    if (prevRound !== nextRound) {
      return true;
    }

    // 河牌進攤牌前，後端可能用同一街的 table_state 先把 bets 清成 0；這也要播收籌碼。
    // 但 betting_start 的清零代表新下注輪初始化，前一個換街更新已經播過，避免重播。
    const nextVisibleBets = nextSnapshot?.bets || {};
    return sumRoundBetsFromMap(nextVisibleBets) <= 0 && updateSource !== "betting_start";
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
      seatView.betCoin.setVisible(false);
      seatView.betAmount.setText("").setVisible(false);
      const startX = Number(seatView.betAmount?.x ?? seatView.posX);
      const startY = Number(seatView.betAmount?.y ?? seatView.posY);
      const fxCoin = this.add
        .image(startX, startY, DEAL_CARD_ATLAS_KEY, "coin")
        .setDepth(ROUND_BET_COLLECT_COIN_DEPTH);
      const fxAmount = this.add
        .text(startX, startY, formatAmount(item.amount), {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: SEAT_NAME_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...UI_TEXT_OUTLINE_STYLE,
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
    const panelY = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y;
    const panelCenterOffset = Number.isFinite(this.raisePanelCoverCenterOffset) ? this.raisePanelCoverCenterOffset : 0;

    this.raisePanelBg.setPosition(anchorX + panelCenterOffset, panelY);
    this.raisePanelTitle.setPosition(anchorX, panelY + RAISE_PANEL_TITLE_Y_OFFSET);
    this.raisePanelAmountText.setPosition(anchorX, panelY + RAISE_PANEL_AMOUNT_Y_OFFSET);
    this.raisePanelRangeText.setPosition(anchorX, panelY + RAISE_PANEL_RANGE_Y_OFFSET);

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
    const sliderY = ACTION_ROW_Y - RAISE_PANEL_OFFSET_Y + RAISE_PANEL_SLIDER_Y_OFFSET;
    this.raisePanelSliderFill
      .setPosition(sliderStartX, sliderY)
      .setSize(fillWidth, RAISE_PANEL_SLIDER_TRACK_HEIGHT);
    this.raisePanelSliderKnob.setPosition(
      sliderStartX + RAISE_PANEL_SLIDER_TRACK_WIDTH * progress,
      sliderY,
    );

    const sliderAlpha = model.isMovable ? 1 : 0.5;
    this.raisePanelSliderTrack.setAlpha(sliderAlpha);
    this.raisePanelSliderFill.setAlpha(sliderAlpha);
    this.raisePanelSliderKnob.setAlpha(sliderAlpha);

    this.raiseQuickButtons.forEach((item) => {
      let targetValue = model.sliderMin;
      if (item.kind === "bb") {
        targetValue = model.bigBlind > 0 ? model.bigBlind * item.value : model.sliderMin;
      } else if (item.kind === "pot") {
        targetValue = model.potQuickValue;
      }
      const clamped = this.normalizeRaisePanelSelected(targetValue, model);
      const isActive = clamped === this.raiseSelectedValue;
      item.button.bg.setFillStyle(isActive ? RAISE_PANEL_QUICK_ACTIVE_COLOR : RAISE_PANEL_QUICK_COLOR, 1);
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
    this.raisePanelTitle.setVisible(true);
    this.raisePanelAmountText.setVisible(true);
    this.raisePanelRangeText.setVisible(true);
    this.raisePanelSliderTrack.setVisible(true);
    this.raisePanelSliderFill.setVisible(true);
    this.raisePanelSliderHit.setVisible(true);
    this.raisePanelSliderKnob.setVisible(true);
    this.raisePanelConfirm.setVisible(true).setEnabled(true);
    this.raiseQuickButtons.forEach((item) => item.button.setVisible(true).setEnabled(true));
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
    this.raisePanelTitle?.setVisible(false);
    this.raisePanelAmountText?.setVisible(false);
    this.raisePanelRangeText?.setVisible(false);
    this.raisePanelSliderTrack?.setVisible(false);
    this.raisePanelSliderFill?.setVisible(false);
    this.raisePanelSliderHit?.setVisible(false);
    this.raisePanelSliderKnob?.setVisible(false);
    this.raisePanelConfirm?.setVisible(false);
    this.raiseQuickButtons?.forEach((item) => item.button.setVisible(false));
    this.setRaisePanelSliderInteractive(false);
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
      button.setVisible(false);
    });

    if (this.app?.isHandReplayActive?.()) {
      this.closeRaiseActionPanel();
      return;
    }

    if (visibleActions.length <= 0) {
      this.closeRaiseActionPanel();
      return;
    }

    const widths = visibleActions.map((action) => Number(this.actionButtons[action].width || 0));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + ACTION_BUTTON_GAP * (visibleActions.length - 1);
    let cursorX = CENTER_X - totalWidth / 2;

    visibleActions.forEach((action, index) => {
      const button = this.actionButtons[action];
      const width = widths[index];
      const x = cursorX + width / 2;
      button.setPosition(x, ACTION_ROW_Y).setVisible(true);
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
      item.sweepArc.destroy();
      item.glowOuter.destroy();
      item.glowInner.destroy();
      item.avatar.destroy();
      item.roleBadge.destroy();
      item.betCoin.destroy();
      item.betAmount.destroy();
      item.turnCountdown.destroy();
      item.holeCards?.forEach((holeCard) => {
        this.stopHoleCardFlipAnimation(holeCard);
        holeCard.sprite.destroy();
      });
      item.name.destroy();
      item.chips.destroy();
      item.actionBadge.destroy();
    });
    this.seatViews = [];

    const positions = seatPositionsByCount();
    positions.forEach((pos, idx) => {
      const seatNo = seatStart + idx;
      const avatarFlipX = shouldFlipSeatAvatar(idx);
      const sweepArc = this.add
        .arc(pos.x, pos.y, TURN_SWEEP_ARC_RADIUS, 0, TURN_SWEEP_ARC_SPAN, false, TURN_GLOW_COLOR, 0)
        .setStrokeStyle(TURN_SWEEP_STROKE_WIDTH, TURN_GLOW_COLOR, TURN_SWEEP_STROKE_ALPHA)
        .setBlendMode(Phaser.BlendModes.ADD)
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
      const avatar = this.add
        .image(pos.x, pos.y, "avatar_element", "avatar_001")
        .setScale(NORMAL_AVATAR_SCALE)
        .setFlipX(avatarFlipX)
        .setDepth(SEAT_AVATAR_DEPTH)
        .setVisible(false);
      const roleBadge = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "dealer_seat")
        .setDepth(SEAT_ROLE_BADGE_DEPTH)
        .setVisible(false);
      const betCoin = this.add
        .image(pos.x, pos.y, DEAL_CARD_ATLAS_KEY, "coin")
        .setDepth(SEAT_BET_COIN_DEPTH)
        .setVisible(false);
      const betAmount = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: SEAT_NAME_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...UI_TEXT_OUTLINE_STYLE,
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
        return {
          sprite,
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
      const turnCountdown = this.add
        .text(pos.x, pos.y + TURN_COUNTDOWN_Y_OFFSET, "", {
          fontSize: TURN_COUNTDOWN_FONT_SIZE,
          color: TURN_COUNTDOWN_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...UI_TEXT_OUTLINE_STYLE,
        })
        .setOrigin(0.5)
        .setAlpha(TURN_COUNTDOWN_ALPHA)
        .setDepth(SEAT_COUNTDOWN_DEPTH)
        .setVisible(false);
      const name = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_NAME_FONT_SIZE,
          color: SEAT_NAME_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...UI_TEXT_OUTLINE_STYLE,
        })
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(1, 1)
        .setVisible(false);
      const chips = this.add
        .text(pos.x, pos.y, "", {
          fontSize: SEAT_INFO_FONT_SIZE,
          color: SEAT_INFO_COLOR,
          fontStyle: "bold",
          fontFamily: UI_FONT_STACK,
          ...SEAT_CHIPS_OUTLINE_STYLE,
        })
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(1, 0)
        .setVisible(false);
      const actionBadge = this.add
        .image(pos.x, pos.y + NORMAL_ACTION_BADGE_Y_OFFSET, DEAL_CARD_ATLAS_KEY, "brand_check")
        .setDepth(SEAT_TEXT_DEPTH)
        .setOrigin(0.5)
        .setVisible(false);

      const seatView = {
        avatar,
        roleBadge,
        betCoin,
        betAmount,
        name,
        chips,
        actionBadge,
        sweepArc,
        glowOuter,
        glowInner,
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
        isHero: false,
      };
      this.applySeatHoleCardScale(seatView);
      this.updateSeatTextLayout(seatView, false);
      this.seatViews.push(seatView);
    });

    this.seatCount = seatCount;
    this.seatStart = seatStart;
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

    seatView.name.setPosition(nameX, nameY).setOrigin(isMirrored ? 1 : 0, 1);
    seatView.chips.setPosition(infoX, infoY).setOrigin(isMirrored ? 1 : 0, 0);
    seatView.actionBadge.setPosition(seatView.posX, seatView.posY + actionBadgeYOffset).setOrigin(0.5);
    seatView.turnCountdown.setPosition(seatView.posX, seatView.posY + TURN_COUNTDOWN_Y_OFFSET);
    this.updateSeatRoleBadgeLayout(seatView, isHero);
    this.updateSeatBetLayout(seatView);
    this.updateSeatHoleCardPositions(seatView);
  }

  updateSeatRoleBadgeLayout(seatView, isHero) {
    if (!seatView?.roleBadge) {
      return;
    }
    const isMirrored = Boolean(seatView?.avatarFlipX);
    const badgeXOffset = isHero
      ? (isMirrored ? HERO_ROLE_BADGE_X_OFFSET_LEFT : HERO_ROLE_BADGE_X_OFFSET_RIGHT)
      : (isMirrored ? NORMAL_ROLE_BADGE_X_OFFSET_LEFT : NORMAL_ROLE_BADGE_X_OFFSET_RIGHT);
    const badgeYOffset = isHero ? HERO_ROLE_BADGE_Y_OFFSET : NORMAL_ROLE_BADGE_Y_OFFSET;
    seatView.roleBadge.setPosition(seatView.posX + badgeXOffset, seatView.posY + badgeYOffset);
  }

  updateSeatBetLayout(seatView) {
    if (!seatView?.betCoin || !seatView?.betAmount) {
      return;
    }
    const slotIndex = Number(seatView.slotIndex);
    const perSeat = Number.isFinite(slotIndex) ? SEAT_BET_AMOUNT_POSITIONS_6[slotIndex] : null;
    const amountX = Number(perSeat?.x ?? seatView.posX + 56);
    const amountY = Number(perSeat?.y ?? seatView.posY + 84);
    seatView.betCoin.setPosition(amountX, amountY);
    seatView.betAmount.setPosition(amountX, amountY);
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

  refreshTurnCountdownOverlay() {
    if (!Array.isArray(this.seatViews) || this.seatViews.length === 0) {
      return;
    }

    const remainSeconds = this.getCurrentRemainSeconds();
    const isWarning = remainSeconds !== null && remainSeconds <= TURN_COUNTDOWN_WARNING_SECONDS;
    const isCritical = remainSeconds !== null && remainSeconds <= TURN_COUNTDOWN_CRITICAL_SECONDS;
    const blinkOn = Math.floor(Date.now() / TURN_COUNTDOWN_WARNING_BLINK_MS) % 2 === 0;
    const pulseScale = isCritical
      ? 1 + Math.abs(Math.sin(Date.now() * TURN_COUNTDOWN_CRITICAL_PULSE_SPEED)) * (TURN_COUNTDOWN_CRITICAL_SCALE_MAX - 1)
      : 1;
    for (const seatView of this.seatViews) {
      const isActiveSeat = isSameSeat(seatView.displaySeatNo, this.currentActiveSeat);
      if (!isActiveSeat || remainSeconds === null || !seatView.avatar.visible) {
        seatView.turnCountdown.setScale(1).setVisible(false);
        continue;
      }
      if (isCritical) {
        seatView.turnCountdown
          .setColor(TURN_COUNTDOWN_WARNING_COLOR)
          .setAlpha(blinkOn ? 1 : 0.18)
          .setScale(pulseScale)
          .setText(String(remainSeconds))
          .setVisible(true);
        continue;
      }
      if (isWarning) {
        seatView.turnCountdown
          .setColor(TURN_COUNTDOWN_WARNING_COLOR)
          .setAlpha(blinkOn ? TURN_COUNTDOWN_WARNING_ALPHA : 0.22)
          .setScale(1.08)
          .setText(String(remainSeconds))
          .setVisible(true);
        continue;
      }
      seatView.turnCountdown
        .setColor(TURN_COUNTDOWN_COLOR)
        .setAlpha(TURN_COUNTDOWN_ALPHA)
        .setScale(1)
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
        .setScale(1, 1)
        .setVisible(true);
      return;
    }
    slot.frontCard.setScale(1, 1).setVisible(false);
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
    slot.frontCard.setScale(1, 1).setVisible(false);
    const targetX = COMMUNITY_CARD_X_LIST[index];
    const targetY = COMMUNITY_CARD_Y;
    const flyCard = this.add
      .image(DEAL_CARD_FROM_X, DEAL_CARD_FROM_Y, DEAL_CARD_ATLAS_KEY, DEAL_CARD_FRAME)
      .setDepth(COMMUNITY_DEAL_FLY_CARD_DEPTH)
      .setDisplaySize(COMMUNITY_CARD_WIDTH, COMMUNITY_CARD_HEIGHT)
      .setScale(1, 1);
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
              .setScale(0, 1)
              .setVisible(true);
            slot.revealTween = this.tweens.add({
              targets: slot.frontCard,
              scaleX: 1,
              duration: COMMUNITY_DEAL_FLIP_HALF_DURATION,
              ease: "Sine.Out",
              onComplete: () => {
                this.tweens.add({
                  targets: slot.frontCard,
                  scaleX: COMMUNITY_DEAL_POP_SCALE,
                  scaleY: COMMUNITY_DEAL_POP_SCALE,
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
    const targetOffsetLeft = isHeroSeat
      ? HERO_DEAL_CARD_TARGET_OFFSET_X_LEFT
      : (seatView?.avatarFlipX ? DEAL_CARD_MIRROR_TARGET_OFFSET_X_LEFT : DEAL_CARD_TARGET_OFFSET_X_LEFT);
    const targetOffsetRight = isHeroSeat
      ? HERO_DEAL_CARD_TARGET_OFFSET_X_RIGHT
      : (seatView?.avatarFlipX ? DEAL_CARD_MIRROR_TARGET_OFFSET_X_RIGHT : DEAL_CARD_TARGET_OFFSET_X_RIGHT);
    const baseOffsetX = useRight ? targetOffsetRight : targetOffsetLeft;
    const offsetX = isHeroSeat ? baseOffsetX : (seatView?.avatarFlipX ? -baseOffsetX : baseOffsetX);
    const offsetY = isHeroSeat ? HERO_DEAL_CARD_TARGET_OFFSET_Y : DEAL_CARD_TARGET_OFFSET_Y;
    return {
      x: seatView.posX + offsetX,
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
      holeCard.sprite.setScale(baseScale);
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
    return this.app?.voice?.resolveVoiceKeyByHandRank?.(bestRank) || null;
  }

  // Hook: play voice when showdown animation starts.
  onShowdownAnimationStart(cue) {
    if (!this.voiceHooks.showdown) {
      return;
    }
    const showdownKey = cue?.key;
    const rankVoiceKey = this.resolveShowdownRankVoiceKey(cue);
    if (!showdownKey) {
      if (rankVoiceKey) {
        this.app.playVoiceByKey?.(rankVoiceKey);
      }
      return;
    }
    if (!rankVoiceKey) {
      this.app.playVoiceByKey?.(showdownKey);
      return;
    }
    this.app.playVoiceByKey?.(showdownKey, 1, {
      onComplete: () => {
        this.app.playVoiceByKey?.(rankVoiceKey);
      },
    });
  }

  // Hook: play voice when award animation starts.
  onAwardAnimationStart(cue) {
    if (!this.voiceHooks.award) {
      return;
    }
    this.app.playVoiceByKey?.(cue?.key);
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
        if (holeCard.isFlipping) {
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
      const avatarScale = Number(seatView.avatar.scaleX || NORMAL_AVATAR_SCALE);
      const fxScale = avatarScale >= HERO_AVATAR_SCALE ? 1.5 : 1.12;
      const glowTargetScale = fxScale * TURN_GLOW_SCALE_TO;
      const glowInnerTargetScale = fxScale * 1.12;
      const sweepScale = avatarScale >= HERO_AVATAR_SCALE ? 1.62 : 1.2;
      seatView.turnActive = true;
      seatView.avatar.setY(seatView.posY);
      seatView.avatar.setTint(TURN_AVATAR_HIGHLIGHT_TINT);
      seatView.turnCountdown.setY(seatView.posY + TURN_COUNTDOWN_Y_OFFSET);
      seatView.sweepArc.setY(seatView.posY);
      seatView.glowOuter.setY(seatView.posY);
      seatView.glowInner.setY(seatView.posY);
      this.updateSeatRoleBadgeLayout(seatView, seatView.isHero);
      this.updateSeatHoleCardPositions(seatView);

      seatView.sweepArc
        .setVisible(true)
        .setPosition(seatView.posX, seatView.posY)
        .setScale(sweepScale)
        .setAlpha(1)
        .setAngle(0);
      seatView.glowOuter
        .setVisible(true)
        .setPosition(seatView.posX, seatView.posY)
        .setScale(fxScale)
        .setAlpha(1);
      seatView.glowInner
        .setVisible(true)
        .setPosition(seatView.posX, seatView.posY)
        .setScale(fxScale)
        .setAlpha(1);

      seatView.glowOuterTween = this.tweens.add({
        targets: seatView.glowOuter,
        scaleX: glowTargetScale,
        scaleY: glowTargetScale,
        alpha: 0.45,
        duration: TURN_GLOW_PULSE_DURATION,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });

      seatView.glowInnerTween = this.tweens.add({
        targets: seatView.glowInner,
        scaleX: glowInnerTargetScale,
        scaleY: glowInnerTargetScale,
        alpha: 0.7,
        duration: TURN_GLOW_PULSE_DURATION,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });

      seatView.sweepTween = this.tweens.add({
        targets: seatView.sweepArc,
        angle: 360,
        duration: TURN_SWEEP_ROTATE_DURATION,
        ease: "Linear",
        repeat: -1,
      });

      const jumpTargets = [seatView.avatar, seatView.turnCountdown, seatView.sweepArc, seatView.glowOuter, seatView.glowInner];
      seatView.holeCards?.forEach((holeCard) => {
        jumpTargets.push(holeCard.sprite);
      });
      seatView.jumpTween = this.tweens.add({
        targets: jumpTargets,
        y: seatView.posY - TURN_JUMP_HEIGHT,
        duration: TURN_JUMP_DURATION,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });
      return;
    }

    if (!seatView.turnActive) {
      seatView.turnCountdown.setVisible(false);
      seatView.sweepArc.setVisible(false).setAngle(0);
      seatView.glowOuter.setVisible(false);
      seatView.glowInner.setVisible(false);
      seatView.avatar.setY(seatView.posY);
      seatView.avatar.clearTint();
      seatView.turnCountdown.setY(seatView.posY + TURN_COUNTDOWN_Y_OFFSET);
      seatView.sweepArc.setY(seatView.posY);
      seatView.glowOuter.setY(seatView.posY);
      seatView.glowInner.setY(seatView.posY);
      this.updateSeatRoleBadgeLayout(seatView, seatView.isHero);
      this.updateSeatHoleCardPositions(seatView);
      return;
    }

    seatView.turnActive = false;
    if (seatView.jumpTween) {
      seatView.jumpTween.remove();
      seatView.jumpTween = null;
    }
    if (seatView.sweepTween) {
      seatView.sweepTween.remove();
      seatView.sweepTween = null;
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
    seatView.avatar.setY(seatView.posY);
    seatView.avatar.clearTint();
    seatView.turnCountdown.setVisible(false).setY(seatView.posY + TURN_COUNTDOWN_Y_OFFSET);
    seatView.sweepArc.setY(seatView.posY);
    seatView.glowOuter.setY(seatView.posY);
    seatView.glowInner.setY(seatView.posY);
    this.updateSeatRoleBadgeLayout(seatView, seatView.isHero);
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
      this.replaySpeedButton.bg?.setFillStyle?.(isReplayFast ? 0x3d6c36 : 0x2e4366, 1);
    }

    const table = this.state.table;
    const actionRequest = this.state.actionRequest;

    if (table) {
      const nextSeatCount = DEFAULT_SEAT_COUNT;
      const seatNumbers = Array.isArray(table.players)
        ? table.players.map((item) => Number(item.seat)).filter((n) => Number.isFinite(n))
        : [];
      const minSeat = seatNumbers.length > 0 ? Math.min(...seatNumbers) : DEFAULT_SEAT_START;
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
      const tableUpdateSource = String(this.state?.tableUpdateSource || "");
      const shouldPlayBetCollect = this.shouldPlayRoundBetCollectAnimation(previousRoundSnapshot, nextRoundSnapshot, tableUpdateSource);
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
      this.potText.setText(shouldShowPot ? formatAmount(displayPot) : "").setVisible(shouldShowPot);
      const coinFrame = resolvePotCoinFrame(displayPot, table.big_blind);
      if (coinFrame && this.textures.get(DEAL_CARD_ATLAS_KEY)?.has(coinFrame)) {
        this.potCoinImage.setFrame(coinFrame).setVisible(true);
      } else {
        this.potCoinImage.setVisible(false);
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
      const nextSeatActionMap = {};

      for (let index = 0; index < this.seatViews.length; index += 1) {
        const seatView = this.seatViews[index];
        const displaySeatNo = seatView.displaySeatNo;
        this.applySeatHoleCardScale(seatView);
        const player = table.players?.find((item) => Number(item.seat) === Number(displaySeatNo));

        if (!player) {
          this.updateSeatTextLayout(seatView, false);
          this.setSeatTurnEffect(seatView, false);
          seatView.name.setVisible(false).setText("");
          seatView.chips.setVisible(false).setText("");
          seatView.actionBadge.setVisible(false);
          seatView.betCoin.setVisible(false);
          seatView.betAmount.setVisible(false).setText("");
          seatView.avatar.setVisible(false);
          seatView.roleBadge.setVisible(false);
          this.hideSeatHoleCards(seatView);
          continue;
        }

        const isHero = isSameSeat(player.seat, heroSeatForDisplay);
        const avatarScale = isHero ? HERO_AVATAR_SCALE : NORMAL_AVATAR_SCALE;
        seatView.avatar.setVisible(true);
        seatView.avatar.setScale(avatarScale);
        seatView.avatar.setFlipX(Boolean(seatView.avatarFlipX));
        seatView.avatar.setFrame(this.resolveAvatarFrame(player.avatar));
        this.updateSeatTextLayout(seatView, isHero);
        this.setSeatTurnEffect(seatView, isSameSeat(player.seat, activeSeat));
        const roleFrame = this.resolveSeatRoleFrame(table, player.seat);
        if (roleFrame) {
          seatView.roleBadge.setFrame(roleFrame).setVisible(true);
        } else {
          seatView.roleBadge.setVisible(false);
        }

        seatView.name.setText(`${player.username}`);
        seatView.chips.setText(formatAmount(player.chips));
        const seatKey = String(parseSeat(player.seat) ?? "");
        const actionAt = Number(player.last_action_at);
        const baselineAt = Number(this.actionRoundBaselineAtBySeat?.[seatKey] ?? 0);
        const hasFreshAction = Number.isFinite(actionAt) ? actionAt > baselineAt : false;
        const actionForDisplay = hasFreshAction ? player.last_action : null;
        this.trackSeatActionSfx(player.seat, actionForDisplay, nextSeatActionMap);
        const actionBrandFrame = this.resolveSeatActionBrandFrame(actionForDisplay);
        seatView.name.setVisible(true);
        seatView.chips.setVisible(true);
        if (actionBrandFrame) {
          seatView.actionBadge.setFrame(actionBrandFrame).setVisible(true);
        } else {
          seatView.actionBadge.setVisible(false);
        }
        const betValue = Number(table?.bets?.[String(player.seat)] ?? 0);
        const isCollectHidden = this.roundBetCollectHiddenSeats.has(Number(player.seat));
        const hasBet = Number.isFinite(betValue) && betValue > 0;
        if (hasBet && !isCollectHidden) {
          seatView.betCoin.setVisible(true);
          seatView.betAmount.setText(formatAmount(betValue)).setVisible(true);
        } else {
          seatView.betCoin.setVisible(false);
          seatView.betAmount.setText("").setVisible(false);
        }
        const holeCount = Number(player.hole_count ?? 0);
        const isWaitingNextHand = player.in_hand === false && (!Number.isFinite(holeCount) || holeCount <= 0);
        const avatarAlpha = isWaitingNextHand
          ? WAITING_AVATAR_ALPHA
          : (player.in_hand === false ? FOLDED_AVATAR_ALPHA : ACTIVE_AVATAR_ALPHA);
        seatView.avatar.setAlpha(avatarAlpha);
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
      this.tryPlayHeroResultSfx(table);
      this.lastRoundSnapshot = nextRoundSnapshot;
      this.refreshTurnCountdownOverlay();
    } else {
      this.currentActiveSeat = null;
      this.currentTurnTimeout = null;
      this.currentTurnStartedAt = null;
      this.lastResolvedHeroSeat = null;
      this.lastRoundSnapshot = null;
      this.lastShowdownCollectHandId = null;
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
        seatView.turnCountdown.setVisible(false);
        seatView.roleBadge.setVisible(false);
        seatView.name.setVisible(false).setText("");
        seatView.chips.setVisible(false).setText("");
        seatView.actionBadge.setVisible(false);
        seatView.betCoin.setVisible(false);
        seatView.betAmount.setVisible(false).setText("");
        this.hideSeatHoleCards(seatView);
      });
      this.potText.setText("").setVisible(false);
      this.potCoinImage.setVisible(false);
      this.updatePotTextPosition();
      this.closeRaiseActionPanel();
    }

    const allowed = actionRequest?.allowed ?? [];
    this.layoutActionButtons(allowed);

    this.renderRebuyModal(this.getActiveRebuyOffer());
    const handResultVersion = Number(this.state.handResultVersion ?? 0);
    if (handResultVersion > this.lastSeenHandResultVersion) {
      this.lastSeenHandResultVersion = handResultVersion;
      this.openHandResultModal(this.state.handResult);
    } else if (!this.state.handResult && this.isHandResultModalOpen) {
      this.closeHandResultModal();
    }
  }

  getHeroTableInfo() {
    const table = this.state?.table || {};
    const heroSeat = this.resolveHeroSeatForDisplay(table);
    const heroPlayer = heroSeat === null
      ? null
      : (Array.isArray(table.players) ? table.players.find((player) => isSameSeat(player?.seat, heroSeat)) : null);
    const minBuyin = Math.max(0, Math.floor(Number(table.min_buyin ?? 0)));
    const maxBuyin = Math.max(minBuyin, Math.floor(Number(table.max_buyin ?? minBuyin)));
    const heroChipsRaw = Math.floor(Number(heroPlayer?.chips ?? 0));
    const heroChips = Number.isFinite(heroChipsRaw) ? Math.max(0, heroChipsRaw) : 0;
    return {
      table,
      heroSeat,
      heroPlayer,
      heroChips,
      minBuyin,
      maxBuyin,
    };
  }

  getHeroHandContrib(info = null) {
    const tableInfo = info || this.getHeroTableInfo();
    const heroSeat = parseSeat(tableInfo.heroSeat);
    if (heroSeat === null) {
      return 0;
    }
    const seatKey = String(heroSeat);
    const tracked = Number(this.state?.handContribBySeat?.[seatKey] ?? 0);
    const currentBet = Number(tableInfo.table?.bets?.[seatKey] ?? 0);
    const playerBet = Number(tableInfo.heroPlayer?.bet ?? 0);
    return Math.max(
      Number.isFinite(tracked) ? tracked : 0,
      Number.isFinite(currentBet) ? currentBet : 0,
      Number.isFinite(playerBet) ? playerBet : 0,
    );
  }

  isCurrentHandEndedForSwitch(info = null) {
    const tableInfo = info || this.getHeroTableInfo();
    const table = tableInfo.table || {};
    const status = String(table.status || "").toLowerCase();
    const round = String(table.round || "").toLowerCase();
    if (status === "waiting" || status === "finished" || round === "waiting") {
      return true;
    }
    if (Object.keys(this.state?.showdownRevealsBySeat || {}).length > 0) {
      return true;
    }
    const handResultHandId = Number(this.state?.handResult?.hand_id);
    const tableHandId = Number(table.hand_id);
    return Number.isFinite(handResultHandId) && Number.isFinite(tableHandId) && handResultHandId === tableHandId;
  }

  shouldConfirmSwitchRoomFold(info = null) {
    const tableInfo = info || this.getHeroTableInfo();
    if (this.isCurrentHandEndedForSwitch(tableInfo)) {
      return false;
    }
    if (!tableInfo.heroPlayer || tableInfo.heroPlayer.in_hand === false) {
      return false;
    }
    return this.getHeroHandContrib(tableInfo) > 0;
  }

  resolveSwitchRoomBuyinInfo() {
    const info = this.getHeroTableInfo();
    const fallback = info.maxBuyin > 0 ? info.maxBuyin : info.minBuyin;
    const base = info.heroChips > 0 ? info.heroChips : fallback;
    const targetBuyin = info.heroChips >= info.minBuyin
      ? info.heroChips
      : Math.max(info.minBuyin, base);
    return {
      ...info,
      targetBuyin: Math.max(0, Math.floor(Number(targetBuyin) || 0)),
      needsRebuy: info.heroChips < info.minBuyin,
    };
  }

  resolveSwitchRoomBuyin() {
    return this.resolveSwitchRoomBuyinInfo().targetBuyin;
  }

  handleSwitchRoomClick() {
    if (this.app?.isHandReplayActive?.()) {
      return;
    }
    this.closeRaiseActionPanel();
    this.closeSwitchRoomRebuyModal();
    const info = this.resolveSwitchRoomBuyinInfo();
    this.pendingSwitchRoomNeedsFold = this.shouldConfirmSwitchRoomFold(info);
    if (this.pendingSwitchRoomNeedsFold) {
      this.openSwitchRoomConfirm();
      return;
    }
    this.continueSwitchRoomAfterConfirm();
  }

  openSwitchRoomConfirm() {
    this.switchRoomConfirmVisible = true;
    this.setSwitchRoomConfirmVisible(true);
  }

  closeSwitchRoomConfirm() {
    this.switchRoomConfirmVisible = false;
    this.pendingSwitchRoomNeedsFold = false;
    this.setSwitchRoomConfirmVisible(false);
  }

  setSwitchRoomConfirmVisible(visible) {
    this.switchConfirmOverlay?.setVisible(visible);
    this.switchConfirmPanel?.setVisible(visible);
    this.switchConfirmTitle?.setVisible(visible);
    this.switchConfirmMessage?.setVisible(visible);
    this.switchConfirmYes?.setVisible?.(visible);
    this.switchConfirmNo?.setVisible?.(visible);
  }

  confirmPendingSwitchRoom() {
    this.switchRoomConfirmVisible = false;
    this.pendingSwitchRoomNeedsFold = false;
    this.setSwitchRoomConfirmVisible(false);
    this.continueSwitchRoomAfterConfirm();
  }

  continueSwitchRoomAfterConfirm() {
    const info = this.resolveSwitchRoomBuyinInfo();
    if (info.needsRebuy) {
      this.openSwitchRoomRebuyModal(info);
      return;
    }
    this.sendSwitchRoom();
  }

  openSwitchRoomRebuyModal(info = null) {
    const buyinInfo = info || this.resolveSwitchRoomBuyinInfo();
    this.rebuyPurpose = "switch";
    this.switchRoomRebuyOffer = {
      table_id: String(buyinInfo.table?.table_id ?? ""),
      current_chips: buyinInfo.heroChips,
      min_buyin: buyinInfo.minBuyin,
      max_buyin: buyinInfo.maxBuyin,
      default_buyin: Math.max(buyinInfo.minBuyin, buyinInfo.heroChips),
      purpose: "switch_room",
    };
    this.rebuyOfferSignature = "";
    this.renderRebuyModal(this.switchRoomRebuyOffer);
  }

  closeSwitchRoomRebuyModal() {
    if (!this.switchRoomRebuyOffer) {
      return;
    }
    this.switchRoomRebuyOffer = null;
    this.rebuyPurpose = "normal";
    this.rebuyOfferSignature = "";
    this.rebuyModel = null;
    this.renderRebuyModal(this.state?.rebuyOffer || null);
  }

  getActiveRebuyOffer() {
    if (this.state?.rebuyOffer) {
      this.rebuyPurpose = "normal";
      return this.state.rebuyOffer;
    }
    return this.switchRoomRebuyOffer;
  }

  getActiveRebuyPurpose(offer) {
    if (offer && offer === this.switchRoomRebuyOffer) {
      return "switch";
    }
    if (String(offer?.purpose || "") === "switch_room") {
      return "switch";
    }
    return "normal";
  }

  submitSwitchRoomRebuySelection() {
    const model = this.rebuyModel || this.buildRebuyModel(this.switchRoomRebuyOffer);
    if (!model.canAffordMin) {
      return;
    }
    const buyin = this.normalizeRebuySelectedBuyin(this.rebuySelectedBuyin, model);
    this.switchRoomRebuyOffer = null;
    this.rebuyPurpose = "normal";
    this.rebuyOfferSignature = "";
    this.sendSwitchRoom(buyin);
  }

  sendSwitchRoom(buyinRaw = null) {
    const buyin = Number(buyinRaw);
    const payload = {};
    if (Number.isFinite(buyin) && buyin > 0) {
      payload.buyin = Math.floor(buyin);
    }
    this.closeSwitchRoomConfirm();
    this.switchRoomRebuyOffer = null;
    this.rebuyPurpose = "normal";
    this.rebuyOfferSignature = "";
    this.renderRebuyModal(this.state?.rebuyOffer || null);
    this.app.sendPacket("switch_room", payload);
  }

  handleRebuyCancelButton() {
    if (this.getActiveRebuyPurpose(this.getActiveRebuyOffer()) === "switch") {
      this.closeSwitchRoomRebuyModal();
      return;
    }
    this.leaveTableByRebuy();
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

  setRebuySliderInteractive(enabled) {
    if (enabled) {
      this.rebuySliderHit.setInteractive({ useHandCursor: true });
      this.rebuySliderKnob.setInteractive({ useHandCursor: true });
      return;
    }
    this.rebuySliderDragPointerId = null;
    this.rebuySliderHit.disableInteractive();
    this.rebuySliderKnob.disableInteractive();
  }

  startRebuySliderDrag(pointer) {
    const pointerId = Number(pointer?.id);
    this.rebuySliderDragPointerId = Number.isFinite(pointerId) ? pointerId : null;
    this.handleRebuySliderPointer(pointer?.worldX ?? pointer?.x ?? REBUY_SLIDER_START_X);
  }

  handleRebuySliderDragMove(pointer) {
    if (this.rebuySliderDragPointerId === null) {
      return;
    }
    const pointerId = Number(pointer?.id);
    if (Number.isFinite(pointerId) && pointerId !== this.rebuySliderDragPointerId) {
      return;
    }
    this.handleRebuySliderPointer(pointer?.worldX ?? pointer?.x ?? REBUY_SLIDER_START_X);
  }

  stopRebuySliderDrag(pointer) {
    if (this.rebuySliderDragPointerId === null) {
      return;
    }
    const pointerId = Number(pointer?.id);
    if (Number.isFinite(pointerId) && pointerId !== this.rebuySliderDragPointerId) {
      return;
    }
    this.rebuySliderDragPointerId = null;
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
    this.rebuySliderFill.setSize(fillWidth, REBUY_SLIDER_TRACK_HEIGHT);
    this.rebuySliderKnob.setPosition(knobX, REBUY_SLIDER_Y);
    const sliderAlpha = model.isSliderMovable ? 1 : 0.5;
    this.rebuySliderTrack.setAlpha(sliderAlpha);
    this.rebuySliderFill.setAlpha(sliderAlpha);
    this.rebuySliderKnob.setAlpha(sliderAlpha);
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
    const hasRebuy = Boolean(offer);
    const purpose = this.getActiveRebuyPurpose(offer);
    const isSwitchRebuy = purpose === "switch";
    if (hasRebuy) {
      this.closeRaiseActionPanel();
    }
    this.rebuyOverlay.setVisible(hasRebuy);
    this.rebuyPanel.setVisible(hasRebuy);
    this.rebuyTitle.setVisible(hasRebuy);
    this.rebuyAmountText.setVisible(hasRebuy);
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
      this.rebuyPurpose = "normal";
      this.setRebuySliderInteractive(false);
      return;
    }

    this.rebuyPurpose = purpose;
    this.rebuyTitle.setText(isSwitchRebuy ? "轉桌補碼" : "補籌碼");
    this.rebuyConfirm.setLabel(isSwitchRebuy ? "確認轉桌" : "確認補碼");
    this.rebuyLeave.setLabel(isSwitchRebuy ? "取消" : "離開牌局");

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
        .setText(isSwitchRebuy
          ? `目前籌碼低於最低買入，請補到指定金額後轉桌\n可用資金 ${formatAmount(model.totalFunds)}`
          : `可用資金 ${formatAmount(model.totalFunds)}（拖動拉條調整補碼）`)
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
    if (action === "raise" || action === "bet") {
      this.openRaiseActionPanel(action);
      return;
    }
    this.closeRaiseActionPanel();
    this.app.sendPacket("player_action", { action });
  }

  submitRebuySelection() {
    if (this.getActiveRebuyPurpose(this.getActiveRebuyOffer()) === "switch") {
      this.submitSwitchRoomRebuySelection();
      return;
    }
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
    const currentTableId = this.store.getState?.().table?.table_id ?? null;
    this.store.beginLeaveTable?.(currentTableId);
    this.app.sendPacket("leave_room", {});
    this.app.sendPacket("enter_game", { game_id: "texas_holdem" });
  }

  resolveAvatarFrame(frameName) {
    const key = String(frameName || "avatar_001");
    const atlas = this.textures.get("avatar_element");
    if (atlas?.has(key)) {
      return key;
    }
    return "avatar_001";
  }
}


