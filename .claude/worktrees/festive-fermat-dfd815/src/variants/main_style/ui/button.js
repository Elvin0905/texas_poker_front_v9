// Applies a vertical gold gradient fill to a Phaser Text object (matches Lv badge style).
export function applyGoldTitleGradient(textObj) {
  if (!textObj?.context) return;
  const g = textObj.context.createLinearGradient(0, 0, 0, textObj.height);
  g.addColorStop(0, '#f7e59e');
  g.addColorStop(1, '#f8bb3e');
  textObj.setFill(g);
}

// Draws multi-layer enhanced border (glow + thick gold + bright rim) onto a Graphics object.
// l/t = top-left corner of the panel, w/h = panel size, cr = corner radius.
export function drawEnhancedBorder(gfx, l, t, w, h, cr) {
  // Single smooth outer glow (stroke-based so it follows the corner curve naturally)
  gfx.lineStyle(14, 0xb87010, 0.18);
  gfx.strokeRoundedRect(l - 5, t - 5, w + 10, h + 10, cr + 5);
  gfx.lineStyle(8, 0xd4890f, 0.22);
  gfx.strokeRoundedRect(l - 5, t - 5, w + 10, h + 10, cr + 5);
  // Gold gradient border (5 px thick each side)
  gfx.fillGradientStyle(0xffe878, 0xffe878, 0x9a4810, 0x9a4810, 1, 1, 1, 1);
  gfx.fillRoundedRect(l - 5, t - 5, w + 10, h + 10, cr + 5);
  // Bright outer rim highlight
  gfx.lineStyle(1.5, 0xfff8b0, 0.65);
  gfx.strokeRoundedRect(l - 5, t - 5, w + 10, h + 10, cr + 5);
}

export function createGradientButton(scene, {
  x = 0, y = 0, width, height, cornerRadius = 8,
  topColor, bottomColor, borderColor,
  label, labelStyle = {}, depth, onClick, visible = false,
} = {}) {
  let _top = topColor;
  let _bottom = bottomColor;
  let _border = borderColor;

  const maskGfx = scene.make.graphics({ add: false });
  const drawMask = () => {
    maskGfx.clear();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
  };
  drawMask();
  maskGfx.setPosition(x, y);

  const gradGfx = scene.add.graphics();
  const redraw = () => {
    gradGfx.clear();
    gradGfx.fillGradientStyle(_top, _top, _bottom, _bottom, 1, 1, 1, 1);
    gradGfx.fillRect(-width / 2, -height / 2, width, height);

    if (_border !== undefined) {
      gradGfx.lineStyle(4, _border, 0.95);
      gradGfx.strokeRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
    }
  };
  redraw();
  gradGfx.setMask(maskGfx.createGeometryMask());
  gradGfx.setPosition(x, y).setDepth(depth ?? 0).setVisible(visible);
  gradGfx.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  if (!visible) gradGfx.disableInteractive();

  let _enabled = true;
  const press = () => {
    if (!_enabled) { playWrongClick(scene); return; }
    playUiClick(scene); gradGfx.setAlpha(0.6); onClick?.();
  };
  const release = () => { if (_enabled) gradGfx.setAlpha(1); };
  gradGfx.on("pointerdown", press);
  gradGfx.on("pointerup", release);
  gradGfx.on("pointerout", release);

  const text = scene.add.text(x, y, label, {
    fontSize: "26px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
    ...labelStyle,
  }).setOrigin(0.5).setDepth((depth ?? 0) + 0.1).setVisible(visible);

  return {
    gradGfx,
    text,
    setVisible(v) {
      gradGfx.setVisible(v);
      text.setVisible(v);
      if (v) {
        gradGfx.setAlpha(_enabled ? 1 : 0.45);
        text.setAlpha(_enabled ? 1 : 0.45);
        gradGfx.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
      } else {
        gradGfx.disableInteractive();
      }
    },
    setPosition(nx, ny) {
      gradGfx.setPosition(nx, ny);
      maskGfx.setPosition(nx, ny);
      text.setPosition(nx, ny);
    },
    setEnabled(enabled) {
      _enabled = Boolean(enabled);
      gradGfx.setAlpha(_enabled ? 1 : 0.45);
      text.setAlpha(_enabled ? 1 : 0.45);
    },
    setGradient(top, bottom, border) {
      _top = top; _bottom = bottom;
      if (border !== undefined) _border = border;
      redraw();
    },
    setLabel(l) { text.setText(l); },
    destroy() { gradGfx.destroy(); text.destroy(); maskGfx.destroy(); },
  };
}

export function preloadUiClick(scene) {
  if (!scene?.cache?.audio || !scene?.load) {
    return;
  }
  if (!scene.cache.audio.exists("ui_click")) {
    scene.load.audio("ui_click", "assets/variants/main_style/audio/system_notification.mp3");
  }
  if (!scene.cache.audio.exists("wrong_click")) {
    scene.load.audio("wrong_click", "assets/variants/main_style/audio/wrong_click.mp3");
  }
}

export function playWrongClick(scene, { volume = 0.5 } = {}) {
  if (!scene?.sound || !isAudioEnabled()) return false;
  if (!scene.cache?.audio?.exists("wrong_click")) return false;
  const master = Math.max(0, Math.min(1, Number(window.__APP__?.masterVolume ?? 1)));
  const sfx = Math.max(0, Math.min(1, Number(window.__APP__?.sfxVolume ?? 1)));
  const output = Math.max(0, Math.min(1, Number(volume) || 0)) * master * sfx;
  if (output <= 0) return false;
  scene.sound.play("wrong_click", { volume: output });
  return true;
}

export function isAudioEnabled() {
  if (window.__APP__?.masterAudioEnabled === false) {
    return false;
  }
  if (window.__APP__?.sfxEnabled === false) {
    return false;
  }
  return true;
}

export function playUiClick(scene, { volume = 0.45 } = {}) {
  if (!scene?.sound) {
    return false;
  }
  if (!isAudioEnabled()) {
    return false;
  }
  if (!scene.cache?.audio?.exists("ui_click")) {
    return false;
  }
  const master = Math.max(0, Math.min(1, Number(window.__APP__?.masterVolume ?? 1)));
  const sfx = Math.max(0, Math.min(1, Number(window.__APP__?.sfxVolume ?? 1)));
  const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  const output = safeVolume * master * sfx;
  if (output <= 0) {
    return false;
  }
  scene.sound.play("ui_click", { volume: output });
  return true;
}

export function bindImageButton(scene, image, { onClick, baseScale, pressedScale = 0.96, playClick = true } = {}) {
  if (!scene || !image) {
    return image;
  }
  if (baseScale !== undefined) {
    image.setScale(baseScale);
  }
  image.setInteractive({
    useHandCursor: true,
    pixelPerfect: true,
    alphaTolerance: 10,
  });
  let _restoreX = 1;
  let _restoreY = 1;
  let _pressed = false;
  image.on("pointerdown", () => {
    if (image._inactive) { playWrongClick(scene); return; }
    if (playClick) {
      playUiClick(scene);
    }
    _restoreX = image.scaleX;
    _restoreY = image.scaleY;
    _pressed = true;
    image.setScale(_restoreX * pressedScale, _restoreY * pressedScale);
  });
  image.on("pointerup", () => {
    if (_pressed) {
      image.setScale(_restoreX, _restoreY);
      onClick?.();
    }
    _pressed = false;
  });
  image.on("pointerout", () => {
    if (_pressed) {
      image.setScale(_restoreX, _restoreY);
    }
    _pressed = false;
  });
  return image;
}

export function createRectButton(
  scene,
  {
    x,
    y,
    width,
    height,
    label,
    color = 0x254666,
    strokeColor = 0x7b93ad,
    labelStyle = {},
    onClick,
    playClick = true,
    visible = true,
    enabled = true,
    pressedScale = 0.96,
    disabledAlpha = 0.45,
    cornerRadius = 0,
  },
) {
  let isEnabled = Boolean(enabled);

  let bg;
  if (cornerRadius > 0) {
    const gfx = scene.add.graphics();
    let currentFillColor = color;
    const hitRect = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);

    const redraw = () => {
      gfx.clear();
      gfx.fillStyle(currentFillColor, 1);
      gfx.fillRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
      if (strokeColor !== undefined && strokeColor !== null) {
        gfx.lineStyle(2, strokeColor, 0.9);
        gfx.strokeRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);
      }
    };

    gfx.setPosition(x, y).setVisible(visible);
    redraw();

    const origSetInteractive = gfx.setInteractive.bind(gfx);
    gfx.setInteractive = (hitAreaOrConf, callback, opts) => {
      if (!hitAreaOrConf || !(hitAreaOrConf instanceof Phaser.Geom.Rectangle)) {
        const conf = (hitAreaOrConf && typeof hitAreaOrConf === "object") ? hitAreaOrConf : {};
        return origSetInteractive(hitRect, Phaser.Geom.Rectangle.Contains, { useHandCursor: conf.useHandCursor ?? true });
      }
      return origSetInteractive(hitAreaOrConf, callback, opts);
    };
    gfx.setInteractive({ useHandCursor: true });
    if (!visible) gfx.disableInteractive();

    gfx.setFillStyle = (c) => {
      currentFillColor = c;
      redraw();
      return gfx;
    };
    gfx.setTint = () => gfx;
    gfx.clearTint = () => gfx;

    bg = gfx;
  } else {
    bg = scene.add.rectangle(x, y, width, height, color, 1).setStrokeStyle(2, strokeColor).setVisible(visible);
    bg.setInteractive({ useHandCursor: true });
  }

  bg.on("pointerdown", () => {
    if (!isEnabled) {
      playWrongClick(scene);
      return;
    }
    if (playClick) {
      playUiClick(scene);
    }
    bg.setScale(pressedScale);
  });
  bg.on("pointerup", () => {
    bg.setScale(1);
    if (!isEnabled) {
      return;
    }
    onClick?.();
  });
  bg.on("pointerout", () => {
    bg.setScale(1);
  });

  const text = scene.add
    .text(x, y, label, {
      fontSize: "24px",
      color: "#4a2f1d",
      fontStyle: "bold",
      fontFamily: '"APTUI", "Noto Sans TC", "Segoe UI", sans-serif',
      ...labelStyle,
    })
    .setOrigin(0.5)
    .setVisible(visible);

  const api = {
    bg,
    text,
    setVisible(nextVisible) {
      bg.setVisible(nextVisible);
      text.setVisible(nextVisible);
      return api;
    },
    setLabel(nextLabel) {
      text.setText(nextLabel);
      return api;
    },
    setEnabled(nextEnabled) {
      isEnabled = Boolean(nextEnabled);
      bg.setAlpha(isEnabled ? 1 : disabledAlpha);
      text.setAlpha(isEnabled ? 1 : disabledAlpha);
      return api;
    },
    setPosition(nextX, nextY) {
      bg.setPosition(nextX, nextY);
      text.setPosition(nextX, nextY);
      return api;
    },
    destroy() {
      bg.destroy();
      text.destroy();
    },
  };

  api.setEnabled(isEnabled);
  return api;
}

