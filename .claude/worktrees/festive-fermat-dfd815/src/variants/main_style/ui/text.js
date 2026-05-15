export function connectionLabel(status) {
  const map = {
    idle: "\u9592\u7f6e",
    connecting: "\u9023\u7dda\u4e2d",
    open: "\u5df2\u9023\u7dda",
    closed: "\u5df2\u65b7\u958b",
    error: "\u9023\u7dda\u932f\u8aa4",
  };
  if (map[status]) {
    return map[status];
  }
  if (typeof status === "string" && status.startsWith("reconnecting_")) {
    const seconds = status.split("_")[1] || "";
    return `\u91cd\u9023\u4e2d (${seconds})`;
  }
  if (typeof status === "string" && status.startsWith("closed_")) {
    const code = status.split("_")[1] || "";
    return `\u9023\u7dda\u4e2d\u65b7 (${code})`;
  }
  return status || "-";
}
