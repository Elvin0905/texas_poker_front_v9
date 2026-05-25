import { VOICE_ASSET_LIST } from "../audio/voice.js";
import { layout } from "../../../shared/core/layout.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.useResponsiveLayout = true;
    const assetBase = window.__APP__?.assetBase || "assets/variants/main_style";
    const imageBase = `${assetBase}/images`;
    const audioBase = `${assetBase}/audio`;

    const cx = layout.centerX;
    const cy = layout.centerY;

    this.add.rectangle(cx, cy, layout.width, layout.height, 0x440606).setOrigin(0.5).setDepth(-20);

    let bgShown = false;

    this.load.on("progress", (value) => {
      window.__updateLoadingPct?.(value);

      if (!bgShown && this.textures.exists("login")) {
        bgShown = true;
        window.__removePreloadBg?.();
        const frame = this.textures.getFrame("login", "bg_loading");
        const sc = Math.max(layout.width / frame.realWidth, layout.height / frame.realHeight);
        this.add.image(cx, cy, "login", "bg_loading")
          .setDisplaySize(frame.realWidth * sc, frame.realHeight * sc)
          .setOrigin(0.5)
          .setDepth(-10);
      }
    });

    this.load.once("complete", () => {
      window.__updateLoadingPct?.(1);
    });

    // Loading + login first so spinner and bg_loading appear as early as possible
    this.load.atlas("Loading", `${imageBase}/Loading.webp`, `${imageBase}/Loading.json`);
    this.load.atlas("login", `${imageBase}/login.webp`, `${imageBase}/login.json`);
    this.load.atlas("Lobby", `${imageBase}/Lobby.webp`, `${imageBase}/Lobby.json`);

    const atlasKeys = [
      "login_register_element",
      "error_element",
      "lobby_element",
      "avatar_element",
      "choose_game",
      "logo",
      "game_table",
      "playing_cards_element",
    ];
    atlasKeys.forEach((key) => {
      this.load.atlas(key, `${imageBase}/${key}.webp`, `${imageBase}/${key}.json`);
    });

    this.load.atlas("win", `${imageBase}/win.webp`, `${imageBase}/win.json`);
    this.load.image("light", `${imageBase}/light.webp`);

    // Audio
    const audioFileByKey = {
      bgm_main: "main_bgm.mp3",
      ui_click: "system_notification.mp3",
      deal_cards: "deal_cards.mp3",
      bet_chip: "bet_chip.mp3",
      chip_fly: "chip_fly.mp3",
      allin_start: "allin_start.mp3",
      player_win: "player_win.mp3",
      player_lose: "player_lose.mp3",
      win_animation: "win_animation.mp3",
      countdown_timer: "countdown_timer.mp3",
      wrong_click: "wrong_click.mp3",
    };
    Object.entries(audioFileByKey).forEach(([key, fileName]) => {
      this.load.audio(key, `${audioBase}/${fileName}`);
    });

    VOICE_ASSET_LIST.forEach((item) => {
      this.load.audio(item.key, item.path);
    });
  }

  create() {
    window.__removePreloadBg?.();
    window.__removeLoadingBar?.();
    window.__removePreloadSpinner?.();
    const app = window.__APP__;
    app?.setBootSceneRef?.(this);
    app?.markBootReady?.();
    if (app?.shouldHoldBootScene?.()) {
      return;
    }
    this.scene.stop();
  }
}
