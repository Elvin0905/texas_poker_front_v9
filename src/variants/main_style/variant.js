import { BootScene } from "./scenes/bootScene.js";
import { ErrorModalScene } from "./scenes/errorModalScene.js";
import { AuthScene } from "./scenes/authScene.js";
import { RegisterScene } from "./scenes/registerScene.js";
import { LobbyScene } from "./scenes/lobbyScene.js";
import { GameLobbyScene } from "./scenes/gameLobbyScene.js";
import { TableScene } from "./scenes/tableScene.js";
import { BigTwoScene } from "./scenes/bigTwoScene.js";
import { ConnectionHudScene } from "./scenes/connectionHudScene.js";
import * as voice from "./audio/voice.js";

const assetBase = "assets/variants/main_style";

export const mainStyleVariant = {
  id: "main_style",
  assetBase,
  backgroundImagePath: `${assetBase}/images/Lobby.webp`,
  backgroundCrop: { x: 0, y: 0, width: 768, height: 512 },
  fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
  fonts: [],
  routeScenes: ["auth", "register", "lobby", "gameLobby", "table", "bigTwo"],
  overlayScenes: ["errorModal", "connectionHud"],
  voice,
  scenes: [
    BootScene,
    AuthScene,
    RegisterScene,
    LobbyScene,
    GameLobbyScene,
    TableScene,
    BigTwoScene,
    ErrorModalScene,
    ConnectionHudScene,
  ],
};
