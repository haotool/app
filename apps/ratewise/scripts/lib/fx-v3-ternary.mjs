/**
 * 來源文字中的 `FX_V3_PUBLIC ? '<v3>' : '<legacy>'` 依 SSOT 常數先行展開，讓 Markdown 鏡像與 HTML 同步切換。
 * 守門：只接受兩臂皆為字串字面值的三元式；任何無法展開的 FX_V3_PUBLIC 三元式都會 throw，
 * 避免未解析的原始碼片段或錯誤分支靜默發佈到 public/*.md。
 */
const STRING_LITERAL = String.raw`(?:\x60(?:\\[\s\S]|[^\x60\\])*\x60|'(?:\\[\s\S]|[^'\\])*')`;
const FX_V3_TERNARY = new RegExp(
  String.raw`FX_V3_PUBLIC\s*\?\s*(${STRING_LITERAL})\s*:\s*(${STRING_LITERAL})`,
  'g',
);

export function resolveFxV3Ternaries(source, v3Public) {
  const expected = (source.match(/FX_V3_PUBLIC\s*\?/g) ?? []).length;
  let resolved = 0;
  const output = source.replace(FX_V3_TERNARY, (_, v3, legacy) => {
    resolved += 1;
    return v3Public ? v3 : legacy;
  });
  if (resolved !== expected || /FX_V3_PUBLIC\s*\?/.test(output)) {
    throw new Error(
      `fx-v3-ternary: ${expected} 個 FX_V3_PUBLIC 三元式只展開 ${resolved} 個；兩臂必須都是字串字面值。`,
    );
  }
  return output;
}
