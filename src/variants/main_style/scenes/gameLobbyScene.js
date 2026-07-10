import { bindImageButton, createRectButton, createGradientButton, drawEnhancedBorder, applyGoldTitleGradient, playUiClick } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { ProfileEditorModal, toServerAvatarFrame } from "../ui/profileEditorModal.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const UI_FONT_STACK = "sans-serif";
const ROOM_CONFIGS = [
  { label: "label_red",    token: "token_red _glow",   name: "新手場", glowColor: 0xff3300 },
  { label: "label_green",  token: "token_green_glow",  name: "初級場", glowColor: 0x00dd44 },
  { label: "label_blue",   token: "token_blue_glow",   name: "中級場", glowColor: 0x2277ff },
  { label: "label_purple", token: "token_purple_glow", name: "高級場", glowColor: 0xbb22ff },
];
const ROOM_CARD_CENTER_X = 360;
const ROOM_CARD_START_Y = 544;
const ROOM_CARD_GAP = 204;
const ROOM_CARD_DISPLAY_W = 690;
const ROOM_CARD_DISPLAY_H = 194;
const ROOM_SCROLL_TOP_Y = 0;
const ROOM_DRAG_THRESHOLD = 15;
const BUYIN_OVERLAY_COLOR = 0x000000;
const BUYIN_OVERLAY_ALPHA = 0.56;
const BUYIN_PANEL_COLOR = 0x13283a;
const BUYIN_PANEL_ALPHA = 0.98;
const BUYIN_TITLE_COLOR = "#ecd5b5";
const BUYIN_NUMBER_COLOR = "#ecd5b5";
const BUYIN_NUMBER_ERROR_COLOR = "#ff6b6b";
const BUYIN_HINT_COLOR = "#d9b98a";
const BUYIN_HINT_ERROR_COLOR = "#ff6b6b";
const BUYIN_CONFIRM_COLOR = 0x24583b;
const BUYIN_CANCEL_COLOR = 0x5b2c2c;
const BUYIN_SLIDER_TRACK_COLOR = 0x4a2a10;
const BUYIN_SLIDER_FILL_COLOR = 0xecd5b5;
const BUYIN_SLIDER_KNOB_COLOR = 0xfff2dd;
const BUYIN_STEP_BTN_SIZE = 52;
const BUYIN_STEP_BTN_OFFSET_X = 128;
const BUYIN_OVERLAY_DEPTH = 222;
const BUYIN_PANEL_DEPTH = 223;
const BUYIN_TEXT_DEPTH = 224;
const BUYIN_PANEL_X = 360;
const BUYIN_PANEL_Y = 720;
const BUYIN_PANEL_WIDTH = 560;
const BUYIN_PANEL_HEIGHT = 520;
const BUYIN_TITLE_X = 360;
const BUYIN_TITLE_Y = 515;
const BUYIN_AMOUNT_X = 360;
const BUYIN_AMOUNT_Y = 610;
const BUYIN_RANGE_X = 360;
const BUYIN_RANGE_Y = 675;
const BUYIN_SLIDER_START_X = 190;
const BUYIN_SLIDER_END_X = 530;
const BUYIN_SLIDER_Y = 760;
const BUYIN_SLIDER_TRACK_WIDTH = BUYIN_SLIDER_END_X - BUYIN_SLIDER_START_X;
const BUYIN_SLIDER_TRACK_HEIGHT = 10;
const BUYIN_SLIDER_HIT_HEIGHT = 48;
const BUYIN_SLIDER_KNOB_RADIUS = 17;
const BUYIN_HINT_X = 360;
const BUYIN_HINT_Y = 820;
// 取消觀戰按鈕後，確認入桌 / 取消 兩顆置中分佈。
const BUYIN_CONFIRM_X = 250;
const BUYIN_CANCEL_X = 470;
const BUYIN_BUTTON_Y = 905;
const BUYIN_BUTTON_WIDTH = 180;
const BUYIN_BUTTON_HEIGHT = 64;
const BUYIN_TEXT_OUTLINE_STYLE = { stroke: "#000000", strokeThickness: 1 };
const BUYIN_BUTTON_TEXT_STYLE = { color: BUYIN_TITLE_COLOR, ...BUYIN_TEXT_OUTLINE_STYLE };
const REPORTS_LIMIT = 10;
const REPORTS_OVERLAY_DEPTH = 222;
const REPORTS_PANEL_DEPTH = 223;
const REPORTS_TEXT_DEPTH = 224;
const REPORTS_OVERLAY_COLOR = 0x000000;
const REPORTS_OVERLAY_ALPHA = 0.62;
const REPORTS_PANEL_COLOR = 0x13283a;
const REPORTS_PANEL_ALPHA = 0.98;
const REPORTS_TITLE_COLOR = "#f0c040";
const REPORTS_TEXT_COLOR = "#f4deba";
const REPORTS_HINT_COLOR = "#d9b98a";
const REPORTS_FONT_FAMILY = "sans-serif";
const REPORTS_PANEL_X = 360;
const REPORTS_PANEL_WIDTH = 650;
const REPORTS_PANEL_HEIGHT_MAX = 1060;
const REPORTS_PANEL_HEIGHT_MIN = 820;
const REPORTS_PANEL_MARGIN = 90;
const REPORTS_LIST_X = 360;
const REPORTS_LIST_WRAP_WIDTH = 560;
const REPORTS_SCROLLBAR_X = 670;
const REPORTS_SCROLLBAR_W = 10;
const REPORTS_ROW_GAP = 62;
const REPORTS_MAX_ROWS = 10;
const REPORTS_COL_TIME_X = 65;
const REPORTS_COL_CARDS_X = 220;
const REPORTS_COL_RANK_X = 415;
const REPORTS_COL_NET_X = 520;
const REPORTS_COL_REPLAY_X = 610;
const REPORTS_CARD_WIDTH = 30;
const REPORTS_CARD_HEIGHT = 42;
const REPORTS_CARD_GAP = 5;
const REPORTS_REPLAY_BTN_WIDTH = 64;
const REPORTS_REPLAY_BTN_HEIGHT = 36;
const REPORTS_REFRESH_X = 360;
const REPORTS_PREV_X = 195;
const REPORTS_NEXT_X = 525;
const REPORTS_CLOSE_X = 360;
const REPORTS_BTN_WIDTH = 140;
const REPORTS_BTN_HEIGHT = 58;
const REPORTS_ARROW_BTN_WIDTH = 110;
const REPORTS_BACK_X = 530;
const REPORTS_DAILY_COL_DATE_X = 90;
const REPORTS_DAILY_COL_HAND_X = 315;
const REPORTS_DAILY_COL_NET_X = 475;
const REPORTS_DAILY_COL_VIEW_X = 600;

export class GameLobbyScene extends Phaser.Scene {
  constructor() {
    super("gameLobby");
    this.rowNodes = [];
    this.reportRowNodes = [];
    this.emptyHint = null;
    this.settingsModalVisible = false;
    this.buyinModalVisible = false;
    this.buyinStake = null;
    this.buyinModel = null;
    this.buyinSelectedAmount = 0;
    this.handReportsModalVisible = false;
    this.handReportsOffset = 0;
    this.handReportsRequestedOffset = null;
    this.handReportsLoading = false;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.handReportsLastCount = 0;
    this.lastSeenHandReportsVersion = 0;
    this.lastSeenDailySettlementVersion = 0;
    this._lastPendingDailySettlementVersion = 0;
    this.reportsScrollY = 0;
    this._reportsContentH = 0;
    this.soundSettingsPanel = null;
  }

  create() {
    this.useResponsiveLayout = true;
    this.app = window.__APP__;
    this.store = this.app.store;

    this.bgImage = this.add.image(layout.centerX, layout.centerY, "Lobby", "Lobby_bg").setDisplaySize(layout.width, layout.height);

    // Page scroll container — all non-fixed content goes here; created first so items can be added as they're built
    this.roomScrollY = 0;
    this._roomContentH = 0;
    this._roomScrollVisibleH = 0;
    this._roomIsDragging = false;
    this._roomDragStartY = null;
    this._roomDragStartScrollY = 0;
    this.roomScrollContainer = this.add.container(0, 0);
    this._roomMaskGfx = this.make.graphics({ add: false });
    this._refreshRoomMask();
    this.roomScrollContainer.setMask(this._roomMaskGfx.createGeometryMask());

    this.bgm = this.sound.get("bgm_main");
    if (!this.bgm && this.cache.audio.exists("bgm_main")) {
      this.bgm = this.sound.add("bgm_main", {
        loop: true,
        volume: 0.2,
      });
    }

    this._syncBgm = () => {
      if (!this.bgm) {
        return;
      }
      const outputVolume = Number(this.app.getBgmOutputVolume?.(1) ?? 0);
      if (outputVolume > 0) {
        this.bgm.setVolume(outputVolume);
        if (this.bgm.isPaused) {
          this.bgm.resume();
        } else if (!this.bgm.isPlaying) {
          this.bgm.play();
        }
        return;
      }
      if (this.bgm.isPlaying || this.bgm.isPaused) {
        this.bgm.pause();
      }
    };

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: 652,
      buttonY: 98,
      onSettingsChanged: () => {
        this._syncBgm();
      },
    });
    this.soundSettingsPanel.triggerButton.setDisplaySize(85.5, 85.5);
    this.roomScrollContainer.add(this.soundSettingsPanel.triggerButton);
    this._syncBgm();

    // User info panel — info_label at natural 1404:612 ratio, frame+avatar at left
    // Panel center x=226 so left edge ≈ x=10, right edge ≈ x=442; buttons float outside at far right
    this.roomScrollContainer.add(this.add.image(240, 97, "Lobby", "info_label").setDisplaySize(360, 157).setCrop(2, 3, 698, 300));
    this.roomScrollContainer.add(this.add.graphics({ x: 83, y: 97 }).fillStyle(0x1c0508, 1).fillCircle(0, 0, 69));
    this.avatarImage = this.add.image(83, 97, "avatar_element", "avatar_001").setDisplaySize(124, 124);
    this.roomScrollContainer.add(this.avatarImage);
    this.roomScrollContainer.add(this.add.image(83, 97, "game_table", "profile_frame_off").setDisplaySize(170, 170));
    this.nicknameText = this.add
      .text(168, 78, "-", {
        fontFamily: UI_FONT_STACK,
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffc000",
      })
      .setOrigin(0, 0.5);
    this.roomScrollContainer.add(this.nicknameText);
    this.roomScrollContainer.add(this.add.image(181, 114, "Lobby", "coin").setDisplaySize(26, 26));
    this.walletText = this.add
      .text(199, 114, "--", {
        fontFamily: UI_FONT_STACK,
        fontSize: "24px",
        fontStyle: "bold",
        color: "#F9CD73",
      })
      .setOrigin(0, 0.5);
    this.roomScrollContainer.add(this.walletText);
    this.addOnBtn = this.add.image(316, 114, "choose_game", "add on").setDisplaySize(37, 38);
    bindImageButton(this, this.addOnBtn, { onClick: () => this.showUnderConstruction() });
    this.roomScrollContainer.add(this.addOnBtn);

    const settingIcon = this.add.image(550, 98, "Lobby", "setting").setDisplaySize(74, 74);
    bindImageButton(this, settingIcon, { onClick: () => this.openSettingsModal() });
    this.roomScrollContainer.add(settingIcon);

    // Stats bar  (info_bar center y=281, spans y=180–382)
    this.roomScrollContainer.add(this.add.image(360, 281, "Lobby", "info_bar").setDisplaySize(700, 202).setCrop(2, 3, 367, 101));
    // 保留四格數值文字的參照，供 renderProfileInfo 由伺服器 progress_summary 更新（等級/場次/勝率/贏場）。
    this._statValueTexts = {};
    [
      { x: 107.5, key: "level",   label: "等級", value: "Lv.1" },
      { x: 273,   key: "hands",   label: "場次", value: "-" },
      { x: 447,   key: "winRate", label: "勝率", value: "-" },
      { x: 612.5, key: "wins",    label: "贏場", value: "-" },
    ].forEach(({ x, key, label, value }) => {
      const valTxt = this.add.text(x, 264, value, {
        fontFamily: UI_FONT_STACK, fontSize: "32px", fontStyle: "bold", color: "#f8bb3e",
      }).setOrigin(0.5);
      const vg = valTxt.context.createLinearGradient(0, 0, 0, valTxt.height);
      vg.addColorStop(0, "#f7e59e");
      vg.addColorStop(1, "#f8bb3e");
      valTxt.setFill(vg);
      this._statValueTexts[key] = valTxt;
      this.roomScrollContainer.add(valTxt);

      const lblTxt = this.add.text(x, 298, label, {
        fontFamily: UI_FONT_STACK, fontSize: "26px", color: "#f8bb3e",
      }).setOrigin(0.5);
      const lg = lblTxt.context.createLinearGradient(0, 0, 0, lblTxt.height);
      lg.addColorStop(0, "#f7e59e");
      lg.addColorStop(1, "#f8bb3e");
      lblTxt.setFill(lg);
      this.roomScrollContainer.add(lblTxt);
    });

    // Divider lines over info_bar
    const divGfx = this.add.graphics();
    divGfx.fillStyle(0xf8edaf, 1);
    [186, 360, 534].forEach(dx => divGfx.fillRect(dx - 1, 231, 2, 100));
    this.roomScrollContainer.add(divGfx);

    // Section title  (info_bar ends y=382; title at y=412)
    this.roomScrollContainer.add(this.add.image(120, 412, "Lobby", "title_border_left").setDisplaySize(190, 31).setCrop(2, 2, 213, 31));
    const sectionTitleText = this.add.text(360, 412, "選擇場次", {
      fontFamily: UI_FONT_STACK, fontSize: "36px", fontStyle: "bold", color: "#f7e59e",
      shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 6, fill: true },
    }).setOrigin(0.5);
    const stg = sectionTitleText.context.createLinearGradient(0, 0, 0, sectionTitleText.height);
    stg.addColorStop(0, "#f7e59e"); stg.addColorStop(1, "#f8bb3e");
    sectionTitleText.setFill(stg);
    this.roomScrollContainer.add(sectionTitleText);
    this.roomScrollContainer.add(this.add.image(600, 412, "Lobby", "title_border_right").setDisplaySize(190, 31).setCrop(2, 2, 213, 31));

    // Navigator bar (anchor 到 viewport 底部，並預留設備底部安全區域)
    const bot = layout.bottom;
    const sab = layout.safeAreaBottom;
    const NAV_DEPTH = 10;
    this.navBarImage = this.add.image(360, bot - 69 - sab, "Lobby", "navigator_bar").setDisplaySize(720, 138).setDepth(NAV_DEPTH);
    this.navItems = [];
    [
      { frame: "home_icon",     x: 80,  label: "大廳",  onClick: () => { this.playSfx(); this.app.sendPacket?.("enter_lobby", {}); } },
      { frame: "chart_icon",    x: 220, label: "報表",  onClick: () => { this.playSfx(); this.openHandReportsModal(); } },
      { frame: "shopping_icon", x: 500, label: "商店",  onClick: () => { this.playSfx(); this.showUnderConstruction(); } },
      { frame: "cs_icon",       x: 640, label: "客服",  onClick: () => { this.playSfx(); this.showUnderConstruction(); } },
    ].forEach(({ frame, x, label, onClick }) => {
      const icon = this.add.image(x, bot - 90 - sab, "Lobby", frame).setScale(0.82).setDepth(NAV_DEPTH + 1);
      const labelText = this.add.text(x, bot - 40 - sab, label, {
        fontFamily: UI_FONT_STACK, fontSize: "24px", color: "#ecd5b5",
      }).setOrigin(0.5).setDepth(NAV_DEPTH + 1);
      const hit = this.add.rectangle(x, bot - 70 - sab, 110, 120, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", onClick)
        .setDepth(NAV_DEPTH + 2);
      this.navItems.push({ icon, label: labelText, hit, x });
    });

    this.middleIcon = this.add.image(360, bot - 122 - sab, "Lobby", "middle_icon").setDisplaySize(118, 128).setDepth(NAV_DEPTH + 1);
    this.middleLabel = this.add.text(360, bot - 40 - sab, "登出", {
      fontFamily: UI_FONT_STACK, fontSize: "24px", color: "#ecd5b5",
    }).setOrigin(0.5).setDepth(NAV_DEPTH + 1);
    this.middleHit = this.add.rectangle(360, bot - 105 - sab, 125, 175, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { this.playSfx(); this.showLogoutConfirm(); })
      .setDepth(NAV_DEPTH + 2);

    // Logout confirm dialog — styled to match buyin popup
    const LOGOUT_DEPTH = 228;
    const _logoutPanelW = 440;
    const _logoutPanelH = 260;
    const _logoutPanelX = 360;
    const _logoutPanelY = 720;
    const _logoutPanelCR = 16;
    const _logoutPanelL = _logoutPanelX - _logoutPanelW / 2;
    const _logoutPanelT = _logoutPanelY - _logoutPanelH / 2;

    this.logoutOverlay = this.add.rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.6)
      .setDepth(LOGOUT_DEPTH).setVisible(false)
      .setInteractive({ useHandCursor: false });
    this.logoutOverlay.on("pointerdown", () => {});
    this.logoutOverlay.on("pointerup", () => {});

    this.logoutPanelBorder = this.add.graphics();
    drawEnhancedBorder(this.logoutPanelBorder, _logoutPanelL, _logoutPanelT, _logoutPanelW, _logoutPanelH, _logoutPanelCR);
    this.logoutPanelBorder.setDepth(LOGOUT_DEPTH).setVisible(false);

    this._logoutMaskGfx = this.make.graphics({ add: false });
    this._logoutMaskGfx.fillStyle(0xffffff);
    this._logoutMaskGfx.fillRoundedRect(_logoutPanelL, _logoutPanelT, _logoutPanelW, _logoutPanelH, _logoutPanelCR);
    this.logoutPanel = this.add.graphics();
    this.logoutPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.logoutPanel.fillRect(_logoutPanelL, _logoutPanelT, _logoutPanelW, _logoutPanelH);
    this.logoutPanel.setMask(this._logoutMaskGfx.createGeometryMask());
    this.logoutPanel.setDepth(LOGOUT_DEPTH + 1).setVisible(false);
    this.logoutPanel.setInteractive(
      new Phaser.Geom.Rectangle(_logoutPanelL, _logoutPanelT, _logoutPanelW, _logoutPanelH),
      Phaser.Geom.Rectangle.Contains,
    );
    this.logoutPanel.on("pointerdown", () => {});
    this.logoutPanel.on("pointerup", () => {});

    this.logoutTitleLabel = this.add
      .image(_logoutPanelX, _logoutPanelT, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(240, 84)
      .setDepth(LOGOUT_DEPTH + 2).setVisible(false);

    this.logoutTitleText = this.add.text(_logoutPanelX, _logoutPanelT + 8, "登出", {
      fontFamily: UI_FONT_STACK, fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(LOGOUT_DEPTH + 3).setVisible(false);
    applyGoldTitleGradient(this.logoutTitleText);

    this.logoutMsgText = this.add.text(_logoutPanelX, _logoutPanelY - 22, "確定要登出嗎？", {
      fontFamily: UI_FONT_STACK, fontSize: "28px", color: "#ecd5b5",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(LOGOUT_DEPTH + 2).setVisible(false);

    this.logoutConfirmBtn = createGradientButton(this, {
      x: _logoutPanelX - 100, y: _logoutPanelY + 70,
      width: 160, height: 60, cornerRadius: 8,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認", labelStyle: { fontSize: "26px", color: "#ecd5b5", stroke: "#000000", strokeThickness: 1 },
      depth: LOGOUT_DEPTH + 3, onClick: () => { this.hideLogoutConfirm(); this.submitLogout(); }, visible: false,
    });
    this.logoutCancelBtn = createGradientButton(this, {
      x: _logoutPanelX + 100, y: _logoutPanelY + 70,
      width: 160, height: 60, cornerRadius: 8,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "取消", labelStyle: { fontSize: "26px", color: "#ecd5b5", stroke: "#000000", strokeThickness: 1 },
      depth: LOGOUT_DEPTH + 3, onClick: () => this.hideLogoutConfirm(), visible: false,
    });

    this.settingsOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.56)
      .setDepth(222).setVisible(false);
    this.settingsOverlay.setInteractive({ useHandCursor: false });
    this.settingsOverlay.on("pointerdown", () => {});
    this.settingsOverlay.on("pointerup", () => this.closeSettingsModal());

    const SP_W = 520, SP_H = 260, SP_CORNER = 18;
    const sp_left = layout.centerX - SP_W / 2;
    const sp_top = layout.centerY - SP_H / 2;

    this.settingsPanelBorder = this.add.graphics().setDepth(223).setVisible(false);
    drawEnhancedBorder(this.settingsPanelBorder, sp_left, sp_top, SP_W, SP_H, SP_CORNER);

    this.settingsPanelMask = this.make.graphics({ add: false });
    this.settingsPanelMask.fillStyle(0xffffff);
    this.settingsPanelMask.fillRoundedRect(sp_left, sp_top, SP_W, SP_H, SP_CORNER);

    this.settingsPanelGfx = this.add.graphics().setDepth(223.5).setVisible(false);
    this.settingsPanelGfx.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.settingsPanelGfx.fillRect(sp_left, sp_top, SP_W, SP_H);
    this.settingsPanelGfx.setMask(this.settingsPanelMask.createGeometryMask());
    this.settingsPanelGfx.setInteractive(new Phaser.Geom.Rectangle(sp_left, sp_top, SP_W, SP_H), Phaser.Geom.Rectangle.Contains);
    this.settingsPanelGfx.on("pointerdown", () => {});

    this.settingsTitleLabel = this.add
      .image(layout.centerX, sp_top, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(320, 112).setDepth(224).setVisible(false);

    this.settingsTitleText = this.add
      .text(layout.centerX, sp_top + 8, "設定", {
        fontFamily: "sans-serif", fontSize: "36px",
        color: "#ecd5b5", fontStyle: "bold",
        stroke: "#000000", strokeThickness: 1,
      })
      .setDepth(224).setOrigin(0.5).setVisible(false);
    applyGoldTitleGradient(this.settingsTitleText);

    this.settingsCloseButton = createGradientButton(this, {
      x: layout.centerX + SP_W / 2 - 32, y: sp_top + 24,
      width: 64, height: 64, cornerRadius: 32,
      topColor: 0x7a2010, bottomColor: 0x3a0808, borderColor: 0xc83020,
      label: "✕", labelStyle: { fontSize: "40px", color: "#ecd5b5" },
      depth: 225, onClick: () => this.closeSettingsModal(), visible: false,
    });

    this.settingsProfileButton = createGradientButton(this, {
      x: layout.centerX, y: layout.centerY + 20,
      width: 280, height: 66, cornerRadius: 10,
      topColor: 0x7a5f1e, bottomColor: 0x3d2f0d, borderColor: 0xc8a040,
      label: "我的資料",
      labelStyle: { fontSize: "26px", color: "#ecd5b5" },
      depth: 224,
      onClick: () => this.openProfileEditorModal(),
      visible: false,
    });

    this.profileEditorModal = new ProfileEditorModal(this, {
      depth: 230,
      onSubmit: (payload) => this.submitProfileUpdate(payload),
    });

    this.reportsOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, REPORTS_OVERLAY_COLOR, REPORTS_OVERLAY_ALPHA)
      .setDepth(REPORTS_OVERLAY_DEPTH)
      .setVisible(false);
    this.reportsOverlay.setInteractive({ useHandCursor: false });
    this.reportsOverlay.on("pointerdown", () => {});
    this.reportsOverlay.on("pointerup", () => {});

    this.reportsPanelBorder = this.add.graphics().setDepth(REPORTS_OVERLAY_DEPTH + 0.5).setVisible(false);

    this._rptMaskGfx = this.make.graphics({ add: false });
    this.reportsPanel = this.add.graphics();
    this.reportsPanel.setMask(this._rptMaskGfx.createGeometryMask());
    this.reportsPanel.setDepth(REPORTS_PANEL_DEPTH).setVisible(false);
    this.reportsPanel.on("pointerdown", () => {});
    this.reportsPanel.on("pointerup", () => {});

    this.reportsTitleLabel = this.add
      .image(REPORTS_PANEL_X, 0, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(400, 140)
      .setDepth(REPORTS_TEXT_DEPTH).setVisible(false);

    this.reportsTitleText = this.add
      .text(REPORTS_PANEL_X, 0, "玩家報表", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "34px",
        color: REPORTS_TITLE_COLOR,
        fontStyle: "bold",
      })
      .setDepth(REPORTS_TEXT_DEPTH + 0.1)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.reportsTitleText);

    this.reportsListText = this.add
      .text(REPORTS_LIST_X, 0, "", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "28px",
        color: REPORTS_HINT_COLOR,
        fontStyle: "bold",
        wordWrap: { width: REPORTS_LIST_WRAP_WIDTH },
      })
      .setDepth(REPORTS_TEXT_DEPTH + 2)
      .setOrigin(0.5)
      .setVisible(false);

    this.reportsScrollContainer = this.add.container(0, 0);
    this.reportsScrollContainer.setDepth(REPORTS_TEXT_DEPTH + 1).setVisible(false);
    this._scrollMaskGfx = this.make.graphics({ add: false });
    this.reportsScrollContainer.setMask(this._scrollMaskGfx.createGeometryMask());

    this.reportsScrollbarTrack = this.add.graphics().setDepth(REPORTS_TEXT_DEPTH + 2).setVisible(false);
    this.reportsScrollbarThumb = this.add.graphics().setDepth(REPORTS_TEXT_DEPTH + 2.1).setVisible(false);

    this._rptDragStartY = null;
    this._rptDragStartScrollY = 0;
    this._rptPointerDown = (ptr) => {
      if (!this.handReportsModalVisible) return;
      const g = this._rptG;
      const zoom = this.cameras.main.zoom || 1;
      const wx = ptr.x / zoom;
      const wy = ptr.y / zoom;
      if (!g || wx < g.rptL || wx > g.rptL + REPORTS_PANEL_WIDTH) return;
      if (wy < g.scrollTopY || wy > g.scrollBottomY) return;
      this._rptDragStartY = wy;
      this._rptDragStartScrollY = this.reportsScrollY;
    };
    this._rptPointerMove = (ptr) => {
      if (this._rptDragStartY == null || !ptr.isDown) return;
      const wy = ptr.y / (this.cameras.main.zoom || 1);
      const dy = wy - this._rptDragStartY;
      this.setReportsScrollY(this._rptDragStartScrollY - dy);
    };
    this._rptPointerUp = () => { this._rptDragStartY = null; };
    this._rptNativeWheel = (e) => {
      if (!this.handReportsModalVisible) return;
      this.setReportsScrollY(this.reportsScrollY + e.deltaY * 0.5);
    };
    this.game.canvas.addEventListener("wheel", this._rptNativeWheel, { passive: true });
    this.input.on("pointerdown", this._rptPointerDown, this);
    this.input.on("pointermove", this._rptPointerMove, this);
    this.input.on("pointerup", this._rptPointerUp, this);

    this.reportsStatusText = this.add
      .text(360, 0, "", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "24px",
        color: REPORTS_HINT_COLOR,
        fontStyle: "bold",
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.reportsPrevButton = createGradientButton(this, {
      x: REPORTS_PREV_X, y: 0,
      width: REPORTS_ARROW_BTN_WIDTH, height: REPORTS_BTN_HEIGHT, cornerRadius: 8,
      topColor: 0x2a4a7a, bottomColor: 0x0e1e3a, borderColor: 0x4a8adf,
      label: "◀ 上頁", labelStyle: { fontSize: "24px", color: "#ecd5b5" },
      depth: REPORTS_TEXT_DEPTH + 1.5,
      onClick: () => this.requestHandReportsPage(this.handReportsOffset - REPORTS_LIMIT),
      visible: false,
    });

    this.reportsNextButton = createGradientButton(this, {
      x: REPORTS_NEXT_X, y: 0,
      width: REPORTS_ARROW_BTN_WIDTH, height: REPORTS_BTN_HEIGHT, cornerRadius: 8,
      topColor: 0x2a4a7a, bottomColor: 0x0e1e3a, borderColor: 0x4a8adf,
      label: "下頁 ▶", labelStyle: { fontSize: "24px", color: "#ecd5b5" },
      depth: REPORTS_TEXT_DEPTH + 1.5,
      onClick: () => this.requestHandReportsPage(this.handReportsOffset + REPORTS_LIMIT),
      visible: false,
    });

    this.reportsBackButton = createGradientButton(this, {
      x: 195, y: 0,
      width: 160, height: 62, cornerRadius: 8,
      topColor: 0x7a5f1e, bottomColor: 0x3d2f0d, borderColor: 0xc8a040,
      label: "← 返回", labelStyle: { fontSize: "24px", color: "#ecd5b5" },
      depth: REPORTS_TEXT_DEPTH + 1.5,
      onClick: () => this.showDailySettlementView(),
      visible: false,
    });

    this.reportsCloseButton = createGradientButton(this, {
      x: 490, y: 0,
      width: 160, height: 62, cornerRadius: 8,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "關閉", labelStyle: { fontSize: "26px", color: "#ecd5b5" },
      depth: REPORTS_TEXT_DEPTH + 1.5,
      onClick: () => this.closeHandReportsModal(),
      visible: false,
    });

    this._applyRptLayout(this._computeRptG());


    this.buyinOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, BUYIN_OVERLAY_COLOR, BUYIN_OVERLAY_ALPHA)
      .setDepth(BUYIN_OVERLAY_DEPTH)
      .setVisible(false);
    this.buyinOverlay.setInteractive({ useHandCursor: false });
    this.buyinOverlay.on("pointerdown", () => {});

    const _buyinPanelCR = 16;
    const _buyinPanelL = BUYIN_PANEL_X - BUYIN_PANEL_WIDTH / 2;
    const _buyinPanelT = BUYIN_PANEL_Y - BUYIN_PANEL_HEIGHT / 2;
    this._buyinMaskGfx = this.make.graphics({ add: false });
    this._buyinMaskGfx.fillStyle(0xffffff);
    this._buyinMaskGfx.fillRoundedRect(_buyinPanelL, _buyinPanelT, BUYIN_PANEL_WIDTH, BUYIN_PANEL_HEIGHT, _buyinPanelCR);
    this.buyinPanel = this.add.graphics();
    this.buyinPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.buyinPanel.fillRect(_buyinPanelL, _buyinPanelT, BUYIN_PANEL_WIDTH, BUYIN_PANEL_HEIGHT);
    this.buyinPanel.setMask(this._buyinMaskGfx.createGeometryMask());
    this.buyinPanel.setDepth(BUYIN_PANEL_DEPTH).setVisible(false);
    this.buyinPanel.setInteractive(
      new Phaser.Geom.Rectangle(_buyinPanelL, _buyinPanelT, BUYIN_PANEL_WIDTH, BUYIN_PANEL_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    );
    this.buyinPanel.on("pointerdown", () => {});

    this.buyinPanelBorder = this.add.graphics();
    drawEnhancedBorder(this.buyinPanelBorder, _buyinPanelL, _buyinPanelT, BUYIN_PANEL_WIDTH, BUYIN_PANEL_HEIGHT, _buyinPanelCR);
    this.buyinPanelBorder.setDepth(BUYIN_PANEL_DEPTH - 0.5).setVisible(false);

    const _buyinTitleLabelY = BUYIN_PANEL_Y - BUYIN_PANEL_HEIGHT / 2;
    this.buyinTitleLabel = this.add
      .image(BUYIN_TITLE_X, _buyinTitleLabelY, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(320, 112)
      .setDepth(BUYIN_TEXT_DEPTH - 0.5)
      .setVisible(false);

    this.buyinTitleText = this.add
      .text(BUYIN_TITLE_X, _buyinTitleLabelY + 8, "入桌籌碼", {
        fontFamily: UI_FONT_STACK,
        fontSize: "34px",
        color: BUYIN_TITLE_COLOR,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(BUYIN_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.buyinTitleText);

    this.buyinAmountBg = this.add.graphics();
    this.buyinAmountBg.fillStyle(0x0e0804, 1);
    this.buyinAmountBg.fillRoundedRect(-110, -34, 220, 68, 10);
    this.buyinAmountBg
      .setPosition(BUYIN_AMOUNT_X, BUYIN_AMOUNT_Y)
      .setDepth(BUYIN_TEXT_DEPTH - 0.05)
      .setVisible(false);

    this.buyinAmountText = this.add
      .text(BUYIN_AMOUNT_X, BUYIN_AMOUNT_Y, "0", {
        fontFamily: UI_FONT_STACK,
        fontSize: "42px",
        color: BUYIN_NUMBER_COLOR,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(BUYIN_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.buyinRangeText = this.add
      .text(BUYIN_RANGE_X, BUYIN_RANGE_Y, "", {
        fontFamily: UI_FONT_STACK,
        fontSize: "22px",
        color: BUYIN_HINT_COLOR,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(BUYIN_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    const _buyinTr = BUYIN_SLIDER_TRACK_HEIGHT / 2;
    this.buyinSliderTrack = this.add.graphics();
    this.buyinSliderTrack.fillStyle(BUYIN_SLIDER_TRACK_COLOR, 1);
    this.buyinSliderTrack.fillRoundedRect(
      -BUYIN_SLIDER_TRACK_WIDTH / 2, -BUYIN_SLIDER_TRACK_HEIGHT / 2,
      BUYIN_SLIDER_TRACK_WIDTH, BUYIN_SLIDER_TRACK_HEIGHT, _buyinTr,
    );
    this.buyinSliderTrack.setPosition(360, BUYIN_SLIDER_Y).setDepth(BUYIN_TEXT_DEPTH).setVisible(false);

    this.buyinSliderFill = this.add.graphics();
    this.buyinSliderFill
      .setPosition(BUYIN_SLIDER_START_X, BUYIN_SLIDER_Y)
      .setDepth(BUYIN_TEXT_DEPTH + 0.1)
      .setVisible(false);

    this.buyinSliderHit = this.add
      .rectangle(360, BUYIN_SLIDER_Y, BUYIN_SLIDER_TRACK_WIDTH, BUYIN_SLIDER_HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(BUYIN_TEXT_DEPTH + 0.2)
      .setVisible(false);
    this.buyinSliderHit.setInteractive({ useHandCursor: true });
    this.buyinSliderHit.on("pointerdown", (pointer) => {
      this.handleBuyinSliderPointer(pointer?.worldX ?? pointer?.x ?? BUYIN_SLIDER_START_X);
    });

    this.buyinSliderKnob = this.add
      .circle(BUYIN_SLIDER_START_X, BUYIN_SLIDER_Y, BUYIN_SLIDER_KNOB_RADIUS, BUYIN_SLIDER_KNOB_COLOR, 1)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(BUYIN_TEXT_DEPTH + 0.3)
      .setVisible(false);
    this.buyinSliderKnob.setInteractive({ useHandCursor: true });
    this.buyinSliderKnob.on("pointerdown", () => {});
    this.input.setDraggable(this.buyinSliderKnob, true);
    this.buyinSliderKnob.on("drag", (_pointer, dragX) => {
      this.handleBuyinSliderPointer(dragX);
    });

    this.buyinHintText = this.add
      .text(BUYIN_HINT_X, BUYIN_HINT_Y, "", {
        fontFamily: UI_FONT_STACK,
        fontSize: "22px",
        color: BUYIN_HINT_COLOR,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
        align: "center",
      })
      .setDepth(BUYIN_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.buyinMinusBtn = createGradientButton(this, {
      x: BUYIN_AMOUNT_X - BUYIN_STEP_BTN_OFFSET_X,
      y: BUYIN_AMOUNT_Y,
      width: BUYIN_STEP_BTN_SIZE,
      height: BUYIN_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: 0x7a4818,
      label: "−",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: BUYIN_TEXT_DEPTH + 0.4,
      onClick: () => this.stepBuyinAmount(-1),
      visible: false,
    });

    this.buyinPlusBtn = createGradientButton(this, {
      x: BUYIN_AMOUNT_X + BUYIN_STEP_BTN_OFFSET_X,
      y: BUYIN_AMOUNT_Y,
      width: BUYIN_STEP_BTN_SIZE,
      height: BUYIN_STEP_BTN_SIZE,
      cornerRadius: 10,
      topColor: 0x3a1c08,
      bottomColor: 0x140804,
      borderColor: 0x7a4818,
      label: "+",
      labelStyle: { fontSize: "36px", color: "#ecd5b5" },
      depth: BUYIN_TEXT_DEPTH + 0.4,
      onClick: () => this.stepBuyinAmount(1),
      visible: false,
    });

    this.buyinConfirmButton = createGradientButton(this, {
      x: BUYIN_CONFIRM_X,
      y: BUYIN_BUTTON_Y,
      width: BUYIN_BUTTON_WIDTH,
      height: BUYIN_BUTTON_HEIGHT,
      cornerRadius: 8,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "進入牌局",
      labelStyle: { fontSize: "26px", color: BUYIN_TITLE_COLOR, stroke: "#000000", strokeThickness: 1 },
      depth: BUYIN_TEXT_DEPTH + 0.4,
      onClick: () => this.confirmJoinStakes(),
      visible: false,
    });

    this.buyinCancelButton = createGradientButton(this, {
      x: BUYIN_CANCEL_X,
      y: BUYIN_BUTTON_Y,
      width: BUYIN_BUTTON_WIDTH,
      height: BUYIN_BUTTON_HEIGHT,
      cornerRadius: 8,
      topColor: 0xc02828,
      bottomColor: 0x6a1010,
      borderColor: 0xd43535,
      label: "取消",
      labelStyle: { fontSize: "26px", color: BUYIN_TITLE_COLOR, stroke: "#000000", strokeThickness: 1 },
      depth: BUYIN_TEXT_DEPTH + 0.4,
      onClick: () => this.closeBuyinModal(),
      visible: false,
    });

    this._roomPointerDown = (ptr) => {
      if (this.buyinModalVisible || this.handReportsModalVisible || this.settingsModalVisible) return;
      const py = ptr.y;
      this._roomDragStartY = py;
      this._roomDragStartScrollY = this.roomScrollY;
      this._roomIsDragging = false;
    };
    this._roomPointerMove = (ptr) => {
      if (this._roomDragStartY === null || !ptr.isDown) return;
      const dy = ptr.y - this._roomDragStartY;
      if (!this._roomIsDragging && Math.abs(dy) > ROOM_DRAG_THRESHOLD) {
        this._roomIsDragging = true;
        // Reset anchor to current position to prevent jump at drag start
        this._roomDragStartY = ptr.y;
        this._roomDragStartScrollY = this.roomScrollY;
        // Cancel any button pressed-states inside the container
        this.roomScrollContainer?.list?.forEach(c => { if (c?.input?.enabled) c.emit('pointerout'); });
      }
      if (this._roomIsDragging) this._setRoomScrollY(this._roomDragStartScrollY - (ptr.y - this._roomDragStartY));
    };
    this._roomPointerUp = () => {
      this._roomDragStartY = null;
      this.time.delayedCall(50, () => { this._roomIsDragging = false; });
    };
    this.input.on("pointerdown", this._roomPointerDown, this);
    this.input.on("pointermove", this._roomPointerMove, this);
    this.input.on("pointerup", this._roomPointerUp, this);

    this.modalDy = 0;
    onLayoutResize(this, () => this.applyLayout());

    this.unsubscribe = this.store.subscribe((state) => this.renderState(state));

    const _refreshGameLobby = () => {
      const gameId = String(this.store.getState?.()?.gameLobby?.game_id || "texas_holdem");
      this.app.sendPacket?.("enter_game", { game_id: gameId });
    };

    this.events.on("wake", () => {
      this.applyLayout();
      const s = this.store.getState();
      const pdv = s.pendingOpenDailySettlement ?? 0;
      this._lastPendingDailySettlementVersion = pdv;
      if (pdv > 0) {
        this._reopenHandReportsModalAfterReplay();
        this.time.delayedCall(0, () => this.store.clearPendingDailySettlement?.());
      } else {
        this.renderState(s);
      }
      _refreshGameLobby();
      this._refreshMyProgress();
    });

    // Also refresh on fresh create so stakes are always up-to-date.
    _refreshGameLobby();
    this._refreshMyProgress();

    // Handle fresh create after replay exit (gameLobby was stopped, not sleeping)
    const _initPdv = this.store.getState?.()?.pendingOpenDailySettlement ?? 0;
    if (_initPdv > 0) {
      this._lastPendingDailySettlementVersion = _initPdv;
      this._reopenHandReportsModalAfterReplay();
      this.time.delayedCall(0, () => this.store.clearPendingDailySettlement?.());
    } else {
      // Restore reports modal if user had it open before a page reload / background discard.
      let _hadModal = false;
      try { _hadModal = sessionStorage.getItem("gameLobby_reportsModal") === "1"; } catch {}
      if (_hadModal) {
        this.time.delayedCall(0, () => this.openHandReportsModal());
      }
    }

    this.events.once("shutdown", () => {
      this.game.canvas.removeEventListener("wheel", this._rptNativeWheel);
      this.input.off("pointerdown", this._rptPointerDown, this);
      this.input.off("pointermove", this._rptPointerMove, this);
      this.input.off("pointerup", this._rptPointerUp, this);
      this.input.off("pointerdown", this._roomPointerDown, this);
      this.input.off("pointermove", this._roomPointerMove, this);
      this.input.off("pointerup", this._roomPointerUp, this);
      this.unsubscribe?.();
      this.clearRows();
      this.clearReportRows();
      this.emptyHint?.destroy();
      this.emptyHint = null;
      this.logoutPanelBorder?.destroy?.();
      this.logoutTitleLabel?.destroy?.();
      this.buyinPanelBorder?.destroy?.();
      this.buyinTitleLabel?.destroy?.();
      this.buyinAmountBg?.destroy?.();
      this.buyinMinusBtn?.destroy?.();
      this.buyinPlusBtn?.destroy?.();
      this.buyinConfirmButton?.destroy?.();
      this.buyinCancelButton?.destroy?.();
      this.reportsPanelBorder?.destroy?.();
      this.reportsTitleLabel?.destroy?.();
      this.reportsScrollContainer?.removeAll(true);
      this.reportsScrollContainer?.destroy();
      this.reportsScrollbarTrack?.destroy?.();
      this.reportsScrollbarThumb?.destroy?.();
      this.roomScrollContainer?.removeAll(true);
      this.roomScrollContainer?.destroy();
      this._roomMaskGfx?.destroy?.();
      this.reportsPrevButton?.destroy?.();
      this.reportsNextButton?.destroy?.();
      this.reportsBackButton?.destroy?.();
      this.reportsCloseButton?.destroy?.();
      this.settingsTitleLabel?.destroy?.();
      this.settingsPanelBorder?.destroy?.();
      this.settingsPanelGfx?.destroy?.();
      this.settingsPanelMask?.destroy?.();
      this.settingsCloseButton?.destroy?.();
      this.settingsLogoutButton?.destroy?.();
      this.settingsProfileButton?.destroy?.();
      this.settingsProfileButton = null;
      this.profileEditorModal?.destroy?.();
      this.profileEditorModal = null;
      this.soundSettingsPanel?.destroy?.();
      this.soundSettingsPanel = null;
    });
  }

  playSfx(key = "ui_click") {
    const sfxOn = this.app.sfxEnabled !== false;
    const masterOn = this.app.masterAudioEnabled !== false;
    if (!sfxOn || !masterOn) return;
    const vol = (Number(this.app.masterVolume ?? 1)) * (Number(this.app.sfxVolume ?? 1));
    if (vol > 0 && this.cache.audio.exists(key)) {
      this.sound.play(key, { volume: vol });
    }
  }

  _computeRptG() {
    const panelH = Math.max(REPORTS_PANEL_HEIGHT_MIN, Math.min(REPORTS_PANEL_HEIGHT_MAX, layout.height - REPORTS_PANEL_MARGIN));
    const panelCY = layout.centerY;
    const panelT = panelCY - panelH / 2;
    const panelB = panelCY + panelH / 2;
    const rptL = REPORTS_PANEL_X - REPORTS_PANEL_WIDTH / 2;
    const scrollTopY = panelT + 96;
    const scrollBottomY = panelB - 128;
    return {
      panelH, panelT, panelB, rptL,
      scrollTopY, scrollBottomY,
      scrollVisibleH: scrollBottomY - scrollTopY,
      titleY: panelT + 8,
      listCenterY: (scrollTopY + scrollBottomY) / 2,
      statusY: panelB - 102,
      btnY: panelB - 105,
      closeY: panelB - 10,
    };
  }

  _applyRptLayout(g) {
    this._rptG = g;
    const rptCR = 16;

    if (this.reportsPanel) {
      this.reportsPanel.clear();
      this.reportsPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
      this.reportsPanel.fillRect(g.rptL, g.panelT, REPORTS_PANEL_WIDTH, g.panelH);
      this.reportsPanel.setInteractive(
        new Phaser.Geom.Rectangle(g.rptL, g.panelT, REPORTS_PANEL_WIDTH, g.panelH),
        Phaser.Geom.Rectangle.Contains,
      );
    }
    if (this.reportsPanelBorder) {
      this.reportsPanelBorder.clear();
      drawEnhancedBorder(this.reportsPanelBorder, g.rptL, g.panelT, REPORTS_PANEL_WIDTH, g.panelH, rptCR);
    }
    if (this._rptMaskGfx) {
      this._rptMaskGfx.clear();
      this._rptMaskGfx.fillStyle(0xffffff);
      this._rptMaskGfx.fillRoundedRect(g.rptL, g.panelT, REPORTS_PANEL_WIDTH, g.panelH, rptCR);
    }
    if (this._scrollMaskGfx) {
      this._scrollMaskGfx.clear();
      this._scrollMaskGfx.fillStyle(0xffffff);
      this._scrollMaskGfx.fillRect(g.rptL + 4, g.scrollTopY, REPORTS_PANEL_WIDTH - 20, g.scrollVisibleH);
    }
    if (this.reportsScrollbarTrack) {
      this.reportsScrollbarTrack.clear();
      this.reportsScrollbarTrack.fillStyle(0x0a0202, 0.7);
      this.reportsScrollbarTrack.fillRoundedRect(REPORTS_SCROLLBAR_X, g.scrollTopY, REPORTS_SCROLLBAR_W, g.scrollVisibleH, 5);
    }

    this.reportsTitleLabel?.setPosition(REPORTS_PANEL_X, g.panelT);
    this.reportsTitleText?.setPosition(REPORTS_PANEL_X, g.titleY);
    this.reportsListText?.setPosition(REPORTS_LIST_X, g.listCenterY);
    this.reportsStatusText?.setPosition(360, g.statusY);
    this.reportsPrevButton?.setPosition?.(REPORTS_PREV_X, g.btnY);
    this.reportsNextButton?.setPosition?.(REPORTS_NEXT_X, g.btnY);
    this.reportsBackButton?.setPosition?.(195, g.closeY);
    const _closeX = this.handReportsMode === "detail" ? 490 : 360;
    this.reportsCloseButton?.setPosition?.(_closeX, g.closeY);

    this.setReportsScrollY(this.reportsScrollY ?? 0);
  }

  setReportsScrollY(scrollY) {
    const scrollVisibleH = this._rptG?.scrollVisibleH ?? 756;
    const maxScroll = Math.max(0, this._reportsContentH - scrollVisibleH);
    this.reportsScrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
    if (this.reportsScrollContainer) {
      const scrollTopY = this._rptG?.scrollTopY ?? 326;
      this.reportsScrollContainer.y = scrollTopY - this.reportsScrollY;
    }
    this._updateReportsScrollbar();
  }

  _refreshRoomMask() {
    if (!this._roomMaskGfx) return;
    const navTop = layout.bottom - 138 - layout.safeAreaBottom;
    this._roomScrollVisibleH = Math.max(1, navTop - ROOM_SCROLL_TOP_Y);
    this._roomMaskGfx.clear();
    this._roomMaskGfx.fillStyle(0xffffff);
    this._roomMaskGfx.fillRect(0, ROOM_SCROLL_TOP_Y, layout.width, this._roomScrollVisibleH);
  }

  _setRoomScrollY(scrollY) {
    const maxScroll = Math.max(0, this._roomContentH - ROOM_SCROLL_TOP_Y - this._roomScrollVisibleH);
    this.roomScrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
    if (this.roomScrollContainer) {
      this.roomScrollContainer.y = -this.roomScrollY;
    }
  }

  applyLayout() {
    // 1. Background fills viewport
    this.bgImage?.setPosition(layout.centerX, layout.centerY).setDisplaySize(layout.width, layout.height);

    // 2. Bottom navigator anchors to viewport bottom (with safe area inset)
    const bot = layout.bottom;
    const sab = layout.safeAreaBottom;
    this.navBarImage?.setPosition(360, bot - 69 - sab);
    this.navItems?.forEach((item) => {
      item.icon.setPosition(item.x, bot - 90 - sab);
      item.label.setPosition(item.x, bot - 40 - sab);
      item.hit.setPosition(item.x, bot - 70 - sab);
    });
    this.middleIcon?.setPosition(360, bot - 122 - sab);
    this.middleLabel?.setPosition(360, bot - 40 - sab);
    this.middleHit?.setPosition(360, bot - 105 - sab);

    // 2b. Room list scroll mask update
    this._refreshRoomMask();
    this._setRoomScrollY(this.roomScrollY ?? 0);

    // 3. Modal shift dy
    const dy = layout.centerY - 720;
    this.modalDy = dy;

    // logout modal
    this.logoutOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.logoutPanelBorder) this.logoutPanelBorder.y = dy;
    if (this.logoutPanel) this.logoutPanel.y = dy;
    if (this._logoutMaskGfx) this._logoutMaskGfx.y = dy;
    const _logoutPanelT_local = 720 - 260 / 2;
    this.logoutTitleLabel?.setPosition(360, _logoutPanelT_local + dy);
    this.logoutTitleText?.setPosition(360, _logoutPanelT_local + 8 + dy);
    this.logoutMsgText?.setPosition(360, 720 - 22 + dy);
    this.logoutConfirmBtn?.setPosition?.(260, 720 + 70 + dy);
    this.logoutCancelBtn?.setPosition?.(460, 720 + 70 + dy);

    // settings modal
    this.settingsOverlay?.setPosition(layout.centerX, layout.centerY);
    const sp_left = layout.centerX - 260;
    const sp_top = layout.centerY - 130;
    if (this.settingsPanelBorder) this.settingsPanelBorder.y = dy;
    if (this.settingsPanelGfx) this.settingsPanelGfx.y = dy;
    if (this.settingsPanelMask) this.settingsPanelMask.y = dy;
    this.settingsTitleLabel?.setPosition(layout.centerX, sp_top + dy);
    this.settingsTitleText?.setPosition(layout.centerX, sp_top + 8 + dy);
    this.settingsCloseButton?.setPosition?.(layout.centerX + 232, sp_top + 20 + dy);
    this.settingsProfileButton?.setPosition?.(layout.centerX, layout.centerY + 20 + dy);
    this.profileEditorModal?.setOffset?.(dy, layout.centerX, layout.centerY);

    // reports modal
    this.reportsOverlay?.setPosition(layout.centerX, layout.centerY);
    this._applyRptLayout(this._computeRptG());

    // buyin modal
    this.buyinOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.buyinPanel) this.buyinPanel.y = dy;
    if (this.buyinPanelBorder) this.buyinPanelBorder.y = dy;
    if (this._buyinMaskGfx) this._buyinMaskGfx.y = dy;
    const _buyinTitleY = BUYIN_PANEL_Y - BUYIN_PANEL_HEIGHT / 2;
    this.buyinTitleLabel?.setPosition(BUYIN_TITLE_X, _buyinTitleY + dy);
    this.buyinTitleText?.setPosition(BUYIN_TITLE_X, _buyinTitleY + 8 + dy);
    this.buyinAmountBg?.setPosition(BUYIN_AMOUNT_X, BUYIN_AMOUNT_Y + dy);
    this.buyinAmountText?.setPosition(BUYIN_AMOUNT_X, BUYIN_AMOUNT_Y + dy);
    this.buyinRangeText?.setPosition(BUYIN_RANGE_X, BUYIN_RANGE_Y + dy);
    this.buyinSliderTrack?.setPosition(360, BUYIN_SLIDER_Y + dy);
    this.buyinSliderFill?.setPosition(BUYIN_SLIDER_START_X, BUYIN_SLIDER_Y + dy);
    this.buyinSliderHit?.setPosition(360, BUYIN_SLIDER_Y + dy);
    this.buyinSliderKnob?.setPosition(this.buyinSliderKnob.x, BUYIN_SLIDER_Y + dy);
    this.buyinHintText?.setPosition(BUYIN_HINT_X, BUYIN_HINT_Y + dy);
    this.buyinMinusBtn?.setPosition?.(BUYIN_AMOUNT_X - BUYIN_STEP_BTN_OFFSET_X, BUYIN_AMOUNT_Y + dy);
    this.buyinPlusBtn?.setPosition?.(BUYIN_AMOUNT_X + BUYIN_STEP_BTN_OFFSET_X, BUYIN_AMOUNT_Y + dy);
    this.buyinConfirmButton?.setPosition?.(BUYIN_CONFIRM_X, BUYIN_BUTTON_Y + dy);
    this.buyinCancelButton?.setPosition?.(BUYIN_CANCEL_X, BUYIN_BUTTON_Y + dy);
  }

  _updateReportsScrollbar() {
    const contentH = this._reportsContentH;
    const scrollVisibleH = this._rptG?.scrollVisibleH ?? 756;
    const scrollTopY = this._rptG?.scrollTopY ?? 326;
    const hasScroll = contentH > scrollVisibleH;
    this.reportsScrollbarTrack?.setVisible(this.handReportsModalVisible && hasScroll);
    this.reportsScrollbarThumb?.setVisible(this.handReportsModalVisible && hasScroll);
    if (!hasScroll || !this.handReportsModalVisible) return;
    const thumbH = Math.max(40, (scrollVisibleH / contentH) * scrollVisibleH);
    const maxThumbY = scrollVisibleH - thumbH;
    const maxScroll = contentH - scrollVisibleH;
    const thumbOffset = maxScroll > 0 ? (this.reportsScrollY / maxScroll) * maxThumbY : 0;
    this.reportsScrollbarThumb.clear();
    this.reportsScrollbarThumb.fillStyle(0xffefb0, 0.95);
    this.reportsScrollbarThumb.fillRoundedRect(
      REPORTS_SCROLLBAR_X, scrollTopY + thumbOffset,
      REPORTS_SCROLLBAR_W, thumbH, 5,
    );
  }

  openSettingsModal() {
    this.settingsModalVisible = true;
    this.settingsOverlay?.setVisible(true);
    this.settingsPanelBorder?.setVisible(true);
    this.settingsPanelGfx?.setVisible(true);
    this.settingsTitleLabel?.setVisible(true);
    this.settingsTitleText?.setVisible(true);
    this.settingsCloseButton?.setVisible(true);
    this.settingsProfileButton?.setVisible(true);
  }

  closeSettingsModal() {
    this.settingsModalVisible = false;
    this.settingsOverlay?.setVisible(false);
    this.settingsPanelBorder?.setVisible(false);
    this.settingsPanelGfx?.setVisible(false);
    this.settingsTitleLabel?.setVisible(false);
    this.settingsTitleText?.setVisible(false);
    this.settingsCloseButton?.setVisible(false);
    this.settingsProfileButton?.setVisible(false);
  }

  openProfileEditorModal() {
    this.closeSettingsModal();
    this.profileEditorModal?.open?.(this.store.getState?.().user || {});
  }

  submitProfileUpdate(payload) {
    const nickname = String(payload?.nickname || "").trim();
    const avatar = toServerAvatarFrame(payload?.avatar);
    this.app.sendPacket("update_profile", { nickname, avatar });
  }

  showLogoutConfirm() {
    [
      this.logoutOverlay, this.logoutPanelBorder, this.logoutPanel,
      this.logoutTitleLabel, this.logoutTitleText, this.logoutMsgText,
    ].forEach(o => o?.setVisible(true));
    this.logoutConfirmBtn?.setVisible(true);
    this.logoutCancelBtn?.setVisible(true);
  }

  hideLogoutConfirm() {
    [
      this.logoutOverlay, this.logoutPanelBorder, this.logoutPanel,
      this.logoutTitleLabel, this.logoutTitleText, this.logoutMsgText,
    ].forEach(o => o?.setVisible(false));
    this.logoutConfirmBtn?.setVisible(false);
    this.logoutCancelBtn?.setVisible(false);
  }

  submitLogout() {
    this.app.sendPacket("logout", {});
    this.closeSettingsModal();
  }

  clearRows() {
    this.rowNodes.forEach((node) => node.destroy());
    this.rowNodes = [];
    this._roomContentH = 0;
    this._setRoomScrollY(0);
  }

  buildStakeBuyinModel(stake, walletBalanceRaw) {
    const minBuyin = Math.max(0, Math.floor(Number(stake?.min_buyin ?? 0)));
    const maxBuyin = Math.max(minBuyin, Math.floor(Number(stake?.max_buyin ?? minBuyin)));
    const walletBalance = Math.max(0, Math.floor(Number(walletBalanceRaw ?? 0)));
    const affordableMax = Math.min(maxBuyin, walletBalance);
    const canAffordMin = affordableMax >= minBuyin;
    const sliderMin = minBuyin;
    const sliderMax = canAffordMin ? affordableMax : Math.max(0, affordableMax);
    const initialSelectedAmount = canAffordMin ? sliderMax : sliderMax;
    return {
      minBuyin,
      maxBuyin,
      walletBalance,
      affordableMax,
      canAffordMin,
      sliderMin,
      sliderMax,
      isSliderMovable: canAffordMin && sliderMax > sliderMin,
      initialSelectedAmount,
    };
  }

  normalizeBuyinSelectedAmount(value, model) {
    if (!model) {
      return 0;
    }
    if (!model.canAffordMin) {
      return Math.max(0, Math.floor(Number(model.affordableMax ?? 0)));
    }
    const amount = Math.floor(Number(value));
    if (!Number.isFinite(amount)) {
      return model.sliderMin;
    }
    return Phaser.Math.Clamp(amount, model.sliderMin, model.sliderMax);
  }

  setBuyinSliderInteractive(enabled) {
    if (enabled) {
      this.buyinSliderHit.setInteractive({ useHandCursor: true });
      this.buyinSliderKnob.setInteractive({ useHandCursor: true });
      this.input.setDraggable(this.buyinSliderKnob, true);
    } else {
      this.buyinSliderHit.disableInteractive();
      this.buyinSliderKnob.disableInteractive();
    }
    this.buyinMinusBtn?.setEnabled(enabled);
    this.buyinPlusBtn?.setEnabled(enabled);
  }

  stepBuyinAmount(direction) {
    if (!this.buyinModalVisible || !this.buyinModel?.isSliderMovable) {
      return;
    }
    const { sliderMin, sliderMax } = this.buyinModel;
    const span = sliderMax - sliderMin;
    if (span <= 0) {
      return;
    }
    const step = Math.max(1, Math.round(span / 20));
    const next = this.buyinSelectedAmount + direction * step;
    this.buyinSelectedAmount = this.normalizeBuyinSelectedAmount(next, this.buyinModel);
    this.buyinAmountText.setText(this.formatAmount(this.buyinSelectedAmount));
    this.updateBuyinSliderVisual(this.buyinModel);
  }

  updateBuyinSliderVisual(model) {
    if (!model) {
      return;
    }
    const span = model.sliderMax - model.sliderMin;
    let progress = 0;
    if (model.canAffordMin && span > 0) {
      progress = (this.buyinSelectedAmount - model.sliderMin) / span;
    }
    progress = Phaser.Math.Clamp(progress, 0, 1);
    const fillWidth = Math.floor(BUYIN_SLIDER_TRACK_WIDTH * progress);
    const knobX = BUYIN_SLIDER_START_X + BUYIN_SLIDER_TRACK_WIDTH * progress;
    const _rfr = BUYIN_SLIDER_TRACK_HEIGHT / 2;
    this.buyinSliderFill.clear();
    if (fillWidth > 0) {
      this.buyinSliderFill.fillStyle(BUYIN_SLIDER_FILL_COLOR, 1);
      this.buyinSliderFill.fillRoundedRect(0, -_rfr, fillWidth, BUYIN_SLIDER_TRACK_HEIGHT, _rfr);
    }
    this.buyinSliderKnob.setPosition(knobX, BUYIN_SLIDER_Y + (this.modalDy || 0));
    const alpha = model.isSliderMovable ? 1 : 0.5;
    this.buyinSliderTrack.setAlpha(alpha);
    this.buyinSliderFill.setAlpha(alpha);
    this.buyinSliderKnob.setAlpha(alpha);
  }

  handleBuyinSliderPointer(pointerX) {
    if (!this.buyinModalVisible || !this.buyinModel?.isSliderMovable) {
      return;
    }
    const span = this.buyinModel.sliderMax - this.buyinModel.sliderMin;
    if (BUYIN_SLIDER_TRACK_WIDTH <= 0 || span <= 0) {
      return;
    }
    const progress = Phaser.Math.Clamp((Number(pointerX) - BUYIN_SLIDER_START_X) / BUYIN_SLIDER_TRACK_WIDTH, 0, 1);
    const nextAmount = Math.round(this.buyinModel.sliderMin + span * progress);
    this.buyinSelectedAmount = this.normalizeBuyinSelectedAmount(nextAmount, this.buyinModel);
    this.buyinAmountText.setText(this.formatAmount(this.buyinSelectedAmount));
    this.updateBuyinSliderVisual(this.buyinModel);
  }

  showBuyinModalForStake(stake) {
    if (!stake) {
      return;
    }
    this.buyinModalVisible = true;
    this.buyinStake = stake;
    this.buyinModel = this.buildStakeBuyinModel(stake, this.store.getState?.().walletBalance ?? 0);
    this.buyinSelectedAmount = this.normalizeBuyinSelectedAmount(this.buyinModel.initialSelectedAmount, this.buyinModel);
    this.renderBuyinModal();
  }

  closeBuyinModal() {
    this.buyinModalVisible = false;
    this.buyinStake = null;
    this.buyinModel = null;
    this.buyinSelectedAmount = 0;
    this.renderBuyinModal();
  }

  syncBuyinModalWithState(state) {
    if (!this.buyinModalVisible || !this.buyinStake) {
      return;
    }
    const currentStakes = Array.isArray(state?.gameLobby?.stakes) ? state.gameLobby.stakes : [];
    const currentStakeId = String(this.buyinStake?.stakes_id || this.buyinStake?.id || "");
    const latestStake = currentStakes.find((item) => String(item?.stakes_id || item?.id || "") === currentStakeId);
    if (!latestStake) {
      this.closeBuyinModal();
      return;
    }
    this.buyinStake = latestStake;
    this.buyinModel = this.buildStakeBuyinModel(latestStake, state?.walletBalance ?? 0);
    this.buyinSelectedAmount = this.normalizeBuyinSelectedAmount(this.buyinSelectedAmount, this.buyinModel);
  }

  confirmJoinStakes() {
    if (!this.buyinModalVisible || !this.buyinStake || !this.buyinModel?.canAffordMin) {
      return;
    }
    const stakesId = String(this.buyinStake.stakes_id || this.buyinStake.id || "");
    if (!stakesId) {
      return;
    }
    const buyin = this.normalizeBuyinSelectedAmount(this.buyinSelectedAmount, this.buyinModel);
    const currentGameId = String(this.store.getState?.()?.gameLobby?.game_id || "texas_holdem");
    // 流程：確認入桌後先進入「觀戰」狀態（帶入籌碼），不直接入座開局；
    // 玩家進桌後可任選空位 take_seat 坐下。
    this.app.sendPacket("join_stakes", {
      game_id: currentGameId,
      stakes_id: stakesId,
      mode: "spectator",
      buyin,
    });
    this.closeBuyinModal();
  }

  renderBuyinModal() {
    const visible = this.buyinModalVisible && Boolean(this.buyinStake);
    this.buyinOverlay.setVisible(visible);
    this.buyinPanelBorder?.setVisible(visible);
    this.buyinPanel.setVisible(visible);
    this.buyinTitleLabel?.setVisible(visible);
    this.buyinTitleText.setVisible(visible);
    this.buyinAmountBg?.setVisible(visible);
    this.buyinAmountText.setVisible(visible);
    this.buyinMinusBtn?.setVisible(visible);
    this.buyinPlusBtn?.setVisible(visible);
    this.buyinRangeText.setVisible(visible);
    this.buyinSliderTrack.setVisible(visible);
    this.buyinSliderFill.setVisible(visible);
    this.buyinSliderHit.setVisible(visible);
    this.buyinSliderKnob.setVisible(visible);
    this.buyinHintText.setVisible(visible);
    this.buyinConfirmButton.setVisible(visible);
    this.buyinCancelButton.setVisible(visible);

    if (!visible) {
      this.setBuyinSliderInteractive(false);
      return;
    }

    const model = this.buyinModel;
    if (!model) {
      this.closeBuyinModal();
      return;
    }

    this.buyinAmountText
      .setText(this.formatAmount(this.buyinSelectedAmount))
      .setColor(model.canAffordMin ? BUYIN_NUMBER_COLOR : BUYIN_NUMBER_ERROR_COLOR);
    this.buyinRangeText.setText(`範圍 ${this.formatAmount(model.minBuyin)} ~ ${this.formatAmount(model.maxBuyin)}`);
    if (model.canAffordMin) {
      this.buyinHintText
        .setText(`錢包餘額 ${this.formatAmount(model.walletBalance)}（拖動拉條選擇入桌）`)
        .setColor(BUYIN_HINT_COLOR);
    } else {
      this.buyinHintText
        .setText(`餘額不足：${this.formatAmount(model.walletBalance)} < 最低攜帶 ${this.formatAmount(model.minBuyin)}`)
        .setColor(BUYIN_HINT_ERROR_COLOR);
    }
    this.buyinConfirmButton.setEnabled(model.canAffordMin);
    this.buyinCancelButton.setEnabled(true);
    this.setBuyinSliderInteractive(model.isSliderMovable);
    this.updateBuyinSliderVisual(model);
  }

  openHandReportsModal() {
    this.handReportsModalVisible = true;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.setHandReportsModalVisible(true);
    this.reportsCloseButton?.setPosition?.(360, this._rptG?.closeY ?? 0);
    this.requestDailySettlement14d();
    try { sessionStorage.setItem("gameLobby_reportsModal", "1"); } catch {}
  }

  _reopenHandReportsModalAfterReplay() {
    this.handReportsModalVisible = true;
    this.setHandReportsModalVisible(true);
    this.reportsCloseButton?.setPosition?.(360, this._rptG?.closeY ?? 0);
    if (this.reportRowNodes.length === 0) {
      if (this.handReportsMode === "detail" && this.selectedReportDate) {
        this.requestHandReportsPage(this.handReportsOffset);
      } else {
        this.handReportsMode = "daily";
        this.selectedReportDate = "";
        this.requestDailySettlement14d();
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const _ov = document.getElementById('replay-exit-loading');
      if (_ov) { _ov._stopSprite?.(); _ov.style.display = 'none'; }
    }));
  }

  closeHandReportsModal() {
    this.handReportsModalVisible = false;
    this.handReportsLoading = false;
    this.handReportsRequestedOffset = null;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.clearReportRows();
    this.reportsListText?.setText("");
    this.reportsStatusText?.setText("");
    this.setHandReportsModalVisible(false);
    try { sessionStorage.removeItem("gameLobby_reportsModal"); } catch {}
  }

  setHandReportsModalVisible(visible) {
    this.reportsOverlay?.setVisible(visible);
    this.reportsPanelBorder?.setVisible(visible);
    this.reportsPanel?.setVisible(visible);
    this.reportsTitleLabel?.setVisible(visible);
    this.reportsTitleText?.setVisible(visible);
    this.reportsListText?.setVisible(visible);
    this.reportsStatusText?.setVisible(visible);
    this.reportsScrollContainer?.setVisible(visible);
    this.reportsBackButton?.setVisible(visible && this.handReportsMode === "detail");
    if (!visible) {
      this.reportsPrevButton?.setVisible(false);
      this.reportsNextButton?.setVisible(false);
    }
    this.reportsCloseButton?.setVisible(visible);
    if (!visible) {
      this.reportsScrollbarTrack?.setVisible(false);
      this.reportsScrollbarThumb?.setVisible(false);
      this.setReportsScrollY(0);
    }
  }

  requestDailySettlement14d() {
    this.handReportsLoading = true;
    if (this.handReportsModalVisible) {
      this.reportsStatusText.setText("讀取中...");
    }
    this.app.sendPacket("daily_settlement_14d", {
      game_code: "texas_holdem",
    });
  }

  showDailySettlementView() {
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.handReportsOffset = 0;
    const daily = this.store.getState?.().myDailySettlement14d;
    const items = Array.isArray(daily?.items) ? daily.items : [];
    this.renderDailySettlementItems(items);
  }

  openDailyReportDetails(reportDateRaw) {
    const reportDate = String(reportDateRaw || "").trim();
    if (!reportDate) {
      return;
    }
    this.handReportsMode = "detail";
    this.selectedReportDate = reportDate;
    this.handReportsOffset = 0;
    this.requestHandReportsPage(0);
  }

  requestHandReportsPage(offsetRaw) {
    if (!this.selectedReportDate) {
      return;
    }
    const offset = Math.max(0, Math.floor(Number(offsetRaw) || 0));
    this.handReportsRequestedOffset = offset;
    this.handReportsLoading = true;
    if (this.handReportsModalVisible) {
      this.reportsPrevButton?.setVisible(false);
      this.reportsNextButton?.setVisible(false);
    }
    this.app.sendPacket("hand_reports", {
      report_date: this.selectedReportDate,
      game_code: "texas_holdem",
      limit: REPORTS_LIMIT,
      offset,
    });
  }

  consumeHandReportsFromState(state) {
    if (this.handReportsMode !== "detail") {
      return;
    }
    const nextVersion = Number(state?.myHandReportsVersion ?? 0);
    if (nextVersion <= this.lastSeenHandReportsVersion) {
      return;
    }
    this.lastSeenHandReportsVersion = nextVersion;
    this.handReportsLoading = false;
    const reports = state?.myHandReports || {};
    const items = Array.isArray(reports?.items) ? reports.items : [];
    if (Number.isFinite(Number(this.handReportsRequestedOffset))) {
      this.handReportsOffset = Number(this.handReportsRequestedOffset);
    }
    this.handReportsRequestedOffset = null;
    this.renderHandReportsItems(items);
  }

  consumeDailySettlementFromState(state) {
    if (this.handReportsMode !== "daily") {
      return;
    }
    const nextVersion = Number(state?.myDailySettlement14dVersion ?? 0);
    if (nextVersion <= this.lastSeenDailySettlementVersion) {
      return;
    }
    this.lastSeenDailySettlementVersion = nextVersion;
    this.handReportsLoading = false;
    const daily = state?.myDailySettlement14d || {};
    const items = Array.isArray(daily?.items) ? daily.items : [];
    this.renderDailySettlementItems(items);
  }

  renderDailySettlementItems(items) {
    if (!this.handReportsModalVisible) {
      return;
    }
    this.clearReportRows();
    this.reportsTitleText.setText("最近14天報表總結");
    this.reportsStatusText.setText(items.length > 0 ? `共 ${items.length} 天` : "");
    this.reportsBackButton?.setVisible(false);
    this.reportsPrevButton?.setVisible(false);
    this.reportsNextButton?.setVisible(false);
    this.reportsCloseButton?.setPosition?.(360, this._rptG?.closeY ?? 0);
    this.reportsListText.setText("");
    if (items.length <= 0) {
      this.reportsListText.setText("目前沒有資料");
      return;
    }
    const showItems = [...items]
      .sort((a, b) => String(b?.report_date ?? "").localeCompare(String(a?.report_date ?? "")))
      .slice(0, 14);
    this._reportsContentH = showItems.length * REPORTS_ROW_GAP;
    showItems.forEach((item, index) => {
      const localY = index * REPORTS_ROW_GAP + REPORTS_ROW_GAP / 2;
      const reportDate = String(item?.report_date || "-");
      const handCount = Number(item?.hand_count ?? 0);
      const net = Number(item?.total_net_amount ?? 0);
      const netColor = net > 0 ? "#62d26f" : (net < 0 ? "#ff6b6b" : REPORTS_TEXT_COLOR);

      const stripe = this.add.graphics();
      stripe.fillStyle(0xffffff, index % 2 === 0 ? 0.07 : 0.02);
      stripe.fillRect(60, index * REPORTS_ROW_GAP, 600, REPORTS_ROW_GAP);
      this.reportsScrollContainer.add(stripe);

      const dateText = this.add
        .text(REPORTS_DAILY_COL_DATE_X, localY, reportDate, {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "26px",
          color: "#9ad0ff",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);
      this.reportsScrollContainer.add(dateText);

      const handText = this.add
        .text(REPORTS_DAILY_COL_HAND_X, localY, `${handCount} 手`, {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "26px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);
      this.reportsScrollContainer.add(handText);

      const netText = this.add
        .text(REPORTS_DAILY_COL_NET_X, localY, this.formatSignedAmount(net), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "26px",
          color: netColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);
      this.reportsScrollContainer.add(netText);

      const _vbW = 76, _vbH = 38, _vbX = REPORTS_DAILY_COL_VIEW_X;
      const _vbGfx = this.add.graphics({ x: _vbX, y: localY });
      const _drawVb = (hover) => {
        _vbGfx.clear();
        _vbGfx.fillGradientStyle(
          hover ? 0x2a6aa0 : 0x1a4870, hover ? 0x2a6aa0 : 0x1a4870,
          hover ? 0x0d3a6a : 0x071e38, hover ? 0x0d3a6a : 0x071e38,
          1, 1, 1, 1,
        );
        _vbGfx.fillRect(-_vbW / 2, -_vbH / 2, _vbW, _vbH);
        _vbGfx.lineStyle(1.5, hover ? 0x7ad4ff : 0x3a8abf, 1);
        _vbGfx.strokeRoundedRect(-_vbW / 2, -_vbH / 2, _vbW, _vbH, 8);
      };
      _drawVb(false);
      this.reportsScrollContainer.add(_vbGfx);
      const _vbLabel = this.add
        .text(_vbX - 10, localY, "查看", {
          fontFamily: REPORTS_FONT_FAMILY, fontSize: "20px",
          color: "#c8e8ff", fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);
      this.reportsScrollContainer.add(_vbLabel);
      const _vbArrow = this.add
        .text(_vbX + 25, localY + 1, "▶", {
          fontFamily: REPORTS_FONT_FAMILY, fontSize: "13px", color: "#5ab8e8",
        })
        .setOrigin(0.5, 0.5);
      this.reportsScrollContainer.add(_vbArrow);
      const _vbZone = this.add.zone(_vbX, localY, _vbW + 16, _vbH + 12)
        .setInteractive({ useHandCursor: true });
      _vbZone.on("pointerover", () => {
        _drawVb(true); _vbLabel.setColor("#ffffff"); _vbArrow.setColor("#8ad4ff");
      });
      _vbZone.on("pointerout", () => {
        _drawVb(false); _vbLabel.setColor("#c8e8ff"); _vbArrow.setColor("#5ab8e8");
      });
      _vbZone.on("pointerdown", (ptr) => {
        const g = this._rptG;
        const wy = ptr.y / (this.cameras.main.zoom || 1);
        if (!g || wy < g.scrollTopY || wy > g.scrollBottomY) return;
        this.playSfx();
        this.openDailyReportDetails(reportDate);
      });
      this.reportsScrollContainer.add(_vbZone);
    });
    this._updateReportsScrollbar();
  }

  renderHandReportsItems(items) {
    if (!this.handReportsModalVisible) {
      return;
    }
    this.clearReportRows();
    this.handReportsLastCount = items.length;
    const _pageNum = Math.floor(this.handReportsOffset / REPORTS_LIMIT) + 1;
    this.reportsTitleText.setText(`當日明細 ${this.selectedReportDate}`);
    this.reportsStatusText.setText(items.length > 0 ? `第 ${_pageNum} 頁，共 ${items.length} 筆` : "");
    this.reportsBackButton?.setVisible(true);
    const _hasPrev = this.handReportsOffset > 0;
    const _hasNext = items.length >= REPORTS_LIMIT;
    this.reportsPrevButton?.setVisible(_hasPrev);
    this.reportsNextButton?.setVisible(_hasNext);
    this.reportsCloseButton?.setPosition?.(490, this._rptG?.closeY ?? 0);
    if (items.length <= 0) {
      this.reportsListText.setText("目前沒有資料");
      return;
    }
    this.reportsListText.setText("");
    const showItems = items.slice(0, REPORTS_MAX_ROWS);
    this._reportsContentH = showItems.length * REPORTS_ROW_GAP;
    showItems.forEach((item, index) => {
      const localY = index * REPORTS_ROW_GAP + REPORTS_ROW_GAP / 2;

      const stripe = this.add.graphics();
      stripe.fillStyle(0xffffff, index % 2 === 0 ? 0.07 : 0.02);
      stripe.fillRect(60, index * REPORTS_ROW_GAP, 600, REPORTS_ROW_GAP);
      this.reportsScrollContainer.add(stripe);

      const timeText = this.add
        .text(REPORTS_COL_TIME_X, localY, this.formatReportTime(item?.ended_at), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "23px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);
      this.reportsScrollContainer.add(timeText);

      const rankText = this.add
        .text(REPORTS_COL_RANK_X, localY, this.resolveHandRankZh(item?.hand_rank), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "23px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);
      this.reportsScrollContainer.add(rankText);

      const netValue = Number(item?.net_amount ?? 0);
      const netColor = netValue > 0 ? "#62d26f" : (netValue < 0 ? "#ff6b6b" : REPORTS_TEXT_COLOR);
      const netText = this.add
        .text(REPORTS_COL_NET_X, localY, this.formatSignedAmount(netValue), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "23px",
          color: netColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);
      this.reportsScrollContainer.add(netText);

      const cards = this.parseBest5Cards(item);
      cards.forEach((card, cardIndex) => {
        const frame = this.normalizeCardFrameKey(card);
        if (!frame || !this.textures.get("playing_cards_element")?.has(frame)) {
          return;
        }
        const cardImage = this.add
          .image(
            REPORTS_COL_CARDS_X + cardIndex * (REPORTS_CARD_WIDTH + REPORTS_CARD_GAP),
            localY,
            "playing_cards_element",
            frame,
          )
          .setDisplaySize(REPORTS_CARD_WIDTH, REPORTS_CARD_HEIGHT)
          .setOrigin(0, 0.5);
        this.reportsScrollContainer.add(cardImage);
      });

      const _rbW = REPORTS_REPLAY_BTN_WIDTH;
      const _rbH = REPORTS_REPLAY_BTN_HEIGHT;
      const replayGfx = this.add.graphics();
      replayGfx.setPosition(REPORTS_COL_REPLAY_X, localY);
      replayGfx.fillStyle(0x256b12, 1);
      replayGfx.fillRoundedRect(-_rbW / 2, -_rbH / 2, _rbW, _rbH, 6);
      replayGfx.lineStyle(1.5, 0x1aed30, 0.9);
      replayGfx.strokeRoundedRect(-_rbW / 2, -_rbH / 2, _rbW, _rbH, 6);
      replayGfx.setInteractive(
        new Phaser.Geom.Rectangle(-_rbW / 2, -_rbH / 2, _rbW, _rbH),
        Phaser.Geom.Rectangle.Contains,
      );
      replayGfx.on("pointerdown", () => {
        playUiClick(this);
        replayGfx.setAlpha(0.65);
      });
      replayGfx.on("pointerup", () => {
        replayGfx.setAlpha(1);
        const packet = {
          type: "hand_replay",
          data: {
            game_code: "texas_holdem",
            table_id: String(item?.table_id ?? ""),
            hand_id: Number(item?.hand_id ?? 0),
          },
        };
        console.log("[hand_replay]", packet);
        this.app.sendPacket(packet.type, packet.data);
      });
      replayGfx.on("pointerout", () => replayGfx.setAlpha(1));
      const replayTxt = this.add
        .text(REPORTS_COL_REPLAY_X, localY, "回放", {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.reportsScrollContainer.add(replayGfx);
      this.reportsScrollContainer.add(replayTxt);
    });
    this._updateReportsScrollbar();
  }

  clearReportRows() {
    this.reportsScrollContainer?.removeAll(true);
    this.reportRowNodes = [];
    this.setReportsScrollY(0);
  }

  formatSignedAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return "0";
    }
    if (num > 0) {
      return `+${this.formatAmount(num)}`;
    }
    if (num < 0) {
      return `-${this.formatAmount(Math.abs(num))}`;
    }
    return "0";
  }

  formatReportTime(value) {
    const timeMs = Number(value);
    if (Number.isFinite(timeMs) && timeMs > 0) {
      const date = new Date(timeMs);
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    const text = String(value || "").trim();
    if (!text) {
      return "-";
    }
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
      return text.slice(0, 16);
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  normalizeCardFrameKey(cardRaw) {
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

  parseBest5Cards(item) {
    const fromBest5 = Array.isArray(item?.best5) ? item.best5 : null;
    if (fromBest5 && fromBest5.length > 0) {
      return fromBest5.slice(0, 5);
    }
    const raw = item?.best5_json;
    if (Array.isArray(raw)) {
      return raw.slice(0, 5);
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      } catch {}
    }
    return [];
  }

  resolveHandRankZh(rankRaw) {
    const key = String(rankRaw || "").toLowerCase();
    if (!key) {
      return "-";
    }
    const map = {
      high_card: "高牌",
      one_pair: "一對",
      two_pair: "兩對",
      three_of_a_kind: "三條",
      straight: "順子",
      flush: "同花",
      full_house: "葫蘆",
      four_of_a_kind: "鐵支",
      straight_flush: "同花順",
      royal_flush: "皇家同花順",
    };
    return map[key] || key;
  }

  renderState(state) {
    this.consumeDailySettlementFromState(state);
    this.consumeHandReportsFromState(state);
    this.renderProfileInfo(state);

    const stakes = Array.isArray(state.gameLobby?.stakes) ? state.gameLobby.stakes : [];
    this.clearRows();

    if (this.emptyHint) {
      this.emptyHint.destroy();
      this.emptyHint = null;
    }

    if (stakes.length === 0) {
      this.emptyHint = this.add
        .text(360, 760, "目前無可入桌盲注", {
          fontFamily: UI_FONT_STACK,
          fontSize: "32px",
          color: "#ecd5b5",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.roomScrollContainer.add(this.emptyHint);
      this.syncBuyinModalWithState(state);
      this.renderBuyinModal();
      return;
    }

    const guardDrag = (fn) => () => { if (!this._roomIsDragging) fn(); };

    stakes.forEach((stake, index) => {
      const stakesId = stake.stakes_id || stake.id || "";
      if (!stakesId) {
        return;
      }
      const config = ROOM_CONFIGS[index] ?? { label: "label_blue", token: "token_blue_glow", name: `場次 ${index + 1}` };
      const cardY = ROOM_CARD_START_Y + index * ROOM_CARD_GAP;

      const cardBg = this.add
        .image(ROOM_CARD_CENTER_X, cardY, "Lobby", config.label)
        .setDisplaySize(ROOM_CARD_DISPLAY_W, ROOM_CARD_DISPLAY_H);
      this.roomScrollContainer.add(cardBg);

      const tokenImg = this.add
        .image(ROOM_CARD_CENTER_X - 240, cardY, "Lobby", config.token)
        .setDisplaySize(155, 155);
      this.roomScrollContainer.add(tokenImg);

      const nameText = this.add
        .text(ROOM_CARD_CENTER_X - 150, cardY - 36, config.name, {
          fontFamily: UI_FONT_STACK,
          fontSize: "32px",
          fontStyle: "bold",
          color: "#f8bb3e",
          stroke: "#000000",
          strokeThickness: 1,
          shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 6, fill: true },
        })
        .setOrigin(0, 0.5);
      const ng = nameText.context.createLinearGradient(0, 0, 0, nameText.height);
      ng.addColorStop(0, "#f7e59e"); ng.addColorStop(1, "#f8bb3e");
      nameText.setFill(ng);
      this.roomScrollContainer.add(nameText);

      const currentGameId2 = String(this.store.getState?.()?.gameLobby?.game_id || "texas_holdem");
      const blindLabel = currentGameId2 === "big_two"
        ? `底分 ${this.formatAmount(stake.base_score ?? stake.small_blind ?? 0)}`
        : `${this.formatAmount(stake.small_blind)} / ${this.formatAmount(stake.big_blind)}`;
      const blindText = this.add
        .text(ROOM_CARD_CENTER_X - 150, cardY + 2, blindLabel, {
          fontFamily: UI_FONT_STACK,
          fontSize: "28px",
          fontStyle: "bold",
          color: "#f8bb3e",
          stroke: "#000000",
          strokeThickness: 1,
          shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 6, fill: true },
        })
        .setOrigin(0, 0.5);
      const bg = blindText.context.createLinearGradient(0, 0, 0, blindText.height);
      bg.addColorStop(0, "#f7e59e"); bg.addColorStop(1, "#f8bb3e");
      blindText.setFill(bg);
      this.roomScrollContainer.add(blindText);

      const minBuyin = this.formatAmount(stake.min_buyin);
      const maxBuyin = this.formatAmount(stake.max_buyin);
      const buyinText = this.add
        .text(ROOM_CARD_CENTER_X - 150, cardY + 38, `攜帶 ${minBuyin}~${maxBuyin}`, {
          fontFamily: UI_FONT_STACK,
          fontSize: "22px",
          color: "#f8bb3e",
          shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 6, fill: true },
        })
        .setOrigin(0, 0.5);
      const byg = buyinText.context.createLinearGradient(0, 0, 0, buyinText.height);
      byg.addColorStop(0, "#f7e59e"); byg.addColorStop(1, "#f8bb3e");
      buyinText.setFill(byg);
      this.roomScrollContainer.add(buyinText);

      const enterBtn = this.add.image(ROOM_CARD_CENTER_X + 228, cardY - 16, "Lobby", "enter_btn").setDisplaySize(142, 62);
      bindImageButton(this, enterBtn, { playClick: false, onClick: guardDrag(() => { this.playSfx(); this.showBuyinModalForStake(stake); }) });
      this.roomScrollContainer.add(enterBtn);

      const playerCount = stake.player_count ?? 0;
      const maxPlayers = stake.max_players ?? 200;
      const humanIcon = this.add.image(ROOM_CARD_CENTER_X + 196, cardY + 48, "Lobby", "human_number_icon").setDisplaySize(22, 22);
      this.roomScrollContainer.add(humanIcon);
      const playerCountText = this.add.text(ROOM_CARD_CENTER_X + 210, cardY + 48, `${playerCount}/${maxPlayers}`, {
        fontFamily: UI_FONT_STACK,
        fontSize: "20px",
        color: "#f8bb3e",
      }).setOrigin(0, 0.5);
      this.roomScrollContainer.add(playerCountText);

      this.rowNodes.push(cardBg, tokenImg, nameText, blindText, buyinText, enterBtn, humanIcon, playerCountText);
    });

    this._roomContentH = ROOM_CARD_START_Y + (stakes.length - 1) * ROOM_CARD_GAP + ROOM_CARD_DISPLAY_H / 2 + 80;
    this._setRoomScrollY(this.roomScrollY);

    this.syncBuyinModalWithState(state);
    this.renderBuyinModal();
  }

  // 查詢玩家進度（get_my_progress，§7.4）。回應 my_progress_ok 會更新 user.progress_summary，
  // 由 renderProfileInfo 重繪統計面板（等級/場次/勝率/贏場）。於進大廳/喚醒時呼叫。
  _refreshMyProgress() {
    const send = () => {
      const gid = String(this.store.getState?.()?.gameLobby?.game_id || "texas_holdem");
      this.app.sendPacket?.("get_my_progress", { game_id: gid });
    };
    send();
    // The backend commits per-hand progress a few seconds after the hand ends (measured ~5s on a
    // 結束→lobby return), longer than a single retry can cover — so the create/wake-time query reads
    // stale numbers and the 場次/勝率/贏場 panel lags a hand until a full re-entry. Stagger a few
    // re-queries across the observed commit window so the panel self-heals in place, without a
    // re-entry. Shared lobby → applies to poker + Big Two alike (does not touch tableScene.js).
    // Best-effort backstop; the proper fix is a backend progress push (see
    // LOBBY_PROGRESS_BACKEND_REQUESTS.md). Scene time events auto-cancel on shutdown.
    (this._progressRetryTimers || []).forEach((t) => t?.remove?.());
    this._progressRetryTimers = [1500, 3500, 6000].map((ms) =>
      this.time.delayedCall(ms, send),
    );
  }

  renderProfileInfo(state) {
    const user = state?.user || {};
    const rawName = String(user.nickname || user.display_name || user.username || "");
    const displayName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    this.nicknameText.setText(displayName);
    const _raw = String(user.avatar || "");
    const _m = _raw.match(/^avatar_0*(\d+)$/i);
    const avatarFrame = _m ? `avatar_${Number(_m[1])}` : "avatar_1";
    const avatarAtlas = this.textures.get("avatar_element");
    const resolvedAvatarFrame = avatarAtlas?.has(avatarFrame) ? avatarFrame : "avatar_1";
    this.avatarImage.setFrame(resolvedAvatarFrame);
    this.walletText.setText(this.formatAmount(state.walletBalance));
    if (this.addOnBtn) {
      this.addOnBtn.x = this.walletText.x + this.walletText.width + 15 + this.addOnBtn.displayWidth / 2;
    }

    // 統計面板（等級/場次/勝率/贏場）：直接讀伺服器已帶入的 progress_summary（login_ok/auth_ok 於啟動即送、
    // 存於 state.user）。此為全域摘要（跨所有遊戲）；純顯示，不另發查詢。
    const ps = user.progress_summary;
    if (ps) {
      this._setStatValue("level", `Lv.${Number(ps.level ?? 1)}`);
      this._setStatValue("hands", String(Number(ps.hands_played ?? 0)));
      this._setStatValue("winRate", `${Math.round(Number(ps.win_rate ?? 0) * 100)}%`);
      this._setStatValue("wins", String(Number(ps.wins ?? 0)));
    }
  }

  // 更新單一統計數值文字並重套金色漸層（值相同則跳過）。
  _setStatValue(key, text) {
    const t = this._statValueTexts?.[key];
    if (!t || t.text === text) return;
    t.setText(text);
    const g = t.context.createLinearGradient(0, 0, 0, t.height);
    g.addColorStop(0, "#f7e59e");
    g.addColorStop(1, "#f8bb3e");
    t.setFill(g);
  }

  formatAmount(value) {
    return Number(value).toLocaleString("zh-TW");
  }

  showUnderConstruction() {
    this.store.applyPacket({
      type: "error",
      data: {
        code: "FEATURE_UNDER_CONSTRUCTION",
        message: "正在施工中",
      },
    });
  }
}







