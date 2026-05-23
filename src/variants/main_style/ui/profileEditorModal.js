import { createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "./button.js";
import { layout } from "../../../shared/core/layout.js";

const INPUT_TEXT_COLOR = "#f4deba";
const INPUT_PH_COLOR = "rgba(143,123,104,0.85)";

const AVATAR_FRAMES = Array.from({ length: 20 }, (_, index) => `avatar_${index + 1}`);
const PANEL_X = 360;
const PANEL_Y = 720;
const PANEL_WIDTH = 650;
const PANEL_HEIGHT = 1050;
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
    this._editMode = { email: false, phone: false, nickname: false };
    this._verified = { email: false, phone: false };
    this._originalValues = { email: "", phone: "" };
    this._nickEl = this._createNickInput(`${scene.scene.key}-main-profile-nick`);
    this._emailEl = this._createEmailInput(`${scene.scene.key}-main-profile-email`);
    this._phoneEl = this._createPhoneInput(`${scene.scene.key}-main-profile-phone`);
    this._verifyCodeEl = this._createVerifyCodeInput(`${scene.scene.key}-main-profile-verify-code`);
    this._currentVerifyField = null;
    this._avatarScrollOffset = 35;
    this._baseAvatarYs = [];
    this._avatarInputBlocked = false;
    this._avatarScrollListener = null;
    this._avatarNativeTouchStart = null;
    this._avatarNativeTouchMove = null;
    this._avatarNativeTouchEnd = null;
    this._avatarDragStartY = null;
    this._avatarDragStartOffset = 0;
    this._avatarWasDragged = false;
    this._avatarInertiaId = null;
    this._kbOffset = 0;
    this._initWindowH = window.innerHeight;
    this._onWindowResize = () => {
      if (this.visible) this._adjustForKeyboard();
      this._syncNickInputPosition();
      this._syncEmailInputPosition();
      this._syncPhoneInputPosition();
      this._syncVerifyCodeInputPosition();
    };
    window.addEventListener("resize", this._onWindowResize);
    window.visualViewport?.addEventListener?.("resize", this._onWindowResize);

    this.create();
    this.setVisible(false);
  }

  _createNickInput(id) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id;
    el.type = "text";
    el.placeholder = "請輸入暱稱";
    el.autocomplete = "nickname";
    el.maxLength = 16;
    Object.assign(el.style, {
      position: "fixed",
      background: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      color: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR,
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontWeight: "bold",
      zIndex: "9999",
      padding: "0 12px",
      boxSizing: "border-box",
      visibility: "hidden",
    });
    // Placeholder color via inline ::placeholder isn't possible, use a one-off style tag
    if (!document.getElementById("profile-nick-ph-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "profile-nick-ph-style";
      styleEl.textContent = `input[id$="-main-profile-nick"]::placeholder{color:${INPUT_PH_COLOR};}`;
      document.head.appendChild(styleEl);
    }
    el.addEventListener("input", () => {
      this.nickname = String(el.value || "");
      this.statusText?.setText("");
    });
    document.body.appendChild(el);
    return el;
  }

  _createEmailInput(id) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id;
    el.type = "email";
    el.placeholder = "請輸入郵箱";
    Object.assign(el.style, {
      position: "fixed",
      background: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      color: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR,
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontWeight: "bold",
      zIndex: "9999",
      padding: "0 12px",
      boxSizing: "border-box",
      visibility: "hidden",
    });
    if (!document.getElementById("profile-email-ph-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "profile-email-ph-style";
      styleEl.textContent = `input[id$="-main-profile-email"]::placeholder{color:${INPUT_PH_COLOR};}`;
      document.head.appendChild(styleEl);
    }
    el.addEventListener("input", () => this.statusText?.setText(""));
    document.body.appendChild(el);
    return el;
  }

  _createPhoneInput(id) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id;
    el.type = "tel";
    el.placeholder = "請輸入電話";
    Object.assign(el.style, {
      position: "fixed",
      background: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      color: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR,
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontWeight: "bold",
      zIndex: "9999",
      padding: "0 12px",
      boxSizing: "border-box",
      visibility: "hidden",
    });
    if (!document.getElementById("profile-phone-ph-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "profile-phone-ph-style";
      styleEl.textContent = `input[id$="-main-profile-phone"]::placeholder{color:${INPUT_PH_COLOR};}`;
      document.head.appendChild(styleEl);
    }
    el.addEventListener("input", () => this.statusText?.setText(""));
    document.body.appendChild(el);
    return el;
  }

  _createVerifyCodeInput(id) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id;
    el.type = "text";
    el.placeholder = "請輸入驗證碼";
    el.maxLength = 6;
    Object.assign(el.style, {
      position: "fixed",
      background: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      color: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR,
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontWeight: "bold",
      zIndex: "9999",
      padding: "0 12px",
      boxSizing: "border-box",
      visibility: "hidden",
      textAlign: "center",
      letterSpacing: "4px",
    });
    if (!document.getElementById("profile-verify-code-ph-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "profile-verify-code-ph-style";
      styleEl.textContent = `input[id$="-main-profile-verify-code"]::placeholder{color:${INPUT_PH_COLOR};}`;
      document.head.appendChild(styleEl);
    }
    document.body.appendChild(el);
    return el;
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
    this.titleText = scene.add.text(PANEL_X, PANEL_TOP + 8, "我的資料", {
      ...TEXT_STYLE,
      fontSize: "36px",
      color: "#f0c040",
    }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);
    applyGoldTitleGradient(this.titleText);

    this.infoBgGfx = scene.add.graphics().setDepth(depth + 1).setVisible(false);

    this.emailLabel = scene.add.text(100, 320, "郵箱", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.emailInputBg = scene.add.rectangle(330, 320, 300, 50, 0x1b0508, 0.96)
      .setStrokeStyle(2, 0xd4890f, 0.95)
      .setDepth(depth + 2)
      .setVisible(false);

    this.emailValueText = scene.add.text(210, 320, "---", {
      ...TEXT_STYLE,
      fontSize: "20px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.emailVerifyBtn = createGradientButton(scene, {
      x: 545, y: 320, width: 70, height: 50, cornerRadius: 8,
      topColor: 0x1a4d99, bottomColor: 0x0d2e5e, borderColor: 0x2a7dd9,
      label: "編輯",
      labelStyle: { fontSize: "16px", color: "#fff" },
      depth: depth + 3,
      onClick: () => this._verifyEmail(),
      visible: false,
    });

    this.emailConfirmBtn = createGradientButton(scene, {
      x: 620, y: 320, width: 70, height: 50, cornerRadius: 8,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認",
      labelStyle: { fontSize: "16px", color: "#fff" },
      depth: depth + 3,
      onClick: () => this._confirmEmail(),
      visible: false,
    });

    this.phoneLabel = scene.add.text(100, 385, "電話", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.phoneInputBg = scene.add.rectangle(330, 385, 300, 50, 0x1b0508, 0.96)
      .setStrokeStyle(2, 0xd4890f, 0.95)
      .setDepth(depth + 2)
      .setVisible(false);

    this.phoneValueText = scene.add.text(210, 385, "---", {
      ...TEXT_STYLE,
      fontSize: "20px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.phoneVerifyBtn = createGradientButton(scene, {
      x: 515, y: 385, width: 70, height: 50, cornerRadius: 8,
      topColor: 0x1a4d99, bottomColor: 0x0d2e5e, borderColor: 0x2a7dd9,
      label: "編輯",
      labelStyle: { fontSize: "16px", color: "#fff" },
      depth: depth + 3,
      onClick: () => this._verifyPhone(),
      visible: false,
    });

    this.phoneConfirmBtn = createGradientButton(scene, {
      x: 620, y: 385, width: 70, height: 50, cornerRadius: 8,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認",
      labelStyle: { fontSize: "16px", color: "#fff" },
      depth: depth + 3,
      onClick: () => this._confirmPhone(),
      visible: false,
    });

    this.nicknameLabel = scene.add.text(100, 450, "暱稱", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.nicknameValueText = scene.add.text(210, 450, "---", {
      ...TEXT_STYLE,
      fontSize: "20px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.nicknameInputBg = scene.add.rectangle(330, 450, 300, 50, 0x1b0508, 0.96)
      .setStrokeStyle(2, 0xd4890f, 0.95)
      .setDepth(depth + 2)
      .setVisible(false);

    this.nicknameConfirmBtn = createGradientButton(scene, {
      x: 515, y: 450, width: 70, height: 50, cornerRadius: 8,
      topColor: 0x1a4d99, bottomColor: 0x0d2e5e, borderColor: 0x2a7dd9,
      label: "編輯",
      labelStyle: { fontSize: "16px", color: "#fff" },
      depth: depth + 3,
      onClick: () => this._confirmNickname(),
      visible: false,
    });

    this.genderLabel = scene.add.text(100, 515, "性別", {
      ...TEXT_STYLE,
      fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.genderValueText = scene.add.text(192, 515, "---", {
      ...TEXT_STYLE,
      fontSize: "24px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    this.avatarBgGfx = scene.add.graphics().setDepth(depth + 1).setVisible(false);

    this.avatarMaskGfx = scene.make.graphics({ add: false });
    this.avatarMaskGfx.fillStyle(0xffffff);
    this.avatarMaskGfx.fillRoundedRect(50, 630, 620, 480, 14);

    this.avatarLabel = scene.add.text(PANEL_X, 600, "選擇頭像", {
      ...TEXT_STYLE,
      fontSize: "31px",
      color: "#f0c040",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    applyGoldTitleGradient(this.avatarLabel);

    this.createAvatarGrid();
    this._applyAvatarMask();

    this.statusText = scene.add.text(PANEL_X, 1090, "", {
      ...TEXT_STYLE,
      fontSize: "23px",
      color: "#ffcf7a",
      align: "center",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);

    this.confirmButton = createGradientButton(scene, {
      x: 250,
      y: 1170,
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
      y: 1170,
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
      this.emailLabel,
      this.emailInputBg,
      this.emailValueText,
      this.emailVerifyBtn,
      this.emailConfirmBtn,
      this.phoneLabel,
      this.phoneInputBg,
      this.phoneValueText,
      this.phoneVerifyBtn,
      this.phoneConfirmBtn,
      this.nicknameLabel,
      this.nicknameInputBg,
      this.nicknameValueText,
      this.nicknameConfirmBtn,
      this.genderLabel,
      this.genderValueText,
      this.avatarLabel,
      this.statusText,
    ].forEach((node) => this.track(node, node.x, node.y));
    this.nodes.push(
      this.overlay, this.panelBorder, this.panel,
      this.titleLabel, this.titleText,
      this.infoBgGfx,
      this.emailLabel, this.emailInputBg, this.emailValueText, this.emailVerifyBtn, this.emailConfirmBtn,
      this.phoneLabel, this.phoneInputBg, this.phoneValueText, this.phoneVerifyBtn, this.phoneConfirmBtn,
      this.nicknameLabel, this.nicknameInputBg, this.nicknameValueText, this.nicknameConfirmBtn,
      this.genderLabel, this.genderValueText,
      this.avatarBgGfx,
      this.avatarLabel, this.statusText
    );

    this.renderBlockBgs();
  }

  createAvatarGrid() {
    const xs = [130, 280, 430, 580];
    const baseYs = [670, 810, 950, 1090, 1230];
    this._baseAvatarYs = baseYs;
    AVATAR_FRAMES.forEach((frame, index) => {
      const x = xs[index % xs.length];
      const baseY = baseYs[Math.floor(index / xs.length)];
      const ring = this.scene.add.circle(x, baseY, 60, 0xf0c040, 0.18)
        .setStrokeStyle(3, 0xf0c040, 0.82)
        .setDepth(this.depth + 2)
        .setVisible(false);
      const image = this.scene.add.image(x, baseY, "avatar_element", frame)
        .setDisplaySize(120, 120)
        .setDepth(this.depth + 3)
        .setVisible(false);
      const select = () => {
        if (this._avatarInputBlocked) return;
        if (this._avatarWasDragged) { this._avatarWasDragged = false; return; }
        this.selectedAvatar = frame;
        try { localStorage.setItem("last_selected_avatar", frame); } catch (_) {}
        this.render();
      };
      image.setInteractive({ useHandCursor: true });
      image.on("pointerup", select);
      ring.setInteractive({ useHandCursor: true });
      ring.on("pointerup", select);
      this.avatarNodes.push({ frame, ring, image, x, baseY });
      this.track(ring, x, baseY);
      this.track(image, x, baseY);
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
    if (this.infoBgGfx) this.infoBgGfx.y = this.dy;
    if (this.avatarBgGfx) this.avatarBgGfx.y = this.dy;
    if (this.avatarMaskGfx) this.avatarMaskGfx.y = this.dy;
    this.positionedNodes.forEach(({ node, x, y }) => {
      node?.setPosition?.(x, y + this.dy);
    });
    this.confirmButton?.setPosition?.(250, 1170 + this.dy);
    this.cancelButton?.setPosition?.(470, 1170 + this.dy);
    this.emailValueText?.setPosition?.(210, 320 + this.dy);
    this.emailInputBg?.setPosition?.(330, 320 + this.dy);
    this.emailVerifyBtn?.setPosition?.(545, 320 + this.dy);
    this.emailConfirmBtn?.setPosition?.(620, 320 + this.dy);
    this.phoneValueText?.setPosition?.(210, 385 + this.dy);
    this.phoneInputBg?.setPosition?.(330, 385 + this.dy);
    this.phoneVerifyBtn?.setPosition?.(545, 385 + this.dy);
    this.phoneConfirmBtn?.setPosition?.(620, 385 + this.dy);
    this.nicknameValueText?.setPosition?.(210, 450 + this.dy);
    this.nicknameInputBg?.setPosition?.(330, 450 + this.dy);
    this.nicknameConfirmBtn?.setPosition?.(545, 450 + this.dy);
    this._updateAvatarPositions();
    this._syncNickInputPosition();
    this._syncEmailInputPosition();
    this._syncPhoneInputPosition();
    this._syncVerifyCodeInputPosition();
  }

  open(user = {}) {
    this._initWindowH = window.innerHeight;
    this._kbOffset = 0;
    const rawName = String(user?.nickname || user?.display_name || user?.username || "").trim();
    this.nickname = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    const _serverAvatar = user?.avatar;
    const _fallback = (() => { try { return localStorage.getItem("last_selected_avatar") || "avatar_1"; } catch (_) { return "avatar_1"; } })();
    this.selectedAvatar = resolveMainAvatarFrame(this.scene, _serverAvatar || _fallback);
    this.statusText.setText("");
    const email = String(user?.email || "---");
    const phone = String(user?.phone || "---");
    this._originalValues.email = email;
    this._originalValues.phone = phone;
    this._verified.email = false;
    this._verified.phone = false;
    if (this._emailEl) {
      this._emailEl.value = email;
    }
    if (this._phoneEl) {
      this._phoneEl.value = phone;
    }
    if (this._nickEl) {
      this._nickEl.value = this.nickname;
    }
    this.genderValueText?.setText(String(user?.gender || "男"));
    this._resetEditModes();
    this._avatarInputBlocked = true;
    this.scene.time.delayedCall(350, () => { this._avatarInputBlocked = false; });
    this.setVisible(true);
    this._syncNickInputPosition();
    this._syncEmailInputPosition();
    this._syncPhoneInputPosition();
    this._avatarScrollOffset = 35;
    this._setupAvatarScroll();
    this._updateAvatarPositions();
    this.render();
  }

  close() {
    if (this._kbOffset > 0) {
      this._kbOffset = 0;
      const root = document.getElementById("phaser-root");
      if (root) { root.style.transition = "none"; root.style.transform = ""; }
    }
    this._nickEl?.blur?.();
    this._emailEl?.blur?.();
    this._phoneEl?.blur?.();
    if (this._verifyCodeEl) this._verifyCodeEl.style.visibility = "hidden";
    if (this._avatarScrollListener) {
      this.scene.input.off("wheel", this._avatarScrollListener);
      this._avatarScrollListener = null;
    }
    this._cleanupAvatarNativeTouch();
    this._resetEditModes();
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
    if (visible) {
      this._resetEditModes();
      this._updateAvatarPositions();
    } else {
      if (this._nickEl) this._nickEl.style.visibility = "hidden";
      if (this._emailEl) this._emailEl.style.visibility = "hidden";
      if (this._phoneEl) this._phoneEl.style.visibility = "hidden";
      if (this._verifyCodeEl) this._verifyCodeEl.style.visibility = "hidden";
    }
    return this;
  }

  _adjustForKeyboard() {
    const root = document.getElementById("phaser-root");
    if (!root) return;
    const vv = window.visualViewport;
    const visibleH = vv ? vv.height : window.innerHeight;
    const keyboardH = Math.max(0, this._initWindowH - visibleH);
    if (keyboardH < 80) {
      if (this._kbOffset > 0) {
        this._kbOffset = 0;
        root.style.transition = "none";
        root.style.transform = "";
      }
      return;
    }
    if (this._kbOffset === 0) {
      const physScale = window.innerWidth / 720;
      // Anchor to bottom of the info block (covers email/phone/nickname + verify code)
      const anchorPhysY = (550 + this.dy) * physScale;
      const autoShift = Math.max(0, Math.ceil(anchorPhysY - (visibleH - 24)));
      if (autoShift > 0) {
        this._kbOffset = Math.min(autoShift, keyboardH);
        root.style.transition = "none";
        root.style.transform = `translateY(-${this._kbOffset}px)`;
      }
    }
  }

  _syncNickInputPosition() {
    if (!this._nickEl || !this.visible) return;
    const canvas = this.scene?.sys?.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top + (rect.height - layout.height * scale) / 2;
    // nicknameInputBg is at design coords (330, 450), size 300x50 centered.
    const designX = 330 - 300 / 2;
    const designY = 450 - 50 / 2 + this.dy;
    const designW = 300;
    const designH = 50;
    Object.assign(this._nickEl.style, {
      left:       Math.round(ox + designX * scale) + "px",
      top:        Math.round(oy + designY * scale) + "px",
      width:      Math.round(designW * scale) + "px",
      height:     Math.round(designH * scale) + "px",
      fontSize:   Math.round(24 * scale) + "px",
      lineHeight: Math.round(designH * scale) + "px",
    });
  }

  renderBlockBgs() {
    const CR = 14;
    this.infoBgGfx.clear();
    this.infoBgGfx.fillStyle(0x0a0502, 0.85);
    this.infoBgGfx.fillRoundedRect(50, 270, 620, 280, CR);
    this.infoBgGfx.lineStyle(2, 0xd4890f, 0.8);
    this.infoBgGfx.strokeRoundedRect(50, 270, 620, 280, CR);

    this.avatarBgGfx.clear();
    this.avatarBgGfx.fillStyle(0x0a0502, 0.85);
    this.avatarBgGfx.fillRoundedRect(50, 630, 620, 480, CR);
    this.avatarBgGfx.lineStyle(2, 0xd4890f, 0.8);
    this.avatarBgGfx.strokeRoundedRect(50, 630, 620, 480, CR);
  }

  _setupAvatarScroll() {
    if (this._avatarScrollListener) {
      this.scene.input.off("wheel", this._avatarScrollListener);
      this._avatarScrollListener = null;
    }
    this._cleanupAvatarNativeTouch();

    const AVATAR_MIN = -180, AVATAR_MAX = 40;
    const GRID_LEFT = 40, GRID_RIGHT = 680, GRID_TOP = 600, GRID_BOTTOM = 1140;
    const DRAG_THRESHOLD = 5;
    const canvas = this.scene.game.canvas;

    const getToWorld = () => {
      const rect = canvas.getBoundingClientRect();
      const cam = this.scene.cameras.main;
      return (canvas.height / rect.height) / cam.zoom;
    };
    const clientToWorld = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const tw = getToWorld();
      const cam = this.scene.cameras.main;
      return {
        x: cam.scrollX + (clientX - rect.left) * (canvas.width / rect.width) / cam.zoom,
        y: cam.scrollY + (clientY - rect.top) * tw,
      };
    };
    const getPhysTranslate = () => {
      const root = document.getElementById('phaser-root');
      if (!root) return 0;
      const m = root.style.transform?.match(/translateY\((-?[\d.]+)px\)/);
      return m ? parseFloat(m[1]) : 0;
    };

    // Mouse wheel (desktop) — only when pointer is over the avatar grid
    this._avatarScrollListener = (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.visible) return;
      const localY = pointer.worldY - this.dy;
      if (pointer.worldX < GRID_LEFT || pointer.worldX > GRID_RIGHT || localY < GRID_TOP || localY > GRID_BOTTOM) return;
      if (this._avatarInertiaId) { cancelAnimationFrame(this._avatarInertiaId); this._avatarInertiaId = null; }
      this._avatarScrollOffset = Math.max(AVATAR_MIN, Math.min(AVATAR_MAX, this._avatarScrollOffset - deltaY * 0.5));
      this._updateAvatarPositions();
    };
    this.scene.input.on("wheel", this._avatarScrollListener);

    // Inertia loop for smooth deceleration after touch
    let avatarVelocity = 0;
    let avatarLastClientY = 0;
    let avatarLastTime = 0;
    const applyAvatarInertia = () => {
      if (!this.visible || Math.abs(avatarVelocity) < 0.3) {
        avatarVelocity = 0; this._avatarInertiaId = null; return;
      }
      avatarVelocity *= 0.90;
      this._avatarScrollOffset = Math.max(AVATAR_MIN, Math.min(AVATAR_MAX, this._avatarScrollOffset + avatarVelocity * getToWorld()));
      this._updateAvatarPositions();
      this._avatarInertiaId = requestAnimationFrame(applyAvatarInertia);
    };

    // Modal drag state (for repositioning whole panel when keyboard is up)
    let modalDragStartClientY = null;
    let modalDragStartTranslate = 0;
    // 'avatar' | 'modal' | null
    let dragMode = null;

    this._avatarNativeTouchStart = (e) => {
      if (!this.visible || !e.touches.length) return;
      const t = e.touches[0];
      const pos = clientToWorld(t.clientX, t.clientY);
      const localY = pos.y - this.dy;

      if (pos.x >= GRID_LEFT && pos.x <= GRID_RIGHT && localY >= GRID_TOP && localY <= GRID_BOTTOM) {
        dragMode = 'avatar';
        if (this._avatarInertiaId) { cancelAnimationFrame(this._avatarInertiaId); this._avatarInertiaId = null; }
        avatarVelocity = 0;
        this._avatarDragStartY = t.clientY;
        this._avatarDragStartOffset = this._avatarScrollOffset;
        this._avatarWasDragged = false;
        avatarLastClientY = t.clientY;
        avatarLastTime = performance.now();
      } else if (this._kbOffset > 0) {
        // Modal repositioning only active while keyboard is pushing the view up
        const panelL = PANEL_X - PANEL_WIDTH / 2;
        const panelR = PANEL_X + PANEL_WIDTH / 2;
        if (pos.x >= panelL && pos.x <= panelR && localY >= PANEL_TOP && localY <= PANEL_TOP + PANEL_HEIGHT) {
          dragMode = 'modal';
          modalDragStartClientY = t.clientY;
          modalDragStartTranslate = getPhysTranslate();
        }
      }
    };

    this._avatarNativeTouchMove = (e) => {
      if (!this.visible || !e.touches.length || dragMode === null) return;
      const t = e.touches[0];

      if (dragMode === 'avatar' && this._avatarDragStartY !== null) {
        const now = performance.now();
        const dt = now - avatarLastTime;
        if (dt > 0) avatarVelocity = (t.clientY - avatarLastClientY) / dt * 16;
        avatarLastClientY = t.clientY;
        avatarLastTime = now;
        const delta = t.clientY - this._avatarDragStartY;
        if (Math.abs(delta) > DRAG_THRESHOLD) this._avatarWasDragged = true;
        e.preventDefault();
        this._avatarScrollOffset = Math.max(AVATAR_MIN, Math.min(AVATAR_MAX, this._avatarDragStartOffset + delta * getToWorld()));
        this._updateAvatarPositions();
      } else if (dragMode === 'modal' && modalDragStartClientY !== null) {
        const delta = t.clientY - modalDragStartClientY;
        if (Math.abs(delta) > DRAG_THRESHOLD) {
          e.preventDefault();
          const root = document.getElementById('phaser-root');
          if (!root) return;
          const newT = modalDragStartTranslate + delta;
          const clamped = Math.min(50, Math.max(-window.innerHeight * 0.7, newT));
          root.style.transform = clamped === 0 ? '' : `translateY(${clamped}px)`;
          this._kbOffset = -clamped;
        }
      }
    };

    this._avatarNativeTouchEnd = () => {
      if (dragMode === 'avatar') {
        this._avatarDragStartY = null;
        if (Math.abs(avatarVelocity) > 0.5) {
          this._avatarInertiaId = requestAnimationFrame(applyAvatarInertia);
        }
      } else if (dragMode === 'modal') {
        modalDragStartClientY = null;
      }
      dragMode = null;
    };

    canvas.addEventListener('touchstart', this._avatarNativeTouchStart, { passive: true });
    canvas.addEventListener('touchmove', this._avatarNativeTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._avatarNativeTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', this._avatarNativeTouchEnd, { passive: true });
  }

  _cleanupAvatarNativeTouch() {
    if (this._avatarInertiaId) { cancelAnimationFrame(this._avatarInertiaId); this._avatarInertiaId = null; }
    const canvas = this.scene.game.canvas;
    if (this._avatarNativeTouchStart) {
      canvas.removeEventListener('touchstart', this._avatarNativeTouchStart);
      canvas.removeEventListener('touchmove', this._avatarNativeTouchMove);
      canvas.removeEventListener('touchend', this._avatarNativeTouchEnd);
      canvas.removeEventListener('touchcancel', this._avatarNativeTouchEnd);
      this._avatarNativeTouchStart = null;
      this._avatarNativeTouchMove = null;
      this._avatarNativeTouchEnd = null;
    }
    this._avatarDragStartY = null;
  }

  _applyAvatarMask() {
    const mask = this.avatarMaskGfx.createGeometryMask();
    this.avatarNodes.forEach((node) => {
      node.ring.setMask(mask);
      node.image.setMask(mask);
    });
  }

  _updateAvatarPositions() {
    this.avatarNodes.forEach((node, index) => {
      const row = Math.floor(index / 4);
      const baseY = this._baseAvatarYs[row];
      const newY = baseY + this._avatarScrollOffset + this.dy;
      node.ring.setPosition(node.x, newY).setVisible(this.visible);
      node.image.setPosition(node.x, newY).setVisible(this.visible);
    });
  }

  render() {
    this.avatarNodes.forEach((node) => {
      const selected = node.frame === this.selectedAvatar;
      node.ring.setAlpha(selected ? 0.95 : 0.2);
      node.ring.setScale(selected ? 1.14 : 1);
      node.image.setDisplaySize(selected ? 130 : 120, selected ? 130 : 120);
    });
  }

  submit() {
    const liveValue = this._nickEl ? String(this._nickEl.value || "") : this.nickname;
    const nickname = liveValue.trim();
    this.nickname = nickname;
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

  _syncEmailInputPosition() {
    if (!this._emailEl || !this.visible) return;
    const canvas = this.scene?.sys?.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top + (rect.height - layout.height * scale) / 2;
    const designX = 330 - 300 / 2;
    const designY = 320 - 50 / 2 + this.dy;
    const designW = 300;
    const designH = 50;
    Object.assign(this._emailEl.style, {
      left: Math.round(ox + designX * scale) + "px",
      top: Math.round(oy + designY * scale) + "px",
      width: Math.round(designW * scale) + "px",
      height: Math.round(designH * scale) + "px",
      fontSize: Math.round(24 * scale) + "px",
      lineHeight: Math.round(designH * scale) + "px",
    });
  }

  _syncPhoneInputPosition() {
    if (!this._phoneEl || !this.visible) return;
    const canvas = this.scene?.sys?.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top + (rect.height - layout.height * scale) / 2;
    const designX = 330 - 300 / 2;
    const designY = 385 - 50 / 2 + this.dy;
    const designW = 300;
    const designH = 50;
    Object.assign(this._phoneEl.style, {
      left: Math.round(ox + designX * scale) + "px",
      top: Math.round(oy + designY * scale) + "px",
      width: Math.round(designW * scale) + "px",
      height: Math.round(designH * scale) + "px",
      fontSize: Math.round(24 * scale) + "px",
      lineHeight: Math.round(designH * scale) + "px",
    });
  }

  _syncVerifyCodeInputPosition() {
    if (!this._verifyCodeEl || !this.visible || this._verifyCodeEl.style.visibility === "hidden") return;
    const canvas = this.scene?.sys?.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top + (rect.height - layout.height * scale) / 2;
    // Position below the active field (email or phone)
    const yOffset = this._currentVerifyField === "email" ? 355 : 420;
    const designX = 330 - 300 / 2;
    const designY = yOffset - 50 / 2 + this.dy;
    const designW = 300;
    const designH = 50;
    Object.assign(this._verifyCodeEl.style, {
      left: Math.round(ox + designX * scale) + "px",
      top: Math.round(oy + designY * scale) + "px",
      width: Math.round(designW * scale) + "px",
      height: Math.round(designH * scale) + "px",
      fontSize: Math.round(24 * scale) + "px",
      lineHeight: Math.round(designH * scale) + "px",
    });
  }

  _enterEditMode(field) {
    this._editMode[field] = true;
    if (field === "email") {
      if (this._emailEl) {
        this._emailEl.readOnly = false;
        this._emailEl.style.visibility = "visible";
        this._emailEl.style.color = INPUT_TEXT_COLOR;
        this.emailVerifyBtn?.setLabel?.("驗証");
        this.emailVerifyBtn?.setVisible(true);
        this.emailConfirmBtn?.setVisible(true);
        this._syncEmailInputPosition();
        this._emailEl.focus({ preventScroll: true });
        const end = this._emailEl.value.length;
        try { this._emailEl.setSelectionRange(end, end); } catch (_) {}
      }
    } else if (field === "phone") {
      if (this._phoneEl) {
        this._phoneEl.readOnly = false;
        this._phoneEl.style.visibility = "visible";
        this._phoneEl.style.color = INPUT_TEXT_COLOR;
        this.phoneVerifyBtn?.setLabel?.("驗証");
        this.phoneVerifyBtn?.setVisible(true);
        this.phoneConfirmBtn?.setVisible(true);
        this._syncPhoneInputPosition();
        this._phoneEl.focus({ preventScroll: true });
        const end = this._phoneEl.value.length;
        try { this._phoneEl.setSelectionRange(end, end); } catch (_) {}
      }
    } else if (field === "nickname") {
      if (this._nickEl) {
        this._nickEl.readOnly = false;
        this._nickEl.style.color = INPUT_TEXT_COLOR;
        this._nickEl.style.visibility = "visible";
        this.nicknameConfirmBtn?.setLabel?.("確認");
        this.nicknameConfirmBtn?.setGradient?.(0x3db428, 0x145018, 0x1aed30);
        this.nicknameConfirmBtn?.setVisible(true);
        this._syncNickInputPosition();
        this._nickEl.focus({ preventScroll: true });
        const end = this._nickEl.value.length;
        try { this._nickEl.setSelectionRange(end, end); } catch (_) {}
      }
    }
  }

  _resetEditMode(field) {
    if (field === "email") {
      this._editMode.email = false;
      this.emailValueText?.setVisible(false);
      this.emailInputBg?.setVisible(true);
      this.emailVerifyBtn?.setVisible(true);
      this.emailVerifyBtn?.setLabel?.("編輯");
      this.emailConfirmBtn?.setVisible(false);
      if (this._emailEl) {
        this._emailEl.style.visibility = "visible";
        this._emailEl.readOnly = true;
        this._emailEl.style.color = "#92363a";
      }
    } else if (field === "phone") {
      this._editMode.phone = false;
      this.phoneValueText?.setVisible(false);
      this.phoneInputBg?.setVisible(true);
      this.phoneVerifyBtn?.setVisible(true);
      this.phoneVerifyBtn?.setLabel?.("編輯");
      this.phoneConfirmBtn?.setVisible(false);
      if (this._phoneEl) {
        this._phoneEl.style.visibility = "visible";
        this._phoneEl.readOnly = true;
        this._phoneEl.style.color = "#92363a";
      }
    } else if (field === "nickname") {
      this._editMode.nickname = false;
      this.nicknameValueText?.setVisible(false);
      this.nicknameInputBg?.setVisible(true);
      this.nicknameConfirmBtn?.setVisible(true);
      this.nicknameConfirmBtn?.setLabel?.("編輯");
      this.nicknameConfirmBtn?.setGradient?.(0x1a4d99, 0x0d2e5e, 0x2a7dd9);
      if (this._nickEl) {
        this._nickEl.style.visibility = "visible";
        this._nickEl.readOnly = true;
        this._nickEl.style.color = "#92363a";
      }
    }
  }

  _resetEditModes() {
    this._editMode.email = false;
    this._editMode.phone = false;
    this._editMode.nickname = false;
    // Email: show input box (readonly) and edit button only
    this.emailValueText?.setVisible(false);
    this.emailInputBg?.setVisible(true);
    this.emailVerifyBtn?.setVisible(true);
    this.emailVerifyBtn?.setLabel?.("編輯");
    this.emailConfirmBtn?.setVisible(false);
    if (this._emailEl) {
      this._emailEl.style.visibility = "visible";
      this._emailEl.readOnly = true;
      this._emailEl.style.color = "#92363a";
    }
    // Phone: show input box (readonly) and edit button only
    this.phoneValueText?.setVisible(false);
    this.phoneInputBg?.setVisible(true);
    this.phoneVerifyBtn?.setVisible(true);
    this.phoneVerifyBtn?.setLabel?.("編輯");
    this.phoneConfirmBtn?.setVisible(false);
    if (this._phoneEl) {
      this._phoneEl.style.visibility = "visible";
      this._phoneEl.readOnly = true;
      this._phoneEl.style.color = "#92363a";
    }
    // Nickname: show input box (readonly) and edit button
    this.nicknameValueText?.setVisible(false);
    this.nicknameInputBg?.setVisible(true);
    this.nicknameConfirmBtn?.setVisible(true);
    this.nicknameConfirmBtn?.setLabel?.("編輯");
    this.nicknameConfirmBtn?.setGradient?.(0x1a4d99, 0x0d2e5e, 0x2a7dd9);
    if (this._nickEl) {
      this._nickEl.style.visibility = "visible";
      this._nickEl.readOnly = true;
      this._nickEl.style.color = "#92363a";
    }
    if (this._verifyCodeEl) {
      this._verifyCodeEl.style.visibility = "hidden";
      this._verifyCodeEl.value = "";
    }
    this._currentVerifyField = null;
  }

  _verifyEmail() {
    const email = String(this._emailEl?.value || "").trim();

    // If not in edit mode, enter edit mode
    if (!this._editMode.email) {
      this._enterEditMode("email");
      this.statusText?.setText("");
      return;
    }

    // In edit mode: validate and send verification code
    if (!email) {
      this.statusText?.setText("請輸入郵箱");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.statusText?.setText("請輸入有效的郵箱地址");
      return;
    }

    this._currentVerifyField = "email";
    this._verifyCodeEl.value = "";
    this._verifyCodeEl.style.visibility = "visible";
    this._syncVerifyCodeInputPosition();
    this._verifyCodeEl.focus();
    this.statusText?.setText("驗証碼已發送到郵箱");

    const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
    const token = store.accessToken ?? "";

    fetch("/api/verify/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this._verified.email = true;
        } else {
          this.statusText?.setText(data.message || "發送驗証碼失敗");
        }
      })
      .catch(err => {
        console.error("Verify email error:", err);
        this.statusText?.setText("網絡錯誤");
      });
  }

  _verifyPhone() {
    const phone = String(this._phoneEl?.value || "").trim();

    // If not in edit mode, enter edit mode
    if (!this._editMode.phone) {
      this._enterEditMode("phone");
      this.statusText?.setText("");
      return;
    }

    // In edit mode: validate and send verification code
    if (!phone) {
      this.statusText?.setText("請輸入電話");
      return;
    }

    const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
    if (!phoneRegex.test(phone)) {
      this.statusText?.setText("請輸入有效的電話號碼");
      return;
    }

    this._currentVerifyField = "phone";
    this._verifyCodeEl.value = "";
    this._verifyCodeEl.style.visibility = "visible";
    this._syncVerifyCodeInputPosition();
    this._verifyCodeEl.focus();
    this.statusText?.setText("驗証碼已發送到電話");

    const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
    const token = store.accessToken ?? "";

    fetch("/api/verify/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ phone }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this._verified.phone = true;
        } else {
          this.statusText?.setText(data.message || "發送驗証碼失敗");
        }
      })
      .catch(err => {
        console.error("Verify phone error:", err);
        this.statusText?.setText("網絡錯誤");
      });
  }

  _confirmEmail() {
    const email = String(this._emailEl?.value || "").trim();
    const originalEmail = String(this._originalValues.email || "---");
    const isEmailModified = email !== originalEmail;

    // If email is modified, must verify first
    if (isEmailModified && !this._verified.email) {
      this.statusText?.setText("請先驗証郵箱");
      return;
    }

    // If email is modified, need verification code
    if (isEmailModified) {
      const code = String(this._verifyCodeEl?.value || "").trim();
      if (!code) {
        this.statusText?.setText("請輸入驗証碼");
        return;
      }

      const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
      const token = store.accessToken ?? "";

      fetch("/api/profile/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ email, code }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            this.statusText?.setText("郵箱已更新");
            this._originalValues.email = email;
            this._verified.email = false;
            this._verifyCodeEl.style.visibility = "hidden";
            this._verifyCodeEl.value = "";
            this._currentVerifyField = null;
            this._resetEditMode("email");
          } else {
            this.statusText?.setText(data.message || "驗証失敗，請重試");
          }
        })
        .catch(err => {
          console.error("Confirm email error:", err);
          this.statusText?.setText("網絡錯誤");
        });
    } else {
      // Email not modified, just exit edit mode
      this._verified.email = false;
      this._verifyCodeEl.style.visibility = "hidden";
      this._verifyCodeEl.value = "";
      this._currentVerifyField = null;
      this._resetEditMode("email");
    }
  }

  _confirmPhone() {
    const phone = String(this._phoneEl?.value || "").trim();
    const originalPhone = String(this._originalValues.phone || "---");
    const isPhoneModified = phone !== originalPhone;

    // If phone is modified, must verify first
    if (isPhoneModified && !this._verified.phone) {
      this.statusText?.setText("請先驗証電話");
      return;
    }

    // If phone is modified, need verification code
    if (isPhoneModified) {
      const code = String(this._verifyCodeEl?.value || "").trim();
      if (!code) {
        this.statusText?.setText("請輸入驗証碼");
        return;
      }

      const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
      const token = store.accessToken ?? "";

      fetch("/api/profile/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, code }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            this.statusText?.setText("電話已更新");
            this._originalValues.phone = phone;
            this._verified.phone = false;
            this._verifyCodeEl.style.visibility = "hidden";
            this._verifyCodeEl.value = "";
            this._currentVerifyField = null;
            this._resetEditMode("phone");
          } else {
            this.statusText?.setText(data.message || "驗証失敗，請重試");
          }
        })
        .catch(err => {
          console.error("Confirm phone error:", err);
          this.statusText?.setText("網絡錯誤");
        });
    } else {
      // Phone not modified, just exit edit mode
      this._verified.phone = false;
      this._verifyCodeEl.style.visibility = "hidden";
      this._verifyCodeEl.value = "";
      this._currentVerifyField = null;
      this._resetEditMode("phone");
    }
  }

  _confirmNickname() {
    const nickname = String(this._nickEl?.value || "").trim();

    // If not in edit mode, enter edit mode
    if (!this._editMode.nickname) {
      this._enterEditMode("nickname");
      this.nicknameValueText?.setVisible(false);
      this.nicknameConfirmBtn?.setVisible(true);
      return;
    }

    // In edit mode: save nickname
    if (!nickname) {
      this.statusText?.setText("請輸入暱稱");
      return;
    }

    if (nickname.length > 16) {
      this.statusText?.setText("暱稱最多 16 個字");
      return;
    }

    // Check if nickname was actually modified
    if (nickname === this.nickname) {
      // Not modified, just exit edit mode
      this._resetEditMode("nickname");
      return;
    }

    const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
    const token = store.accessToken ?? "";

    fetch("/api/profile/nickname", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.statusText?.setText("暱稱已更新");
          this.nicknameValueText?.setText(nickname);
          this.nickname = nickname;
          this._resetEditMode("nickname");
        } else {
          this.statusText?.setText(data.message || "更新失敗");
        }
      })
      .catch(err => {
        console.error("Confirm nickname error:", err);
        this.statusText?.setText("網絡錯誤");
      });
  }

  _saveAvatar(frame) {
    const store = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
    const token = store.accessToken ?? "";

    fetch("/api/profile/avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar: toServerAvatarFrame(frame) }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          this.statusText?.setText(data.message || "頭像更新失敗");
        }
      })
      .catch(err => {
        console.error("Save avatar error:", err);
      });
  }

  destroy() {
    if (this._onWindowResize) {
      window.removeEventListener("resize", this._onWindowResize);
      window.visualViewport?.removeEventListener?.("resize", this._onWindowResize);
      this._onWindowResize = null;
    }
    if (this._avatarScrollListener) {
      this.scene.input.off("wheel", this._avatarScrollListener);
      this._avatarScrollListener = null;
    }
    this._nickEl?.remove?.();
    this._nickEl = null;
    this._emailEl?.remove?.();
    this._emailEl = null;
    this._phoneEl?.remove?.();
    this._phoneEl = null;
    this._verifyCodeEl?.remove?.();
    this._verifyCodeEl = null;
    this.confirmButton?.destroy?.();
    this.cancelButton?.destroy?.();
    this.emailEditBtn?.destroy?.();
    this.emailVerifyBtn?.destroy?.();
    this.emailConfirmBtn?.destroy?.();
    this.phoneEditBtn?.destroy?.();
    this.phoneVerifyBtn?.destroy?.();
    this.phoneConfirmBtn?.destroy?.();
    this.nicknameEditBtn?.destroy?.();
    this.nicknameConfirmBtn?.destroy?.();
    this.nodes.forEach((node) => node?.destroy?.());
    this.panelMask?.destroy?.();
    this.infoBgGfx?.destroy?.();
    this.avatarBgGfx?.destroy?.();
    this.avatarMaskGfx?.destroy?.();
    this.nodes = [];
    this.positionedNodes = [];
    this.avatarNodes = [];
  }
}
