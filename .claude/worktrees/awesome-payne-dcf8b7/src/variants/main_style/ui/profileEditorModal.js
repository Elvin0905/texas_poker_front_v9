import { createGradientButton, drawEnhancedBorder, applyGoldTitleGradient } from "./button.js";
import { layout } from "../../../shared/core/layout.js";

const INPUT_TEXT_COLOR = "#f4deba";
const INPUT_PH_COLOR = "rgba(143,123,104,0.85)";
const VALUE_TEXT_COLOR = "#f4deba";
const VALUE_EMPTY_COLOR = "#8f7b68";

const AVATAR_FRAMES = Array.from({ length: 20 }, (_, index) => `avatar_${index + 1}`);
const PANEL_X = 360;
const PANEL_Y = 720;
const PANEL_WIDTH = 650;
const PANEL_HEIGHT = 850;
const PANEL_CORNER = 18;
const PANEL_TOP = PANEL_Y - PANEL_HEIGHT / 2;

const TEXT_STYLE = {
  fontFamily: "sans-serif",
  fontStyle: "bold",
  color: "#ecd5b5",
  stroke: "#000000",
  strokeThickness: 1,
};

// Row layout
const LABEL_X = 80;
const ROW_INPUT_CENTER_X = 270;
const ROW_INPUT_WIDTH = 240;
const ROW_INPUT_HEIGHT = 56;
const ROW_VERIFY_BTN_X = 445;
const ROW_RIGHT_BTN_X = 555;
const BTN_WIDTH = 90;
const BTN_HEIGHT = 56;

const ROW_EMAIL_Y = 400;
const ROW_PHONE_Y = 470;
const ROW_NICK_Y = 540;
const ROW_GENDER_Y = 610;

// Avatar section
const AVATAR_LABEL_Y = 680;
const AVATAR_GRID_XS = [130, 235, 340, 445, 550];
const AVATAR_GRID_YS = [735, 795, 855, 915];

// Footer buttons
const FOOTER_BTN_Y = 1050;
const FOOTER_CONFIRM_X = 250;
const FOOTER_CANCEL_X = 470;

export function resolveMainAvatarFrame(scene, frameRaw) {
  const raw = String(frameRaw || "avatar_1").trim();
  const atlas = scene?.textures?.get?.("avatar_element");
  if (atlas?.has?.(raw)) return raw;
  const match = raw.match(/^avatar_(\d+)$/i);
  if (match) {
    const normalized = `avatar_${Number(match[1])}`;
    if (atlas?.has?.(normalized)) return normalized;
  }
  return "avatar_1";
}

export function toServerAvatarFrame(frameRaw) {
  const match = String(frameRaw || "").match(/^avatar_(\d+)$/i);
  if (!match) return "avatar_001";
  return `avatar_${String(Number(match[1])).padStart(3, "0")}`;
}

export class ProfileEditorModal {
  constructor(scene, { depth = 230, onSubmit } = {}) {
    this.scene = scene;
    this.depth = depth;
    this.onSubmit = onSubmit;
    this.email = "";
    this.phone = "";
    this.nickname = "";
    this.gender = "";
    this.selectedAvatar = "avatar_1";
    this.nodes = [];
    this.positionedNodes = [];
    this.avatarNodes = [];
    this.visible = false;
    this.dy = 0;
    this.centerX = 360;
    this.centerY = 720;
    this._editing = { email: false, phone: false, nickname: false };
    this.rowNodes = {};

    this._inputDefs = [
      {
        key: "email",
        elId: `${scene.scene.key}-main-profile-email`,
        type: "email",
        placeholder: "請輸入郵箱",
        autocomplete: "email",
        rowY: ROW_EMAIL_Y,
      },
      {
        key: "phone",
        elId: `${scene.scene.key}-main-profile-phone`,
        type: "tel",
        placeholder: "請輸入電話",
        autocomplete: "tel",
        rowY: ROW_PHONE_Y,
      },
      {
        key: "nickname",
        elId: `${scene.scene.key}-main-profile-nick`,
        type: "text",
        placeholder: "請輸入暱稱",
        autocomplete: "nickname",
        rowY: ROW_NICK_Y,
        maxLength: 16,
      },
    ];

    this._inputEls = {};
    this._injectPlaceholderStyle();
    this._inputDefs.forEach((def) => {
      this._inputEls[def.key] = this._createInputEl(def);
    });

    this._onWindowResize = () => this._syncInputPositions();
    window.addEventListener("resize", this._onWindowResize);
    window.visualViewport?.addEventListener?.("resize", this._onWindowResize);

    this.create();
    this.setVisible(false);
  }

  _injectPlaceholderStyle() {
    const styleId = "main-profile-input-ph-style";
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = `input[id*="-main-profile-"]::placeholder{color:${INPUT_PH_COLOR};}`;
    document.head.appendChild(styleEl);
  }

  _createInputEl(def) {
    document.getElementById(def.elId)?.remove();
    const el = document.createElement("input");
    el.id = def.elId;
    el.type = def.type;
    el.placeholder = def.placeholder;
    el.autocomplete = def.autocomplete;
    if (def.maxLength) el.maxLength = def.maxLength;
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
    el.addEventListener("input", () => {
      this[def.key] = String(el.value || "");
      this.statusText?.setText("");
    });
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

    this.statusText = scene.add.text(PANEL_X, FOOTER_BTN_Y - 50, "", {
      ...TEXT_STYLE,
      fontSize: "22px",
      color: "#ffcf7a",
      align: "center",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);

    this._buildEditableRow("email", "郵箱", ROW_EMAIL_Y, { needsVerify: true });
    this._buildEditableRow("phone", "電話", ROW_PHONE_Y, { needsVerify: true });
    this._buildEditableRow("nickname", "暱稱", ROW_NICK_Y, { needsVerify: false });
    this._buildGenderRow();

    this.avatarLabel = scene.add.text(PANEL_X, AVATAR_LABEL_Y, "選擇頭像", {
      ...TEXT_STYLE,
      fontSize: "28px",
      color: "#f0c040",
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    applyGoldTitleGradient(this.avatarLabel);
    this.nodes.push(this.avatarLabel);
    this.track(this.avatarLabel, this.avatarLabel.x, this.avatarLabel.y);

    this._buildAvatarGrid();

    this.confirmAllButton = createGradientButton(scene, {
      x: FOOTER_CONFIRM_X, y: FOOTER_BTN_Y,
      width: 190, height: 64, cornerRadius: 8,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認修改",
      labelStyle: { ...TEXT_STYLE, fontSize: "25px", color: "#ecd5b5" },
      depth: depth + 3,
      onClick: () => this._submitAll(),
      visible: false,
    });
    this.cancelButton = createGradientButton(scene, {
      x: FOOTER_CANCEL_X, y: FOOTER_BTN_Y,
      width: 170, height: 64, cornerRadius: 8,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "取消",
      labelStyle: { ...TEXT_STYLE, fontSize: "25px", color: "#ecd5b5" },
      depth: depth + 3,
      onClick: () => this.close(),
      visible: false,
    });

    this.nodes.push(this.overlay, this.panelBorder, this.panel, this.titleLabel, this.titleText, this.statusText);
    this.track(this.titleLabel, this.titleLabel.x, this.titleLabel.y);
    this.track(this.titleText, this.titleText.x, this.titleText.y);
    this.track(this.statusText, this.statusText.x, this.statusText.y);
  }

  _buildEditableRow(key, labelText, rowY, { needsVerify } = {}) {
    const { scene, depth } = this;
    const label = scene.add.text(LABEL_X, rowY, labelText, {
      ...TEXT_STYLE, fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    const inputBg = scene.add.rectangle(ROW_INPUT_CENTER_X, rowY, ROW_INPUT_WIDTH, ROW_INPUT_HEIGHT, 0x1b0508, 0.96)
      .setStrokeStyle(2, 0xd4890f, 0.95)
      .setDepth(depth + 2)
      .setVisible(false);

    const valueText = scene.add.text(ROW_INPUT_CENTER_X, rowY, "---", {
      ...TEXT_STYLE, fontSize: "24px", color: VALUE_EMPTY_COLOR,
    }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

    const editBtn = this._smallBtn("編輯", ROW_RIGHT_BTN_X, rowY, () => this._enterEdit(key), { variant: "blue" });

    const verifyBtn = needsVerify
      ? this._smallBtn("驗証", ROW_VERIFY_BTN_X, rowY, () => this._showStub(`${labelText}驗証`), { variant: "gold" })
      : null;

    const confirmBtn = this._smallBtn("確認", ROW_RIGHT_BTN_X, rowY,
      () => this._confirmRow(key, labelText, needsVerify),
      { variant: "green" });

    this.rowNodes[key] = { label, inputBg, valueText, editBtn, verifyBtn, confirmBtn, rowY };
    this.nodes.push(label, inputBg, valueText);
    this.track(label, label.x, label.y);
    this.track(inputBg, inputBg.x, inputBg.y);
    this.track(valueText, valueText.x, valueText.y);
  }

  _buildGenderRow() {
    const { scene, depth } = this;
    const label = scene.add.text(LABEL_X, ROW_GENDER_Y, "性別", {
      ...TEXT_STYLE, fontSize: "26px",
    }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

    const value = scene.add.text(PANEL_X + PANEL_WIDTH / 2 - 40, ROW_GENDER_Y, "---", {
      ...TEXT_STYLE, fontSize: "26px", color: "#d4a55a",
    }).setOrigin(1, 0.5).setDepth(depth + 2).setVisible(false);

    this.rowNodes.gender = { label, value };
    this.nodes.push(label, value);
    this.track(label, label.x, label.y);
    this.track(value, value.x, value.y);
  }

  _buildAvatarGrid() {
    AVATAR_FRAMES.forEach((frame, index) => {
      const x = AVATAR_GRID_XS[index % AVATAR_GRID_XS.length];
      const y = AVATAR_GRID_YS[Math.floor(index / AVATAR_GRID_XS.length)];
      const ring = this.scene.add.circle(x, y, 28, 0xf0c040, 0.18)
        .setStrokeStyle(3, 0xf0c040, 0.82)
        .setDepth(this.depth + 2)
        .setVisible(false);
      const image = this.scene.add.image(x, y, "avatar_element", frame)
        .setDisplaySize(48, 48)
        .setDepth(this.depth + 3)
        .setVisible(false);
      const select = () => {
        this.selectedAvatar = frame;
        this._renderAvatars();
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

  _smallBtn(text, x, y, onClick, { variant = "blue" } = {}) {
    const palettes = {
      blue:  { top: 0x264766, bottom: 0x0e1e3a, border: 0x4a8adf },
      green: { top: 0x3db428, bottom: 0x145018, border: 0x1aed30 },
      gold:  { top: 0x7a5f1e, bottom: 0x3d2f0d, border: 0xc8a040 },
    };
    const p = palettes[variant] || palettes.blue;
    return createGradientButton(this.scene, {
      x, y,
      width: BTN_WIDTH, height: BTN_HEIGHT, cornerRadius: 8,
      topColor: p.top, bottomColor: p.bottom, borderColor: p.border,
      label: text,
      labelStyle: { ...TEXT_STYLE, fontSize: "22px", color: "#ecd5b5" },
      depth: this.depth + 3,
      onClick,
      visible: false,
    });
  }

  _showStub(featureName) {
    this.statusText?.setText(`${featureName}：後端 API 尚未開放`);
  }

  _enterEdit(key) {
    this._editing[key] = true;
    this._renderRow(key);
    this._syncInputPositions();
    // Focus the input
    window.setTimeout(() => {
      const el = this._inputEls[key];
      if (!el || !this.visible) return;
      el.focus({ preventScroll: true });
      const end = el.value.length;
      try { el.setSelectionRange(end, end); } catch (_) {}
    }, 0);
  }

  _confirmRow(key, labelText, needsVerify) {
    const el = this._inputEls[key];
    const value = el ? String(el.value || "").trim() : String(this[key] || "").trim();
    this[key] = value;
    if (key === "nickname") {
      if (!value) {
        this.statusText?.setText("請輸入暱稱");
        return;
      }
      if (value.length > 16) {
        this.statusText?.setText("暱稱最多 16 個字");
        return;
      }
      this.onSubmit?.({
        nickname: value,
        avatar: this.selectedAvatar,
      });
      this.statusText?.setText("暱稱已送出更新");
      this._editing[key] = false;
      this._renderRow(key);
      this._syncInputPositions();
    } else {
      // email/phone — no backend API; stub
      this._showStub(`${labelText}更新`);
    }
  }

  _submitAll() {
    // Bottom 「確認修改」: send current nickname (from input if editing, else state) + avatar
    const nickEl = this._inputEls.nickname;
    const nickValue = (this._editing.nickname && nickEl
      ? String(nickEl.value || "")
      : String(this.nickname || "")).trim();
    if (!nickValue) {
      this.statusText?.setText("請輸入暱稱");
      return;
    }
    if (nickValue.length > 16) {
      this.statusText?.setText("暱稱最多 16 個字");
      return;
    }
    this.nickname = nickValue;
    this.onSubmit?.({
      nickname: nickValue,
      avatar: this.selectedAvatar,
    });
    this.close();
  }

  track(node, x, y) {
    if (!node) return;
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
    // Reposition row buttons
    ["email", "phone", "nickname"].forEach((key) => {
      const row = this.rowNodes[key];
      if (!row) return;
      row.editBtn?.setPosition?.(ROW_RIGHT_BTN_X, row.rowY + this.dy);
      row.verifyBtn?.setPosition?.(ROW_VERIFY_BTN_X, row.rowY + this.dy);
      row.confirmBtn?.setPosition?.(ROW_RIGHT_BTN_X, row.rowY + this.dy);
    });
    this.confirmAllButton?.setPosition?.(FOOTER_CONFIRM_X, FOOTER_BTN_Y + this.dy);
    this.cancelButton?.setPosition?.(FOOTER_CANCEL_X, FOOTER_BTN_Y + this.dy);
    this._syncInputPositions();
  }

  open(user = {}) {
    const rawName = String(user?.nickname || user?.display_name || user?.username || "").trim();
    this.nickname = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    this.email = String(user?.email || "").trim();
    this.phone = String(user?.phone || "").trim();
    this.gender = String(user?.gender || "").trim();
    this.selectedAvatar = resolveMainAvatarFrame(this.scene, user?.avatar);
    this.statusText?.setText("");
    this._editing = { email: false, phone: false, nickname: false };
    this.setVisible(true);
    if (this._inputEls.email) this._inputEls.email.value = this.email;
    if (this._inputEls.phone) this._inputEls.phone.value = this.phone;
    if (this._inputEls.nickname) this._inputEls.nickname.value = this.nickname;
    this._renderAll();
  }

  close() {
    Object.values(this._inputEls).forEach((el) => el?.blur?.());
    this.setVisible(false);
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    this.nodes.forEach((node) => {
      node?.setVisible?.(visible);
      if (node?.input) node.input.enabled = Boolean(visible);
    });
    this.confirmAllButton?.setVisible?.(visible);
    this.cancelButton?.setVisible?.(visible);
    if (visible) {
      this._renderAll();
      this._syncInputPositions();
    } else {
      // Hide all row buttons + html inputs when closing
      ["email", "phone", "nickname"].forEach((key) => {
        const row = this.rowNodes[key];
        if (!row) return;
        row.editBtn?.setVisible?.(false);
        row.verifyBtn?.setVisible?.(false);
        row.confirmBtn?.setVisible?.(false);
      });
      Object.values(this._inputEls).forEach((el) => {
        if (!el) return;
        el.style.visibility = "hidden";
      });
    }
    return this;
  }

  _renderAll() {
    this._renderRow("email");
    this._renderRow("phone");
    this._renderRow("nickname");
    this._renderGender();
    this._renderAvatars();
  }

  _renderRow(key) {
    const row = this.rowNodes[key];
    if (!row || !this.visible) return;
    const editing = !!this._editing[key];
    const value = String(this[key] || "");
    // Value text shows when NOT editing
    if (row.valueText) {
      const display = value || "---";
      row.valueText.setText(display);
      row.valueText.setColor(value ? VALUE_TEXT_COLOR : VALUE_EMPTY_COLOR);
      row.valueText.setVisible(!editing);
    }
    // HTML input shows when editing
    const el = this._inputEls[key];
    if (el) el.style.visibility = editing ? "visible" : "hidden";
    // Right-side button: 編輯 (display) or 確認 (editing)
    row.editBtn?.setVisible?.(!editing);
    row.confirmBtn?.setVisible?.(editing);
    // 驗証 only when editing (for email/phone)
    row.verifyBtn?.setVisible?.(editing);
  }

  _renderGender() {
    const g = this.rowNodes.gender;
    if (!g) return;
    const label = this.gender === "male" ? "男"
      : this.gender === "female" ? "女"
      : (this.gender || "---");
    g.value?.setText(label);
  }

  _renderAvatars() {
    this.avatarNodes.forEach((node) => {
      const selected = node.frame === this.selectedAvatar;
      node.ring.setAlpha(selected ? 0.95 : 0.2);
      node.ring.setScale(selected ? 1.18 : 1);
      node.image.setDisplaySize(selected ? 54 : 48, selected ? 54 : 48);
    });
  }

  _syncInputPositions() {
    if (!this.visible) return;
    const canvas = this.scene?.sys?.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top + (rect.height - layout.height * scale) / 2;
    this._inputDefs.forEach((def) => {
      const el = this._inputEls[def.key];
      if (!el) return;
      const designX = ROW_INPUT_CENTER_X - ROW_INPUT_WIDTH / 2;
      const designY = def.rowY - ROW_INPUT_HEIGHT / 2 + this.dy;
      Object.assign(el.style, {
        left:       Math.round(ox + designX * scale) + "px",
        top:        Math.round(oy + designY * scale) + "px",
        width:      Math.round(ROW_INPUT_WIDTH * scale) + "px",
        height:     Math.round(ROW_INPUT_HEIGHT * scale) + "px",
        fontSize:   Math.round(24 * scale) + "px",
        lineHeight: Math.round(ROW_INPUT_HEIGHT * scale) + "px",
      });
    });
  }

  destroy() {
    if (this._onWindowResize) {
      window.removeEventListener("resize", this._onWindowResize);
      window.visualViewport?.removeEventListener?.("resize", this._onWindowResize);
      this._onWindowResize = null;
    }
    Object.values(this._inputEls).forEach((el) => el?.remove?.());
    this._inputEls = {};
    ["email", "phone", "nickname"].forEach((key) => {
      const row = this.rowNodes[key];
      if (!row) return;
      row.editBtn?.destroy?.();
      row.verifyBtn?.destroy?.();
      row.confirmBtn?.destroy?.();
    });
    this.confirmAllButton?.destroy?.();
    this.cancelButton?.destroy?.();
    this.nodes.forEach((node) => node?.destroy?.());
    this.panelMask?.destroy?.();
    this.nodes = [];
    this.positionedNodes = [];
    this.avatarNodes = [];
    this.rowNodes = {};
  }
}
