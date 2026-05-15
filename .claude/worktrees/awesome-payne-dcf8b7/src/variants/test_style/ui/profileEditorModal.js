import { createKeyboardBar, ellipsizeText } from "./input.js";
import { createRectButton } from "./button.js";

const AVATAR_FRAMES = Array.from({ length: 20 }, (_, index) => `avatar_${String(index + 1).padStart(3, "0")}`);
const TEXT_STYLE = {
  fontFamily: "sans-serif",
  fontStyle: "bold",
  color: "#ecd5b5",
  stroke: "#000000",
  strokeThickness: 1,
};

export class ProfileEditorModal {
  constructor(scene, { depth = 230, onSubmit } = {}) {
    this.scene = scene;
    this.depth = depth;
    this.onSubmit = onSubmit;
    this.nickname = "";
    this.selectedAvatar = "avatar_001";
    this.nodes = [];
    this.avatarNodes = [];
    this.keyboardBar = createKeyboardBar({
      id: `${scene.scene.key}-profile-keyboard-bar`,
      doneText: "完成",
    });

    this.create();
    this.setVisible(false);
  }

  create() {
    const { scene, depth } = this;
    this.overlay = scene.add.rectangle(360, 720, 720, 1440, 0x000000, 0.62).setDepth(depth);
    this.overlay.setInteractive({ useHandCursor: false });

    this.panel = scene.add.rectangle(360, 720, 620, 760, 0x13283a, 0.98).setDepth(depth + 1);
    this.panel.setInteractive({ useHandCursor: false });
    this.panel.on("pointerdown", () => {});

    this.titleText = scene.add.text(360, 392, "修改暱稱", {
      ...TEXT_STYLE,
      fontSize: "36px",
    }).setOrigin(0.5).setDepth(depth + 2);

    this.nicknameLabel = scene.add.text(140, 480, "暱稱", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2);

    this.nicknameInputBg = scene.add.rectangle(405, 480, 360, 64, 0x0f2130, 0.96)
      .setStrokeStyle(2, 0xecd5b5, 0.95)
      .setDepth(depth + 2);
    this.nicknameInputBg.setInteractive({ useHandCursor: true });
    this.nicknameInputBg.on("pointerup", () => this.openNicknameKeyboard());

    this.nicknameText = scene.add.text(245, 480, "", {
      fontFamily: "sans-serif",
      fontSize: "28px",
      color: "#f4deba",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    }).setOrigin(0, 0.5).setDepth(depth + 3);
    this.nicknameText.setInteractive({ useHandCursor: true });
    this.nicknameText.on("pointerup", () => this.openNicknameKeyboard());

    this.avatarLabel = scene.add.text(360, 565, "選擇頭像", {
      ...TEXT_STYLE,
      fontSize: "28px",
    }).setOrigin(0.5).setDepth(depth + 2);

    this.createAvatarGrid();

    this.statusText = scene.add.text(360, 982, "", {
      ...TEXT_STYLE,
      fontSize: "23px",
      color: "#ffcf7a",
      align: "center",
    }).setOrigin(0.5).setDepth(depth + 2);

    this.confirmButton = createRectButton(scene, {
      x: 250,
      y: 1050,
      width: 190,
      height: 64,
      label: "確認修改",
      color: 0x24583b,
      labelStyle: { ...TEXT_STYLE, fontSize: "25px" },
      onClick: () => this.submit(),
      visible: true,
    });
    this.confirmButton.bg.setDepth(depth + 2.4);
    this.confirmButton.text.setDepth(depth + 2.5);

    this.cancelButton = createRectButton(scene, {
      x: 470,
      y: 1050,
      width: 170,
      height: 64,
      label: "取消",
      color: 0x5b2c2c,
      labelStyle: { ...TEXT_STYLE, fontSize: "25px" },
      onClick: () => this.close(),
      visible: true,
    });
    this.cancelButton.bg.setDepth(depth + 2.4);
    this.cancelButton.text.setDepth(depth + 2.5);

    this.nodes.push(
      this.overlay,
      this.panel,
      this.titleText,
      this.nicknameLabel,
      this.nicknameInputBg,
      this.nicknameText,
      this.avatarLabel,
      this.statusText,
    );
  }

  createAvatarGrid() {
    const xs = [150, 255, 360, 465, 570];
    const ys = [645, 735, 825, 915];
    AVATAR_FRAMES.forEach((frame, index) => {
      const x = xs[index % xs.length];
      const y = ys[Math.floor(index / xs.length)];
      const ring = this.scene.add.circle(x, y, 37, 0xecd5b5, 0.22)
        .setStrokeStyle(3, 0xecd5b5, 0.95)
        .setDepth(this.depth + 2);
      const image = this.scene.add.image(x, y, "avatar_element", frame)
        .setScale(0.28)
        .setDepth(this.depth + 3);
      image.setInteractive({ useHandCursor: true });
      image.on("pointerup", () => {
        this.selectedAvatar = frame;
        this.render();
      });
      ring.setInteractive({ useHandCursor: true });
      ring.on("pointerup", () => {
        this.selectedAvatar = frame;
        this.render();
      });
      this.avatarNodes.push({ frame, ring, image });
      this.nodes.push(ring, image);
    });
  }

  open(user = {}) {
    this.nickname = String(user?.username || "").trim();
    this.selectedAvatar = this.resolveAvatarFrame(user?.avatar);
    this.statusText.setText("");
    this.setVisible(true);
    this.render();
  }

  close() {
    this.keyboardBar?.close?.();
    this.setVisible(false);
  }

  setVisible(visible) {
    this.nodes.forEach((node) => node?.setVisible?.(visible));
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
      node.ring.setAlpha(selected ? 0.9 : 0.22);
      node.ring.setScale(selected ? 1.12 : 1);
      node.image.setScale(selected ? 0.32 : 0.28);
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

  resolveAvatarFrame(frameRaw) {
    const frame = String(frameRaw || "avatar_001");
    const atlas = this.scene.textures.get("avatar_element");
    return atlas?.has?.(frame) ? frame : "avatar_001";
  }

  destroy() {
    this.keyboardBar?.destroy?.();
    this.keyboardBar = null;
    this.confirmButton?.destroy?.();
    this.cancelButton?.destroy?.();
    this.nodes.forEach((node) => node?.destroy?.());
    this.nodes = [];
    this.avatarNodes = [];
  }
}
