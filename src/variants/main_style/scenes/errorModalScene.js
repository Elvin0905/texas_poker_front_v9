import { createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "../ui/button.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const PANEL_W = 540;
const PANEL_H = 400;
const CR = 16;

const D_OVERLAY = 10000;
const D_BORDER = 10000.5;
const D_PANEL = 10001;
const D_TEXT = 10002;

export class ErrorModalScene extends Phaser.Scene {
  constructor() {
    super("errorModal");
    this.unsubscribe = null;
    this.lastSeenErrorVersion = 0;
    this.currentMessage = "未知錯誤";
  }

  create() {
    this.useResponsiveLayout = true;
    this.app = window.__APP__;
    this.store = this.app?.store;

    if (!document.getElementById("error-modal-css")) {
      const s = document.createElement("style");
      s.id = "error-modal-css";
      s.textContent = "body.modal-open .lrn-input,body.modal-open .phone-code-sel{display:none!important;visibility:hidden!important}";
      document.head.appendChild(s);
    }

    // Keep the blocker larger than the viewport so it catches every outside click.
    this.blocker = this.add
      .rectangle(layout.centerX, layout.centerY, layout.width * 4, layout.height * 4, 0x000000, 0.68)
      .setOrigin(0.5)
      .setDepth(D_OVERLAY);
    this.blocker.on("pointerdown", (p) => p.event?.stopPropagation?.());
    this.blocker.on("pointerup", (p) => p.event?.stopPropagation?.());

    this.panelBorder = this.add.graphics().setDepth(D_BORDER);

    const maskGfx = this.make.graphics({ add: false });
    this.panelMaskGfx = maskGfx;
    this.panel = this.add.graphics().setDepth(D_PANEL);
    this.panel.setMask(maskGfx.createGeometryMask());

    this.titleLabel = this.add
      .image(0, 0, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(320, 112)
      .setDepth(D_TEXT - 0.5);

    this.titleText = this.add
      .text(0, 0, "系統通知", {
        fontFamily: "sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#f0c040",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(D_TEXT);
    applyGoldTitleGradient(this.titleText);

    this.messageText = this.add
      .text(0, 0, "", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: PANEL_W - 64 },
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(D_TEXT);

    this.confirmButton = createGradientButton(this, {
      x: 0,
      y: 0,
      width: 210,
      height: 62,
      cornerRadius: 10,
      topColor: 0xf09218,
      bottomColor: 0x7a3200,
      borderColor: 0xffaa20,
      label: "確定",
      labelStyle: {
        fontSize: "28px",
        color: "#ffffff",
        shadow: { offsetX: 0, offsetY: 2, color: "#7a3800", blur: 4, fill: true },
      },
      depth: D_TEXT,
      onClick: () => this.confirmAndClose(),
      visible: false,
    });

    this.applyLayout();
    onLayoutResize(this, () => this.applyLayout());

    this.hideModal();

    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    });

    this.unsubscribe = this.store?.subscribe((state) => this.handleState(state));
  }

  applyLayout() {
    const cx = layout.centerX;
    const cy = layout.centerY;
    const left = cx - PANEL_W / 2;
    const top = cy - PANEL_H / 2;

    this.blocker.setPosition(cx, cy).setSize(layout.width * 4, layout.height * 4);

    // Redraw border, panel, and mask after responsive layout changes.
    this.panelBorder.clear();
    drawEnhancedBorder(this.panelBorder, left, top, PANEL_W, PANEL_H, CR);

    this.panelMaskGfx.clear();
    this.panelMaskGfx.fillStyle(0xffffff);
    this.panelMaskGfx.fillRoundedRect(left, top, PANEL_W, PANEL_H, CR);

    this.panel.clear();
    this.panel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.panel.fillRect(left, top, PANEL_W, PANEL_H);
    this.panel.disableInteractive?.();
    this.panel.setInteractive(
      new Phaser.Geom.Rectangle(left, top, PANEL_W, PANEL_H),
      Phaser.Geom.Rectangle.Contains,
    );

    this.titleLabel.setPosition(cx, top);
    this.titleText.setPosition(cx, top + 8);
    this.messageText.setPosition(cx, cy - 30);

    this.confirmButton.setPosition?.(cx, top + PANEL_H - 54);
  }

  handleState(state) {
    const nextVersion = Number(state?.errorVersion ?? 0);
    if (nextVersion <= this.lastSeenErrorVersion) return;
    this.lastSeenErrorVersion = nextVersion;

    // On auth/register pages, login/system errors are handled inline — suppress the modal
    // Exception: third-party button errors always show as modal
    if (state?.page === "auth" || state?.page === "register") {
      const code = String(state?.lastError?.code ?? "").toUpperCase();
      if (!code.includes("THIRD_PARTY") && !code.includes("UNDER_CONSTRUCTION")) return;
    }

    const message = state?.lastError?.message || state?.lastError?.code || "未知錯誤";
    this.showModal(message);
  }

  showModal(message) {
    this.currentMessage = String(message || "未知錯誤");
    this.messageText.setText(this.currentMessage);
    this.scene.bringToTop();
    this.applyLayout();
    this.blocker.setVisible(true).setInteractive({ useHandCursor: false });
    this.panelBorder.setVisible(true);
    this.panel.setVisible(true);
    this.titleLabel.setVisible(true);
    this.titleText.setVisible(true);
    this.messageText.setVisible(true);
    this.confirmButton.setVisible(true);
    this._disableOtherSceneInput();
    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input, .fp-input, input[id*='main-profile']").forEach(el => el.style.setProperty("display", "none", "important"));
  }

  hideModal() {
    this.blocker.setVisible(false).disableInteractive();
    this.panelBorder.setVisible(false);
    this.panel.setVisible(false);
    this.titleLabel.setVisible(false);
    this.titleText.setVisible(false);
    this.messageText.setVisible(false);
    this.confirmButton.setVisible(false);
    this._restoreOtherSceneInput();
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input, input[id*='main-profile']").forEach(el => {
        el.style.removeProperty("display");
        // If the 120ms reveal was blocked by modal-open, visibility may still be "hidden" — clear it.
        if (el.style.visibility === "hidden") el.style.visibility = "";
      });
    }
    // Always restore fp-inputs so the underlying forgot-password modal stays usable
    document.querySelectorAll(".fp-input").forEach(el => el.style.removeProperty("display"));
  }

  confirmAndClose() {
    const errorCode = String(this.store?.getState?.()?.lastError?.code ?? "").toUpperCase();
    const errorMsg = String(this.store?.getState?.()?.lastError?.message ?? this.currentMessage ?? "");
    this.hideModal();
    this.store?.clearLastError?.();

    // If server says we're not at a table while we're on the table page, force back to lobby.
    const page = this.store?.getState?.()?.page;
    const isNotAtTableError =
      errorCode.includes("NOT_IN_ROOM") ||
      errorCode.includes("NOT_IN_TABLE") ||
      errorCode.includes("NOT_AT_TABLE") ||
      errorMsg.includes("不在牌桌") ||
      errorMsg.includes("not in room") ||
      errorMsg.includes("not at table");
    if (isNotAtTableError && page === "table") {
      const gameId = this.store?.getState?.()?.table?.game_id || this.store?.getState?.()?.gameLobby?.game_id || "texas_holdem";
      this.store?.forceBackToGameLobby?.();
      this.app?.sendPacket?.("enter_game", { game_id: gameId });
    }
  }

  _disableOtherSceneInput() {
    // Restore previously disabled scenes first to avoid losing the list on re-entrant calls.
    this._restoreOtherSceneInput();
    this._inputDisabledScenes = [];
    try {
      this.scene.manager.getScenes(true).forEach((s) => {
        if (s !== this && s.input?.enabled) {
          s.input.enabled = false;
          this._inputDisabledScenes.push(s);
        }
      });
    } catch {}
  }

  _restoreOtherSceneInput() {
    try {
      (this._inputDisabledScenes || []).forEach((s) => {
        if (s?.input) s.input.enabled = true;
      });
    } catch {}
    this._inputDisabledScenes = [];
  }
}

