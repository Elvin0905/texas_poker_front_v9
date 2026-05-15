export const BASE_WIDTH = 720;
export const BASE_HEIGHT_DESIGN = 1440;

export const layout = {
  width: BASE_WIDTH,
  height: BASE_HEIGHT_DESIGN,
  left: 0,
  right: BASE_WIDTH,
  top: 0,
  bottom: BASE_HEIGHT_DESIGN,
  centerX: BASE_WIDTH / 2,
  centerY: BASE_HEIGHT_DESIGN / 2,
  safeAreaTop: 0,
  safeAreaBottom: 0,
};

const listeners = new Set();

const IS_COARSE_POINTER = typeof window !== "undefined"
  && Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);

export function updateLayout(viewportWidth, viewportHeight, safeAreaBottomPx = 0, safeAreaTopPx = 0) {
  const isPortraitTouch = IS_COARSE_POINTER && viewportHeight >= viewportWidth;
  const scale = isPortraitTouch
    ? viewportWidth / BASE_WIDTH
    : viewportHeight / BASE_HEIGHT_DESIGN;

  const dynamicHeight = viewportHeight / scale;

  layout.width = BASE_WIDTH;
  layout.height = dynamicHeight;
  layout.left = 0;
  layout.right = BASE_WIDTH;
  layout.top = 0;
  layout.bottom = dynamicHeight;
  layout.centerX = BASE_WIDTH / 2;
  layout.centerY = dynamicHeight / 2;
  layout.safeAreaTop = safeAreaTopPx > 0 ? safeAreaTopPx / scale : 0;
  layout.safeAreaBottom = safeAreaBottomPx > 0 ? safeAreaBottomPx / scale : 0;

  for (const fn of listeners) {
    try {
      fn(layout);
    } catch {}
  }
  return scale;
}

export function onLayoutResize(scene, callback) {
  const wrapped = (nextLayout) => callback(nextLayout);
  listeners.add(wrapped);
  scene?.events?.once?.("shutdown", () => listeners.delete(wrapped));
  scene?.events?.once?.("destroy", () => listeners.delete(wrapped));
  return () => listeners.delete(wrapped);
}
