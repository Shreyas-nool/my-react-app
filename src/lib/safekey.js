//C:\Users\omkar\Desktop\client\src\lib\safekey.js
export const toSafeKey = (name) => {
  if (!name) return "";

  return name
    .replace(/\./g, "_dot_")
    .replace(/#/g, "_hash_")
    .replace(/\$/g, "_dollar_")
    .replace(/\[/g, "_lbr_")
    .replace(/\]/g, "_rbr_")
    .replace(/\//g, "_slash_")
    .trim();
};

export const fromSafeKey = (key) => {
  return key
    .replace(/_dot_/g, ".")
    .replace(/_hash_/g, "#")
    .replace(/_dollar_/g, "$")
    .replace(/_lbr_/g, "[")
    .replace(/_rbr_/g, "]")
    .replace(/_slash_/g, "/");
};
