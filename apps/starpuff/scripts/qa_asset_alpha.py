#!/usr/bin/env python3
"""素材 alpha 假透明全圖掃描（#857 審查必修 2＋終審修法 1/2）。

三項檢測，涵蓋「背景未真去除」的病灶模式，與位置無關：
1. edge-band：圖邊緣 6% 帶內不透明比例。真病例（棋盤紋／滿版底延伸到邊）
   實測 0.51+，設計性出血幀（大型水體／碎屑）實測 <=0.33，閾值 0.40 取間隙。
   僅此項豁免 bg- 滿版背景（full-bleed 邊緣本該不透明）。
2. central-residue：近白佔比×分佈廣度×低彩純度三條件，適用全部資產含 bg。
   - nw_bbox 分母採「不透明像素自身 bbox」（終審修法 2）：判準與主體佔畫布
     比例脫鉤——主體佔 90-95% 的立繪整身假透明也會被抓。
   - bbox 閾值 0.998：現行病例與資產集下假透明實測恆為 1.0000（近白即
     opaque 最外緣）、正當白光資產 <=0.9940——此為實測間隙而非普遍幾何保證
     （中空輪廓包裹的假透明內裡可把 bbox 壓到 0.69-0.73，靠 checker-blocks
     補位）。注意最窄安全邊際僅 0.004，且對 lowchroma 本身 >0.80 的合法
     白光資產（fx-prism-aura-overlay 等三張）此軸是唯一防護、非雙保險。
   - lowchroma（低彩比例 chroma<=20）第三軸：棋盤／假底為無彩或輕色偏
     （實測 0.86-1.0，chroma=15 色偏棋盤在此門檻下為 1.0），水花白色偏
     較重（T=20 下最高 0.788）。
3. checker-blocks：4x4 塊級無彩雙檔判準（白格 lum>=235 與灰格 150-235、
   chroma<=12 各佔塊 >=0.2），抓「局部無彩棋盤補丁」（不觸邊緣帶、佔比
   不足以觸發全圖條件，如 bg 中央棋盤）與中空輪廓包裹變體。白光爆發塊是
   單檔＋有彩過渡，不觸發。塊級檔位曾試放寬 chroma<=30 以攔色偏 dark 檔，
   誤殺 3 張淡彩資產後收回：色偏棋盤由 central-residue 的 T=20 負責，
   「中空輪廓＋色偏」複合變體是兩層皆漏的已知殘餘邊界。
   已知邊界（審查席定界）：置中補丁 <~10% 畫布面積（<=160px @2048）會因
   均分落入 4x4 象限稀釋比例而逃逸（錨定單一區塊時 100px 即命中）；非貼邊
   病灶不受影響。修法方向是滑動視窗或提高網格密度，經審查裁定 ROI 遞減
   維持現狀，勿再疊加啟發式軸。

閾值以六張已知病例（git 5ebbfb0a2 重生前版本）＋兩組審查對抗樣本回歸驗證，
並以現行 505 張全量零誤殺調校；調整閾值時必須同時重跑三組。

用法：python3 qa_asset_alpha.py <sprites_dir>
依賴：Pillow（本機 QA 工具，不接 CI）。
"""

import sys
from pathlib import Path

from PIL import Image

EDGE_BAND_RATIO = 0.06
EDGE_OPAQUE_MAX = 0.40
NW_RATIO_MIN = 0.30
NW_BBOX_MIN = 0.998
NW_LOWCHROMA_MIN = 0.80
LOWCHROMA_T = 20
BLOCK_CHROMA_T = 12
BLOCKS = 4
BLOCK_OPAQUE_MIN = 0.3
BLOCK_TONE_MIN = 0.2
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
    bw, bh = w / BLOCKS, h / BLOCKS
    edge_total = edge_opaque = 0
    opaque = alpha_sum = nw = nw_lowchroma = 0
    oxs: list[int] = []
    oys: list[int] = []
    nxs: list[int] = []
    nys: list[int] = []
    blocks: dict[tuple[int, int], list[int]] = {}
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b, a = px[x, y]
            bk = (int(x // bw), int(y // bh))
            tot_hi_lo_op = blocks.setdefault(bk, [0, 0, 0, 0])
            tot_hi_lo_op[0] += 1
            if a > 16:
                opaque += 1
                alpha_sum += a
                oxs.append(x)
                oys.append(y)
                tot_hi_lo_op[3] += 1
                lum = (r + g + b) / 3
                chroma = max(r, g, b) - min(r, g, b)
                if chroma <= BLOCK_CHROMA_T and lum >= 235:
                    tot_hi_lo_op[1] += 1
                elif chroma <= BLOCK_CHROMA_T and 150 <= lum < 235:
                    tot_hi_lo_op[2] += 1
                if r >= 205 and g >= 205 and b >= 205 and chroma <= 35:
                    nw += 1
                    nxs.append(x)
                    nys.append(y)
                    if chroma <= LOWCHROMA_T:
                        nw_lowchroma += 1
            if x < band or x >= w - band or y < band or y >= h - band:
                edge_total += 1
                if a > 32:
                    edge_opaque += 1

    if not fullbleed:
        edge_ratio = edge_opaque / max(1, edge_total)
        if edge_ratio > EDGE_OPAQUE_MAX:
            issues.append(f'edge-band={edge_ratio:.2f}')

    nw_ratio = nw / max(1, opaque)
    opaque_bbox = (max(oxs) - min(oxs)) * (max(oys) - min(oys)) if oxs else 1
    nw_bbox = ((max(nxs) - min(nxs)) * (max(nys) - min(nys)) / max(1, opaque_bbox)) if nxs else 0
    lowchroma = nw_lowchroma / max(1, nw)
    if nw_ratio > NW_RATIO_MIN and nw_bbox > NW_BBOX_MIN and lowchroma > NW_LOWCHROMA_MIN:
        issues.append(f'central-residue={nw_ratio:.2f}/bbox={nw_bbox:.2f}/chroma={lowchroma:.2f}')

    checker = [
        bk
        for bk, (tot, hi, lo, op) in blocks.items()
        if op / tot >= BLOCK_OPAQUE_MIN and hi / tot >= BLOCK_TONE_MIN and lo / tot >= BLOCK_TONE_MIN
    ]
    if checker:
        issues.append(f'checker-blocks={len(checker)}')

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
