import { bindImageButton, createRectButton } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { ProfileEditorModal } from "../ui/profileEditorModal.js";

const GAME_BUTTON_LAYOUT = {
  texas_holdem: { x: 200, y: 680, frame: "btn_texas_holdem" },
  big_two: { x: 545, y: 600, frame: "btn_big_two" },
  blackjack: { x: 540, y: 940, frame: "btn_blackjack" },
};

const DISABLED_TINT = 0x666666;
const INFO_TEXT_STYLE = {
  fontFamily: "sans-serif",
  fontSize: "34px",
  color: "#F9CD73",
  fontStyle: "bold",
};

const REPORTS_LIMIT = 10;
const REPORTS_OVERLAY_DEPTH = 180;
const REPORTS_PANEL_DEPTH = 181;
const REPORTS_TEXT_DEPTH = 182;
const REPORTS_OVERLAY_COLOR = 0x000000;
const REPORTS_OVERLAY_ALPHA = 0.62;
const REPORTS_PANEL_COLOR = 0x13283a;
const REPORTS_PANEL_ALPHA = 0.98;
const REPORTS_TITLE_COLOR = "#ecd5b5";
const REPORTS_TEXT_COLOR = "#f4deba";
const REPORTS_HINT_COLOR = "#d9b98a";
const REPORTS_FONT_FAMILY = "sans-serif";
const REPORTS_PANEL_X = 360;
const REPORTS_PANEL_Y = 720;
const REPORTS_PANEL_WIDTH = 650;
const REPORTS_PANEL_HEIGHT = 980;
const REPORTS_TITLE_Y = 292;
const REPORTS_PAGE_Y = 334;
const REPORTS_LIST_X = 80;
const REPORTS_LIST_Y = 392;
const REPORTS_LIST_WRAP_WIDTH = 560;
const REPORTS_ROW_START_Y = 426;
const REPORTS_ROW_GAP = 62;
const REPORTS_DAILY_ROW_GAP = 46;
const REPORTS_MAX_ROWS = 10;
const REPORTS_COL_TIME_X = 66;
const REPORTS_COL_CARDS_X = 198;
const REPORTS_COL_RANK_X = 380;
const REPORTS_COL_NET_X = 500;
const REPORTS_COL_REPLAY_X = 610;
const REPORTS_CARD_WIDTH = 30;
const REPORTS_CARD_HEIGHT = 42;
const REPORTS_CARD_GAP = 5;
const REPORTS_REPLAY_BTN_WIDTH = 64;
const REPORTS_REPLAY_BTN_HEIGHT = 36;
const REPORTS_STATUS_Y = 1126;
const REPORTS_BTN_Y = 1195;
const REPORTS_PREV_X = 190;
const REPORTS_NEXT_X = 360;
const REPORTS_REFRESH_X = 530;
const REPORTS_CLOSE_X = 360;
const REPORTS_CLOSE_Y = 1270;
const REPORTS_BTN_WIDTH = 140;
const REPORTS_BTN_HEIGHT = 58;
const REPORTS_BACK_X = 530;
const REPORTS_DAILY_COL_DATE_X = 90;
const REPORTS_DAILY_COL_HAND_X = 300;
const REPORTS_DAILY_COL_NET_X = 560;

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
    this.soundSettingsPanel = null;
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app.store;

    this.add.image(360, 720, "bg");

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

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: 120,
      buttonY: 1350,
      onSettingsChanged: () => {
        syncBgmByState();
      },
    });
    syncBgmByState();

    this.add.image(185, 330, "lobby_element", "user_nickname");
    this.avatarImage = this.add.image(75, 330, "avatar_element", "avatar_001").setScale(0.6);
    this.add.image(540, 330, "lobby_element", "user_gamepoint");
    this.nicknameText = this.add.text(185, 330, "-", INFO_TEXT_STYLE).setOrigin(0.5);
    this.walletText = this.add.text(550, 330, "--", INFO_TEXT_STYLE).setOrigin(0.5);

    this.add.image(360, 1203, "lobby_element", "toolbar_panel");
    this.toolbarLogButton = this.add.image(165, 1200, "lobby_element", "btn_toolbar_log");
    this.toolbarShopButton = this.add.image(270, 1200, "lobby_element", "btn_toolbar_shop");
    this.toolbarRankingButton = this.add.image(365, 1200, "lobby_element", "btn_toolbar_ranking");
    this.toolbarSetupButton = this.add.image(457, 1200, "lobby_element", "btn_toolbar_setup");
    this.toolbarQnaButton = this.add.image(555, 1200, "lobby_element", "btn_toolbar_qna");

    bindImageButton(this, this.toolbarLogButton, {
      onClick: () => this.openHandReportsModal(),
    });
    [this.toolbarShopButton, this.toolbarRankingButton, this.toolbarQnaButton].forEach((button) => {
      bindImageButton(this, button, {
        onClick: () => this.showUnderConstruction(),
      });
    });
    bindImageButton(this, this.toolbarSetupButton, {
      onClick: () => this.openSettingsModal(),
    });

    this.settingsOverlay = this.add
      .rectangle(360, 720, 720, 1440, 0x000000, 0.56)
      .setDepth(210)
      .setVisible(false);
    this.settingsOverlay.setInteractive({ useHandCursor: false });
    this.settingsOverlay.on("pointerdown", () => this.closeSettingsModal());

    this.settingsPanel = this.add
      .rectangle(360, 720, 540, 430, 0x13283a, 0.98)
      .setDepth(211)
      .setVisible(false);
    this.settingsPanel.setInteractive({ useHandCursor: false });
    this.settingsPanel.on("pointerdown", () => {});

    this.settingsTitleText = this.add
      .text(360, 610, "設定", {
        fontFamily: "sans-serif",
        fontSize: "36px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(212)
      .setOrigin(0.5)
      .setVisible(false);

    this.settingsProfileButton = createRectButton(this, {
      x: 360,
      y: 710,
      width: 260,
      height: 72,
      label: "修改暱稱",
      color: 0x264766,
      labelStyle: {
        fontFamily: "sans-serif",
        fontSize: "30px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      },
      onClick: () => this.openProfileEditorModal(),
      visible: false,
    });
    this.settingsProfileButton.bg.setDepth(212.4);
    this.settingsProfileButton.text.setDepth(212.5);

    this.settingsLogoutButton = createRectButton(this, {
      x: 360,
      y: 800,
      width: 260,
      height: 72,
      label: "登出",
      color: 0x5b2c2c,
      labelStyle: {
        fontFamily: "sans-serif",
        fontSize: "30px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      },
      onClick: () => this.submitLogout(),
      visible: false,
    });
    this.settingsLogoutButton.bg.setDepth(212.4);
    this.settingsLogoutButton.text.setDepth(212.5);

    this.profileEditorModal = new ProfileEditorModal(this, {
      depth: 230,
      onSubmit: (payload) => this.submitProfileUpdate(payload),
    });

    this.reportsOverlay = this.add
      .rectangle(360, 720, 720, 1440, REPORTS_OVERLAY_COLOR, REPORTS_OVERLAY_ALPHA)
      .setDepth(REPORTS_OVERLAY_DEPTH)
      .setVisible(false);
    this.reportsOverlay.setInteractive({ useHandCursor: false });
    this.reportsOverlay.on("pointerdown", () => {});

    this.reportsPanel = this.add
      .rectangle(REPORTS_PANEL_X, REPORTS_PANEL_Y, REPORTS_PANEL_WIDTH, REPORTS_PANEL_HEIGHT, REPORTS_PANEL_COLOR, REPORTS_PANEL_ALPHA)
      .setDepth(REPORTS_PANEL_DEPTH)
      .setVisible(false);
    this.reportsPanel.setInteractive({ useHandCursor: false });
    this.reportsPanel.on("pointerdown", () => {});

    this.reportsTitleText = this.add
      .text(360, REPORTS_TITLE_Y, "玩家報表", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "36px",
        color: REPORTS_TITLE_COLOR,
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 1,
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.reportsPageText = this.add
      .text(360, REPORTS_PAGE_Y, "第 1 頁", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "24px",
        color: REPORTS_HINT_COLOR,
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 1,
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.reportsListText = this.add
      .text(REPORTS_LIST_X, REPORTS_LIST_Y, "", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "21px",
        color: REPORTS_TEXT_COLOR,
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 1,
        lineSpacing: 8,
        wordWrap: { width: REPORTS_LIST_WRAP_WIDTH },
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0, 0)
      .setVisible(false);

    this.reportsHeaderText = this.add
      .text(REPORTS_COL_TIME_X, REPORTS_LIST_Y, "", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "22px",
        color: REPORTS_HINT_COLOR,
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 1,
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0, 0)
      .setVisible(false);

    this.reportsStatusText = this.add
      .text(360, REPORTS_STATUS_Y, "", {
        fontFamily: REPORTS_FONT_FAMILY,
        fontSize: "22px",
        color: REPORTS_HINT_COLOR,
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 1,
      })
      .setDepth(REPORTS_TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.reportsPrevButton = createRectButton(this, {
      x: REPORTS_PREV_X,
      y: REPORTS_BTN_Y,
      width: REPORTS_BTN_WIDTH,
      height: REPORTS_BTN_HEIGHT,
      label: "上一頁",
      color: 0x264766,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1 },
      onClick: () => this.requestHandReportsPage(this.handReportsOffset - REPORTS_LIMIT),
      visible: false,
    });
    this.reportsPrevButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.4);
    this.reportsPrevButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.5);

    this.reportsNextButton = createRectButton(this, {
      x: REPORTS_NEXT_X,
      y: REPORTS_BTN_Y,
      width: REPORTS_BTN_WIDTH,
      height: REPORTS_BTN_HEIGHT,
      label: "下一頁",
      color: 0x264766,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1 },
      onClick: () => this.requestHandReportsPage(this.handReportsOffset + REPORTS_LIMIT),
      visible: false,
    });
    this.reportsNextButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.4);
    this.reportsNextButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.5);

    this.reportsRefreshButton = createRectButton(this, {
      x: REPORTS_REFRESH_X,
      y: REPORTS_BTN_Y,
      width: REPORTS_BTN_WIDTH,
      height: REPORTS_BTN_HEIGHT,
      label: "更新日結",
      color: 0x24583b,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1 },
      onClick: () => {
        if (this.handReportsMode === "daily") {
          this.requestDailySettlement14d();
          return;
        }
        this.requestHandReportsPage(this.handReportsOffset);
      },
      visible: false,
    });
    this.reportsRefreshButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.4);
    this.reportsRefreshButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.5);

    this.reportsCloseButton = createRectButton(this, {
      x: REPORTS_CLOSE_X,
      y: REPORTS_CLOSE_Y,
      width: 220,
      height: 62,
      label: "關閉",
      color: 0x5b2c2c,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1 },
      onClick: () => this.closeHandReportsModal(),
      visible: false,
    });
    this.reportsCloseButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.4);
    this.reportsCloseButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.5);

    this.reportsBackButton = createRectButton(this, {
      x: REPORTS_BACK_X,
      y: REPORTS_BTN_Y,
      width: REPORTS_BTN_WIDTH,
      height: REPORTS_BTN_HEIGHT,
      label: "返回日結",
      color: 0x6a4f24,
      labelStyle: { stroke: "#ffffff", strokeThickness: 1 },
      onClick: () => this.showDailySettlementView(),
      visible: false,
    });
    this.reportsBackButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.4);
    this.reportsBackButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.5);

    this.unsubscribe = this.store.subscribe((state) => this.renderState(state));
    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      this.clearButtons();
      this.emptyHint?.destroy();
      this.emptyHint = null;
      this.reportsPrevButton?.destroy?.();
      this.reportsNextButton?.destroy?.();
      this.reportsRefreshButton?.destroy?.();
      this.reportsCloseButton?.destroy?.();
      this.reportsBackButton?.destroy?.();
      this.settingsProfileButton?.destroy?.();
      this.settingsLogoutButton?.destroy?.();
      this.profileEditorModal?.destroy?.();
      this.profileEditorModal = null;
      this.soundSettingsPanel?.destroy?.();
      this.soundSettingsPanel = null;
      this.clearReportRows();
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
    this.settingsLogoutButton?.setVisible(visible);
  }

  openProfileEditorModal() {
    this.closeSettingsModal();
    this.profileEditorModal?.open?.(this.store.getState?.().user || {});
  }

  submitProfileUpdate(payload) {
    this.app.sendPacket("update_profile", {
      nickname: String(payload?.nickname || "").trim(),
      avatar: String(payload?.avatar || "avatar_001"),
    });
  }

  submitLogout() {
    this.app.sendPacket("logout", {});
    this.closeSettingsModal();
  }

  clearButtons() {
    this.gameButtons.forEach((btn) => btn.destroy());
    this.gameButtons = [];
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
        .text(360, 720, "目前沒有可進入的遊戲", {
          fontFamily: "sans-serif",
          fontSize: "36px",
          color: "#4a2f1d",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      return;
    }

    games.forEach((game) => {
      const gameId = String(game?.id || game?.game_id || "").toLowerCase();
      const layout = GAME_BUTTON_LAYOUT[gameId];
      if (!layout) {
        return;
      }

      const button = this.add.image(layout.x, layout.y, "lobby_element", layout.frame);
      this.gameButtons.push(button);

      const isAvailable = game?.implemented === true && String(game?.status || "").toLowerCase() === "available";
      if (!isAvailable) {
        if (button.postFX?.addColorMatrix) {
          const colorMatrix = button.postFX.addColorMatrix();
          colorMatrix.blackWhite();
          colorMatrix.brightness(0.7);
        } else {
          button.setTint(DISABLED_TINT);
        }
        return;
      }

      bindImageButton(this, button, {
        onClick: () => {
          this.app.sendPacket("enter_game", { game_id: gameId });
        },
      });
    });
  }

  openHandReportsModal() {
    this.handReportsModalVisible = true;
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.setHandReportsModalVisible(true);
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
    this.reportsPanel?.setVisible(visible);
    this.reportsTitleText?.setVisible(visible);
    this.reportsPageText?.setVisible(visible);
    this.reportsListText?.setVisible(visible);
    this.reportsHeaderText?.setVisible(false);
    this.reportsStatusText?.setVisible(visible);
    this.reportsPrevButton?.setVisible(visible);
    this.reportsNextButton?.setVisible(visible);
    this.reportsRefreshButton?.setVisible(false);
    this.reportsBackButton?.setVisible(visible && this.handReportsMode === "detail");
    this.reportsCloseButton?.setVisible(visible);
  }

  requestDailySettlement14d() {
    this.handReportsLoading = true;
    if (this.handReportsModalVisible) {
      this.reportsStatusText.setText("讀取中...");
      this.reportsPrevButton.setEnabled(false);
      this.reportsNextButton.setEnabled(false);
      this.reportsRefreshButton.setEnabled(false);
      this.reportsBackButton.setEnabled(this.handReportsMode === "detail");
    }
    this.app.sendPacket("my_daily_settlement_14d", {
      game_code: "texas_holdem",
    });
  }

  showDailySettlementView() {
    this.handReportsMode = "daily";
    this.selectedReportDate = "";
    this.handReportsOffset = 0;
    this.reportsBackButton.setVisible(false);
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
    this.reportsBackButton.setVisible(true);
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
      this.reportsStatusText.setText("讀取中...");
      this.reportsPrevButton.setEnabled(false);
      this.reportsNextButton.setEnabled(false);
      this.reportsRefreshButton.setEnabled(false);
      this.reportsBackButton.setEnabled(true);
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
    this.reportsPageText.setText("點日期看當日明細");
    this.reportsStatusText.setText(items.length > 0 ? `共 ${items.length} 天` : "目前沒有資料");
    this.reportsPrevButton.setVisible(false);
    this.reportsNextButton.setVisible(false);
    this.reportsBackButton.setVisible(false);
    this.reportsRefreshButton.setVisible(false);
    this.reportsListText.setText("");
    if (items.length <= 0) {
      this.reportsListText.setText("目前沒有資料");
      return;
    }
    const showItems = [...items]
      .sort((a, b) => String(b?.report_date ?? "").localeCompare(String(a?.report_date ?? "")))
      .slice(0, 14);
    showItems.forEach((item, index) => {
      const rowY = REPORTS_ROW_START_Y + index * REPORTS_DAILY_ROW_GAP;
      const reportDate = String(item?.report_date || "-");
      const handCount = Number(item?.hand_count ?? 0);
      const net = Number(item?.total_net_amount ?? 0);
      const netColor = net > 0 ? "#62d26f" : (net < 0 ? "#ff6b6b" : REPORTS_TEXT_COLOR);

      const rowHitArea = this.add
        .rectangle(360, rowY, 600, 38, 0x000000, 0.001)
        .setDepth(REPORTS_TEXT_DEPTH - 0.2)
        .setInteractive({ useHandCursor: true });
      rowHitArea.on("pointerdown", () => this.openDailyReportDetails(reportDate));
      this.reportRowNodes.push(rowHitArea);

      const dateText = this.add
        .text(REPORTS_DAILY_COL_DATE_X, rowY, reportDate, {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: "#9ad0ff",
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      dateText.on("pointerdown", () => this.openDailyReportDetails(reportDate));
      this.reportRowNodes.push(dateText);

      const handText = this.add
        .text(REPORTS_DAILY_COL_HAND_X, rowY, `${handCount} 手`, {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(0.5, 0.5);
      this.reportRowNodes.push(handText);

      const netText = this.add
        .text(REPORTS_DAILY_COL_NET_X, rowY, this.formatSignedAmount(net), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: netColor,
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(1, 0.5);
      this.reportRowNodes.push(netText);
    });
  }

  renderHandReportsItems(items) {
    if (!this.handReportsModalVisible) {
      return;
    }
    this.clearReportRows();
    this.reportsTitleText.setText(`當日明細 ${this.selectedReportDate}`);
    const pageNo = Math.floor(this.handReportsOffset / REPORTS_LIMIT) + 1;
    this.reportsPageText.setText(`第 ${pageNo} 頁`);
    this.reportsStatusText.setText(items.length > 0 ? `共 ${items.length} 筆` : "目前沒有資料");
    this.reportsPrevButton.setVisible(true);
    this.reportsNextButton.setVisible(true);
    this.reportsBackButton.setVisible(true);
    this.reportsRefreshButton.setVisible(false);
    this.reportsRefreshButton.setEnabled(false);
    this.reportsPrevButton.setEnabled(this.handReportsOffset > 0);
    this.reportsNextButton.setEnabled(items.length >= REPORTS_LIMIT);
    if (items.length <= 0) {
      this.reportsListText.setText("目前沒有資料");
      return;
    }
    this.reportsListText.setText("");
    const showItems = items.slice(0, REPORTS_MAX_ROWS);
    showItems.forEach((item, index) => {
      const rowY = REPORTS_ROW_START_Y + index * REPORTS_ROW_GAP;
      const timeText = this.add
        .text(REPORTS_COL_TIME_X, rowY, this.formatReportTime(item?.ended_at), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(0, 0.5);
      this.reportRowNodes.push(timeText);

      const rankText = this.add
        .text(REPORTS_COL_RANK_X, rowY, this.resolveHandRankZh(item?.hand_rank), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: REPORTS_TEXT_COLOR,
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(0, 0.5);
      this.reportRowNodes.push(rankText);

      const netValue = Number(item?.net_amount ?? 0);
      const netColor = netValue > 0 ? "#62d26f" : (netValue < 0 ? "#ff6b6b" : REPORTS_TEXT_COLOR);
      const netText = this.add
        .text(REPORTS_COL_NET_X, rowY, this.formatSignedAmount(netValue), {
          fontFamily: REPORTS_FONT_FAMILY,
          fontSize: "22px",
          color: netColor,
          fontStyle: "bold",
          stroke: "#ffffff",
          strokeThickness: 1,
        })
        .setDepth(REPORTS_TEXT_DEPTH)
        .setOrigin(1, 0.5);
      this.reportRowNodes.push(netText);

      const cards = this.parseBest5Cards(item);
      cards.forEach((card, cardIndex) => {
        const frame = this.normalizeCardFrameKey(card);
        if (!frame || !this.textures.get("playing_cards_element")?.has(frame)) {
          return;
        }
        const cardImage = this.add
          .image(
            REPORTS_COL_CARDS_X + cardIndex * (REPORTS_CARD_WIDTH + REPORTS_CARD_GAP),
            rowY,
            "playing_cards_element",
            frame,
          )
          .setDisplaySize(REPORTS_CARD_WIDTH, REPORTS_CARD_HEIGHT)
          .setDepth(REPORTS_TEXT_DEPTH)
          .setOrigin(0, 0.5);
        this.reportRowNodes.push(cardImage);
      });

      const replayButton = createRectButton(this, {
        x: REPORTS_COL_REPLAY_X,
        y: rowY,
        width: REPORTS_REPLAY_BTN_WIDTH,
        height: REPORTS_REPLAY_BTN_HEIGHT,
        label: "回放",
        color: 0x24583b,
        labelStyle: {
          fontSize: "18px",
          stroke: "#ffffff",
          strokeThickness: 1,
        },
        onClick: () => {
          const packet = {
            type: "hand_replay",
            data: {
              game_code: "texas_holdem",
              table_id: String(item?.table_id ?? ""),
              hand_id: Number(item?.hand_id ?? 0),
            },
          };
          // 回放先送封包，實際回放 UI 由 table scene 處理
          console.log("[hand_replay]", packet);
          this.app.sendPacket(packet.type, packet.data);
        },
        visible: true,
      });
      replayButton.bg.setDepth(REPORTS_TEXT_DEPTH + 0.2);
      replayButton.text.setDepth(REPORTS_TEXT_DEPTH + 0.3);
      this.reportRowNodes.push(replayButton);
    });
  }

  clearReportRows() {
    this.reportRowNodes.forEach((node) => node?.destroy?.());
    this.reportRowNodes = [];
  }

  renderProfileInfo(state) {
    const user = state?.user || {};
    const nickname = String(user.username || "");
    this.nicknameText.setText(nickname);
    const avatarFrame = String(user.avatar || "avatar_001");
    const avatarAtlas = this.textures.get("avatar_element");
    const resolvedAvatarFrame = avatarAtlas?.has(avatarFrame) ? avatarFrame : "avatar_001";
    this.avatarImage.setFrame(resolvedAvatarFrame);

    this.walletText.setText(this.formatAmount(state.walletBalance));
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
}



