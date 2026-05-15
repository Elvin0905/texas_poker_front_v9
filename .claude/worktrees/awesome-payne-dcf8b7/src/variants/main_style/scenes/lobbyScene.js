import { bindImageButton, createGradientButton, drawEnhancedBorder, applyGoldTitleGradient, playUiClick } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { ProfileEditorModal, toServerAvatarFrame } from "../ui/profileEditorModal.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const GAME_BUTTON_LAYOUT = {
  texas_holdem: { x: 203, y: 812, frame: "texas",    displayW: 316, displayH: 608 },
  big_two:      { x: 530, y: 665, frame: "bigboss2", displayW: 305, displayH: 317 },
  blackjack:    { x: 530, y: 975, frame: "21poker",  displayW: 305, displayH: 289 },
};
const PAGE_DRAG_THRESHOLD = 8;
const PAGE_CONTENT_H = 1355;

const DISABLED_TINT = 0x666666;
const INFO_TEXT_STYLE = {
  fontFamily: "sans-serif",
  fontSize: "34px",
  color: "#F9CD73",
  fontStyle: "bold",
};

const REPORTS_LIMIT = 10;
const REPORTS_OVERLAY_DEPTH = 222;
const REPORTS_PANEL_DEPTH = 223;
const REPORTS_TEXT_DEPTH = 224;
const REPORTS_OVERLAY_COLOR = 0x000000;
const REPORTS_OVERLAY_ALPHA = 0.62;
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
const REPORTS_COL_REPLAY_X = 630;
const REPORTS_REPLAY_BTN_WIDTH = 64;
const REPORTS_REPLAY_BTN_HEIGHT = 36;
const REPORTS_CARD_WIDTH = 30;
const REPORTS_CARD_HEIGHT = 42;
const REPORTS_CARD_GAP = 5;
const REPORTS_PREV_X = 195;
const REPORTS_NEXT_X = 525;
const REPORTS_BTN_WIDTH = 140;
const REPORTS_BTN_HEIGHT = 58;
const REPORTS_ARROW_BTN_WIDTH = 110;
const REPORTS_DAILY_COL_DATE_X = 90;
const REPORTS_DAILY_COL_HAND_X = 315;
const REPORTS_DAILY_COL_NET_X = 475;
const REPORTS_DAILY_COL_VIEW_X = 600;

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super("lobby");
    this.gameButtons = [];
    this.emptyHint = null;
    this.settingsModalVisible = false;
    this.handReportsModalVisible = false;
    this.handReportsOffset = 0;
    this.handReportsRequestedOffset = null;
    this.handReportsLoading = false;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.lastSeenHandReportsVersion = 0;
    this.lastSeenDailySettlementVersion = 0;
    this.reportRowNodes = [];
    this.reportsScrollY = 0;
    this._reportsContentH = 0;
    this.soundSettingsPanel = null;
  }

  create() {
    this.useResponsiveLayout = true;
    this.app = window.__APP__;
    this.store = this.app.store;

    this.cameras.main.setBackgroundColor('#1a0b05');
    this.bgImage = this.add.image(layout.centerX, layout.centerY, "Lobby", "Lobby_bg").setDisplaySize(layout.width, layout.height);

    // Page scroll container — created first so all static content can be added as it's built
    this._pageScrollY = 0;
    this._pageContentH = PAGE_CONTENT_H;
    this.gameButtonData = [];
    this._pageScrollVisibleH = 0;
    this._pageIsDragging = false;
    this._pageDragStartY = null;
    this._pageDragStartScrollY = 0;
    this._pageVelSamples = [];
    this._pageMomentumVel = 0;
    this.pageScrollContainer = this.add.container(0, 0);
    this._pageMaskGfx = this.make.graphics({ add: false });
    this._refreshPageMask();
    this.pageScrollContainer.setMask(this._pageMaskGfx.createGeometryMask());

    // Animated logo
    this.textures.get("logo").setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.logoSprite = this.add.sprite(360, 154, "logo", "logo0.png").setDisplaySize(528, 248);
    this._logoFrame = 0;
    this._logoElapsed = 0;
    this.pageScrollContainer.add(this.logoSprite);

    this.bgm = this.sound.get("bgm_main");
    if (!this.bgm && this.cache.audio.exists("bgm_main")) {
      this.bgm = this.sound.add("bgm_main", {
        loop: true,
        volume: 0.2,
      });
    }

    const syncBgmByState = () => {
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

    const INFO_Y = 364;
    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: 462,
      buttonY: INFO_Y - 10,
      onSettingsChanged: () => {
        syncBgmByState();
      },
    });
    this.soundSettingsPanel.triggerButton.setDisplaySize(80, 80);
    this.pageScrollContainer.add(this.soundSettingsPanel.triggerButton);
    const _musicLabel = this.add.text(462, INFO_Y + 46, "音樂", {
      fontFamily: "sans-serif", fontSize: "20px", color: "#ecd5b5", fontStyle: "bold",
    }).setOrigin(0.5);
    this.pageScrollContainer.add(_musicLabel);
    syncBgmByState();

    // Top info bar
    this.pageScrollContainer.add(this.add.image(251, INFO_Y, "Lobby", "info_label").setDisplaySize(365, 159).setCrop(2, 3, 697, 300));
    this.pageScrollContainer.add(this.add.graphics({ x: 81, y: INFO_Y }).fillStyle(0x1c0508, 1).fillCircle(0, 0, 60));
    this.avatarImage = this.add.image(81, INFO_Y, "avatar_element", "avatar_1").setDisplaySize(120, 120);
    this.pageScrollContainer.add(this.avatarImage);
    this.pageScrollContainer.add(this.add.image(81, INFO_Y, "game_table", "profile_frame_on").setDisplaySize(168, 168));
    this.nicknameText = this.add.text(165, INFO_Y - 18, "-", {
      fontFamily: "sans-serif", fontSize: "30px", fontStyle: "bold", color: "#ffc000",
    }).setOrigin(0, 0.5);
    this.pageScrollContainer.add(this.nicknameText);
    this.pageScrollContainer.add(this.add.image(177, INFO_Y + 18, "Lobby", "coin").setDisplaySize(26, 26));
    this.walletText = this.add.text(197, INFO_Y + 18, "--", {
      fontFamily: "sans-serif", fontSize: "26px", fontStyle: "bold", color: "#F9CD73",
    }).setOrigin(0, 0.5);
    this.pageScrollContainer.add(this.walletText);
    this.addOnBtn = this.add.image(343, INFO_Y + 18, "choose_game", "add on").setDisplaySize(37, 38);
    bindImageButton(this, this.addOnBtn, { onClick: () => { if (!this._pageIsDragging) this.showUnderConstruction(); } });
    this.pageScrollContainer.add(this.addOnBtn);

    const settingIcon = this.add.image(648, INFO_Y - 10, "choose_game", "setting_btn").setDisplaySize(76, 78);
    bindImageButton(this, settingIcon, { onClick: () => { if (!this._pageIsDragging) this.openSettingsModal(); } });
    this.pageScrollContainer.add(settingIcon);
    const _settingLabel = this.add.text(648, INFO_Y + 46, "設定", {
      fontFamily: "sans-serif", fontSize: "20px", color: "#ecd5b5", fontStyle: "bold",
    }).setOrigin(0.5);
    this.pageScrollContainer.add(_settingLabel);
    const promoIcon = this.add.image(554, INFO_Y - 10, "choose_game", "promo_btn").setDisplaySize(78, 80);
    bindImageButton(this, promoIcon, { onClick: () => { if (!this._pageIsDragging) this.showUnderConstruction(); } });
    this.pageScrollContainer.add(promoIcon);
    const _promoLabel = this.add.text(554, INFO_Y + 46, "優惠", {
      fontFamily: "sans-serif", fontSize: "20px", color: "#ecd5b5", fontStyle: "bold",
    }).setOrigin(0.5);
    this.pageScrollContainer.add(_promoLabel);

    // "選擇遊戲" section header
    this._chooseBorderLeft = this.add.image(170, 464, "Lobby", "title_border_left").setDisplaySize(205, 33).setCrop(2, 2, 213, 31);
    this.pageScrollContainer.add(this._chooseBorderLeft);
    this._chooseTitleText = this.add.text(360, 464, "選擇遊戲", {
      fontFamily: "sans-serif", fontSize: "38px", fontStyle: "bold",
      color: "#f7e59e",
      shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 6, fill: true },
    }).setOrigin(0.5);
    const _ctg = this._chooseTitleText.context.createLinearGradient(0, 0, 0, this._chooseTitleText.height);
    _ctg.addColorStop(0, "#f7e59e");
    _ctg.addColorStop(1, "#f8bb3e");
    this._chooseTitleText.setFill(_ctg);
    this.pageScrollContainer.add(this._chooseTitleText);
    this._chooseBorderRight = this.add.image(550, 464, "Lobby", "title_border_right").setDisplaySize(205, 33).setCrop(2, 2, 213, 31);
    this.pageScrollContainer.add(this._chooseBorderRight);

    // Ads banner — inside scroll container so swiping it scrolls the page
    this.adsBanner = this.add.image(360, 1210, "choose_game", "ads").setDisplaySize(666, 130);
    this.pageScrollContainer.add(this.adsBanner);

    const bot = layout.bottom;
    const sab = layout.safeAreaBottom;
    const NAV_DEPTH = 10;

    // Bottom navigator bar（anchor 到 viewport 底部，並預留設備底部安全區域）
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
        fontFamily: "sans-serif", fontSize: "24px", color: "#ecd5b5",
      }).setOrigin(0.5).setDepth(NAV_DEPTH + 1);
      const hit = this.add.rectangle(x, bot - 70 - sab, 110, 120, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", onClick)
        .setDepth(NAV_DEPTH + 2);
      this.navItems.push({ icon, label: labelText, hit, x });
    });
    this.middleIcon = this.add.image(360, bot - 122 - sab, "Lobby", "middle_icon").setDisplaySize(118, 128).setDepth(NAV_DEPTH + 1);
    this.middleLabel = this.add.text(360, bot - 40 - sab, "登出", {
      fontFamily: "sans-serif", fontSize: "24px", color: "#ecd5b5",
    }).setOrigin(0.5).setDepth(NAV_DEPTH + 1);
    let _midPressed = false;
    this.middleHit = this.add.rectangle(360, bot - 105 - sab, 125, 175, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { _midPressed = true; })
      .on("pointerout", () => { _midPressed = false; })
      .on("pointerup", () => {
        const wasPressed = _midPressed; _midPressed = false;
        if (wasPressed && !this._pageIsDragging) { this.playSfx(); this.showLogoutConfirm(); }
      })
      .setDepth(NAV_DEPTH + 2);

    this.settingsOverlay = this.add
      .rectangle(layout.centerX, layout.centerY, 4000, 4000, 0x000000, 0.56)
      .setDepth(222)
      .setVisible(false);
    this.settingsOverlay.setInteractive({ useHandCursor: false });
    this.settingsOverlay.on("pointerdown", () => {});
    this.settingsOverlay.on("pointerup", () => this.closeSettingsModal());

    this.settingsPanel = this.add
      .rectangle(layout.centerX, layout.centerY, 540, 260, 0x13283a, 0.98)
      .setDepth(223).setVisible(false);
    this.settingsPanel.setInteractive({ useHandCursor: false });
    this.settingsPanel.on("pointerdown", () => {});
    this.settingsPanel.on("pointerup", () => {});

    this.settingsTitleText = this.add
      .text(layout.centerX, layout.centerY - 60, "設定", {
        fontFamily: "sans-serif",
        fontSize: "36px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(224)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.settingsTitleText);

    this.settingsProfileButton = createGradientButton(this, {
      x: layout.centerX, y: layout.centerY + 30,
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

    // Logout confirm dialog — matches gameLobbyScene style
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
      fontFamily: "sans-serif", fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(LOGOUT_DEPTH + 3).setVisible(false);
    applyGoldTitleGradient(this.logoutTitleText);

    this.logoutMsgText = this.add.text(_logoutPanelX, _logoutPanelY - 22, "確定要登出嗎？", {
      fontFamily: "sans-serif", fontSize: "28px", color: "#ecd5b5",
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

    this._pagePointerDown = (ptr) => {
      if (this.handReportsModalVisible || this.settingsModalVisible) return;
      const py = ptr.y;
      if (py > layout.bottom - 138 - layout.safeAreaBottom) return;
      this._pageDragStartY = py;
      this._pageDragStartScrollY = this._pageScrollY;
      this._pageIsDragging = false;
    };
    this._pagePointerMove = (ptr) => {
      if (this._nativeScrollActive) return; // native touch handles mobile
      if (this._pageDragStartY === null || !ptr.isDown) return;
      const dy = ptr.y - this._pageDragStartY;
      if (!this._pageIsDragging && Math.abs(dy) > PAGE_DRAG_THRESHOLD) {
        this._pageIsDragging = true;
        this._pageDragStartY = ptr.y;
        this._pageDragStartScrollY = this._pageScrollY;
        this._pageVelSamples = [];
        this.pageScrollContainer?.list?.forEach(c => { if (c?.input?.enabled) c.emit('pointerout'); });
      }
      if (this._pageIsDragging) {
        const now = performance.now();
        this._pageVelSamples.push({ t: now, y: ptr.y });
        while (this._pageVelSamples.length > 1 && now - this._pageVelSamples[0].t > 80) {
          this._pageVelSamples.shift();
        }
        this._setPageScrollY(this._pageDragStartScrollY - (ptr.y - this._pageDragStartY));
      }
    };
    this._pagePointerUp = () => {
      if (this._nativeScrollActive) return;
      const samples = this._pageVelSamples;
      if (samples.length >= 2) {
        const first = samples[0], last = samples[samples.length - 1];
        const dt = last.t - first.t;
        if (dt > 0) {
          const vel = (last.y - first.y) / dt;
          this._pageMomentumVel = Phaser.Math.Clamp(-vel * 6, -22, 22);
        }
      }
      this._pageVelSamples = [];
      this._pageDragStartY = null;
      this.time.delayedCall(50, () => { this._pageIsDragging = false; });
    };
    this.input.on("pointerdown", this._pagePointerDown, this);
    this.input.on("pointermove", this._pagePointerMove, this);
    this.input.on("pointerup", this._pagePointerUp, this);

    // Native touch for zero-latency mobile scroll (bypasses Phaser's per-frame input queue)
    this._nativeScrollActive = false;
    this._nativeScrollStartClientY = 0;
    this._nativeScrollStartScrollY = 0;
    this._nativeScrollToWorld = 1;
    const _canvas = this.game.canvas;
    this._nativeTouchStart = (e) => {
      if (this.handReportsModalVisible || this.settingsModalVisible) return;
      if (!e.touches.length) return;
      const cam = this.cameras.main;
      const rect = _canvas.getBoundingClientRect();
      const toWorld = (_canvas.height / rect.height) / cam.zoom;
      const t = e.touches[0];
      const worldY = cam.scrollY + (t.clientY - rect.top) * (_canvas.height / rect.height) / cam.zoom;
      if (worldY > layout.bottom - 138 - layout.safeAreaBottom) return;
      this._nativeScrollActive = true;
      this._nativeScrollToWorld = toWorld;
      this._nativeScrollStartClientY = t.clientY;
      this._nativeScrollStartScrollY = this._pageScrollY;
      this._pageDragStartY = null;
      this._pageVelSamples = [];
    };
    this._nativeTouchMove = (e) => {
      if (!this._nativeScrollActive || !e.touches.length) return;
      const t = e.touches[0];
      const totalDy = t.clientY - this._nativeScrollStartClientY;
      if (!this._pageIsDragging && Math.abs(totalDy) > PAGE_DRAG_THRESHOLD) {
        this._pageIsDragging = true;
        this.pageScrollContainer?.list?.forEach(c => { if (c?.input?.enabled) c.emit('pointerout'); });
      }
      if (this._pageIsDragging) {
        e.preventDefault();
        const now = performance.now();
        this._pageVelSamples.push({ t: now, y: t.clientY * this._nativeScrollToWorld });
        while (this._pageVelSamples.length > 1 && now - this._pageVelSamples[0].t > 80) {
          this._pageVelSamples.shift();
        }
        this._setPageScrollY(this._nativeScrollStartScrollY - totalDy * this._nativeScrollToWorld);
      }
    };
    this._nativeTouchEnd = () => {
      if (!this._nativeScrollActive) return;
      this._nativeScrollActive = false;
      const samples = this._pageVelSamples;
      if (samples.length >= 2) {
        const first = samples[0], last = samples[samples.length - 1];
        const dt = last.t - first.t;
        if (dt > 0) {
          const vel = (last.y - first.y) / dt;
          this._pageMomentumVel = Phaser.Math.Clamp(-vel * 6, -22, 22);
        }
      }
      this._pageVelSamples = [];
      this.time.delayedCall(50, () => { this._pageIsDragging = false; });
    };
    _canvas.addEventListener('touchstart', this._nativeTouchStart, { passive: true });
    _canvas.addEventListener('touchmove', this._nativeTouchMove, { passive: false });
    _canvas.addEventListener('touchend', this._nativeTouchEnd, { passive: true });
    _canvas.addEventListener('touchcancel', this._nativeTouchEnd, { passive: true });

    this.modalDy = 0; // 模態框 y 偏移：layout.centerY - 720
    this._lastPendingDailySettlementVersion = 0;
    onLayoutResize(this, () => this.applyLayout());

    this.unsubscribe = this.store.subscribe((state) => this.renderState(state));
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
    });

    // Handle fresh create after replay exit (lobby was stopped, not sleeping)
    const _initPdv = this.store.getState?.()?.pendingOpenDailySettlement ?? 0;
    if (_initPdv > 0) {
      this._lastPendingDailySettlementVersion = _initPdv;
      this._reopenHandReportsModalAfterReplay();
      this.time.delayedCall(0, () => this.store.clearPendingDailySettlement?.());
    }
    this.events.once("shutdown", () => {
      this.game.canvas.removeEventListener("wheel", this._rptNativeWheel);
      this.game.canvas.removeEventListener("touchstart", this._nativeTouchStart);
      this.game.canvas.removeEventListener("touchmove", this._nativeTouchMove);
      this.game.canvas.removeEventListener("touchend", this._nativeTouchEnd);
      this.game.canvas.removeEventListener("touchcancel", this._nativeTouchEnd);
      this.input.off("pointerdown", this._rptPointerDown, this);
      this.input.off("pointermove", this._rptPointerMove, this);
      this.input.off("pointerup", this._rptPointerUp, this);
      this.input.off("pointerdown", this._pagePointerDown, this);
      this.input.off("pointermove", this._pagePointerMove, this);
      this.input.off("pointerup", this._pagePointerUp, this);
      this.unsubscribe?.();
      this.logoSprite?.destroy();
      this.clearButtons();
      this.emptyHint?.destroy();
      this.emptyHint = null;
      this.reportsPrevButton?.destroy?.();
      this.reportsNextButton?.destroy?.();
      this.reportsBackButton?.destroy?.();
      this.reportsCloseButton?.destroy?.();
      this.reportsPanelBorder?.destroy?.();
      this.reportsTitleLabel?.destroy?.();
      this.reportsScrollContainer?.removeAll(true);
      this.reportsScrollContainer?.destroy();
      this.logoutConfirmBtn?.destroy?.();
      this.logoutCancelBtn?.destroy?.();
      this.settingsProfileButton?.destroy?.();
      this.settingsProfileButton = null;
      this.profileEditorModal?.destroy?.();
      this.profileEditorModal = null;
      this.soundSettingsPanel?.destroy?.();
      this.soundSettingsPanel = null;
      this.clearReportRows();
      this.pageScrollContainer?.removeAll(true);
      this.pageScrollContainer?.destroy();
      this._pageMaskGfx?.destroy?.();
    });
  }

  openSettingsModal() {
    this.settingsModalVisible = true;
    this.setSettingsModalVisible(true);
  }

  closeSettingsModal() {
    this.settingsModalVisible = false;
    this.setSettingsModalVisible(false);
  }

  setSettingsModalVisible(visible) {
    this.settingsOverlay?.setVisible(visible);
    this.settingsPanel?.setVisible(visible);
    this.settingsTitleText?.setVisible(visible);
    this.settingsProfileButton?.setVisible(visible);
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

  playSfx(key = "ui_click", scale = 1) {
    const sfxOn = this.app.sfxEnabled !== false;
    const masterOn = this.app.masterAudioEnabled !== false;
    if (!sfxOn || !masterOn) return;
    const vol = (Number(this.app.masterVolume ?? 1)) * (Number(this.app.sfxVolume ?? 1)) * scale;
    if (vol > 0 && this.cache.audio.exists(key)) {
      this.sound.play(key, { volume: vol });
    }
  }

  submitLogout() {
    this.app.sendPacket("logout", {});
  }

  clearButtons() {
    this.gameButtons.forEach((btn) => btn.destroy());
    this.gameButtons = [];
    this.gameButtonData = [];
  }

  renderState(state) {
    this.consumeDailySettlementFromState(state);
    this.consumeHandReportsFromState(state);
    this.renderProfileInfo(state);

    const games = Array.isArray(state.lobby?.games) ? state.lobby.games : [];
    this.clearButtons();

    if (this.emptyHint) {
      this.emptyHint.destroy();
      this.emptyHint = null;
    }

    if (games.length === 0) {
      this.emptyHint = this.add
        .text(360, 840, "目前沒有可進入的遊戲", {
          fontFamily: "sans-serif",
          fontSize: "36px",
          color: "#4a2f1d",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.pageScrollContainer?.add(this.emptyHint);
      return;
    }

    games.forEach((game) => {
      const gameId = String(game?.id || game?.game_id || "").toLowerCase();
      const gameLayout = GAME_BUTTON_LAYOUT[gameId];
      if (!gameLayout) {
        return;
      }

      const button = this.add.image(gameLayout.x, gameLayout.y, "choose_game", gameLayout.frame)
        .setDisplaySize(gameLayout.displayW, gameLayout.displayH);
      this.gameButtons.push(button);
      this.gameButtonData.push({ button, config: gameLayout });
      this.pageScrollContainer?.add(button);

      const isAvailable = game?.implemented === true && String(game?.status || "").toLowerCase() === "available";
      if (!isAvailable) {
        button.setTint(DISABLED_TINT);
        button.setInteractive({ useHandCursor: false });
        let _pressed = false;
        button.on("pointerdown", () => { _pressed = true; });
        button.on("pointerout", () => { _pressed = false; });
        button.on("pointerup", () => {
          const wasPressed = _pressed;
          _pressed = false;
          if (wasPressed && !this._pageIsDragging) this.playSfx("wrong_click", 0.4);
        });
        return;
      }

      bindImageButton(this, button, {
        playClick: false,
        onClick: () => {
          if (!this._pageIsDragging) { this.playSfx(); this.app.sendPacket("enter_game", { game_id: gameId }); }
        },
      });
    });
    // Apply layout immediately so game buttons are at the correct scaled positions
    // right after creation, without waiting for the next viewport-change event.
    this.applyLayout();

    // Title elements were added in create() but game buttons were just appended,
    // so buttons render on top due to Phaser container draw order. Re-insert title
    // items at the end so they always render above the game button images.
    [this._chooseBorderLeft, this._chooseTitleText, this._chooseBorderRight].forEach(item => {
      if (item) {
        this.pageScrollContainer.remove(item, false);
        this.pageScrollContainer.add(item);
      }
    });
  }

  _reopenHandReportsModalAfterReplay() {
    this.handReportsModalVisible = true;
    this.setHandReportsModalVisible(true);
    this.reportsCloseButton?.setPosition?.(360, this._rptG?.closeY ?? 0);
    // Rows are preserved during sleep — only fetch if scene was freshly created (no rows)
    if (this.reportRowNodes.length === 0) {
      if (this.handReportsMode === "detail" && this.selectedReportDate) {
        this.requestHandReportsPage(this.handReportsOffset);
      } else {
        this.handReportsMode = "daily";
        this.selectedReportDate = "";
        this.requestDailySettlement14d();
      }
    }
    // Double rAF: first ensures we're past the current sync stack,
    // second ensures Phaser's own rAF (queued earlier) has run and rendered the lobby.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const _ov = document.getElementById('replay-exit-loading');
      if (_ov) { _ov._stopSprite?.(); _ov.style.display = 'none'; }
    }));
  }

  openHandReportsModal() {
    this.handReportsModalVisible = true;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.setHandReportsModalVisible(true);
    this.reportsCloseButton?.setPosition?.(360, this._rptG?.closeY ?? 0);
    this.requestDailySettlement14d();
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
    this.app.sendPacket("my_daily_settlement_14d", {
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
    this.app.sendPacket("my_hand_reports", {
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
    this._reportsContentH = 0;
    this.setReportsScrollY(0);
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

  _refreshPageMask() {
    if (!this._pageMaskGfx) return;
    const navTop = layout.bottom - 138 - layout.safeAreaBottom;
    this._pageScrollVisibleH = Math.max(1, navTop);
    this._pageMaskGfx.clear();
    this._pageMaskGfx.fillStyle(0xffffff);
    this._pageMaskGfx.fillRect(0, 0, layout.width, this._pageScrollVisibleH);
  }

  _setPageScrollY(scrollY) {
    const maxScroll = Math.max(0, this._pageContentH - this._pageScrollVisibleH);
    this._pageScrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
    if (this.pageScrollContainer) {
      this.pageScrollContainer.y = -Math.round(this._pageScrollY);
    }
  }

  applyLayout() {
    // 1. Background fills viewport
    this.bgImage?.setPosition(layout.centerX, layout.centerY).setDisplaySize(layout.width, layout.height);

    // 2. Game cards + scroll-area titles — scale proportionally to device height
    const gameScale = Phaser.Math.Clamp(layout.height / 1440, 1.0, 1.2);
    this.logoSprite?.setPosition(360, Math.round(154 * gameScale))
      .setDisplaySize(Math.round(528 * gameScale), Math.round(248 * gameScale));
    const chooseTitleY = Math.max(Math.round(464 * gameScale), 464);
    this._chooseTitleText?.setPosition(360, chooseTitleY);
    this._chooseBorderLeft?.setPosition(170, chooseTitleY);
    this._chooseBorderRight?.setPosition(550, chooseTitleY);
    for (const { button, config } of (this.gameButtonData ?? [])) {
      button
        .setPosition(config.x, Math.round(config.y * gameScale))
        .setDisplaySize(Math.round(config.displayW * gameScale), Math.round(config.displayH * gameScale));
    }
    this._pageContentH = Math.round(PAGE_CONTENT_H * gameScale);
    this.adsBanner?.setPosition(360, Math.round(1210 * gameScale));

    // 3. Page scroll mask + scroll position update
    this._refreshPageMask();
    this._setPageScrollY(this._pageScrollY ?? 0);

    // 3. Bottom navigator anchors to viewport bottom (with safe area inset)
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

    // 3. Modal overlays + 中央模態框 shift
    const dy = layout.centerY - 720;
    this.modalDy = dy;

    // settings modal
    this.settingsOverlay?.setPosition(layout.centerX, layout.centerY);
    this.settingsPanel?.setPosition(layout.centerX, layout.centerY);
    this.settingsTitleText?.setPosition(layout.centerX, layout.centerY - 60);
    this.settingsProfileButton?.setPosition?.(layout.centerX, layout.centerY + 30);
    this.profileEditorModal?.setOffset?.(dy, layout.centerX, layout.centerY);

    // logout modal: graphics 用 .y 平移 drawing，text/image 個別 setPosition
    this.logoutOverlay?.setPosition(layout.centerX, layout.centerY);
    if (this.logoutPanelBorder) this.logoutPanelBorder.y = dy;
    if (this.logoutPanel) this.logoutPanel.y = dy;
    if (this._logoutMaskGfx) this._logoutMaskGfx.y = dy;
    const _logoutPanelT_local = 720 - 260 / 2; // 重新計算原始 _logoutPanelT
    this.logoutTitleLabel?.setPosition(360, _logoutPanelT_local + dy);
    this.logoutTitleText?.setPosition(360, _logoutPanelT_local + 8 + dy);
    this.logoutMsgText?.setPosition(360, 720 - 22 + dy);
    this.logoutConfirmBtn?.setPosition?.(260, 720 + 70 + dy);
    this.logoutCancelBtn?.setPosition?.(460, 720 + 70 + dy);

    // reports modal
    this.reportsOverlay?.setPosition(layout.centerX, layout.centerY);
    this._applyRptLayout(this._computeRptG());
  }

  renderProfileInfo(state) {
    const user = state?.user || {};
    const nickname = String(user.username || "");
    this.nicknameText.setText(nickname);
    const avatarFrame = String(user.avatar || "avatar_1");
    const avatarAtlas = this.textures.get("avatar_element");
    const resolvedAvatarFrame = avatarAtlas?.has(avatarFrame) ? avatarFrame : "avatar_1";
    this.avatarImage.setFrame(resolvedAvatarFrame);

    this.walletText.setText(this.formatAmount(state.walletBalance));
    if (this.addOnBtn) {
      this.addOnBtn.x = this.walletText.x + this.walletText.width + 15 + this.addOnBtn.displayWidth / 2;
    }
  }

  formatAmount(value) {
    return Number(value).toLocaleString("zh-TW");
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

  showUnderConstruction() {
    this.store.applyPacket({
      type: "error",
      data: {
        code: "FEATURE_UNDER_CONSTRUCTION",
        message: "正在施工中",
      },
    });
  }

  update() {
    if (this._pageDragStartY !== null) {
      this._pageMomentumVel = 0;
      return;
    }
    if (Math.abs(this._pageMomentumVel) > 0.3) {
      this._setPageScrollY(this._pageScrollY + this._pageMomentumVel);
      this._pageMomentumVel *= 0.82;
      if (Math.abs(this._pageMomentumVel) < 0.5) this._pageMomentumVel = 0;
    }
    if (this.logoSprite) {
      this._logoElapsed += this.game.loop.delta;
      if (this._logoElapsed >= 33.33) {
        this._logoElapsed -= 33.33;
        this._logoFrame = (this._logoFrame + 1) % 150;
        this.logoSprite.setFrame(`logo${this._logoFrame}.png`);
      }
    }
  }
}




