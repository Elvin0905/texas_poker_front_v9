import { bindImageButton, applyGoldTitleGradient, createGradientButton, drawEnhancedBorder } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

const BOX_W = 565;
const BOX_H = 80;
const BOX_CR = 14;
const BOX_BG = 0x3a1800;
const BOX_BG_ALPHA = 0.88;
const INPUT_TEXT_COLOR = "#e8d5b0";
const INPUT_PH_COLOR = "rgba(200,170,110,0.55)";
const ICON_X = -228;
const EYE_X = 238;
const PHONE_CODES = [
  { value: "+886", label: "+886 台灣" },
  { value: "+86",  label: "+86 中国" },
  { value: "+852", label: "+852 香港" },
  { value: "+853", label: "+853 澳門" },
  { value: "+60",  label: "+60 馬來西亞" },
  { value: "+65",  label: "+65 新加坡" },
  { value: "+81",  label: "+81 日本" },
  { value: "+1",   label: "+1 美國" },
];

export class RegisterScene extends Phaser.Scene {
  constructor() {
    super("register");
    this.usernameValue = "";
    this.passwordValue = "";
    this.confirmPasswordValue = "";
    this.displayNameValue = "";
    this.passwordVisible = false;
    this.genderValue = "";
    this._emailEl = null;
    this._nickEl = null;
    this._pwEl = null;
    this._confirmPwEl = null;
    this._eyeHitEl = null;
    this._confirmEyeHitEl = null;
    this._phoneMode = false;
    this._phoneCode = "+886";
    this._phoneCodeEl = null;
    this._styleEl = null;
    this._syncBound = null;
    this._emailBoxY = 0;
    this._nickBoxY = 0;
    this._pwBoxY = 0;
    this._confirmPwBoxY = 0;
    this.soundSettingsPanel = null;
    this.verifyEmailBtn = null;
    this._emailVerified = false;
    this._verifyCodeEl = null;
    this.emailFormatText = null;
    this.confirmPasswordVisible = false;
    this.pwMatchText = null;
    this.confirmPwMatchText = null;
    this.emailHintText = null;
    this.nickHintText = null;
    this.genderHintText = null;
    this.pwHintText = null;
    this.confirmPwHintText = null;
    this.emailAst = null;
    this.nickAst = null;
    this.genderAst = null;
    this.pwAst = null;
    this.confirmPwAst = null;
    this._storeUnsub = null;
    this._waitingVerify = false;
    this._waitingRegister = false;
    this._lastSeenVerifyVersion = 0;
    this._lastSeenErrVersionForVerify = 0;
    this._lastSeenErrVersionForRegister = 0;
    this._verifyCode = "";
  }

  create() {
    document.body.dataset.modalDepth = "0";
    document.body.classList.remove("modal-open");
    this.useResponsiveLayout = true;
    this.app = window.__APP__;
    this.store = this.app.store;
    this.cameras.main.setRoundPixels(true);

    this._injectCss();
    this._buildScene();
    this._buildHtmlHitAreas();
    this._buildHtmlInputs();

    this._initWindowH = window.innerHeight;
    this._kbTimer = null;
    this._kbOffset = 0;
    this._kbMaxOffset = 0;
    this._kbDragY = 0;
    this._kbDragOffset = 0;
    this._kbDragging = false;

    this._syncBound = () => {
      this._syncInputPositions();
      const a = document.activeElement;
      if (a === this._emailEl || a === this._nickEl || a === this._pwEl || a === this._confirmPwEl || a === this._verifyCodeEl) {
        clearTimeout(this._kbTimer);
        this._kbTimer = setTimeout(() => this._adjustForKeyboard(true), 120);
      } else if (this._kbMaxOffset > 0) {
        clearTimeout(this._kbTimer);
        this._adjustForKeyboard(false);
      }
    };
    window.addEventListener("resize", this._syncBound);
    window.visualViewport?.addEventListener("resize", this._syncBound);

    this._onInputFocus = () => {
      clearTimeout(this._kbTimer);
      this._kbTimer = setTimeout(() => this._adjustForKeyboard(true), 400);
    };
    this._onInputBlur = () => {
      clearTimeout(this._kbTimer);
      this._kbTimer = setTimeout(() => {
        const a = document.activeElement;
        const inputs = [this._emailEl, this._nickEl, this._pwEl, this._confirmPwEl, this._verifyCodeEl];
        if (!inputs.includes(a)) this._adjustForKeyboard(false);
      }, 200);
    };

    this._kbOverlay = document.createElement('div');
    Object.assign(this._kbOverlay.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      zIndex: '160', display: 'none', touchAction: 'none',
    });
    document.body.appendChild(this._kbOverlay);

    this._kbTouchStart = (e) => {
      if (!e.touches.length) return;
      e.preventDefault(); // blocks simulated mousedown → focus stays on input → keyboard stays open
      const root = document.getElementById('phaser-root');
      if (root) root.style.transition = 'none';
      this._kbDragY = e.touches[0].clientY;
      this._kbDragOffset = this._kbOffset;
      this._kbDragging = false;
    };
    this._kbTouchMove = (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      const dy = this._kbDragY - e.touches[0].clientY;
      if (!this._kbDragging && Math.abs(dy) > 10) this._kbDragging = true;
      if (!this._kbDragging) return;
      this._kbOffset = Math.max(0, Math.min(this._kbMaxOffset, this._kbDragOffset + dy));
      const root = document.getElementById('phaser-root');
      if (root) root.style.transform = this._kbOffset > 0 ? `translateY(-${Math.round(this._kbOffset)}px)` : '';
      this._syncInputPositions();
    };
    this._kbTouchEnd = (e) => {
      if (!this._kbOverlay) return;
      const wasTap = !this._kbDragging;
      this._kbDragging = false;
      this._syncInputPositions();
      if (wasTap && e.changedTouches?.length) {
        const touch = e.changedTouches[0];
        const x = touch.clientX, y = touch.clientY;
        this._kbOverlay.style.pointerEvents = 'none';
        const target = document.elementFromPoint(x, y);
        this._kbOverlay.style.pointerEvents = '';
        if (target) {
          if (target.tagName === 'CANVAS') {
            try {
              const t = new Touch({ identifier: Date.now(), target, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y, radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1 });
              target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
              target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t] }));
            } catch {}
            // Always dispatch pointer events — Phaser listens to these, not just touch events
            const pointerOpts = { bubbles: true, cancelable: true, clientX: x, clientY: y, screenX: x, screenY: y, pointerId: 1, isPrimary: true, pointerType: 'touch', button: 0, buttons: 1 };
            target.dispatchEvent(new PointerEvent('pointerdown', pointerOpts));
            target.dispatchEvent(new PointerEvent('pointerup', { ...pointerOpts, buttons: 0 }));
          } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            target.focus({ preventScroll: true });
          } else {
            target.click();
          }
        }
      }
    };
    this._kbOverlay.addEventListener('touchstart', this._kbTouchStart, { passive: false });
    this._kbOverlay.addEventListener('touchmove', this._kbTouchMove, { passive: false });
    this._kbOverlay.addEventListener('touchend', this._kbTouchEnd, { passive: true });

    onLayoutResize(this, () => this.applyLayout());
    this.time.delayedCall(0, () => this.applyLayout());

    this._setupBgm();

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: layout.right - 60,
      buttonY: 60,
      onSettingsChanged: () => this._syncBgm(),
    });

    const _s = this.store?.getState?.() ?? {};
    this._lastSeenVerifyVersion = Number(_s.verifyCodeVersion ?? 0);
    this._lastSeenErrVersionForVerify = Number(_s.errorVersion ?? 0);
    this._lastSeenErrVersionForRegister = Number(_s.errorVersion ?? 0);
    this._storeUnsub = this.store?.subscribe((state) => this._handleStoreState(state));

    this.events.once("shutdown", () => this._destroyScene());
  }

  _handleStoreState(state) {
    if (this._waitingRegister) {
      const errVer = Number(state?.errorVersion ?? 0);
      if (errVer > this._lastSeenErrVersionForRegister) {
        this._lastSeenErrVersionForRegister = errVer;
        this._waitingRegister = false;
        const msg = String(state?.lastError?.message ?? "註冊失敗，請重試");
        this._showResultModal(false, msg, "註冊失敗");
      }
      return;
    }
    if (!this._waitingVerify) return;
    const verifyVer = Number(state?.verifyCodeVersion ?? 0);
    if (verifyVer > this._lastSeenVerifyVersion) {
      this._lastSeenVerifyVersion = verifyVer;
      this._waitingVerify = false;
      this._showResultModal(true);
      return;
    }
    const errVer = Number(state?.errorVersion ?? 0);
    if (errVer > this._lastSeenErrVersionForVerify) {
      this._lastSeenErrVersionForVerify = errVer;
      this._waitingVerify = false;
      this._showResultModal(false);
    }
  }

  _injectCss() {
    this._styleEl = document.createElement("style");
    this._styleEl.textContent = [
      `.lrn-input { appearance: none; -webkit-appearance: none; background: transparent !important; box-shadow: none !important; -webkit-box-shadow: none !important; color-scheme: dark; }`,
      `.lrn-input::placeholder { color: ${INPUT_PH_COLOR}; }`,
      `.lrn-input:-webkit-autofill,.lrn-input:-webkit-autofill:hover,.lrn-input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 200px #3a1800 inset !important; -webkit-text-fill-color: ${INPUT_TEXT_COLOR} !important; }`,
      `.fp-input { appearance: none; -webkit-appearance: none; background: transparent !important; box-shadow: none !important; -webkit-box-shadow: none !important; color-scheme: dark; }`,
      `.fp-input::placeholder { color: ${INPUT_PH_COLOR}; }`,
      `.fp-input:-webkit-autofill,.fp-input:-webkit-autofill:hover,.fp-input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 200px #3a1800 inset !important; -webkit-text-fill-color: ${INPUT_TEXT_COLOR} !important; }`,
      `.phone-code-sel { background: #3a1800; color: ${INPUT_TEXT_COLOR}; border: none; border-right: 1px solid #d4a520; outline: none; cursor: pointer; font-weight: bold; }`,
      `.phone-code-sel option { background: #2a1000; color: ${INPUT_TEXT_COLOR}; }`,
    ].join("\n");
    document.head.appendChild(this._styleEl);
  }

  _buildScene() {
    const cx = layout.centerX;
    const cy = layout.centerY;

    this.bgImage = this.add
      .image(cx, cy, "login", "bg_login")
      .setDisplaySize(layout.width, layout.height);

    if (this.textures.exists("logo") && this.textures.get("logo").has("logo0.png")) {
      this.textures.get("logo").setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.logoSprite = this.add.sprite(cx, 0, "logo", "logo0.png").setDisplaySize(568, 264);
      this._logoFrame = 0;
      this._logoElapsed = 0;
    } else {
      this.logoSprite = null;
    }

    this.titleText = this.add
      .text(cx, 0, "註冊帳號", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "40px", fontStyle: "bold", color: "#f0c040",
        stroke: "#3a1a00", strokeThickness: 3,
      })
      .setOrigin(0.5);
    applyGoldTitleGradient(this.titleText);
    this.titleBorderLeft  = this.add.image(0, 0, "Lobby", "title_border_left").setDisplaySize(140, 20);
    this.titleBorderRight = this.add.image(0, 0, "Lobby", "title_border_right").setDisplaySize(140, 20);

    const labelStyle = {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "28px", fontStyle: "bold", color: "#f5e6c0",
      stroke: "#000", strokeThickness: 1,
    };

    // Email / Phone row
    this.emailLabel = this.add.text(0, 0, "信箱/電話號碼", labelStyle).setOrigin(0, 0.5);
    this.emailBoxGfx = this.add.graphics();
    this.mailIcon = this.add.image(0, 0, "login", "user").setDisplaySize(50, 55);
    this.verifyEmailBtn = createGradientButton(this, {
      x: 0, y: 0, width: 104, height: 56, cornerRadius: 10,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "驗證",
      labelStyle: { fontSize: "26px", color: "#ffffff", shadow: { offsetX: 0, offsetY: 2, color: "#0a2a08", blur: 4, fill: true } },
      depth: 1, onClick: () => this._sendEmailVerification(), visible: false,
    });
    this.emailVerifiedCheck = this.add
      .text(0, 0, "✓", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "52px", fontStyle: "bold", color: "#3db428",
        shadow: { offsetX: 1, offsetY: 2, color: "rgba(0,40,0,0.35)", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.emailFormatText = this.add
      .text(0, 0, "", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "48px", fontStyle: "bold", color: "#3db428",
        shadow: { offsetX: 1, offsetY: 2, color: "rgba(0,40,0,0.35)", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Nickname row (shorter box) + Gender buttons
    this.nickLabel = this.add.text(0, 0, "Nickname | 暱稱", labelStyle).setOrigin(0, 0.5);
    this.genderLabel = this.add.text(0, 0, "Gender | 性別", labelStyle).setOrigin(0, 0.5);
    this.nickBoxGfx = this.add.graphics();
    this.userIcon = this.add.image(0, 0, "login", "user").setDisplaySize(50, 55);

    const genderBtnLabelStyle = { fontSize: "30px", fontStyle: "bold", color: "#fff8e0" };
    this.genderMaleBtn = createGradientButton(this, {
      x: 0, y: 0, width: 76, height: 56, cornerRadius: 10,
      topColor: 0x3a2010, bottomColor: 0x1a0800, borderColor: 0x6a4020,
      label: "男", labelStyle: genderBtnLabelStyle,
      depth: 1, onClick: () => this._selectGender("male"), visible: false,
    });
    this.genderFemaleBtn = createGradientButton(this, {
      x: 0, y: 0, width: 76, height: 56, cornerRadius: 10,
      topColor: 0x3a2010, bottomColor: 0x1a0800, borderColor: 0x6a4020,
      label: "女", labelStyle: genderBtnLabelStyle,
      depth: 1, onClick: () => this._selectGender("female"), visible: false,
    });

    // Password row
    this.passwordLabel = this.add.text(0, 0, "Password | 密碼", labelStyle).setOrigin(0, 0.5);
    this.passwordBoxGfx = this.add.graphics();
    this.lockIcon = this.add.image(0, 0, "login", "lock").setDisplaySize(44, 56);
    this.eyeIcon = this.add
      .image(0, 0, "login", "closed_eye")
      .setDisplaySize(46, 23);

    // Confirm Password row
    this.confirmPwLabel = this.add.text(0, 0, "Confirm Password | 確認密碼", labelStyle).setOrigin(0, 0.5);
    this.confirmPwBoxGfx = this.add.graphics();
    this.confirmLockIcon = this.add.image(0, 0, "login", "lock").setDisplaySize(44, 56);
    this.confirmEyeIcon = this.add
      .image(0, 0, "login", "closed_eye")
      .setDisplaySize(46, 23);
    this.pwMatchText = this.add
      .text(0, 0, "", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "48px", fontStyle: "bold", color: "#3db428",
        shadow: { offsetX: 1, offsetY: 2, color: "rgba(0,40,0,0.35)", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.confirmPwMatchText = this.add
      .text(0, 0, "", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "48px", fontStyle: "bold", color: "#3db428",
        shadow: { offsetX: 1, offsetY: 2, color: "rgba(0,40,0,0.35)", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setVisible(false);

    const astStyle = {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "26px", fontStyle: "bold", color: "#e84040",
    };
    this.emailAst     = this.add.text(0, 0, "*", astStyle).setOrigin(0, 0.5).setVisible(false);
    this.nickAst      = this.add.text(0, 0, "*", astStyle).setOrigin(0, 0.5).setVisible(false);
    this.genderAst    = this.add.text(0, 0, "*", astStyle).setOrigin(0, 0.5).setVisible(false);
    this.pwAst        = this.add.text(0, 0, "*", astStyle).setOrigin(0, 0.5).setVisible(false);
    this.confirmPwAst = this.add.text(0, 0, "*", astStyle).setOrigin(0, 0.5).setVisible(false);

    const hintStyle = {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "20px", color: "#e85555", fontStyle: "bold",
    };
    this.emailHintText    = this.add.text(0, 0, "* 需要先驗證郵箱！", hintStyle).setOrigin(0, 0.5).setVisible(false);
    this.nickHintText     = this.add.text(0, 0, "* 請填寫暱稱", hintStyle).setOrigin(0, 0.5).setVisible(false);
    this.genderHintText   = this.add.text(0, 0, "* 請選擇性別", hintStyle).setOrigin(0, 0.5).setVisible(false);
    this.pwHintText       = this.add.text(0, 0, "* 需要8個字符或以上", hintStyle).setOrigin(0, 0.5).setVisible(false);
    this.confirmPwHintText = this.add.text(0, 0, "* 密碼不一致，請重新輸入", hintStyle).setOrigin(0, 0.5).setVisible(false);

    this.submitBtn = this.add.image(0, 0, "login", "click_register_btn").setDisplaySize(290, 89);
    bindImageButton(this, this.submitBtn, { onClick: () => this.submitRegister() });

    this._buildVerifyModal();

    this.hasAccountText = this.add
      .text(0, 0, "已有帳號?", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "28px", color: "#d4b88a",
      })
      .setOrigin(0, 0.5);
    this.loginBtn = this.add.image(0, 0, "login", "login_btn").setDisplaySize(220, 72);
    bindImageButton(this, this.loginBtn, { onClick: () => this.store.setPage("auth") });

    this.applyLayout();
  }

  _applyCamera() {
    const cam = this.cameras?.main;
    const canvas = this.sys?.game?.canvas;
    if (!cam || !canvas?.width || !canvas?.height) return;
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const designZoom = window.innerHeight / layout.height;
    if (!Number.isFinite(designZoom) || designZoom <= 0) return;
    const zoom = designZoom * dpr;
    if (!Number.isFinite(zoom) || zoom <= 0) return;
    const stripW = Math.round(layout.width * zoom);
    const stripX = Math.max(0, Math.round(canvas.width / 2 - stripW / 2));
    if (stripX > 0) {
      cam.setViewport(stripX, 0, Math.min(stripW, canvas.width - stripX), canvas.height);
    } else {
      cam.setViewport(0, 0, canvas.width, canvas.height);
    }
    cam.setZoom(zoom);
    cam.centerOn(layout.centerX, layout.centerY);
  }

  applyLayout() {
    this._applyCamera();

    const cx = layout.centerX;
    const cy = layout.centerY;

    this.bgImage?.setPosition(cx, cy).setDisplaySize(layout.width, layout.height);

    const usableH = layout.height - layout.safeAreaTop - layout.safeAreaBottom;
    const ss = Math.min(1, usableH / 1380);

    const s = (v) => Math.round(v * ss);

    // Scale font sizes proportionally so text doesn't overflow on short viewports
    this.titleText?.setFontSize(Math.round(40 * ss) + 'px');
    this.emailLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.nickLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.genderLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.passwordLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.confirmPwLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.hasAccountText?.setFontSize(Math.round(28 * ss) + 'px');

    const titleY = cy - s(338);
    const logoY = Math.max(layout.safeAreaTop + 20, titleY - s(176));
    const logoSize = Math.round(Math.max(100, 568 * ss));
    this.logoSprite?.setDisplaySize(logoSize, Math.round(logoSize * 264 / 568));
    this.logoSprite?.setPosition(Math.round(cx / 2) * 2, logoY);

    this.titleText?.setPosition(cx, titleY);
    this.titleBorderLeft?.setPosition(cx - 200, titleY);
    this.titleBorderRight?.setPosition(cx + 200, titleY);

    // Email row
    const emailLabelY = cy - s(271);
    this.emailLabel?.setPosition(cx - 268, emailLabelY);
    this.emailAst?.setPosition(cx - 268 + (this.emailLabel?.width ?? 0) + 4, emailLabelY).setVisible(true);
    const emailBoxY = cy - s(202);
    this._emailBoxY = emailBoxY;
    this._drawBox(this.emailBoxGfx, cx, emailBoxY);
    this.mailIcon?.setPosition(cx + ICON_X, emailBoxY);
    this.emailHintText?.setPosition(cx - 268, emailBoxY + 56);
    this.emailFormatText?.setPosition(cx + 255, emailBoxY);
    if (!this._emailVerified) {
      this.verifyEmailBtn?.setPosition?.(cx + 213, emailBoxY);
      this.verifyEmailBtn?.setVisible(true);
      this.emailVerifiedCheck?.setVisible(false);
      this._updateEmailFormatIndicator();
    } else {
      this.verifyEmailBtn?.setVisible(false);
      this.emailFormatText?.setVisible(false);
      this.emailVerifiedCheck?.setPosition(cx + 255, emailBoxY).setVisible(true);
    }

    // Nickname + Gender row
    const nickLabelY = cy - s(105);
    this.nickLabel?.setPosition(cx - 268, nickLabelY);
    this.nickAst?.setPosition(cx - 268 + (this.nickLabel?.width ?? 0) + 4, nickLabelY).setVisible(true);
    this.genderLabel?.setPosition(cx + 100, nickLabelY);
    this.genderAst?.setPosition(cx + 100 + (this.genderLabel?.width ?? 0) + 4, nickLabelY).setVisible(true);
    const nickBoxY = cy - s(38);
    this._nickBoxY = nickBoxY;
    this._drawBox(this.nickBoxGfx, cx - 97, nickBoxY, 370);
    this.userIcon?.setPosition(cx + ICON_X, nickBoxY);
    this.genderMaleBtn?.setPosition?.(cx + 147, nickBoxY);
    this.genderMaleBtn?.setVisible(true);
    this.genderFemaleBtn?.setPosition?.(cx + 233, nickBoxY);
    this.genderFemaleBtn?.setVisible(true);
    this._updateGenderBtns();
    this.nickHintText?.setPosition(cx - 268, nickBoxY + 56);
    this.genderHintText?.setPosition(cx + 88, nickBoxY + 56);

    // Password row
    const pwLabelY = cy + s(61);
    this.passwordLabel?.setPosition(cx - 268, pwLabelY);
    this.pwAst?.setPosition(cx - 268 + (this.passwordLabel?.width ?? 0) + 4, pwLabelY).setVisible(true);
    const pwBoxY = cy + s(130);
    this._pwBoxY = pwBoxY;
    this._drawBox(this.passwordBoxGfx, cx, pwBoxY);
    this.lockIcon?.setPosition(cx + ICON_X, pwBoxY);
    this.eyeIcon?.setPosition(cx + EYE_X, pwBoxY);
    this.pwMatchText?.setPosition(cx + 168, pwBoxY);
    this.pwHintText?.setPosition(cx - 268, pwBoxY + 56);

    // Confirm Password row
    const confirmPwLabelY = cy + s(225);
    this.confirmPwLabel?.setPosition(cx - 268, confirmPwLabelY);
    this.confirmPwAst?.setPosition(cx - 268 + (this.confirmPwLabel?.width ?? 0) + 4, confirmPwLabelY).setVisible(true);
    const confirmPwBoxY = cy + s(293);
    this._confirmPwBoxY = confirmPwBoxY;
    this._drawBox(this.confirmPwBoxGfx, cx, confirmPwBoxY);
    this.confirmLockIcon?.setPosition(cx + ICON_X, confirmPwBoxY);
    this.confirmEyeIcon?.setPosition(cx + EYE_X, confirmPwBoxY);
    this.confirmPwMatchText?.setPosition(cx + 168, confirmPwBoxY);
    this.confirmPwHintText?.setPosition(cx - 268, confirmPwBoxY + 56);

    this.submitBtn?.setPosition(cx, cy + s(425));

    const botY = layout.bottom - Math.max(80, layout.safeAreaBottom + 50);
    this.hasAccountText?.setPosition(cx - 175, botY);
    this.loginBtn?.setPosition(cx + 80, botY);

    this.soundSettingsPanel?.triggerButton?.setPosition?.(layout.right - 60, 60);

    this._syncInputPositions();
  }

  _drawBox(gfx, cx, cy, w = BOX_W) {
    if (!gfx) return;
    const l = cx - w / 2, t = cy - BOX_H / 2;
    gfx.clear();
    gfx.lineStyle(14, 0xb87010, 0.14);
    gfx.strokeRoundedRect(l, t, w, BOX_H, BOX_CR);
    gfx.lineStyle(7, 0xd4890f, 0.18);
    gfx.strokeRoundedRect(l, t, w, BOX_H, BOX_CR);
    gfx.fillStyle(BOX_BG, BOX_BG_ALPHA);
    gfx.fillRoundedRect(l, t, w, BOX_H, BOX_CR);
    gfx.lineStyle(2.5, 0xd4a520, 1);
    gfx.strokeRoundedRect(l, t, w, BOX_H, BOX_CR);
    gfx.lineStyle(1, 0xffe878, 0.55);
    gfx.strokeRoundedRect(l, t, w, BOX_H, BOX_CR);
  }

  _buildHtmlInputs() {
    this._phoneCodeEl = this._makePhoneCodeEl();

    this._emailEl = this._makeEl("reg-email", "text", "請輸入信箱或電話號碼", "username");
    this._emailEl.addEventListener("input", () => {
      this.usernameValue = this._emailEl.value;
      if (this._emailVerified) {
        this._emailVerified = false;
        this._verifyCode = "";
        this.emailVerifiedCheck?.setVisible(false);
        this.verifyEmailBtn?.setPosition?.(layout.centerX + 213, this._emailBoxY);
        this.verifyEmailBtn?.setVisible(true);
      }
      this._updatePhoneMode();
      this._updateHints();
      this._updateEmailFormatIndicator();
    });
    this._emailEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._nickEl?.focus(); }
    });

    this._nickEl = this._makeEl("reg-nick", "text", "點擊輸入暱稱", "nickname");
    this._nickEl.addEventListener("input", () => { this.displayNameValue = this._nickEl.value; this._updateHints(); });
    this._nickEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._pwEl?.focus(); }
    });

    this._pwEl = this._makeEl("reg-pw", "password", "點擊輸入密碼", "new-password");
    this._pwEl.addEventListener("input", () => { this.passwordValue = this._pwEl.value; this._updateConfirmMatch(); this._updateHints(); });
    this._pwEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._confirmPwEl?.focus(); }
    });

    this._confirmPwEl = this._makeEl("reg-confirmpw", "password", "再次輸入密碼", "new-password");
    this._confirmPwEl.addEventListener("input", () => { this.confirmPasswordValue = this._confirmPwEl.value; this._updateConfirmMatch(); this._updateHints(); });
    this._confirmPwEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._confirmPwEl.blur(); this.submitRegister(); }
    });

    // Attach keyboard detection via focus events (most reliable trigger on mobile)
    [this._emailEl, this._nickEl, this._pwEl, this._confirmPwEl].forEach(el => {
      el.addEventListener("focus", this._onInputFocus);
      el.addEventListener("blur",  this._onInputBlur);
    });

    this._syncInputPositions();
    this.time.delayedCall(80, () => this._syncInputPositions());

    this.time.delayedCall(120, () => {
      [this._emailEl, this._nickEl, this._pwEl, this._confirmPwEl,
       this._eyeHitEl, this._confirmEyeHitEl].forEach(el => {
        if (el) el.style.visibility = '';
      });
    });
  }

  _makeEl(id, type, placeholder, autocomplete) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id;
    el.type = type;
    el.placeholder = placeholder;
    el.autocomplete = autocomplete;
    el.className = "lrn-input";
    Object.assign(el.style, {
      position: "fixed",
      background: "transparent",
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      WebkitBoxShadow: "none",
      colorScheme: "dark",
      color: INPUT_TEXT_COLOR,
      WebkitTextFillColor: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR,
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "26px",
      fontWeight: "bold",
      zIndex: "100",
      padding: "0 8px",
      boxSizing: "border-box",
      visibility: "hidden",
    });
    document.body.appendChild(el);
    return el;
  }

  _makePhoneCodeEl() {
    document.getElementById("reg-phone-code")?.remove();
    const sel = document.createElement("select");
    sel.id = "reg-phone-code";
    sel.className = "phone-code-sel";
    PHONE_CODES.forEach(({ value }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      sel.appendChild(opt);
    });
    sel.value = this._phoneCode;
    const showLabels = () => PHONE_CODES.forEach(({ value, label }, i) => { sel.options[i].textContent = label; });
    const showCodes  = () => PHONE_CODES.forEach(({ value }, i)        => { sel.options[i].textContent = value; });
    sel.addEventListener("mousedown", showLabels);
    sel.addEventListener("focus",     showLabels);
    sel.addEventListener("blur",      showCodes);
    sel.addEventListener("change", () => { this._phoneCode = sel.value; showCodes(); });
    Object.assign(sel.style, {
      position: "fixed", display: "none", zIndex: "100",
      boxSizing: "border-box", padding: "0 6px",
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif', colorScheme: "dark",
    });
    document.body.appendChild(sel);
    return sel;
  }

  _detectInputMode(value) {
    const v = String(value || "").trim();
    if (!v) return "empty";
    if (v.includes("@")) return "email";
    if (/^\d/.test(v)) return "phone";
    return "text";
  }

  _updatePhoneMode() {
    const mode = this._detectInputMode(this.usernameValue);
    const wasPhone = this._phoneMode;
    this._phoneMode = mode === "phone";
    if (wasPhone !== this._phoneMode) {
      this.mailIcon?.setVisible(!this._phoneMode);
      this._syncInputPositions();
    }
  }

  _buildHtmlHitAreas() {
    const makeHit = () => {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "fixed", background: "transparent",
        zIndex: "80", cursor: "pointer", touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent", visibility: "hidden",
      });
      document.body.appendChild(el);
      return el;
    };
    this._eyeHitEl = makeHit();
    this._eyeHitEl.addEventListener("click", () => this._togglePasswordVisible());
    this._confirmEyeHitEl = makeHit();
    this._confirmEyeHitEl.addEventListener("click", () => this._toggleConfirmPasswordVisible());
  }

  _syncInputPositions() {
    if (!this._emailEl || !this._nickEl || !this._pwEl || !this._confirmPwEl) return;
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top;

    if (this._phoneMode && this._phoneCodeEl) {
      const selLeft = layout.centerX - 268;
      const selW = 128;
      const inputLeft = selLeft + selW + 10;
      const inputW = layout.centerX + 105 - inputLeft;
      this._posEl(this._phoneCodeEl, selLeft, this._emailBoxY - 29, selW, 58, scale, ox, oy);
      this._phoneCodeEl.style.removeProperty("display");
      this._posEl(this._emailEl, inputLeft, this._emailBoxY - 29, inputW, 58, scale, ox, oy);
    } else {
      this._phoneCodeEl?.style.setProperty("display", "none", "important");
      const textStartX = layout.centerX - 162;
      this._posEl(this._emailEl, textStartX, this._emailBoxY - 29, 298, 58, scale, ox, oy);
    }
    const nickStartX = layout.centerX - 162;
    this._posEl(this._nickEl,      nickStartX, this._nickBoxY      - 29, 236, 58, scale, ox, oy);
    this._posEl(this._pwEl,        nickStartX, this._pwBoxY        - 29, 310, 58, scale, ox, oy);
    this._posEl(this._confirmPwEl, nickStartX, this._confirmPwBoxY - 29, 310, 58, scale, ox, oy);
    if (this._eyeHitEl)        this._posEl(this._eyeHitEl,        layout.centerX + 203, this._pwBoxY        - 32, 76, 64, scale, ox, oy);
    if (this._confirmEyeHitEl) this._posEl(this._confirmEyeHitEl, layout.centerX + 203, this._confirmPwBoxY - 32, 76, 64, scale, ox, oy);
    if (this._verifyCodeEl) {
      const vmBoxY = layout.centerY + 20;
      this._posEl(this._verifyCodeEl, layout.centerX - 142, vmBoxY - 29, 318, 58, scale, ox, oy);
    }
  }

  _posEl(el, dx, dy, dw, dh, scale, ox, oy) {
    Object.assign(el.style, {
      left:       Math.round(ox + dx * scale) + "px",
      top:        Math.round(oy + dy * scale) + "px",
      width:      Math.round(dw * scale) + "px",
      height:     Math.round(dh * scale) + "px",
      fontSize:   Math.round(26 * scale) + "px",
      lineHeight: Math.round(dh * scale) + "px",
    });
  }

  _togglePasswordVisible() {
    this.passwordVisible = !this.passwordVisible;
    this.sound.play("ui_click", { volume: 0.6 });
    if (this._pwEl) this._pwEl.type = this.passwordVisible ? "text" : "password";
    this.eyeIcon?.setFrame(this.passwordVisible ? "opened_eye" : "closed_eye");
  }

  _updateHints() {
    // Email/phone hint: format error or verify reminder
    if (this.usernameValue.length > 0 && !this._emailVerified) {
      if (this._phoneMode) {
        const validPhone = /^\d{7,14}$/.test(this.usernameValue.trim());
        this.emailHintText?.setText(validPhone ? "* 需要先驗證電話號碼！" : "* 請輸入正確的電話號碼");
      } else {
        const validFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.usernameValue);
        this.emailHintText?.setText(validFormat ? "* 需要先驗證郵箱！" : "* 請輸入正確的郵箱格式");
      }
      this.emailHintText?.setVisible(true);
    } else {
      this.emailHintText?.setVisible(false);
    }
    // Nick hint: hide as soon as something is typed
    if (this.displayNameValue.trim()) this.nickHintText?.setVisible(false);
    // Gender hint: hide as soon as a gender is selected
    if (this.genderValue) this.genderHintText?.setVisible(false);
    // Password hint: only when something is typed but < 8 chars
    this.pwHintText?.setVisible(this.passwordValue.length > 0 && this.passwordValue.length < 8);
    // Confirm hint: only when something is typed but doesn't match
    this.confirmPwHintText?.setVisible(this.confirmPasswordValue.length > 0 && this.passwordValue !== this.confirmPasswordValue);
  }

  _updateEmailFormatIndicator() {
    this.emailFormatText?.setVisible(false);
  }

  _updateConfirmMatch() {
    // Password field indicator
    if (!this.passwordValue) {
      this.pwMatchText?.setVisible(false);
    } else {
      const pwOk = this.passwordValue.length >= 8;
      this.pwMatchText
        ?.setText(pwOk ? "✓" : "✗")
        .setStyle({ color: pwOk ? "#3db428" : "#d43535", shadow: { offsetX: 1, offsetY: 2, color: pwOk ? "rgba(0,40,0,0.35)" : "rgba(60,0,0,0.35)", blur: 6, fill: true } })
        .setVisible(true);
    }
    // Confirm password field indicator
    if (!this.confirmPasswordValue) {
      this.confirmPwMatchText?.setVisible(false);
      return;
    }
    const match = this.passwordValue === this.confirmPasswordValue;
    this.confirmPwMatchText
      ?.setText(match ? "✓" : "✗")
      .setStyle({ color: match ? "#3db428" : "#d43535", shadow: { offsetX: 1, offsetY: 2, color: match ? "rgba(0,40,0,0.35)" : "rgba(60,0,0,0.35)", blur: 6, fill: true } })
      .setVisible(true);
  }

  _toggleConfirmPasswordVisible() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
    this.sound.play("ui_click", { volume: 0.6 });
    if (this._confirmPwEl) this._confirmPwEl.type = this.confirmPasswordVisible ? "text" : "password";
    this.confirmEyeIcon?.setFrame(this.confirmPasswordVisible ? "opened_eye" : "closed_eye");
  }

  _sendEmailVerification() {
    const val = this.usernameValue.trim();
    if (!val) {
      this.emailHintText?.setText("* 請先輸入郵箱或電話號碼").setVisible(true);
      return;
    }
    if (this._phoneMode) {
      if (!/^\d{7,14}$/.test(val)) {
        this.emailHintText?.setText("* 請輸入正確的電話號碼").setVisible(true);
        return;
      }
      if (!this.app.sendPacket("register_verification_request", { username: this._phoneCode + val })) {
        this.emailHintText?.setText("* 連線失敗，請稍後再試").setVisible(true);
        return;
      }
      this._showVerifyModal("sms");
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        this.emailHintText?.setText("* 請輸入正確的郵箱格式").setVisible(true);
        return;
      }
      if (!this.app.sendPacket("register_verification_request", { username: val })) {
        this.emailHintText?.setText("* 連線失敗，請稍後再試").setVisible(true);
        return;
      }
      this._showVerifyModal("email");
    }
  }

  _buildVerifyModal() {
    const D = 11500;
    const PW = 460, PH = 360, CR = 16;

    this._vmOverlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width * 4, layout.height * 4, 0x000000, 0.72)
      .setDepth(D).setVisible(false);
    this._vmOverlay.setInteractive();
    this._vmOverlay.on("pointerdown", () => {});
    this._vmOverlay.on("pointerup", () => {});

    this._vmBorder = this.add.graphics().setDepth(D + 0.5).setVisible(false);

    this._vmMaskGfx = this.make.graphics({ add: false });
    this._vmPanel = this.add.graphics().setDepth(D + 1).setVisible(false);
    this._vmPanel.setMask(this._vmMaskGfx.createGeometryMask());
    this._vmPanel.on("pointerdown", () => {});
    this._vmPanel.on("pointerup", () => {});

    this._vmTitleLabel = this.add.image(0, 0, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(320, 112).setDepth(D + 1.5).setVisible(false);

    this._vmTitle = this.add.text(0, 0, "驗證信箱", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);
    applyGoldTitleGradient(this._vmTitle);

    this._vmDescText = this.add.text(0, 0, "請輸入發送至信箱的驗證碼", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "22px", color: "#e8d5b0", align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

    this._vmBoxGfx = this.add.graphics().setDepth(D + 2).setVisible(false);
    this._vmCodeIcon = this.add.image(0, 0, "login", "lock").setDisplaySize(40, 52).setDepth(D + 2).setVisible(false);

    const btnLabelStyle = { fontSize: "28px", color: "#ffffff", shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 4, fill: true } };
    this._vmConfirmBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "確認", labelStyle: btnLabelStyle,
      depth: D + 2, onClick: () => this._confirmEmailVerification(), visible: false,
    });
    this._vmCancelBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "取消", labelStyle: btnLabelStyle,
      depth: D + 2, onClick: () => this._hideVerifyModal(), visible: false,
    });

    this._vmPW = PW; this._vmPH = PH; this._vmCR = CR;

    // Result modal (shown after verify attempt)
    const RPW = 460, RPH = 360, RCR = 16, RD = 12000;
    this._rmOverlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width * 4, layout.height * 4, 0x000000, 0.72)
      .setDepth(RD).setVisible(false);
    this._rmOverlay.setInteractive();
    this._rmOverlay.on("pointerdown", () => {});
    this._rmOverlay.on("pointerup", () => {});
    this._rmBorder = this.add.graphics().setDepth(RD + 0.5).setVisible(false);
    this._rmMaskGfx = this.make.graphics({ add: false });
    this._rmPanel = this.add.graphics().setDepth(RD + 1).setVisible(false);
    this._rmPanel.setMask(this._rmMaskGfx.createGeometryMask());
    this._rmPanel.on("pointerdown", () => {});
    this._rmPanel.on("pointerup", () => {});
    this._rmTitleLabel = this.add
      .image(0, 0, "game_table", "title_label")
      .setOrigin(0.5)
      .setDisplaySize(320, 112)
      .setDepth(RD + 1.5)
      .setVisible(false);
    this._rmTitle = this.add.text(0, 0, "", {
      fontFamily: "sans-serif",
      fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(RD + 2).setVisible(false);
    this._rmText = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "28px", fontStyle: "bold", color: "#ffffff",
      align: "center", wordWrap: { width: RPW - 64 },
    }).setOrigin(0.5).setDepth(RD + 2).setVisible(false);
    this._rmBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0xf09218, bottomColor: 0x7a3200, borderColor: 0xffaa20,
      label: "確定",
      labelStyle: { fontSize: "28px", color: "#ffffff", shadow: { offsetX: 0, offsetY: 2, color: "#7a3800", blur: 4, fill: true } },
      depth: RD + 2, onClick: () => this._closeResultModal(), visible: false,
    });
    this._rmSuccess = false;
    this._rmPW = RPW; this._rmPH = RPH; this._rmCR = RCR;
  }

  _showVerifyModal(type = "email") {
    this._vmType = type;
    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._vmPW, PH = this._vmPH, CR = this._vmCR;
    const l = cx - PW / 2, t = cy - PH / 2;

    this._vmOverlay.setPosition(cx, cy).setSize(layout.width * 4, layout.height * 4).setVisible(true);

    this._vmBorder.clear();
    drawEnhancedBorder(this._vmBorder, l, t, PW, PH, CR);
    this._vmBorder.setVisible(true);

    this._vmMaskGfx.clear();
    this._vmMaskGfx.fillStyle(0xffffff);
    this._vmMaskGfx.fillRoundedRect(l, t, PW, PH, CR);

    this._vmPanel.clear();
    this._vmPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this._vmPanel.fillRect(l, t, PW, PH);
    this._vmPanel.setInteractive(new Phaser.Geom.Rectangle(l, t, PW, PH), Phaser.Geom.Rectangle.Contains);
    this._vmPanel.setVisible(true);

    this._vmTitleLabel.setPosition(cx, t).setVisible(true);
    const titleStr = type === "sms" ? "驗證電話" : "驗證信箱";
    const descStr  = type === "sms" ? "簡訊驗證碼已發送至您的手機\n請輸入6位數驗證碼" : "請輸入發送至信箱的驗證碼";
    this._vmTitle.setText(titleStr).setPosition(cx, t + 8).setVisible(true);
    applyGoldTitleGradient(this._vmTitle);
    this._vmDescText.setText(descStr).setPosition(cx, t + 110).setVisible(true);

    const boxY = cy + 20;
    this._drawBox(this._vmBoxGfx, cx, boxY, 400);
    this._vmBoxGfx.setVisible(true);
    this._vmCodeIcon.setPosition(cx - 172, boxY).setVisible(true);

    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input").forEach(el => el.style.setProperty("display", "none", "important"));
    this._syncInputPositions();

    document.getElementById("reg-verify-code")?.remove();
    const el = document.createElement("input");
    el.id = "reg-verify-code";
    el.type = "text";
    el.placeholder = "輸入驗證碼";
    el.autocomplete = "one-time-code";
    el.maxLength = 6;
    el.className = "fp-input";
    Object.assign(el.style, {
      position: "fixed", background: "transparent", backgroundColor: "transparent",
      border: "none", outline: "none", boxShadow: "none", WebkitBoxShadow: "none",
      colorScheme: "dark", color: INPUT_TEXT_COLOR, WebkitTextFillColor: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR, fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "26px", fontWeight: "bold", zIndex: "200", padding: "0 8px", boxSizing: "border-box",
    });
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this._confirmEmailVerification(); } });
    el.addEventListener("focus", this._onInputFocus);
    el.addEventListener("blur", this._onInputBlur);
    document.body.appendChild(el);
    this._verifyCodeEl = el;

    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = -this._kbOffset;
    this._posEl(el, cx - 142, boxY - 29, 318, 58, scale, ox, oy);

    const btnY = t + PH - 54;
    this._vmConfirmBtn.setPosition?.(cx - 120, btnY);
    this._vmConfirmBtn.setVisible(true);
    this._vmCancelBtn.setPosition?.(cx + 120, btnY);
    this._vmCancelBtn.setVisible(true);
  }

  _hideVerifyModal() {
    document.getElementById("reg-verify-code")?.remove();
    this._verifyCodeEl = null;
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input").forEach(el => el.style.removeProperty("display"));
    }
    [this._vmOverlay, this._vmBorder, this._vmPanel, this._vmTitleLabel, this._vmTitle,
     this._vmDescText, this._vmBoxGfx, this._vmCodeIcon, this._vmConfirmBtn, this._vmCancelBtn]
      .forEach(o => o?.setVisible(false));
    this._syncInputPositions();
  }

  _confirmEmailVerification() {
    const code = this._verifyCodeEl?.value?.trim() ?? "";
    if (!code) return;
    // Store the code to be sent together with the register packet.
    this._verifyCode = code;
    this._hideVerifyModal();
    // Mark as verified so the UI shows the checkmark and submit is allowed.
    this._emailVerified = true;
    this.verifyEmailBtn?.setVisible(false);
    this.emailFormatText?.setVisible(false);
    this.emailVerifiedCheck?.setPosition(layout.centerX + 255, this._emailBoxY).setVisible(true);
    this.emailHintText?.setVisible(false);
  }

  _showResultModal(success, errMsg = null, errTitle = null) {
    this._rmSuccess = success;
    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._rmPW, PH = this._rmPH, CR = this._rmCR;
    const l = cx - PW / 2, t = cy - PH / 2;

    this._rmOverlay.setPosition(cx, cy).setSize(layout.width * 4, layout.height * 4).setVisible(true);

    this._rmBorder.clear();
    drawEnhancedBorder(this._rmBorder, l, t, PW, PH, CR);
    this._rmBorder.setVisible(true);

    this._rmMaskGfx.clear();
    this._rmMaskGfx.fillStyle(0xffffff);
    this._rmMaskGfx.fillRoundedRect(l, t, PW, PH, CR);
    this._rmPanel.clear();
    this._rmPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this._rmPanel.fillRect(l, t, PW, PH);
    this._rmPanel.setInteractive(new Phaser.Geom.Rectangle(l, t, PW, PH), Phaser.Geom.Rectangle.Contains);
    this._rmPanel.setVisible(true);

    this._rmTitleLabel.setPosition(cx, t).setVisible(true);
    this._rmTitle.setText(success ? "驗證成功" : (errTitle ?? "驗證失敗")).setPosition(cx, t + 8).setVisible(true);
    applyGoldTitleGradient(this._rmTitle);

    const successMsg = this._vmType === "sms" ? "電話驗證成功！" : "郵箱驗證成功！";
    this._rmText
      .setText(success ? successMsg : (errMsg ?? "驗證碼錯誤，請重試"))
      .setStyle({ color: "#ffffff" })
      .setPosition(cx, cy - 10)
      .setVisible(true);

    this._rmBtn.setPosition?.(cx, t + PH - 54);
    this._rmBtn.setVisible(true);

    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.setProperty("display", "none", "important"));
    this._syncInputPositions();
  }

  _closeResultModal() {
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.removeProperty("display"));
    }
    [this._rmOverlay, this._rmBorder, this._rmPanel, this._rmTitleLabel, this._rmTitle, this._rmText, this._rmBtn]
      .forEach(o => o?.setVisible(false));
    this._syncInputPositions();

    if (this._rmSuccess) {
      this._emailVerified = true;
      this.verifyEmailBtn?.setVisible(false);
      this.emailFormatText?.setVisible(false);
      this.emailVerifiedCheck?.setPosition(layout.centerX + 255, this._emailBoxY).setVisible(true);
      this._updateHints();
    }
  }

  _selectGender(gender) {
    this.genderValue = this.genderValue === gender ? "" : gender;
    this._updateGenderBtns();
    this._updateHints();
  }

  _updateGenderBtns() {
    const m = this.genderValue === "male";
    const f = this.genderValue === "female";
    this.genderMaleBtn?.setGradient?.(
      m ? 0x1a5f9e : 0x3a2010,
      m ? 0x0a2a5a : 0x1a0800,
      m ? 0x4faee8 : 0x6a4020,
    );
    this.genderFemaleBtn?.setGradient?.(
      f ? 0x9e1a5f : 0x3a2010,
      f ? 0x5a0a2a : 0x1a0800,
      f ? 0xe84fa8 : 0x6a4020,
    );
  }

  _setupBgm() {
    this.bgm = this.sound.get("bgm_main");
    if (!this.bgm) this.bgm = this.sound.add("bgm_main", { loop: true, volume: 0.2 });
    if (!this.sound.locked) {
      this._syncBgm();
    } else {
      this.input.once("pointerdown", () => this._syncBgm());
    }
  }

  _syncBgm() {
    if (!this.bgm) return;
    const vol = Number(this.app.getBgmOutputVolume?.(1) ?? 0);
    if (vol > 0) {
      this.bgm.setVolume(vol);
      if (this.bgm.isPaused) this.bgm.resume();
      else if (!this.bgm.isPlaying) this.bgm.play();
    } else {
      if (this.bgm.isPlaying || this.bgm.isPaused) this.bgm.pause();
    }
  }

  submitRegister() {
    let ok = true;

    if (!this.usernameValue.trim() || !this._emailVerified) {
      this.emailHintText?.setVisible(true);
      ok = false;
    } else {
      this.emailHintText?.setVisible(false);
    }

    if (!this.displayNameValue.trim()) {
      this.nickHintText?.setVisible(true);
      ok = false;
    } else {
      this.nickHintText?.setVisible(false);
    }

    if (!this.genderValue) {
      this.genderHintText?.setVisible(true);
      ok = false;
    } else {
      this.genderHintText?.setVisible(false);
    }

    if (!this.passwordValue || this.passwordValue.length < 8) {
      this.pwHintText?.setVisible(true);
      ok = false;
    } else {
      this.pwHintText?.setVisible(false);
    }

    if (!this.confirmPasswordValue || this.passwordValue !== this.confirmPasswordValue) {
      this.confirmPwHintText?.setVisible(true);
      ok = false;
    } else {
      this.confirmPwHintText?.setVisible(false);
    }

    if (!ok) return;

    // Dismiss keyboard before sending
    this._emailEl?.blur();
    this._nickEl?.blur();
    this._pwEl?.blur();
    this._confirmPwEl?.blur();

    const val = this.usernameValue.trim();
    const username = this._phoneMode ? (this._phoneCode + val) : val;
    const password = this.passwordValue;
    const displayName = this.displayNameValue.trim();
    const packet = { username, password, avatar: "avatar_001", display_name: displayName || username, code: this._verifyCode };
    if (this.genderValue) packet.gender = this.genderValue;
    const _sNow = this.store?.getState?.() ?? {};
    this._lastSeenErrVersionForRegister = Number(_sNow.errorVersion ?? 0);
    const sent = this.app.sendPacket("register", packet);
    if (!sent) {
      const msg = this.store?.getState?.()?.lastError?.message ?? "連線尚未建立，請稍後再試";
      this._showResultModal(false, msg, "送出失敗");
    } else {
      this._waitingRegister = true;
    }
  }

  _adjustForKeyboard(isOpen) {
    const root = document.getElementById('phaser-root');
    if (!root) return;
    if (!isOpen) {
      this._kbOffset = 0;
      this._kbMaxOffset = 0;
      if (this._kbOverlay) this._kbOverlay.style.display = 'none';
      root.style.transition = 'none';
      root.style.transform = '';
      this._syncInputPositions();
      return;
    }
    const vv = window.visualViewport;
    const baseH = Math.max(window.innerHeight, this._initWindowH);
    const visibleH = vv ? vv.height : baseH;
    const keyboardH = Math.max(0, baseH - visibleH);
    if (keyboardH < 80) {
      if (this._kbOffset > 0) this._adjustForKeyboard(false);
      return;
    }
    this._kbMaxOffset = keyboardH;
    if (this._kbOverlay) this._kbOverlay.style.display = 'block';
    if (this._kbOffset === 0) {
      const physScale = window.innerWidth / 720;
      const anchorPhysY = (layout.centerY + 470) * physScale;
      const autoShift = Math.max(0, Math.ceil(anchorPhysY - (visibleH - 24)));
      if (autoShift > 0) {
        this._kbOffset = Math.min(autoShift, keyboardH);
        root.style.transition = 'none';
        root.style.transform = `translateY(-${this._kbOffset}px)`;
        this._syncInputPositions();
      }
    }
  }

  _destroyScene() {
    this._storeUnsub?.(); this._storeUnsub = null;
    if (this._vmOverlay?.visible) this._hideVerifyModal();
    if (this._rmOverlay?.visible) this._closeResultModal();
    clearTimeout(this._kbTimer);
    if (this._kbOverlay) { this._kbOverlay.remove(); this._kbOverlay = null; }
    const root = document.getElementById('phaser-root');
    if (root) { root.style.transition = ''; root.style.transform = ''; }
    this._emailEl?.remove();           this._emailEl = null;
    this._nickEl?.remove();            this._nickEl = null;
    this._pwEl?.remove();              this._pwEl = null;
    this._confirmPwEl?.remove();       this._confirmPwEl = null;
    this._phoneCodeEl?.remove();       this._phoneCodeEl = null;
    this._eyeHitEl?.remove();          this._eyeHitEl = null;
    this._confirmEyeHitEl?.remove();   this._confirmEyeHitEl = null;
    this._styleEl?.remove();           this._styleEl = null;
    if (this._syncBound) {
      window.removeEventListener("resize", this._syncBound);
      window.visualViewport?.removeEventListener("resize", this._syncBound);
      this._syncBound = null;
    }
    document.getElementById("reg-verify-code")?.remove();
    this._verifyCodeEl = null;
    this.genderMaleBtn?.destroy?.();   this.genderMaleBtn = null;
    this.genderFemaleBtn?.destroy?.(); this.genderFemaleBtn = null;
    this.verifyEmailBtn?.destroy?.();  this.verifyEmailBtn = null;
    this._vmConfirmBtn?.destroy?.();   this._vmConfirmBtn = null;
    this._vmCancelBtn?.destroy?.();    this._vmCancelBtn = null;
    this._rmBtn?.destroy?.();          this._rmBtn = null;
    this._rmTitleLabel?.destroy?.();   this._rmTitleLabel = null;
    this._rmTitle?.destroy?.();        this._rmTitle = null;
    this.soundSettingsPanel?.destroy?.();
    this.soundSettingsPanel = null;
  }

  update() {
    if (!this.logoSprite) return;
    this._logoElapsed += this.game.loop.delta;
    if (this._logoElapsed >= 33.33) {
      this._logoElapsed -= 33.33;
      this._logoFrame = (this._logoFrame + 1) % 150;
      this.logoSprite.setFrame(`logo${this._logoFrame}.png`);
    }
  }
}
