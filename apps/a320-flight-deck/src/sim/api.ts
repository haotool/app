/**
 * 模擬對外介面：座艙互動、UI、音效、攝影機只經由此介面讀狀態與下指令。
 */
import type { Command } from './controlDefs';
import type { SimEvent, SimState } from './types';

export interface SimApi {
  readonly state: SimState;
  /** 座艙控制項指令（按鈕、旋鈕、桿） */
  command(cmd: Command): void;
  /** 3D 側桿拖曳：side 1 = 機長、2 = 副駕駛；x 右、y 拉（抬頭）為正，-1..1；active=false 表放手回中 */
  setSidestick(side: 1 | 2, x: number, y: number, active: boolean): void;
  on(listener: (e: SimEvent) => void): () => void;
}
