#!/usr/bin/env python3
"""素材 alpha 假透明全圖掃描（#857 審查必修 2）。

偵測「背景未真去除」的病灶模式，與位置無關（中央棋盤、角落乾淨也會被抓）：
1. edge-band：圖邊緣 6% 帶內不透明比例。真病例（棋盤紋／滿版底延伸到邊）
   實測 0.51+，設計性出血幀（大型水體／碎屑）實測 <=0.33，閾值 0.40 取間隙。
2. central-residue：近白像素佔比 + 全圖分佈廣度雙條件。畫入的棋盤紋／假透明
   白格遍佈全圖（nw_bbox>=0.97），主體高光與出血水花集中（實測 <=0.93）。
3. mean-alpha：主體平均不透明度僅輸出 WARN——果凍美術與 VFX 光暈層的
   半透明是設計語言，需按資產類型的語境判斷，不作全量 FAIL 依據。

閾值以六張已知病例（git 5ebbfb0a2 重生前版本）回歸驗證＋現行 505 張
零誤殺調校；調整閾值時必須同時重跑兩組。

用法：python3 qa_asset_alpha.py <sprites_dir>
依賴：Pillow（本機 QA 工具，不接 CI）。
"""

import sys
from pathlib import Path

from PIL import Image

EDGE_BAND_RATIO = 0.06
EDGE_OPAQUE_MAX = 0.40
NW_RATIO_MIN = 0.30
NW_BBOX_MIN = 0.97
MEAN_ALPHA_WARN = 230
FULLBLEED_PREFIXES = ('bg-',)


def check(path: Path, fullbleed: bool) -> tuple[list[str], list[str]]:
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    issues: list[str] = []
    warns: list[str] = []

    band = max(4, int(min(w, h) * EDGE_BAND_RATIO))
    step = max(1, w // 512)
    edge_total = edge_opaque = 0
    opaque = alpha_sum = nw = 0
    xs: list[int] = []
    ys: list[int] = []
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b, a = px[x, y]
            if a > 16:
                opaque += 1
                alpha_sum += a
                if r >= 205 and g >= 205 and b >= 205 and max(r, g, b) - min(r, g, b) <= 35:
                    nw += 1
                    xs.append(x)
                    ys.append(y)
            if x < band or x >= w - band or y < band or y >= h - band:
                edge_total += 1
                if a > 32:
                    edge_opaque += 1

    if not fullbleed:
        edge_ratio = edge_opaque / max(1, edge_total)
        if edge_ratio > EDGE_OPAQUE_MAX:
            issues.append(f'edge-band={edge_ratio:.2f}')
        nw_ratio = nw / max(1, opaque)
        nw_bbox = ((max(xs) - min(xs)) * (max(ys) - min(ys)) / (w * h)) if xs else 0
        if nw_ratio > NW_RATIO_MIN and nw_bbox > NW_BBOX_MIN:
            issues.append(f'central-residue={nw_ratio:.2f}/bbox={nw_bbox:.2f}')

    mean_alpha = alpha_sum / max(1, opaque)
    if opaque and mean_alpha < MEAN_ALPHA_WARN:
        warns.append(f'mean-alpha={mean_alpha:.0f}')

    return issues, warns


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    failed = warned = 0
    files = sorted(root.glob('*.webp'))
    for f in files:
        issues, warns = check(f, f.name.startswith(FULLBLEED_PREFIXES))
        if issues:
            failed += 1
            print(f'FAIL {f.name} {";".join(issues)}')
        elif warns:
            warned += 1
    print(f'scanned={len(files)} failed={failed} mean-alpha-warns={warned}')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
