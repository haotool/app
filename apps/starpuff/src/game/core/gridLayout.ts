// 有界網格排版 SSOT（GAME_DESIGN §96）：固定縱向預算內排列 n 項——
// 列數由預算與列距推導（最後一列底緣保證 ≤ maxY）、欄數隨量增（仿 §76
// renderMonsters 固定列策略）。純函式模組供 vitest node 環境守門
// 「任何圖鑑分頁內容不得超出 y=470」。

export interface BoundedGridSpec {
  startY: number;
  // 列距（相鄰列頂緣間隔）；itemH 為單項最壞內容高，兩者共同決定可容列數。
  rowH: number;
  itemH: number;
  maxY: number;
}

export interface BoundedGrid {
  cols: number;
  rows: number;
}

// 可容列數 = floor((maxY − itemH − startY) / rowH) + 1，至少 1（極矮預算退化
// 為單列多欄）；實際列數不超過條目需求，欄數 = ceil(count / rows)。
export function fitBoundedGrid(count: number, spec: BoundedGridSpec): BoundedGrid {
  const budget = spec.maxY - spec.itemH - spec.startY;
  const maxRows = Math.max(1, Math.floor(budget / spec.rowH) + 1);
  const cols = Math.ceil(count / maxRows);
  return { cols, rows: Math.min(maxRows, Math.ceil(count / Math.max(1, cols))) };
}

export function gridRowTop(row: number, spec: Pick<BoundedGridSpec, 'startY' | 'rowH'>): number {
  return spec.startY + row * spec.rowH;
}

// 守門斷言用：最後一列的內容底緣。
export function gridBottom(grid: BoundedGrid, spec: BoundedGridSpec): number {
  return gridRowTop(grid.rows - 1, spec) + spec.itemH;
}
