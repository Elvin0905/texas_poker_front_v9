// 深拷貝工具：避免外部直接改到 store 內部 state
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCardCode(cardRaw) {
  if (cardRaw === null || cardRaw === undefined || cardRaw === "") {
    return null;
  }
  const value = String(cardRaw).trim();
  const match = value.match(/^([2-9]|10|[tTjJqQkKaA])([cChHsSdD])$/);
  if (!match) {
    return null;
  }
  const rankRaw = String(match[1]).toUpperCase();
  const rank = rankRaw === "10" ? "T" : rankRaw;
  const suit = String(match[2]).toLowerCase();
  return `${rank}${suit}`;
}

function toCardArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const cards = [];
  value.forEach((item) => {
    const card = normalizeCardCode(item);
    if (card) {
      cards.push(card);
    }
  });
  return cards;
}

function parseSeatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.trunc(n);
}

function sumRoundBets(betsRaw) {
  if (!betsRaw || typeof betsRaw !== "object") {
    return 0;
  }
  return Object.values(betsRaw).reduce((sum, value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return sum;
    }
    return sum + n;
  }, 0);
}

function normalizeTableRoundTotalBet(table) {
  if (!table || typeof table !== "object") {
    return;
  }
  const explicitRoundTotal = Number(table.round_total_bet);
  if (Number.isFinite(explicitRoundTotal) && explicitRoundTotal >= 0) {
    table.round_total_bet = explicitRoundTotal;
    return;
  }
  table.round_total_bet = sumRoundBets(table.bets);
}

function extractPacketTableId(type, data) {
  if (type === "table_joined" || type === "table_state" || type === "hand_end" || type === "award") {
    return String(data?.table?.table_id ?? data?.table_id ?? "");
  }
  return String(data?.table_id ?? "");
}

function isTableFlowPacket(type) {
  return [
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
  ].includes(type);
}

// Store 負責管理前端整體狀態，並在狀態改變時通知所有訂閱者
export class Store extends EventTarget {
  constructor() {
    super();

    // 全域狀態：畫面切換、使用者資料、牌桌資料、錯誤與事件紀錄
    this.state = {
      connection: "idle", // WS 連線狀態
      page: "auth", // 目前頁面：auth/lobby/gameLobby/table
      user: null, // 登入後的使用者資訊
      lobby: null, // 大廳資料
      gameLobby: null, // 德州遊戲大廳資料
      table: null, // 牌桌狀態
      tableUpdateSource: "", // 最近一次造成牌桌重繪的封包類型
      tableId: null, // 當前牌桌 ID（避免跨桌殘留）
      isLeavingTable: false, // 是否正在離桌流程（忽略舊桌延遲封包）
      leavingTableId: null, // 離桌中的 table_id（用來過濾封包）
      heroSeat: null, // 我方座位號
      heroJoinedWaiting: false, // 英雄以等待狀態加入（換桌中途加入）
      heroSwitchPending: false, // 換桌流程進行中（等待舊局結束才能入座）
      handId: null, // 目前手牌編號（用來判斷新一手）
      handContribBySeat: {}, // 本手各座位已投入籌碼（用於轉桌/離桌風險提示）
      holeCardsBySeat: {}, // 已知手牌（seat -> [card1, card2]）
      showdownRevealsBySeat: {}, // 攤牌揭露手牌（seat -> [card1, card2]）
      actionRequest: null, // 目前輪到我可操作時的限制與資訊
      lastDealCard: null, // 最近一次 deal_card 事件
      dealCardVersion: 0, // deal_card 事件版本號（每次 +1）
      rebuyOffer: null, // 補碼提示
      rebuyResult: null, // 補碼結果
      handResult: null, // 本手結算資訊（只由 award 的 player_results 觸發 UI）
      handResultVersion: 0, // 結算事件版本號（每手首次結算事件 +1）
      handResultEventKey: "", // 已觸發過結算 UI 的手牌 key（table_id|hand_id）
      myHandReports: null, // 我的手牌報表（my_hand_reports_ok）
      myHandReportsVersion: 0, // 我的手牌報表版本（每次成功回傳 +1）
      myDailySettlement14d: null, // 最近 14 天日結（my_daily_settlement_14d_ok）
      myDailySettlement14dVersion: 0, // 最近 14 天日結版本（每次成功回傳 +1）
      walletBalance: 0, // 錢包餘額（來自 wallet_state）
      tableChips: 0, // 牌桌籌碼（來自 wallet_state）
      nextHandCountdownSeconds: 0, // 下一手開局倒數秒數（來自 table_countdown，0 = 無倒數）
      lastError: null, // 最後一次錯誤
      errorVersion: 0, // 錯誤事件版本號（每次 error 封包 +1）
      accountExists: null, // check_username 結果：true=存在，false=不存在，null=未查詢
      accountCheckVersion: 0, // check_username 回應版本號
      pendingOpenDailySettlement: 0, // 回放結束後開啟當日明細（版本號遞增觸發）
      eventLog: [], // 前端事件簡易 log
    };
  }

  // 取得 state 副本（避免外部直接修改）
  getState() {
    return clone(this.state);
  }

  // 訂閱狀態變更
  // listener 每次都拿到最新 state 副本
  // 回傳值是「取消訂閱函式」
  subscribe(listener) {
    const wrapped = () => listener(this.getState());
    this.addEventListener("change", wrapped);

    // 訂閱當下先推一次最新狀態，讓畫面可立即渲染
    wrapped();

    return () => this.removeEventListener("change", wrapped);
  }

  // 主動廣播狀態變更
  emit() {
    this.dispatchEvent(new Event("change"));
  }

  // 切換頁面
  setPage(page) {
    this.state.page = page;
    this.emit();
  }

  beginSwitchRoom() {
    this.state.heroSwitchPending = true;
    this.state.actionRequest = null;
    this.state.rebuyOffer = null;
    this.emit();
  }

  clearSwitchPending() {
    this.state.heroSwitchPending = false;
    this.state.heroJoinedWaiting = false;
    this.emit();
  }

  beginLeaveTable(tableIdRaw = null) {
    const tableId = String(tableIdRaw ?? this.state.table?.table_id ?? "");
    this.state.isLeavingTable = true;
    this.state.leavingTableId = tableId || null;
    this.state.page = "gameLobby";
    this.state.actionRequest = null;
    this.state.rebuyOffer = null;
    this.emit();
  }

  endLeaveTableFlow() {
    this.state.isLeavingTable = false;
    this.state.leavingTableId = null;
  }

  shouldIgnorePacketDuringLeave(type, data) {
    if (!this.state.isLeavingTable) {
      return false;
    }
    if (!isTableFlowPacket(type)) {
      return false;
    }
    const leavingId = String(this.state.leavingTableId ?? "");
    const packetTableId = extractPacketTableId(type, data);
    if (!leavingId) {
      return true;
    }
    if (!packetTableId) {
      return true;
    }
    return packetTableId === leavingId;
  }

  // 重置本次登入會話資料（通常在登出或重連時用）
  resetSession() {
    this.state.page = "auth";
    this.state.user = null;
    this.state.lobby = null;
    this.state.gameLobby = null;
    this.state.table = null;
    this.state.tableUpdateSource = "";
    this.state.tableId = null;
    this.state.isLeavingTable = false;
    this.state.leavingTableId = null;
    this.state.heroSeat = null;
    this.state.heroJoinedWaiting = false;
    this.state.heroSwitchPending = false;
    this.state.handId = null;
    this.state.handContribBySeat = {};
    this.state.holeCardsBySeat = {};
    this.state.showdownRevealsBySeat = {};
    this.state.actionRequest = null;
    this.state.lastDealCard = null;
    this.state.dealCardVersion = 0;
    this.state.rebuyOffer = null;
    this.state.rebuyResult = null;
    this.state.handResult = null;
    this.state.handResultVersion = 0;
    this.state.handResultEventKey = "";
    this.state.myHandReports = null;
    this.state.myHandReportsVersion = 0;
    this.state.myDailySettlement14d = null;
    this.state.myDailySettlement14dVersion = 0;
    this.state.walletBalance = 0;
    this.state.tableChips = 0;
    this.state.nextHandCountdownSeconds = 0;
    this.state.lastError = null;
    this.state.accountExists = null;
    this.state.accountCheckVersion = 0;
    this.state.eventLog = [];
    this.emit();
  }

  clearLastError() {
    this.state.lastError = null;
    this.emit();
  }

  openDailySettlementAfterReplay() {
    this.endLeaveTableFlow();
    this.state.page = "lobby";
    this.state.table = null;
    this.state.tableUpdateSource = "";
    this.state.tableId = null;
    this.state.heroSeat = null;
    this.state.heroJoinedWaiting = false;
    this.state.heroSwitchPending = false;
    this.state.handId = null;
    this.state.handContribBySeat = {};
    this.state.holeCardsBySeat = {};
    this.state.showdownRevealsBySeat = {};
    this.state.actionRequest = null;
    this.state.rebuyOffer = null;
    this.state.rebuyResult = null;
    this.state.lastDealCard = null;
    this.state.dealCardVersion = 0;
    this.state.handResult = null;
    this.state.handResultEventKey = "";
    this.state.nextHandCountdownSeconds = 0;
    this.state.pendingOpenDailySettlement += 1;
    this.emit();
  }

  forceBackToGameLobby() {
    this.endLeaveTableFlow();
    this.state.page = "gameLobby";
    this.state.table = null;
    this.state.tableUpdateSource = "";
    this.state.tableId = null;
    this.state.heroSeat = null;
    this.state.heroJoinedWaiting = false;
    this.state.heroSwitchPending = false;
    this.state.handId = null;
    this.state.handContribBySeat = {};
    this.state.holeCardsBySeat = {};
    this.state.showdownRevealsBySeat = {};
    this.state.actionRequest = null;
    this.state.rebuyOffer = null;
    this.state.rebuyResult = null;
    this.state.lastDealCard = null;
    this.state.dealCardVersion = 0;
    this.state.handResult = null;
    this.state.handResultEventKey = "";
    this.state.nextHandCountdownSeconds = 0;
    this.emit();
  }

  // 更新 WS 連線狀態
  setConnection(status) {
    this.state.connection = status;
    this.pushLog(`[ws] ${status}`);
    this.emit();
  }

  // 套用後端封包：核心狀態流轉都在這裡
  applyPacket(packet) {
    const type = packet?.type ?? "unknown";
    const data = packet?.data ?? {};
    this.pushLog(`<= ${type}`);

    if (this.shouldIgnorePacketDuringLeave(type, data)) {
      return;
    }
    if (isTableFlowPacket(type)) {
      this.state.tableUpdateSource = type;
    }

    switch (type) {
      // 登入/註冊成功 -> 進大廳
      case "login_ok":
      case "register_ok":
        this.state.user = data;
        if (data.wallet_balance !== undefined) {
          this.state.walletBalance = Number(data.wallet_balance ?? 0);
        }
        if (data.table_chips !== undefined) {
          this.state.tableChips = Number(data.table_chips ?? 0);
        }
        this.state.page = "lobby";
        break;

      // token 重驗證成功：
      // 1) 合併 user（避免 auth_ok 欄位較少時覆蓋掉舊資料）
      // 2) 若目前在遊戲流程中，不強制跳回 lobby
      case "auth_ok":
        this.state.user = {
          ...(this.state.user ?? {}),
          ...data,
        };
        if (data.wallet_balance !== undefined) {
          this.state.walletBalance = Number(data.wallet_balance ?? 0);
        }
        if (data.table_chips !== undefined) {
          this.state.tableChips = Number(data.table_chips ?? 0);
        }
        if (this.state.page === "auth" || this.state.page === "register") {
          this.state.page = "lobby";
        }
        break;

      case "update_profile_ok": {
        this.state.user = {
          ...(this.state.user ?? {}),
          ...data,
        };
        const userId = Number(data.user_id);
        if (Number.isFinite(userId) && Array.isArray(this.state.table?.players)) {
          this.state.table.players.forEach((player) => {
            if (Number(player?.user_id) !== userId) {
              return;
            }
            if (data.username !== undefined) {
              player.username = data.username;
            }
            if (data.avatar !== undefined) {
              player.avatar = data.avatar;
            }
          });
        }
        break;
      }

      // 登出成功 -> 清空本次登入資料，回登入頁
      case "logout_ok":
        this.resetSession();
        return;

      // 大廳狀態更新
      case "lobby_state":
        this.state.page = "lobby";
        this.state.lobby = data;
        break;

      // 遊戲大廳（盲注列表等）更新
      case "game_lobby_state":
        if (this.state.isLeavingTable) {
          this.endLeaveTableFlow();
          this.state.table = null;
          this.state.actionRequest = null;
          this.state.rebuyOffer = null;
        }
        // 若已進桌，不要被 game lobby 封包拉回去（但離桌流程例外）
        if (this.state.page !== "table") {
          this.state.page = "gameLobby";
        }
        this.state.gameLobby = data;
        break;

      // 入桌成功
      case "table_joined":
        this.endLeaveTableFlow();
        this.state.page = "table";
        this.state.handResult = null;
        this.state.handResultEventKey = "";
        this.state.actionRequest = null;
        this.state.rebuyOffer = null;
        this.state.holeCardsBySeat = {};
        this.state.showdownRevealsBySeat = {};
        this.state.heroJoinedWaiting = Boolean(data.waiting_this_hand);
        if (this.state.heroSwitchPending && !data.waiting_this_hand) {
          this.state.heroSwitchPending = false;
        }
        if (Number.isInteger(data.hero_seat)) {
          this.state.heroSeat = data.hero_seat;
        }
        if (data.table) {
          normalizeTableRoundTotalBet(data.table);
          this.syncHandContext(data.table);
          this.state.table = data.table;
        }
        break;

      case "table_countdown": {
        const secs = Number(data.seconds ?? 0);
        this.state.nextHandCountdownSeconds = secs > 0 ? secs : 0;
        break;
      }

      // 新一手開始：要在發私牌前就切換 hand context，避免後續 table_state 才清空造成牌面回背
      case "hand_start": {
        this.state.nextHandCountdownSeconds = 0;
        this.state.handResult = null;
        this.state.handResultEventKey = "";
        const currentTableId = String(this.state.table?.table_id ?? "");
        const nextTableId = String(data.table?.table_id ?? data.table_id ?? currentTableId);
        const nextHandId = Number(data.hand_id ?? data.table?.hand_id);
        if (nextTableId || Number.isFinite(nextHandId)) {
          this.syncHandContext({
            table_id: nextTableId,
            hand_id: Number.isFinite(nextHandId) ? nextHandId : this.state.handId,
          });
        }
        if (!this.state.table && data.table) {
          this.state.table = data.table;
        }
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          this.state.table.status = String(data.table?.status ?? this.state.table.status ?? "playing");
          this.state.table.round = String(data.table?.round ?? data.round ?? "preflop");
          if (Number.isFinite(nextHandId)) {
            this.state.table.hand_id = nextHandId;
          }
          if (Number.isFinite(Number(data.dealer_seat))) {
            this.state.table.dealer_seat = Number(data.dealer_seat);
          }
          if (Number.isFinite(Number(data.sb_seat))) {
            this.state.table.sb_seat = Number(data.sb_seat);
          }
          if (Number.isFinite(Number(data.bb_seat))) {
            this.state.table.bb_seat = Number(data.bb_seat);
          }
          if (Number.isFinite(Number(data.table?.pot))) {
            this.state.table.pot = Number(data.table.pot);
          } else {
            this.state.table.pot = 0;
          }
          if (Number.isFinite(Number(data.table?.current_bet))) {
            this.state.table.current_bet = Number(data.table.current_bet);
          } else {
            this.state.table.current_bet = 0;
          }
          if (data.table?.bets && typeof data.table.bets === "object") {
            this.state.table.bets = data.table.bets;
          } else {
            this.state.table.bets = {};
          }
          normalizeTableRoundTotalBet(this.state.table);
          this.state.table.current_turn_seat = null;
          this.state.table.current_turn_timeout = null;
          this.state.table.current_turn_started_at = null;
        }
        this.state.actionRequest = null;
        this.state.rebuyOffer = null;
        break;
      }

      // 牌桌完整狀態同步
      case "table_state": {
        this.endLeaveTableFlow();
        const hasHeroSeatField = Object.prototype.hasOwnProperty.call(data, "hero_seat");
        const nextHeroSeat = Number(data.hero_seat);
        const hasValidHeroSeat = Number.isInteger(nextHeroSeat);
        const tablePlayers = Array.isArray(data?.table?.players) ? data.table.players : [];
        const localUsername = String(this.state?.user?.username ?? "").trim();
        let derivedHeroSeat = null;
        if (localUsername && tablePlayers.length > 0) {
          const localPlayer = tablePlayers.find((player) => String(player?.username ?? "").trim() === localUsername);
          const localSeat = Number(localPlayer?.seat);
          if (Number.isInteger(localSeat)) {
            derivedHeroSeat = localSeat;
          }
        }

        // 斷線重連後，若後端回傳 hero_seat=null，代表玩家已不在牌桌內（通常被系統視為離桌/放棄）
        // 前端要立刻退回遊戲大廳，避免畫面卡在牌桌但操作都失敗。
        // 但若 table.players 仍能對應到自己（例如後端暫時漏掉 hero_seat），就留在牌桌並沿用推導座位。
        if (hasHeroSeatField && !hasValidHeroSeat && derivedHeroSeat === null) {
          this.state.page = "gameLobby";
          this.state.heroSeat = null;
          this.state.table = null;
          this.state.tableId = null;
          this.state.handId = null;
          this.state.handContribBySeat = {};
          this.state.actionRequest = null;
          this.state.rebuyOffer = null;
          this.state.handResult = null;
          this.state.handResultEventKey = "";
          this.state.holeCardsBySeat = {};
          this.state.showdownRevealsBySeat = {};
          break;
        }

        this.state.page = "table";
        if (hasValidHeroSeat) {
          this.state.heroSeat = nextHeroSeat;
        } else if (derivedHeroSeat !== null) {
          this.state.heroSeat = derivedHeroSeat;
        }
        if (data.table) {
          normalizeTableRoundTotalBet(data.table);
          const sameHand = this.isSameTableHand(this.state.table, data.table);
          this.syncHandContext(data.table);
          if (data.table.bets && typeof data.table.bets === "object") {
            if (sameHand) {
              this.patchHandContribByBetDelta(data.table.bets);
            } else {
              this.seedHandContribByBets(data.table.bets);
            }
          }
          this.state.table = data.table;
        }
        break;
      }

      // 有玩家加入牌桌（增量更新）
      case "table_player_joined": {
        const tableId = data.table_id;
        const player = data.player;
        if (!this.state.table || !player) {
          break;
        }
        if (tableId && this.state.table.table_id && tableId !== this.state.table.table_id) {
          break;
        }
        if (!Array.isArray(this.state.table.players)) {
          this.state.table.players = [];
        }
        const seatNo = Number(player.seat);
        const idx = this.state.table.players.findIndex((item) => Number(item.seat) === seatNo);
        if (idx >= 0) {
          this.state.table.players[idx] = {
            ...this.state.table.players[idx],
            ...player,
          };
        } else {
          this.state.table.players.push(player);
        }
        break;
      }

      // 輪到我行動（可 check/call/raise...）
      case "action_request":
        this.state.actionRequest = data;
        if (this.state.table) {
          const seatNo = Number(data.seat);
          if (Number.isFinite(seatNo)) {
            this.state.table.current_turn_seat = seatNo;
          }
          const currentBet = Number(data.current_bet);
          if (Number.isFinite(currentBet)) {
            this.state.table.current_bet = currentBet;
          }
          const pot = Number(data.pot);
          if (Number.isFinite(pot)) {
            this.state.table.pot = pot;
          }
          const roundTotalBet = Number(data.round_total_bet);
          if (Number.isFinite(roundTotalBet)) {
            this.state.table.round_total_bet = roundTotalBet;
          }
          const timeoutSec = Number(data.timeout);
          this.state.table.current_turn_timeout = Number.isFinite(timeoutSec) ? timeoutSec : null;
          this.state.table.current_turn_started_at = Date.now();
        }
        break;

      // 輪到某個座位行動（全桌廣播）
      case "turn":
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          const seatNo = Number(data.seat);
          this.state.table.current_turn_seat = Number.isFinite(seatNo) ? seatNo : null;
          const timeoutSec = Number(data.timeout);
          this.state.table.current_turn_timeout = Number.isFinite(timeoutSec) ? timeoutSec : null;
          this.state.table.current_turn_started_at = Date.now();
          if (data.round) {
            this.state.table.round = data.round;
          }
        }
        break;

      // 有人行動（fold/call/raise...），對牌桌做局部更新
      case "player_action":
        this.patchTableByAction(data);
        break;

      // 公牌發牌更新（flop/turn/river）
      case "deal_community":
        if (this.state.table) {
          if (data.round) {
            this.state.table.round = data.round;
          }
          if (Array.isArray(data.community)) {
            this.state.table.community = data.community;
          }
          const roundTotalBet = Number(data.round_total_bet);
          if (Number.isFinite(roundTotalBet)) {
            this.state.table.round_total_bet = roundTotalBet;
          } else if (!data.round_total_bet && (data.round || Array.isArray(data.cards))) {
            this.state.table.round_total_bet = 0;
          }
        }
        break;

      case "post_blinds":
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          if (Number.isFinite(Number(data.pot))) {
            this.state.table.pot = Number(data.pot);
          }
          if (Number.isFinite(Number(data.current_bet))) {
            this.state.table.current_bet = Number(data.current_bet);
          }
          if (data.bets && typeof data.bets === "object") {
            this.patchPlayerChipsByBetDelta(data.bets);
            this.state.table.bets = data.bets;
          }
          const roundTotalBet = Number(data.round_total_bet);
          if (Number.isFinite(roundTotalBet)) {
            this.state.table.round_total_bet = roundTotalBet;
          } else {
            this.state.table.round_total_bet = sumRoundBets(this.state.table.bets);
          }
        }
        break;

      case "betting_start":
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          if (data.round) {
            this.state.table.round = data.round;
          }
          if (Number.isFinite(Number(data.pot))) {
            this.state.table.pot = Number(data.pot);
          }
          if (Number.isFinite(Number(data.current_bet))) {
            this.state.table.current_bet = Number(data.current_bet);
          }
          if (data.bets && typeof data.bets === "object") {
            this.state.table.bets = data.bets;
          }
          const roundTotalBet = Number(data.round_total_bet);
          if (Number.isFinite(roundTotalBet)) {
            this.state.table.round_total_bet = roundTotalBet;
          } else {
            this.state.table.round_total_bet = sumRoundBets(this.state.table.bets);
          }
          const actionSeat = Number(data.action_seat);
          this.state.table.current_turn_seat = Number.isFinite(actionSeat) ? actionSeat : null;
          this.state.table.current_turn_timeout = null;
          this.state.table.current_turn_started_at = null;
        }
        this.state.actionRequest = null;
        break;

      case "betting_complete":
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          if (Number.isFinite(Number(data.pot))) {
            this.state.table.pot = Number(data.pot);
          }
          if (Number.isFinite(Number(data.current_bet))) {
            this.state.table.current_bet = Number(data.current_bet);
          }
          if (data.bets && typeof data.bets === "object") {
            this.state.table.bets = data.bets;
          }
          const roundTotalBet = Number(data.round_total_bet);
          if (Number.isFinite(roundTotalBet)) {
            this.state.table.round_total_bet = roundTotalBet;
          } else {
            this.state.table.round_total_bet = sumRoundBets(this.state.table.bets);
          }
          this.state.table.current_turn_seat = null;
          this.state.table.current_turn_timeout = null;
          this.state.table.current_turn_started_at = null;
        }
        this.state.actionRequest = null;
        break;

      // 單張發牌事件（常見於每位玩家依序發 2 張手牌）
      case "deal_card":
        if (this.state.table) {
          if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
            break;
          }
          const seatNo = Number(data.seat);
          const cardIndex = Number(data.card_index);
          const player = this.state.table.players?.find((item) => Number(item.seat) === seatNo);
          if (player && Number.isFinite(cardIndex)) {
            const nextHoleCount = Math.max(Number(player.hole_count ?? 0), cardIndex + 1);
            player.hole_count = nextHoleCount;
          }
        }
        this.state.lastDealCard = {
          table_id: data.table_id,
          hand_id: data.hand_id,
          seat: data.seat,
          card_index: data.card_index,
          at: Date.now(),
        };
        this.state.dealCardVersion += 1;
        break;

      // 私牌單張（只發給該玩家本人）
      case "deal_private": {
        if (!this.state.table) {
          break;
        }
        if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
          break;
        }
        const seatNo = parseSeatNumber(data.seat);
        const cardIndex = Number(data.card_index);
        const card = normalizeCardCode(data.card);
        if (seatNo === null || !Number.isFinite(cardIndex) || cardIndex < 0 || cardIndex >= 2 || !card) {
          break;
        }
        const player = this.state.table.players?.find((item) => Number(item.seat) === seatNo);
        if (player) {
          player.hole_count = Math.max(Number(player.hole_count ?? 0), cardIndex + 1);
        }
        this.setKnownHoleCardByIndex(seatNo, cardIndex, card);
        this.state.lastDealCard = {
          table_id: data.table_id,
          hand_id: data.hand_id,
          seat: seatNo,
          card_index: cardIndex,
          at: Date.now(),
        };
        this.state.dealCardVersion += 1;
        break;
      }

      // 私牌兩張（只發給該玩家本人）
      case "hole_cards": {
        if (!this.state.table) {
          break;
        }
        if (data.table_id && this.state.table.table_id && data.table_id !== this.state.table.table_id) {
          break;
        }
        const heroSeat = parseSeatNumber(this.state.heroSeat);
        if (heroSeat === null) {
          break;
        }
        const cards = toCardArray(data.cards).slice(0, 2);
        if (cards.length <= 0) {
          break;
        }
        this.setKnownHoleCards(heroSeat, cards, false);
        const player = this.state.table.players?.find((item) => Number(item.seat) === heroSeat);
        if (player) {
          player.hole_count = Math.max(Number(player.hole_count ?? 0), cards.length);
        }
        break;
      }

      case "showdown":
        this.applyShowdownReveals(data);
        break;

      // 派彩才觸發結算 UI；hand_end 只做收尾與桌面同步。
      case "award":
      case "hand_end":
        if (type === "hand_end") {
          this.applyShowdownReveals(data);
        }
        if (type === "award" && Array.isArray(data.player_results) && data.player_results.length > 0) {
          const resultTableId = String(data.table_id ?? data.table?.table_id ?? this.state.table?.table_id ?? "");
          const rawResultHandId = Number(data.hand_id ?? data.table?.hand_id ?? this.state.handId ?? 0);
          const resultHandId = Number.isFinite(rawResultHandId) ? rawResultHandId : 0;
          this.state.handResult = {
            table_id: resultTableId,
            hand_id: resultHandId,
            reason: String(data.reason ?? ""),
            player_results: clone(data.player_results),
          };
          const resultEventKey = resultHandId > 0 ? `${resultTableId}|${resultHandId}` : "";
          const isDuplicateResult = Boolean(resultEventKey && this.state.handResultEventKey === resultEventKey);
          if (!isDuplicateResult) {
            this.state.handResultVersion += 1;
            this.state.handResultEventKey = resultEventKey;
          }
        }
        if (data.table) {
          normalizeTableRoundTotalBet(data.table);
          this.syncHandContext(data.table);
          this.state.table = data.table;
        }
        if (type === "hand_end") {
          // hand_end 後，上一手的私牌/攤牌資訊要清空，避免畫面殘留
          this.state.handContribBySeat = {};
          this.state.holeCardsBySeat = {};
          this.state.showdownRevealsBySeat = {};
          // 若後端已進入 waiting（或 hand_end 未附 table），強制把桌面視覺欄位重置
          const tableStatus = String(this.state.table?.status ?? "").toLowerCase();
          const tableRound = String(this.state.table?.round ?? "").toLowerCase();
          if (!data.table || tableStatus === "waiting" || tableRound === "waiting") {
            this.resetTableAfterHandEnd();
          }
        }
        this.state.actionRequest = null;
        if (type === "hand_end" && !this.state.heroSwitchPending) {
          this.state.heroJoinedWaiting = false;
        }
        break;

      // 補碼提示與結果
      case "rebuy_offer":
        this.state.rebuyOffer = data;
        break;
      case "rebuy_result":
        this.state.rebuyResult = data;
        this.state.rebuyOffer = null;
        break;

      // 錢包狀態（後端主動推送）
      case "wallet_state":
        this.state.walletBalance = Number(data.wallet_balance ?? 0);
        this.state.tableChips = Number(data.table_chips ?? 0);
        break;

      // 我的手牌報表（分頁查詢回應）
      case "my_hand_reports_ok":
        this.state.myHandReports = clone(data);
        this.state.myHandReportsVersion += 1;
        break;

      // 最近 14 天日結（固定 14 筆）
      case "my_daily_settlement_14d_ok":
        this.state.myDailySettlement14d = clone(data);
        this.state.myDailySettlement14dVersion += 1;
        break;

      // 帳號存在確認
      case "check_username_ok":
        this.state.accountExists = true;
        this.state.accountCheckVersion += 1;
        break;

      // 錯誤訊息
      case "error":
        this.state.lastError = data;
        this.state.errorVersion += 1;
        break;

      // 心跳回覆：目前不用改狀態
      case "pong":
        break;

      default:
        break;
    }

    this.emit();
  }

  // 寫入事件 log，僅保留最近 14 筆
  pushLog(line) {
    this.state.eventLog.push(`[${new Date().toLocaleTimeString()}] ${line}`);
    if (this.state.eventLog.length > 14) {
      this.state.eventLog.splice(0, this.state.eventLog.length - 14);
    }
  }

  patchPlayerChipsByBetDelta(nextBetsRaw) {
    const table = this.state.table;
    if (!table || !nextBetsRaw || typeof nextBetsRaw !== "object" || !Array.isArray(table.players)) {
      return;
    }
    const previousBets = table.bets && typeof table.bets === "object" ? table.bets : {};
    table.players.forEach((player) => {
      const seat = parseSeatNumber(player?.seat);
      if (seat === null) {
        return;
      }
      const seatKey = String(seat);
      const previousBet = Number(previousBets[seatKey] ?? previousBets[seat] ?? 0);
      const nextBet = Number(nextBetsRaw[seatKey] ?? nextBetsRaw[seat] ?? 0);
      if (!Number.isFinite(nextBet)) {
        return;
      }
      const delta = nextBet - (Number.isFinite(previousBet) ? previousBet : 0);
      if (delta > 0) {
        player.chips = Math.max(0, Number(player.chips ?? 0) - delta);
        this.addHandContribForSeat(seat, delta);
      }
      player.bet = nextBet;
    });
  }

  addHandContribForSeat(seatRaw, amountRaw) {
    const seat = parseSeatNumber(seatRaw);
    const amount = Number(amountRaw);
    if (seat === null || !Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const seatKey = String(seat);
    const current = Number(this.state.handContribBySeat?.[seatKey] ?? 0);
    this.state.handContribBySeat = {
      ...(this.state.handContribBySeat || {}),
      [seatKey]: (Number.isFinite(current) ? current : 0) + amount,
    };
  }

  patchHandContribByBetDelta(nextBetsRaw) {
    const table = this.state.table;
    if (!table || !nextBetsRaw || typeof nextBetsRaw !== "object") {
      return;
    }
    const previousBets = table.bets && typeof table.bets === "object" ? table.bets : {};
    Object.keys(nextBetsRaw).forEach((seatKey) => {
      const previousBet = Number(previousBets[seatKey] ?? 0);
      const nextBet = Number(nextBetsRaw[seatKey] ?? 0);
      const delta = nextBet - (Number.isFinite(previousBet) ? previousBet : 0);
      if (Number.isFinite(delta) && delta > 0) {
        this.addHandContribForSeat(seatKey, delta);
      }
    });
  }

  seedHandContribByBets(betsRaw) {
    if (!betsRaw || typeof betsRaw !== "object") {
      return;
    }
    Object.entries(betsRaw).forEach(([seat, amountRaw]) => {
      const amount = Number(amountRaw);
      if (Number.isFinite(amount) && amount > 0) {
        this.addHandContribForSeat(seat, amount);
      }
    });
  }

  isSameTableHand(left, right) {
    if (!left || !right) {
      return false;
    }
    const leftTableId = String(left.table_id ?? "");
    const rightTableId = String(right.table_id ?? "");
    const leftHandId = Number(left.hand_id);
    const rightHandId = Number(right.hand_id);
    return Boolean(
      leftTableId
      && rightTableId
      && leftTableId === rightTableId
      && Number.isFinite(leftHandId)
      && Number.isFinite(rightHandId)
      && leftHandId === rightHandId,
    );
  }

  // 根據 player_action 封包，局部修補 table（避免每次都等完整 table_state）
  patchTableByAction(data) {
    if (!this.state.table) {
      return;
    }

    const seat = data.seat;
    const paid = Number(data.paid ?? 0);
    const player = this.state.table.players?.find((item) => item.seat === seat);

    if (player) {
      player.bet = Number(player.bet ?? 0) + paid;
      player.chips = Math.max(0, Number(player.chips ?? 0) - paid);
      player.last_action = data.action;
      player.last_action_at = Date.now();
    }
    if (paid > 0) {
      this.addHandContribForSeat(seat, paid);
    }

    if (Number.isFinite(Number(data.pot))) {
      this.state.table.pot = Number(data.pot);
    }
    if (Number.isFinite(Number(data.current_bet))) {
      this.state.table.current_bet = Number(data.current_bet);
    }
    if (data.bets) {
      this.state.table.bets = data.bets;
    }
    const roundTotalBet = Number(data.round_total_bet);
    if (Number.isFinite(roundTotalBet)) {
      this.state.table.round_total_bet = roundTotalBet;
    } else {
      this.state.table.round_total_bet = sumRoundBets(this.state.table.bets);
    }
    // 任一 player_action 發生後，上一位的操作倒數與發光要立即收起來，
    // 避免在回放或延遲封包下殘留舊座位閃爍。
    this.state.table.current_turn_seat = null;
    this.state.table.current_turn_timeout = null;
    this.state.table.current_turn_started_at = null;

    // 只有當 action 是當前 request 那個座位時，才清掉本地 actionRequest
    // 避免別人行動時把我方 action UI 清空
    const reqSeat = Number(this.state.actionRequest?.seat);
    const actionSeat = Number(seat);
    if (Number.isFinite(reqSeat) && Number.isFinite(actionSeat) && reqSeat === actionSeat) {
      this.state.actionRequest = null;
    }
  }

  resetTableAfterHandEnd() {
    if (!this.state.table) {
      return;
    }
    this.state.table.community = [];
    this.state.table.pot = 0;
    this.state.table.current_bet = 0;
    this.state.table.bets = {};
    this.state.table.round_total_bet = 0;
    this.state.table.dealer_seat = null;
    this.state.table.sb_seat = null;
    this.state.table.bb_seat = null;
    this.state.table.current_turn_seat = null;
    this.state.table.current_turn_timeout = null;
    this.state.table.current_turn_started_at = null;
    if (Array.isArray(this.state.table.players)) {
      this.state.table.players.forEach((player) => {
        player.bet = 0;
        player.hole_count = 0;
        player.last_action = null;
        player.last_action_at = null;
      });
    }
  }

  syncHandContext(table) {
    const nextTableId = String(table?.table_id ?? "");
    if (this.state.tableId !== nextTableId) {
      this.state.tableId = nextTableId;
      this.state.handId = null;
      this.state.handContribBySeat = {};
      this.state.holeCardsBySeat = {};
      this.state.showdownRevealsBySeat = {};
    }
    const nextHandId = Number(table?.hand_id);
    if (!Number.isFinite(nextHandId)) {
      return;
    }
    if (this.state.handId !== nextHandId) {
      this.state.handId = nextHandId;
      this.state.handContribBySeat = {};
      this.state.holeCardsBySeat = {};
      this.state.showdownRevealsBySeat = {};
    }
  }

  setKnownHoleCards(seatRaw, cardsRaw, isShowdown = false) {
    const seatNo = parseSeatNumber(seatRaw);
    if (seatNo === null) {
      return;
    }
    const cards = toCardArray(cardsRaw).slice(0, 2);
    if (cards.length <= 0) {
      return;
    }
    this.state.holeCardsBySeat[String(seatNo)] = cards;
    if (isShowdown) {
      this.state.showdownRevealsBySeat[String(seatNo)] = cards;
    }
  }

  setKnownHoleCardByIndex(seatRaw, cardIndexRaw, cardRaw) {
    const seatNo = parseSeatNumber(seatRaw);
    if (seatNo === null) {
      return;
    }
    const cardIndex = Number(cardIndexRaw);
    if (!Number.isFinite(cardIndex) || cardIndex < 0 || cardIndex >= 2) {
      return;
    }
    const card = normalizeCardCode(cardRaw);
    if (!card) {
      return;
    }
    const key = String(seatNo);
    const current = Array.isArray(this.state.holeCardsBySeat[key]) ? [...this.state.holeCardsBySeat[key]] : [];
    current[cardIndex] = card;
    const normalized = toCardArray(current).slice(0, 2);
    if (normalized.length > 0) {
      this.state.holeCardsBySeat[key] = normalized;
    }
  }

  applyShowdownReveals(data) {
    if (!data) {
      return;
    }
    const currentTableId = String(this.state.table?.table_id ?? "");
    const packetTableId = String(data.table_id ?? "");
    if (currentTableId && packetTableId && currentTableId !== packetTableId) {
      return;
    }
    const packetHandId = Number(data.hand_id);
    if (Number.isFinite(packetHandId) && Number.isFinite(Number(this.state.handId)) && packetHandId !== Number(this.state.handId)) {
      return;
    }
    const reveals = data.reveals;
    if (reveals && typeof reveals === "object" && !Array.isArray(reveals)) {
      Object.values(reveals).forEach((info) => {
        const seatNo = parseSeatNumber(info?.seat);
        if (seatNo === null) {
          return;
        }
        this.setKnownHoleCards(seatNo, info?.hole, true);
      });
    }
  }
}
