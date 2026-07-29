#!/usr/bin/env python3
"""魔王立繪 alpha 佔幅表產生器（碰撞箱與美術脫鉤根修）。

病灶：bossStagecraft.setFrame 對每一幀都套固定 setDisplaySize(bodyW, bodyH)，
但各幀在 512 畫布內的實際不透明佔幅差異極大（實測 58%~100%）。結果是
「畫面上的身體」大小隨幀跳動，而物理箱恆為 bodyW×固定比例——idle 輪播到
小佔幅幀時，玩家距離可見身體 15~20px 外就吃到接觸傷害。

本腳本掃描每張魔王貼圖的 alpha 邊界框，輸出佔幅比例常數表；執行期由
bossStagecraft 依「該幀佔幅 / base 幀佔幅」反算 displaySize，令可見身體的
世界尺寸恆定，物理箱再依 base 幀佔幅回推——判定與眼睛看到的一致。

用法：python3 gen_boss_art_bounds.py            （自 repo 內預設路徑推導）
依賴：Pillow（本機工具，不接 CI；輸出檔已進版控）。
"""

import sys
from pathlib import Path

from PIL import Image

# 透明判準沿 qa_asset_alpha.py 慣例：alpha<=16 視為透明（去背殘留不計入身體）。
ALPHA_FLOOR = 16
# 只收魔王本體貼圖；場景/彈幕/小兵各有自己的碰撞契約，不在此表。
PREFIX = "boss-"


def bounds_ratio(path: Path) -> tuple[float, float]:
    """回傳 (寬佔幅, 高佔幅)——不透明邊界框佔畫布的比例。"""
    with Image.open(path) as im:
        alpha = im.convert("RGBA").getchannel("A")
    box = alpha.point(lambda a: 255 if a > ALPHA_FLOOR else 0).getbbox()
    if box is None:
        return (1.0, 1.0)
    left, top, right, bottom = box
    return ((right - left) / alpha.width, (bottom - top) / alpha.height)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    sprites = root / "src" / "assets" / "sprites"
    out = root / "src" / "game" / "core" / "bossArtBounds.ts"
    if not sprites.is_dir():
        print(f"找不到素材目錄：{sprites}", file=sys.stderr)
        return 1

    rows: list[tuple[str, float, float]] = []
    for path in sorted(sprites.glob(f"{PREFIX}*.webp")):
        w, h = bounds_ratio(path)
        rows.append((path.stem, round(w, 4), round(h, 4)))

    lines = [
        "// 【產生檔】請勿手改——由 scripts/gen_boss_art_bounds.py 掃描 alpha 邊界框產出。",
        "// 素材增刪或重繪後重跑該腳本；缺表的鍵由 bossStagecraft 視為滿幅（佔幅 1）降級。",
        "//",
        "// 語意：值為「不透明邊界框佔 512 畫布的比例」。bossStagecraft 依此把各幀的",
        "// displaySize 正規化，令畫面上的身體尺寸恆定——碰撞箱因而能對齊眼睛所見。",
        "",
        "export interface ArtBounds {",
        "  /** 不透明邊界框寬度佔畫布比例。 */",
        "  readonly w: number;",
        "  /** 不透明邊界框高度佔畫布比例。 */",
        "  readonly h: number;",
        "}",
        "",
        "export const BOSS_ART_BOUNDS: Readonly<Record<string, ArtBounds>> = {",
    ]
    for key, w, h in rows:
        lines.append(f"  '{key}': {{ w: {w}, h: {h} }},")
    lines.append("};")
    lines.append("")

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"已寫入 {out.relative_to(root)}：{len(rows)} 筆")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
