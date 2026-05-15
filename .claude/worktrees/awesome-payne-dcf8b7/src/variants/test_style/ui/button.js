export function preloadUiClick(scene) {
  if (!scene?.cache?.audio || !scene?.load) {
    return;
  }
  if (!scene.cache.audio.exists("ui_click")) {
    scene.load.audio("ui_click", "assets/variants/test_style/audio/system_notification.mp3");
  }
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

export function bindImageButton(scene, image, { onClick, baseScale = 1, pressedScale = 1.06, playClick = true } = {}) {
  if (!scene || !image) {
    return image;
  }
  image.setScale(baseScale);
  image.setInteractive({
    useHandCursor: true,
    pixelPerfect: true,
    alphaTolerance: 10,
  });
  image.on("pointerdown", () => {
    if (playClick) {
      playUiClick(scene);
    }
    image.setScale(pressedScale);
  });
  image.on("pointerup", () => {
    image.setScale(baseScale);
    onClick?.();
  });
  image.on("pointerout", () => {
    image.setScale(baseScale);
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
    pressedScale = 1.03,
    disabledAlpha = 0.45,
  },
) {
  let isEnabled = Boolean(enabled);
  const bg = scene.add.rectangle(x, y, width, height, color, 1).setStrokeStyle(2, strokeColor).setVisible(visible);
  bg.setInteractive({ useHandCursor: true });
  bg.on("pointerdown", () => {
    if (!isEnabled) {
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
      if (isEnabled) {
        bg.setInteractive({ useHandCursor: true });
      } else {
        bg.disableInteractive();
      }
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
