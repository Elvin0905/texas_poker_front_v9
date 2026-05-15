import { bindImageButton, createRectButton } from "../ui/button.js";
import { createKeyboardBar, createTapInputManager } from "../ui/input.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";

export class AuthScene extends Phaser.Scene {
  constructor() {
    super("auth");
    const params = new URLSearchParams(window.location.search);
    const wsParam = String(params.get("ws") || "").trim();
    const useDebugDefaultAccount = wsParam.length > 0;
    this.usernameValue = useDebugDefaultAccount ? "abc@gmail.com" : "";
    this.passwordValue = useDebugDefaultAccount ? "aaa123" : "";
    this.keyboardBar = null;
    this.inputManager = null;
    this.guestLoginButton = null;
    this.soundSettingsPanel = null;
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app.store;

    this.add.image(360, 720, "bg");
    this.add.image(360, 700, "login_register_element", "login_panel");

    this.bgm = this.sound.get("bgm_main");
    if (!this.bgm) {
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

    const playBgm = () => {
      syncBgmByState();
    };

    if (!this.sound.locked) {
      playBgm();
    } else {
      this.input.once("pointerdown", playBgm);
      this.input.keyboard?.once("keydown", playBgm);
    }

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: 120,
      buttonY: 1350,
      onSettingsChanged: () => {
        syncBgmByState();
      },
    });
    syncBgmByState();

    this.keyboardBar = createKeyboardBar({ id: "auth-keyboard-bar" });
    this.inputManager = createTapInputManager(this, { keyboardBar: this.keyboardBar });

    this.inputManager.addField({
      imageX: 355,
      imageY: 510,
      frame: "input_login_email",
      textX: 260,
      textY: 525,
      placeholder: "點擊輸入帳號",
      inputPlaceholder: "輸入帳號",
      masked: false,
      autocomplete: "username",
      maxChars: 22,
      getValue: () => this.usernameValue,
      setValue: (value) => {
        this.usernameValue = value;
      },
      imageProp: "emailImage",
      textProp: "usernameText",
    });

    this.inputManager.addField({
      imageX: 355,
      imageY: 630,
      frame: "input_password",
      textX: 260,
      textY: 648,
      placeholder: "點擊輸入密碼",
      inputPlaceholder: "輸入密碼",
      masked: true,
      autocomplete: "current-password",
      maxChars: 20,
      getValue: () => this.passwordValue,
      setValue: (value) => {
        this.passwordValue = value;
      },
      imageProp: "passwordInputImage",
      textProp: "passwordText",
    });

    this.inputManager.bindOutsideClose();
    this.inputManager.renderAll();

    this.loginButtonImage = this.add.image(410, 770, "login_register_element", "btn_login");
    bindImageButton(this, this.loginButtonImage, {
      onClick: () => {
        this.submitLogin();
      },
    });

    this.facebookLoginButtonImage = this.add.image(350, 870, "login_register_element", "btn_fb");
    bindImageButton(this, this.facebookLoginButtonImage, {
      onClick: () => {
        this.showThirdPartyNotImplemented("Facebook");
      },
    });

    this.googleLoginButtonImage = this.add.image(355, 945, "login_register_element", "btn_google");
    bindImageButton(this, this.googleLoginButtonImage, {
      onClick: () => {
        this.showThirdPartyNotImplemented("Google");
      },
    });

    this.lineLoginButtonImage = this.add.image(355, 1035, "login_register_element", "btn_line");
    bindImageButton(this, this.lineLoginButtonImage, {
      onClick: () => {
        this.showThirdPartyNotImplemented("LINE");
      },
    });

    this.registerNowButtonImage = this.add.image(420, 1200, "login_register_element", "btn_go_register");
    bindImageButton(this, this.registerNowButtonImage, {
      onClick: () => {
        this.store.setPage("register");
      },
    });

    this.guestLoginButton = createRectButton(this, {
      x: 420,
      y: 1335,
      width: 260,
      height: 64,
      label: "訪客登入(測試)",
      color: 0x24583b,
      labelStyle: {
        fontFamily: "sans-serif",
        fontSize: "24px",
        color: "#ecd5b5",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      },
      onClick: () => {
        this.app.sendPacket("guest_login", {});
      },
      visible: true,
    });

    this.events.once("shutdown", () => {
      this.inputManager?.destroy();
      this.inputManager = null;
      this.keyboardBar?.destroy();
      this.keyboardBar = null;
      this.guestLoginButton?.destroy?.();
      this.guestLoginButton = null;
      this.soundSettingsPanel?.destroy?.();
      this.soundSettingsPanel = null;
    });
  }

  submitLogin() {
    this.app.sendPacket("login", {
      username: this.usernameValue.trim(),
      password: this.passwordValue,
    });
  }

  showThirdPartyNotImplemented(providerName) {
    this.store.applyPacket({
      type: "error",
      data: {
        code: "THIRD_PARTY_NOT_IMPLEMENTED",
        message: `${providerName} 串接中,尚未實作`,
      },
    });
  }
}
