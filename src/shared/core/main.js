import { SocketClient } from "../network/socketClient.js";
import { MockSocketClient } from "../network/mockSocketClient.js";
import { Store } from "../state/store.js";
import { getGameVariant } from "../../variants/index.js";
import { layout, updateLayout } from "./layout.js";

// 讀網址參數，例如：
// ?mock=1                  -> 使用假後端
// ?ws=ws://127.0.0.1:8787  -> 指定 WebSocket 端點
// ?token=xxxx              -> 以 token 自動登入（跳過帳密登入）
const params = new URLSearchParams(window.location.search);
const ENDPOINT = params.get("ws") || "wss://texaswss.test336.net";
const useMock = params.get("mock") === "1";
const showTestDebugUi = params.get("test") === "abc";
const selectedVariant = getGameVariant(
  params.get("variant") || params.get("style") || import.meta.env?.VITE_GAME_VARIANT,
);
const DEFAULT_UI_FONT_STACK = '"Noto Sans TC", "Segoe UI", sans-serif';
const URL_TOKEN_PARAM = "token";
const TOKEN_STORAGE_KEY = "ngame_auth_token";
const AUDIO_PREFS_STORAGE_KEY = "ngame_audio_prefs_v1";
const DEBUG_BUTTON_POSITION_STORAGE_KEY = "ngame_debug_btn_pos_v1";
const DEBUG_BUTTON_DRAG_HOLD_MS = 200;
const DEBUG_BUTTON_DRAG_START_DISTANCE_PX = 4;
const urlTokenFromQuery = String(params.get(URL_TOKEN_PARAM) || "").trim();
const WS_TRACE_MAX_KEEP = 500;
const WS_TRACE_EXPORT_MAX = 100;
const DEFAULT_MASTER_VOLUME = 1;
const DEFAULT_BGM_VOLUME = 0.2;
const DEFAULT_SFX_VOLUME = 1;
const DEFAULT_VOICE_VOLUME = 1;
const VOICE_QUEUE_MAX_KEEP = 300;
const VOICE_CUE_STALE_MS = 2500;
const REAUTH_COOLDOWN_MS = 1500;
const WS_PONG_STALE_MS = 45000;
const WS_BACKGROUND_CLOSE_GRACE_MS = 180000;
const WS_RESUME_CLOSE_GRACE_MS = 12000;
const WS_RESUME_RECONNECT_RETRY_MS = 250;
const AUTO_REAUTH_MAX_ATTEMPTS = 3;
const QUEUED_AUTH_RECOVERY_MAX_KEEP = 16;
const AUTH_RECOVERY_QUEUE_WINDOW_MS = 4000;
const AUTO_BACK_TO_GAME_LOBBY_COOLDOWN_MS = 2000;
const AUTH_REQUIRED_MESSAGE_RE = /auth(?:entication)?\s+required/i;
const REPLAY_FIRST_STEP_DELAY_MS = 160;
const REPLAY_FAST_TIME_SCALE = 0.35;
const REPLAY_FAST_MIN_DELAY_MS = 80;
const REPLAY_FAST_MAX_DELAY_MS = 1200;
const STARTUP_AUTH_GATE_TIMEOUT_MS = 12000;
const LIVE_PACKET_SKIP_DURING_REPLAY = new Set([
  "table_joined",
  "table_state",
  "table_player_joined",
  "action_request",
  "turn",
  "player_action",
  "deal_community",
  "deal_card",
  "deal_private",
  "hole_cards",
  "showdown",
  "award",
  "hand_end",
  "rebuy_offer",
  "rebuy_result",
  "table_countdown",
  "hand_start",
  "post_blinds",
  "betting_start",
  "betting_complete",
  "game_lobby_state",
  "lobby_state",
  "wallet_state",
]);

function escapeCssString(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function applyVariantFonts(variant) {
  const fontStack = String(variant?.fontFamily || DEFAULT_UI_FONT_STACK);
  document.documentElement.style.setProperty("--ui-font-stack", fontStack);

  const fonts = Array.isArray(variant?.fonts) ? variant.fonts : [];
  if (fonts.length <= 0) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.variantFonts = String(variant?.id || "variant");
  style.textContent = fonts
    .map((font) => {
      const family = escapeCssString(font.family);
      const path = escapeCssString(font.path);
      const format = escapeCssString(font.format || "woff2");
      const weight = escapeCssString(font.weight || "400");
      const styleValue = escapeCssString(font.style || "normal");
      return `@font-face { font-family: "${family}"; src: url("${path}") format("${format}"); font-weight: ${weight}; font-style: ${styleValue}; font-display: swap; }`;
    })
    .join("\n");
  document.head.appendChild(style);

  const fontSet = document.fonts;
  if (!fontSet?.load) {
    return;
  }

  const loadTasks = fonts.map((font) => {
    const family = escapeCssString(font.family);
    const weight = escapeCssString(font.weight || "400");
    const styleValue = escapeCssString(font.style || "normal");
    return fontSet.load(`${styleValue} ${weight} 16px "${family}"`);
  });
  await Promise.race([
    Promise.allSettled(loadTasks),
    new Promise((resolve) => window.setTimeout(resolve, 1500)),
  ]);
}

await applyVariantFonts(selectedVariant);

// Variant 只提供畫面；後端流程、狀態與封包處理維持共用。
const SCENES = selectedVariant.routeScenes || ["auth", "register", "lobby", "gameLobby", "table"];

// 前端狀態中心（頁面、玩家資料、連線狀態、錯誤等）
const store = new Store();
let bootReady = false;
const wsTrafficTrace = [];
const voiceCueQueue = [];
let activeVoiceSound = null;
let debugExportButton = null;
let debugButtonDragState = null;
let debugButtonSuppressClickUntil = 0;
let isDesktopDebugMode = false;
let wsQualityBadge = null;
let wsQualityPing = null;
let wsQualityDetailPanel = null;
let wsQualityDetailRows = null;
let wsQualityDetailOpen = false;
let wsQualityOutsideHandlerBound = false;
let wsOpenCount = 0;
let pendingTableExit = null;
const HERO_OLD_TABLE_STORAGE_KEY = "ngame_hero_old_table_id";
const HERO_SWITCHED_MID_HAND_STORAGE_KEY = "ngame_hero_switched_mid_hand";
const HERO_SWITCH_DONE_STORAGE_KEY = "ngame_hero_switch_done";
let heroSwitchedMidHand = sessionStorage.getItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY) === "1";
let heroOldTableId = sessionStorage.getItem(HERO_OLD_TABLE_STORAGE_KEY) ?? "";
let heroSwitchOldHandDone = sessionStorage.getItem(HERO_SWITCH_DONE_STORAGE_KEY) === "1";
let heroOldSeatData = null;
let lastPageHiddenAt = 0;
let lastPageVisibleAt = Date.now();
let lastAutoReauthAt = 0;
let authRecoveryInProgress = false;
let authRecoveryAttemptCount = 0;
let authRecoveryLastAttemptAt = 0;
let lastAutoBackToGameLobbyAt = 0;
const queuedPacketsDuringAuthRecovery = [];
const wsRttHistory = [];
let sessionTokenMemory = "";
let pendingUrlToken = "";
let startupAuthGateActive = false;
let startupAuthGateTimer = 0;
let bootSceneRef = null;
const wsQualityState = {
  status: "idle",
  lastPacketAt: 0,
  lastPongAt: 0,
};
const replaySessionState = {
  active: false,
  finishing: false,
  fromScene: null,
  returnPage: null,
  id: 0,
  timers: [],
  fastMode: false,
  timeline: [],
  replay: null,
  context: {
    previousElapsedMs: 0,
    previousEventAtMs: 0,
    lastActionRequestAtBySeat: {},
  },
};

function normalizeToken(value) {
  return String(value || "").trim();
}

function readPersistedToken() {
  try {
    return normalizeToken(window.localStorage?.getItem?.(TOKEN_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function writePersistedToken(tokenRaw) {
  const token = normalizeToken(tokenRaw);
  try {
    if (!token) {
      window.localStorage?.removeItem?.(TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage?.setItem?.(TOKEN_STORAGE_KEY, token);
  } catch {}
}

function setSessionToken(tokenRaw, { persist = true } = {}) {
  const token = normalizeToken(tokenRaw);
  sessionTokenMemory = token;
  if (persist) {
    writePersistedToken(token);
  }
}

function clampAudioPref01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return Math.max(0, Math.min(1, Number(fallback) || 0));
  }
  return Math.max(0, Math.min(1, n));
}

function readAudioPrefsFromStorage() {
  try {
    const raw = window.localStorage?.getItem?.(AUDIO_PREFS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function resolveAudioBoolPref(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  return Boolean(fallback);
}

function resolveAudioVolumePref(value, fallback) {
  return clampAudioPref01(value, fallback);
}

function writeAudioPrefsToStorage(app) {
  if (!app) {
    return;
  }
  const payload = {
    masterAudioEnabled: app.masterAudioEnabled !== false,
    masterVolume: clampAudioPref01(app.masterVolume, DEFAULT_MASTER_VOLUME),
    sfxEnabled: app.sfxEnabled !== false,
    sfxVolume: clampAudioPref01(app.sfxVolume, DEFAULT_SFX_VOLUME),
    voiceEnabled: app.voiceEnabled !== false,
    voiceVolume: clampAudioPref01(app.voiceVolume, DEFAULT_VOICE_VOLUME),
    bgmEnabled: app.bgmEnabled !== false,
    bgmVolume: clampAudioPref01(app.bgmVolume, DEFAULT_BGM_VOLUME),
  };
  try {
    window.localStorage?.setItem?.(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

function clearTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(URL_TOKEN_PARAM)) {
      return;
    }
    url.searchParams.delete(URL_TOKEN_PARAM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  } catch {}
}

function ensureWsQualityBadge() {
  if (!showTestDebugUi) {
    return;
  }
  if (wsQualityBadge) {
    return;
  }
  const badge = document.createElement("div");
  badge.id = "ws-quality-badge";
  badge.setAttribute("role", "button");
  badge.setAttribute("tabindex", "0");
  badge.setAttribute("aria-expanded", "false");
  badge.setAttribute("aria-label", "連線品質");
  badge.innerHTML = `
    <div class="ws-quality-bars" aria-hidden="true">
      <span></span><span></span><span></span><span></span>
    </div>
    <span class="ws-quality-ping"></span>
  `;
  badge.addEventListener("click", (event) => {
    event.stopPropagation();
    wsQualityDetailOpen = !wsQualityDetailOpen;
    updateWsQualityBadge();
  });
  badge.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    wsQualityDetailOpen = !wsQualityDetailOpen;
    updateWsQualityBadge();
  });
  document.body.appendChild(badge);
  wsQualityBadge = badge;
  wsQualityPing = badge.querySelector(".ws-quality-ping");

  const detailPanel = document.createElement("div");
  detailPanel.id = "ws-quality-detail";
  detailPanel.innerHTML = `
    <div class="wsq-row"><span>狀態</span><strong data-key="status">-</strong></div>
    <div class="wsq-row"><span>平均延遲</span><strong data-key="avgRtt">-</strong></div>
    <div class="wsq-row"><span>最近 PONG</span><strong data-key="lastPong">-</strong></div>
    <div class="wsq-row"><span>最近收包</span><strong data-key="lastPacket">-</strong></div>
    <div class="wsq-row"><span>重連次數</span><strong data-key="reconnect">0</strong></div>
    <div class="wsq-row"><span>自動重登</span><strong data-key="reauth">-</strong></div>
    <div class="wsq-row"><span>端點</span><strong data-key="endpoint">-</strong></div>
  `;
  document.body.appendChild(detailPanel);
  wsQualityDetailPanel = detailPanel;
  wsQualityDetailRows = {};
  detailPanel.querySelectorAll("[data-key]").forEach((node) => {
    wsQualityDetailRows[node.getAttribute("data-key")] = node;
  });

  if (!wsQualityOutsideHandlerBound) {
    document.addEventListener("pointerdown", (event) => {
      if (!wsQualityDetailOpen) {
        return;
      }
      const target = event.target;
      if (wsQualityBadge?.contains(target) || wsQualityDetailPanel?.contains(target)) {
        return;
      }
      wsQualityDetailOpen = false;
      updateWsQualityBadge();
    }, true);
    wsQualityOutsideHandlerBound = true;
  }
}

function formatAgeSince(tsMsRaw) {
  const tsMs = Number(tsMsRaw);
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    return "—";
  }
  const diffMs = Math.max(0, Date.now() - tsMs);
  if (diffMs < 1000) {
    return "剛剛";
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    return `${sec}s 前`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m 前`;
  }
  const hour = Math.floor(min / 60);
  if (hour < 24) {
    return `${hour}h 前`;
  }
  const day = Math.floor(hour / 24);
  return `${day}d 前`;
}

function formatTimeOf(tsMsRaw) {
  const tsMs = Number(tsMsRaw);
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    return "—";
  }
  return new Date(tsMs).toLocaleTimeString();
}

function updateWsQualityDetailPanel(view) {
  if (!wsQualityDetailPanel || !wsQualityDetailRows) {
    return;
  }
  const avgRtt = averageWsRtt();
  const reconnectAttempt = Number(socket?.reconnectAttempt ?? 0);
  wsQualityDetailRows.status.textContent = `${view.label} (${String(wsQualityState.status || "idle")})`;
  wsQualityDetailRows.avgRtt.textContent = Number.isFinite(avgRtt) ? `${Math.round(avgRtt)} ms` : "—";
  wsQualityDetailRows.lastPong.textContent = wsQualityState.lastPongAt > 0
    ? `${formatAgeSince(wsQualityState.lastPongAt)} (${formatTimeOf(wsQualityState.lastPongAt)})`
    : "—";
  wsQualityDetailRows.lastPacket.textContent = wsQualityState.lastPacketAt > 0
    ? `${formatAgeSince(wsQualityState.lastPacketAt)} (${formatTimeOf(wsQualityState.lastPacketAt)})`
    : "—";
  wsQualityDetailRows.reconnect.textContent = String(Math.max(0, reconnectAttempt));
  wsQualityDetailRows.reauth.textContent = lastAutoReauthAt > 0
    ? `${formatAgeSince(lastAutoReauthAt)} (${formatTimeOf(lastAutoReauthAt)})`
    : "尚未";
  wsQualityDetailRows.endpoint.textContent = ENDPOINT;
}

function pushWsRtt(rttMsRaw) {
  const rttMs = Number(rttMsRaw);
  if (!Number.isFinite(rttMs) || rttMs < 0 || rttMs > 60000) {
    return;
  }
  wsRttHistory.push(rttMs);
  if (wsRttHistory.length > 8) {
    wsRttHistory.splice(0, wsRttHistory.length - 8);
  }
}

function averageWsRtt() {
  if (wsRttHistory.length <= 0) {
    return null;
  }
  const sum = wsRttHistory.reduce((acc, value) => acc + Number(value || 0), 0);
  const avg = sum / wsRttHistory.length;
  return Number.isFinite(avg) ? avg : null;
}

function resolveWsQualityView() {
  const status = String(wsQualityState.status || "idle");
  const nowMs = Date.now();
  const avgRtt = averageWsRtt();
  const pongAgeMs = Number.isFinite(Number(wsQualityState.lastPongAt)) ? nowMs - Number(wsQualityState.lastPongAt) : Number.POSITIVE_INFINITY;
  const reconnectSecMatch = status.match(/^reconnecting_(\d+)s$/);

  if (status === "open") {
    let level = 3;
    let label = "連線良好";
    if (Number.isFinite(avgRtt)) {
      if (avgRtt <= 120) {
        level = 4;
        label = "連線極佳";
      } else if (avgRtt <= 220) {
        level = 3;
        label = "連線良好";
      } else if (avgRtt <= 380) {
        level = 2;
        label = "延遲偏高";
      } else {
        level = 1;
        label = "延遲很高";
      }
    }
    if (pongAgeMs > WS_PONG_STALE_MS) {
      level = Math.min(level, 1);
      label = "連線不穩";
    }
    return {
      level,
      label,
      pingText: Number.isFinite(avgRtt) ? `${Math.round(avgRtt)}ms` : "",
      stateClass: "state-open",
    };
  }

  if (status === "connecting") {
    return {
      level: 1,
      label: "連線中",
      pingText: "",
      stateClass: "state-connecting",
    };
  }

  if (reconnectSecMatch) {
    return {
      level: 1,
      label: `重連中 ${reconnectSecMatch[1]}s`,
      pingText: "",
      stateClass: "state-reconnecting",
    };
  }

  if (status.startsWith("closed_") || status === "closed" || status === "error") {
    return {
      level: 0,
      label: "已斷線",
      pingText: "",
      stateClass: "state-offline",
    };
  }

  return {
    level: 0,
    label: "未連線",
    pingText: "",
    stateClass: "state-idle",
  };
}

function updateWsQualityBadge() {
  if (!showTestDebugUi) {
    wsQualityDetailOpen = false;
    if (wsQualityBadge) {
      wsQualityBadge.style.display = "none";
    }
    if (wsQualityDetailPanel) {
      wsQualityDetailPanel.classList.remove("is-open");
      wsQualityDetailPanel.style.display = "none";
    }
    return;
  }
  ensureWsQualityBadge();
  if (!wsQualityBadge) {
    return;
  }
  const view = resolveWsQualityView();
  wsQualityBadge.className = "";
  wsQualityBadge.classList.add(`level-${view.level}`, view.stateClass);
  wsQualityBadge.setAttribute("aria-expanded", wsQualityDetailOpen ? "true" : "false");
  wsQualityBadge.setAttribute("aria-label", `伺服器連線品質：${view.label}`);
  wsQualityBadge.title = `伺服器連線品質：${view.label}`;
  if (wsQualityPing) {
    wsQualityPing.textContent = view.pingText || "";
  }
  if (wsQualityDetailPanel) {
    wsQualityDetailPanel.classList.toggle("is-open", wsQualityDetailOpen);
  }
  updateWsQualityDetailPanel(view);
}

function onSocketStatus(statusRaw) {
  wsQualityState.status = String(statusRaw || "idle");
  if (wsQualityState.status === "open" && (!Number.isFinite(Number(wsQualityState.lastPongAt)) || Number(wsQualityState.lastPongAt) <= 0)) {
    wsQualityState.lastPongAt = Date.now();
  }
  updateWsQualityBadge();
}

function onSocketPacketForQuality(packet, socketRef) {
  const packetType = String(packet?.type || "").toLowerCase();
  wsQualityState.lastPacketAt = Date.now();
  if (packetType === "pong") {
    wsQualityState.lastPongAt = Date.now();
    const pingAt = Number(socketRef?.lastPingSentAt ?? 0);
    if (Number.isFinite(pingAt) && pingAt > 0) {
      pushWsRtt(wsQualityState.lastPongAt - pingAt);
    }
  }
  updateWsQualityBadge();
}

function markBootReady() {
  if (bootReady) {
    return;
  }
  bootReady = true;
}

function shouldHoldBootScene() {
  return startupAuthGateActive;
}

function clearStartupAuthGateTimer() {
  if (startupAuthGateTimer) {
    window.clearTimeout(startupAuthGateTimer);
    startupAuthGateTimer = 0;
  }
}

function setBootSceneRef(scene) {
  bootSceneRef = scene || null;
}

function releaseStartupAuthGate(reason = "unknown") {
  if (!startupAuthGateActive) {
    return;
  }
  startupAuthGateActive = false;
  clearStartupAuthGateTimer();
  store.pushLog(`[auth] startup gate released (${reason})`);
  if (bootSceneRef?.scene?.isActive?.("boot")) {
    bootSceneRef.scene.stop("boot");
  }
  bootSceneRef = null;
  if (routerBound) {
    const page = String(store.getState?.()?.page || "auth");
    switchSceneByPage(page);
  }
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}

function getMasterVolume() {
  return clamp01(window.__APP__?.masterVolume ?? DEFAULT_MASTER_VOLUME);
}

function getVoiceVolume() {
  return clamp01(window.__APP__?.voiceVolume ?? DEFAULT_VOICE_VOLUME);
}

function isVoicePlayable() {
  if (window.__APP__?.masterAudioEnabled === false) {
    return false;
  }
  if (window.__APP__?.voiceEnabled === false) {
    return false;
  }
  return true;
}

function stopActiveVoice() {
  if (!activeVoiceSound) {
    return;
  }
  const sound = activeVoiceSound;
  activeVoiceSound = null;
  try {
    sound.off?.("complete");
    sound.off?.("stop");
    sound.off?.("destroy");
  } catch {}
  try {
    sound.stop?.();
  } catch {}
  try {
    sound.destroy?.();
  } catch {}
}

function playVoiceByKey(key, volumeScale = 1, options = null) {
  if (!key) {
    return;
  }
  if (!isVoicePlayable()) {
    stopActiveVoice();
    return;
  }
  // Low-priority voices (e.g. player join) yield to any currently-playing voice.
  if (options?.lowPriority && activeVoiceSound) {
    return;
  }
  if (!game?.cache?.audio?.exists?.(key)) {
    return;
  }
  const volume = clamp01(getMasterVolume() * getVoiceVolume() * clamp01(volumeScale));
  if (volume <= 0) {
    stopActiveVoice();
    return;
  }
  // 語音採單通道：新語音來時，立刻中斷舊語音。
  stopActiveVoice();

  const sound = game?.sound?.add?.(key);
  if (!sound) {
    return;
  }
  activeVoiceSound = sound;
  const onComplete = typeof options?.onComplete === "function" ? options.onComplete : null;
  let cleaned = false;
  const cleanup = (reason = "stop") => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    if (activeVoiceSound === sound) {
      activeVoiceSound = null;
    }
    if (reason === "complete" && onComplete) {
      try {
        onComplete();
      } catch {}
    }
    try {
      sound.destroy?.();
    } catch {}
  };
  sound.once?.("complete", () => cleanup("complete"));
  sound.once?.("stop", () => cleanup("stop"));
  sound.once?.("destroy", () => {
    if (activeVoiceSound === sound) {
      activeVoiceSound = null;
    }
  });

  const started = sound.play({ volume });
  if (!started) {
    cleanup("stop");
  }
}

function isDocumentVisible() {
  if (typeof document === "undefined") {
    return true;
  }
  return !document.hidden;
}

function clearVoiceCueQueue() {
  if (voiceCueQueue.length <= 0) {
    return;
  }
  voiceCueQueue.splice(0, voiceCueQueue.length);
}

function queueVoiceCueFromPacket(packet) {
  if (!isDocumentVisible()) {
    return;
  }
  const key = selectedVariant.voice?.resolveVoiceKeyByPacket?.(packet);
  if (!key) {
    return;
  }
  voiceCueQueue.push({
    atMs: Date.now(),
    atIso: new Date().toISOString(),
    key,
    packetType: String(packet?.type || "unknown"),
    packet: cloneSafe(packet),
  });
  if (voiceCueQueue.length > VOICE_QUEUE_MAX_KEEP) {
    voiceCueQueue.splice(0, voiceCueQueue.length - VOICE_QUEUE_MAX_KEEP);
  }
}

function consumeVoiceCues(maxCount = 24) {
  if (!isDocumentVisible()) {
    clearVoiceCueQueue();
    return [];
  }
  const nowMs = Date.now();
  for (let i = voiceCueQueue.length - 1; i >= 0; i -= 1) {
    const cueMs = Number(voiceCueQueue[i]?.atMs ?? 0);
    if (!Number.isFinite(cueMs) || nowMs - cueMs > VOICE_CUE_STALE_MS) {
      voiceCueQueue.splice(i, 1);
    }
  }
  const count = Math.max(0, Math.floor(Number(maxCount) || 0));
  if (count <= 0 || voiceCueQueue.length === 0) {
    return [];
  }
  return voiceCueQueue.splice(0, count);
}
function cloneSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function parseSeatNumber(value) {
  const seat = Number(value);
  if (!Number.isFinite(seat)) {
    return null;
  }
  return Math.trunc(seat);
}

function setReplayTimeout(callback, delayMs) {
  const timer = window.setTimeout(callback, delayMs);
  replaySessionState.timers.push(timer);
  return timer;
}

function clearReplayTimers() {
  replaySessionState.timers.forEach((timer) => window.clearTimeout(timer));
  replaySessionState.timers.splice(0, replaySessionState.timers.length);
}

function resetReplayContext() {
  replaySessionState.context = {
    previousElapsedMs: 0,
    previousEventAtMs: 0,
    lastActionRequestAtBySeat: {},
    heroSeat: null,
    pendingHeroHoleCards: [],
    heroHoleCardsRevealed: false,
  };
}

function isReplayFastMode() {
  return Boolean(replaySessionState.fastMode);
}

function setReplayFastMode(enabled) {
  replaySessionState.fastMode = Boolean(enabled);
}

function stopReplayPlayback(reason = "") {
  const hadActiveReplay = replaySessionState.active || replaySessionState.finishing || replaySessionState.timers.length > 0;
  const fromScene = replaySessionState.fromScene;
  const capturedReturnPage = replaySessionState.returnPage || (fromScene === "gameLobby" ? "gameLobby" : "lobby");
  replaySessionState.id += 1;
  replaySessionState.active = false;
  replaySessionState.finishing = false;
  replaySessionState.fromScene = null;
  replaySessionState.returnPage = null;
  clearReplayTimers();
  replaySessionState.timeline = [];
  replaySessionState.replay = null;
  resetReplayContext();
  if (!hadActiveReplay) {
    return;
  }
  if (reason) {
    store.pushLog(`[replay] stop (${reason})`);
  } else {
    store.pushLog("[replay] stop");
  }
  if (reason === "manual_exit_button") {
    store.openDailySettlementAfterReplay(capturedReturnPage);
  } else {
    store.emit();
  }
}

function buildReplayInitTable(replay) {
  const timeline = Array.isArray(replay?.timeline) ? replay.timeline : [];
  const handStartEvent = timeline.find((entry) => String(entry?.event || "").toLowerCase() === "hand_start");
  const tableFromHandStart = handStartEvent?.payload?.table;
  if (tableFromHandStart && typeof tableFromHandStart === "object") {
    return cloneSafe(tableFromHandStart);
  }
  const tableSnapshot = replay?.table_snapshot;
  if (tableSnapshot && typeof tableSnapshot === "object") {
    return cloneSafe(tableSnapshot);
  }
  return null;
}

function deriveReplayHeroSeat(replayData, initTable) {
  const replayHeroSeat = parseSeatNumber(replayData?.hero_seat);
  if (replayHeroSeat !== null) {
    return replayHeroSeat;
  }
  const localUsername = String(store.getState?.()?.user?.username ?? "").trim();
  const players = Array.isArray(initTable?.players) ? initTable.players : [];
  if (localUsername && players.length > 0) {
    const matched = players.find((player) => String(player?.username ?? "").trim() === localUsername);
    const matchedSeat = parseSeatNumber(matched?.seat);
    if (matchedSeat !== null) {
      return matchedSeat;
    }
  }
  return null;
}

function buildReplayPacketFromTimelineEvent(event, replay) {
  const type = String(event?.event || "").toLowerCase();
  if (!type) {
    return null;
  }
  const data = cloneSafe(event?.payload || {});
  const tableId = String(replay?.table_id || "");
  const handId = Number(replay?.hand_id);
  if (!Object.prototype.hasOwnProperty.call(data, "table_id") && tableId) {
    data.table_id = tableId;
  }
  if (!Object.prototype.hasOwnProperty.call(data, "hand_id") && Number.isFinite(handId)) {
    data.hand_id = handId;
  }
  // Always copy top-level event.seat / user_id into data if payload didn't include them —
  // some server formats put these at the event root, not inside payload.
  const topLevelSeat = event?.seat ?? event?.payload?.seat;
  if (topLevelSeat != null && !Object.prototype.hasOwnProperty.call(data, "seat")) {
    data.seat = topLevelSeat;
  }
  const topLevelUserId = event?.user_id ?? event?.payload?.user_id;
  if (topLevelUserId != null && !Object.prototype.hasOwnProperty.call(data, "user_id")) {
    data.user_id = topLevelUserId;
  }
  // Normalize standalone action events to player_action so patchTableByAction runs.
  // Also handles "player_fold", "player_check", etc. and generic "action" events.
  const STANDALONE_ACTION_SET = new Set(["fold", "check", "call", "raise", "all_in", "allin", "bet"]);
  let resolvedAction = STANDALONE_ACTION_SET.has(type) ? type : null;
  if (!resolvedAction && type.startsWith("player_")) {
    const suffix = type.slice(7);
    if (STANDALONE_ACTION_SET.has(suffix)) resolvedAction = suffix;
  }
  if (!resolvedAction && type === "action" && data.action) {
    resolvedAction = String(data.action).toLowerCase();
  }
  if (resolvedAction) {
    if (!Object.prototype.hasOwnProperty.call(data, "action")) {
      data.action = resolvedAction;
    }
    return { type: "player_action", data };
  }
  return { type, data };
}

function extractReplayHeroHoleCards(replayData, replay, heroSeatRaw) {
  const normalizeCards = (cardsRaw) => {
    let arr = cardsRaw;
    if (typeof arr === "string") {
      arr = arr.split(/[,\s]+/).filter(Boolean);
    }
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr
      .map((card) => String(card || "").trim())
      .filter((card) => card.length > 0)
      .slice(0, 2);
  };

  // 1. Top-level hero_hole_cards in the response root
  for (const key of ["hero_hole_cards", "hero_cards", "my_hole_cards", "my_cards"]) {
    const v = normalizeCards(replayData?.[key]);
    if (v.length > 0) return v;
  }

  const heroSeat = parseSeatNumber(heroSeatRaw);
  if (heroSeat === null) {
    return [];
  }

  // 2. Showdown/reveal structure keyed by seat
  const revealInfo = replay?.reveals?.[String(heroSeat)];
  for (const key of ["hole", "hole_cards", "cards", "hand"]) {
    const v = normalizeCards(revealInfo?.[key]);
    if (v.length > 0) return v;
  }

  // 3. Player list
  const replayPlayers = Array.isArray(replay?.players) ? replay.players : [];
  const heroPlayer = replayPlayers.find((item) => parseSeatNumber(item?.seat) === heroSeat);
  for (const key of ["hole_cards", "cards", "hole", "hand"]) {
    const v = normalizeCards(heroPlayer?.[key]);
    if (v.length > 0) return v;
  }

  // 4. replay-level hero_hole_cards (nested inside replay object)
  for (const key of ["hero_hole_cards", "hero_cards"]) {
    const v = normalizeCards(replay?.[key]);
    if (v.length > 0) return v;
  }

  // 5. Scan timeline for deal_private events belonging to the hero
  const timeline = Array.isArray(replay?.timeline) ? replay.timeline : [];
  const timelineCards = [];
  for (const event of timeline) {
    if (String(event?.event || "").toLowerCase() !== "deal_private") continue;
    const seat = parseSeatNumber(event?.seat ?? event?.payload?.seat);
    if (seat !== heroSeat) continue;
    const card = String(event?.payload?.card ?? event?.payload?.cards?.[0] ?? "").trim();
    const cardIndex = Number(event?.payload?.card_index ?? 0);
    if (card && cardIndex >= 0 && cardIndex < 2) timelineCards[cardIndex] = card;
  }
  const fromTimeline = timelineCards.filter(Boolean);
  if (fromTimeline.length > 0) return fromTimeline;

  return [];
}

function hasReplayDealEvents(timeline) {
  if (!Array.isArray(timeline) || timeline.length <= 0) {
    return false;
  }
  return timeline.some((event) => {
    const type = String(event?.event || "").toLowerCase();
    return type === "deal_card" || type === "deal_private" || type === "hole_cards";
  });
}

function buildSyntheticDealCardEvents(baseTimeline, replay) {
  const timeline = Array.isArray(baseTimeline) ? baseTimeline : [];
  if (timeline.length <= 0) {
    return [];
  }
  if (hasReplayDealEvents(timeline)) {
    return [];
  }

  const handStartEvent = timeline.find((event) => String(event?.event || "").toLowerCase() === "hand_start");
  const handStartTablePlayers = Array.isArray(handStartEvent?.payload?.table?.players)
    ? handStartEvent.payload.table.players
    : [];
  if (handStartTablePlayers.length <= 0) {
    return [];
  }

  const seatOrder = handStartTablePlayers
    .filter((player) => player?.is_sitting_out !== true && player?.in_hand !== false)
    .map((player) => parseSeatNumber(player?.seat))
    .filter((seat) => seat !== null)
    .sort((a, b) => a - b);
  if (seatOrder.length <= 0) {
    return [];
  }

  const insertBeforeIndex = timeline.findIndex((event) => {
    const type = String(event?.event || "").toLowerCase();
    if (type === "betting_start") {
      return true;
    }
    if (type === "action_request") {
      const round = String(event?.round || event?.payload?.round || "").toLowerCase();
      return round === "preflop" || !round;
    }
    return false;
  });
  if (insertBeforeIndex <= 0) {
    return [];
  }

  const previousEvent = timeline[Math.max(0, insertBeforeIndex - 1)];
  const nextEvent = timeline[insertBeforeIndex];
  const previousElapsedMs = Number(previousEvent?.elapsed_ms ?? 0);
  const nextElapsedMs = Number(nextEvent?.elapsed_ms ?? previousElapsedMs + 1800);
  const previousEventAtMs = Number(previousEvent?.event_at_ms ?? 0);
  const nextEventAtMs = Number(nextEvent?.event_at_ms ?? previousEventAtMs + 1800);

  const syntheticEvents = [];
  const totalDeals = seatOrder.length * 2;
  const gapByElapsed = Math.max(120, Math.floor(Math.max(1000, nextElapsedMs - previousElapsedMs - 200) / Math.max(1, totalDeals)));
  const gapByEventAt = Math.max(120, Math.floor(Math.max(1000, nextEventAtMs - previousEventAtMs - 200) / Math.max(1, totalDeals)));
  let runningElapsedMs = previousElapsedMs + 120;
  let runningEventAtMs = previousEventAtMs + 120;
  let syntheticNo = 0;

  for (let cardIndex = 0; cardIndex < 2; cardIndex += 1) {
    for (let i = 0; i < seatOrder.length; i += 1) {
      const seat = seatOrder[i];
      syntheticNo += 1;
      syntheticEvents.push({
        event_no: Number(previousEvent?.event_no ?? 0) + syntheticNo * 0.01,
        event: "deal_card",
        round: "preflop",
        seat,
        user_id: null,
        event_at_ms: runningEventAtMs,
        elapsed_ms: runningElapsedMs,
        payload: {
          table_id: String(replay?.table_id || ""),
          hand_id: Number(replay?.hand_id ?? 0),
          seat,
          card_index: cardIndex,
        },
      });
      runningElapsedMs += gapByElapsed;
      runningEventAtMs += gapByEventAt;
    }
  }

  return syntheticEvents;
}

function enrichReplayTimeline(rawTimeline, replay) {
  const timeline = Array.isArray(rawTimeline) ? rawTimeline : [];
  if (timeline.length <= 0) {
    return [];
  }
  const syntheticDealEvents = buildSyntheticDealCardEvents(timeline, replay);
  if (syntheticDealEvents.length <= 0) {
    return [...timeline];
  }
  const insertBeforeIndex = timeline.findIndex((event) => {
    const type = String(event?.event || "").toLowerCase();
    if (type === "betting_start") {
      return true;
    }
    if (type === "action_request") {
      const round = String(event?.round || event?.payload?.round || "").toLowerCase();
      return round === "preflop" || !round;
    }
    return false;
  });
  if (insertBeforeIndex <= 0) {
    return [...timeline];
  }
  return [
    ...timeline.slice(0, insertBeforeIndex),
    ...syntheticDealEvents,
    ...timeline.slice(insertBeforeIndex),
  ];
}

function applyReplayPacket(packet) {
  pushWsTrace("replay", packet);
  queueVoiceCueFromPacket(packet);
  store.applyPacket(packet);
}

function updateReplayContextByEvent(event) {
  const context = replaySessionState.context;
  const eventType = String(event?.event || "").toLowerCase();
  const eventSeat = parseSeatNumber(event?.seat ?? event?.payload?.seat);
  const eventAtMs = Number(event?.event_at_ms);
  const elapsedMs = Number(event?.elapsed_ms);
  if (Number.isFinite(elapsedMs) && elapsedMs >= 0) {
    context.previousElapsedMs = elapsedMs;
  }
  if (Number.isFinite(eventAtMs) && eventAtMs > 0) {
    context.previousEventAtMs = eventAtMs;
  }
  if (eventType === "action_request" && eventSeat !== null && Number.isFinite(eventAtMs) && eventAtMs > 0) {
    context.lastActionRequestAtBySeat[String(eventSeat)] = eventAtMs;
  }
}

function maybeRevealHeroHoleCardsAfterDeal(event, replay) {
  const context = replaySessionState.context;
  if (context.heroHoleCardsRevealed) {
    return;
  }
  const pending = Array.isArray(context.pendingHeroHoleCards) ? context.pendingHeroHoleCards : [];
  if (pending.length <= 0) {
    return;
  }
  const heroSeat = parseSeatNumber(context.heroSeat);
  if (heroSeat === null) {
    return;
  }
  const eventType = String(event?.event || "").toLowerCase();
  if (eventType !== "deal_card") {
    return;
  }
  const seat = parseSeatNumber(event?.seat ?? event?.payload?.seat);
  if (seat !== heroSeat) {
    return;
  }
  const cardIndex = Number(event?.payload?.card_index ?? event?.card_index);
  if (!Number.isFinite(cardIndex) || cardIndex < 1) {
    return;
  }
  context.heroHoleCardsRevealed = true;
  applyReplayPacket({
    type: "hole_cards",
    data: {
      table_id: String(replay?.table_id || ""),
      hand_id: Number(replay?.hand_id ?? 0),
      cards: pending,
    },
  });
}

function resolveReplayDelayMsForEvent(nextEvent, isFirstStep = false) {
  if (isFirstStep) {
    return REPLAY_FIRST_STEP_DELAY_MS;
  }
  const context = replaySessionState.context;
  const eventType = String(nextEvent?.event || "").toLowerCase();
  const eventSeat = parseSeatNumber(nextEvent?.seat ?? nextEvent?.payload?.seat);
  const eventAtMs = Number(nextEvent?.event_at_ms);

  const currentElapsedMs = Math.max(0, Number(nextEvent?.elapsed_ms ?? context.previousElapsedMs));
  const elapsedGapMs = Math.max(0, currentElapsedMs - Number(context.previousElapsedMs ?? 0));
  let rawGapMs = elapsedGapMs;

  const prevEventAtMs = Number(context.previousEventAtMs ?? 0);
  if (Number.isFinite(eventAtMs) && eventAtMs > 0 && Number.isFinite(prevEventAtMs) && prevEventAtMs > 0) {
    rawGapMs = Math.max(0, eventAtMs - prevEventAtMs);
  }

  if (eventType === "player_action" && eventSeat !== null && Number.isFinite(eventAtMs) && eventAtMs > 0) {
    const actionRequestAt = Number(context.lastActionRequestAtBySeat[String(eventSeat)] ?? 0);
    if (Number.isFinite(actionRequestAt) && actionRequestAt > 0 && eventAtMs >= actionRequestAt) {
      rawGapMs = eventAtMs - actionRequestAt;
    }
  }

  if (!isReplayFastMode()) {
    return Math.max(0, Math.round(rawGapMs));
  }
  const fastDelay = Math.round(rawGapMs * REPLAY_FAST_TIME_SCALE);
  return Math.max(REPLAY_FAST_MIN_DELAY_MS, Math.min(REPLAY_FAST_MAX_DELAY_MS, fastDelay));
}

function finishReplayPlayback() {
  replaySessionState.active = false;
  clearReplayTimers();
  const replay = replaySessionState.replay;
  const returnPage = replaySessionState.fromScene === "gameLobby" ? "gameLobby" : "lobby";
  store.pushLog(`[replay] finish hand ${String(replay?.hand_id ?? "-")}`);
  const hasHandResult = Boolean(store.getState?.()?.handResult);
  if (hasHandResult) {
    replaySessionState.finishing = true;
    replaySessionState.returnPage = returnPage;
    // Emit so renderState fires and opens the latched pendingHandResult modal.
    store.emit();
  } else {
    replaySessionState.fromScene = null;
    replaySessionState.returnPage = null;
    store.openDailySettlementAfterReplay(returnPage);
  }
}

function scheduleReplayStep(stepIndex, replayId) {
  if (!replaySessionState.active || replaySessionState.id !== replayId) {
    return;
  }
  const timeline = replaySessionState.timeline;
  const replay = replaySessionState.replay;
  if (!Array.isArray(timeline) || stepIndex < 0 || stepIndex >= timeline.length) {
    finishReplayPlayback();
    return;
  }

  const event = timeline[stepIndex];
  const replayPacket = buildReplayPacketFromTimelineEvent(event, replay);
  if (replayPacket) {
    applyReplayPacket(replayPacket);
  }
  maybeRevealHeroHoleCardsAfterDeal(event, replay);
  updateReplayContextByEvent(event);

  const isLast = stepIndex === timeline.length - 1;
  if (isLast) {
    finishReplayPlayback();
    return;
  }

  const nextIndex = stepIndex + 1;
  const nextEvent = timeline[nextIndex];
  const delayMs = resolveReplayDelayMsForEvent(nextEvent, false);
  setReplayTimeout(() => {
    scheduleReplayStep(nextIndex, replayId);
  }, delayMs);
}

function startReplayPlayback(packet) {
  const replayData = packet?.data;
  const replay = replayData?.replay;
  const timelineRaw = Array.isArray(replay?.timeline) ? replay.timeline : [];
  const timeline = enrichReplayTimeline(timelineRaw, replay)
    .filter((entry) => entry && typeof entry === "object")
    .sort((a, b) => Number(a?.event_no ?? 0) - Number(b?.event_no ?? 0));

  if (!replayData?.ok || !replay || timeline.length <= 0) {
    store.applyPacket({
      type: "error",
      data: {
        code: "REPLAY_EMPTY",
        message: "回放資料為空或格式錯誤",
      },
    });
    return true;
  }

  const initTable = buildReplayInitTable(replay);
  if (!initTable) {
    store.applyPacket({
      type: "error",
      data: {
        code: "REPLAY_TABLE_MISSING",
        message: "回放缺少初始牌桌資料",
      },
    });
    return true;
  }

  const _capturedFromScene = activeScene;
  stopReplayPlayback("restart");
  replaySessionState.active = true;
  replaySessionState.fromScene = _capturedFromScene;
  replaySessionState.id += 1;
  replaySessionState.timeline = timeline;
  replaySessionState.replay = replay;
  setReplayFastMode(false);
  resetReplayContext();
  const replayId = replaySessionState.id;

  const heroSeat = deriveReplayHeroSeat(replayData, initTable);
  const heroHoleCards = extractReplayHeroHoleCards(replayData, replay, heroSeat);
replaySessionState.context.heroSeat = heroSeat;
  replaySessionState.context.pendingHeroHoleCards = heroHoleCards;
  replaySessionState.context.heroHoleCardsRevealed = heroHoleCards.length <= 0;
  const initPacket = {
    type: "table_joined",
    data: {
      hero_seat: heroSeat,
      table: initTable,
    },
  };
  applyReplayPacket(initPacket);

  store.pushLog(`[replay] start hand ${String(replay?.hand_id ?? "-")} (${timeline.length} events)`);
  store.emit();

  setReplayTimeout(() => {
    scheduleReplayStep(0, replayId);
  }, resolveReplayDelayMsForEvent(timeline[0], true));
  return true;
}

function shouldSkipLivePacketDuringReplay(packetTypeRaw) {
  if (!replaySessionState.active && !replaySessionState.finishing) {
    return false;
  }
  const packetType = String(packetTypeRaw || "").toLowerCase();
  return LIVE_PACKET_SKIP_DURING_REPLAY.has(packetType);
}

pendingUrlToken = normalizeToken(urlTokenFromQuery);
setSessionToken(pendingUrlToken || readPersistedToken(), { persist: false });
startStartupAuthGateIfNeeded();

function getSessionToken() {
  if (sessionTokenMemory) {
    return sessionTokenMemory;
  }
  const currentState = store.getState?.() || {};
  const stateToken = normalizeToken(currentState?.user?.token || "");
  if (stateToken) {
    setSessionToken(stateToken);
    return stateToken;
  }
  const persistedToken = readPersistedToken();
  if (persistedToken) {
    setSessionToken(persistedToken, { persist: false });
    return persistedToken;
  }
  return "";
}

function startStartupAuthGateIfNeeded() {
  const hasToken = !useMock && Boolean(getSessionToken());
  startupAuthGateActive = hasToken;
  clearStartupAuthGateTimer();
  if (!startupAuthGateActive) {
    return;
  }
  store.pushLog("[auth] startup gate active (token auto-auth)");
  startupAuthGateTimer = window.setTimeout(() => {
    releaseStartupAuthGate("timeout");
  }, STARTUP_AUTH_GATE_TIMEOUT_MS);
}

function syncSessionTokenFromPacket(packet) {
  const packetType = String(packet?.type || "").toLowerCase();
  if (packetType !== "auth_ok" && packetType !== "login_ok" && packetType !== "register_ok") {
    return;
  }
  const nextToken = normalizeToken(packet?.data?.token || "");
  if (nextToken) {
    // 重要：一旦後端回傳新的 token，就覆蓋本地保存 token（URL token 只作一次性登入用途）。
    setSessionToken(nextToken);
  }
  if (packetType === "auth_ok" && pendingUrlToken) {
    clearTokenFromUrl();
    pendingUrlToken = "";
  }
}

function isAuthIndependentPacketType(typeRaw) {
  const type = String(typeRaw || "").toLowerCase();
  return type === "login" || type === "register" || type === "guest_login" || type === "auth_token";
}

function isAuthRequiredErrorPacket(packet) {
  if (String(packet?.type || "").toLowerCase() !== "error") {
    return false;
  }
  const code = String(packet?.data?.code || "").toUpperCase();
  const message = String(packet?.data?.message || "");
  if (AUTH_REQUIRED_MESSAGE_RE.test(message)) {
    return true;
  }
  if (!code) {
    return false;
  }
  if (code === "AUTH_REQUIRED" || code === "UNAUTHORIZED" || code === "TOKEN_REQUIRED") {
    return true;
  }
  if (code.includes("AUTH") && (code.includes("REQUIRED") || code.includes("MISSING") || code.includes("INVALID") || code.includes("EXPIRED"))) {
    return true;
  }
  return false;
}

function isAuthTokenRejectedError(packet) {
  if (String(packet?.type || "").toLowerCase() !== "error") {
    return false;
  }
  const code = String(packet?.data?.code || "").toUpperCase();
  if (!code) {
    return false;
  }
  return code.includes("AUTH_TOKEN_INVALID")
    || code.includes("TOKEN_INVALID")
    || code.includes("TOKEN_EXPIRED");
}

function isAuthServiceFailureError(packet) {
  if (String(packet?.type || "").toLowerCase() !== "error") {
    return false;
  }
  const message = String(packet?.data?.message || "").trim();
  const code = String(packet?.data?.code || "").toUpperCase();
  if (!message && !code) {
    return false;
  }
  const messageLower = message.toLowerCase();
  return message.includes("驗證服務異常")
    || messageLower.includes("authentication service")
    || messageLower.includes("auth service")
    || code.includes("AUTH_SERVICE")
    || code.includes("VERIFY_SERVICE");
}

function isRecoverableBackgroundWsCloseError(packet) {
  if (String(packet?.type || "").toLowerCase() !== "error") {
    return false;
  }
  if (useMock || !socket?.shouldReconnect) {
    return false;
  }
  const code = String(packet?.data?.code || "").toUpperCase();
  if (!code.startsWith("WS_CLOSED_")) {
    return false;
  }
  const nowMs = Date.now();
  const hiddenRecently = document.hidden
    || (Number.isFinite(lastPageHiddenAt) && lastPageHiddenAt > 0 && nowMs - lastPageHiddenAt <= WS_BACKGROUND_CLOSE_GRACE_MS);
  const resumedRecently = Number.isFinite(lastPageVisibleAt) && lastPageVisibleAt > 0 && nowMs - lastPageVisibleAt <= WS_RESUME_CLOSE_GRACE_MS;
  return hiddenRecently || resumedRecently;
}

function hardResetToAuthByTokenFailure(reason = "token_failure") {
  releaseStartupAuthGate(`hard_reset:${reason}`);
  setSessionToken("");
  pendingUrlToken = "";
  clearTokenFromUrl();
  authRecoveryInProgress = false;
  authRecoveryAttemptCount = 0;
  authRecoveryLastAttemptAt = 0;
  queuedPacketsDuringAuthRecovery.splice(0, queuedPacketsDuringAuthRecovery.length);
  stopReplayPlayback(reason);
  stopActiveVoice();
  store.pushLog(`[auth] token cleared -> back to auth (${reason})`);
  store.resetSession();
}

function queuePacketDuringAuthRecovery(type, data = {}) {
  if (isAuthIndependentPacketType(type)) {
    return;
  }
  queuedPacketsDuringAuthRecovery.push({
    type: String(type || ""),
    data: cloneSafe(data),
    atMs: Date.now(),
  });
  if (queuedPacketsDuringAuthRecovery.length > QUEUED_AUTH_RECOVERY_MAX_KEEP) {
    queuedPacketsDuringAuthRecovery.splice(0, queuedPacketsDuringAuthRecovery.length - QUEUED_AUTH_RECOVERY_MAX_KEEP);
  }
}

function flushQueuedPacketsAfterAuth() {
  if (queuedPacketsDuringAuthRecovery.length <= 0) {
    return;
  }
  const pending = queuedPacketsDuringAuthRecovery.splice(0, queuedPacketsDuringAuthRecovery.length);
  pending.forEach((item) => {
    sendPacket(item.type, item.data, {
      allowQueueDuringAuthRecovery: false,
      internalReason: "auth_recovery_replay",
    });
  });
}

function triggerAutoReauth(trigger = "unknown") {
  if (useMock) {
    return false;
  }
  const token = getSessionToken();
  if (!token) {
    return false;
  }
  const nowMs = Date.now();
  if (nowMs - authRecoveryLastAttemptAt > 30000) {
    authRecoveryAttemptCount = 0;
  }
  if (nowMs - authRecoveryLastAttemptAt < REAUTH_COOLDOWN_MS) {
    return authRecoveryInProgress;
  }
  if (authRecoveryAttemptCount >= AUTO_REAUTH_MAX_ATTEMPTS) {
    return false;
  }
  const ok = socket?.send?.("auth_token", { token });
  if (!ok) {
    socket?.reconnectNow?.();
    return false;
  }
  authRecoveryInProgress = true;
  authRecoveryAttemptCount += 1;
  authRecoveryLastAttemptAt = nowMs;
  lastAutoReauthAt = nowMs;
  pushWsTrace("send", { type: "auth_token", data: { token: "[auto_reauth]", trigger } });
  store.pushLog(`=> auth_token (auto_reauth:${trigger})`);
  store.emit();
  return true;
}

function markAuthRecoverySucceeded(reason = "unknown") {
  const hadRecovery = authRecoveryInProgress || queuedPacketsDuringAuthRecovery.length > 0 || authRecoveryAttemptCount > 0;
  authRecoveryInProgress = false;
  authRecoveryAttemptCount = 0;
  if (hadRecovery) {
    store.pushLog(`[auth] recovered (${reason})`);
    store.emit();
  }
  flushQueuedPacketsAfterAuth();
}

function isAuthRecoveryReadyPacket(typeRaw) {
  const type = String(typeRaw || "").toLowerCase();
  return type === "auth_ok"
    || type === "login_ok"
    || type === "register_ok"
    || type === "lobby_state"
    || type === "game_lobby_state"
    || type === "table_state"
    || type === "table_joined"
    || type === "wallet_state";
}

function isHeroMissingTableStatePacket(packet) {
  if (String(packet?.type || "").toLowerCase() !== "table_state") {
    return false;
  }
  const data = packet?.data || {};
  if (!Object.prototype.hasOwnProperty.call(data, "hero_seat")) {
    return false;
  }
  const heroSeat = Number(data.hero_seat);
  if (Number.isInteger(heroSeat)) {
    return false;
  }

  // 若 hero_seat 暫時為空，但 table.players 裡仍能找到自己，視為仍在牌桌，不自動退回大廳。
  const localUsername = String(store.getState?.()?.user?.username ?? "").trim();
  const players = Array.isArray(data?.table?.players) ? data.table.players : [];
  if (localUsername && players.length > 0) {
    const localPlayer = players.find((player) => String(player?.username ?? "").trim() === localUsername);
    const localSeat = Number(localPlayer?.seat);
    if (Number.isInteger(localSeat)) {
      return false;
    }
  }
  return true;
}

function pushWsTrace(direction, packet) {
  const type = String(packet?.type || "unknown");
  wsTrafficTrace.push({
    atIso: new Date().toISOString(),
    direction,
    type,
    packet: cloneSafe(packet),
  });
  if (wsTrafficTrace.length > WS_TRACE_MAX_KEEP) {
    wsTrafficTrace.splice(0, wsTrafficTrace.length - WS_TRACE_MAX_KEEP);
  }
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWsTraceForExport() {
  const filtered = wsTrafficTrace.filter((item) => {
    const lowerType = String(item?.type || "").toLowerCase();
    return lowerType !== "ping" && lowerType !== "pong";
  });
  const target = filtered.slice(-WS_TRACE_EXPORT_MAX);
  return target
    .map((item, index) => {
      const payload = JSON.stringify(item.packet, null, 2);
      return `#${index + 1}\n[${item.atIso}] ${item.direction.toUpperCase()} ${item.type}\n${payload}`;
    })
    .join("\n\n");
}

function captureGameScreenshotDataUrl() {
  return new Promise((resolve) => {
    const safeFallback = () => {
      try {
        resolve(game?.canvas?.toDataURL("image/png") || "");
      } catch {
        resolve("");
      }
    };

    const renderer = game?.renderer;
    if (!renderer || typeof renderer.snapshot !== "function") {
      safeFallback();
      return;
    }

    try {
      renderer.snapshot((image) => {
        const src = String(image?.src || "");
        if (src.startsWith("data:image/")) {
          resolve(src);
          return;
        }
        safeFallback();
      });
    } catch {
      safeFallback();
    }
  });
}

function createDebugReportHtml(screenshotDataUrl) {
  const wsText = formatWsTraceForExport() || "(目前沒有可匯出的 WS 記錄)";
  const state = store.getState?.() || {};
  const metaLines = [
    `匯出時間: ${new Date().toISOString()}`,
    `模式: ${useMock ? "mock" : "realtime"}`,
    `端點: ${ENDPOINT}`,
    `目前頁面: ${String(state.page || "")}`,
    `連線狀態: ${String(state.connection || "")}`,
    `WS 記錄: 最後 ${WS_TRACE_EXPORT_MAX} 筆（已排除 ping/pong）`,
  ];

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Debug Report</title>
  <style>
    body { font-family: "Segoe UI", "Noto Sans TC", sans-serif; margin: 20px; color: #1f2630; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    h2 { margin: 20px 0 8px; font-size: 18px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #f4f7fb; border: 1px solid #d7dfeb; padding: 12px; border-radius: 8px; }
    img { width: 360px; border: 1px solid #d7dfeb; border-radius: 8px; background: #0b1626; }
  </style>
</head>
<body>
  <h1>遊戲除錯回報</h1>
  <h2>基本資訊</h2>
  <pre>${escapeHtml(metaLines.join("\n"))}</pre>
  <h2>畫面截圖</h2>
  ${screenshotDataUrl ? `<img alt="screenshot" src="${screenshotDataUrl}" />` : `<pre>截圖取得失敗（可能在當下尚未完成渲染）</pre>`}
  <h2>WS 收發記錄</h2>
  <pre>${escapeHtml(wsText)}</pre>
</body>
</html>`;
}

async function downloadDebugReport() {
  const screenshotDataUrl = await captureGameScreenshotDataUrl();
  const html = createDebugReportHtml(screenshotDataUrl);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const filename = `debug_report_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.html`;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function clampDebugButtonPosition(leftRaw, topRaw, buttonWidthRaw, buttonHeightRaw) {
  const viewportWidth = Math.max(1, Math.floor(window.innerWidth || 0));
  const viewportHeight = Math.max(1, Math.floor(window.innerHeight || 0));
  const buttonWidth = Math.max(1, Number(buttonWidthRaw) || 1);
  const buttonHeight = Math.max(1, Number(buttonHeightRaw) || 1);
  const maxLeft = Math.max(0, viewportWidth - buttonWidth);
  const maxTop = Math.max(0, viewportHeight - buttonHeight);
  const left = Math.max(0, Math.min(maxLeft, Number(leftRaw) || 0));
  const top = Math.max(0, Math.min(maxTop, Number(topRaw) || 0));
  return { left, top, maxLeft, maxTop };
}

function applyDebugButtonPosition(leftRaw, topRaw) {
  if (!debugExportButton) {
    return;
  }
  const rect = debugExportButton.getBoundingClientRect();
  const next = clampDebugButtonPosition(leftRaw, topRaw, rect.width, rect.height);
  debugExportButton.style.left = `${Math.round(next.left)}px`;
  debugExportButton.style.top = `${Math.round(next.top)}px`;
  debugExportButton.style.right = "auto";
  debugExportButton.style.bottom = "auto";
}

function persistDebugButtonPosition() {
  if (!debugExportButton) {
    return;
  }
  const rect = debugExportButton.getBoundingClientRect();
  const next = clampDebugButtonPosition(rect.left, rect.top, rect.width, rect.height);
  const xRatio = next.maxLeft > 0 ? next.left / next.maxLeft : 0;
  const yRatio = next.maxTop > 0 ? next.top / next.maxTop : 0;
  try {
    window.localStorage?.setItem?.(DEBUG_BUTTON_POSITION_STORAGE_KEY, JSON.stringify({
      xRatio: clamp01(xRatio),
      yRatio: clamp01(yRatio),
    }));
  } catch {}
}

function restoreDebugButtonPosition() {
  if (!debugExportButton) {
    return;
  }
  try {
    const raw = window.localStorage?.getItem?.(DEBUG_BUTTON_POSITION_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    const xRatio = clamp01(parsed?.xRatio);
    const yRatio = clamp01(parsed?.yRatio);
    const rect = debugExportButton.getBoundingClientRect();
    const viewportWidth = Math.max(1, Math.floor(window.innerWidth || 0));
    const viewportHeight = Math.max(1, Math.floor(window.innerHeight || 0));
    const maxLeft = Math.max(0, viewportWidth - Math.max(1, rect.width));
    const maxTop = Math.max(0, viewportHeight - Math.max(1, rect.height));
    applyDebugButtonPosition(maxLeft * xRatio, maxTop * yRatio);
  } catch {}
}

function keepDebugButtonInViewport() {
  if (!debugExportButton) {
    return;
  }
  const rect = debugExportButton.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }
  applyDebugButtonPosition(rect.left, rect.top);
}

function enableDebugButtonDrag() {
  if (!debugExportButton) {
    return;
  }
  const button = debugExportButton;
  button.style.touchAction = "none";

  const clearHoldTimer = () => {
    if (debugButtonDragState?.holdTimer) {
      window.clearTimeout(debugButtonDragState.holdTimer);
      debugButtonDragState.holdTimer = 0;
    }
  };

  const endDrag = (event) => {
    if (!debugButtonDragState) {
      return;
    }
    const state = debugButtonDragState;
    if (Number(event?.pointerId) !== state.pointerId) {
      return;
    }
    clearHoldTimer();
    if (state.dragging) {
      debugButtonSuppressClickUntil = Date.now() + 300;
      persistDebugButtonPosition();
    }
    button.classList.remove("is-dragging");
    try {
      button.releasePointerCapture?.(state.pointerId);
    } catch {}
    debugButtonDragState = null;
  };

  button.addEventListener("pointerdown", (event) => {
    if (button.disabled) {
      return;
    }
    if (event.pointerType !== "touch" && event.button !== 0) {
      return;
    }
    event.preventDefault();
    const rect = button.getBoundingClientRect();
    debugButtonDragState = {
      pointerId: Number(event.pointerId),
      startX: Number(event.clientX),
      startY: Number(event.clientY),
      startLeft: Number(rect.left),
      startTop: Number(rect.top),
      dragging: false,
      holdTimer: window.setTimeout(() => {
        if (!debugButtonDragState || debugButtonDragState.pointerId !== Number(event.pointerId)) {
          return;
        }
        debugButtonDragState.dragging = true;
        button.classList.add("is-dragging");
      }, DEBUG_BUTTON_DRAG_HOLD_MS),
    };
    try {
      button.setPointerCapture?.(event.pointerId);
    } catch {}
  });

  button.addEventListener("pointermove", (event) => {
    if (!debugButtonDragState || Number(event.pointerId) !== debugButtonDragState.pointerId) {
      return;
    }
    const dx = Number(event.clientX) - debugButtonDragState.startX;
    const dy = Number(event.clientY) - debugButtonDragState.startY;
    if (!debugButtonDragState.dragging) {
      const distance = Math.hypot(dx, dy);
      if (distance < DEBUG_BUTTON_DRAG_START_DISTANCE_PX) {
        return;
      }
      clearHoldTimer();
      debugButtonDragState.dragging = true;
      button.classList.add("is-dragging");
    }
    event.preventDefault();
    applyDebugButtonPosition(
      debugButtonDragState.startLeft + dx,
      debugButtonDragState.startTop + dy,
    );
  });

  button.addEventListener("pointerup", endDrag);
  button.addEventListener("pointercancel", endDrag);
}

function updateDebugButtonVisibility() {
  if (!debugExportButton) {
    return;
  }
  debugExportButton.style.display = showTestDebugUi ? "block" : "none";
}

function ensureDebugExportButton() {
  if (!showTestDebugUi) {
    return;
  }
  if (debugExportButton) {
    return;
  }
  debugExportButton = document.createElement("button");
  debugExportButton.id = "debug-export-btn";
  debugExportButton.type = "button";
  debugExportButton.textContent = "除錯下載";
  debugExportButton.addEventListener("click", async (event) => {
    if (Date.now() < debugButtonSuppressClickUntil) {
      event.preventDefault();
      return;
    }
    const oldLabel = debugExportButton.textContent;
    debugExportButton.disabled = true;
    debugExportButton.textContent = "匯出中...";
    try {
      await downloadDebugReport();
    } finally {
      debugExportButton.disabled = false;
      debugExportButton.textContent = oldLabel;
    }
  });
  document.body.appendChild(debugExportButton);
  restoreDebugButtonPosition();
  enableDebugButtonDrag();
  updateDebugButtonVisibility();
}

// 把 store 裡的 page 字串，轉成對應 scene key
function pageToScene(page) {
  if (page === "register") {
    return "register";
  }
  if (page === "lobby") {
    return "lobby";
  }
  if (page === "gameLobby") {
    return "gameLobby";
  }
  if (page === "table") {
    return "table";
  }
  if (page === "bigTwo") {
    return "bigTwo";
  }
  return "auth";
}

// 依模式建立 WebSocket client
// - mock 模式：用本機假資料流程
// - realtime：真的連到後端 WS
function createSocket() {
  let client = null;
  const sendAutoReauthIfNeeded = () => {
    triggerAutoReauth("socket_open");
  };

  const common = {
    // 連線狀態變動時，同步寫到 store
    onStatus: (status) => {
      store.setConnection(status);
      onSocketStatus(status);
      if (status === "open") {
        wsOpenCount += 1;
        const currentErrorCode = String(store.getState?.()?.lastError?.code || "").toUpperCase();
        if (currentErrorCode.startsWith("WS_CLOSED_")) {
          store.clearLastError?.();
        }
        sendAutoReauthIfNeeded();
      }
    },

    // 收到封包時：
    // 1) 先收集音效 cue（避免同一輪 render 時錯過）
    // 2) 再交給 store 更新畫面資料
    onPacket: (packet) => {
      onSocketPacketForQuality(packet, client);
      pushWsTrace("recv", packet);
      const consumed = handlePacket(packet);
      if (!consumed) {
        store.applyPacket(packet);
      }
      const packetType = String(packet?.type || "").toLowerCase();
      if (packetType === "hand_end") {
        checkAndExecutePendingTableExit(packet?.data ?? {});
        if (heroSwitchedMidHand) {
          heroSwitchedMidHand = false;
          heroOldTableId = "";
          heroOldSeatData = null;
          heroSwitchOldHandDone = false;
          sessionStorage.removeItem(HERO_OLD_TABLE_STORAGE_KEY);
          sessionStorage.removeItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY);
          sessionStorage.removeItem(HERO_SWITCH_DONE_STORAGE_KEY);
          store.clearSwitchPending?.();
        }
      }
      if (packetType === "table_joined" && heroSwitchedMidHand && !packet?.data?.waiting_this_hand) {
        window.__APP__?.clearHeroSwitchMode?.();
        store.clearSwitchPending?.();
      }
    },
  };
  if (useMock) {
    client = new MockSocketClient(common);
    return client;
  }
  client = new SocketClient({
    url: ENDPOINT,
    ...common,
  });
  return client;
}

const socket = createSocket();
const persistedAudioPrefs = readAudioPrefsFromStorage();
const initialMasterAudioEnabled = resolveAudioBoolPref(persistedAudioPrefs.masterAudioEnabled, true);
const initialMasterVolume = resolveAudioVolumePref(persistedAudioPrefs.masterVolume, DEFAULT_MASTER_VOLUME);
const initialBgmEnabled = resolveAudioBoolPref(persistedAudioPrefs.bgmEnabled, true);
const initialBgmVolume = resolveAudioVolumePref(persistedAudioPrefs.bgmVolume, DEFAULT_BGM_VOLUME);
const initialSfxEnabled = resolveAudioBoolPref(persistedAudioPrefs.sfxEnabled, true);
const initialSfxVolume = resolveAudioVolumePref(persistedAudioPrefs.sfxVolume, DEFAULT_SFX_VOLUME);
const initialVoiceEnabled = resolveAudioBoolPref(persistedAudioPrefs.voiceEnabled, true);
const initialVoiceVolume = resolveAudioVolumePref(persistedAudioPrefs.voiceVolume, DEFAULT_VOICE_VOLUME);

// 統一送封包入口
// 所有 scene 要送資料到後端，都走這裡
function sendPacket(type, data = {}, options = {}) {
  if (replaySessionState.active && String(type || "").toLowerCase() !== "hand_replay") {
    stopReplayPlayback(`send_${String(type || "unknown")}`);
  }
  const allowQueueDuringAuthRecovery = options?.allowQueueDuringAuthRecovery !== false;
  const internalReason = String(options?.internalReason || "");
  if (authRecoveryInProgress && Date.now() - authRecoveryLastAttemptAt > AUTH_RECOVERY_QUEUE_WINDOW_MS) {
    authRecoveryInProgress = false;
  }
  if (authRecoveryInProgress && allowQueueDuringAuthRecovery && !isAuthIndependentPacketType(type)) {
    queuePacketDuringAuthRecovery(type, data);
    store.pushLog(`=> ${type} (queued:auth_recovery)`);
    store.emit();
    return true;
  }

  const ok = socket.send(type, data);
  if (!ok) {
    if (allowQueueDuringAuthRecovery && authRecoveryInProgress && !isAuthIndependentPacketType(type)) {
      queuePacketDuringAuthRecovery(type, data);
      store.pushLog(`=> ${type} (queued:ws_not_open)`);
      store.emit();
      return true;
    }
    // 若 WS 尚未開啟，寫入錯誤到 store 給 UI 顯示
    store.applyPacket({
      type: "error",
      data: {
        code: "WS_NOT_OPEN",
        message: `連線尚未建立，無法送出：${type}`,
      },
    });
    return false;
  }
  pushWsTrace("send", { type, data });
  if (internalReason) {
    store.pushLog(`=> ${type} (${internalReason})`);
  } else {
    store.pushLog(`=> ${type}`);
  }
  store.emit();
  return true;
}

// 掛在全域，讓各 scene 可以透過 window.__APP__ 取得共用能力
window.__APP__ = {
  store,
  socket,
  sendPacket,
  markBootReady,
  shouldHoldBootScene,
  setBootSceneRef,
  masterAudioEnabled: initialMasterAudioEnabled,
  masterVolume: initialMasterVolume,
  bgmEnabled: initialBgmEnabled,
  bgmVolume: initialBgmVolume,
  sfxEnabled: initialSfxEnabled,
  sfxVolume: initialSfxVolume,
  sfxVoiceEnabled: initialSfxEnabled && initialVoiceEnabled, // legacy compatibility
  voiceEnabled: initialVoiceEnabled,
  voiceVolume: initialVoiceVolume,
  mode: useMock ? "mock" : "realtime",
  endpoint: ENDPOINT,
  variantId: selectedVariant.id,
  assetBase: selectedVariant.assetBase || "",
  uiFontFamily: selectedVariant.fontFamily || DEFAULT_UI_FONT_STACK,
  voice: selectedVariant.voice || {},
  wsTrafficTrace,
  voiceCueQueue,
  getConnectionQuality: () => ({
    status: wsQualityState.status,
    averageRttMs: averageWsRtt(),
    lastPacketAt: wsQualityState.lastPacketAt,
    lastPongAt: wsQualityState.lastPongAt,
    reconnectAttempt: Number(socket?.reconnectAttempt ?? 0),
    lastAutoReauthAt,
    endpoint: ENDPOINT,
  }),
  downloadDebugReport,
  consumeVoiceCues,
  playVoiceByKey,
  playHandReplayPayload: (payload) => {
    if (!payload) {
      return false;
    }
    const packet = String(payload?.type || "").toLowerCase() === "hand_replay_ok"
      ? payload
      : { type: "hand_replay_ok", data: payload?.data ?? payload };
    return startReplayPlayback(packet);
  },
  isHandReplayActive: () => replaySessionState.active || replaySessionState.finishing,
  isHandReplayRunning: () => replaySessionState.active,
  isHandReplayFastMode: () => isReplayFastMode(),
  setHandReplayFastMode: (enabled) => {
    setReplayFastMode(enabled);
    store.emit();
  },
  stopHandReplay: (reason = "manual_stop") => {
    stopReplayPlayback(reason);
  },
  notifyReplayHandResultClosed: () => {
    if (!replaySessionState.active && !replaySessionState.finishing) return;
    const rp = replaySessionState.returnPage
      || (replaySessionState.fromScene === "gameLobby" ? "gameLobby" : "lobby");
    stopReplayPlayback("hand_result_closed");
    store.openDailySettlementAfterReplay(rp);
  },
  persistAudioSettings: () => {
    writeAudioPrefsToStorage(window.__APP__);
  },
  setMasterAudioEnabled: (enabled) => {
    window.__APP__.masterAudioEnabled = Boolean(enabled);
    if (!window.__APP__.masterAudioEnabled) {
      stopActiveVoice();
    }
    window.__APP__.persistAudioSettings();
  },
  setMasterVolume: (volume) => {
    window.__APP__.masterVolume = clamp01(volume);
    window.__APP__.persistAudioSettings();
  },
  setBgmEnabled: (enabled) => {
    window.__APP__.bgmEnabled = Boolean(enabled);
    window.__APP__.persistAudioSettings();
  },
  setBgmVolume: (volume) => {
    window.__APP__.bgmVolume = clamp01(volume);
    window.__APP__.persistAudioSettings();
  },
  setSfxEnabled: (enabled) => {
    window.__APP__.sfxEnabled = Boolean(enabled);
    window.__APP__.sfxVoiceEnabled = window.__APP__.sfxEnabled && window.__APP__.voiceEnabled;
    window.__APP__.persistAudioSettings();
  },
  setSfxVolume: (volume) => {
    window.__APP__.sfxVolume = clamp01(volume);
    window.__APP__.persistAudioSettings();
  },
  setSfxVoiceEnabled: (enabled) => {
    const next = Boolean(enabled);
    window.__APP__.sfxEnabled = next;
    window.__APP__.voiceEnabled = next;
    window.__APP__.sfxVoiceEnabled = next;
    if (!next) stopActiveVoice();
    window.__APP__.persistAudioSettings();
  },
  setVoiceEnabled: (enabled) => {
    window.__APP__.voiceEnabled = Boolean(enabled);
    window.__APP__.sfxVoiceEnabled = window.__APP__.sfxEnabled && window.__APP__.voiceEnabled;
    if (!window.__APP__.voiceEnabled) {
      stopActiveVoice();
    }
    window.__APP__.persistAudioSettings();
  },
  setVoiceVolume: (volume) => {
    window.__APP__.voiceVolume = clamp01(volume);
    window.__APP__.persistAudioSettings();
  },
  getBgmOutputVolume: (scale = 1) => {
    if (window.__APP__.masterAudioEnabled === false || window.__APP__.bgmEnabled === false) {
      return 0;
    }
    return clamp01(window.__APP__.masterVolume ?? DEFAULT_MASTER_VOLUME)
      * clamp01(window.__APP__.bgmVolume ?? DEFAULT_BGM_VOLUME)
      * clamp01(scale);
  },
  getSfxOutputVolume: (scale = 1) => {
    if (window.__APP__.masterAudioEnabled === false || window.__APP__.sfxEnabled === false) {
      return 0;
    }
    return clamp01(window.__APP__.masterVolume ?? DEFAULT_MASTER_VOLUME)
      * clamp01(window.__APP__.sfxVolume ?? DEFAULT_SFX_VOLUME)
      * clamp01(scale);
  },
  getVoiceOutputVolume: (scale = 1) => {
    if (window.__APP__.masterAudioEnabled === false || window.__APP__.voiceEnabled === false) {
      return 0;
    }
    return clamp01(window.__APP__.masterVolume ?? DEFAULT_MASTER_VOLUME)
      * clamp01(window.__APP__.voiceVolume ?? DEFAULT_VOICE_VOLUME)
      * clamp01(scale);
  },
  setPendingTableExit(type, tableId, buyin) {
    pendingTableExit = { type, tableId: String(tableId ?? ""), buyin: Number(buyin) || 0 };
  },
  clearPendingTableExit() {
    pendingTableExit = null;
  },
  hasPendingTableExit() {
    return pendingTableExit !== null;
  },
  getPendingTableExit() {
    return pendingTableExit ? { ...pendingTableExit } : null;
  },
  setHeroSwitchedMidHand(value) {
    heroSwitchedMidHand = Boolean(value);
    if (heroSwitchedMidHand) {
      sessionStorage.setItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY);
    }
  },
  isHeroSwitchedMidHand() {
    return heroSwitchedMidHand;
  },
  setHeroOldTableId(id) {
    heroOldTableId = String(id ?? "");
    if (heroOldTableId) {
      sessionStorage.setItem(HERO_OLD_TABLE_STORAGE_KEY, heroOldTableId);
    } else {
      sessionStorage.removeItem(HERO_OLD_TABLE_STORAGE_KEY);
    }
  },
  getHeroOldTableId() {
    return heroOldTableId;
  },
  setHeroOldSeatData(data) {
    heroOldSeatData = data ? { ...data } : null;
  },
  getHeroOldSeatData() {
    return heroOldSeatData ? { ...heroOldSeatData } : null;
  },
  isHeroSwitchOldHandDone() {
    return heroSwitchOldHandDone;
  },
  clearHeroSwitchMode() {
    heroSwitchedMidHand = false;
    heroOldTableId = "";
    heroOldSeatData = null;
    heroSwitchOldHandDone = false;
    sessionStorage.removeItem(HERO_OLD_TABLE_STORAGE_KEY);
    sessionStorage.removeItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY);
    sessionStorage.removeItem(HERO_SWITCH_DONE_STORAGE_KEY);
  },
};
window.__APP__.persistAudioSettings?.();

function checkAndExecutePendingTableExit(data) {
  if (!pendingTableExit) {
    return;
  }
  const packetTableId = String(data.table_id ?? data.table?.table_id ?? "");
  const pending = pendingTableExit;
  if (pending.tableId && packetTableId && packetTableId !== pending.tableId) {
    return;
  }
  pendingTableExit = null;
  if (pending.type === "leave") {
    const _gameId = String(
      store.getState?.()?.table?.game_id || store.getState?.()?.gameLobby?.game_id || "texas_holdem",
    );
    store.beginLeaveTable(pending.tableId);
    sendPacket("leave_room", {});
    sendPacket("enter_game", { game_id: _gameId });
    return;
  }
  if (pending.type === "switch") {
    heroSwitchedMidHand = false;
    heroOldTableId = "";
    heroOldSeatData = null;
    heroSwitchOldHandDone = false;
    sessionStorage.removeItem(HERO_OLD_TABLE_STORAGE_KEY);
    sessionStorage.removeItem(HERO_SWITCHED_MID_HAND_STORAGE_KEY);
    sessionStorage.removeItem(HERO_SWITCH_DONE_STORAGE_KEY);
    store.clearSwitchPending?.();
  }
}

// 額外封包處理（目前沒有自訂邏輯，先保留擴充點）
function handlePacket(packet) {
  const packetType = String(packet?.type || "").toLowerCase();
  if (isRecoverableBackgroundWsCloseError(packet)) {
    const closeCode = String(packet?.data?.code || "WS_CLOSED");
    store.pushLog(`[ws] background close suppressed (${closeCode})`);
    return true;
  }
  if (startupAuthGateActive && isAuthRecoveryReadyPacket(packetType)) {
    releaseStartupAuthGate(`packet:${packetType}`);
  }
  if (packetType === "hand_replay_ok") {
    return startReplayPlayback(packet);
  }
  if (shouldSkipLivePacketDuringReplay(packetType)) {
    return true;
  }
  syncSessionTokenFromPacket(packet);

  // 重連後若後端已回 game_lobby_state，代表目前不在牌桌：
  // 強制切回 gameLobby 並清掉牌桌狀態，避免畫面停留在舊桌。
  if (packetType === "game_lobby_state" && !replaySessionState.active) {
    const page = String(store.getState?.()?.page || "");
    if (page === "table" || page === "bigTwo") {
      store.pushLog("[ws] game_lobby_state -> force back to gameLobby");
      store.forceBackToGameLobby?.();
    }
  }

  if (packetType === "logout_ok") {
    setSessionToken("");
    window.location.reload();
    return true;
  }

  if (isAuthTokenRejectedError(packet) || isAuthServiceFailureError(packet)) {
    // token 已失效或驗證服務異常：直接回登入頁，避免持續重驗證與錯誤彈窗循環。
    hardResetToAuthByTokenFailure("auth_rejected");
    return true;
  }

  if (isAuthRequiredErrorPacket(packet)) {
    const recovered = triggerAutoReauth("auth_required_error");
    if (recovered) {
      store.pushLog("<= error AUTH_REQUIRED (auto_reauth)");
      store.emit();
      return true;
    }
  }

  if (authRecoveryInProgress && isAuthRecoveryReadyPacket(packetType)) {
    markAuthRecoverySucceeded(packetType);
  }

  // 斷線重連後若後端告知 hero_seat=null，代表已不在牌桌，主動要求遊戲大廳資料。
  if (!useMock && isHeroMissingTableStatePacket(packet)) {
    const nowMs = Date.now();
    if (nowMs - lastAutoBackToGameLobbyAt >= AUTO_BACK_TO_GAME_LOBBY_COOLDOWN_MS) {
      const gameId = String(
        packet?.data?.table?.game_id
        || store.getState?.()?.gameLobby?.game_id
        || "texas_holdem",
      );
      sendPacket("enter_game", { game_id: gameId }, {
        internalReason: "auto_back_game_lobby",
      });
      lastAutoBackToGameLobbyAt = nowMs;
    }
  }

  queueVoiceCueFromPacket(packet);
  return false;
}

const DPR = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);

// Make Phaser text render at native pixel density when responsive scenes zoom up.
{
  const originalAddText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
    const merged = {
      shadow: {
        offsetX: Math.round(1 * DPR),
        offsetY: Math.round(2 * DPR),
        color: "#000000",
        blur: Math.round(8 * DPR),
        fill: true,
      },
      resolution: DPR,
      ...(style || {}),
    };
    return originalAddText.call(this, x, y, text, merged);
  };
}

// 建立 Phaser 遊戲實例
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "phaser-root",
  width: Math.floor((window.innerWidth || 720) * DPR),
  height: Math.floor((window.innerHeight || 1440) * DPR),
  transparent: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
  // 開啟 DOM 容器，讓 scene.add.dom(...) 可用（手機鍵盤需要真實 input）
  dom: {
    createContainer: true,
  },
  callbacks: {
    postBoot: (g) => {
      // Phaser calls scene.events.shutdown() when a scene stops, which removes ALL
      // event listeners — including these CREATE/WAKE listeners. Re-register them
      // after each shutdown so they survive stop→restart cycles.
      function setupSceneListeners(scene) {
        scene.layout = layout;
        scene.events.on(Phaser.Scenes.Events.CREATE, () => applySceneCamera(scene));
        scene.events.on(Phaser.Scenes.Events.WAKE, () => applySceneCamera(scene));
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
          // After shutdown clears all listeners, re-add them on next tick
          // (setTimeout fires before the next rAF/game-tick so CREATE is ready
          //  by the time game.scene.start() processes the scene again)
          setTimeout(() => setupSceneListeners(scene), 0);
        });
      }
      g.scene.scenes.forEach(setupSceneListeners);
    },
  },
  scene: selectedVariant.scenes,
});
ensureDebugExportButton();

// Use variant art as the CSS background outside the game strip.
(function applyVariantBackground() {
  const backgroundImagePath = selectedVariant.backgroundImagePath;
  if (!backgroundImagePath) {
    return;
  }
  const crop = selectedVariant.backgroundCrop;
  const applyUrl = (url) => {
    const style = document.createElement("style");
    style.textContent = `body::before { background-image: url("${url}") !important; }`;
    document.head.appendChild(style);
  };
  if (!crop) {
    applyUrl(backgroundImagePath);
    return;
  }
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        applyUrl(URL.createObjectURL(blob));
      }, "image/webp");
    } catch {}
  };
  img.src = backgroundImagePath;
})();

document.addEventListener("visibilitychange", () => {
  clearVoiceCueQueue();
  if (document.hidden) {
    lastPageHiddenAt = Date.now();
    stopReplayPlayback("hidden");
    stopActiveVoice();
    // Explicitly pause all sounds so Phaser marks them as paused.
    // Safari suspends the AudioContext on minimize/background; without this,
    // resumeAll() on restore has nothing to resume (BGM stays silent).
    game.sound?.pauseAll?.();
    return;
  }
  lastPageVisibleAt = Date.now();
  const _resumeAudio = () => {
    game.sound?.resumeAll?.();
    game.scene?.getScenes?.(true)?.forEach?.((s) => s._syncBgm?.());
  };
  if (game.sound?.context?.state === "suspended") {
    game.sound.context.resume().then(_resumeAudio).catch(_resumeAudio);
  } else {
    _resumeAudio();
  }
  const token = getSessionToken();
  if (!token || useMock) {
    return;
  }
  // 回到前景時主動立刻重連，跳過原本 backoff 等待。
  socket.reconnectNow?.();
  if (String(store.getState?.()?.connection || "") === "open") {
    triggerAutoReauth("visibility_resume");
    return;
  }
  window.setTimeout(() => {
    if (document.hidden || useMock || !getSessionToken()) {
      return;
    }
    socket.reconnectNow?.();
    if (String(store.getState?.()?.connection || "") === "open") {
      triggerAutoReauth("visibility_resume_retry");
    }
  }, WS_RESUME_RECONNECT_RETRY_MS);
});
window.addEventListener("pagehide", () => {
  stopReplayPlayback("pagehide");
  clearVoiceCueQueue();
  stopActiveVoice();
});
// Safari on macOS sometimes fires blur/focus instead of visibilitychange when the
// window is minimized to the dock. We debounce by 200 ms so a quick focus-switch
// (e.g. clicking devtools) doesn't cause an audible pause/resume stutter.
let _blurAudioPauseTimer = null;
window.addEventListener("blur", () => {
  if (_blurAudioPauseTimer) return;
  _blurAudioPauseTimer = window.setTimeout(() => {
    _blurAudioPauseTimer = null;
    // Skip if visibilitychange already handled the pause.
    if (!document.hidden) {
      game.sound?.pauseAll?.();
    }
  }, 200);
});
// Desktop browsers fire "focus" when the window is un-minimized (does not trigger visibilitychange).
window.addEventListener("focus", () => {
  // Cancel a pending blur-pause if focus returns quickly (prevents stutter).
  if (_blurAudioPauseTimer) {
    window.clearTimeout(_blurAudioPauseTimer);
    _blurAudioPauseTimer = null;
    return;
  }
  if (document.hidden) return;
  const _resumeOnFocus = () => {
    game.sound?.resumeAll?.();
    game.scene?.getScenes?.(true)?.forEach?.((s) => s._syncBgm?.());
  };
  if (game.sound?.context?.state === "suspended") {
    game.sound.context.resume().then(_resumeOnFocus).catch(_resumeOnFocus);
  } else {
    _resumeOnFocus();
  }
});

const BASE_WIDTH = 720;
const BASE_HEIGHT = 1440;
let layoutRaf = 0;
const UA = navigator.userAgent || "";
const IS_IN_APP_BROWSER = /Line|Telegram/i.test(UA);
const IS_COARSE_POINTER = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
// Pre-compute correct zoom at module load so applySceneCamera works correctly
// the moment the first scene's CREATE event fires (before the first rAF cycle).
const _initW = Math.max(1, window.innerWidth || 1);
const _initH = Math.max(1, window.innerHeight || 1);
let currentDesignZoom = updateLayout(_initW, _initH, 0, 0);
let currentLegacyZoom = Math.min(_initW / BASE_WIDTH, _initH / BASE_HEIGHT);

function applySceneCamera(scene) {
  const cam = scene?.cameras?.main;
  if (!cam) {
    return;
  }
  if (scene.useResponsiveLayout) {
    const zoom = currentDesignZoom * DPR;
    const canvasW = game.canvas.width;
    const canvasH = game.canvas.height;
    // Guard: skip if dimensions or zoom are invalid — will be called again on next layout update
    if (!canvasW || !canvasH || !Number.isFinite(zoom) || zoom <= 0) {
      return;
    }
    const stripW = Math.round(layout.width * zoom);
    const stripX = Math.max(0, Math.round(canvasW / 2 - stripW / 2));
    if (stripX > 0) {
      const clampedW = Math.min(stripW, canvasW - stripX);
      cam.setViewport(stripX, 0, clampedW, canvasH);
    } else {
      cam.setViewport(0, 0, canvasW, canvasH);
    }
    cam.setZoom(zoom);
    cam.centerOn(layout.centerX, layout.centerY);
    return;
  }
  const legacyZoom = currentLegacyZoom * DPR;
  if (Number.isFinite(legacyZoom) && legacyZoom > 0) {
    cam.setZoom(legacyZoom);
    cam.centerOn(BASE_WIDTH / 2, BASE_HEIGHT / 2);
  }
}

function applyViewportCanvasLayout() {
  const root = document.getElementById("phaser-root");
  const canvas = game.canvas;
  if (!root || !canvas) {
    return;
  }

  // Use innerWidth for the horizontal dimension: it is always an integer that
  // exactly matches the CSS viewport width.  On iOS Safari, visualViewport.width
  // can be a non-integer (sub-pixel) value that Math.floor rounds down, leaving
  // a thin strip of HTML background visible on the right edge of the canvas.
  const viewportWidth = Math.max(1, window.innerWidth || Math.floor(window.visualViewport?.width || 1));
  const rawVisualH = Math.max(1, Math.floor(window.visualViewport?.height || window.innerHeight));
  const innerH = Math.max(1, Math.floor(window.innerHeight));

  // With interactive-widget=resizes-visual (set in <meta viewport>), the software keyboard
  // shrinks only the visual viewport, not the layout viewport (innerHeight). When the gap
  // exceeds 100px we infer the keyboard is open and use innerHeight so the game canvas stays
  // stable at its pre-keyboard size. For URL bar show/hide both values change together, so
  // rawVisualH is used and the canvas correctly follows the real visible area.
  // On iOS Safari < 15.4, innerH also shrinks with the keyboard, so use the
  // larger of innerH vs the height captured at startup (_initH) as the baseline.
  const baseH = Math.max(innerH, _initH);
  const keyboardIsOpen = Boolean(window.visualViewport) && (baseH - rawVisualH) > 100;
  const viewportHeight = keyboardIsOpen ? baseH : rawVisualH;

  root.style.width = `${viewportWidth}px`;
  root.style.height = `${viewportHeight}px`;

  // 桌機/平板橫向才顯示除錯報告按鈕（與畫布縮放邏輯解耦）
  const useLandscapeRatioMode = viewportWidth > viewportHeight && !(IS_IN_APP_BROWSER && IS_COARSE_POINTER);
  isDesktopDebugMode = useLandscapeRatioMode;
  updateDebugButtonVisibility();

  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;
  canvas.style.left = "0px";
  canvas.style.top = "0px";

  const internalW = Math.max(1, Math.round(viewportWidth * DPR));
  const internalH = Math.max(1, Math.round(viewportHeight * DPR));
  game.scale.resize(internalW, internalH);

  let safeAreaBottomPx = 0;
  let safeAreaTopPx = 0;
  try {
    const cs = getComputedStyle(document.documentElement);
    safeAreaBottomPx = parseFloat(cs.getPropertyValue("--sab")) || 0;
    safeAreaTopPx = parseFloat(cs.getPropertyValue("--sat")) || 0;
  } catch {}

  currentDesignZoom = updateLayout(viewportWidth, viewportHeight, safeAreaBottomPx, safeAreaTopPx);
  currentLegacyZoom = Math.min(viewportWidth / BASE_WIDTH, viewportHeight / BASE_HEIGHT);
  game.scene.scenes.forEach((scene) => {
    scene.layout = layout;
    applySceneCamera(scene);
  });
  keepDebugButtonInViewport();
  window.dispatchEvent(new CustomEvent("canvas-layout-updated"));
}

function queueViewportCanvasLayout() {
  if (layoutRaf) {
    window.cancelAnimationFrame(layoutRaf);
  }
  layoutRaf = window.requestAnimationFrame(() => {
    layoutRaf = 0;
    applyViewportCanvasLayout();
  });
}

window.addEventListener("resize", queueViewportCanvasLayout);
window.addEventListener("orientationchange", queueViewportCanvasLayout);
window.visualViewport?.addEventListener("resize", queueViewportCanvasLayout);
window.visualViewport?.addEventListener("scroll", queueViewportCanvasLayout);
queueViewportCanvasLayout();

// When the browser autoplay policy blocks audio on page load, Phaser suspends the
// AudioContext and waits for the first user gesture to unlock it.  Once unlocked,
// trigger _syncBgm() on every active scene so BGM starts immediately without
// requiring an extra click on the mute/unmute button.
game.sound?.once?.("unlocked", () => {
  game.scene?.getScenes?.(true)?.forEach?.((s) => s._syncBgm?.());
});

let bootstrapLayoutFrames = 0;
game.events.on(Phaser.Core.Events.POST_STEP, () => {
  if (bootstrapLayoutFrames >= 30) {
    return;
  }
  bootstrapLayoutFrames += 1;
  queueViewportCanvasLayout();
});

// Mobile browsers (especially Android Chrome) can take 300–600 ms to settle the
// address-bar / viewport height after a hard refresh.  The POST_STEP bootstrap
// above covers the first ~500 ms at 60 fps; these deferred calls catch any
// stragglers (e.g. iOS Safari bouncing between 100dvh and 100svh on first paint).
setTimeout(queueViewportCanvasLayout, 300);
setTimeout(queueViewportCanvasLayout, 600);
setTimeout(queueViewportCanvasLayout, 1200);

// 目前正在顯示的 scene
let activeScene = null;

// 根據 page 切換 scene（同時關閉其他 scene）
function switchSceneByPage(page) {
  const next = pageToScene(page);
  console.log("[SWITCH] switchSceneByPage", page, "→", next, "activeScene=", activeScene, "isActive(table)=", game.scene.isActive("table"), "isActive(gameLobby)=", game.scene.isActive("gameLobby"));
  if (startupAuthGateActive && (next === "auth" || next === "register")) {
    console.log("[SWITCH] blocked by startupAuthGate");
    return;
  }
  if (startupAuthGateActive) {
    releaseStartupAuthGate(`page:${next}`);
  }
  if (next === activeScene) {
    // Even when activeScene matches, stop any stale other route scenes that snuck in.
    SCENES.forEach((key) => {
      if (key === next) return;
      if (game.scene.isActive(key) || game.scene.isSleeping(key)) game.scene.stop(key);
    });
    console.log("[SWITCH] same scene, cleaned up stale scenes");
    return;
  }
  if (!game.scene.keys[next]) {
    console.log("[SWITCH] scene key not found:", next);
    return;
  }
  if (game.scene.isActive(next)) {
    // Target already active — still stop other scenes that should not be running.
    SCENES.forEach((key) => {
      if (key === next) return;
      if (game.scene.isActive(key) || game.scene.isSleeping(key)) game.scene.stop(key);
    });
    activeScene = next;
    console.log("[SWITCH] target already active, stopped others");
    return;
  }
  SCENES.forEach((key) => {
    if (key === next) return;
    if (game.scene.isActive(key)) {
      // Sleep lobby/gameLobby (not stop) when entering replay so it can be woken instantly on return
      if ((key === "lobby" || key === "gameLobby") && next === "table" && replaySessionState.active) {
        game.scene.sleep(key);
      } else {
        game.scene.stop(key);
      }
    } else if (game.scene.isSleeping(key)) {
      // Clean up stale sleeping scenes that are not the destination
      game.scene.stop(key);
    }
  });
  if (game.scene.isActive("boot")) {
    game.scene.stop("boot");
  }
  if (game.scene.isSleeping(next)) {
    console.log("[SWITCH] waking scene:", next);
    game.scene.wake(next);
  } else {
    console.log("[SWITCH] starting scene:", next);
    game.scene.start(next);
  }
  activeScene = next;
  console.log("[SWITCH] done, activeScene=", activeScene);
}

let routerBound = false;
let overlayScenesStarted = false;

function ensureOverlayScenesStarted() {
  if (overlayScenesStarted) {
    return;
  }
  if (!game.scene.keys?.errorModal) {
    return;
  }
  // errorModal 是常駐 overlay scene；連線品質改由共用 DOM badge 顯示。
  window.requestAnimationFrame(() => {
    if (!game.scene.isActive("errorModal")) {
      game.scene.start("errorModal");
    }
    overlayScenesStarted = true;
  });
}

// 等 scene 準備好後，綁定「store page -> scene 切換」路由
function bindRouterWhenReady() {
  if (routerBound) {
    return true;
  }
  if (!bootReady) {
    return false;
  }
  if (!game.scene.keys?.auth) {
    return false;
  }
  ensureOverlayScenesStarted();
  store.subscribe((state) => {
    switchSceneByPage(state.page);
  });
  routerBound = true;
  return true;
}

// 若一開始 scene 尚未就緒，短輪詢等到可綁定為止
if (!bindRouterWhenReady()) {
  const timer = window.setInterval(() => {
    if (bindRouterWhenReady()) {
      window.clearInterval(timer);
    }
  }, 60);
}

// 啟動時主動嘗試連線 WS
socket.reconnectNow?.();
