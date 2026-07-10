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

    // game_table 拆成兩張圖集（解決 800×4287 高度超過部分手機 GPU 的 MAX_TEXTURE_SIZE=4096，
    // 例如小米 MIX 3 整張 game_table 上傳失敗變空白）。game_table2 載入後會在 create()
    // 把它的 frame 併進 game_table 紋理，因此所有 this.add.image(x,y,"game_table",...) 不需改。
    // 注意：light 原本是獨立圖（this.load.image("light")），現已併入 game_table2，
    // 因此改用 this.add.image(x, y, "game_table", "light") 取用，這裡不再單獨載入 light.webp。
    // 若檔案尚未產生（404）只會發 loaderror，不影響其它資源；合併步驟會自動跳過。
    this.load.atlas("game_table2", `${imageBase}/game_table2.webp`, `${imageBase}/game_table2.json`);

    // Big Two 牌桌圖集，因為 Big Two 牌桌的 frame 與原本的 game_table 不同，所以不併入 game_table。
    this.load.atlas("big_two_game_table",  `${imageBase}/big_two_game_table.webp`,  `${imageBase}/big_two_game_table.json`);
    this.load.atlas("big_two_game_table2", `${imageBase}/big_two_game_table2.webp`, `${imageBase}/big_two_game_table2.json`);

    this.load.atlas("win", `${imageBase}/win.webp`, `${imageBase}/win.json`);

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

    // Big Two 專屬語音（僅 bigTwoScene 使用）：於此預載，避免首次「請選牌出牌」語音因場景內
    // 非同步載入尚未就緒而無聲。對德州撲克無影響——poker（tableScene）不引用這些 key。
    this.load.audio("bt_play_prompt", `${audioBase}/voice/play_bt.mp3`);
    this.load.audio("bt_first_play_prompt", `${audioBase}/voice/voice_first_play_bt.mp3`);
    this.load.audio("bt_no_card_pass", `${audioBase}/voice/no_card_and_pass_bt.mp3`);
    // 大老二專屬「過牌」語音（check_bt.mp3）：僅大老二過牌時使用，與德州撲克 voice_check（check.mp3）分開。
    this.load.audio("bt_check", `${audioBase}/voice/check_bt.mp3`);
    // 大老二專屬「入座」語音（player_join_bt.mp3）：英雄由觀戰入座時播放，與德州撲克 player_join.mp3 分開。
    this.load.audio("bt_player_join", `${audioBase}/voice/player_join_bt.mp3`);
    // 大老二專屬「恭喜贏家」語音（congrats_winner_bt.mp3）：結算彈窗開啟時播放，與德州撲克 congrats_winner.mp3 分開。
    this.load.audio("bt_congrats_winner", `${audioBase}/voice/congrats_winner_bt.mp3`);
    // 大老二專屬「派彩」語音（award_bt.mp3）：贏家發光出現時播放，與德州撲克 award.mp3 分開。
    this.load.audio("bt_award", `${audioBase}/voice/award_bt.mp3`);

    // 大老二出牌語音：英雄出牌落到中央牌堆時播放。單張＝各張牌專屬（{rank}_{suit}_bt.mp3，10 用 "10"、
    // 花色 c/d/h/s）；多張＝牌型（single/pair/straight/full_house/quads/straight_flush）。檔案由團隊陸續補齊，
    // 缺檔只會 loaderror、播放前以 cache.audio.exists 防護，不影響其它。poker 不引用這些 key。
    const BT_PLAY_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const BT_PLAY_SUITS = ["c", "d", "h", "s"];
    BT_PLAY_RANKS.forEach((r) =>
      BT_PLAY_SUITS.forEach((su) =>
        this.load.audio(`${r}_${su}_bt`, `${audioBase}/voice/${r}_${su}_bt.mp3`),
      ),
    );
    ["single", "pair", "straight", "full_house", "quads", "straight_flush"].forEach((c) =>
      this.load.audio(`${c}_bt`, `${audioBase}/voice/${c}_bt.mp3`),
    );

    VOICE_ASSET_LIST.forEach((item) => {
      this.load.audio(item.key, item.path);
    });
  }

  // 把 game_table2 的所有 frame 併入 game_table 紋理，指向 game_table2 的像素來源。
  // 之後全專案的 this.add.image(x, y, "game_table", "<frame>") 不論該 frame 實際在哪張圖都能取到。
  mergeGameTableAtlas() {
    if (!this.textures.exists("game_table") || !this.textures.exists("game_table2")) {
      return;
    }
    const base = this.textures.get("game_table");
    const extra = this.textures.get("game_table2");
    if (base.__gameTable2Merged) {
      return;
    }
    const extraSource = extra.source?.[0];
    if (!extraSource) {
      return;
    }
    const sourceIndex = base.source.length;
    base.source.push(extraSource);
    Object.keys(extra.frames).forEach((name) => {
      if (name === "__BASE" || base.has(name)) {
        return;
      }
      const f = extra.frames[name];
      base.add(name, sourceIndex, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
    });
    base.__gameTable2Merged = true;
  }

  create() {
    this.mergeGameTableAtlas();
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
