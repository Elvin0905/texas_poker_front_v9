import { mainStyleVariant } from "./main_style/variant.js";
import { testStyleVariant } from "./test_style/variant.js";

const variants = {
  main_style: mainStyleVariant,
  test_style: testStyleVariant,
};

export function getGameVariant(variantIdRaw = "") {
  const variantId = String(variantIdRaw || "").trim() || "main_style";
  return variants[variantId] || variants.main_style;
}

export function getAvailableVariantIds() {
  return Object.keys(variants);
}
