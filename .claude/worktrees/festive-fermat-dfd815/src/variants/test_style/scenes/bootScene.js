export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const assetBase = window.__APP__?.assetBase || "assets/variants/test_style";
    const imageBase = `${assetBase}/images`;
    const audioBase = `${assetBase}/audio`;

    // 先給一層底色，等待背景圖載入完成後再切換成背景圖
    this.add.rectangle(360, 720, 720, 1440, 0x1a2633).setOrigin(0.5).setDepth(-20);

    // 進度條底板與前景
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x000000, 0.35);
    progressBox.fillRoundedRect(126, 1032, 468, 36, 8);

    const progressBar = this.add.graphics();
    const percentText = this.add
      .text(360, 996, "載入中 0%", {
        fontFamily: '"APTUI", "Noto Sans TC", "Segoe UI", sans-serif',
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ecd5b5",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value) => {
      const pct = Math.floor(value * 100);
      percentText.setText(`載入中 ${pct}%`);
      progressBar.clear();
      progressBar.fillStyle(0xecd5b5, 1);
      progressBar.fillRoundedRect(130, 1036, Math.floor(460 * value), 28, 6);
    });

    this.load.once("complete", () => {
      progressBar.clear();
      progressBar.fillStyle(0xecd5b5, 1);
      progressBar.fillRoundedRect(130, 1036, 460, 28, 6);
      percentText.setText("載入完成 100%");
    });

    // 背景也納入同一個 loading 進度；當背景圖檔先載好就立即顯示
    this.load.image("bg", `${imageBase}/bg.webp`);
    this.load.once("filecomplete-image-bg", () => {
      this.add.image(360, 720, "bg").setDisplaySize(720, 1440).setOrigin(0.5).setDepth(-10);
    });

    // 圖片 atlas 規則固定：<variant imageBase>/<key>.webp + <key>.json
    const atlasKeys = [
      "login_register_element",
      "error_element",
      "lobby_element",
      "avatar_element",
      "game_table",
      "playing_cards_element",
    ];
    atlasKeys.forEach((key) => {
      this.load.atlas(key, `${imageBase}/${key}.webp`, `${imageBase}/${key}.json`);
    });

    // 音效都在 variant audioBase，key 與檔名不一致的用映射處理
    const audioFileByKey = {
      bgm_main: "main_bgm.mp3",
      ui_click: "system_notification.mp3",
      deal_cards: "deal_cards.mp3",
      bet_chip: "bet_chip.mp3",
      chip_fly: "chip_fly.mp3",
      allin_start: "allin_start.mp3",
      player_win: "player_win.mp3",
      player_lose: "player_lose.mp3",
    };
    Object.entries(audioFileByKey).forEach(([key, fileName]) => {
      this.load.audio(key, `${audioBase}/${fileName}`);
    });

    (window.__APP__?.voice?.VOICE_ASSET_LIST || []).forEach((item) => {
      this.load.audio(item.key, item.path);
    });
  }

  create() {
    const app = window.__APP__;
    app?.setBootSceneRef?.(this);
    app?.markBootReady?.();
    if (app?.shouldHoldBootScene?.()) {
      return;
    }
    this.scene.stop();
  }
}


