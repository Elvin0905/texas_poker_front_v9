export class SocketClient {
  constructor({ url, onPacket, onStatus }) {
    // WebSocket 連線位址，例如 ws://127.0.0.1:8787
    this.url = url;

    // 收到伺服器封包後，回呼給外層（通常是 main.js / store）
    this.onPacket = onPacket;

    // 連線狀態改變時，回呼給外層更新 UI
    this.onStatus = onStatus;

    // 目前 WebSocket 實體
    this.ws = null;

    // 重連計時器 ID（setTimeout）
    this.reconnectTimer = null;

    // 心跳計時器 ID（setInterval）
    this.heartbeatTimer = null;

    // 是否允許自動重連（手動 disconnect 會改成 false）
    this.shouldReconnect = true;

    // 已重連次數（用來計算 backoff 延遲）
    this.reconnectAttempt = 0;

    // 最後一次成功送出的封包（用於斷線診斷）
    this.lastSentPacket = null;

    // 最後一次送出 ping 的時間（ms，用於估算 RTT）
    this.lastPingSentAt = null;
  }

  connect() {
    // 若目前已在連線中或已連上，就不重複 connect
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // 開新連線前先清掉舊的重連排程
    this.clearReconnect();
    this.ws = new WebSocket(this.url);
    this.onStatus?.("connecting");

    this.ws.addEventListener("open", () => {
      // 成功連上後，重連次數歸零，並啟動心跳
      this.reconnectAttempt = 0;
      this.onStatus?.("open");
      this.startHeartbeat();
    });

    this.ws.addEventListener("message", (event) => {
      // 伺服器訊息預期是 JSON 字串：{ type, data }
      let packet;
      try {
        packet = JSON.parse(event.data);
      } catch (error) {
        // 若格式錯誤，丟出前端可顯示的錯誤封包
        this.onPacket?.({
          type: "error",
          data: {
            code: "INVALID_JSON_FROM_SERVER",
            message: "伺服器回傳資料格式錯誤（非合法 JSON）。",
          },
        });
        return;
      }
      this.onPacket?.(packet);
    });

    this.ws.addEventListener("close", (event) => {
      // 連線關閉時先停心跳，並清空 ws 實體
      this.stopHeartbeat();
      this.onStatus?.(`closed_${event.code || 0}`);
      this.ws = null;

      // 1000 = 正常關閉；非 1000 視為錯誤並通知 UI
      if ((event.code || 0) !== 1000) {
        const closeCode = Number(event.code || 0);
        const lastSentType = String(this.lastSentPacket?.type || "");
        const lastSentAtMs = Number(this.lastSentPacket?.atMs || 0);
        const closedSoonAfterJoinStakes =
          lastSentType === "join_stakes" &&
          Number.isFinite(lastSentAtMs) &&
          Date.now() - lastSentAtMs <= 15000;
        const isServerInternalError = closeCode === 1011;

        let errorCode = `WS_CLOSED_${closeCode}`;
        let errorMessage = event.reason || "伺服器已關閉連線。";

        // 測試機常見案例：送 join_stakes 後直接被 server 1011 關閉
        // 這裡提供更明確的前端訊息，方便直接回報後端定位。
        if (isServerInternalError && closedSoonAfterJoinStakes) {
          errorCode = "JOIN_STAKES_SERVER_1011";
          errorMessage = "入桌請求送出後，伺服器以 1011 關閉連線（後端內部錯誤）。";
        }

        this.onPacket?.({
          type: "error",
          data: {
            code: errorCode,
            message: errorMessage,
          },
        });
      }

      // 若允許重連，排程下一次自動連線
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener("error", () => {
      // error 事件本身通常不含完整細節，細節多在 close/reason
      this.onStatus?.("error");
    });
  }

  disconnect() {
    // 手動中斷：關掉自動重連、重連排程、心跳
    this.shouldReconnect = false;
    this.clearReconnect();
    this.stopHeartbeat();

    // 若 ws 存在就主動 close
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatus?.("closed");
  }

  reconnectNow() {
    // 允許重連並立即嘗試 connect（啟動時會用到）
    this.shouldReconnect = true;
    this.connect();
  }

  send(type, data = {}) {
    // 僅在 OPEN 狀態可送包
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.lastSentPacket = {
      type,
      atMs: Date.now(),
    };
    if (type === "ping") {
      this.lastPingSentAt = this.lastSentPacket.atMs;
    }
    this.ws.send(JSON.stringify({ type, data }));
    return true;
  }

  scheduleReconnect() {
    // 每次排程前先清掉舊計時器，避免重複排多個重連
    this.clearReconnect();

    // 指數退避：2s, 4s, 8s... 最多 15s
    this.reconnectAttempt += 1;
    const delayMs = Math.min(1000 * 2 ** this.reconnectAttempt, 15000);
    this.onStatus?.(`reconnecting_${Math.round(delayMs / 1000)}s`);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delayMs);
  }

  clearReconnect() {
    // 清除重連 setTimeout
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  startHeartbeat() {
    // 開啟新心跳前，先確保舊心跳已清掉
    this.stopHeartbeat();

    // 每 15 秒送一次 ping，避免閒置被中間設備斷線
    this.heartbeatTimer = window.setInterval(() => {
      this.send("ping", {});
    }, 15000);
  }

  stopHeartbeat() {
    // 停止心跳 setInterval
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
