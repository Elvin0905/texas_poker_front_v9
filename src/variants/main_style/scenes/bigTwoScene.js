import { createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const VIEW_W = 720;
const VIEW_H = 1440;
const CX = 360;
const CY = 720;

// 4 座位邏輯座標（view-index 0 = hero 永遠在底部）
const SEAT_POS = [
  { x: CX,  y: 950 },   // 0: hero bottom-center
  { x: 575, y: 320  },   // 1: top-right
  { x: CX,  y: 185  },   // 2: top-center
  { x: 145, y: 320  },   // 3: top-left
];

// 牌桌圖（與德州撲克相同）
const TABLE_FRAME_W = 743;
const TABLE_FRAME_H = 1139;
const TABLE_DISPLAY_W = Math.round(VIEW_W * 1.08);
const TABLE_DISPLAY_H = Math.round((TABLE_DISPLAY_W * TABLE_FRAME_H) / TABLE_FRAME_W);
const TABLE_X_OFFSET = 10;
const TABLE_Y = 680;

// 頭像框（與德州撲克完全相同的常數）
const PROFILE_FRAME_SCALE        = 1.72;
const PROFILE_AVATAR_INNER_RATIO = 0.75;
const PROFILE_BG_PADDING         = 6;
const PROFILE_BG_COLORS          = [0xffbd69, 0x79b8ff, 0xe599ff, 0x78ffbd, 0xff8da2, 0x8dff8d];
const AVATAR_Y_OFFSET            = -32;

// 透視縮放（越上面越小，與德州撲克相同邏輯）
const BT_NORMAL_AVATAR_SCALE = 0.68;
const BT_HERO_AVATAR_SCALE   = 0.88;
const BT_PERSPECTIVE_MIN     = 0.65;
const BT_PERSPECTIVE_Y_TOP   = 185;   // 大老二最上座位的邏輯 Y
const BT_PERSPECTIVE_Y_BOT   = 280;   // 側邊座位的邏輯 Y

function btPerspectiveScale(logicalY) {
  const t = Math.max(0, Math.min(1, (logicalY - BT_PERSPECTIVE_Y_TOP) / (BT_PERSPECTIVE_Y_BOT - BT_PERSPECTIVE_Y_TOP)));
  return BT_PERSPECTIVE_MIN + t * (BT_NORMAL_AVATAR_SCALE - BT_PERSPECTIVE_MIN);
}

// 名字牌（與德州撲克相同）
const NAMETAG_SCALE_NORMAL = 1.20;
const NAMETAG_SCALE_HERO   = 1.46;
const CHIPS_Y_GAP_NORMAL   = -10;
const CHIPS_Y_GAP_HERO     = -14;

// 對手牌背（扇形顯示）
const OPP_CARD_MAX        = 13;
const OPP_FAN_CARD_W      = 36;
const OPP_FAN_CARD_H      = 50;
const OPP_CARDS_Y_OFFSET  = 245;
const OPP_FAN_RADIUS      = 108;
const OPP_FAN_ANGLE_SPAN  = 78;  // degrees total
const OPP_FAN_BADGE_R     = 16;

// 英雄手牌
const HERO_HAND_Y      = 740;
const HERO_HAND_X_OFFSET = -15;
const HERO_CARD_W      = 84;
const HERO_CARD_H      = 118;
const HERO_CARD_GAP    = -34;
const HERO_CARD_LIFT   = 28;
const HERO_HAND_START_X = CX + HERO_HAND_X_OFFSET - ((13 * (HERO_CARD_W + HERO_CARD_GAP)) / 2) + HERO_CARD_W / 2;

// 中央出牌區
const CENTER_CARD_W  = 72;
const CENTER_CARD_H  = 101;
const CENTER_CARD_GAP = 4;
const CENTER_PLAY_Y  = 630;
const CENTER_LABEL_Y = 598;
const CENTER_BY_Y    = 750;

// 操作按鈕
const ACTION_Y       = 1400;
const PLAY_BTN_X     = 510;
const PASS_BTN_X     = 210;
const BTN_W          = 210;
const BTN_H          = 80;
const COMBO_INFO_Y   = 1348;

// 開局前提示（桌面中央）
const PRESTART_Y = 550;
const BIG_TWO_MIN_PLAYERS = 2;

// 頂部按鈕（與德州撲克相同位置）
const EXIT_X          = 625;
const EXIT_Y          = 62;
const CHANGE_TABLE_X  = 625;
const CHANGE_TABLE_Y  = 160;
const AUDIO_TOGGLE_X  = 80;
const AUDIO_TOGGLE_Y  = 72;

// 發牌動畫
const DEAL_CARD_FLY_DURATION = 260;
const DEAL_CARD_STAGGER_MS   = 40;

// 轉到呼吸圈（與德州撲克完全相同）
const TURN_GLOW_COLOR              = 0xfff1a8;
const TURN_GLOW_OUTER_RADIUS       = 76;
const TURN_GLOW_FILL_ALPHA_OUTER   = 0;
const TURN_GLOW_OUTER_ALPHA        = 0.85;
const TURN_GLOW_STROKE_WIDTH_OUTER = 12;

// 倒數計時（與德州撲克相同）
const CD_BG_RADIUS        = 18;
const CD_BG_COLOR         = 0x080e18;
const CD_BG_ALPHA         = 0.92;
const CD_RING_COLOR       = 0xd4b97a;
const CD_RING_WARNING     = 0xff5555;
const CD_RING_WIDTH       = 2.5;
const CD_FONT_SIZE        = "20px";
const CD_TEXT_COLOR       = "#ffffff";
const CD_WARNING_COLOR    = "#ff5555";
const CD_WARNING_SECONDS  = 5;
const CD_CRITICAL_SECONDS = 3;
const CD_BLINK_MS         = 180;
const CD_SFX_KEY          = "countdown_timer";
const CD_SFX_VOLUME       = 0.4;

// 結算 Modal
const MODAL_OVL_D  = 200;
const MODAL_PNL_D  = 201;
const MODAL_TXT_D  = 202;
const MODAL_W      = 580;
const MODAL_H      = 540;
const MODAL_CR     = 18;

function normalizeCard(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(/^([2-9]|10|[tTjJqQkKaA])([cChHsSdD])$/);
  if (!m) return null;
  const r = m[1].toUpperCase() === "10" ? "T" : m[1].toUpperCase();
  return `${r}${m[2].toLowerCase()}`;
}

function fmt(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}

function avatarFrame(av) {
  const n = Number(String(av || "").replace(/[^0-9]/g, "")) || 1;
  return `avatar_${Math.max(1, Math.min(20, n))}`;
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
    this.isResultOpen = false;
    this.lastHandResultVer  = 0;
    this.lastHeroCardsVer   = 0;
    this.lastLastPlayVer    = 0;
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
  }

  create() {
    this.useResponsiveLayout = true;
    this.app   = window.__APP__;
    this.store = this.app?.store;
    const s0 = this.store?.getState?.() || {};
    this.lastHandResultVer = Number(s0.bigTwoHandResultVersion ?? 0);
    this.lastHeroCardsVer  = Number(s0.bigTwoHeroCardsVersion  ?? 0);
    this.lastLastPlayVer   = Number(s0.bigTwoLastPlayVersion   ?? 0);

    this._buildBg();
    this._buildSeats();
    this._buildCenterPlay();
    this._buildHeroHand();
    this._buildActionBtns();
    this._buildExitBtn();
    this._buildPreStartUI();
    this._buildModal();

    this.countdownSfxSound = this.cache.audio.exists(CD_SFX_KEY)
      ? this.sound.add(CD_SFX_KEY) : null;

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
      this.nextHandCountdownEnd = 0;
      this._dealRunId++;   // invalidate any pending animation callbacks
      this.game.events.off("hidden", this._onGameHidden, this);
      this._centerFlyImages?.forEach(f => f.destroy());
      this._centerFlyImages = [];
    });
  }

  // ─── BUILD ────────────────────────────────────────────────────────

  _buildBg() {
    this.bgImg = this.add
      .image(CX, CY, "game_table", "bg")
      .setDisplaySize(VIEW_W, VIEW_H)
      .setDepth(-30);

    this.tableImg = this.add
      .image(CX, TABLE_Y, "game_table", "tbale")
      .setDisplaySize(TABLE_DISPLAY_W, TABLE_DISPLAY_H)
      .setDepth(-20);
    this.tableImg.postFX?.addShadow(2, 8, 0.005, 2.2, 0x000000, 6, 0.8);
  }

  _buildSeats() {
    this.seatViews = [];
    for (let vi = 0; vi < 4; vi++) {
      const pos   = SEAT_POS[vi];
      const isHero = vi === 0;

      const glowOuter = this.add
        .circle(pos.x, pos.y + AVATAR_Y_OFFSET, TURN_GLOW_OUTER_RADIUS, TURN_GLOW_COLOR, TURN_GLOW_FILL_ALPHA_OUTER)
        .setStrokeStyle(TURN_GLOW_STROKE_WIDTH_OUTER, TURN_GLOW_COLOR, TURN_GLOW_OUTER_ALPHA)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(17)
        .setVisible(false);

      // 頭像背景色圓（depth 18 = SEAT_PROFILE_BG_DEPTH，蓋在 glow 上）
      const frameImg = this.add
        .image(pos.x, pos.y + AVATAR_Y_OFFSET, "game_table", "profile_frame_off")
        .setScale(PROFILE_FRAME_SCALE)
        .setDepth(19)
        .setVisible(false);

      const profileBgColor  = PROFILE_BG_COLORS[Math.floor(Math.random() * PROFILE_BG_COLORS.length)];
      const profileBgRadius = Math.min(frameImg.displayWidth, frameImg.displayHeight) * 0.44 - PROFILE_BG_PADDING;
      const avatarBg = this.add
        .graphics({ x: pos.x, y: pos.y + AVATAR_Y_OFFSET })
        .fillStyle(profileBgColor, 1)
        .fillCircle(0, 0, profileBgRadius)
        .setDepth(18)
        .setVisible(false);

      // 頭像圖（depth 21 = SEAT_AVATAR_DEPTH）
      const avatarBaseSize = Math.min(frameImg.displayWidth, frameImg.displayHeight) * PROFILE_AVATAR_INNER_RATIO;
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
          shadow: { offsetX: 1, offsetY: 2, color: "#000000", blur: 4, fill: true },
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
      let cardCountBadgeBg = null;
      if (!isHero) {
        for (let c = 0; c < OPP_CARD_MAX; c++) {
          const cb = this.add
            .image(0, pos.y + OPP_CARDS_Y_OFFSET, "game_table", "card_back")
            .setDisplaySize(OPP_FAN_CARD_W, OPP_FAN_CARD_H)
            .setDepth(20 + c * 0.01)
            .setVisible(false);
          cardBacks.push(cb);
        }
        cardCountBadgeBg = this.add
          .arc(pos.x, pos.y, OPP_FAN_BADGE_R, 0, 360, false, 0x0d1b2a, 0.92)
          .setStrokeStyle(1.5, 0xffcc44, 1)
          .setDepth(25.5)
          .setVisible(false);
      }

      // 倒數計時（與德州撲克相同：圓形背景 + 金框 + 白字）
      const cdBg = this.add
        .arc(pos.x, pos.y, CD_BG_RADIUS, 0, 360, false, CD_BG_COLOR, CD_BG_ALPHA)
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
      const emptySeatRadius   = Math.min(frameImg.displayWidth, frameImg.displayHeight) * 0.32;
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
          fontSize: "34px", color: "#ffffff", fontStyle: "bold",
          fontFamily: "sans-serif", stroke: "#000000", strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(21)
        .setVisible(false);
      const sitPromptLabel = this.add
        .text(pos.x, pos.y + AVATAR_Y_OFFSET + emptySeatRadius + 12, "可入座", {
          fontSize: "18px", color: "#ffffff", fontStyle: "bold",
          fontFamily: "sans-serif", stroke: "#000000", strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(23)
        .setVisible(false);

      this.seatViews.push({
        posX: pos.x, posY: pos.y,
        slotIndex: vi,
        isHero, displaySeat: null,
        avatarBg, avatarImg, avatarBaseSize,
        frameImg, glowOuter,
        nametagGlow, nametagImg, nameText, chipsText,
        cardCountBadge, cardCountBadgeBg, cardBacks, cdBg, cdText,
        sitPromptBg, sitPromptBgRadius, sitPromptCircle, sitPromptPlus, sitPromptLabel,
        turnActive: false, glowOuterTween: null, nametagBreathTween: null,
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
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);

    this.centerPlayImages = [];
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
  }

  _buildActionBtns() {
    this.playBtn = createGradientButton(this, {
      x: PLAY_BTN_X, y: ACTION_Y,
      width: BTN_W, height: BTN_H, cornerRadius: 14,
      topColor: 0xf5a623, bottomColor: 0x8a3800, borderColor: 0xffd060,
      label: "出牌",
      labelStyle: { fontSize: "32px", color: "#ffffff", fontStyle: "bold" },
      depth: 60, onClick: () => this._onPlay(), visible: false,
    });
    this.passBtn = createGradientButton(this, {
      x: PASS_BTN_X, y: ACTION_Y,
      width: BTN_W, height: BTN_H, cornerRadius: 14,
      topColor: 0x3a6090, bottomColor: 0x0e2035, borderColor: 0x55aaee,
      label: "過",
      labelStyle: { fontSize: "32px", color: "#ffffff", fontStyle: "bold" },
      depth: 60, onClick: () => this._onPass(), visible: false,
    });
    // 選牌提示（顯示已選張數 / 牌型）
    this.comboInfoText = this.add
      .text(CX, COMBO_INFO_Y, "", {
        fontFamily: "sans-serif", fontSize: "24px",
        color: "#ffe88a", fontStyle: "bold",
        stroke: "#000000", strokeThickness: 2,
      })
      .setOrigin(0.5).setDepth(61).setVisible(false);
  }

  _buildExitBtn() {
    this.exitBtn = this.add
      .image(EXIT_X, EXIT_Y, "game_table", "btn_exit_table")
      .setDisplaySize(190, 76)
      .setDepth(70)
      .setInteractive({ useHandCursor: true });
    this.exitBtn.on("pointerdown", () => {
      this._playUiClick();
      this.app?.sendPacket?.("leave_room", {});
    });

    this.changeTableBtn = this.add
      .image(CHANGE_TABLE_X, CHANGE_TABLE_Y, "game_table", "btn_change_table")
      .setDisplaySize(190, 76)
      .setDepth(70)
      .setInteractive({ useHandCursor: true });
    this.changeTableBtn.on("pointerdown", () => {
      this._playUiClick();
      this.store?.beginSwitchRoom?.();
      this.app?.sendPacket?.("switch_room", {});
    });
  }

  _buildModal() {
    this.modalOverlay = this.add
      .rectangle(CX, CY, VIEW_W * 2, VIEW_H * 2, 0x000000, 0.72)
      .setDepth(MODAL_OVL_D).setVisible(false)
      .setInteractive({ useHandCursor: false });

    this.modalPanelGfx   = this.add.graphics().setDepth(MODAL_PNL_D).setVisible(false);
    this.modalBorderGfx  = this.add.graphics().setDepth(MODAL_PNL_D + 0.5).setVisible(false);

    this.modalTitleLabel = this.add
      .image(CX, CY - MODAL_H / 2, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(280, 98)
      .setDepth(MODAL_TXT_D - 0.5).setVisible(false);

    this.modalTitle = this.add
      .text(CX, CY - MODAL_H / 2 + 8, "本局結果", {
        fontFamily: "sans-serif", fontSize: "30px",
        fontStyle: "bold", color: "#f0c040", stroke: "#000000", strokeThickness: 1,
      })
      .setOrigin(0.5).setDepth(MODAL_TXT_D).setVisible(false);
    applyGoldTitleGradient(this.modalTitle);

    this.modalBody = this.add
      .text(CX, CY - 20, "", {
        fontFamily: "sans-serif", fontSize: "26px",
        color: "#ffffff", align: "center", lineSpacing: 10,
        wordWrap: { width: MODAL_W - 60 },
      })
      .setOrigin(0.5).setDepth(MODAL_TXT_D).setVisible(false);

    this.modalHint = this.add
      .text(CX, CY + MODAL_H / 2 - 88, "6秒後自動關閉", {
        fontFamily: "sans-serif", fontSize: "20px", color: "#c8a060",
      })
      .setOrigin(0.5).setDepth(MODAL_TXT_D).setVisible(false);

    this.modalConfirmBtn = createGradientButton(this, {
      x: CX, y: CY + MODAL_H / 2 - 46,
      width: 200, height: 62, cornerRadius: 10,
      topColor: 0xf09218, bottomColor: 0x7a3200, borderColor: 0xffaa20,
      label: "確定", labelStyle: { fontSize: "28px", color: "#ffffff" },
      depth: MODAL_TXT_D, onClick: () => this._closeModal(), visible: false,
    });
  }

  // ─── LAYOUT ───────────────────────────────────────────────────────

  applyLayout() {
    const cx = layout.centerX;
    const cy = layout.centerY;
    const sx = layout.width  / VIEW_W;
    const sy = layout.height / VIEW_H;
    const s  = Math.min(sx, sy);
    const ox = cx - (VIEW_W / 2) * s;
    const oy = cy - (VIEW_H / 2) * s;
    this._s  = s;
    this._ox = ox;
    this._oy = oy;

    const sc = (lx, ly) => ({ x: ox + lx * s, y: oy + ly * s });

    // 背景 + 桌面
    this.bgImg?.setPosition(cx, cy).setDisplaySize(layout.width, layout.height);
    if (this.tableImg) {
      this.tableImg.setPosition(CX + TABLE_X_OFFSET, TABLE_Y)
        .setDisplaySize(TABLE_DISPLAY_W, TABLE_DISPLAY_H);
    }

    // 座位（與德州撲克相同：先更新 posX/posY，再呼叫 updateSeatTextLayout）
    this.seatViews.forEach((sv, vi) => {
      const lp  = SEAT_POS[vi];
      const sp  = sc(lp.x, lp.y);
      sv.posX   = sp.x;
      sv.posY   = sp.y;
      sv.isHero = vi === 0;
      this.updateSeatTextLayout(sv, s);

      const pivot = sc(lp.x, lp.y + OPP_CARDS_Y_OFFSET);
      const n = sv.cardBacks.length;
      const halfSpanRad = Phaser.Math.DegToRad(OPP_FAN_ANGLE_SPAN / 2);
      sv.cardBacks.forEach((cb, c) => {
        const angleDeg = n > 1 ? -OPP_FAN_ANGLE_SPAN / 2 + c * OPP_FAN_ANGLE_SPAN / (n - 1) : 0;
        const ar = Phaser.Math.DegToRad(angleDeg);
        cb.setPosition(
          pivot.x + OPP_FAN_RADIUS * s * Math.sin(ar),
          pivot.y - OPP_FAN_RADIUS * s * Math.cos(ar),
        ).setDisplaySize(OPP_FAN_CARD_W * s, OPP_FAN_CARD_H * s).setRotation(ar);
      });
      // 計數徽章：扇形右下角
      const badgeX = pivot.x + (OPP_FAN_RADIUS * Math.sin(halfSpanRad) + OPP_FAN_BADGE_R + 3) * s;
      const badgeY = pivot.y - (OPP_FAN_RADIUS * Math.cos(halfSpanRad) - OPP_FAN_BADGE_R) * s;
      sv.cardCountBadgeBg?.setPosition(badgeX, badgeY).setScale(s);
      sv.cardCountBadge.setPosition(badgeX, badgeY).setFontSize(`${Math.round(16 * s)}px`);
    });

    // 英雄手牌
    this.heroCardImages.forEach((img, i) => {
      const lx = HERO_HAND_START_X + i * (HERO_CARD_W + HERO_CARD_GAP);
      const sel = this.selectedIndices.has(i);
      const sp  = sc(lx, HERO_HAND_Y - (sel ? HERO_CARD_LIFT : 0));
      img.setPosition(sp.x, sp.y).setDisplaySize(HERO_CARD_W * s, HERO_CARD_H * s);
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
    this.comboInfoText?.setPosition(cip.x, cip.y).setFontSize(`${Math.round(24 * s)}px`);

    // 頂部按鈕
    const ep = sc(EXIT_X, EXIT_Y);
    this.exitBtn?.setPosition(ep.x, ep.y);
    const ctp = sc(CHANGE_TABLE_X, CHANGE_TABLE_Y);
    this.changeTableBtn?.setPosition(ctp.x, ctp.y);

    // 開局前提示
    const psp = sc(CX, PRESTART_Y);
    this.preStartText?.setPosition(psp.x, psp.y);

    // 結算 Modal
    this.modalOverlay?.setPosition(cx, cy).setSize(layout.width * 2, layout.height * 2);
    this._drawModal(cx, cy, s);
    const mt = oy + (CY - MODAL_H / 2) * s;
    this.modalTitleLabel?.setPosition(cx, mt).setDisplaySize(280 * s, 98 * s);
    this.modalTitle?.setPosition(cx, mt + 8 * s);
    this.modalBody?.setPosition(cx, oy + (CY - 20) * s);
    this.modalHint?.setPosition(cx, oy + (CY + MODAL_H / 2 - 88) * s);
    this.modalConfirmBtn?.setPosition?.(cx, oy + (CY + MODAL_H / 2 - 46) * s);
  }

  // 與德州撲克的 updateSeatTextLayout 相同邏輯，加入 s 縮放因子
  updateSeatTextLayout(sv, s) {
    const isHero        = sv.isHero;
    const logicalY      = SEAT_POS[sv.slotIndex].y;
    const avatarScale   = isHero ? BT_HERO_AVATAR_SCALE : btPerspectiveScale(logicalY);
    const frameScale    = 1.437 * avatarScale / BT_NORMAL_AVATAR_SCALE;
    const bgScale       = 0.83  * avatarScale / BT_NORMAL_AVATAR_SCALE;
    const nametagScale  = isHero ? NAMETAG_SCALE_HERO : NAMETAG_SCALE_NORMAL;
    const nameFontScale = isHero ? 0.80 : 0.65;
    const nameFontSize  = Math.round(32 * nameFontScale * s);
    const chipsFontSize = Math.round((isHero ? 35 : 30) * s);
    const chipsYGap     = isHero ? CHIPS_Y_GAP_HERO : CHIPS_Y_GAP_NORMAL;

    sv.frameImg
      .setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
      .setScale(frameScale * s);
    sv.avatarBg
      .setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
      .setScale(bgScale * s);
    const avatarInnerRatio = isHero ? PROFILE_AVATAR_INNER_RATIO : PROFILE_AVATAR_INNER_RATIO * 0.92;
    const avatarSize = Math.min(sv.frameImg.displayWidth, sv.frameImg.displayHeight) * avatarInnerRatio;
    sv.avatarImg
      .setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s)
      .setDisplaySize(avatarSize, avatarSize);
    sv.glowOuter.setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * s);

    // 倒數計時定位（與德州撲克相同）
    const cdFxScale = isHero ? 1.32 : 1.12;
    const cdEdgeR   = Math.round(TURN_GLOW_OUTER_RADIUS * cdFxScale * 0.68) * s;
    const cdX = sv.posX + cdEdgeR;
    const cdY = sv.posY + AVATAR_Y_OFFSET * s + cdEdgeR;
    sv.cdBg.setPosition(cdX, cdY).setScale(s);
    sv.cdText.setPosition(cdX, cdY).setFontSize(`${Math.round(20 * s)}px`);

    // 空座位提示定位
    const avatarCY = sv.posY + AVATAR_Y_OFFSET * s;
    sv.sitPromptBg.setPosition(sv.posX, avatarCY).setScale(s);
    sv.sitPromptCircle.setPosition(sv.posX, avatarCY).setScale(s);
    sv.sitPromptPlus.setPosition(sv.posX, avatarCY).setFontSize(`${Math.round(34 * s)}px`);
    const sitLabelY = avatarCY + (sv.sitPromptBgRadius / 0.78) * s + 12 * s;
    sv.sitPromptLabel.setPosition(sv.posX, sitLabelY).setFontSize(`${Math.round(18 * s)}px`);

    const frameHalfH     = sv.frameImg.displayHeight * 0.5;
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
      const frameHalfW = (sv.frameImg?.displayWidth || TURN_GLOW_OUTER_RADIUS * 2) / 2;
      const fxScale    = (frameHalfW / TURN_GLOW_OUTER_RADIUS) * 0.75;
      sv.turnActive    = true;
      sv.glowOuter
        .setVisible(true)
        .setPosition(sv.posX, sv.posY + AVATAR_Y_OFFSET * (this._s ?? 1))
        .setScale(fxScale)
        .setAlpha(1);
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
    const pw = MODAL_W * s, ph = MODAL_H * s, cr = MODAL_CR * s;
    const l = cx - pw / 2, t = cy - ph / 2;
    this.modalPanelGfx.clear();
    this.modalPanelGfx.fillGradientStyle(0x5a0c14, 0x5a0c14, 0x140204, 0x140204, 0.97, 0.97, 0.97, 0.97);
    this.modalPanelGfx.fillRoundedRect(l, t, pw, ph, cr);
    this.modalBorderGfx.clear();
    drawEnhancedBorder(this.modalBorderGfx, l, t, pw, ph, cr);
  }

  _layoutCenterCards() {
    const s = this._s ?? 1;
    const ox = this._ox ?? 0;
    const oy = this._oy ?? 0;
    const cards = this.state?.bigTwoLastPlay?.cards ?? [];
    const n = cards.length;
    if (n === 0 || this.centerPlayImages.length !== n) return;
    const totalW = n * (CENTER_CARD_W + CENTER_CARD_GAP) - CENTER_CARD_GAP;
    const startX = CX - totalW / 2 + CENTER_CARD_W / 2;
    this.centerPlayImages.forEach((img, i) => {
      img.setPosition(ox + (startX + i * (CENTER_CARD_W + CENTER_CARD_GAP)) * s, oy + CENTER_PLAY_Y * s)
         .setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s);
    });
  }

  _buildPreStartUI() {
    this.preStartText = this.add
      .text(CX, PRESTART_Y, "", {
        fontFamily: "sans-serif", fontSize: "28px",
        color: "#ffffff", fontStyle: "bold",
        stroke: "#000000", strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 6, fill: true },
      })
      .setOrigin(0.5).setDepth(30).setVisible(false);
  }

  _refreshJoinWaitText() {}   // kept for call-site compatibility

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
    const seatedCount = Array.isArray(this.state?.table?.players) ? this.state.table.players.length : 0;
    if (seatedCount < BIG_TWO_MIN_PLAYERS) {
      this.nextHandCountdownEnd = 0;
      this.preStartText?.setText("等待足數玩家開局").setVisible(true);
      return;
    }
    const secsLeft = this.nextHandCountdownEnd > 0
      ? Math.max(0, Math.ceil((this.nextHandCountdownEnd - Date.now()) / 1000))
      : 0;
    if (secsLeft > 0) {
      this.preStartText?.setText(`下一局  ${secsLeft} 秒`).setVisible(true);
    } else {
      this.nextHandCountdownEnd = 0;
      this.preStartText?.setText("等待其他玩家確認中").setVisible(true);
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────

  renderState() {
    if (!this.state) return;
    this._renderSeats();
    this._renderActionUI();
    this._renderCountdown();
    this._checkHeroCards();
    this._checkLastPlay();
    this._checkHandResult();
    this._refreshJoinWaitText();
    this._refreshNextHandCountdown();
  }

  _renderSeats() {
    const table   = this.state?.table;
    const heroSeat = Number(this.state?.heroSeat ?? -1);
    const players  = Array.isArray(table?.players) ? table.players : [];
    const turnSeat = Number(table?.current_turn_seat ?? -1);

    this.seatViews.forEach((sv, vi) => {
      const seat   = this._seatForView(vi, heroSeat, players);
      sv.displaySeat = seat;
      const player = seat !== null ? players.find(p => Number(p.seat) === seat) : null;

      if (!player) {
        this.setSeatTurnEffect(sv, false);
        if (sv.nametagBreathTween) { sv.nametagBreathTween.remove(); sv.nametagBreathTween = null; }
        [sv.avatarBg, sv.avatarImg, sv.frameImg, sv.nametagGlow, sv.nametagImg,
         sv.nameText, sv.chipsText, sv.cardCountBadge].forEach(o => o?.setVisible(false));
        sv.nametagGlow?.setAlpha(0);
        sv.cardBacks.forEach(c => c.setVisible(false));
        sv.cardCountBadgeBg?.setVisible(false);
        sv.cdBg?.setVisible(false);
        sv.cdText?.setVisible(false);
        sv.sitPromptBg.setVisible(true);
        sv.sitPromptCircle.setVisible(true);
        sv.sitPromptPlus.setVisible(true);
        sv.sitPromptLabel.setVisible(true);
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

      // 轉到：頭像呼吸圈 + 名字牌發光（與德州撲克相同）
      const isTurn = seat === turnSeat;
      this.setSeatTurnEffect(sv, isTurn);
      if (isTurn) {
        sv.nametagGlow.setVisible(true);
        if (!sv.nametagBreathTween) {
          sv.nametagBreathTween = this.tweens.add({
            targets: sv.nametagGlow,
            alpha: 0.45,
            duration: 900,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        if (sv.nametagBreathTween) { sv.nametagBreathTween.remove(); sv.nametagBreathTween = null; }
        sv.nametagGlow.setVisible(false).setAlpha(0);
      }

      // 名字牌
      const rawName = String(player.username ?? player.name ?? player.nickname ?? "");
      const name = rawName.length > 4 ? rawName.slice(0, 4) : (rawName || `玩家${seat}`);
      sv.nametagImg.setVisible(true);
      sv.nameText.setText(name).setVisible(true);
      // 先還原 base 字體，再做 overflow / CJK 調整（與德州撲克相同）
      const _s = this._s ?? 1;
      const _basePx = Math.round(32 * (sv.isHero ? 0.80 : 0.65) * _s);
      sv.nameText.setFontSize(`${_basePx}px`);
      const _ntW = sv.nametagImg.displayWidth;
      const _maxW = _ntW * 0.82;
      if (_maxW > 0 && sv.nameText.width > _maxW) {
        const _curPx = parseInt(sv.nameText.style.fontSize, 10);
        sv.nameText.setFontSize(`${Math.max(12, Math.floor(_curPx * _maxW / sv.nameText.width))}px`);
      }
      if (/[一-鿿㐀-䶿]/.test(sv.nameText.text)) {
        sv.nameText.setFontSize(`${Math.max(12, parseInt(sv.nameText.style.fontSize, 10) - 4)}px`);
      }
      sv.chipsText.setText(fmt(player.chips ?? 0)).setVisible(true);

      // 對手牌背（扇形）+ 剩餘牌數徽章
      if (!sv.isHero) {
        const rem = Number(player.remaining_count ?? player.hole_count ?? 0);
        const heroHasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;
        // newDealPending：版本已更新但 _checkHeroCards 還未處理（動畫即將開始）
        const newDealPending = Number(this.state?.bigTwoHeroCardsVersion ?? 0) > this.lastHeroCardsVer;
        if (this._dealAnimating || newDealPending) {
          // 動畫控制可見性，跳過
        } else if (heroHasCards) {
          const show = rem > 0 ? Math.min(rem, OPP_CARD_MAX) : OPP_CARD_MAX;
          sv.cardBacks.forEach((cb, c) => cb.setVisible(c < show));
        } else {
          sv.cardBacks.forEach(cb => cb.setVisible(false));
        }
        if (rem > 0 && heroHasCards && !newDealPending) {
          sv.cardCountBadge.setText(`${rem}`).setVisible(true);
          sv.cardCountBadgeBg?.setVisible(true);
        } else {
          sv.cardCountBadge.setVisible(false);
          sv.cardCountBadgeBg?.setVisible(false);
        }
      }
    });
  }

  _seatForView(vi, heroSeat, players) {
    if (players.length === 0) return null;
    if (vi >= players.length) return null;
    const seats = players.map(p => Number(p.seat)).sort((a, b) => a - b);
    if (heroSeat < 0 || !seats.includes(heroSeat)) return seats[vi] ?? null;
    const hi = seats.indexOf(heroSeat);
    return seats[(hi + vi) % seats.length] ?? null;
  }

  _renderActionUI() {
    const ar       = this.state?.actionRequest;
    const heroSeat = Number(this.state?.heroSeat ?? -1);
    const turnSeat = Number(this.state?.table?.current_turn_seat ?? -1);
    const isMyTurn = heroSeat >= 0 && heroSeat === turnSeat;
    const hasCards = (this.state?.bigTwoHeroCards?.length ?? 0) > 0;

    let canPlay, canPass;
    if (ar && Array.isArray(ar.allowed) && ar.allowed.length > 0) {
      // 服务器明确告知可执行操作
      canPlay = ar.allowed.some(a => a === "play_cards" || a === "play");
      canPass = ar.allowed.includes("pass");
    } else if (isMyTurn && hasCards) {
      // 服务器只发 turn 包没发 action_request，默认两个按钮都显示
      canPlay = true;
      canPass = true;
    } else {
      canPlay = false;
      canPass = false;
    }

    const hasSel = this.selectedIndices.size > 0;
    this.playBtn?.setVisible(canPlay);
    this.passBtn?.setVisible(canPass);
    if (canPlay) this.playBtn?.setEnabled?.(hasSel);

    // 选牌提示文字
    if (canPlay) {
      if (hasSel) {
        const combo = this._detectCombo(this.selectedIndices);
        this.comboInfoText?.setText(combo).setVisible(true);
      } else {
        this.comboInfoText?.setText("請選牌出牌").setVisible(true);
      }
    } else {
      this.comboInfoText?.setVisible(false);
    }

    if (!canPlay && !canPass) {
      this.selectedIndices.clear();
      this._refreshCardVisuals();
    }
  }

  _playUiClick() {
    const vol = Math.max(0, Math.min(1, 0.7 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)));
    if (vol <= 0 || !this.cache.audio.exists("ui_click")) return;
    const sfx = this.sound.add("ui_click");
    sfx.setVolume(vol);
    sfx.play();
    sfx.once("complete", () => sfx.destroy());
  }

  playCountdownSfx() {
    if (!this.countdownSfxSound) return;
    const vol = Math.max(0, Math.min(1, CD_SFX_VOLUME * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)));
    if (vol <= 0) return;
    try {
      if (this.countdownSfxSound.isPlaying) this.countdownSfxSound.stop();
      this.countdownSfxSound.setVolume(vol);
      this.countdownSfxSound.play();
    } catch (_) {}
  }

  stopCountdownSfx() {
    try { if (this.countdownSfxSound?.isPlaying) this.countdownSfxSound.stop(); } catch (_) {}
  }

  _renderCountdown() {
    const table    = this.state?.table;
    const turnSeat = Number(table?.current_turn_seat ?? -1);
    const timeout  = Number(table?.current_turn_timeout ?? 0);
    const startAt  = Number(table?.current_turn_started_at ?? 0);

    const rem = (timeout > 0 && startAt > 0)
      ? Math.max(0, timeout - (Date.now() - startAt) / 1000)
      : null;
    const remainSeconds = rem !== null ? Math.ceil(rem) : null;
    const isWarning  = remainSeconds !== null && remainSeconds <= CD_WARNING_SECONDS;
    const isCritical = remainSeconds !== null && remainSeconds <= CD_CRITICAL_SECONDS;
    const blinkOn    = Math.floor(Date.now() / CD_BLINK_MS) % 2 === 0;

    if (isCritical && remainSeconds > 0 && remainSeconds !== this.lastCountdownBeepSecond) {
      this.lastCountdownBeepSecond = remainSeconds;
      this.playCountdownSfx();
    } else if (!isCritical || remainSeconds <= 0) {
      this.stopCountdownSfx();
    }

    this.seatViews.forEach(sv => {
      if (sv.displaySeat === turnSeat && remainSeconds !== null) {
        const ringColor = isWarning ? CD_RING_WARNING : CD_RING_COLOR;
        const textColor = isWarning ? CD_WARNING_COLOR : CD_TEXT_COLOR;
        const alpha     = isCritical ? (blinkOn ? 1 : 0.2) : 1;
        sv.cdBg.setStrokeStyle(CD_RING_WIDTH, ringColor, 1).setAlpha(alpha).setVisible(true);
        sv.cdText.setColor(textColor).setAlpha(alpha).setText(`${remainSeconds}`).setVisible(true);
      } else {
        sv.cdBg.setVisible(false);
        sv.cdText.setVisible(false);
      }
    });
  }

  _checkHeroCards() {
    const v = Number(this.state?.bigTwoHeroCardsVersion ?? 0);
    if (v <= this.lastHeroCardsVer) return;
    this.lastHeroCardsVer = v;
    this.selectedIndices.clear();
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
      this._dealAnimation(cards.length || 13);
    } else {
      this.heroCardImages.forEach((img, i) => {
        if (i < cards.length) img.setVisible(true);
      });
    }
  }

  _dealAnimation(cardCount) {
    const runId  = ++this._dealRunId;  // invalidates any previous in-flight animation
    const s      = this._s ?? 1;
    const ox     = this._ox ?? 0;
    const oy     = this._oy ?? 0;
    const fromX  = ox + (CX + TABLE_X_OFFSET) * s;
    const fromY  = oy + (TABLE_Y - 100) * s;
    const sfxVol = Math.max(0, Math.min(1, 0.5 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)));

    // 只對有玩家的對手席位做動畫
    const nonHeroViews = this.seatViews.filter(sv => !sv.isHero && sv.displaySeat !== null);
    // 先隱藏對手牌背，等動畫一張一張亮出來
    nonHeroViews.forEach(sv => sv.cardBacks.forEach(cb => cb.setVisible(false)));

    this._dealAnimating = true;
    let seq = 0; // 全局序號，控制 stagger 順序
    for (let r = 0; r < cardCount; r++) {
      // 依序派給每個對手
      nonHeroViews.forEach(sv => {
        const lp     = SEAT_POS[sv.slotIndex];
        const pivotX = ox + lp.x * s;
        const pivotY = oy + (lp.y + OPP_CARDS_Y_OFFSET) * s;
        const angleDeg = cardCount > 1
          ? -OPP_FAN_ANGLE_SPAN / 2 + r * OPP_FAN_ANGLE_SPAN / (cardCount - 1)
          : 0;
        const ar = Phaser.Math.DegToRad(angleDeg);
        const tx = pivotX + OPP_FAN_RADIUS * s * Math.sin(ar);
        const ty = pivotY - OPP_FAN_RADIUS * s * Math.cos(ar);
        const targetCard = sv.cardBacks[r];
        const delay = seq * DEAL_CARD_STAGGER_MS;
        seq++;

        this.time.delayedCall(delay, () => {
          if (this._dealRunId !== runId) return;
          const fly = this.add.image(fromX, fromY, "game_table", "card_back")
            .setDisplaySize(OPP_FAN_CARD_W * s, OPP_FAN_CARD_H * s)
            .setDepth(56).setAlpha(0.9);
          this.tweens.add({
            targets: fly,
            x: tx, y: ty,
            rotation: ar,
            duration: DEAL_CARD_FLY_DURATION,
            ease: "Cubic.Out",
            onComplete: () => {
              if (this._dealRunId !== runId) { fly?.destroy(); return; }
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
          const fly = this.add.image(fromX, fromY, "game_table", "card_back")
            .setDisplaySize(HERO_CARD_W * s, HERO_CARD_H * s)
            .setDepth(56).setAlpha(0.9);
          this.tweens.add({
            targets: fly,
            x: heroImg.x, y: heroImg.y,
            duration: DEAL_CARD_FLY_DURATION,
            ease: "Cubic.Out",
            onComplete: () => {
              if (this._dealRunId !== runId) { fly?.destroy(); return; }
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
    this.seatViews.forEach(sv => {
      if (sv.isHero || sv.displaySeat === null) return;
      const players = this.state?.table?.players ?? [];
      const player = players.find(p => Number(p.seat) === sv.displaySeat);
      const rem = Number(player?.remaining_count ?? player?.hole_count ?? 0);
      const show = rem > 0 ? Math.min(rem, OPP_CARD_MAX) : OPP_CARD_MAX;
      sv.cardBacks.forEach((cb, c) => cb.setVisible(c < show));
      if (rem > 0) {
        sv.cardCountBadge.setText(`${rem}`).setVisible(true);
        sv.cardCountBadgeBg?.setVisible(true);
      }
    });
  }

  _checkLastPlay() {
    const v = Number(this.state?.bigTwoLastPlayVersion ?? 0);
    if (v <= this.lastLastPlayVer) return;
    this.lastLastPlayVer = v;

    // 清除上一次出牌的飞行精灵和中央牌图
    this._centerFlyImages?.forEach(f => f.destroy());
    this._centerFlyImages = [];
    this.centerPlayImages.forEach(i => i.destroy());
    this.centerPlayImages = [];

    const lastPlay = this.state.bigTwoLastPlay;
    if (!lastPlay?.cards?.length) {
      this.centerLabel?.setVisible(false);
      this.centerByText?.setVisible(false);
      return;
    }

    const s = this._s ?? 1, ox = this._ox ?? 0, oy = this._oy ?? 0;
    const cards  = lastPlay.cards;
    const n      = cards.length;
    const totalW = n * (CENTER_CARD_W + CENTER_CARD_GAP) - CENTER_CARD_GAP;
    const startX = CX - totalW / 2 + CENTER_CARD_W / 2;

    // 出牌来源坐标（哪个玩家出的，从哪里飞过来）
    const playSeat = Number(lastPlay.seat ?? -1);
    const seatView = this.seatViews.find(sv => sv.displaySeat === playSeat);
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

    // 标签
    const players = this.state?.table?.players ?? [];
    const p = players.find(pl => Number(pl.seat) === playSeat);
    const name = p ? String(p.name || p.nickname || `座位${playSeat}`) : `座位${playSeat}`;
    this.centerLabel?.setVisible(true);
    this.centerByText?.setText(`${name} 出牌`).setVisible(true);

    // 立即在目的地建立永久牌图（保证显示），fly 精灵只是视觉叠加
    cards.forEach((card, i) => {
      const key = normalizeCard(card);
      const tx = ox + (startX + i * (CENTER_CARD_W + CENTER_CARD_GAP)) * s;
      const ty = oy + CENTER_PLAY_Y * s;
      const texture = key ? "playing_cards_element" : "game_table";
      const frame   = key || "card_back";

      // 永久牌图：立即创建，不依赖动画回调
      const img = this.add.image(tx, ty, texture, frame)
        .setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
        .setDepth(10);
      this.centerPlayImages.push(img);

      // fly 精灵：从玩家位置飞来覆盖在上面，完成后销毁
      const fly = this.add.image(fromX, fromY, texture, frame)
        .setDisplaySize(CENTER_CARD_W * s, CENTER_CARD_H * s)
        .setDepth(55);
      this._centerFlyImages.push(fly);

      this.tweens.add({
        targets: fly,
        x: tx, y: ty,
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

  _checkHandResult() {
    const v = Number(this.state?.bigTwoHandResultVersion ?? 0);
    if (v <= this.lastHandResultVer) return;
    this.lastHandResultVer = v;
    const res = this.state.bigTwoHandResult;
    if (res) this._showModal(res);
  }

  // ─── CARD ACTIONS ─────────────────────────────────────────────────

  _toggleCard(i) {
    const ar       = this.state?.actionRequest;
    const heroSeat = Number(this.state?.heroSeat ?? -1);
    const turnSeat = Number(this.state?.table?.current_turn_seat ?? -1);
    const isMyTurn = heroSeat >= 0 && heroSeat === turnSeat;
    const allowed  = Array.isArray(ar?.allowed) ? ar.allowed : [];
    const canSelect = isMyTurn || allowed.some(a => a === "play_cards" || a === "play");
    if (!canSelect) return;
    if (!this.heroCardImages[i]?.visible) return;

    if (this.selectedIndices.has(i)) this.selectedIndices.delete(i);
    else this.selectedIndices.add(i);

    this._refreshCardVisuals();
    const hasSel = this.selectedIndices.size > 0;
    this.playBtn?.setEnabled?.(hasSel);
    if (hasSel) {
      this.comboInfoText?.setText(this._detectCombo(this.selectedIndices)).setVisible(true);
    } else {
      this.comboInfoText?.setText("請選牌出牌").setVisible(true);
    }
  }

  _refreshCardVisuals() {
    const s = this._s ?? 1, oy = this._oy ?? 0;
    this.heroCardImages.forEach((img, i) => {
      if (!img.visible) return;
      const sel = this.selectedIndices.has(i);
      img.y = oy + (HERO_HAND_Y - (sel ? HERO_CARD_LIFT : 0)) * s;
      img.setTint(sel ? 0xffff88 : 0xffffff);
    });
  }

  _detectCombo(indices) {
    const heroCards = this.state?.bigTwoHeroCards ?? [];
    const selected  = [...indices].map(i => heroCards[i]).filter(Boolean);
    const n = selected.length;
    if (n === 0) return "";
    const RANK = { '3':0,'4':1,'5':2,'6':3,'7':4,'8':5,'9':6,'T':7,'J':8,'Q':9,'K':10,'A':11,'2':12 };
    const parsed = selected.map(c => {
      const norm = normalizeCard(c);
      return norm ? { r: RANK[norm[0]], s: norm[1] } : null;
    }).filter(Boolean);
    if (parsed.length !== n) return `${n}張`;
    const ranks = parsed.map(c => c.r);
    const suits  = parsed.map(c => c.s);
    if (n === 1) return "單張";
    if (n === 2) return new Set(ranks).size === 1 ? "對子" : `${n}張`;
    if (n === 3) return new Set(ranks).size === 1 ? "三條" : `${n}張`;
    if (n === 5) {
      const sorted    = [...ranks].sort((a, b) => a - b);
      const isStraight = new Set(ranks).size === 5 && sorted[4] - sorted[0] === 4;
      const isFlush    = new Set(suits).size === 1;
      if (isStraight && isFlush) return "同花順";
      if (isFlush)               return "同花";
      if (isStraight)            return "順子";
      const cnt = {};
      ranks.forEach(r => { cnt[r] = (cnt[r] || 0) + 1; });
      const vals = Object.values(cnt).sort((a, b) => a - b);
      if (vals.length === 2 && vals[1] === 4) return "四帶一";
      if (vals.length === 2 && vals[1] === 3) return "葫蘆";
    }
    return `${n}張`;
  }

  _onPlay() {
    if (this.selectedIndices.size === 0) return;
    const heroCards = this.state?.bigTwoHeroCards ?? [];
    const cards = [...this.selectedIndices].sort((a, b) => a - b)
      .map(i => heroCards[i]).filter(Boolean);
    if (!cards.length) return;
    const sfxVol = Math.max(0, Math.min(1, 0.55 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)));
    if (sfxVol > 0 && this.cache.audio.exists("bet_chip")) {
      const sfx = this.sound.add("bet_chip");
      sfx.setVolume(sfxVol);
      sfx.play();
      sfx.once("complete", () => sfx.destroy());
    }
    const ar = this.state?.actionRequest;
    const actionSeq = ar?.action_seq ?? this.state?.bigTwoActionSeq;
    const payload = { action: "play_cards", cards };
    if (actionSeq != null) payload.action_seq = actionSeq;
    this.app?.sendPacket?.("player_action", payload);
    this.selectedIndices.clear();
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
    this.selectedIndices.clear();
    this._refreshCardVisuals();
    this.playBtn?.setVisible(false);
    this.passBtn?.setVisible(false);
    this.comboInfoText?.setVisible(false);
  }

  // ─── RESULT MODAL ─────────────────────────────────────────────────

  _showModal(result) {
    if (this.isResultOpen) return;
    this.isResultOpen = true;

    const players    = this.state?.table?.players ?? [];
    const winnerSeat = Number(result.winner_seat ?? -1);
    const heroSeat   = Number(this.state?.heroSeat ?? -1);
    const sfxKey     = (heroSeat >= 0 && heroSeat === winnerSeat) ? "player_win" : "player_lose";
    const sfxVol     = Math.max(0, Math.min(1, 0.6 * Number(this.app?.getSfxOutputVolume?.(1) ?? 0)));
    if (sfxVol > 0 && this.cache.audio.exists(sfxKey)) {
      const sfx = this.sound.add(sfxKey);
      sfx.setVolume(sfxVol);
      sfx.play();
      sfx.once("complete", () => sfx.destroy());
    }
    const results    = Array.isArray(result.results) ? result.results : [];

    const lines = results.map(r => {
      const seat  = Number(r.seat);
      const p     = players.find(pl => Number(pl.seat) === seat);
      const name  = p ? String(p.name || p.nickname || `座位${seat}`) : `座位${seat}`;
      const delta = Number(r.score_delta ?? 0);
      const rem   = Number(r.remaining_count ?? 0);
      const isW   = seat === winnerSeat;
      const sign  = delta >= 0 ? "+" : "";
      const suffix = isW ? " 🏆" : (rem > 0 ? ` (剩${rem}張)` : "");
      const col    = delta >= 0 ? "" : "";
      return `${name}：${sign}${delta}${suffix}`;
    });

    this.modalBody?.setText(lines.join("\n")).setVisible(true);

    [this.modalOverlay, this.modalPanelGfx, this.modalBorderGfx,
     this.modalTitleLabel, this.modalTitle, this.modalHint, this.modalBody].forEach(o => o?.setVisible(true));
    this.modalConfirmBtn?.setVisible(true);

    this.applyLayout();
    this.scene.bringToTop();

    this._resultTimer = this.time.delayedCall(6000, () => this._closeModal());
  }

  _closeModal() {
    this._resultTimer?.remove(); this._resultTimer = null;
    this.isResultOpen = false;
    [this.modalOverlay, this.modalPanelGfx, this.modalBorderGfx,
     this.modalTitleLabel, this.modalTitle, this.modalHint, this.modalBody].forEach(o => o?.setVisible(false));
    this.modalConfirmBtn?.setVisible(false);

    const gameId = this.state?.table?.game_id || "big_two";
    this.store?.forceBackToGameLobby?.();
    this.app?.sendPacket?.("enter_game", { game_id: gameId });
  }
}
