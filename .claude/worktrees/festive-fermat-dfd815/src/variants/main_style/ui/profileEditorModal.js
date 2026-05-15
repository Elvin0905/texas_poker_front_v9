import { createKeyboardBar, ellipsizeText } from "./input.js";
import { createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "./button.js";

const AVATAR_FRAMES = Array.from({ length: 20 }, (_, index) => `avatar_${index + 1}`);
const PANEL_X = 360;
const PANEL_Y = 720;
const PANEL_WIDTH = 650;
const PANEL_HEIGHT = 820;
const PANEL_CORNER = 18;
const PANEL_TOP = PANEL_Y - PANEL_HEIGHT / 2;
const TEXT_STYLE = {
  fontFamily: "sans-serif",
  fontStyle: "bold",
  color: "#ecd5b5",
  stroke: "#000000",
  strokeThickness: 1,
};

export function resolveMainAvatarFrame(scene, frameRaw) {
  const raw = String(frameRaw || "avatar_1").trim();
  const atlas = scene?.textures?.get?.("avatar_element");
  if (atlas?.has?.(raw)) {
    return raw;
  }
  const match = raw.match(/^avatar_(\d+)$/i);
  if (match) {
    const normalized = `avatar_${Number(match[1])}`;
    if (atlas?.has?.(normalized)) {
      return normalized;
    }
  }
  return "avatar_1";
}

export function toServerAvatarFrame(frameRaw) {
  const match = String(frameRaw || "").match(/^avatar_(\d+)$/i);
  if (!match) {
    return "avatar_001";
  }
  return `avatar_${String(Number(match[1])).padStart(3, "0")}`;
}

export class ProfileEditorModal {
  constructor(scene, { depth = 230, onSubmit } = {}) {
    this.scene = scene;
    this.depth = depth;
    this.onSubmit = onSubmit;
    this.nickname = "";
    this.selectedAvatar = "avatar_1";
    this.nodes = [];
    this.positionedNodes = [];
    this.avatarNodes = [];
    this.visible = false;
    this.dy = 0;
    this.centerX = 360;
    this.centerY = 720;
    this.keyboardBar = createKeyboardBar({
      id: `${scene.scene.key}-main-profile-keyboard-bar`,
      doneText: "完成",
    });

    this.create();
    this.setVisible(false);
  }

  create() {
    const { scene, depth } = this;
    const left = PANEL_X - PANEL_WIDTH / 2;

    this.overlay = scene.add.rectangle(PANEL_X, PANEL_Y, 4000, 4000, 0x000000, 0.64)
      .setDepth(depth)
      .setVisible(false);
    this.overlay.setInteractive({ useHandCursor: false });
    this.overlay.on("pointerdown", () => this.close());

    this.panelBorder = scene.add.graphics().setDepth(depth + 0.5).setVisible(false);
    drawEnhancedBorder(this.panelBorder, left, PANEL_TOP, PANEL_WIDTH, PANEL_HEIGHT, PANEL_CORNER);

    this.panelMask = scene.make.graphics({ add: false });
    this.panelMask.fillStyle(0xffffff);
    this.panelMask.fillRoundedRect(left, PANEL_TOP, PANEL_WIDTH, PANEL_HEIGHT, PANEL_CORNER);

    this.panel = scene.add.graphics().setDepth(depth + 1).setVisible(false);
    this.panel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this.panel.fillRect(left, PANEL_TOP, PANEL_WIDTH, PANEL_HEIGHT);
    this.panel.setMask(this.panelMask.createGeometryMask());
    this.panel.setInteractive(
      new Phaser.Geom.Rectangle(left, PANEL_TOP, PANEL_WIDTH, PANEL_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    );
    this.panel.on("pointerdown", () => {});

    this.titleLabel = scene.add.image(PANEL_X, PANEL_TOP, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(360, 126)
      .setDepth(depth + 2)
      .setVisible(false);
    this.titleText = scene.add.text(PANEL_X, PANEL_TOP + 8, "修改暱稱", {
      ...TEXT_STYLE,
      fontSize: "36px",
      color: "#f0c040",
    }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);
    applyGoldTitleGradient(this.titleText);

    this.nicknameLabel = scene.add.text(100, 430, "暱稱", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.nicknameInputBg = scene.add.rectangle(405, 430, 390, 66, 0x1b0508, 0.96)
      .setStrokeStyle(2, 0xd4890f, 0.95)
      .setDepth(depth + 2)
      .setVisible(false);
    this.nicknameInputBg.setInteractive({ useHandCursor: true });
    this.nicknameInputBg.on("pointerup", () => this.openNicknameKeyboard());

    this.nicknameText = scene.add.text(230, 430, "", {
      fontFamily: "sans-serif",
      fontSize: "28px",
      color: "#f4deba",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    }).setOrigin(0, 0.5).setDepth(depth + 3).setVisible(false);
    this.nicknameText.setInteractive({ useHandCursor: true });
    this.nicknameText.on("pointerup", () => this.openNicknameKeyboard());

    this.avatarLabel = scene.add.text(PANEL_X, 522, "選擇頭像", {
      ...TEXT_STYLE,
      fontSize: "28px",
      color: "#f0c040",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    applyGoldTitleGradient(this.avatarLabel);

    this.createAvatarGrid();

    this.statusText = scene.add.text(PANEL_X, 986, "", {
      ...TEXT_STYLE,
      fontSize: "23px",
      color: "#ffcf7a",
      align: "center",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);

    this.confirmButton = createGradientButton(scene, {
      x: 250,
      y: 1060,
      width: 190,
      height: 64,
      cornerRadius: 8,
      topColor: 0x3db428,
      bottomColor: 0x145018,
      borderColor: 0x1aed30,
      label: "確認修改",
      labelStyle: { ...TEXT_STYLE, fontSize: "25px", color: "#ecd5b5" },
      depth: depth + 3,
      onClick: () => this.submit(),
      visible: false,
    });
    this.cancelButton = createGradientButton(scene, {
      x: 470,
      y: 1060,
      width: 170,
      height: 64,
      cornerRadius: 8,
      topColor: 0xc02828,
      bottomColor: 0x6a1010,
      borderColor: 0xd43535,
      label: "取消",
      labelStyle: { ...TEXT_STYLE, fontSize: "25px", color: "#ecd5b5" },
      depth: depth + 3,
      onClick: () => this.close(),
      visible: false,
    });

    [
      this.titleLabel,
      this.titleText,
      this.nicknameLabel,
      this.nicknameInputBg,
      this.nicknameText,
      this.avatarLabel,
      this.statusText,
    ].forEach((node) => this.track(node, node.x, node.y));
    this.nodes.push(this.overlay, this.panelBorder, this.panel, this.titleLabel, this.titleText, this.nicknameLabel, this.nicknameInputBg, this.nicknameText, this.avatarLabel, this.statusText);
  }

  createAvatarGrid() {
    const xs = [150, 255, 360, 465, 570];
    const ys = [620, 710, 800, 890];
    AVATAR_FRAMES.forEach((frame, index) => {
      const x = xs[index % xs.length];
      const y = ys[Math.floor(index / xs.length)];
      const ring = this.scene.add.circle(x, y, 37, 0xf0c040, 0.18)
        .setStrokeStyle(3, 0xf0c040, 0.82)
        .setDepth(this.depth + 2)
        .setVisible(false);
      const image = this.scene.add.image(x, y, "avatar_element", frame)
        .setDisplaySize(60, 60)
        .setDepth(this.depth + 3)
        .setVisible(false);
      const select = () => {
        this.selectedAvatar = frame;
        this.render();
      };
      image.setInteractive({ useHandCursor: true });
      image.on("pointerup", select);
      ring.setInteractive({ useHandCursor: true });
      ring.on("pointerup", select);
      this.avatarNodes.push({ frame, ring, image, x, y });
      this.track(ring, x, y);
      this.track(image, x, y);
      this.nodes.push(ring, image);
    });
  }

  track(node, x, y) {
    if (!node) {
      return;
    }
    this.positionedNodes.push({ node, x, y });
  }

  setOffset(dy = 0, centerX = 360, centerY = 720) {
    this.dy = Number(dy) || 0;
    this.centerX = Number(centerX) || 360;
    this.centerY = Number(centerY) || 720;
    this.overlay?.setPosition(this.centerX, this.centerY);
    if (this.panelBorder) this.panelBorder.y = this.dy;
    if (this.panel) this.panel.y = this.dy;
    if (this.panelMask) this.panelMask.y = this.dy;
    this.positionedNodes.forEach(({ node, x, y }) => {
      node?.setPosition?.(x, y + this.dy);
    });
    this.confirmButton?.setPosition?.(250, 1060 + this.dy);
    this.cancelButton?.setPosition?.(470, 1060 + this.dy);
  }

  open(user = {}) {
    const rawName = String(user?.nickname || user?.display_name || user?.username || "").trim();
    this.nickname = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    this.selectedAvatar = resolveMainAvatarFrame(this.scene, user?.avatar);
    this.statusText.setText("");
    this.setVisible(true);
    this.render();
  }

  close() {
    this.keyboardBar?.close?.();
    this.setVisible(false);
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    this.nodes.forEach((node) => {
      node?.setVisible?.(visible);
      if (node?.input) {
        node.input.enabled = Boolean(visible);
      }
    });
    this.confirmButton?.setVisible?.(visible);
    this.cancelButton?.setVisible?.(visible);
    return this;
  }

  openNicknameKeyboard() {
    this.keyboardBar?.open?.({
      value: this.nickname,
      placeholder: "請輸入暱稱",
      autocomplete: "nickname",
      onChange: (value) => {
        this.nickname = String(value || "");
        this.render();
      },
      onDone: (value) => {
        this.nickname = String(value || "");
        this.render();
      },
    });
  }

  render() {
    const shownName = this.nickname.trim() || "請輸入暱稱";
    this.nicknameText.setText(ellipsizeText(shownName, 14));
    this.nicknameText.setColor(this.nickname.trim() ? "#f4deba" : "#8f7b68");
    this.avatarNodes.forEach((node) => {
      const selected = node.frame === this.selectedAvatar;
      node.ring.setAlpha(selected ? 0.95 : 0.2);
      node.ring.setScale(selected ? 1.14 : 1);
      node.image.setDisplaySize(selected ? 68 : 60, selected ? 68 : 60);
    });
  }

  submit() {
    const nickname = this.nickname.trim();
    if (!nickname) {
      this.statusText.setText("請輸入暱稱");
      return;
    }
    if (nickname.length > 16) {
      this.statusText.setText("暱稱最多 16 個字");
      return;
    }
    if (!this.selectedAvatar) {
      this.statusText.setText("請選擇頭像");
      return;
    }
    this.onSubmit?.({
      nickname,
      avatar: this.selectedAvatar,
    });
    this.close();
  }

  destroy() {
    this.keyboardBar?.destroy?.();
    this.keyboardBar = null;
    this.confirmButton?.destroy?.();
    this.cancelButton?.destroy?.();
    this.nodes.forEach((node) => node?.destroy?.());
    this.panelMask?.destroy?.();
    this.nodes = [];
    this.positionedNodes = [];
    this.avatarNodes = [];
  }
}
