import { bindImageButton } from "../ui/button.js";
import { createKeyboardBar, createTapInputManager } from "../ui/input.js";
import { SoundSettingsPanel } from "../ui/soundSettingsPanel.js";

export class RegisterScene extends Phaser.Scene {
  constructor() {
    super("register");
    this.usernameValue = "";
    this.passwordValue = "";
    this.displayNameValue = "";
    this.keyboardBar = null;
    this.inputManager = null;
    this.soundSettingsPanel = null;
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app.store;

    this.add.image(360, 720, "bg");
    this.add.image(360, 680, "login_register_element", "register_panel");

    this.bgm = this.sound.get("bgm_main");
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

    this.soundSettingsPanel = new SoundSettingsPanel(this, {
      buttonX: 120,
      buttonY: 1350,
      onSettingsChanged: () => {
        syncBgmByState();
      },
    });
    syncBgmByState();

    this.keyboardBar = createKeyboardBar({ id: "register-keyboard-bar" });
    this.inputManager = createTapInputManager(this, { keyboardBar: this.keyboardBar });

    this.inputManager.addField({
      imageX: 355,
      imageY: 510,
      frame: "input_register_login_email",
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
      imageProp: "usernameImage",
      textProp: "usernameText",
    });

    this.inputManager.addField({
      imageX: 355,
      imageY: 620,
      frame: "input_register_display_name",
      textX: 260,
      textY: 635,
      placeholder: "點擊輸入暱稱",
      inputPlaceholder: "輸入暱稱",
      masked: false,
      autocomplete: "nickname",
      maxChars: 22,
      getValue: () => this.displayNameValue,
      setValue: (value) => {
        this.displayNameValue = value;
      },
      imageProp: "displayNameImage",
      textProp: "displayNameText",
    });

    this.inputManager.addField({
      imageX: 355,
      imageY: 730,
      frame: "input_register_password",
      textX: 260,
      textY: 745,
      placeholder: "點擊輸入密碼",
      inputPlaceholder: "輸入密碼",
      masked: false,
      autocomplete: "new-password",
      maxChars: 20,
      getValue: () => this.passwordValue,
      setValue: (value) => {
        this.passwordValue = value;
      },
      imageProp: "passwordImage",
      textProp: "passwordText",
    });

    this.inputManager.bindOutsideClose();
    this.inputManager.renderAll();

    this.submitButtonImage = this.add.image(355, 860, "login_register_element", "btn_register");
    bindImageButton(this, this.submitButtonImage, {
      onClick: () => {
        this.submitRegister();
      },
    });

    this.backToLoginButtonImage = this.add.image(360, 1130, "login_register_element", "btn_go_login");
    bindImageButton(this, this.backToLoginButtonImage, {
      onClick: () => {
        this.store.setPage("auth");
      },
    });

    this.events.once("shutdown", () => {
      this.inputManager?.destroy();
      this.inputManager = null;
      this.keyboardBar?.destroy();
      this.keyboardBar = null;
      this.soundSettingsPanel?.destroy?.();
      this.soundSettingsPanel = null;
    });
  }

  submitRegister() {
    const username = this.usernameValue.trim();
    const password = this.passwordValue;
    const displayName = this.displayNameValue.trim();

    this.app.sendPacket("register", {
      username,
      password,
      display_name: displayName || username,
    });
  }
}
