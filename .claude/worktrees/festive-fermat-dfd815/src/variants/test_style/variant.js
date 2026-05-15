import { BootScene } from "./scenes/bootScene.js";
import { ErrorModalScene } from "./scenes/errorModalScene.js";
import { AuthScene } from "./scenes/authScene.js";
import { RegisterScene } from "./scenes/registerScene.js";
import { LobbyScene } from "./scenes/lobbyScene.js";
import { GameLobbyScene } from "./scenes/gameLobbyScene.js";
import { TableScene } from "./scenes/tableScene.js";
import { ConnectionHudScene } from "./scenes/connectionHudScene.js";
import * as voice from "./audio/voice.js";

const assetBase = "assets/variants/test_style";

export const testStyleVariant = {
  id: "test_style",
  assetBase,
  backgroundImagePath: `${assetBase}/images/bg.webp`,
  fontFamily: '"APTUI", "Noto Sans TC", "Segoe UI", sans-serif',
  fonts: [
    {
      family: "APTUI",
      path: `${assetBase}/fonts/apt_en_symbol_ui.woff2`,
      format: "woff2",
      weight: "400",
      style: "normal",
    },
  ],
  routeScenes: ["auth", "register", "lobby", "gameLobby", "table"],
  overlayScenes: ["errorModal", "connectionHud"],
  voice,
  scenes: [
    BootScene,
    AuthScene,
    RegisterScene,
    LobbyScene,
    GameLobbyScene,
    TableScene,
    ErrorModalScene,
    ConnectionHudScene,
  ],
};
