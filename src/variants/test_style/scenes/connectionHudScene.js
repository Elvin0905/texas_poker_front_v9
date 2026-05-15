const HUD_DEPTH = 9990;
const DETAIL_DEPTH = 9991;

const BADGE_CENTER_X = 668;
const BADGE_CENTER_Y = 1398;
const BADGE_WIDTH = 94;
const BADGE_HEIGHT = 38;

const DETAIL_CENTER_X = 565;
const DETAIL_CENTER_Y = 1264;
const DETAIL_WIDTH = 256;
const DETAIL_HEIGHT = 184;

const FONT_FAMILY = "sans-serif";
const FONT_SIZE = "18px";
const FONT_COLOR = "#f3eee1";
const LABEL_COLOR = "#b7c7d7";

const PONG_STALE_MS = 45000;

function formatAge(tsMsRaw) {
  const tsMs = Number(tsMsRaw);
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    return "-";
  }
  const diffMs = Math.max(0, Date.now() - tsMs);
  if (diffMs < 1000) {
    return "now";
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    return `${sec}s ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hour = Math.floor(min / 60);
  if (hour < 24) {
    return `${hour}h ago`;
  }
  return `${Math.floor(hour / 24)}d ago`;
}

function formatClock(tsMsRaw) {
  const tsMs = Number(tsMsRaw);
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    return "-";
  }
  return new Date(tsMs).toLocaleTimeString();
}

function resolveQualityView(statusRaw, avgRttRaw, lastPongAtRaw) {
  const status = String(statusRaw || "idle");
  const avgRtt = Number(avgRttRaw);
  const lastPongAt = Number(lastPongAtRaw);
  const pongAgeMs = Number.isFinite(lastPongAt) ? Date.now() - lastPongAt : Number.POSITIVE_INFINITY;
  const reconnectSecMatch = status.match(/^reconnecting_(\d+)s$/);

  if (status === "open") {
    let level = 3;
    let label = "Good";
    if (Number.isFinite(avgRtt)) {
      if (avgRtt <= 120) {
        level = 4;
        label = "Excellent";
      } else if (avgRtt <= 220) {
        level = 3;
        label = "Good";
      } else if (avgRtt <= 380) {
        level = 2;
        label = "Fair";
      } else {
        level = 1;
        label = "Poor";
      }
    }
    if (pongAgeMs > PONG_STALE_MS) {
      level = Math.min(level, 1);
      label = "Stale";
    }
    return { level, label, pingText: Number.isFinite(avgRtt) ? `${Math.round(avgRtt)}ms` : "", pulse: false };
  }

  if (status === "connecting") {
    return { level: 1, label: "Connecting", pingText: "", pulse: true };
  }

  if (reconnectSecMatch) {
    return { level: 1, label: `Reconnect ${reconnectSecMatch[1]}s`, pingText: "", pulse: true };
  }

  if (status.startsWith("closed_") || status === "closed" || status === "error") {
    return { level: 0, label: "Closed", pingText: "", pulse: false };
  }

  return { level: 0, label: "Idle", pingText: "", pulse: false };
}

function activeBarColor(level) {
  if (level <= 0) {
    return 0xe24f4f;
  }
  if (level === 1) {
    return 0xf3a74f;
  }
  if (level === 2) {
    return 0xf3cc56;
  }
  if (level === 3) {
    return 0x8ad768;
  }
  return 0x41d188;
}

export class ConnectionHudScene extends Phaser.Scene {
  constructor() {
    super("connectionHud");
    this.detailOpen = false;
    this.unsubscribe = null;
    this.pulseTween = null;
    this.refreshTimer = null;
    this.barRects = [];
    this.detailValueTexts = {};
    this.onPointerDown = null;
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app?.store;

    this.badgeContainer = this.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
    this.badgeBg = this.add
      .rectangle(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_WIDTH, BADGE_HEIGHT, 0x09131f, 0.78)
      .setStrokeStyle(1, 0xffffff, 0.26)
      .setOrigin(0.5);
    this.badgeContainer.add(this.badgeBg);

    const barBaseX = BADGE_CENTER_X - 27;
    const barBaseY = BADGE_CENTER_Y + 7;
    const heights = [5, 8, 11, 14];
    this.barRects = heights.map((height, index) => {
      const bar = this.add.rectangle(barBaseX + index * 7, barBaseY - height / 2, 4, height, 0xffffff, 0.28).setOrigin(0.5);
      this.badgeContainer.add(bar);
      return bar;
    });

    this.pingText = this.add
      .text(BADGE_CENTER_X + 19, BADGE_CENTER_Y, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        color: FONT_COLOR,
      })
      .setOrigin(0.5);
    this.badgeContainer.add(this.pingText);

    this.badgeHit = this.add
      .rectangle(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_WIDTH, BADGE_HEIGHT, 0x000000, 0.001)
      .setDepth(HUD_DEPTH + 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.badgeHit.on("pointerup", () => {
      this.setDetailOpen(!this.detailOpen);
    });

    this.detailContainer = this.add.container(0, 0).setDepth(DETAIL_DEPTH).setScrollFactor(0).setVisible(false);
    const detailBg = this.add
      .rectangle(DETAIL_CENTER_X, DETAIL_CENTER_Y, DETAIL_WIDTH, DETAIL_HEIGHT, 0x08121e, 0.94)
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setOrigin(0.5);
    this.detailContainer.add(detailBg);

    this.detailHit = this.add
      .rectangle(DETAIL_CENTER_X, DETAIL_CENTER_Y, DETAIL_WIDTH, DETAIL_HEIGHT, 0x000000, 0.001)
      .setDepth(DETAIL_DEPTH + 1)
      .setScrollFactor(0)
      .setVisible(false);
    this.detailHit.disableInteractive();

    const rows = [
      { key: "status", label: "Status" },
      { key: "avgRtt", label: "Avg RTT" },
      { key: "lastPong", label: "Last PONG" },
      { key: "lastPacket", label: "Last packet" },
      { key: "reconnect", label: "Reconnect" },
      { key: "reauth", label: "Reauth" },
      { key: "endpoint", label: "Endpoint" },
    ];
    rows.forEach((item, index) => {
      const y = DETAIL_CENTER_Y - 72 + index * 24;
      const labelText = this.add
        .text(DETAIL_CENTER_X - 116, y, item.label, {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE,
          color: LABEL_COLOR,
        })
        .setOrigin(0, 0.5);
      const valueText = this.add
        .text(DETAIL_CENTER_X + 116, y, "-", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE,
          color: FONT_COLOR,
        })
        .setOrigin(1, 0.5);
      this.detailContainer.add(labelText);
      this.detailContainer.add(valueText);
      this.detailValueTexts[item.key] = valueText;
    });

    this.onPointerDown = (_pointer, targets) => {
      if (!this.detailOpen) {
        return;
      }
      const hitBadge = Array.isArray(targets) && targets.includes(this.badgeHit);
      const hitPanel = Array.isArray(targets) && targets.includes(this.detailHit);
      if (!hitBadge && !hitPanel) {
        this.setDetailOpen(false);
      }
    };
    this.input.on("pointerdown", this.onPointerDown);

    this.unsubscribe = this.store?.subscribe?.(() => this.refresh());
    this.refreshTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.refresh(),
    });

    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.refreshTimer?.remove?.();
      this.refreshTimer = null;
      this.pulseTween?.stop?.();
      this.pulseTween = null;
      if (this.onPointerDown) {
        this.input.off("pointerdown", this.onPointerDown);
        this.onPointerDown = null;
      }
    });

    this.refresh();
  }

  setDetailOpen(open) {
    this.detailOpen = Boolean(open);
    this.detailContainer?.setVisible(this.detailOpen);
    this.detailHit?.setVisible(this.detailOpen);
    if (this.detailOpen) {
      this.detailHit?.setInteractive({ useHandCursor: false });
    } else {
      this.detailHit?.disableInteractive();
    }
  }

  refresh() {
    const quality = this.app?.getConnectionQuality?.() || {};
    const status = String(quality.status || this.store?.getState?.().connection || "idle");
    const avgRtt = Number(quality.averageRttMs);
    const view = resolveQualityView(status, avgRtt, quality.lastPongAt);
    const onColor = activeBarColor(view.level);

    this.barRects.forEach((bar, index) => {
      const lit = index < view.level;
      bar.setFillStyle(lit ? onColor : 0xffffff, lit ? 0.95 : 0.24);
    });

    this.pingText?.setText(view.pingText || "");
    this.badgeBg?.setFillStyle(0x09131f, 0.78);
    this.badgeBg?.setStrokeStyle(1, 0xffffff, 0.26);

    if (view.pulse) {
      if (!this.pulseTween || !this.pulseTween.isPlaying()) {
        this.pulseTween?.stop?.();
        this.pulseTween = this.tweens.add({
          targets: this.badgeContainer,
          alpha: 0.72,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    } else {
      this.pulseTween?.stop?.();
      this.pulseTween = null;
      this.badgeContainer?.setAlpha(1);
    }

    this.detailValueTexts.status?.setText(`${view.label} (${status})`);
    this.detailValueTexts.avgRtt?.setText(Number.isFinite(avgRtt) ? `${Math.round(avgRtt)} ms` : "-");
    this.detailValueTexts.lastPong?.setText(
      Number(quality.lastPongAt) > 0 ? `${formatAge(quality.lastPongAt)} (${formatClock(quality.lastPongAt)})` : "-",
    );
    this.detailValueTexts.lastPacket?.setText(
      Number(quality.lastPacketAt) > 0 ? `${formatAge(quality.lastPacketAt)} (${formatClock(quality.lastPacketAt)})` : "-",
    );
    this.detailValueTexts.reconnect?.setText(String(Math.max(0, Number(quality.reconnectAttempt ?? 0))));
    this.detailValueTexts.reauth?.setText(
      Number(quality.lastAutoReauthAt) > 0
        ? `${formatAge(quality.lastAutoReauthAt)} (${formatClock(quality.lastAutoReauthAt)})`
        : "-",
    );
    this.detailValueTexts.endpoint?.setText(String(quality.endpoint || this.app?.endpoint || "-"));
  }
}
