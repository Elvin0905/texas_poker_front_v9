import { bindImageButton, applyGoldTitleGradient, drawEnhancedBorder, createGradientButton } from "../ui/button.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";
import { layout, onLayoutResize } from "../../../shared/core/layout.js";

// Google 登入（Google Identity Services / GSI）。credential(ID token) 會透過 app
// 既有的 WebSocket 以 google_login 送給後端，後端回 login_ok（已有處理）。
const GOOGLE_CLIENT_ID = "710155903331-63qeqmh24lnkrl0950r658mte2gmk5jm.apps.googleusercontent.com";

// LINE 登入（LINE Login v2.1 popup code flow，比照 docs/line_custom_button_login_example.html）。
// 點 LINE 鈕 → 開 access.line.me 授權 popup → 導回 /oauth/line-callback.html → postMessage 回本頁 →
// 送 line_login { code, redirect_uri, nonce } 給後端。redirect_uri 需在 LINE console 白名單且與此完全一致。
const LINE_CHANNEL_ID = "2010421378";
const LINE_LOGIN_SCOPE = "openid profile email";

// Instagram 登入（Instagram OAuth popup code flow，比照 docs/instagram_custom_button_login_example.html）。
// INSTAGRAM_APP_ID 為 Meta/Instagram app 的 client_id（公開值）。目前留空 → 點 IG 鈕維持「串接中」占位，
// 不會開授權視窗；日後把 App ID 填入此常數即自動啟用（redirect_uri 需在 Meta app 白名單、後端需處理 instagram_login）。
const INSTAGRAM_APP_ID = "";
const INSTAGRAM_LOGIN_SCOPE = "instagram_business_basic";

const BOX_W = 565;
const BOX_H = 80;
const BOX_CR = 14;
const BOX_BG = 0x3a1800;
const BOX_BG_ALPHA = 0.88;
const BOX_BORDER = 0xb8860b;
const INPUT_TEXT_COLOR = "#e8d5b0";
const INPUT_PH_COLOR = "rgba(200,170,110,0.55)";
const ICON_X = -228; // offset from cx
const EYE_X = 238;   // offset from cx
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

export class AuthScene extends Phaser.Scene {
  constructor() {
    super("auth");
    const params = new URLSearchParams(window.location.search);
    const wsParam = String(params.get("ws") || "").trim();
    const useDebug = wsParam.length > 0;
    this.usernameValue = useDebug ? "abc@gmail.com" : "";
    this.passwordValue = useDebug ? "aaa123" : "";
    this.passwordVisible = false;
    this.agreeChecked = true;
    this._emailEl = null;
    this._pwEl = null;
    this._fpEl = null;
    this._styleEl = null;
    this._syncBound = null;
    this._emailBoxY = 0;
    this._pwBoxY = 0;
    this.soundSettingsPanel = null;
    this.emailIndicator = null;
    this.pwIndicator = null;
    this.emailHintText = null;
    this.pwHintText = null;
    this.agreeHintText = null;
    this._lastSeenAuthErrorVersion = 0;
    this._lastSeenCheckVersion = 0;
    this._pendingCheckEmail = "";
    this._emailCheckTimer = null;
    this._storeUnsub = null;
    this._phoneMode = false;
    this._phoneCode = "+886";
    this._phoneCodeEl = null;
    this._eyeHitEl = null;
    this._forgotHitEl = null;
    this.rememberMe = false;
    this.rememberGfx = null;
    this.rememberText = null;
    this.rememberZone = null;

    if (!useDebug) {
      try {
        const saved = JSON.parse(localStorage.getItem("auth_remember_me") || "null");
        if (saved) {
          this.usernameValue = saved.username || "";
          this.passwordValue = saved.password || "";
          this._phoneCode    = saved.phoneCode || "+886";
          this.rememberMe    = true;
        }
      } catch {}
    }
  }

  create() {
    // Only reset modal state if no modal is currently showing across a scene transition.
    // e.g. a WS_NOT_OPEN error fires in lobby, errorModal shows, then scene switches here —
    // clearing modal-open would unhide inputs and let them paint over the still-visible modal.
    const _errModalVisible = this.scene.get("errorModal")?.blocker?.visible;
    if (!_errModalVisible) {
      document.body.dataset.modalDepth = "0";
      document.body.classList.remove("modal-open");
    }
    this.useResponsiveLayout = true;
    this.app = window.__APP__;
    this.store = this.app.store;
    this.cameras.main.setRoundPixels(true);

    // Skip stale errors already in the store before this scene loaded
    const _s = this.store?.getState?.() ?? {};
    this._lastSeenAuthErrorVersion = Number(_s.errorVersion ?? 0);
    this._lastSeenCheckVersion     = Number(_s.accountCheckVersion ?? 0);
    this._lastSeenFpEventVersion   = Number(_s.fpEventVersion ?? 0);

    this._injectCss();
    this._buildScene();
    this._buildForgotModal();
    this._buildHtmlInputs();
    this._buildHtmlHitAreas();

    this._initWindowH = window.innerHeight;
    this._kbTimer = null;
    this._kbOffset = 0;
    this._kbMaxOffset = 0;
    this._kbDragY = 0;
    this._kbDragOffset = 0;
    this._kbDragging = false;
    this._kbLastInput = null;

    this._syncBound = () => {
      this._syncInputPositions();
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') {
        clearTimeout(this._kbTimer);
        this._kbTimer = setTimeout(() => this._adjustForKeyboard(true), 120);
      } else if (this._kbMaxOffset > 0) {
        // No input focused but keyboard shift was active → keyboard dismissed, restore immediately
        clearTimeout(this._kbTimer);
        this._adjustForKeyboard(false);
      }
    };
    window.addEventListener("resize", this._syncBound);
    window.visualViewport?.addEventListener("resize", this._syncBound);

    // iOS Safari ignores overflow:hidden on body when input focused — force scroll reset
    this._preventScrollBound = () => { if (window.scrollY !== 0) { window.scrollTo(0, 0); this._syncInputPositions(); } };
    window.addEventListener("scroll", this._preventScrollBound, { passive: true });

    // Focus fires the moment user taps an input — 400ms gives keyboard time to open
    this._onInputFocus = () => {
      clearTimeout(this._kbTimer);
      this._kbTimer = setTimeout(() => this._adjustForKeyboard(true), 400);
      // iOS Safari scrolls page when input focused — reset immediately and re-sync inputs
      setTimeout(() => { window.scrollTo(0, 0); this._syncInputPositions(); }, 50);
    };
    this._onInputBlur = () => {
      clearTimeout(this._kbTimer);
      this._kbTimer = setTimeout(() => {
        const a = document.activeElement;
        if (!a || a.tagName !== 'INPUT') this._adjustForKeyboard(false);
      }, 200);
    };

    // Drag overlay: z:160 stays above canvas even when body.modal-open raises canvas to z:150.
    // e.preventDefault() on touchstart blocks the simulated mousedown that would
    // normally steal focus from the input — keyboard stays open during drag.
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

    // Defensive: re-apply layout on the next tick so any camera/viewport changes
    // that fire synchronously during scene startup (scale resize, CREATE event
    // handlers in main.js) are reflected before the first render is visible.
    this.time.delayedCall(0, () => this.applyLayout());

    this._setupBgm();

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: layout.right - 60,
      buttonY: 60,
      onSettingsChanged: () => this._syncBgm(),
    });

    this._storeUnsub = this.store?.subscribe((state) => this._handleAuthState(state));
    this.events.once("shutdown", () => this._destroyScene());
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
      `body.modal-open .lrn-input, body.modal-open .phone-code-sel { display: none !important; visibility: hidden !important; }`,
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
      .text(cx, 0, "帳號登入", {
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
    this.emailLabel = this.add.text(0, 0, "信箱/電話號碼", labelStyle).setOrigin(0, 0.5);
    this.emailBoxGfx = this.add.graphics();
    this.mailIcon = this.add.image(0, 0, "login", "user").setDisplaySize(50, 55);

    this.passwordLabel = this.add.text(0, 0, "Password | 密碼", labelStyle).setOrigin(0, 0.5);
    this.passwordBoxGfx = this.add.graphics();
    this.lockIcon = this.add.image(0, 0, "login", "lock").setDisplaySize(44, 56);

    this.eyeIcon = this.add
      .image(0, 0, "login", "closed_eye")
      .setDisplaySize(46, 23);

    const indicatorStyle = {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "48px", fontStyle: "bold", color: "#3db428",
      shadow: { offsetX: 1, offsetY: 2, color: "rgba(0,40,0,0.35)", blur: 6, fill: true },
    };
    const hintStyle = {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "20px", color: "#e85555", fontStyle: "bold",
    };
    this.emailIndicator = this.add.text(0, 0, "", indicatorStyle).setOrigin(0.5).setDepth(10).setVisible(false);
    this.emailHintText  = this.add.text(0, 0, "", hintStyle).setOrigin(0, 0.5).setDepth(10).setVisible(false);
    this.pwIndicator    = this.add.text(0, 0, "", indicatorStyle).setOrigin(0.5).setDepth(10).setVisible(false);
    this.pwHintText     = this.add.text(0, 0, "* 請輸入正確密碼", hintStyle).setOrigin(0, 0.5).setDepth(10).setVisible(false);

    this.forgotText = this.add
      .text(0, 0, "忘記密碼", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "26px", color: "#c8a87a",
      })
      .setOrigin(1, 0.5)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-116, -18, 116, 36),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
    this.forgotText.on("pointerup", () => { this.sound.play("ui_click", { volume: 0.6 }); this._showForgotModal(); });

    this.loginBtn = this.add.image(0, 0, "login", "click_login_btn").setDisplaySize(290, 89);
    bindImageButton(this, this.loginBtn, { onClick: () => this.submitLogin() });

    this.visitorBtn = this.add.image(0, 0, "login", "visitor_login").setDisplaySize(290, 89);
    bindImageButton(this, this.visitorBtn, { onClick: () => {
      if (!this.agreeChecked) { this.agreeHintText?.setVisible(true); return; }
      this.app.sendPacket("guest_login", {});
    } });

    this.otherLabel = this.add
      .text(cx, 0, "其他登入方式", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "26px", color: "#b49060",
      })
      .setOrigin(0.5);
    this.otherGfx = this.add.graphics();

    this.fbBtn = this.add.image(0, 0, "login", "fb").setDisplaySize(86, 86);
    bindImageButton(this, this.fbBtn, { onClick: () => this._showThirdParty("Facebook") });
    this.googleBtn = this.add.image(0, 0, "login", "google").setDisplaySize(86, 86);
    // 保留原本的圓形 Google 圖標（永遠可見）；點擊時觸發 Google 登入（GSI One Tap）。
    // 拿到 credential(ID token) → 走 app 既有 WS 送 google_login，後端回 login_ok（已有處理）。
    bindImageButton(this, this.googleBtn, { onClick: () => this._triggerGoogleLogin() });
    this._initGoogleSignIn();
    this.lineBtn = this.add.image(0, 0, "login", "line").setDisplaySize(86, 86);
    // LINE 登入：開授權 popup，導回頁 postMessage 回來後送 line_login（比照 Google 走 app 既有 WS）。
    bindImageButton(this, this.lineBtn, { onClick: () => this._triggerLineLogin() });
    this._initLineLogin();
    // Instagram 圖標（login 圖集的 "ig" frame，與 fb/google/line 同一張圖集），排在 LINE 右側；尺寸 86×86。
    // 點擊走 _triggerInstagramLogin（App ID 未填時自動退回「串接中」占位）。
    this.igBtn = this.add.image(0, 0, "login", "ig").setDisplaySize(86, 86);
    bindImageButton(this, this.igBtn, { onClick: () => this._triggerInstagramLogin() });
    this._initInstagramLogin();

    this.agreeGfx = this.add.graphics();
    this.agreeZone = this.add.zone(0, 0, 32, 32).setInteractive({ useHandCursor: true });
    this.agreeZone.on("pointerup", () => this._toggleAgree());

    const _as = { fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif', fontSize: "22px", color: "#c8a870" };
    const _al = { ..._as, color: "#f0c040" };
    this.agreeStaticText = this.add.text(0, 0, "我已閱讀並同意", _as).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.agreeStaticText.on("pointerup", () => this._toggleAgree());
    this.agreeLink1 = this.add.text(0, 0, "《用戶協議》", _al).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.agreeLink1.on("pointerup", () => { this.sound.play("ui_click", { volume: 0.6 }); this._showTermModal("user"); });
    this.agreeLink2 = this.add.text(0, 0, "《隱私協議》", _al).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.agreeLink2.on("pointerup", () => { this.sound.play("ui_click", { volume: 0.6 }); this._showTermModal("privacy"); });

    this.agreeHintText = this.add.text(0, 0, "* 請先勾選同意用戶協議及隱私協議", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "20px", color: "#e85555", fontStyle: "bold",
    }).setOrigin(0.5).setVisible(false);

    this.rememberGfx  = this.add.graphics();
    this.rememberText = this.add.text(0, 0, "記住密碼", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "26px", color: "#c8a87a",
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.rememberText.on("pointerup", () => this._toggleRememberMe());
    this.rememberZone = this.add.zone(0, 0, 36, 36).setInteractive({ useHandCursor: true });
    this.rememberZone.on("pointerup", () => this._toggleRememberMe());

    this._buildTermModal();

    this.noAccountText = this.add
      .text(0, 0, "沒有帳號?", {
        fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "28px", color: "#d4b88a",
      })
      .setOrigin(0, 0.5);
    this.registerBtn = this.add.image(0, 0, "login", "register_btn").setDisplaySize(220, 72);
    bindImageButton(this, this.registerBtn, { onClick: () => this.store.setPage("register") });

    this.applyLayout();
  }

  _applyCamera() {
    const cam = this.cameras?.main;
    const canvas = this.sys?.game?.canvas;
    if (!cam || !canvas?.width || !canvas?.height) return;
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const designZoom = Math.max(window.innerHeight, this._initWindowH || window.innerHeight) / layout.height;
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

    // Spacing scale: compress gaps proportionally when the viewport is short so
    // nothing overlaps. Only kicks in below ~1150 logical units of usable height.
    // Interactive elements keep their physical size; only vertical spacing shrinks.
    const usableH = layout.height - layout.safeAreaTop - layout.safeAreaBottom;
    const ss = Math.min(1, usableH / 1380);

    const s = (v) => Math.round(v * ss);

    // Scale font sizes proportionally so text doesn't overflow on short viewports
    this.titleText?.setFontSize(Math.round(40 * ss) + 'px');
    this.emailLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.passwordLabel?.setFontSize(Math.round(28 * ss) + 'px');
    this.forgotText?.setFontSize(Math.round(26 * ss) + 'px');
    this.rememberText?.setFontSize(Math.round(26 * ss) + 'px');
    this.otherLabel?.setFontSize(Math.round(26 * ss) + 'px');
    this.agreeStaticText?.setFontSize(Math.round(22 * ss) + 'px');
    this.agreeLink1?.setFontSize(Math.round(22 * ss) + 'px');
    this.agreeLink2?.setFontSize(Math.round(22 * ss) + 'px');
    this.noAccountText?.setFontSize(Math.round(28 * ss) + 'px');

    const titleY = cy - s(338);
    const logoY = Math.max(layout.safeAreaTop + 20, titleY - s(176));
    const logoSize = Math.round(Math.max(120, 568 * ss));
    this.logoSprite?.setDisplaySize(logoSize, Math.round(logoSize * 264 / 568));
    this.logoSprite?.setPosition(Math.round(cx / 2) * 2, logoY);

    this.titleText?.setPosition(cx, titleY);
    this.titleBorderLeft?.setPosition(cx - 200, titleY);
    this.titleBorderRight?.setPosition(cx + 200, titleY);

    const emailLabelY = cy - s(271);
    this.emailLabel?.setPosition(cx - 268, emailLabelY);

    const emailBoxY = cy - s(202);
    this._emailBoxY = emailBoxY;
    this._drawBox(this.emailBoxGfx, cx, emailBoxY);
    this.mailIcon?.setPosition(cx + ICON_X, emailBoxY);

    const pwLabelY = cy - s(105);
    this.passwordLabel?.setPosition(cx - 268, pwLabelY);

    const pwBoxY = cy - s(38);
    this._pwBoxY = pwBoxY;
    this._drawBox(this.passwordBoxGfx, cx, pwBoxY);
    this.lockIcon?.setPosition(cx + ICON_X, pwBoxY);
    this.eyeIcon?.setPosition(cx + EYE_X, pwBoxY);

    this.emailIndicator?.setPosition(cx + 238, emailBoxY);
    this.emailHintText?.setPosition(cx - 268, emailBoxY + 56);
    this.pwIndicator?.setPosition(cx + 185, pwBoxY);
    this.pwHintText?.setPosition(cx - 268, pwBoxY + 56);

    this.forgotText?.setPosition(cx + 268, cy + s(51));

    const remY = cy + s(51), remCX = cx - 268;
    this.rememberZone?.setPosition(remCX, remY);
    this.rememberText?.setPosition(remCX + 22, remY);
    if (this.rememberGfx) {
      this.rememberGfx.clear();
      this.rememberGfx.lineStyle(2, 0xb8860b, 0.9);
      this.rememberGfx.strokeCircle(remCX, remY, 13);
      if (this.rememberMe) {
        this.rememberGfx.fillStyle(0x000000, 1);
        this.rememberGfx.fillCircle(remCX, remY, 9);
        this.rememberGfx.fillStyle(0xb8860b, 1);
        this.rememberGfx.fillCircle(remCX, remY, 5);
      }
    }

    this.loginBtn?.setPosition(cx - 160, cy + s(138));
    this.visitorBtn?.setPosition(cx + 160, cy + s(138));

    const otherY = cy + s(258);
    this.otherLabel?.setPosition(cx, otherY);
    if (this.otherGfx) {
      this.otherGfx.clear();
      this.otherGfx.lineStyle(1.5, 0xb8860b, 0.75);
      this.otherGfx.lineBetween(cx - 235, otherY, cx - 110, otherY);
      this.otherGfx.lineBetween(cx + 110, otherY, cx + 235, otherY);
    }

    const socialY = cy + s(344);
    // 四個社群鈕（fb / google / line / instagram）等距置中，維持 120px 間距。
    this.fbBtn?.setPosition(cx - 180, socialY);
    this.googleBtn?.setPosition(cx - 60, socialY);
    this.lineBtn?.setPosition(cx + 60, socialY);
    this.igBtn?.setPosition(cx + 180, socialY);

    const agreeY = cy + s(434);
    const circleX = cx - 210;
    this.agreeZone?.setPosition(circleX, agreeY);
    const textStartX = circleX + 28;
    this.agreeStaticText?.setPosition(textStartX, agreeY);
    const link1X = textStartX + (this.agreeStaticText?.width ?? 154);
    this.agreeLink1?.setPosition(link1X, agreeY);
    const link2X = link1X + (this.agreeLink1?.width ?? 132);
    this.agreeLink2?.setPosition(link2X, agreeY);
    if (this.agreeGfx) {
      this.agreeGfx.clear();
      this.agreeGfx.lineStyle(2, 0xb8860b, 0.9);
      this.agreeGfx.strokeCircle(circleX, agreeY, 13);
      if (this.agreeChecked) {
        this.agreeGfx.fillStyle(0x000000, 1);
        this.agreeGfx.fillCircle(circleX, agreeY, 9);
        this.agreeGfx.fillStyle(0xb8860b, 1);
        this.agreeGfx.fillCircle(circleX, agreeY, 5);
      }
    }

    this.agreeHintText?.setPosition(cx, agreeY + 32);

    const botY = layout.bottom - Math.max(80, layout.safeAreaBottom + 50);
    this.noAccountText?.setPosition(cx - 175, botY);
    this.registerBtn?.setPosition(cx + 80, botY);

    this.soundSettingsPanel?.triggerButton?.setPosition?.(layout.right - 60, 60);

    this._syncInputPositions();
  }

  _drawBox(gfx, cx, cy) {
    if (!gfx) return;
    const l = cx - BOX_W / 2, t = cy - BOX_H / 2;
    gfx.clear();
    // Outer glow strokes (extend outward, covered inward by fill)
    gfx.lineStyle(14, 0xb87010, 0.14);
    gfx.strokeRoundedRect(l, t, BOX_W, BOX_H, BOX_CR);
    gfx.lineStyle(7, 0xd4890f, 0.18);
    gfx.strokeRoundedRect(l, t, BOX_W, BOX_H, BOX_CR);
    // Dark background fill covers the inward half of the glow
    gfx.fillStyle(BOX_BG, BOX_BG_ALPHA);
    gfx.fillRoundedRect(l, t, BOX_W, BOX_H, BOX_CR);
    // Gold border stroke on top
    gfx.lineStyle(2.5, 0xd4a520, 1);
    gfx.strokeRoundedRect(l, t, BOX_W, BOX_H, BOX_CR);
    gfx.lineStyle(1, 0xffe878, 0.55);
    gfx.strokeRoundedRect(l, t, BOX_W, BOX_H, BOX_CR);
  }

  _buildHtmlInputs() {
    this._phoneCodeEl = this._makePhoneCodeEl();

    this._emailEl = this._makeEl("auth-email", "text", "輸入信箱或電話號碼", "username");
    this._emailEl.value = this.usernameValue;
    this._emailEl.addEventListener("input", () => {
      this.usernameValue = this._emailEl.value;
      this._updatePhoneMode();
      this._updateAuthIndicators();
    });
    this._emailEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._pwEl?.focus(); }
    });

    this._pwEl = this._makeEl("auth-pw", "password", "點擊輸入密碼", "current-password");
    this._pwEl.value = this.passwordValue;
    this._pwEl.addEventListener("input", () => {
      this.passwordValue = this._pwEl.value;
      this.pwIndicator?.setVisible(false);
      this.pwHintText?.setVisible(false);
    });
    this._pwEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this._pwEl.blur(); this.submitLogin(); }
    });

    // Attach keyboard detection via focus events (most reliable trigger on mobile)
    this._emailEl.addEventListener("focus", this._onInputFocus);
    this._emailEl.addEventListener("blur",  this._onInputBlur);
    this._pwEl.addEventListener("focus",    this._onInputFocus);
    this._pwEl.addEventListener("blur",     this._onInputBlur);

    // Restore phone mode if pre-filled from localStorage
    if (this.usernameValue) this._updatePhoneMode();

    // Elements now exist — do the first real positioning
    this._syncInputPositions();
    this.time.delayedCall(80, () => this._syncInputPositions());

    // Reveal inputs after a short delay so the camera and layout have time to settle.
    // Using a timer instead of 'postrender' avoids a race where postrender fires
    // (from another always-active scene) before the auth scene has rendered its
    // first frame with the correct camera/layout, which would show inputs floating
    // over an invisible Phaser panel.
    this.time.delayedCall(120, () => {
      if (document.body.classList.contains("modal-open")) return;
      if (this._emailEl) this._emailEl.style.visibility = '';
      if (this._pwEl)    this._pwEl.style.visibility = '';
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
    document.getElementById("auth-phone-code")?.remove();
    const sel = document.createElement("select");
    sel.id = "auth-phone-code";
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

  _syncInputPositions() {
    if (!this._emailEl || !this._pwEl) return;
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top;

    if (this._phoneMode && this._phoneCodeEl) {
      const selLeft = layout.centerX - 268;
      const selW = 128;
      const inputLeft = selLeft + selW + 10;
      const inputW = layout.centerX + 258 - inputLeft;
      this._posEl(this._phoneCodeEl, selLeft, this._emailBoxY - 29, selW, 58, scale, ox, oy);
      this._phoneCodeEl.style.removeProperty("display");
      this._posEl(this._emailEl, inputLeft, this._emailBoxY - 29, inputW, 58, scale, ox, oy);
    } else {
      this._phoneCodeEl?.style.setProperty("display", "none", "important");
      const textStartX = layout.centerX - 162;
      this._posEl(this._emailEl, textStartX, this._emailBoxY - 29, 365, 58, scale, ox, oy);
    }
    this._posEl(this._pwEl, layout.centerX - 162, this._pwBoxY - 29, 310, 58, scale, ox, oy);
    if (this._eyeHitEl)    this._posEl(this._eyeHitEl,    layout.centerX + 203, this._pwBoxY - 32,    76, 64, scale, ox, oy);
    if (this._forgotHitEl) this._posEl(this._forgotHitEl, layout.centerX + 140, layout.centerY + 27, 142, 50, scale, ox, oy);

    if (this._fpOverlay?.visible) {
      const cx = layout.centerX, cy = layout.centerY;
      if (this._fpStep === 1) {
        this._fpSyncStep1Input();
      } else if (this._fpStep === 2 && this._fpCodeEl) {
        this._posInBox(this._fpCodeEl, cx, cy + 20);
      } else if (this._fpStep === 3) {
        if (this._fpNewPwEl) this._posInBox(this._fpNewPwEl, cx, cy - 70);
        if (this._fpConfirmPwEl) this._posInBox(this._fpConfirmPwEl, cx, cy + 40);
      }
    }
  }

  _posEl(el, dx, dy, dw, dh, scale, ox, oy) {
    Object.assign(el.style, {
      left:       Math.round(ox + dx * scale) + "px",
      top:        Math.round(oy + dy * scale) + "px",
      width:      Math.round(dw * scale) + "px",
      height:     Math.round(dh * scale) + "px",
      fontSize:   Math.max(16, Math.round(26 * scale)) + "px",
      lineHeight: Math.round(dh * scale) + "px",
    });
  }

  _buildHtmlHitAreas() {
    const makeHit = () => {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "fixed", background: "transparent",
        zIndex: "80", cursor: "pointer", touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      });
      document.body.appendChild(el);
      return el;
    };
    this._eyeHitEl = makeHit();
    this._eyeHitEl.addEventListener("click", () => this._togglePasswordVisible());
    this._forgotHitEl = makeHit();
    this._forgotHitEl.addEventListener("click", () => {
      this.sound?.play("ui_click", { volume: 0.6 });
      this._showForgotModal();
    });
  }

  _updateAuthIndicators() {
    const val = this.usernameValue;
    const mode = this._detectInputMode(val);
    this.emailIndicator?.setVisible(false);
    if (val.length > 0) {
      if (mode === "phone" && !/^\d{7,14}$/.test(val.trim())) {
        this.emailHintText?.setText("* 請輸入正確電話號碼").setVisible(true);
      } else if (mode !== "phone" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        this.emailHintText?.setText("* 請輸入正確信箱格式").setVisible(true);
      } else {
        this.emailHintText?.setVisible(false);
      }
    } else {
      this.emailHintText?.setVisible(false);
    }
    this.pwIndicator?.setVisible(false);
    this.pwHintText?.setVisible(false);
  }

  _scheduleEmailCheck() {
    clearTimeout(this._emailCheckTimer);
    const email = this.usernameValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    this._pendingCheckEmail = email;
    this._emailCheckTimer = setTimeout(() => {
      if (this.usernameValue.trim() === this._pendingCheckEmail) {
        this.app.sendPacket("check_username", { username: this._pendingCheckEmail });
      }
    }, 700);
  }

  _handleAuthState(state) {
    // Handle positive account-exists response
    const checkVersion = Number(state?.accountCheckVersion ?? 0);
    if (checkVersion > this._lastSeenCheckVersion) {
      this._lastSeenCheckVersion = checkVersion;
      if (state.accountExists && this.usernameValue.trim() === this._pendingCheckEmail) {
        this._showFieldIndicator(this.emailIndicator, null, true);
        this.emailHintText?.setVisible(false);
        return;
      }
    }

    // Handle forgot-password flow responses
    const fpVer = Number(state?.fpEventVersion ?? 0);
    if (fpVer > this._lastSeenFpEventVersion) {
      this._lastSeenFpEventVersion = fpVer;
      const fpType = state?.fpEventType;
      if (fpType === "forgot_ok") {
        this._fpShowStep(2);
      } else if (fpType === "reset_code_ok") {
        this._fpShowStep(3);
      } else if (fpType === "reset_password_ok") {
        this._hideForgotModal();
      }
      return;
    }

    const version = Number(state?.errorVersion ?? 0);
    if (version <= this._lastSeenAuthErrorVersion) return;
    this._lastSeenAuthErrorVersion = version;

    const code = String(state?.lastError?.code ?? "").toUpperCase();

    // Third-party button errors are handled by the error modal — skip inline display
    if (code.includes("THIRD_PARTY") || code.includes("UNDER_CONSTRUCTION")) return;

    // If forgot-password modal is open, show error inside it instead of the login form
    if (this._fpOverlay?.visible) {
      const errMsg = String(state?.lastError?.message ?? "操作失敗，請重試");
      const cx = layout.centerX, cy = layout.centerY;
      // boxY = cy+20, box half-height = 40, so box bottom = cy+60; put text 22px below
      this._fpErrText?.setText(`* ${errMsg}`).setPosition(cx, cy + 82).setVisible(true);
      return;
    }

    const msg = String(state?.lastError?.message ?? "").toLowerCase();

    const isAccountError =
      code.includes("USER") || code.includes("ACCOUNT") || code.includes("EMAIL") ||
      code.includes("NOT_FOUND") || code.includes("NOTFOUND") ||
      msg.includes("帳號") || msg.includes("用戶") || msg.includes("信箱") ||
      msg.includes("account") || msg.includes("email") || msg.includes("user") || msg.includes("not found");

    const isPasswordError =
      code.includes("PASSWORD") || code.includes("PASS") || code.includes("CREDENTIAL") ||
      msg.includes("密碼") || msg.includes("password") || msg.includes("credential");

    // No indicators — just show the hint below the password field
    this.emailIndicator?.setVisible(false);
    this.emailHintText?.setVisible(false);
    this.pwIndicator?.setVisible(false);
    this.pwHintText?.setText("* 郵箱或密碼錯誤，請重新輸入！").setVisible(true);
  }

  _showFieldIndicator(indicator, hintText, success) {
    if (!indicator) return;
    indicator
      .setText(success ? "✓" : "✗")
      .setStyle({
        color: success ? "#3db428" : "#d43535",
        shadow: { offsetX: 1, offsetY: 2, color: success ? "rgba(0,40,0,0.35)" : "rgba(60,0,0,0.35)", blur: 6, fill: true },
      })
      .setVisible(true);
    hintText?.setVisible(!success);
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
      // Keyboard dismissed while input kept focus — restore immediately
      if (this._kbOffset > 0) this._adjustForKeyboard(false);
      return;
    }
    const physScale = window.innerWidth / 720;
    if (this._kbOverlay) this._kbOverlay.style.display = 'block';

    if (this._fpOverlay?.visible) {
      // fp-modal open: shift just enough to show modal input, never expose canvas bottom
      const fpInputPhysY = (layout.centerY + 20) * physScale;
      const modalTopCap = Math.max(0, Math.floor((layout.centerY - (this._fpPH ?? 460) / 2) * physScale) - 10);
      let target = Math.max(0, Math.ceil(fpInputPhysY - (visibleH - 40)));
      target = Math.min(target, modalTopCap, keyboardH - 1); // never expose canvas bottom
      this._kbMaxOffset = target;
      if (this._kbOffset !== target) {
        this._kbOffset = target;
        root.style.transition = 'none';
        root.style.transform = target > 0 ? `translateY(-${target}px)` : '';
        this._syncInputPositions();
      }
      return;
    }

    // Normal login form shift
    const anchorPhysY = (layout.centerY + 183) * physScale;
    this._kbMaxOffset = keyboardH;
    if (this._kbOffset > this._kbMaxOffset) {
      this._kbOffset = this._kbMaxOffset;
      root.style.transition = 'none';
      root.style.transform = `translateY(-${this._kbOffset}px)`;
      this._syncInputPositions();
    }
    if (this._kbOffset === 0) {
      const autoShift = Math.min(Math.max(0, Math.ceil(anchorPhysY - (visibleH - 24))), keyboardH);
      if (autoShift > 0) {
        this._kbOffset = autoShift;
        root.style.transition = 'none';
        root.style.transform = `translateY(-${this._kbOffset}px)`;
        this._syncInputPositions();
      }
    }
  }

  _togglePasswordVisible() {
    this.passwordVisible = !this.passwordVisible;
    this.sound.play("ui_click", { volume: 0.6 });
    if (this._pwEl) this._pwEl.type = this.passwordVisible ? "text" : "password";
    this.eyeIcon?.setFrame(this.passwordVisible ? "opened_eye" : "closed_eye");
  }

  _toggleAgree() {
    this.agreeChecked = !this.agreeChecked;
    this.sound.play("ui_click", { volume: 0.6 });
    if (this.agreeChecked) this.agreeHintText?.setVisible(false);
    this.applyLayout();
  }

  _toggleRememberMe() {
    this.rememberMe = !this.rememberMe;
    this.sound.play("ui_click", { volume: 0.6 });
    if (!this.rememberMe) {
      try { localStorage.removeItem("auth_remember_me"); } catch {}
    }
    this.applyLayout();
  }

  _showUnderConstruction() {
    this.store.applyPacket({ type: "error", data: { code: "FEATURE_UNDER_CONSTRUCTION", message: "正在施工中" } });
  }

  // 初始化 GSI（供 _triggerGoogleLogin 的 One Tap 使用）。script 為 async defer，
  // 可能尚未載好 → 輪詢約 10 秒。失敗不影響其他登入方式。
  _initGoogleSignIn() {
    this._googleReady = false;
    this._googleInitTries = 0;
    const tryInit = () => {
      const gid = window.google?.accounts?.id;
      if (!gid) {
        if (++this._googleInitTries > 40) return;
        this._googleInitTimer = setTimeout(tryInit, 250);
        return;
      }
      try {
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              this.app.sendPacket("google_login", { credential: response.credential });
            }
          },
        });
        this._googleReady = true;
      } catch (_) {
        // 初始化失敗 → _triggerGoogleLogin 會退回提示。
      }
    };
    tryInit();
  }

  _triggerGoogleLogin() {
    const gid = window.google?.accounts?.id;
    if (this._googleReady && gid) {
      try {
        gid.prompt();
        return;
      } catch (_) {}
    }
    // GSI 還沒就緒（剛載入 / 載不到）→ 退回原本的提示。
    this._showThirdParty("Google");
  }

  _showThirdParty(name) {
    this.store.applyPacket({ type: "error", data: { code: "THIRD_PARTY_NOT_IMPLEMENTED", message: `${name} 串接中，尚未實作` } });
  }

  // LINE 導回頁與本頁同源，透過 postMessage 送回 authorization code。此監聽於 create 綁定、shutdown 移除。
  _initLineLogin() {
    this._lineMsgBound = (event) => this._handleLineOAuthMessage(event);
    window.addEventListener("message", this._lineMsgBound);
  }

  _lineRedirectUri() {
    return `${location.origin}/oauth/line-callback.html`;
  }

  _randomHex(byteLength) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // 點 LINE 鈕：產生 state/nonce（防 CSRF、綁定 id_token）存 sessionStorage，開 LINE 授權 popup。
  _triggerLineLogin() {
    let state;
    let nonce;
    try {
      state = this._randomHex(16);
      nonce = this._randomHex(16);
    } catch (_) {
      // crypto 不可用（極少數環境）→ 退回原本的「串接中」提示。
      this._showThirdParty("LINE");
      return;
    }
    sessionStorage.setItem("line:oauth_state", state);
    sessionStorage.setItem("line:nonce", nonce);

    const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", LINE_CHANNEL_ID);
    authUrl.searchParams.set("redirect_uri", this._lineRedirectUri());
    authUrl.searchParams.set("scope", LINE_LOGIN_SCOPE);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);

    window.open(authUrl.toString(), "line_oauth", "popup,width=540,height=720");
  }

  // 收到導回頁的 postMessage：驗證來源同源 + state 一致 → 送 line_login。
  _handleLineOAuthMessage(event) {
    if (event.origin !== location.origin) return;
    const data = event.data || {};
    if (data.source !== "game-oauth-callback" || data.provider !== "line") return;

    const expectedState = sessionStorage.getItem("line:oauth_state");
    sessionStorage.removeItem("line:oauth_state");
    if (!data.state || data.state !== expectedState) {
      this.store.applyPacket({ type: "error", data: { code: "LINE_OAUTH_STATE_MISMATCH", message: "LINE 登入驗證失敗，請重試" } });
      return;
    }
    if (data.error) {
      this.store.applyPacket({ type: "error", data: { code: "LINE_OAUTH_ERROR", message: `LINE 登入失敗：${data.error}` } });
      return;
    }
    const code = String(data.code || "").trim();
    if (!code) {
      this.store.applyPacket({ type: "error", data: { code: "LINE_OAUTH_NO_CODE", message: "LINE 登入未取得授權碼" } });
      return;
    }

    const nonce = sessionStorage.getItem("line:nonce") || "";
    sessionStorage.removeItem("line:nonce");
    this.app.sendPacket("line_login", {
      code,
      redirect_uri: this._lineRedirectUri(),
      nonce,
    });
  }

  // Instagram 導回頁與本頁同源，透過 postMessage 送回 authorization code。監聽於 create 綁定、shutdown 移除。
  _initInstagramLogin() {
    this._igMsgBound = (event) => this._handleInstagramOAuthMessage(event);
    window.addEventListener("message", this._igMsgBound);
  }

  _instagramRedirectUri() {
    return `${location.origin}/oauth/instagram-callback.html`;
  }

  // 點 Instagram 鈕：App ID 未設定 → 退回「串接中」占位；否則產生 state（Instagram 無 nonce）開授權 popup。
  _triggerInstagramLogin() {
    if (!INSTAGRAM_APP_ID) {
      this._showThirdParty("Instagram");
      return;
    }
    let state;
    try {
      state = this._randomHex(16);
    } catch (_) {
      this._showThirdParty("Instagram");
      return;
    }
    sessionStorage.setItem("instagram:oauth_state", state);

    const authUrl = new URL("https://api.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
    authUrl.searchParams.set("redirect_uri", this._instagramRedirectUri());
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", INSTAGRAM_LOGIN_SCOPE);
    authUrl.searchParams.set("state", state);

    window.open(authUrl.toString(), "instagram_oauth", "popup,width=540,height=720");
  }

  // 收到導回頁的 postMessage：驗證來源同源 + state 一致 → 送 instagram_login（Instagram 無 nonce）。
  _handleInstagramOAuthMessage(event) {
    if (event.origin !== location.origin) return;
    const data = event.data || {};
    if (data.source !== "game-oauth-callback" || data.provider !== "instagram") return;

    const expectedState = sessionStorage.getItem("instagram:oauth_state");
    sessionStorage.removeItem("instagram:oauth_state");
    if (!data.state || data.state !== expectedState) {
      this.store.applyPacket({ type: "error", data: { code: "INSTAGRAM_OAUTH_STATE_MISMATCH", message: "Instagram 登入驗證失敗，請重試" } });
      return;
    }
    if (data.error) {
      this.store.applyPacket({ type: "error", data: { code: "INSTAGRAM_OAUTH_ERROR", message: `Instagram 登入失敗：${data.error}` } });
      return;
    }
    const code = String(data.code || "").trim();
    if (!code) {
      this.store.applyPacket({ type: "error", data: { code: "INSTAGRAM_OAUTH_NO_CODE", message: "Instagram 登入未取得授權碼" } });
      return;
    }

    this.app.sendPacket("instagram_login", {
      code,
      redirect_uri: this._instagramRedirectUri(),
    });
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

  submitLogin() {
    if (!this.agreeChecked) { this.agreeHintText?.setVisible(true); return; }
    const raw = this.usernameValue.trim();
    const password = this.passwordValue;
    if (!raw) return;
    const mode = this._detectInputMode(raw);
    if (mode === "phone") {
      if (!/^\d{7,14}$/.test(raw)) {
        this.emailHintText?.setText("* 請輸入正確電話號碼").setVisible(true);
        return;
      }
      try {
        if (this.rememberMe) localStorage.setItem("auth_remember_me", JSON.stringify({ username: raw, password, phoneCode: this._phoneCode }));
        else localStorage.removeItem("auth_remember_me");
      } catch {}
      const username = this._phoneCode === "+886" ? raw : this._phoneCode + raw;
      this.app.sendPacket("login", { username, password });
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        this.emailHintText?.setText("* 請輸入正確信箱格式").setVisible(true);
        return;
      }
      try {
        if (this.rememberMe) localStorage.setItem("auth_remember_me", JSON.stringify({ username: raw, password, phoneCode: this._phoneCode }));
        else localStorage.removeItem("auth_remember_me");
      } catch {}
      this.app.sendPacket("login", { username: raw, password });
    }
  }

  showThirdPartyNotImplemented(name) {
    this._showThirdParty(name);
  }

  _buildTermModal() {
    const D = 12000;
    const PW = 560, PH = 740, CR = 16;

    this._tmOverlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width * 4, layout.height * 4, 0x000000, 0.72)
      .setDepth(D).setVisible(false);
    this._tmOverlay.setInteractive();
    this._tmOverlay.on("pointerdown", () => {});
    this._tmOverlay.on("pointerup", () => {});

    this._tmBorder = this.add.graphics().setDepth(D + 0.5).setVisible(false);

    this._tmMaskGfx = this.make.graphics({ add: false });
    this._tmPanel = this.add.graphics().setDepth(D + 1).setVisible(false);
    this._tmPanel.setMask(this._tmMaskGfx.createGeometryMask());

    this._tmTitleLabel = this.add.image(0, 0, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(320, 112).setDepth(D + 1.5).setVisible(false);

    this._tmTitle = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);
    applyGoldTitleGradient(this._tmTitle);

    this._tmContentMaskGfx = this.make.graphics({ add: false });
    this._tmContent = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "22px", color: "#e8d5b0",
      wordWrap: { width: PW - 76, useAdvancedWrap: true },
      lineSpacing: 8,
    }).setOrigin(0, 0).setDepth(D + 2).setVisible(false);
    this._tmContent.setMask(this._tmContentMaskGfx.createGeometryMask());

    this._tmScrollGfx = this.add.graphics().setDepth(D + 2.5).setVisible(false);
    this._tmScrollZone = this.add.zone(0, 0, 24, 100).setDepth(D + 3).setVisible(false);
    this._tmScrollZone.setInteractive({ useHandCursor: true });
    this._tmScrollY = 0;
    this._tmVisibleH = 0;
    this._tmTotalH = 0;
    this._tmScrollTrackTop = 0;
    this._isDraggingTmScroll = false;

    this._tmScrollZone.on("pointerdown", () => { this._isDraggingTmScroll = true; });
    this._tmScrollZone.on("pointermove", (p) => {
      if (!this._isDraggingTmScroll) return;
      this._scrollTermByPointer(p.worldY);
    });
    this._tmScrollZone.on("pointerup", () => { this._isDraggingTmScroll = false; });
    this._tmScrollZone.on("pointerout", () => { this._isDraggingTmScroll = false; });

    this._tmDragZone = this.add.zone(0, 0, PW - 30, 100).setDepth(D + 2.4).setVisible(false);
    this._tmDragZone.setInteractive({ useHandCursor: false });
    this._tmDragStartY = 0;
    this._tmDragScrollStart = 0;
    this._tmDragZone.on("pointerdown", (p) => {
      this._tmDragStartY = p.worldY;
      this._tmDragScrollStart = this._tmScrollY;
    });
    this._tmDragZone.on("pointermove", (p) => {
      if (!p.isDown) return;
      this._updateTermScroll(this._tmDragScrollStart + (this._tmDragStartY - p.worldY));
    });

    this._tmWheelBound = (e) => {
      if (!this._tmOverlay?.visible) return;
      this._updateTermScroll(this._tmScrollY + e.deltaY * 0.6);
    };

    this._tmCloseBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0xf09218, bottomColor: 0x7a3200, borderColor: 0xffaa20,
      label: "確定",
      labelStyle: { fontSize: "28px", color: "#ffffff", shadow: { offsetX: 0, offsetY: 2, color: "#7a3800", blur: 4, fill: true } },
      depth: D + 2, onClick: () => this._hideTermModal(), visible: false,
    });

    this._tmPW = PW; this._tmPH = PH; this._tmCR = CR;
  }

  _showTermModal(type) {
    const isUser = type === "user";
    const title = isUser ? "用戶協議" : "隱私協議";
    const content = isUser
      ? [
          "一、服務說明",
          "本平台為純娛樂性德州撲克遊戲，不涉及任何真實貨幣交易或賭博行為。",
          "",
          "二、使用資格",
          "用戶須年滿18歲方可註冊使用本平台。未成年人請勿使用。",
          "",
          "三、帳號安全",
          "用戶對其帳號及密碼的安全負有完全責任，不得將帳號轉讓或分享給他人。",
          "",
          "四、行為規範",
          "禁止使用外掛程式、機器人或任何不正當手段干擾遊戲正常運作。禁止散布侮辱、攻擊性或不當言論。",
          "",
          "五、虛擬資產",
          "平台內虛擬籌碼僅供遊戲使用，不可兌換為真實貨幣或任何有價資產。",
          "",
          "六、服務變更",
          "平台保留隨時修改、暫停或終止服務的權利。本協議內容可能不定期更新，繼續使用即視為同意最新條款。",
          "",
          "七、免責聲明",
          "因不可抗力因素導致的服務中斷，平台不承擔相關責任。",
        ].join("\n")
      : [
          "一、資料收集",
          "我們收集您的電子郵件地址及暱稱以建立並管理您的遊戲帳戶。",
          "",
          "二、資料使用",
          "您的個人資料僅用於提供遊戲服務、帳號驗證及客戶支援，不作其他商業用途。",
          "",
          "三、資料保護",
          "所有帳戶資料均採加密方式儲存，我們採取合理的技術措施保護您的個人資訊安全。",
          "",
          "四、資料分享",
          "我們不會將您的個人資料出售、出租或以其他方式提供給任何第三方，法律要求除外。",
          "",
          "五、Cookie 使用",
          "本平台可能使用 Cookie 技術以改善使用者體驗及分析服務使用狀況。",
          "",
          "六、資料刪除",
          "您可隨時聯繫客服申請刪除帳戶及所有相關個人資料。",
          "",
          "七、政策更新",
          "本隱私協議可能因應法規或服務變動而更新，更新後將於平台公告通知。",
        ].join("\n");

    this._tmTitle.setText(title);
    applyGoldTitleGradient(this._tmTitle);
    this._tmContent.setText(content);

    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._tmPW, PH = this._tmPH, CR = this._tmCR;
    const l = cx - PW / 2, t = cy - PH / 2;
    const contentTop = t + 98;
    const visibleH = PH - 225;

    this._tmScrollY = 0;
    this._tmVisibleH = visibleH;
    this._tmTotalH = this._tmContent.height;
    this._tmScrollTrackTop = contentTop;

    this._tmOverlay.setPosition(cx, cy).setSize(layout.width * 4, layout.height * 4).setVisible(true);

    this._tmBorder.clear();
    drawEnhancedBorder(this._tmBorder, l, t, PW, PH, CR);
    this._tmBorder.setVisible(true);

    this._tmMaskGfx.clear();
    this._tmMaskGfx.fillStyle(0xffffff);
    this._tmMaskGfx.fillRoundedRect(l, t, PW, PH, CR);

    this._tmPanel.clear();
    this._tmPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this._tmPanel.fillRect(l, t, PW, PH);
    this._tmPanel.setVisible(true);

    this._tmTitleLabel.setPosition(cx, t).setVisible(true);
    this._tmTitle.setPosition(cx, t + 8).setVisible(true);

    this._tmContentMaskGfx.clear();
    this._tmContentMaskGfx.fillStyle(0xffffff);
    this._tmContentMaskGfx.fillRect(l + 8, contentTop, PW - 42, visibleH);
    this._tmContent.setPosition(l + 32, contentTop).setVisible(true);

    this._tmScrollGfx.setVisible(true);
    this._tmScrollZone.setVisible(true);
    this._tmDragZone.setPosition(cx, contentTop + visibleH / 2).setSize(PW - 30, visibleH).setVisible(true);
    this._updateTermScroll(0);

    this._tmCloseBtn.setPosition?.(cx, t + PH - 54);
    this._tmCloseBtn.setVisible(true);

    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.setProperty("display", "none", "important"));
    this._syncInputPositions();
    window.addEventListener("wheel", this._tmWheelBound, { passive: false });
  }

  _scrollTermByPointer(worldY) {
    const maxScroll = Math.max(0, this._tmTotalH - this._tmVisibleH);
    if (maxScroll <= 0) return;
    const thumbH = Math.max(40, Math.floor(this._tmVisibleH * this._tmVisibleH / this._tmTotalH));
    const trackRange = this._tmVisibleH - thumbH;
    if (trackRange <= 0) return;
    const ratio = Phaser.Math.Clamp((worldY - this._tmScrollTrackTop - thumbH / 2) / trackRange, 0, 1);
    this._updateTermScroll(ratio * maxScroll);
  }

  _updateTermScroll(rawY) {
    const maxScroll = Math.max(0, this._tmTotalH - this._tmVisibleH);
    this._tmScrollY = Phaser.Math.Clamp(rawY, 0, maxScroll);

    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._tmPW, PH = this._tmPH;
    const l = cx - PW / 2, t = cy - PH / 2;
    const contentTop = t + 98;

    this._tmContent.setY(contentTop - this._tmScrollY);

    this._tmScrollGfx.clear();
    if (this._tmTotalH <= this._tmVisibleH) return;

    const scrollX = l + PW - 22;
    const trackH = this._tmVisibleH;
    const thumbH = Math.max(40, Math.floor(trackH * this._tmVisibleH / this._tmTotalH));
    const thumbY = contentTop + (maxScroll > 0 ? (this._tmScrollY / maxScroll) * (trackH - thumbH) : 0);

    this._tmScrollGfx.fillStyle(0x1a0800, 0.85);
    this._tmScrollGfx.fillRoundedRect(scrollX, contentTop, 10, trackH, 5);
    this._tmScrollGfx.lineStyle(1, 0xb8860b, 0.5);
    this._tmScrollGfx.strokeRoundedRect(scrollX, contentTop, 10, trackH, 5);
    this._tmScrollGfx.fillStyle(0xd4a520, 1);
    this._tmScrollGfx.fillRoundedRect(scrollX, thumbY, 10, thumbH, 5);
    this._tmScrollZone.setPosition(scrollX + 5, contentTop + trackH / 2).setSize(24, trackH);
  }

  _hideTermModal() {
    window.removeEventListener("wheel", this._tmWheelBound);
    this._isDraggingTmScroll = false;
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input, .fp-input").forEach(el => el.style.removeProperty("display"));
    }
    this._tmOverlay?.setVisible(false).disableInteractive();
    this._tmBorder?.setVisible(false);
    this._tmPanel?.setVisible(false);
    this._tmTitleLabel?.setVisible(false);
    this._tmTitle?.setVisible(false);
    this._tmContent?.setVisible(false);
    this._tmScrollGfx?.setVisible(false);
    this._tmScrollZone?.setVisible(false);
    this._tmDragZone?.setVisible(false);
    this._tmCloseBtn?.setVisible(false);
    this._tmOverlay?.setInteractive();
    this._syncInputPositions();
  }

  _buildForgotModal() {
    const D = 11000;
    const PW = 520, PH = 460, CR = 16;

    this._fpOverlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width * 4, layout.height * 4, 0x000000, 0.72)
      .setDepth(D).setVisible(false);
    this._fpOverlay.setInteractive();
    this._fpOverlay.on("pointerdown", () => {});
    this._fpOverlay.on("pointerup", () => {});

    this._fpBorder = this.add.graphics().setDepth(D + 0.5).setVisible(false);

    this._fpMaskGfx = this.make.graphics({ add: false });
    this._fpPanel = this.add.graphics().setDepth(D + 1).setVisible(false);
    this._fpPanel.setMask(this._fpMaskGfx.createGeometryMask());
    this._fpPanel.on("pointerdown", () => {});
    this._fpPanel.on("pointerup", () => {});

    this._fpTitleLabel = this.add.image(0, 0, "game_table", "title_label")
      .setOrigin(0.5).setDisplaySize(320, 112).setDepth(D + 1.5).setVisible(false);

    this._fpTitle = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "34px", fontStyle: "bold", color: "#f0c040",
      stroke: "#000000", strokeThickness: 1,
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

    this._fpDescText = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "22px", color: "#e8d5b0", align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

    // Step 1 — email/phone
    this._fpBox1Gfx = this.add.graphics().setDepth(D + 2).setVisible(false);
    this._fpMailIcon = this.add.image(0, 0, "login", "user").setDisplaySize(50, 55).setDepth(D + 2).setVisible(false);

    // Step 2 — verification code
    this._fpBox2Gfx = this.add.graphics().setDepth(D + 2).setVisible(false);
    this._fpCodeIcon = this.add.image(0, 0, "login", "lock").setDisplaySize(40, 52).setDepth(D + 2).setVisible(false);

    // Step 3 — new password + confirm
    this._fpBox3Gfx = this.add.graphics().setDepth(D + 2).setVisible(false);
    this._fpBox4Gfx = this.add.graphics().setDepth(D + 2).setVisible(false);
    this._fpLock1Icon = this.add.image(0, 0, "login", "lock").setDisplaySize(40, 52).setDepth(D + 2).setVisible(false);
    this._fpLock2Icon = this.add.image(0, 0, "login", "lock").setDisplaySize(40, 52).setDepth(D + 2).setVisible(false);

    const btnLabelStyle = { fontSize: "28px", color: "#ffffff", shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 4, fill: true } };
    this._fpPrimaryBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
      label: "發送", labelStyle: btnLabelStyle,
      depth: D + 2, onClick: () => this._fpOnPrimary(), visible: false,
    });

    this._fpCancelBtn = createGradientButton(this, {
      x: 0, y: 0, width: 210, height: 62, cornerRadius: 10,
      topColor: 0xc02828, bottomColor: 0x6a1010, borderColor: 0xd43535,
      label: "取消", labelStyle: btnLabelStyle,
      depth: D + 2, onClick: () => this._hideForgotModal(), visible: false,
    });

    this._fpErrText = this.add.text(0, 0, "", {
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "22px", color: "#f04040", align: "center",
    }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

    this._fpPW = PW; this._fpPH = PH; this._fpCR = CR;
    this._fpStep = 1;
    this._fpStoredEmail = "";
    this._fpStoredCode = "";
    this._fpPhoneMode = false;
    this._fpPhoneCode = "+886";
    this._fpPhoneCodeEl = null;
  }

  _showForgotModal() {
    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._fpPW, PH = this._fpPH, CR = this._fpCR;
    const l = cx - PW / 2, t = cy - PH / 2;

    this._fpOverlay.setPosition(cx, cy).setSize(layout.width * 4, layout.height * 4).setVisible(true);

    this._fpBorder.clear();
    drawEnhancedBorder(this._fpBorder, l, t, PW, PH, CR);
    this._fpBorder.setVisible(true);

    this._fpMaskGfx.clear();
    this._fpMaskGfx.fillStyle(0xffffff);
    this._fpMaskGfx.fillRoundedRect(l, t, PW, PH, CR);

    this._fpPanel.clear();
    this._fpPanel.fillGradientStyle(0x680c15, 0x680c15, 0x170202, 0x170202, 0.98, 0.98, 0.98, 0.98);
    this._fpPanel.fillRect(l, t, PW, PH);
    this._fpPanel.setInteractive(new Phaser.Geom.Rectangle(l, t, PW, PH), Phaser.Geom.Rectangle.Contains);
    this._fpPanel.setVisible(true);

    this._fpTitleLabel.setPosition(cx, t).setVisible(true);
    this._fpTitle.setPosition(cx, t + 8).setVisible(true);
    this._fpDescText.setPosition(cx, t + 130).setVisible(true);

    document.body.dataset.modalDepth = (parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
    document.querySelectorAll(".lrn-input").forEach(el => el.style.setProperty("display", "none", "important"));
    this._syncInputPositions();
    this._fpShowStep(1);
    // If keyboard was already open before the modal appeared, reclamp shift immediately
    if (this._kbOffset > 0) this._adjustForKeyboard(true);
  }

  _fpShowStep(step) {
    this._fpStep = step;
    this._fpErrText?.setVisible(false);
    const cx = layout.centerX, cy = layout.centerY;
    const PW = this._fpPW, PH = this._fpPH;
    const t = cy - PH / 2;
    const btnY = t + PH - 54;

    // Hide all step-specific elements
    [this._fpBox1Gfx, this._fpMailIcon, this._fpBox2Gfx, this._fpCodeIcon,
     this._fpBox3Gfx, this._fpBox4Gfx, this._fpLock1Icon, this._fpLock2Icon]
      .forEach(o => o?.setVisible(false));

    // Remove all step HTML inputs
    ["fp-email", "fp-phone-code", "fp-code", "fp-newpw", "fp-confirmpw"].forEach(id => document.getElementById(id)?.remove());
    this._fpEl = null; this._fpCodeEl = null; this._fpNewPwEl = null; this._fpConfirmPwEl = null;
    this._fpPhoneCodeEl = null; this._fpPhoneMode = false;

    if (step === 1) {
      this._fpTitle.setText("忘記密碼");
      applyGoldTitleGradient(this._fpTitle);
      this._fpDescText.setText("請輸入您的註冊信箱或電話號碼\n我們將發送驗證碼");
      this._fpPrimaryBtn.setLabel?.("發送");

      const boxY = cy + 20;
      this._drawFpBoxOn(this._fpBox1Gfx, cx, boxY);
      this._fpBox1Gfx.setVisible(true);
      this._fpMailIcon.setPosition(cx - 190, boxY).setVisible(true);

      this._fpPhoneMode = false;
      this._fpEl = this._makeFpHtmlInput("fp-email", "text", "請輸入信箱或電話號碼", "username");
      this._fpEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this._fpOnPrimary(); } });
      this._fpEl.addEventListener("input", () => {
        const isPhone = /^\d/.test(this._fpEl.value.trim()) && this._fpEl.value.trim().length > 0;
        if (isPhone !== this._fpPhoneMode) { this._fpPhoneMode = isPhone; this._fpSyncStep1Input(); }
      });
      this._fpSyncStep1Input();

    } else if (step === 2) {
      this._fpTitle.setText("忘記密碼");
      applyGoldTitleGradient(this._fpTitle);
      this._fpDescText.setText("驗證碼已發送\n請輸入6位數驗證碼");
      this._fpPrimaryBtn.setLabel?.("驗證");

      const boxY = cy + 20;
      this._drawFpBoxOn(this._fpBox2Gfx, cx, boxY);
      this._fpBox2Gfx.setVisible(true);
      this._fpCodeIcon.setPosition(cx - 190, boxY).setVisible(true);

      this._fpCodeEl = this._makeFpHtmlInput("fp-code", "text", "輸入6位數驗證碼", "one-time-code");
      this._fpCodeEl.maxLength = 6;
      this._fpCodeEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this._fpOnPrimary(); } });
      this._posInBox(this._fpCodeEl, cx, boxY);

    } else if (step === 3) {
      this._fpTitle.setText("更換密碼");
      applyGoldTitleGradient(this._fpTitle);
      this._fpDescText.setText("請設定您的新密碼");
      this._fpDescText.setPosition(cx, cy - 135);
      this._fpPrimaryBtn.setLabel?.("確定");

      const box1Y = cy - 70, box2Y = cy + 40;
      this._drawFpBoxOn(this._fpBox3Gfx, cx, box1Y);
      this._fpBox3Gfx.setVisible(true);
      this._fpLock1Icon.setPosition(cx - 190, box1Y).setVisible(true);

      this._drawFpBoxOn(this._fpBox4Gfx, cx, box2Y);
      this._fpBox4Gfx.setVisible(true);
      this._fpLock2Icon.setPosition(cx - 190, box2Y).setVisible(true);

      this._fpNewPwEl = this._makeFpHtmlInput("fp-newpw", "password", "輸入新密碼", "new-password");
      this._fpNewPwEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this._fpConfirmPwEl?.focus(); } });
      this._posInBox(this._fpNewPwEl, cx, box1Y);

      this._fpConfirmPwEl = this._makeFpHtmlInput("fp-confirmpw", "password", "確認新密碼", "new-password");
      this._fpConfirmPwEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this._fpOnPrimary(); } });
      this._posInBox(this._fpConfirmPwEl, cx, box2Y);
    }

    this._fpPrimaryBtn.setPosition?.(cx - 120, btnY);
    this._fpPrimaryBtn.setVisible(true);
    this._fpCancelBtn.setPosition?.(cx + 120, btnY);
    this._fpCancelBtn.setVisible(true);
  }

  _fpOnPrimary() {
    this._fpErrText?.setVisible(false);
    if (this._fpStep === 1) {
      const raw = this._fpEl?.value?.trim() ?? "";
      if (!raw) return;
      this._fpStoredEmail = this._fpPhoneMode ? (this._fpPhoneCode + raw) : raw;
      const s = this.store?.getState?.() ?? {};
      this._lastSeenFpEventVersion = Number(s.fpEventVersion ?? 0);
      this._lastSeenAuthErrorVersion = Number(s.errorVersion ?? 0);
      this.app.sendPacket("forgot_password", { username: this._fpStoredEmail });
    } else if (this._fpStep === 2) {
      const code = this._fpCodeEl?.value?.trim() ?? "";
      if (!code) return;
      this._fpStoredCode = code;
      const s = this.store?.getState?.() ?? {};
      this._lastSeenFpEventVersion = Number(s.fpEventVersion ?? 0);
      this._lastSeenAuthErrorVersion = Number(s.errorVersion ?? 0);
      this.app.sendPacket("verify_reset_code", { username: this._fpStoredEmail, code });
    } else if (this._fpStep === 3) {
      const newPw = this._fpNewPwEl?.value ?? "";
      const confirmPw = this._fpConfirmPwEl?.value ?? "";
      if (!newPw || newPw !== confirmPw) return;
      const s = this.store?.getState?.() ?? {};
      this._lastSeenFpEventVersion = Number(s.fpEventVersion ?? 0);
      this._lastSeenAuthErrorVersion = Number(s.errorVersion ?? 0);
      this.app.sendPacket("reset_password", { username: this._fpStoredEmail, code: this._fpStoredCode, new_password: newPw });
    }
  }

  _drawFpBoxOn(gfx, cx, cy) {
    const W = 460, H = 80, CR = 14;
    const l = cx - W / 2, t = cy - H / 2;
    gfx.clear();
    gfx.lineStyle(14, 0xb87010, 0.14); gfx.strokeRoundedRect(l, t, W, H, CR);
    gfx.lineStyle(7, 0xd4890f, 0.18);  gfx.strokeRoundedRect(l, t, W, H, CR);
    gfx.fillStyle(0x3a1800, 0.88);     gfx.fillRoundedRect(l, t, W, H, CR);
    gfx.lineStyle(2.5, 0xd4a520, 1);   gfx.strokeRoundedRect(l, t, W, H, CR);
    gfx.lineStyle(1, 0xffe878, 0.55);  gfx.strokeRoundedRect(l, t, W, H, CR);
  }

  _makeFpHtmlInput(id, type, placeholder, autocomplete) {
    document.getElementById(id)?.remove();
    const el = document.createElement("input");
    el.id = id; el.type = type; el.placeholder = placeholder; el.autocomplete = autocomplete;
    el.className = "fp-input";
    Object.assign(el.style, {
      position: "fixed", background: "transparent", backgroundColor: "transparent",
      border: "none", outline: "none", boxShadow: "none", WebkitBoxShadow: "none",
      colorScheme: "dark", color: INPUT_TEXT_COLOR, WebkitTextFillColor: INPUT_TEXT_COLOR,
      caretColor: INPUT_TEXT_COLOR, fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
      fontSize: "26px", fontWeight: "bold", zIndex: "200", padding: "0 8px", boxSizing: "border-box",
    });
    document.body.appendChild(el);
    return el;
  }

  _makeFpPhoneCodeEl() {
    document.getElementById("fp-phone-code")?.remove();
    const sel = document.createElement("select");
    sel.id = "fp-phone-code";
    sel.className = "phone-code-sel";
    PHONE_CODES.forEach(({ value }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      sel.appendChild(opt);
    });
    sel.value = this._fpPhoneCode || "+886";
    const showLabels = () => PHONE_CODES.forEach(({ label }, i) => { sel.options[i].textContent = label; });
    const showCodes  = () => PHONE_CODES.forEach(({ value }, i) => { sel.options[i].textContent = value; });
    sel.addEventListener("mousedown",  showLabels);
    sel.addEventListener("touchstart", showLabels, { passive: true });
    sel.addEventListener("focus",      showLabels);
    sel.addEventListener("blur",       showCodes);
    sel.addEventListener("change", () => { this._fpPhoneCode = sel.value; showCodes(); });
    Object.assign(sel.style, {
      position: "fixed", display: "none", zIndex: "200",
      boxSizing: "border-box", padding: "0 4px",
      fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif', colorScheme: "dark",
      fontSize: "20px",
    });
    document.body.appendChild(sel);
    return sel;
  }

  _fpSyncStep1Input() {
    if (!this._fpEl) return;
    const cx = layout.centerX, cy = layout.centerY;
    const boxY = cy + 20;
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top;
    const fs = Math.max(13, Math.round(21 * scale)) + "px";
    if (this._fpPhoneMode) {
      if (!this._fpPhoneCodeEl) this._fpPhoneCodeEl = this._makeFpPhoneCodeEl();
      this._posEl(this._fpPhoneCodeEl, cx - 150, boxY - 29, 112, 58, scale, ox, oy);
      this._fpPhoneCodeEl.style.fontSize = fs;
      this._fpPhoneCodeEl.style.removeProperty("display");
      this._posEl(this._fpEl, cx - 33, boxY - 29, 232, 58, scale, ox, oy);
    } else {
      if (this._fpPhoneCodeEl) this._fpPhoneCodeEl.style.setProperty("display", "none", "important");
      this._posEl(this._fpEl, cx - 155, boxY - 29, 360, 58, scale, ox, oy);
    }
    this._fpEl.style.fontSize = fs;
  }

  _posInBox(el, cx, boxY) {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const ox = rect.left + (rect.width - layout.width * scale) / 2;
    const oy = rect.top;
    this._posEl(el, cx - 155, boxY - 29, 360, 58, scale, ox, oy);
    el.style.fontSize = Math.max(13, Math.round(21 * scale)) + "px";
  }

  _hideForgotModal() {
    ["fp-email", "fp-phone-code", "fp-code", "fp-newpw", "fp-confirmpw"].forEach(id => document.getElementById(id)?.remove());
    this._fpEl = null; this._fpCodeEl = null; this._fpNewPwEl = null; this._fpConfirmPwEl = null;
    this._fpPhoneCodeEl = null; this._fpPhoneMode = false;
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".lrn-input").forEach(el => el.style.removeProperty("display"));
    }
    [this._fpOverlay, this._fpBorder, this._fpPanel, this._fpTitleLabel, this._fpTitle, this._fpDescText,
     this._fpBox1Gfx, this._fpMailIcon, this._fpBox2Gfx, this._fpCodeIcon,
     this._fpBox3Gfx, this._fpBox4Gfx, this._fpLock1Icon, this._fpLock2Icon,
     this._fpPrimaryBtn, this._fpCancelBtn, this._fpErrText]
      .forEach(o => o?.setVisible(false));
    this._syncInputPositions();
  }

  _destroyScene() {
    if (this._tmOverlay?.visible) this._hideTermModal();
    if (this._fpOverlay?.visible) this._hideForgotModal();
    if (this._googleInitTimer) { clearTimeout(this._googleInitTimer); this._googleInitTimer = null; }
    if (this._lineMsgBound) { window.removeEventListener("message", this._lineMsgBound); this._lineMsgBound = null; }
    if (this._igMsgBound) { window.removeEventListener("message", this._igMsgBound); this._igMsgBound = null; }
    clearTimeout(this._kbTimer);
    if (this._kbOverlay) { this._kbOverlay.remove(); this._kbOverlay = null; }
    const root = document.getElementById('phaser-root');
    if (root) { root.style.transition = ''; root.style.transform = ''; }
    clearTimeout(this._emailCheckTimer); this._emailCheckTimer = null;
    this._storeUnsub?.(); this._storeUnsub = null;
    this._emailEl?.remove(); this._emailEl = null;
    this._pwEl?.remove(); this._pwEl = null;
    this._phoneCodeEl?.remove(); this._phoneCodeEl = null;
    this._eyeHitEl?.remove(); this._eyeHitEl = null;
    this._forgotHitEl?.remove(); this._forgotHitEl = null;
    ["fp-email", "fp-phone-code", "fp-code", "fp-newpw", "fp-confirmpw"].forEach(id => document.getElementById(id)?.remove());
    this._fpEl = null; this._fpCodeEl = null; this._fpNewPwEl = null; this._fpConfirmPwEl = null;
    this._fpPhoneCodeEl = null;
    this._styleEl?.remove(); this._styleEl = null;
    if (this._syncBound) {
      window.removeEventListener("resize", this._syncBound);
      window.visualViewport?.removeEventListener("resize", this._syncBound);
      this._syncBound = null;
    }
    if (this._preventScrollBound) {
      window.removeEventListener("scroll", this._preventScrollBound);
      this._preventScrollBound = null;
    }
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
