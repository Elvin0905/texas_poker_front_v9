export function ellipsizeText(text, maxChars = 22) {
  if (!text) {
    return "";
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 3))}...`;
}

export function createKeyboardBar({ id, doneText = "完成" } = {}) {
  const barId = id || "scene-keyboard-bar";
  const old = document.getElementById(barId);
  old?.remove();

  const bar = document.createElement("div");
  bar.id = barId;
  bar.className = "auth-keyboard-bar";

  const inputWrap = document.createElement("div");
  inputWrap.className = "auth-keyboard-input-wrap";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "auth-keyboard-input";

  const maskOverlay = document.createElement("div");
  maskOverlay.className = "auth-keyboard-mask";

  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.textContent = doneText;
  doneBtn.className = "auth-keyboard-done";

  inputWrap.appendChild(input);
  inputWrap.appendChild(maskOverlay);
  bar.appendChild(inputWrap);
  bar.appendChild(doneBtn);
  document.body.appendChild(bar);

  let currentOnDone = null;
  let currentOnChange = null;
  let currentOnClose = null;
  let isMaskedMode = false;
  let maskedPlaceholder = "";

  const renderMaskOverlay = () => {
    if (!isMaskedMode) {
      return;
    }
    const masked = "*".repeat(input.value.length);
    if (masked) {
      maskOverlay.textContent = masked;
      maskOverlay.classList.remove("is-placeholder");
      return;
    }
    maskOverlay.textContent = maskedPlaceholder;
    maskOverlay.classList.add("is-placeholder");
  };

  const applyBottomOffset = () => {
    const vv = window.visualViewport;
    const keyboardHeight = vv ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) : 0;
    bar.style.bottom = `${keyboardHeight}px`;
  };

  const close = () => {
    bar.classList.remove("is-open");
    input.blur();
    const onClose = currentOnClose;
    isMaskedMode = false;
    maskedPlaceholder = "";
    maskOverlay.textContent = "";
    maskOverlay.classList.remove("is-visible", "is-placeholder");
    input.classList.remove("is-masked", "is-unmasked");
    currentOnChange = null;
    currentOnDone = null;
    currentOnClose = null;
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const submit = () => {
    if (typeof currentOnDone === "function") {
      currentOnDone(input.value);
    }
    close();
  };

  const onEnter = (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    submit();
  };

  const onInput = () => {
    renderMaskOverlay();
    if (typeof currentOnChange === "function") {
      currentOnChange(input.value);
    }
  };

  doneBtn.addEventListener("click", submit);
  input.addEventListener("keydown", onEnter);
  input.addEventListener("input", onInput);
  window.addEventListener("resize", applyBottomOffset);
  window.visualViewport?.addEventListener("resize", applyBottomOffset);
  window.visualViewport?.addEventListener("scroll", applyBottomOffset);

  return {
    open({ value = "", placeholder = "", masked = false, autocomplete = "off", onDone, onChange, onClose }) {
      currentOnDone = onDone;
      currentOnChange = onChange;
      currentOnClose = onClose;
      isMaskedMode = masked;
      maskedPlaceholder = placeholder || "";
      input.type = "text";
      input.value = value;
      input.placeholder = masked ? "" : placeholder;
      input.autocomplete = autocomplete;

      if (masked) {
        input.classList.add("is-masked");
        input.classList.remove("is-unmasked");
        maskOverlay.classList.add("is-visible");
        renderMaskOverlay();
      } else {
        input.classList.add("is-unmasked");
        input.classList.remove("is-masked");
        maskOverlay.classList.remove("is-visible", "is-placeholder");
      }

      bar.classList.add("is-open");
      applyBottomOffset();
      window.setTimeout(() => {
        input.focus({ preventScroll: true });
        const end = input.value.length;
        input.setSelectionRange(end, end);
      }, 0);
    },
    close,
    destroy() {
      doneBtn.removeEventListener("click", submit);
      input.removeEventListener("keydown", onEnter);
      input.removeEventListener("input", onInput);
      window.removeEventListener("resize", applyBottomOffset);
      window.visualViewport?.removeEventListener("resize", applyBottomOffset);
      window.visualViewport?.removeEventListener("scroll", applyBottomOffset);
      bar.remove();
      currentOnChange = null;
      currentOnDone = null;
    },
  };
}

export function createTapInputManager(
  scene,
  {
    keyboardBar,
    textColor = "#4a2f1d",
    placeholderColor = "#8f7b68",
    textStyle = {},
    atlasKey = "login_register_element",
  } = {},
) {
  const fields = [];
  let onScenePointerDown = null;
  let activeField = null;
  const baseAlpha = 1;
  const activeHighlightAlpha = 0.24;
  const activeScaleMultiplier = 1.05;

  const defaultStyle = {
    fontFamily: '"APTUI", "Noto Sans TC", "Segoe UI", sans-serif',
    fontSize: "28px",
    fontStyle: "bold",
    color: placeholderColor,
    ...textStyle,
  };

  const setFieldVisualState = (field, active) => {
    if (!field?.image) {
      return;
    }
    field.image.setAlpha(baseAlpha);
    if (field.highlight) {
      field.highlight.setAlpha(active ? activeHighlightAlpha : 0);
    }
    if (!active) {
      field.image.setScale(field.baseScaleX, field.baseScaleY);
      if (field.highlight) {
        field.highlight.setScale(field.baseScaleX, field.baseScaleY);
      }
      return;
    }
    scene.tweens.killTweensOf(field.image);
    if (field.highlight) {
      scene.tweens.killTweensOf(field.highlight);
    }
    field.image.setScale(field.baseScaleX, field.baseScaleY);
    if (field.highlight) {
      field.highlight.setScale(field.baseScaleX, field.baseScaleY);
    }
    scene.tweens.add({
      targets: field.image,
      scaleX: field.baseScaleX * activeScaleMultiplier,
      scaleY: field.baseScaleY * activeScaleMultiplier,
      duration: 95,
      ease: "Quad.Out",
      yoyo: true,
    });
    if (field.highlight) {
      scene.tweens.add({
        targets: field.highlight,
        scaleX: field.baseScaleX * activeScaleMultiplier,
        scaleY: field.baseScaleY * activeScaleMultiplier,
        duration: 95,
        ease: "Quad.Out",
        yoyo: true,
      });
    }
  };

  const setActiveField = (nextField) => {
    if (activeField && activeField !== nextField) {
      setFieldVisualState(activeField, false);
    }
    activeField = nextField || null;
    if (activeField) {
      setFieldVisualState(activeField, true);
    }
  };

  const openField = (field) => {
    setActiveField(field);
    keyboardBar?.open({
      value: field.getValue(),
      placeholder: field.inputPlaceholder,
      masked: field.masked,
      autocomplete: field.autocomplete,
      onChange: (value) => {
        field.setValue(value);
        renderField(field);
      },
      onDone: (value) => {
        field.setValue(value);
        renderField(field);
      },
      onClose: () => {
        setActiveField(null);
      },
    });
  };

  const renderField = (field) => {
    const value = field.getValue() || "";
    if (!value) {
      field.text.setText(field.placeholder);
      field.text.setColor(placeholderColor);
      return;
    }
    const shown = field.masked ? "*".repeat(value.length) : value;
    field.text.setText(ellipsizeText(shown, field.maxChars));
    field.text.setColor(textColor);
  };

  const addField = ({
    imageX,
    imageY,
    frame,
    textX,
    textY,
    placeholder,
    inputPlaceholder,
    masked = false,
    autocomplete = "off",
    maxChars = 22,
    getValue,
    setValue,
    imageProp,
    textProp,
  }) => {
    const image = scene.add.image(imageX, imageY, atlasKey, frame);
    image.setAlpha(baseAlpha);
    const highlight = scene.add.image(imageX, imageY, atlasKey, frame);
    highlight.setBlendMode(Phaser.BlendModes.ADD);
    highlight.setAlpha(0);
    highlight.setDepth(image.depth + 0.01);
    const text = scene.add.text(textX, textY, placeholder, defaultStyle).setOrigin(0, 0.5);
    const field = {
      image,
      highlight,
      text,
      placeholder,
      inputPlaceholder,
      masked,
      autocomplete,
      maxChars,
      getValue,
      setValue,
      openHandler: null,
      baseScaleX: image.scaleX,
      baseScaleY: image.scaleY,
    };

    field.openHandler = () => openField(field);
    image.setInteractive({ useHandCursor: true }).on("pointerup", field.openHandler);
    text.setInteractive({ useHandCursor: true }).on("pointerup", field.openHandler);
    renderField(field);
    fields.push(field);

    if (imageProp) {
      scene[imageProp] = image;
    }
    if (textProp) {
      scene[textProp] = text;
    }

    return field;
  };

  const bindOutsideClose = () => {
    const inputTriggers = new Set();
    fields.forEach((field) => {
      inputTriggers.add(field.image);
      inputTriggers.add(field.text);
    });

    onScenePointerDown = (_pointer, currentlyOver = []) => {
      if (currentlyOver.some((gameObject) => inputTriggers.has(gameObject))) {
        return;
      }
      keyboardBar?.close();
      setActiveField(null);
    };
    scene.input.on("pointerdown", onScenePointerDown);
  };

  const renderAll = () => {
    fields.forEach((field) => renderField(field));
  };

  const destroy = () => {
    setActiveField(null);
    if (onScenePointerDown) {
      scene.input.off("pointerdown", onScenePointerDown);
      onScenePointerDown = null;
    }
    fields.forEach((field) => {
      field.image.off("pointerup", field.openHandler);
      field.text.off("pointerup", field.openHandler);
      field.highlight?.destroy();
    });
    fields.length = 0;
  };

  return {
    addField,
    bindOutsideClose,
    renderAll,
    close: () => keyboardBar?.close(),
    destroy,
    fields,
  };
}
