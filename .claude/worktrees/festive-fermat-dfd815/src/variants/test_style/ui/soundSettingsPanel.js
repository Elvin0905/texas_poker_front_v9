import { bindImageButton, createRectButton } from "./button.js";

const OVERLAY_DEPTH = 240;
const PANEL_DEPTH = 241;
const TEXT_DEPTH = 242;
const WIDGET_DEPTH = 243;

const PANEL_X = 360;
const PANEL_Y = 720;
const PANEL_WIDTH = 620;
const PANEL_HEIGHT = 960;

const TITLE_Y = 315;
const ROW_START_Y = 420;
const ROW_GAP = 92;
const LABEL_X = 110;
const TOGGLE_X = 545;
const TRACK_START_X = 290;
const TRACK_END_X = 560;
const TRACK_WIDTH = TRACK_END_X - TRACK_START_X;
const TRACK_HEIGHT = 10;
const HIT_HEIGHT = 44;
const VALUE_X = 620;

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}

function formatPercent(value) {
  return `${Math.round(clamp01(value) * 100)}%`;
}

export class SoundSettingsPanel {
  constructor(scene, {
    buttonX = 100,
    buttonY = 1350,
    buttonAtlas = "login_register_element",
    buttonOnFrame = "btn_main_bgm",
    buttonOffFrame = "btn_main_bgm_close",
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

    this.overlay = scene.add
      .rectangle(360, 720, 720, 1440, 0x000000, 0.58)
      .setDepth(OVERLAY_DEPTH)
      .setVisible(false);
    this.overlay.setInteractive({ useHandCursor: false });
    this.overlay.on("pointerdown", () => this.close());

    this.panel = scene.add
      .rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 0x13283a, 0.98)
      .setDepth(PANEL_DEPTH)
      .setVisible(false);
    this.panel.setInteractive({ useHandCursor: false });
    this.panel.on("pointerdown", () => {});

    this.title = scene.add
      .text(360, TITLE_Y, "聲音設定", {
        fontFamily: "sans-serif",
        fontSize: "40px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(TEXT_DEPTH)
      .setOrigin(0.5)
      .setVisible(false);

    this.createRows();

    this.closeButton = createRectButton(scene, {
      x: 360,
      y: 1140,
      width: 220,
      height: 64,
      label: "關閉",
      color: 0x5b2c2c,
      labelStyle: {
        fontFamily: "sans-serif",
        color: "#ecd5b5",
        fontSize: "30px",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      },
      onClick: () => this.close(),
      visible: false,
    });
    this.closeButton.bg.setDepth(WIDGET_DEPTH);
    this.closeButton.text.setDepth(WIDGET_DEPTH + 0.1);

    this.refresh();
  }

  ensureDefaults() {
    if (typeof this.app.masterAudioEnabled !== "boolean") this.app.masterAudioEnabled = true;
    if (typeof this.app.masterVolume !== "number") this.app.masterVolume = 1;
    if (typeof this.app.sfxEnabled !== "boolean") this.app.sfxEnabled = true;
    if (typeof this.app.sfxVolume !== "number") this.app.sfxVolume = 1;
    if (typeof this.app.voiceEnabled !== "boolean") this.app.voiceEnabled = true;
    if (typeof this.app.voiceVolume !== "number") this.app.voiceVolume = 1;
    if (typeof this.app.bgmEnabled !== "boolean") this.app.bgmEnabled = true;
    if (typeof this.app.bgmVolume !== "number") this.app.bgmVolume = 0.2;
  }

  createRows() {
    this.createToggleRow("全部聲音", 0, () => this.app.masterAudioEnabled, (value) => this.app.setMasterAudioEnabled?.(value));
    this.createSliderRow("聲音大小", 1, () => this.app.masterVolume, (value) => this.app.setMasterVolume?.(value));
    this.createToggleRow("音效", 2, () => this.app.sfxEnabled, (value) => this.app.setSfxEnabled?.(value));
    this.createSliderRow("音效大小", 3, () => this.app.sfxVolume, (value) => this.app.setSfxVolume?.(value));
    this.createToggleRow("語音", 4, () => this.app.voiceEnabled, (value) => this.app.setVoiceEnabled?.(value));
    this.createSliderRow("語音大小", 5, () => this.app.voiceVolume, (value) => this.app.setVoiceVolume?.(value));
    this.createToggleRow("背景音樂", 6, () => this.app.bgmEnabled, (value) => this.app.setBgmEnabled?.(value));
    this.createSliderRow("背景音樂大小", 7, () => this.app.bgmVolume, (value) => this.app.setBgmVolume?.(value));
  }

  createLabel(text, rowIndex) {
    const y = ROW_START_Y + rowIndex * ROW_GAP;
    const label = this.scene.add
      .text(LABEL_X, y, text, {
        fontFamily: "sans-serif",
        fontSize: "30px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(TEXT_DEPTH)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.widgets.push(label);
    return y;
  }

  createToggleRow(labelText, rowIndex, getter, setter) {
    const y = this.createLabel(labelText, rowIndex);
    const button = createRectButton(this.scene, {
      x: TOGGLE_X,
      y,
      width: 130,
      height: 56,
      label: "開",
      color: 0x24583b,
      labelStyle: {
        fontFamily: "sans-serif",
        fontSize: "26px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      },
      onClick: () => {
        const next = !Boolean(getter());
        setter(next);
        this.notifyChanged();
      },
      visible: false,
    });
    button.bg.setDepth(WIDGET_DEPTH);
    button.text.setDepth(WIDGET_DEPTH + 0.1);
    this.rows.push({ type: "toggle", getter, button });
  }

  createSliderRow(labelText, rowIndex, getter, setter) {
    const y = this.createLabel(labelText, rowIndex);
    const track = this.scene.add
      .rectangle(425, y, TRACK_WIDTH, TRACK_HEIGHT, 0x38506a, 1)
      .setDepth(WIDGET_DEPTH)
      .setVisible(false);
    const fill = this.scene.add
      .rectangle(TRACK_START_X, y, 0, TRACK_HEIGHT, 0xecd5b5, 1)
      .setOrigin(0, 0.5)
      .setDepth(WIDGET_DEPTH + 0.02)
      .setVisible(false);
    const hit = this.scene.add
      .rectangle(425, y, TRACK_WIDTH, HIT_HEIGHT, 0xffffff, 0.001)
      .setDepth(WIDGET_DEPTH + 0.03)
      .setVisible(false);
    const knob = this.scene.add
      .circle(TRACK_START_X, y, 16, 0xfff2dd, 1)
      .setStrokeStyle(2, 0xffffff, 0.95)
      .setDepth(WIDGET_DEPTH + 0.04)
      .setVisible(false);
    const valueText = this.scene.add
      .text(VALUE_X, y, "0%", {
        fontFamily: "sans-serif",
        fontSize: "24px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setDepth(WIDGET_DEPTH + 0.05)
      .setOrigin(1, 0.5)
      .setVisible(false);

    const onPointer = (xRaw) => {
      const x = Number(xRaw);
      const ratio = clamp01((x - TRACK_START_X) / TRACK_WIDTH);
      setter(ratio);
      this.notifyChanged();
    };

    const pointerX = (pointer) => pointer?.worldX ?? pointer?.x ?? TRACK_START_X;
    let draggingPointerId = null;
    const startDrag = (pointer) => {
      draggingPointerId = Number.isFinite(Number(pointer?.id)) ? Number(pointer.id) : null;
      onPointer(pointerX(pointer));
    };
    const moveDrag = (pointer) => {
      if (draggingPointerId === null) {
        return;
      }
      const pid = Number(pointer?.id);
      if (Number.isFinite(pid) && pid !== draggingPointerId) {
        return;
      }
      onPointer(pointerX(pointer));
    };
    const stopDrag = (pointer) => {
      if (draggingPointerId === null) {
        return;
      }
      const pid = Number(pointer?.id);
      if (Number.isFinite(pid) && pid !== draggingPointerId) {
        return;
      }
      draggingPointerId = null;
    };

    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerdown", startDrag);
    knob.setInteractive({ useHandCursor: true });
    knob.on("pointerdown", startDrag);
    this.scene.input.on("pointermove", moveDrag);
    this.scene.input.on("pointerup", stopDrag);
    this.scene.input.on("pointerupoutside", stopDrag);

    const cleanup = () => {
      this.scene.input.off("pointermove", moveDrag);
      this.scene.input.off("pointerup", stopDrag);
      this.scene.input.off("pointerupoutside", stopDrag);
    };

    this.widgets.push(track, fill, hit, knob, valueText);
    this.rows.push({
      type: "slider",
      getter,
      track,
      fill,
      hit,
      knob,
      valueText,
      y,
      cleanup,
    });
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
      if (row.type === "toggle") {
        const enabled = Boolean(row.getter());
        row.button.setLabel(enabled ? "開" : "關");
        row.button.bg.setFillStyle(enabled ? 0x24583b : 0x5b2c2c, 1);
        return;
      }
      const value = clamp01(row.getter());
      const width = Math.max(0, TRACK_WIDTH * value);
      const knobX = TRACK_START_X + width;
      row.fill.setSize(width, TRACK_HEIGHT);
      row.knob.setPosition(knobX, row.y);
      row.valueText.setText(formatPercent(value));
    });
  }

  open() {
    this.visible = true;
    this.setVisible(true);
    this.refresh();
  }

  close() {
    this.visible = false;
    this.setVisible(false);
  }

  setVisible(visible) {
    this.overlay.setVisible(visible);
    this.panel.setVisible(visible);
    this.title.setVisible(visible);
    this.closeButton.setVisible(visible);
    this.widgets.forEach((node) => node?.setVisible?.(visible));
    this.rows.forEach((row) => {
      if (row.type === "toggle") {
        row.button.setVisible(visible);
      }
    });
  }

  destroy() {
    this.triggerButton?.destroy?.();
    this.overlay?.destroy?.();
    this.panel?.destroy?.();
    this.title?.destroy?.();
    this.closeButton?.destroy?.();
    this.rows.forEach((row) => {
      row.cleanup?.();
      if (row.type === "toggle") {
        row.button?.destroy?.();
      }
    });
    this.widgets.forEach((node) => node?.destroy?.());
    this.rows = [];
    this.widgets = [];
  }
}
