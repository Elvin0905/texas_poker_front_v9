function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const TABLE_ID = "texas_holdem_t25_50_9f1a2b3c";
const GAME_ID = "texas_holdem";
const STAKES_ID = "t25_50";
const SMALL_BLIND = 25;
const BIG_BLIND = 50;
const MIN_BUYIN = 1000;
const MAX_BUYIN = 20000;

const PLAYER_SEEDS = [
  { seat: 0, username: "P1_main", avatar: "avatar_004", chips: 8000 },
  { seat: 1, username: "P2", avatar: "avatar_011", chips: 12000 },
  { seat: 2, username: "P3", avatar: "avatar_008", chips: 6500 },
  { seat: 3, username: "P4_short", avatar: "avatar_003", chips: 1000 },
  { seat: 4, username: "P5", avatar: "avatar_002", chips: 5000 },
  { seat: 5, username: "P6", avatar: "avatar_015", chips: 3000 },
];

const HERO_HOLE_CARDS = ["Ah", "Kd"];
const HOLE_CARDS_BY_SEAT = {
  0: ["Ah", "Kd"],
  1: ["Qh", "Qc"],
  2: ["As", "7c"],
  3: ["7s", "7d"],
  4: ["Jc", "Td"],
  5: ["8s", "3c"],
};

// 模擬流程節奏（毫秒）
const CONNECT_OPEN_DELAY_MS = 260;
const FLOW_JOIN_START_DELAY_MS = 360;
const FLOW_PLAYER_JOIN_GAP_MS = 420;
const FLOW_AFTER_ALL_JOIN_GAP_MS = 900;
const FLOW_COUNTDOWN_SECONDS = 3;
const FLOW_COUNTDOWN_WAIT_MS = FLOW_COUNTDOWN_SECONDS * 1000;
const FLOW_AFTER_BLINDS_GAP_MS = 320;
const DEAL_CARD_GAP_MS = 140;
const DEAL_AFTER_HOLE_GAP_MS = 520;
const STREET_SETTLE_GAP_MS = 520;
const SHOWDOWN_TO_AWARD_GAP_MS = 520;
const AWARD_TO_HAND_END_GAP_MS = 720;
const BOT_TURN_LEAD_IN_MS = 420;
const BOT_ACTION_THINK_MS = 1000;
const HERO_TURN_LEAD_IN_MS = 320;

function makeTablePlayer(seed) {
  return {
    user_id: 1001 + seed.seat,
    username: seed.username,
    avatar: seed.avatar,
    seat: seed.seat,
    chips: seed.chips,
    bet: 0,
    is_sitting_out: false,
    is_bot: false,
    is_disconnected: false,
    in_hand: true,
    hole_count: 0,
    last_action: null,
    last_action_at: null,
  };
}

function makeJoinedPayload(seed) {
  return {
    user_id: 1001 + seed.seat,
    username: seed.username,
    avatar: seed.avatar,
    seat: seed.seat,
    chips: seed.chips,
    is_sitting_out: false,
    is_bot: false,
    in_hand: true,
  };
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

export class MockSocketClient {
  constructor({ onPacket, onStatus }) {
    this.onPacket = onPacket;
    this.onStatus = onStatus;
    this.connected = false;

    this.heroSeat = 0;
    this.profile = {
      username: "P1_main",
      member_no: "MOCK001",
      token: "mock-token",
      avatar: "avatar_004",
    };

    this.table = null;
    this.isSpectator = false;
    this.spectatorTableChips = 0;
    this.walletBalance = 500000;
    this.currentRunId = 0;

    this.timers = new Set();
    this.pendingWaits = new Set();
    this.pendingHeroAction = null;
    this.nextHandId = 501;
    this.handContribBySeat = {};
  }

  connect() {
    if (this.connected) {
      return;
    }
    this.onStatus?.("connecting");
    this.schedule(CONNECT_OPEN_DELAY_MS, () => {
      this.connected = true;
      this.onStatus?.("open");
    });
  }

  disconnect() {
    this.connected = false;
    this.stopSimulation();
    this.onStatus?.("closed");
  }

  reconnectNow() {
    this.connect();
  }

  send(type, data = {}) {
    if (!this.connected) {
      return false;
    }

    switch (type) {
      case "ping":
        this.emit("pong", {});
        break;

      case "guest_login":
      case "login":
      case "auth_token": {
        const username = String(data.username || this.profile.username || "P1_main");
        this.profile.username = username;
        this.emit("login_ok", {
          member_no: this.profile.member_no,
          username,
          avatar: this.profile.avatar,
          token: this.profile.token,
          wallet_balance: this.walletBalance,
        });
        this.emitLobbyState();
        break;
      }

      case "register": {
        const username = String(data.display_name || data.username || this.profile.username || "P1_main");
        this.profile.username = username;
        this.emit("register_ok", {
          member_no: this.profile.member_no,
          username,
          avatar: this.profile.avatar,
          token: this.profile.token,
          wallet_balance: this.walletBalance,
        });
        this.emitLobbyState();
        break;
      }

      case "enter_lobby":
        this.emitLobbyState();
        break;

      case "enter_game":
        this.emitGameLobbyState();
        break;

      case "join_stakes":
        this.handleJoinStakes(data);
        break;

      case "take_seat":
        this.handleTakeSeat(data);
        break;

      case "stand_up":
        this.handleStandUp(data);
        break;

      case "switch_room":
        if (this.isSpectator) {
          this.handleJoinStakes({ game_id: GAME_ID, stakes_id: STAKES_ID, mode: "spectator" });
        } else {
          this.handleJoinStakes({
            game_id: GAME_ID,
            stakes_id: STAKES_ID,
            buyin: Number(data.buyin ?? MAX_BUYIN),
          });
        }
        break;

      case "player_action":
        this.handleHeroAction(data);
        break;

      case "leave_room":
        this.stopSimulation();
        this.table = null;
        this.emitGameLobbyState();
        break;

      case "rebuy_decision":
        this.emit("rebuy_ack", { buyin: Number(data.buyin ?? 0) });
        this.emit("rebuy_result", {
          accepted: Number(data.buyin ?? 0) > 0,
          success: true,
          reason: Number(data.buyin ?? 0) > 0 ? "rebuy_success" : "rebuy_declined",
          topup_amount: Number(data.buyin ?? 0),
        });
        break;

      default:
        break;
    }

    return true;
  }

  emit(type, data) {
    this.onPacket?.({ type, data });
  }

  emitLobbyState() {
    this.emit("wallet_state", {
      wallet_balance: this.walletBalance,
      table_chips: 0,
    });

    this.emit("lobby_state", {
      games: [
        {
          id: "texas_holdem",
          name: "德州撲克",
          status: "available",
          implemented: true,
        },
        {
          id: "big_two",
          name: "大老二",
          status: "coming_soon",
          implemented: false,
        },
        {
          id: "blackjack",
          name: "二十一點",
          status: "coming_soon",
          implemented: false,
        },
      ],
    });
  }

  emitGameLobbyState() {
    this.emit("game_lobby_state", {
      game_id: GAME_ID,
      game_name: "德州撲克",
      stakes: [
        {
          id: STAKES_ID,
          stakes_id: STAKES_ID,
          small_blind: SMALL_BLIND,
          big_blind: BIG_BLIND,
          min_buyin: MIN_BUYIN,
          max_buyin: MAX_BUYIN,
          display: "25 / 50 - buyin 1000 ~ 20000",
        },
      ],
    });
  }

  handleJoinStakes(data = {}) {
    this.stopSimulation();
    this.handContribBySeat = {};

    const wantSpectate = String(data?.mode ?? "").toLowerCase();
    const isSpectator = data?.spectator === true
      || ["spectator", "spectate", "observer", "watch"].includes(wantSpectate);
    this.isSpectator = isSpectator;

    this.table = {
      table_id: TABLE_ID,
      game_id: GAME_ID,
      stakes_id: STAKES_ID,
      small_blind: SMALL_BLIND,
      big_blind: BIG_BLIND,
      min_buyin: MIN_BUYIN,
      max_buyin: MAX_BUYIN,
      max_players: 6,
      status: "waiting",
      round: "waiting",
      hand_id: 0,
      community: [],
      pot: 0,
      current_bet: 0,
      bets: {},
      round_total_bet: 0,
      dealer_seat: null,
      sb_seat: null,
      bb_seat: null,
      players: [],
    };

    if (isSpectator) {
      // 觀戰：可選擇帶入籌碼（join_stakes.buyin）。帶了就用帶入額（夾在 min/max），
      // 沒帶就 0；take_seat 時才檢查是否達到最低帶入。
      const rawSpectatorBuyin = Math.floor(Number(data?.buyin ?? 0));
      this.spectatorTableChips = Number.isFinite(rawSpectatorBuyin) && rawSpectatorBuyin > 0
        ? Math.max(MIN_BUYIN, Math.min(MAX_BUYIN, rawSpectatorBuyin))
        : 0;
      this.emit("table_joined", {
        game_id: GAME_ID,
        table_id: TABLE_ID,
        stakes_id: STAKES_ID,
        hero_seat: null,
        is_spectator: true,
        can_act: false,
        table_chips: this.spectatorTableChips,
        waiting_this_hand: false,
        table: clone(this.table),
      });
      this.walletBalance = 492000;
      this.emit("wallet_state", {
        wallet_balance: this.walletBalance,
        table_chips: this.spectatorTableChips,
      });
    } else {
      const requestedBuyin = Math.floor(Number(data?.buyin ?? MAX_BUYIN));
      const clampedBuyin = Math.max(MIN_BUYIN, Math.min(MAX_BUYIN, Number.isFinite(requestedBuyin) ? requestedBuyin : MAX_BUYIN));
      const heroSeed = PLAYER_SEEDS.find((item) => item.seat === this.heroSeat) || PLAYER_SEEDS[0];
      const heroName = this.profile.username || heroSeed.username;
      const heroPlayer = makeTablePlayer({ ...heroSeed, username: heroName, chips: clampedBuyin });
      this.table.players.push(heroPlayer);
      this.emit("table_joined", {
        hero_seat: this.heroSeat,
        is_spectator: false,
        can_act: false,
        waiting_this_hand: false,
        table: clone(this.table),
      });
      this.walletBalance = 492000;
      this.emit("wallet_state", {
        wallet_balance: this.walletBalance,
        table_chips: heroPlayer.chips,
      });
    }

    const runId = ++this.currentRunId;
    this.runFlow(runId).catch(() => {});
  }

  handleTakeSeat(data = {}) {
    const seat = Number(data?.seat);
    if (!this.table || !Number.isInteger(seat)) {
      this.emit("error", { code: "TAKE_SEAT_INVALID", message: "invalid seat" });
      return;
    }
    if (this.findPlayer(seat)) {
      this.emit("error", { code: "TAKE_SEAT_OCCUPIED", message: "seat is taken" });
      return;
    }
    if (this.spectatorTableChips < MIN_BUYIN) {
      this.emit("error", {
        code: "TAKE_SEAT_CHIPS_TOO_LOW",
        message: `table chips must be >= ${MIN_BUYIN}`,
        table_chips: this.spectatorTableChips,
        min_buyin: MIN_BUYIN,
      });
      return;
    }

    this.heroSeat = seat;
    this.isSpectator = false;
    const heroSeed = PLAYER_SEEDS.find((item) => item.seat === seat) || PLAYER_SEEDS[0];
    const heroName = this.profile.username || heroSeed.username;
    const heroPlayer = makeTablePlayer({
      ...heroSeed,
      seat,
      username: heroName,
      chips: this.spectatorTableChips,
    });
    heroPlayer.in_hand = false;
    this.table.players.push(heroPlayer);

    this.emit("seat_taken", {
      game_id: GAME_ID,
      table_id: TABLE_ID,
      hero_seat: seat,
      is_spectator: false,
      can_act: false,
      table_chips: this.spectatorTableChips,
      waiting_this_hand: true,
      table: clone(this.table),
    });
    this.emit("table_player_joined", {
      table_id: TABLE_ID,
      player: makeJoinedPayload({ ...heroSeed, seat, username: heroName }),
    });
    this.emitTableState();
  }

  handleStandUp() {
    if (!this.table) {
      this.emit("error", { code: "STAND_UP_NOT_ALLOWED", message: "not at table" });
      return;
    }
    // 只允許在牌局之間（非進行中）退座
    if (this.table.status === "playing") {
      this.emit("error", {
        code: "STAND_UP_NOT_ALLOWED",
        message: "stand up is only allowed between hands",
      });
      return;
    }
    const previousSeat = Number.isInteger(this.heroSeat) ? this.heroSeat : null;
    if (previousSeat !== null) {
      this.table.players = this.table.players.filter((p) => Number(p.seat) !== previousSeat);
    }
    this.isSpectator = true;
    // 內部用 -1 哨兵（不是 null）避免 findPlayer(Number(null)===0) 誤命中座位 0；
    // 對外送出的封包仍帶 hero_seat:null。
    this.heroSeat = -1;

    this.emit("spectator_mode", {
      game_id: GAME_ID,
      table_id: TABLE_ID,
      stakes_id: STAKES_ID,
      previous_seat: previousSeat,
      hero_seat: null,
      is_spectator: true,
      can_act: false,
      table_chips: this.spectatorTableChips,
      table: clone(this.table),
    });
    this.emitTableState();
  }

  async runFlow(runId) {
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.wait(FLOW_JOIN_START_DELAY_MS, runId);

    // 觀戰時保留多個空位，讓玩家可任意選位坐下（其餘座位才安排機器人）。
    // 非觀戰時僅保留 hero 自己的座位。
    const reservedSeats = this.isSpectator
      ? new Set([0, 2, 4])
      : new Set([this.heroSeat]);

    for (const seed of PLAYER_SEEDS) {
      if (!this.isRunActive(runId)) {
        return;
      }
      if (reservedSeats.has(seed.seat)) {
        continue;
      }
      if (!this.findPlayer(seed.seat)) {
        this.table.players.push(makeTablePlayer(seed));
      }
      this.emit("table_player_joined", {
        table_id: TABLE_ID,
        player: makeJoinedPayload(seed),
      });
      await this.wait(FLOW_PLAYER_JOIN_GAP_MS, runId);
    }

    if (!this.isRunActive(runId)) {
      return;
    }

    this.emitTableState();
    await this.wait(FLOW_AFTER_ALL_JOIN_GAP_MS, runId);

    this.emit("table_countdown", {
      table_id: TABLE_ID,
      seconds: FLOW_COUNTDOWN_SECONDS,
    });

    await this.wait(FLOW_COUNTDOWN_WAIT_MS, runId);
    await this.runOneHand(runId, this.nextHandId);
    this.nextHandId += 1;
  }

  async runOneHand(runId, handId) {
    if (!this.isRunActive(runId) || !this.table) {
      return;
    }

    this.preparePlayersForNewHand();
    this.table.status = "playing";
    this.table.round = "preflop";
    this.table.hand_id = handId;
    this.table.community = [];
    this.table.pot = 0;
    this.table.current_bet = 0;
    this.table.bets = {};
    this.table.round_total_bet = 0;
    this.table.dealer_seat = 2;
    this.table.sb_seat = 3;
    this.table.bb_seat = 4;
    this.handContribBySeat = {};

    this.emit("hand_start", {
      hand_id: handId,
      dealer_seat: this.table.dealer_seat,
      sb_seat: this.table.sb_seat,
      bb_seat: this.table.bb_seat,
      table: {
        table_id: TABLE_ID,
        status: "playing",
        round: "preflop",
        hand_id: handId,
        dealer_seat: this.table.dealer_seat,
        sb_seat: this.table.sb_seat,
        bb_seat: this.table.bb_seat,
      },
    });

    this.postBlind(this.table.sb_seat, SMALL_BLIND);
    this.postBlind(this.table.bb_seat, BIG_BLIND);

    this.emit("post_blinds", {
      table_id: TABLE_ID,
      hand_id: handId,
      sb_seat: this.table.sb_seat,
      bb_seat: this.table.bb_seat,
      sb_amount: SMALL_BLIND,
      bb_amount: BIG_BLIND,
      pot: this.table.pot,
      bets: clone(this.table.bets),
      current_bet: this.table.current_bet,
      round_total_bet: this.table.round_total_bet,
    });

    this.emitTableState();
    await this.wait(FLOW_AFTER_BLINDS_GAP_MS, runId);

    await this.dealHoleCards(runId, handId);
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.runPreflop(runId, handId);
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.runFlop(runId, handId);
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.runTurn(runId, handId);
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.runRiver(runId, handId);
    if (!this.isRunActive(runId)) {
      return;
    }

    await this.runShowdown(runId, handId);
  }

  preparePlayersForNewHand() {
    this.table.players.forEach((player) => {
      player.bet = 0;
      player.hole_count = 0;
      player.last_action = null;
      player.last_action_at = null;
      player.in_hand = Number(player.chips) > 0;
    });
  }

  postBlind(seat, amount) {
    const player = this.findPlayer(seat);
    if (!player || !player.in_hand) {
      return;
    }
    const paid = Math.min(player.chips, amount);
    player.chips -= paid;
    player.bet += paid;
    player.last_action = "post_blind";
    player.last_action_at = Date.now();
    this.table.pot += paid;
    this.table.current_bet = Math.max(this.table.current_bet, player.bet);
    this.table.bets[String(seat)] = player.bet;
    this.table.round_total_bet = sumRoundBets(this.table.bets);
    this.addHandContribution(seat, paid);
  }

  addHandContribution(seatRaw, amountRaw) {
    const seat = Number(seatRaw);
    const amount = Number(amountRaw);
    if (!Number.isFinite(seat) || !Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const key = String(seat);
    const prev = Number(this.handContribBySeat[key] ?? 0);
    this.handContribBySeat[key] = (Number.isFinite(prev) ? prev : 0) + amount;
  }

  buildPlayerResults(revealsRaw, awardsRaw) {
    const reveals = revealsRaw && typeof revealsRaw === "object" ? revealsRaw : {};
    const awards = Array.isArray(awardsRaw) ? awardsRaw : [];
    const winBySeat = {};
    awards.forEach((item) => {
      const seat = Number(item?.seat);
      const amount = Number(item?.amount);
      if (!Number.isFinite(seat) || !Number.isFinite(amount) || amount <= 0) {
        return;
      }
      const key = String(seat);
      const prev = Number(winBySeat[key] ?? 0);
      winBySeat[key] = (Number.isFinite(prev) ? prev : 0) + amount;
    });

    const players = Array.isArray(this.table?.players) ? this.table.players : [];
    return players.map((player) => {
      const seat = Number(player?.seat);
      const key = String(seat);
      const reveal = reveals[key] && typeof reveals[key] === "object" ? reveals[key] : null;
      const handRank = reveal?.hand_rank ?? null;
      const best5 = Array.isArray(reveal?.best5) ? clone(reveal.best5) : [];
      const contribAmount = Number(this.handContribBySeat[key] ?? 0);
      const winAmount = Number(winBySeat[key] ?? 0);
      const safeContrib = Number.isFinite(contribAmount) ? contribAmount : 0;
      const safeWin = Number.isFinite(winAmount) ? winAmount : 0;
      return {
        seat,
        user_id: Number(player?.user_id),
        username: String(player?.username || `P${seat}`),
        avatar: String(player?.avatar || "avatar_001"),
        hand_rank: handRank,
        best5,
        contrib_amount: safeContrib,
        win_amount: safeWin,
        net_amount: safeWin - safeContrib,
      };
    });
  }

  buildRakeInfo(awardsRaw) {
    const awards = Array.isArray(awardsRaw) ? awardsRaw : [];
    const potTotal = Math.max(0, Number(this.table?.pot || 0));
    const payoutTotal = Math.max(0, awards.reduce((sum, item) => {
      const amount = Number(item?.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sum;
      }
      return sum + amount;
    }, 0));
    const rakePercent = 0.1;
    const rakeCapBb = 20;
    const rakeCapAmount = rakeCapBb * BIG_BLIND;
    const rakeAmount = Math.max(0, potTotal - payoutTotal);
    return {
      pot_total: potTotal,
      rake_percent: rakePercent,
      rake_cap_bb: rakeCapBb,
      rake_cap_amount: rakeCapAmount,
      rake_amount: rakeAmount,
      payout_total: payoutTotal,
    };
  }

  async dealHoleCards(runId, handId) {
    for (let cardIndex = 0; cardIndex < 2; cardIndex += 1) {
      for (let seat = 0; seat < 6; seat += 1) {
        if (!this.isRunActive(runId)) {
          return;
        }
        const player = this.findPlayer(seat);
        if (!player || !player.in_hand) {
          continue;
        }
        player.hole_count = Math.max(Number(player.hole_count || 0), cardIndex + 1);

        this.emit("deal_card", {
          table_id: TABLE_ID,
          hand_id: handId,
          seat,
          card_index: cardIndex,
        });

        if (seat === this.heroSeat) {
          const card = HOLE_CARDS_BY_SEAT[this.heroSeat]?.[cardIndex] || HERO_HOLE_CARDS[cardIndex];
          this.emit("deal_private", {
            table_id: TABLE_ID,
            hand_id: handId,
            seat,
            card_index: cardIndex,
            card,
          });
        }

        await this.wait(DEAL_CARD_GAP_MS, runId);
      }
    }

    if (!this.isRunActive(runId)) {
      return;
    }

    this.emit("hole_cards", {
      table_id: TABLE_ID,
      hand_id: handId,
      cards: HERO_HOLE_CARDS,
    });

    this.emitTableState();
    await this.wait(DEAL_AFTER_HOLE_GAP_MS, runId);
  }

  async runPreflop(runId, handId) {
    await this.performBotAction(runId, handId, {
      seat: 5,
      round: "preflop",
      action: "fold",
    });

    await this.performHeroTurn(runId, handId, {
      round: "preflop",
      allowed: ["fold", "call", "raise", "allin"],
      timeout: 10,
      defaultAction: { action: "call" },
    });

    await this.performBotAction(runId, handId, {
      seat: 1,
      round: "preflop",
      action: "raise",
      raiseTo: 200,
    });

    await this.performBotAction(runId, handId, {
      seat: 2,
      round: "preflop",
      action: "call",
    });

    await this.performBotAction(runId, handId, {
      seat: 3,
      round: "preflop",
      action: "allin",
    });

    await this.performBotAction(runId, handId, {
      seat: 4,
      round: "preflop",
      action: "call",
    });

    await this.performHeroTurn(runId, handId, {
      round: "preflop",
      allowed: ["fold", "call", "allin"],
      timeout: 10,
      defaultAction: { action: "call" },
    });

    await this.performBotAction(runId, handId, {
      seat: 1,
      round: "preflop",
      action: "call",
    });

    await this.performBotAction(runId, handId, {
      seat: 2,
      round: "preflop",
      action: "call",
    });

    this.emitTableState();
    await this.wait(STREET_SETTLE_GAP_MS, runId);
  }

  async runFlop(runId, handId) {
    this.startBettingRound("flop", ["Qs", "7h", "2c"]);

    await this.performBotAction(runId, handId, {
      seat: 4,
      round: "flop",
      action: "check",
    });

    await this.performHeroTurn(runId, handId, {
      round: "flop",
      allowed: ["check", "bet", "allin"],
      timeout: 10,
      defaultAction: { action: "bet", raise_to: 300 },
    });

    await this.performBotAction(runId, handId, {
      seat: 1,
      round: "flop",
      action: "call",
    });

    await this.performBotAction(runId, handId, {
      seat: 2,
      round: "flop",
      action: "fold",
    });

    await this.performBotAction(runId, handId, {
      seat: 4,
      round: "flop",
      action: "call",
    });

    this.emitTableState();
    await this.wait(STREET_SETTLE_GAP_MS, runId);
  }

  async runTurn(runId, handId) {
    this.startBettingRound("turn", ["9d"]);

    await this.performBotAction(runId, handId, {
      seat: 4,
      round: "turn",
      action: "check",
    });

    await this.performHeroTurn(runId, handId, {
      round: "turn",
      allowed: ["check", "bet", "allin"],
      timeout: 10,
      defaultAction: { action: "check" },
    });

    await this.performBotAction(runId, handId, {
      seat: 1,
      round: "turn",
      action: "check",
    });

    this.emitTableState();
    await this.wait(STREET_SETTLE_GAP_MS, runId);
  }

  async runRiver(runId, handId) {
    this.startBettingRound("river", ["Qd"]);

    await this.performBotAction(runId, handId, {
      seat: 4,
      round: "river",
      action: "check",
    });

    await this.performHeroTurn(runId, handId, {
      round: "river",
      allowed: ["check", "bet", "allin"],
      timeout: 10,
      defaultAction: { action: "check" },
    });

    await this.performBotAction(runId, handId, {
      seat: 1,
      round: "river",
      action: "check",
    });

    this.emitTableState();
    await this.wait(STREET_SETTLE_GAP_MS, runId);
  }

  async runShowdown(runId, handId) {
    if (!this.isRunActive(runId)) {
      return;
    }

    const reveals = {
      "0": {
        seat: 0,
        hole: ["Ah", "Kd"],
        best5: ["Ah", "Kd", "Qs", "Qd", "9d"],
        hand_rank: "one_pair",
      },
      "1": {
        seat: 1,
        hole: ["Qh", "Qc"],
        best5: ["Qh", "Qc", "Qs", "Qd", "9d"],
        hand_rank: "four_of_a_kind",
      },
      "3": {
        seat: 3,
        hole: ["7s", "7d"],
        best5: ["7s", "7d", "7h", "Qs", "Qd"],
        hand_rank: "full_house",
      },
      "4": {
        seat: 4,
        hole: ["Jc", "Td"],
        best5: ["Jc", "Td", "Qs", "9d", "7h"],
        hand_rank: "high_card",
      },
    };

    this.emit("showdown", {
      table_id: TABLE_ID,
      hand_id: handId,
      reason: "showdown",
      reveals,
    });

    await this.wait(SHOWDOWN_TO_AWARD_GAP_MS, runId);
    if (!this.isRunActive(runId)) {
      return;
    }

    const awards = [{ seat: 1, amount: 5900 }];
    const awardBreakdown = [
      {
        seat: 1,
        amount: 5000,
        pot_index: 0,
        hand_rank: "four_of_a_kind",
        best5: ["Qh", "Qc", "Qs", "Qd", "9d"],
      },
      {
        seat: 1,
        amount: 900,
        pot_index: 1,
        hand_rank: "four_of_a_kind",
        best5: ["Qh", "Qc", "Qs", "Qd", "9d"],
      },
    ];
    const playerResults = this.buildPlayerResults(reveals, awards);
    const rake = this.buildRakeInfo(awards);

    this.emit("award", {
      table_id: TABLE_ID,
      hand_id: handId,
      reason: "showdown",
      awards,
      award_breakdown: awardBreakdown,
      player_results: playerResults,
      rake,
    });

    await this.wait(AWARD_TO_HAND_END_GAP_MS, runId);
    if (!this.isRunActive(runId)) {
      return;
    }

    const finalChips = {
      0: 6700,
      1: 16600,
      2: 5500,
      3: 0,
      4: 3700,
      5: 3000,
    };

    const finalInHand = {
      0: true,
      1: true,
      2: true,
      3: false,
      4: true,
      5: false,
    };

    this.table.status = "waiting";
    this.table.round = "waiting";
    this.table.community = [];
    this.table.pot = 0;
    this.table.current_bet = 0;
    this.table.bets = {};
    this.table.round_total_bet = 0;
    this.table.dealer_seat = null;
    this.table.sb_seat = null;
    this.table.bb_seat = null;

    this.table.players.forEach((player) => {
      const seat = Number(player.seat);
      player.chips = Number(finalChips[seat] ?? player.chips);
      player.in_hand = Boolean(finalInHand[seat]);
      player.bet = 0;
      player.hole_count = 0;
      player.last_action = null;
      player.last_action_at = null;
    });

    this.emit("hand_end", {
      table_id: TABLE_ID,
      hand_id: handId,
      reason: "showdown",
      awards,
      award_breakdown: [
        { seat: 1, amount: 5000, pot_index: 0 },
        { seat: 1, amount: 900, pot_index: 1 },
      ],
      reveals: {
        "0": { seat: 0, hole: ["Ah", "Kd"] },
        "1": { seat: 1, hole: ["Qh", "Qc"] },
        "3": { seat: 3, hole: ["7s", "7d"] },
        "4": { seat: 4, hole: ["Jc", "Td"] },
      },
      player_results: playerResults,
      rake,
      table: clone(this.table),
    });

    this.emit("wallet_state", {
      wallet_balance: this.walletBalance,
      table_chips: this.findPlayer(this.heroSeat)?.chips ?? 0,
    });
  }

  startBettingRound(round, newCards) {
    this.table.round = round;
    this.table.current_bet = 0;
    this.table.bets = {};
    this.table.round_total_bet = 0;
    this.table.players.forEach((player) => {
      player.bet = 0;
    });

    this.table.community = [...this.table.community, ...newCards];

    this.emit("deal_community", {
      table_id: TABLE_ID,
      hand_id: this.table.hand_id,
      round,
      cards: newCards,
      community: [...this.table.community],
      round_total_bet: this.table.round_total_bet,
    });

    this.emitTableState();
  }

  async performBotAction(runId, handId, { seat, round, action, raiseTo }) {
    if (!this.isRunActive(runId)) {
      return;
    }

    const player = this.findPlayer(seat);
    if (!player || !player.in_hand) {
      return;
    }

    await this.wait(BOT_TURN_LEAD_IN_MS, runId);
    if (!this.isRunActive(runId)) {
      return;
    }

    this.emitTurn(seat, handId, round, 10);
    // 模擬玩家思考：固定等 1 秒才下注/行動
    await this.wait(BOT_ACTION_THINK_MS, runId);
    if (!this.isRunActive(runId)) {
      return;
    }

    this.applyAndEmitAction(seat, action, raiseTo);
  }

  async performHeroTurn(runId, handId, { round, allowed, timeout, defaultAction }) {
    if (!this.isRunActive(runId)) {
      return;
    }

    const hero = this.findPlayer(this.heroSeat);
    if (!hero || !hero.in_hand) {
      return;
    }

    await this.wait(HERO_TURN_LEAD_IN_MS, runId);
    if (!this.isRunActive(runId)) {
      return;
    }

    this.emitTurn(this.heroSeat, handId, round, timeout);

    const toCall = Math.max(0, Number(this.table.current_bet || 0) - Number(hero.bet || 0));
    this.emit("action_request", {
      table_id: TABLE_ID,
      hand_id: handId,
      seat: this.heroSeat,
      to_call: toCall,
      current_bet: Number(this.table.current_bet || 0),
      my_bet: Number(hero.bet || 0),
      min_raise_to: Math.max(Number(this.table.current_bet || 0) + BIG_BLIND, BIG_BLIND * 2),
      big_blind: BIG_BLIND,
      pot: Number(this.table.pot || 0),
      round_total_bet: Number(this.table.round_total_bet || 0),
      allowed,
      timeout,
    });

    const heroAction = await this.waitHeroAction(runId, allowed, timeout, defaultAction);
    if (!this.isRunActive(runId) || !heroAction) {
      return;
    }

    this.applyAndEmitAction(this.heroSeat, heroAction.action, heroAction.raise_to);
  }

  waitHeroAction(runId, allowed, timeoutSec, defaultAction) {
    this.cancelPendingHeroAction();

    return new Promise((resolve) => {
      const normalizedAllowed = Array.isArray(allowed)
        ? allowed.map((item) => String(item || "").toLowerCase())
        : [];

      const timeoutMs = Math.max(1000, Math.floor(Number(timeoutSec || 10) * 1000));
      const timer = this.schedule(timeoutMs, () => {
        const pending = this.pendingHeroAction;
        if (!pending || pending.runId !== runId) {
          return;
        }
        this.pendingHeroAction = null;
        resolve(defaultAction || { action: "check" });
      });

      this.pendingHeroAction = {
        runId,
        allowed: normalizedAllowed,
        timer,
        resolve,
      };
    });
  }

  handleHeroAction(data) {
    const pending = this.pendingHeroAction;
    if (!pending) {
      return;
    }

    const action = String(data?.action || "").toLowerCase();
    if (!pending.allowed.includes(action)) {
      return;
    }

    this.cancelTimer(pending.timer);
    this.pendingHeroAction = null;
    pending.resolve({
      action,
      raise_to: data?.raise_to,
    });
  }

  applyAndEmitAction(seat, actionRaw, raiseToRaw) {
    const player = this.findPlayer(seat);
    if (!player || !player.in_hand) {
      return;
    }

    const action = String(actionRaw || "").toLowerCase();
    let finalAction = action;
    let paid = 0;

    if (action === "fold") {
      player.in_hand = false;
      paid = 0;
    } else if (action === "check") {
      paid = 0;
    } else if (action === "call") {
      const toCall = Math.max(0, Number(this.table.current_bet || 0) - Number(player.bet || 0));
      paid = Math.min(Number(player.chips || 0), toCall);
      if (paid < toCall) {
        finalAction = "allin";
      }
    } else if (action === "raise" || action === "bet") {
      let target = Number(raiseToRaw);
      const minRaiseTo = Math.max(Number(this.table.current_bet || 0) + BIG_BLIND, BIG_BLIND * 2);
      if (!Number.isFinite(target) || target < minRaiseTo) {
        target = minRaiseTo;
      }
      const maxCommit = Number(player.bet || 0) + Number(player.chips || 0);
      const commitTo = Math.min(target, maxCommit);
      paid = Math.max(0, commitTo - Number(player.bet || 0));
      this.table.current_bet = Math.max(Number(this.table.current_bet || 0), commitTo);
      if (commitTo >= maxCommit) {
        finalAction = "allin";
      }
    } else if (action === "allin") {
      paid = Number(player.chips || 0);
      const commitTo = Number(player.bet || 0) + paid;
      this.table.current_bet = Math.max(Number(this.table.current_bet || 0), commitTo);
      finalAction = "allin";
    } else {
      return;
    }

    player.chips = Math.max(0, Number(player.chips || 0) - paid);
    player.bet = Number(player.bet || 0) + paid;
    player.last_action = finalAction;
    player.last_action_at = Date.now();

    this.table.pot = Number(this.table.pot || 0) + paid;
    this.addHandContribution(seat, paid);

    if (player.in_hand) {
      this.table.bets[String(seat)] = Number(player.bet || 0);
    } else {
      delete this.table.bets[String(seat)];
    }
    this.table.round_total_bet = sumRoundBets(this.table.bets);

    this.emit("player_action", {
      table_id: TABLE_ID,
      hand_id: this.table.hand_id,
      seat,
      action: finalAction,
      paid,
      pot: this.table.pot,
      current_bet: this.table.current_bet,
      bets: clone(this.table.bets),
      round_total_bet: this.table.round_total_bet,
    });
  }

  emitTurn(seat, handId, round, timeout) {
    this.emit("turn", {
      table_id: TABLE_ID,
      hand_id: handId,
      seat,
      timeout,
      round,
    });
  }

  emitTableState() {
    if (!this.table) {
      return;
    }
    this.emit("table_state", {
      hero_seat: this.isSpectator ? null : this.heroSeat,
      is_spectator: this.isSpectator,
      can_act: false,
      table_chips: this.isSpectator ? this.spectatorTableChips : undefined,
      table: clone(this.table),
    });
  }

  findPlayer(seat) {
    if (!this.table?.players) {
      return null;
    }
    return this.table.players.find((item) => Number(item.seat) === Number(seat)) || null;
  }

  isRunActive(runId) {
    return this.connected && this.currentRunId === runId;
  }

  wait(ms, runId) {
    return new Promise((resolve) => {
      const waitCtx = {
        timer: null,
        resolve: (ok) => {
          this.pendingWaits.delete(waitCtx);
          resolve(ok);
        },
      };

      waitCtx.timer = this.schedule(ms, () => {
        waitCtx.resolve(this.isRunActive(runId));
      });

      this.pendingWaits.add(waitCtx);
    });
  }

  schedule(ms, fn) {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      fn?.();
    }, Math.max(0, Number(ms) || 0));

    this.timers.add(timer);
    return timer;
  }

  cancelTimer(timer) {
    if (!timer) {
      return;
    }
    if (this.timers.has(timer)) {
      window.clearTimeout(timer);
      this.timers.delete(timer);
      return;
    }
    window.clearTimeout(timer);
  }

  cancelPendingHeroAction() {
    if (!this.pendingHeroAction) {
      return;
    }
    this.cancelTimer(this.pendingHeroAction.timer);
    const resolver = this.pendingHeroAction.resolve;
    this.pendingHeroAction = null;
    resolver?.(null);
  }

  stopSimulation() {
    this.currentRunId += 1;

    this.cancelPendingHeroAction();

    this.pendingWaits.forEach((item) => {
      this.cancelTimer(item.timer);
      item.resolve(false);
    });
    this.pendingWaits.clear();

    this.timers.forEach((timer) => {
      window.clearTimeout(timer);
    });
    this.timers.clear();
  }
}
