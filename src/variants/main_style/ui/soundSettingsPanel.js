import { bindImageButton, createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "./button.js";

const OVERLAY_DEPTH = 240;
const PANEL_DEPTH = 241;
const TEXT_DEPTH = 242;
const WIDGET_DEPTH = 243;

const PANEL_X = 360;
const PANEL_Y = 505;
const PANEL_WIDTH = 620;
const PANEL_HEIGHT = 580;

const ROW_START_Y = 345;
const ROW_GAP = 92;
const LABEL_X = 110;
const TOGGLE_X = 545;

export class SoundSettingsPanel {
  constructor(scene, {
    buttonX = 100,
    buttonY = 1350,
    buttonAtlas = "game_table",
    buttonOnFrame = "icon_sound_on",
    buttonOffFrame = "icon_sound_off",
    buttonDepth = 220,
    onSettingsChanged = null,
  } = {}) {
    this.scene = scene;
    this.app = window.__APP__ || {};
    this.visible = false;
    this.onSettingsChanged = typeof onSettingsChanged === "function" ? onSettingsChanged : null;
    this.rows = [];
    this.widgets = [];
    this.buttonOnFrame = buttonOnFrame;
    this.buttonOffFrame = buttonOffFrame;

    this.ensureDefaults();

    this.triggerButton = scene.add
      .image(buttonX, buttonY, buttonAtlas, buttonOnFrame)
      .setDepth(buttonDepth);
    bindImageButton(scene, this.triggerButton, {
      onClick: () => this.open(),
    });

    // 用超大尺寸確保響應式 scene 上也能覆蓋整個 viewport
    this.overlay = scene.add
      .rectangle(360, 720, 4000, 4000, 0x000000, 0.58)
      .setDepth(OVERLAY_DEPTH)
      .setVisible(false);
    this.overlay.setInteractive({ useHandCursor: false });
    this.overlay.on("pointerdown", () => {});
    this.overlay.on("pointerup", () => this.close());

    const panelCR = 16;
    const panelL = PANEL_X - PANEL_WIDTH / 2;
    const panelT = PANEL_Y - PANEL_HEIGHT / 2;

    const panelMaskGfx = scene.make.graphics({ add: false });
    panelMaskGfx.fillStyle(0xffffff);
    panelMaskGfx.fillRoundedRect(panelL, panelT, PANEL_WIDTH, PANEL_HEIGHT, panelCR);
    this._panelMask = panelMaskGfx;

    this.panel = scene.add.graphics();
    this.panel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.panel.fillRect(panelL, panelT, PANEL_WIDTH, PANEL_HEIGHT);
    this.panel.setMask(panelMaskGfx.createGeometryMask());
    this.panel.setDepth(PANEL_DEPTH).setVisible(false);
    this.panel.setInteractive(
      new Phaser.Geom.Rectangle(panelL, panelT, PANEL_WIDTH, PANEL_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    );
    this.panel.on("pointerdown", () => {});
    this.panel.on("pointerup", () => {});

    this.panelBorder = scene.add.graphics();
    drawEnhancedBorder(this.panelBorder, panelL, panelT, PANEL_WIDTH, PANEL_HEIGHT, panelCR);
    this.panelBorder.setDepth(PANEL_DEPTH - 0.5).setVisible(false);

    const _titleLabelY = PANEL_Y - PANEL_HEIGHT / 2;
    this.titleLabel = scene.add
      .image(360, _titleLabelY, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(360, 126)
      .setDepth(TEXT_DEPTH - 0.5)
      .setVisible(false);

    this.title = scene.add
      .text(360, _titleLabelY + 8, "聲音設定", {
        fontFamily: "sans-serif",
        fontSize: "40px",
        color: "#f0c040",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);
    applyGoldTitleGradient(this.title);

    this.createRows();

    this.closeButton = createGradientButton(scene, {
      x: 360,
      y: 730,
      width: 220,
      height: 64,
      cornerRadius: 10,
      topColor: 0xf09218,
      bottomColor: 0x7a3200,
      borderColor: 0xffaa20,
      label: "確認",
      labelStyle: {
        fontSize: "30px",
        color: "#fff8e0",
        shadow: { offsetX: 0, offsetY: 2, color: "#7a3800", blur: 4, fill: true },
      },
      depth: WIDGET_DEPTH,
      onClick: () => this.close(),
      visible: false,
    });

    this.refresh();
  }

  ensureDefaults() {
    if (typeof this.app.masterAudioEnabled !== "boolean") this.app.masterAudioEnabled = true;
    if (typeof this.app.sfxEnabled !== "boolean") this.app.sfxEnabled = true;
    if (typeof this.app.voiceEnabled !== "boolean") this.app.voiceEnabled = true;
    if (typeof this.app.bgmEnabled !== "boolean") this.app.bgmEnabled = true;
  }

  createRows() {
    this.createToggleRow("全部聲音", 0, () => this.app.masterAudioEnabled, (value) => this.app.setMasterAudioEnabled?.(value));
    this.createToggleRow("音效", 1, () => this.app.sfxEnabled, (value) => this.app.setSfxEnabled?.(value));
    this.createToggleRow("語音", 2, () => this.app.voiceEnabled, (value) => this.app.setVoiceEnabled?.(value));
    this.createToggleRow("背景音樂", 3, () => this.app.bgmEnabled, (value) => this.app.setBgmEnabled?.(value));
  }

  createLabel(text, rowIndex) {
    const y = ROW_START_Y + rowIndex * ROW_GAP;
    const label = this.scene.add
      .text(LABEL_X, y, text, {
        fontFamily: "sans-serif",
        fontSize: "30px",
        color: "#ecd5b5",
        fontStyle: "bold",
        shadow: { offsetX: 1, offsetY: 2, color: "#000000", blur: 6, fill: true },
      })
      .setDepth(TEXT_DEPTH)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.widgets.push(label);
    return y;
  }

  createToggleRow(labelText, rowIndex, getter, setter) {
    const y = this.createLabel(labelText, rowIndex);
    const button = createGradientButton(this.scene, {
      x: TOGGLE_X,
      y,
      width: 130,
      height: 56,
      cornerRadius: 10,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "開",
      depth: WIDGET_DEPTH,
      onClick: () => {
        const next = !Boolean(getter());
        setter(next);
        this.notifyChanged();
      },
      visible: false,
    });
    this.rows.push({ type: "toggle", getter, button });
  }

  notifyChanged() {
    this.refresh();
    this.onSettingsChanged?.();
  }

  refresh() {
    this.ensureDefaults();
    const triggerOn = this.app.masterAudioEnabled !== false;
    this.triggerButton?.setFrame(triggerOn ? this.buttonOnFrame : this.buttonOffFrame);
    this.rows.forEach((row) => {
      const enabled = Boolean(row.getter());
      row.button.setLabel(enabled ? "開" : "關");
      if (enabled) {
        row.button.setGradient(0x3db428, 0x145018, 0x1aed30);
      } else {
        row.button.setGradient(0xc02828, 0x6a1010, 0xd43535);
      }
    });
  }

  open() {
    this.visible = true;
    this.setVisible(true);
    this.refresh();
    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.setProperty("display", "none", "important"));
  }

  close() {
    this.visible = false;
    this.setVisible(false);
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.removeProperty("display"));
    }
  }

  setVisible(visible) {
    this.overlay.setVisible(visible);
    this.panel.setVisible(visible);
    this.panelBorder.setVisible(visible);
    this.titleLabel?.setVisible(visible);
    this.title.setVisible(visible);
    this.closeButton?.setVisible(visible);
    this.widgets.forEach((node) => node?.setVisible?.(visible));
    this.rows.forEach((row) => {
      row.button.setVisible(visible);
    });
  }

  destroy() {
    if (this.visible) this.close();
    this.triggerButton?.destroy?.();
    this.titleLabel?.destroy?.();
    this.overlay?.destroy?.();
    this.panel?.destroy?.();
    this.panelBorder?.destroy?.();
    this.title?.destroy?.();
    this.closeButton?.destroy();
    this.rows.forEach((row) => {
      row.button?.destroy();
    });
    this.widgets.forEach((node) => node?.destroy?.());
    this.rows = [];
    this.widgets = [];
  }
}
