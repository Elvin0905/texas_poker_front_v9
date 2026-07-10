// 深拷貝工具：避免外部直接改到 store 內部 state
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

// 倒數計時錨點：判斷封包是否屬於「同一個回合」。
//
// 真實伺服器的 turn / action_request 封包會在同一個回合內被重複下發
// （例如切換視窗回來觸發重連 reauth 時）。實測證據顯示：
//   - 重送時 timeout 欄位「不一定」遞減，可能仍是原本的完整秒數（例如 8.218），
//     也可能是當下剩餘秒數（例如 5.458）；無法靠 timeout 數值判斷是否為重送。
//   - 伺服器封包沒有夾帶穩定的 started_at。
// 若每次都把 started_at 重新蓋成 Date.now()，原本已經倒數到 6 的畫面會因為
// remain = ceil(timeout) 往上跳。
//
// 真正穩定的判斷依據是「同一個座位是否仍在同一個 round 行動」：
//   - 重送：seat 與 round 都不變 → 視為同一回合，完整保留原錨點（started_at + timeout），
//     讓牆鐘倒數維持單調遞減，並忽略重送帶來的 timeout 變動。
//   - 新回合：行動一定會先輪到別人再輪回來（seat 改變）或進入新的 round（round 改變），
//     此時才重新下錨。
// 換桌 / 新一手會走 table_state，把 current_turn_started_at 清成 null；只要錨點無效，
// 即使 key 相同也會強制重新下錨，避免沿用上一手的舊錨點。
function resolveTurnAnchor(table, timeoutSec, seatNo, round, deadlineMs) {
	const now = Date.now();
	const key = `${Number.isFinite(seatNo) ? seatNo : "?"}|${round != null ? round : "?"}`;
	// 後端權威截止時間（Unix epoch ms）。有就優先用，倒數天生單調（固定時間點）。
	const deadlineAt =
		Number.isFinite(deadlineMs) && deadlineMs > 0 ? deadlineMs : null;
	if (!Number.isFinite(timeoutSec)) {
		return { startedAt: now, timeout: null, key, deadlineAt };
	}
	const prevStarted = Number(table.current_turn_started_at);
	const prevTimeout = Number(table.current_turn_timeout);
	const prevAnchorValid =
		table.current_turn_started_at != null &&
		table.current_turn_timeout != null &&
		Number.isFinite(prevStarted) &&
		prevStarted > 0 &&
		Number.isFinite(prevTimeout);
	if (table.current_turn_anchor_key === key && prevAnchorValid) {
		// 同一座位、同一 round 的重送：保留原錨點與原截止時間，避免倒數往上跳。
		const prevDeadline = Number(table.current_turn_deadline_at);
		return {
			startedAt: prevStarted,
			timeout: prevTimeout,
			key,
			deadlineAt:
				Number.isFinite(prevDeadline) && prevDeadline > 0
					? prevDeadline
					: deadlineAt,
		};
	}
	return { startedAt: now, timeout: timeoutSec, key, deadlineAt };
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
	if (
		type === "table_joined" ||
		type === "table_state" ||
		type === "hand_end" ||
		type === "award"
	) {
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
		"spectator_mode",
		"seat_taken",
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
			lastLeftTableId: null, // 最近一次主動離開的 table_id（防止延遲 table_state 把 page 拉回 "table"）
			heroSeat: null, // 我方座位號
			isSpectator: false, // 是否處於觀戰模式（不佔座位、不能行動）
			canAct: false, // 是否輪到 hero 且可操作（觀戰時永遠 false）
			previousSeat: null, // 退座前的座位（供 UI 參考）
			tableChips: 0, // 當前桌上籌碼（觀戰/入座檢查用）
			heroJoinedWaiting: false, // 英雄以等待狀態加入（換桌中途加入）
			heroSwitchPending: false, // 換桌流程進行中（等待舊局結束才能入座）
			handId: null, // 目前手牌編號（用來判斷新一手）
			handContribBySeat: {}, // 本手各座位已投入籌碼（用於轉桌/離桌風險提示）
			holeCardsBySeat: {}, // 已知手牌（seat -> [card1, card2]）
			showdownRevealsBySeat: {}, // 攤牌揭露手牌（seat -> [card1, card2]）
			actionRequest: null, // 目前輪到我可操作時的限制與資訊
			handEndSeq: 0, // hand_end 事件序號（每次 +1，scene 用來即時偵測並清除殘留手牌）
			handEndNextEventIn: 0, // hand_end 的 next_event_in 秒數（0 = 無倒數）
			lastDealCard: null, // 最近一次 deal_card 事件
			dealCardVersion: 0, // deal_card 事件版本號（每次 +1）
			rebuyOffer: null, // 補碼提示
			rebuyResult: null, // 補碼結果
			handResult: null, // 本手結算資訊（只由 award 的 player_results 觸發 UI）
			handResultVersion: 0, // 結算事件版本號（每手首次結算事件 +1）
			handResultEventKey: "", // 已觸發過結算 UI 的手牌 key（table_id|hand_id）
			myHandReports: null, // 我的手牌報表（hand_reports_ok）
			myHandReportsVersion: 0, // 我的手牌報表版本（每次成功回傳 +1）
			myDailySettlement14d: null, // 最近 14 天日結（daily_settlement_14d_ok）
			myDailySettlement14dVersion: 0, // 最近 14 天日結版本（每次成功回傳 +1）
			walletBalance: 0, // 錢包餘額（來自 wallet_state）
			tableChips: 0, // 牌桌籌碼（來自 wallet_state）
			nextHandCountdownSeconds: 0, // 下一手開局倒數秒數（來自 table_countdown，0 = 無倒數）
			lastError: null, // 最後一次錯誤
			errorVersion: 0, // 錯誤事件版本號（每次 error 封包 +1）
			accountExists: null, // check_username 結果：true=存在，false=不存在，null=未查詢
			accountCheckVersion: 0, // check_username 回應版本號
			verifyCodeVersion: 0, // 驗證碼驗證成功版本號（verify_sms_code_ok / verify_email_code_ok）
			fpEventVersion: 0, // 忘記密碼流程事件版本號
			fpEventType: null, // 忘記密碼流程事件類型：'forgot_ok' | 'reset_code_ok' | 'reset_password_ok'
			pendingOpenDailySettlement: 0, // 回放結束後開啟當日明細（版本號遞增觸發）
			eventLog: [], // 前端事件簡易 log
			// 大老二專屬狀態
			bigTwoHeroCards: [], // 大老二英雄手牌（13張）
			bigTwoHeroCardsVersion: 0, // 每次更新 +1
			bigTwoHeroCardsRestored: false, // 由重連 sessionStorage 還原（非新發牌）→ 場景靜態顯示、不重播發牌動畫
			bigTwoLastPlay: null, // 最新出牌：{ seat, cards }
			bigTwoLastPlayVersion: 0, // 每次出牌 +1
			bigTwoHandResult: null, // 本局結果
			bigTwoHandResultVersion: 0, // 每次結果 +1
			bigTwoReveals: null, // 局末各家公開牌（來自 hand_end.reveals / player_results；big_two 專屬，供翻牌動畫）
			bigTwoActionSeq: null, // 最新 action_seq（來自 turn 或 action_request）
			// 下一手 ready window 狀態（來自通用 hand_ready_state / hand_ready_ack 事件）。新增欄位、僅供
			// 大老二場景讀取顯示「等待其他玩家 (n/m)」；撲克不讀此欄位，故其行為不受影響。
			handReadyState: null, // { table_id, hand_id, ready_count, required_count, pending_rebuy, all_ready }
			handReadyAck: null, // { …, accepted, reason, expires_at }（本端 hand_ready 的回執）
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
		// 換桌時立即清掉上一桌的「下一局倒數」與結算狀態，避免帶到新桌仍顯示倒數。
		this.state.nextHandCountdownSeconds = 0;
		this.state.handResult = null;
		this.state.handResultEventKey = "";
		// 換桌：清掉上一桌的大老二狀態（中央牌面、手牌、結算等）；bump version 讓場景清除中央牌面。
		// 皆為 bigTwo* 專屬欄位，撲克不讀取，故不影響撲克。
		this.state.bigTwoHeroCards = [];
		this.state.bigTwoLastPlay = null;
		this.state.bigTwoLastPlayVersion += 1;
		this.state.bigTwoHandResult = null;
		this.state.bigTwoActionSeq = null;
		this.state.handReadyState = null; // 換桌：清掉上一桌的 ready window 狀態（新增欄位，撲克不讀）
		this.state.handReadyAck = null;
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
		this.state.lastLeftTableId = tableId || null;
		this.state.page = "gameLobby";
		this.state.table = null;
		this.state.tableUpdateSource = "";
		this.state.tableId = null;
		this.state.heroSeat = null;
		this.state.isSpectator = false;
		this.state.canAct = false;
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
		this.state.bigTwoHeroCards = [];
		this.state.bigTwoLastPlay = null;
		this.state.bigTwoHandResult = null;
		this.state.bigTwoActionSeq = null;
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
		this.state.isSpectator = false;
		this.state.canAct = false;
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
		this.state.verifyCodeVersion = 0;
		this.state.fpEventVersion = 0;
		this.state.fpEventType = null;
		this.state.pendingOpenDailySettlement = 0;
		this.state.eventLog = [];
		this.state.bigTwoHeroCards = [];
		this.state.bigTwoLastPlay = null;
		this.state.bigTwoHandResult = null;
		this.state.bigTwoActionSeq = null;
		this.emit();
	}

	clearLastError() {
		this.state.lastError = null;
		this.emit();
	}

	clearPendingDailySettlement() {
		this.state.pendingOpenDailySettlement = 0;
		this.emit();
	}

	openDailySettlementAfterReplay(returnPage = "lobby") {
		this.endLeaveTableFlow();
		const _replayTableId = String(this.state.table?.table_id ?? "");
		if (_replayTableId) {
			this.state.lastLeftTableId = _replayTableId;
		}
		this.state.page = returnPage;
		this.state.table = null;
		this.state.tableUpdateSource = "";
		this.state.tableId = null;
		this.state.heroSeat = null;
		this.state.isSpectator = false;
		this.state.canAct = false;
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
		// Show loading overlay during scene transition — hidden by lobbyScene/gameLobbyScene once modal is ready
		(function showReplayExitLoading() {
			var ov = document.getElementById("replay-exit-loading");
			if (ov) {
				ov.style.display = "block";
				ov._startSprite && ov._startSprite();
				ov._resetFill && ov._resetFill();
				return;
			}
			var vw = window.innerWidth,
				vh = window.innerHeight;
			var sc = Math.min(vw / 720, vh / 1440);
			var portrait = vh > vw;
			var gameW = Math.round(720 * sc),
				gameH = Math.round(1440 * sc);
			var gameLeft = Math.round((vw - gameW) / 2);
			ov = document.createElement("div");
			ov.id = "replay-exit-loading";
			ov.style.cssText =
				"position:fixed;inset:0;z-index:20000;overflow:hidden;pointer-events:none;";
			var fX = 10,
				fY = 10,
				fW = 750,
				fH = 1640,
				aW = 1679,
				aH = 1996;
			var screenH =
				window.screen && window.screen.height
					? Math.max(vh, window.screen.height)
					: vh;
			var bgLeft = portrait ? 0 : gameLeft - 1;
			var bgTop = portrait ? 0 : -1;
			var bgW = portrait ? vw : gameW + 2;
			var bgH = portrait ? screenH : gameH + 2;
			var cvr = Math.max(bgW / fW, bgH / fH);
			var posX = Math.round(-(fX * cvr + (fW * cvr - bgW) / 2));
			var posY = Math.round(-(fY * cvr + (fH * cvr - bgH) / 2));
			if (posX > 0) posX = 0;
			if (posY > 0) posY = 0;
			var bgDiv = document.createElement("div");
			bgDiv.style.cssText =
				"position:absolute;z-index:1;left:" +
				bgLeft +
				"px;top:" +
				bgTop +
				"px;width:" +
				bgW +
				"px;height:" +
				bgH +
				"px;" +
				"background:url(/assets/variants/main_style/images/login.webp) " +
				posX +
				"px " +
				posY +
				"px/" +
				Math.round(aW * cvr) +
				"px " +
				Math.round(aH * cvr) +
				"px no-repeat;";
			ov.appendChild(bgDiv);
			var oy = Math.round(-100 * sc);
			var size = Math.round(300 * sc);
			var spinnerEl = document.createElement("div");
			spinnerEl.style.cssText =
				"position:absolute;z-index:100;left:" +
				Math.round(vw / 2) +
				"px;top:" +
				Math.round(vh / 2 + oy) +
				"px;" +
				"width:" +
				size +
				"px;height:" +
				size +
				"px;transform:translate(-50%,-50%);overflow:hidden;";
			var inner = document.createElement("div");
			var bgSz = size * 6;
			inner.style.cssText =
				"position:absolute;left:0;top:0;width:" +
				bgSz +
				"px;height:" +
				bgSz +
				"px;" +
				"background:url(/assets/variants/main_style/images/Loading.webp) 0 0/" +
				bgSz +
				"px " +
				bgSz +
				"px no-repeat;will-change:transform;";
			spinnerEl.appendChild(inner);
			ov.appendChild(spinnerEl);
			var frame = 0,
				frameDur = 1000 / 30,
				lastTime = 0,
				spriteTimer = null;
			function startSprite() {
				if (spriteTimer) cancelAnimationFrame(spriteTimer);
				frame = 0;
				lastTime = 0;
				function tick(now) {
					spriteTimer = requestAnimationFrame(tick);
					if (now - lastTime < frameDur) return;
					lastTime = Math.max(lastTime + frameDur, now - frameDur);
					var c = frame % 6,
						r = Math.floor(frame / 6);
					inner.style.transform =
						"translate(" + -c * size + "px," + -r * size + "px)";
					frame = (frame + 1) % 33;
				}
				spriteTimer = requestAnimationFrame(tick);
			}
			startSprite();
			ov._startSprite = startSprite;
			ov._stopSprite = function () {
				if (spriteTimer) {
					cancelAnimationFrame(spriteTimer);
					spriteTimer = null;
				}
			};
			var fsPx = Math.round(35 * sc);
			var pctEl = document.createElement("div");
			pctEl.style.cssText =
				"position:absolute;z-index:102;left:" +
				Math.round(vw / 2) +
				"px;top:" +
				Math.round(vh / 2 + 148 * sc - fsPx / 2 + oy) +
				"px;" +
				"transform:translateX(-50%);color:#ecd5b5;white-space:nowrap;pointer-events:none;" +
				'font-family:"Noto Sans TC","Segoe UI",sans-serif;font-size:' +
				fsPx +
				"px;font-weight:700;" +
				"text-shadow:0 1px 4px rgba(0,0,0,0.85);";
			pctEl.textContent = "載入中 99%";
			ov.appendChild(pctEl);
			var barW = Math.round(275 * sc),
				barH = Math.max(2, Math.round(7 * sc));
			var tp = 4,
				trackW = barW + tp * 2,
				trackH = barH + tp * 2;
			var barCY = Math.round(vh / 2 + 200 * sc + oy);
			var trackEl = document.createElement("div");
			trackEl.style.cssText =
				"position:absolute;z-index:102;left:" +
				Math.round(vw / 2 - trackW / 2) +
				"px;top:" +
				Math.round(barCY - trackH / 2) +
				"px;" +
				"width:" +
				trackW +
				"px;height:" +
				trackH +
				"px;border-radius:" +
				Math.round(trackH / 2) +
				"px;" +
				"background:rgba(0,0,0,0.3);overflow:hidden;";
			var fillEl = document.createElement("div");
			fillEl.style.cssText =
				"position:absolute;left:0;top:0;height:100%;background:rgba(236,213,181,0.88);" +
				"width:0;transition:width 1.2s cubic-bezier(0.25,0.46,0.45,0.94);";
			trackEl.appendChild(fillEl);
			ov.appendChild(trackEl);
			ov._resetFill = function () {
				fillEl.style.transition = "none";
				fillEl.style.width = "0";
				requestAnimationFrame(function () {
					fillEl.style.transition =
						"width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)";
					requestAnimationFrame(function () {
						fillEl.style.width = Math.round(trackW * 0.99) + "px";
					});
				});
			};
			requestAnimationFrame(function () {
				fillEl.style.width = Math.round(trackW * 0.99) + "px";
			});
			document.body.appendChild(ov);
		})();
		this.emit();
	}

	forceBackToGameLobby() {
		const tableId = String(this.state.table?.table_id ?? "");
		if (tableId) this.state.lastLeftTableId = tableId;
		this.endLeaveTableFlow();
		this.state.page = "gameLobby";
		this.state.table = null;
		this.state.tableUpdateSource = "";
		this.state.tableId = null;
		this.state.heroSeat = null;
		this.state.isSpectator = false;
		this.state.canAct = false;
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
		this.state.bigTwoHeroCards = [];
		this.state.bigTwoLastPlay = null;
		this.state.bigTwoHandResult = null;
		this.state.bigTwoActionSeq = null;
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

			// 玩家進度查詢成功（get_my_progress 的回應，§10.35）：更新 user.progress_summary（全域摘要），
			// 供大廳統計面板（等級/場次/勝率/贏場）顯示最新值。純新增訊息型別；不更動任何既有 case。
			// （game_stats／achievements 目前不使用，先忽略。）
			case "my_progress_ok":
				if (data.progress_summary) {
					this.state.user = {
						...(this.state.user ?? {}),
						progress_summary: data.progress_summary,
					};
				}
				break;

			case "update_profile_ok": {
				this.state.user = {
					...(this.state.user ?? {}),
					...data,
				};
				const userId = Number(data.user_id);
				if (
					Number.isFinite(userId) &&
					Array.isArray(this.state.table?.players)
				) {
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
				if (this.state.page !== "table" && this.state.page !== "bigTwo") {
					this.state.page = "gameLobby";
				}
				this.state.gameLobby = data;
				break;

			// 入桌成功
			case "table_joined":
				this.endLeaveTableFlow();
				this.state.page =
					String(data?.game_id || data?.table?.game_id || "texas_holdem") ===
					"big_two"
						? "bigTwo"
						: "table";
				this.state.lastLeftTableId = null;
				this.state.handResult = null;
				this.state.handResultEventKey = "";
				this.state.actionRequest = null;
				this.state.rebuyOffer = null;
				// 進桌/換桌：清掉可能殘留的「下一局倒數」，避免新桌（waiting）仍顯示舊倒數。
				this.state.nextHandCountdownSeconds = 0;
				this.state.holeCardsBySeat = {};
				this.state.showdownRevealsBySeat = {};
				try {
					sessionStorage.removeItem("ngame_hole_cards");
					sessionStorage.removeItem("ngame_hole_cards_hand_id");
					sessionStorage.removeItem("ngame_hole_cards_seat");
				} catch (_) {}
				this.state.heroJoinedWaiting = Boolean(data.waiting_this_hand);
				if (Object.prototype.hasOwnProperty.call(data, "is_spectator")) {
					this.state.isSpectator = Boolean(data.is_spectator);
				}
				if (Object.prototype.hasOwnProperty.call(data, "can_act")) {
					this.state.canAct = Boolean(data.can_act);
				}
				if (this.state.isSpectator) {
					this.state.heroSeat = null;
				}
				if (Number.isFinite(Number(data.table_chips))) {
					this.state.tableChips = Number(data.table_chips);
				}
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
					this._maybeRestoreBigTwoHero(data);
				}
				break;

			// 切換為觀戰模式（stand_up 成功，或本來就在觀戰）
			case "spectator_mode": {
				this.state.isSpectator = true;
				this.state.canAct = false;
				this.state.heroSeat = null;
				this.state.actionRequest = null;
				// 大老二：退座轉觀戰時清掉英雄自己的手牌與中央出牌，避免觀戰畫面殘留剛才那局（additive、big_two-gated；
				// 撲克不讀 bigTwo* 欄位，故不受影響）。bump 版本觸發場景 _checkHeroCards / _checkLastPlay 重繪為空。
				if (
					String(
						data?.table?.game_id || this.state.table?.game_id || "",
					) === "big_two"
				) {
					this.state.bigTwoHeroCards = [];
					this.state.bigTwoHeroCardsVersion += 1;
					this.state.bigTwoHeroCardsRestored = false;
					this.state.bigTwoLastPlay = null;
					this.state.bigTwoLastPlayVersion += 1;
				}
				if (Object.prototype.hasOwnProperty.call(data, "previous_seat")) {
					this.state.previousSeat = data.previous_seat;
				}
				if (Number.isFinite(Number(data.table_chips))) {
					this.state.tableChips = Number(data.table_chips);
				}
				if (data.table && Object.keys(data.table).length > 0) {
					normalizeTableRoundTotalBet(data.table);
					this.syncHandContext(data.table);
					this.state.table = data.table;
					this._maybeRestoreBigTwoHero(data);
				}
				break;
			}

			// 從觀戰入座成功
			case "seat_taken": {
				this.state.isSpectator = false;
				this.state.canAct = false;
				if (Number.isInteger(Number(data.hero_seat))) {
					this.state.heroSeat = Number(data.hero_seat);
				}
				this.state.heroJoinedWaiting = Boolean(data.waiting_this_hand);
				if (Number.isFinite(Number(data.table_chips))) {
					this.state.tableChips = Number(data.table_chips);
				}
				if (data.table && Object.keys(data.table).length > 0) {
					normalizeTableRoundTotalBet(data.table);
					this.syncHandContext(data.table);
					this.state.table = data.table;
					this._maybeRestoreBigTwoHero(data);
				}
				break;
			}

			case "table_countdown": {
				const secs = Number(data.seconds ?? 0);
				this.state.nextHandCountdownSeconds = secs > 0 ? secs : 0;
				break;
			}

			// 新一手開始：要在發私牌前就切換 hand context，避免後續 table_state 才清空造成牌面回背
			case "hand_start": {
				this.state.nextHandCountdownSeconds = 0;
				this.state.handEndNextEventIn = 0;
				this.state.handResult = null;
				this.state.handResultEventKey = "";
				this.state.bigTwoHeroCards = [];
				this.state.bigTwoLastPlay = null;
				this.state.bigTwoLastPlayVersion += 1; // 觸發場景清除上局中央牌面
				this.state.bigTwoActionSeq = null;
				this.state.handReadyState = null; // 新一局：清除上一手的 ready window 狀態（新增欄位，撲克不讀）
				this.state.handReadyAck = null;
				// 新一手開始，清除上一手的 sessionStorage 手牌快取
				try {
					sessionStorage.removeItem("ngame_hole_cards");
					sessionStorage.removeItem("ngame_hole_cards_hand_id");
					sessionStorage.removeItem("ngame_hole_cards_seat");
				} catch (_) {}
				// New hand means hero is no longer "waiting to join" — clear the flag so
				// folding later in this hand doesn't accidentally show the waiting badge.
				this.state.heroJoinedWaiting = false;
				const currentTableId = String(this.state.table?.table_id ?? "");
				const nextTableId = String(
					data.table?.table_id ?? data.table_id ?? currentTableId,
				);
				const nextHandId = Number(data.hand_id ?? data.table?.hand_id);
				if (nextTableId || Number.isFinite(nextHandId)) {
					this.syncHandContext({
						table_id: nextTableId,
						hand_id: Number.isFinite(nextHandId)
							? nextHandId
							: this.state.handId,
					});
				}
				if (!this.state.table && data.table) {
					this.state.table = data.table;
				}
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
						break;
					}
					this.state.table.status = String(
						data.table?.status ?? this.state.table.status ?? "playing",
					);
					this.state.table.round = String(
						data.table?.round ?? data.round ?? "preflop",
					);
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
					this.state.table.current_turn_deadline_at = null;
				}
				this.state.actionRequest = null;
				this.state.rebuyOffer = null;
				break;
			}

			// 牌桌完整狀態同步
			case "table_state": {
				// 防止「主動離桌後延遲封包把 page 拉回 table」的競態問題：
				// 若玩家已主動離開（page = gameLobby），且此封包的 table_id 與離開的桌一致，忽略此次 page 切換。
				const _tsTableId = String(data?.table?.table_id ?? "");
				const _lastLeft = String(this.state.lastLeftTableId ?? "");
				const _isStaleAfterLeave =
					this.state.page === "gameLobby" &&
					_lastLeft &&
					_tsTableId &&
					_tsTableId === _lastLeft;
				this.endLeaveTableFlow();
				const hasHeroSeatField = Object.prototype.hasOwnProperty.call(
					data,
					"hero_seat",
				);
				const nextHeroSeat = Number(data.hero_seat);
				const hasValidHeroSeat = Number.isInteger(nextHeroSeat);
				const tablePlayers = Array.isArray(data?.table?.players)
					? data.table.players
					: [];
				const localUsername = String(this.state?.user?.username ?? "").trim();
				let derivedHeroSeat = null;
				if (localUsername && tablePlayers.length > 0) {
					const localPlayer = tablePlayers.find(
						(player) => String(player?.username ?? "").trim() === localUsername,
					);
					const localSeat = Number(localPlayer?.seat);
					if (Number.isInteger(localSeat)) {
						derivedHeroSeat = localSeat;
					}
				}

				// 斷線重連後，若後端回傳 hero_seat=null，代表玩家已不在牌桌內（通常被系統視為離桌/放棄）
				// 前端要立刻退回遊戲大廳，避免畫面卡在牌桌但操作都失敗。
				// 但若 table.players 仍能對應到自己（例如後端暫時漏掉 hero_seat），就留在牌桌並沿用推導座位。
				if (
					!this.state.isSpectator &&
					hasHeroSeatField &&
					!hasValidHeroSeat &&
					derivedHeroSeat === null
				) {
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

				if (!_isStaleAfterLeave) {
					const _tsGameId = String(data?.game_id || data?.table?.game_id || "");
					this.state.page = _tsGameId === "big_two" ? "bigTwo" : "table";
				}
				if (hasValidHeroSeat) {
					this.state.heroSeat = nextHeroSeat;
				} else if (derivedHeroSeat !== null) {
					this.state.heroSeat = derivedHeroSeat;
				}
				if (Object.prototype.hasOwnProperty.call(data, "is_spectator")) {
					this.state.isSpectator = Boolean(data.is_spectator);
				}
				if (Object.prototype.hasOwnProperty.call(data, "can_act")) {
					this.state.canAct = Boolean(data.can_act);
				}
				if (this.state.isSpectator) {
					this.state.heroSeat = null;
				}
				if (Number.isFinite(Number(data.table_chips))) {
					this.state.tableChips = Number(data.table_chips);
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
					if (!_isStaleAfterLeave) {
						this.state.table = data.table;
					}
					// 重連時，若 holeCardsBySeat 為空，嘗試從 sessionStorage 恢復英雄手牌
					const _heroSeatNum = Number(this.state.heroSeat);
					if (!_isStaleAfterLeave && Number.isInteger(_heroSeatNum)) {
						const _hsKey = String(_heroSeatNum);
						if (!this.state.holeCardsBySeat[_hsKey]?.length) {
							try {
								const _storedHandId = sessionStorage.getItem(
									"ngame_hole_cards_hand_id",
								);
								const _storedSeat = Number(
									sessionStorage.getItem("ngame_hole_cards_seat") ?? "",
								);
								const _curHandId = String(data.table?.hand_id ?? "");
								if (
									_storedHandId &&
									_storedHandId === _curHandId &&
									_storedSeat === _heroSeatNum
								) {
									const _storedCards = JSON.parse(
										sessionStorage.getItem("ngame_hole_cards") || "[]",
									);
									const _cards = toCardArray(_storedCards).slice(0, 2);
									if (_cards.length > 0) {
										this.state.holeCardsBySeat[_hsKey] = _cards;
									}
								}
							} catch (_) {}
						}
					}
					this._maybeRestoreBigTwoHero(data);
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
				if (
					tableId &&
					this.state.table.table_id &&
					tableId !== this.state.table.table_id
				) {
					break;
				}
				if (!Array.isArray(this.state.table.players)) {
					this.state.table.players = [];
				}
				const seatNo = Number(player.seat);
				const idx = this.state.table.players.findIndex(
					(item) => Number(item.seat) === seatNo,
				);
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
				if (this.state.isSpectator) {
					this.state.actionRequest = null;
					this.state.canAct = false;
					break;
				}
				this.state.actionRequest = data;
				// 大老二：同步 action_seq（與 turn 封包的值相同，保持一致）
				if (data.action_seq != null) {
					this.state.bigTwoActionSeq = Number(data.action_seq);
				}
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
					const round =
						data.round != null ? data.round : this.state.table.round;
					const anchor = resolveTurnAnchor(
						this.state.table,
						timeoutSec,
						seatNo,
						round,
						Number(data.deadline_at_ms),
					);
					this.state.table.current_turn_timeout = anchor.timeout;
					this.state.table.current_turn_started_at = anchor.startedAt;
					this.state.table.current_turn_deadline_at = anchor.deadlineAt;
					this.state.table.current_turn_anchor_key = anchor.key;
				}
				{
					const reqSeat = Number(data.seat);
					this.state.canAct =
						Number.isInteger(reqSeat) &&
						Number.isInteger(Number(this.state.heroSeat)) &&
						reqSeat === Number(this.state.heroSeat);
				}
				break;

			// 輪到某個座位行動（全桌廣播）
			case "turn":
				if (this.state.isSpectator) {
					this.state.canAct = false;
				}
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
						break;
					}
					const seatNo = Number(data.seat);
					this.state.table.current_turn_seat = Number.isFinite(seatNo)
						? seatNo
						: null;
					const timeoutSec = Number(data.timeout);
					const round =
						data.round != null ? data.round : this.state.table.round;
					const anchor = resolveTurnAnchor(
						this.state.table,
						timeoutSec,
						seatNo,
						round,
						Number(data.deadline_at_ms),
					);
					this.state.table.current_turn_timeout = anchor.timeout;
					this.state.table.current_turn_started_at = anchor.startedAt;
					this.state.table.current_turn_deadline_at = anchor.deadlineAt;
					this.state.table.current_turn_anchor_key = anchor.key;
					if (data.round) {
						this.state.table.round = data.round;
					}
					// 大老二：turn 封包帶有 action_seq，存下來供出牌時使用
					const isBigTwoTurn =
						String(data.game_id || this.state.table?.game_id || "") ===
						"big_two";
					if (isBigTwoTurn && data.action_seq != null) {
						this.state.bigTwoActionSeq = Number(data.action_seq);
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
					} else if (
						!data.round_total_bet &&
						(data.round || Array.isArray(data.cards))
					) {
						this.state.table.round_total_bet = 0;
					}
				}
				break;

			case "post_blinds":
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
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
						this.state.table.round_total_bet = sumRoundBets(
							this.state.table.bets,
						);
					}
				}
				break;

			case "betting_start":
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
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
						this.state.table.round_total_bet = sumRoundBets(
							this.state.table.bets,
						);
					}
					const actionSeat = Number(data.action_seat);
					this.state.table.current_turn_seat = Number.isFinite(actionSeat)
						? actionSeat
						: null;
					this.state.table.current_turn_timeout = null;
					this.state.table.current_turn_started_at = null;
					this.state.table.current_turn_deadline_at = null;
				}
				this.state.actionRequest = null;
				break;

			case "betting_complete":
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
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
						this.state.table.round_total_bet = sumRoundBets(
							this.state.table.bets,
						);
					}
					this.state.table.current_turn_seat = null;
					this.state.table.current_turn_timeout = null;
					this.state.table.current_turn_started_at = null;
					this.state.table.current_turn_deadline_at = null;
				}
				this.state.actionRequest = null;
				break;

			// 單張發牌事件（常見於每位玩家依序發 2 張手牌）
			case "deal_card":
				if (this.state.table) {
					if (
						data.table_id &&
						this.state.table.table_id &&
						data.table_id !== this.state.table.table_id
					) {
						break;
					}
					const seatNo = Number(data.seat);
					const cardIndex = Number(data.card_index);
					const player = this.state.table.players?.find(
						(item) => Number(item.seat) === seatNo,
					);
					if (player && Number.isFinite(cardIndex)) {
						const nextHoleCount = Math.max(
							Number(player.hole_count ?? 0),
							cardIndex + 1,
						);
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
				if (
					data.table_id &&
					this.state.table.table_id &&
					data.table_id !== this.state.table.table_id
				) {
					break;
				}
				const seatNo = parseSeatNumber(data.seat);
				const cardIndex = Number(data.card_index);
				const card = normalizeCardCode(data.card);
				if (
					seatNo === null ||
					!Number.isFinite(cardIndex) ||
					cardIndex < 0 ||
					cardIndex >= 2 ||
					!card
				) {
					break;
				}
				const player = this.state.table.players?.find(
					(item) => Number(item.seat) === seatNo,
				);
				if (player) {
					player.hole_count = Math.max(
						Number(player.hole_count ?? 0),
						cardIndex + 1,
					);
				}
				this.setKnownHoleCardByIndex(seatNo, cardIndex, card);
				// Only trigger a fly animation if deal_card hasn't already done so for this slot.
				// In normal deal flow the server sends deal_card (public) then deal_private (private
				// card value) for the hero — both would increment dealCardVersion and launch two
				// concurrent fly tweens for the same slot.  Skip the version bump when lastDealCard
				// already matches this seat+card_index so the tween fires exactly once.
				const _prev = this.state.lastDealCard;
				const _alreadyAnimated =
					_prev &&
					Number(_prev.seat) === seatNo &&
					Number(_prev.card_index) === cardIndex;
				if (!_alreadyAnimated) {
					this.state.lastDealCard = {
						table_id: data.table_id,
						hand_id: data.hand_id,
						seat: seatNo,
						card_index: cardIndex,
						at: Date.now(),
					};
					this.state.dealCardVersion += 1;
				}
				break;
			}

			// 私牌兩張（只發給該玩家本人）
			case "hole_cards": {
				if (!this.state.table) {
					break;
				}
				if (
					data.table_id &&
					this.state.table.table_id &&
					data.table_id !== this.state.table.table_id
				) {
					break;
				}
				const heroSeat = parseSeatNumber(this.state.heroSeat);
				if (heroSeat === null) {
					break;
				}
				const isBigTwo =
					String(data.game_id || this.state.table?.game_id || "") === "big_two";
				const allCards = toCardArray(data.cards);
				const cards = isBigTwo ? allCards : allCards.slice(0, 2);
				if (cards.length <= 0) {
					break;
				}
				if (isBigTwo) {
					this.state.bigTwoHeroCards = cards;
					this.state.bigTwoHeroCardsVersion += 1;
					this.state.bigTwoHeroCardsRestored = false; // 真發牌 → 允許發牌動畫
				} else {
					this.setKnownHoleCards(heroSeat, cards, false);
				}
				const player = this.state.table.players?.find(
					(item) => Number(item.seat) === heroSeat,
				);
				if (player) {
					player.hole_count = Math.max(
						Number(player.hole_count ?? 0),
						cards.length,
					);
				}
				// 存入 sessionStorage，供刷新後重建
				try {
					const _handId = String(
						data.hand_id ?? this.state.table?.hand_id ?? "",
					);
					sessionStorage.setItem("ngame_hole_cards", JSON.stringify(cards));
					sessionStorage.setItem("ngame_hole_cards_hand_id", _handId);
					sessionStorage.setItem("ngame_hole_cards_seat", String(heroSeat));
				} catch (_) {}
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
					// 大老二專屬（additive，不影響撲克）：另存局末各家公開牌，供 bigTwoScene 局末翻牌動畫讀取。
					// 撲克攤牌仍走上面的 applyShowdownReveals；此處只多寫一個 big_two 專用欄位、不改任何既有路徑。
					const _isBigTwoEnd =
						String(data.game_id || this.state.table?.game_id || "") === "big_two";
					if (_isBigTwoEnd && (data.reveals || Array.isArray(data.player_results))) {
						this.state.bigTwoReveals = {
							hand_id: data.hand_id ?? null,
							table_id: data.table_id ?? null,
							reveals: data.reveals ?? null,
							player_results: Array.isArray(data.player_results)
								? data.player_results
								: null,
						};
					}
				}
				if (
					type === "award" &&
					Array.isArray(data.player_results) &&
					data.player_results.length > 0
				) {
					const resultTableId = String(
						data.table_id ??
							data.table?.table_id ??
							this.state.table?.table_id ??
							"",
					);
					const rawResultHandId = Number(
						data.hand_id ?? data.table?.hand_id ?? this.state.handId ?? 0,
					);
					const resultHandId = Number.isFinite(rawResultHandId)
						? rawResultHandId
						: 0;
					this.state.handResult = {
						table_id: resultTableId,
						hand_id: resultHandId,
						reason: String(data.reason ?? ""),
						player_results: clone(data.player_results),
					};
					const resultEventKey =
						resultHandId > 0 ? `${resultTableId}|${resultHandId}` : "";
					const isDuplicateResult = Boolean(
						resultEventKey && this.state.handResultEventKey === resultEventKey,
					);
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
					this.state.handEndNextEventIn = Number(data.next_event_in ?? 0);
					// hand_end 後，上一手的私牌/攤牌資訊要清空，避免畫面殘留
					this.state.handEndSeq += 1;
					this.state.handContribBySeat = {};
					// During replay keep hole cards and showdown reveals so resolveSeatHoleRenderOptions
					// can still distinguish showdown players (visibleCount>0) from folded players (0).
					// Cleared by the next table_joined when replay exits or a new replay starts.
					const _replayActive = window.__APP__?.isHandReplayActive?.();
					if (!_replayActive) {
						this.state.holeCardsBySeat = {};
						this.state.showdownRevealsBySeat = {};
					}
					// 同時清除 sessionStorage 快取，防止後續 table_state 的 hand_id 比對成功後把手牌還原回來
					try {
						sessionStorage.removeItem("ngame_hole_cards");
						sessionStorage.removeItem("ngame_hole_cards_hand_id");
						sessionStorage.removeItem("ngame_hole_cards_seat");
					} catch (_) {}
					// 清零所有玩家的 hole_count，防止渲染層因 fallbackVisibleCount > 0 重新顯示背牌
					if (Array.isArray(this.state.table?.players)) {
						this.state.table.players.forEach((p) => {
							p.hole_count = 0;
						});
					}
					// 若後端已進入 waiting（或 hand_end 未附 table），強制把桌面視覺欄位重置
					const tableStatus = String(
						this.state.table?.status ?? "",
					).toLowerCase();
					const tableRound = String(
						this.state.table?.round ?? "",
					).toLowerCase();
					if (
						!data.table ||
						tableStatus === "waiting" ||
						tableRound === "waiting"
					) {
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
			case "hand_reports_ok":
				this.state.myHandReports = clone(data);
				this.state.myHandReportsVersion += 1;
				break;

			// 最近 14 天日結（固定 14 筆）
			case "daily_settlement_14d_ok":
				this.state.myDailySettlement14d = clone(data);
				this.state.myDailySettlement14dVersion += 1;
				break;

			// 帳號存在確認
			case "verify_sms_code_ok":
			case "verify_email_code_ok":
				this.state.verifyCodeVersion += 1;
				break;

			case "forgot_password_ok":
				this.state.fpEventType = "forgot_ok";
				this.state.fpEventVersion += 1;
				break;

			case "verify_reset_code_ok":
				this.state.fpEventType = "reset_code_ok";
				this.state.fpEventVersion += 1;
				break;

			case "reset_password_ok":
				this.state.fpEventType = "reset_password_ok";
				this.state.fpEventVersion += 1;
				break;

			case "check_username_ok":
				this.state.accountExists = true;
				this.state.accountCheckVersion += 1;
				break;

			// 大老二單局結束結果
			case "hand_result":
				this.state.bigTwoHandResult = data;
				this.state.bigTwoHandResultVersion =
					(this.state.bigTwoHandResultVersion || 0) + 1;
				break;

			// 下一手 ready window（通用事件，spec §10.23 / §10.24）。新增 case、僅寫入新欄位供大老二場景讀取；
			// 不修改任何既有 case / 欄位，撲克路徑與送出封包一律不變（純讀取進來的封包，不送任何東西）。
			case "hand_ready_state":
				this.state.handReadyState = clone(data);
				break;
			case "hand_ready_ack":
				this.state.handReadyAck = clone(data);
				// ack 亦帶最新 ready_count/required_count/all_ready，一併更新供顯示（無 state 時以 ack 補上）。
				this.state.handReadyState = {
					...(this.state.handReadyState || {}),
					table_id: data.table_id,
					hand_id: data.hand_id,
					ready_count: data.ready_count,
					required_count: data.required_count,
					pending_rebuy: data.pending_rebuy,
					all_ready: data.all_ready,
				};
				break;

			// 錯誤訊息
			case "error": {
				// Suppress "not at table" errors while already at gameLobby or actively leaving —
				// these are expected rejections from a stale leave_room packet and confuse the user.
				const _eCode = String(data?.code ?? "").toUpperCase();
				const _eMsg = String(data?.message ?? "");
				const _isNotAtTable =
					_eCode.includes("NOT_IN_ROOM") ||
					_eCode.includes("NOT_IN_TABLE") ||
					_eCode.includes("NOT_AT_TABLE") ||
					_eMsg.includes("不在牌桌") ||
					_eMsg.includes("not in room") ||
					_eMsg.includes("not at table");
				if (
					_isNotAtTable &&
					(this.state.page === "gameLobby" || this.state.isLeavingTable)
				)
					break;
				this.state.lastError = data;
				this.state.errorVersion += 1;
				break;
			}

			// 心跳回覆：目前不用改狀態
			case "pong":
				break;

			default:
				break;
		}

		// 大老二：快照封包帶 table.play_state.last_play → 觀戰/換桌/重連時「補上」中央牌（仿撲克 table.community）。
		// 僅在中央牌為空時補（不覆蓋既有出牌），且僅大老二桌；只讀伺服器快照、只寫前端顯示欄位，撲克與伺服器資料皆不受影響。
		if (
			type === "table_state" ||
			type === "table_joined" ||
			type === "seat_taken"
		) {
			this.seedBigTwoPileFromTable();
		}
		this.emit();
	}

	// 從 table.play_state.last_play 補上中央牌（僅當目前無中央牌時；不覆蓋廣播驅動的現有出牌）
	seedBigTwoPileFromTable() {
		const isBigTwo =
			this.state.page === "bigTwo" ||
			String(this.state.table?.game_id || "") === "big_two";
		if (!isBigTwo) return; // 撲克：直接略過，不動任何狀態
		if (this.state.bigTwoLastPlay) return; // 已有中央牌（廣播驅動）→ 不覆蓋
		const lp = this.state.table?.play_state?.last_play; // 只讀伺服器快照
		if (!lp || !Array.isArray(lp.cards) || lp.cards.length === 0) return;
		const cards = toCardArray(lp.cards);
		if (cards.length === 0) return;
		this.state.bigTwoLastPlay = { seat: Number(lp.seat), cards }; // 只寫前端顯示欄位
		this.state.bigTwoLastPlayVersion += 1;
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
		if (
			!table ||
			!nextBetsRaw ||
			typeof nextBetsRaw !== "object" ||
			!Array.isArray(table.players)
		) {
			return;
		}
		const previousBets =
			table.bets && typeof table.bets === "object" ? table.bets : {};
		table.players.forEach((player) => {
			const seat = parseSeatNumber(player?.seat);
			if (seat === null) {
				return;
			}
			const seatKey = String(seat);
			const previousBet = Number(
				previousBets[seatKey] ?? previousBets[seat] ?? 0,
			);
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
		const previousBets =
			table.bets && typeof table.bets === "object" ? table.bets : {};
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
			leftTableId &&
			rightTableId &&
			leftTableId === rightTableId &&
			Number.isFinite(leftHandId) &&
			Number.isFinite(rightHandId) &&
			leftHandId === rightHandId,
		);
	}

	// 根據 player_action 封包，局部修補 table（避免每次都等完整 table_state）
	patchTableByAction(data) {
		if (!this.state.table) {
			return;
		}

		const seat = data.seat;
		const seatNo = Number(seat);
		const paid = Number(data.paid ?? 0);
		let player = this.state.table.players?.find(
			(item) => Number(item.seat) === seatNo,
		);
		// Fallback: some server formats identify the actor by user_id instead of seat
		if (!player && data.user_id != null) {
			const userId = Number(data.user_id);
			if (Number.isFinite(userId) && userId > 0) {
				player = this.state.table.players?.find(
					(item) => Number(item.user_id) === userId,
				);
			}
		}

		// 大老二：伺服器逾時自動代打的廣播會用 play_timeout / pass_timeout 當 action 名稱。
		// 僅在大老二桌把結尾的 _timeout 去掉，正規化成 play / pass，讓下方中央牌堆、hand_count、
		// 過牌標籤等既有分支照常判斷（否則逾時自動出的牌會扣手牌卻不進中央牌堆）。
		// 撲克桌 isBigTwoAction 為 false → btAction 完全等於原 data.action，不做任何正規化；
		// 本函數也不改寫任何送回伺服器的資料，故撲克邏輯與後端邏輯皆零影響。
		const isBigTwoAction =
			this.state.page === "bigTwo" ||
			String(data.game_id || this.state.table?.game_id || "") === "big_two";
		const btAction = isBigTwoAction
			? String(data.action || "").replace(/_timeout$/, "")
			: data.action;

		if (player) {
			player.bet = Number(player.bet ?? 0) + paid;
			player.chips = Math.max(0, Number(player.chips ?? 0) - paid);
			player.last_action = btAction;
			player.last_action_at = Date.now();
			if (
				String(data.action || "")
					.toLowerCase()
					.startsWith("fold")
			) {
				player.in_hand = false;
			}
			// 大老二：更新剩餘牌數（伺服器欄位為 hand_count；相容 remaining_count）
			const authCount = Number.isFinite(Number(data.hand_count))
				? Number(data.hand_count)
				: Number.isFinite(Number(data.remaining_count))
					? Number(data.remaining_count)
					: null;
			if (authCount !== null) {
				player.hand_count = authCount;
			}
		}
		// 大老二：記錄最新出牌（play_timeout 已於上方正規化為 play）
		if (
			isBigTwoAction &&
			(btAction === "play_cards" || btAction === "play") &&
			Array.isArray(data.cards) &&
			data.cards.length > 0
		) {
			const playedCards = toCardArray(data.cards);
			if (playedCards.length > 0) {
				this.state.bigTwoLastPlay = { seat: seatNo, cards: playedCards };
				this.state.bigTwoLastPlayVersion += 1;
				// 若伺服器未附權威剩餘牌數，依本次出牌張數樂觀遞減 hand_count（下次 table_state 會校正）
				if (
					player &&
					!Number.isFinite(Number(data.hand_count)) &&
					!Number.isFinite(Number(data.remaining_count))
				) {
					const cur = Number.isFinite(Number(player.hand_count))
						? Number(player.hand_count)
						: 13;
					player.hand_count = Math.max(0, cur - playedCards.length);
				}
			}
		}
		if (isBigTwoAction && btAction === "pass") {
			// pass 不清除 bigTwoLastPlay，讓中央繼續顯示上一次出的牌
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
		this.state.table.current_turn_deadline_at = null;

		// 只有當 action 是當前 request 那個座位時，才清掉本地 actionRequest
		// 避免別人行動時把我方 action UI 清空
		const reqSeat = Number(this.state.actionRequest?.seat);
		const actionSeat = Number(seat);
		if (
			Number.isFinite(reqSeat) &&
			Number.isFinite(actionSeat) &&
			reqSeat === actionSeat
		) {
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
		this.state.table.current_turn_deadline_at = null;
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
		const current = Array.isArray(this.state.holeCardsBySeat[key])
			? [...this.state.holeCardsBySeat[key]]
			: [];
		current[cardIndex] = card;
		const normalized = toCardArray(current).slice(0, 2);
		if (normalized.length > 0) {
			this.state.holeCardsBySeat[key] = normalized;
		}
	}

	// 大老二重連還原英雄手牌（big_two 專屬、additive；撲克/後端零影響）。由各桌面快照 case 呼叫：
	// 伺服器重連不重送 hole_cards，故從 sessionStorage 還原（hand_start 已於換手清除，存的必為本局）。
	_maybeRestoreBigTwoHero(data) {
		try {
			const isBigTwo =
				String(data?.table?.game_id || data?.game_id || this.state.table?.game_id || "") === "big_two";
			if (!isBigTwo) return;
			// 觀戰者不還原手牌：退座後 heroSeat=null，Number(null)=0 會與座位 0 的舊英雄誤判為同座而還原，
			// 導致退座轉觀戰仍殘留自己的手牌。觀戰一律不還原。
			if (this.state.isSpectator) return;
			const heroSeat = Number(this.state.heroSeat);
			const storedSeat = Number(sessionStorage.getItem("ngame_hole_cards_seat") ?? "");
			const storedHandId = sessionStorage.getItem("ngame_hole_cards_hand_id");
			const curHandId = String(data?.table?.hand_id ?? this.state.handId ?? "");
			const btLen = this.state.bigTwoHeroCards?.length ?? 0;
			// hand_start 已清 sessionStorage → 存的必為本局；hand_id 缺失時只以座位比對。
			const handOk = !storedHandId || !curHandId || storedHandId === curHandId;
			if (!Number.isInteger(heroSeat) || btLen > 0 || storedSeat !== heroSeat || !handOk) {
				return;
			}
			const cards = toCardArray(
				JSON.parse(sessionStorage.getItem("ngame_hole_cards") || "[]"),
			);
			if (cards.length > 0) {
				this.state.bigTwoHeroCards = cards;
				this.state.bigTwoHeroCardsVersion += 1;
				this.state.bigTwoHeroCardsRestored = true;
			}
		} catch (_) {}
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
		if (
			Number.isFinite(packetHandId) &&
			Number.isFinite(Number(this.state.handId)) &&
			packetHandId !== Number(this.state.handId)
		) {
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
