import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LOG_PATH as LOG_PATH_UNTYPED,
  parseEntries,
  parsePreviousTotal,
  parseStrictHeader,
  validate002,
} from '../verify-002-log.mjs';

// .mjs 無型別宣告，正規化為 string 供路徑參數使用（維持 SSOT、不複製字面值）。
const LOG_PATH = String(LOG_PATH_UNTYPED);

function buildLog({
  header,
  entries,
}: {
  header: string;
  entries: { date?: string; id: string; reason?: string; fix?: string }[];
}) {
  const blocks = entries.map(
    (entry) =>
      `- 日期：${entry.date ?? '2026-07-07'}\n- ID：${entry.id}\n- 原因：${entry.reason ?? '原因'}\n- 解法：${entry.fix ?? '解法'}`,
  );
  return [
    '# 開發獎懲與決策記錄（超短版）',
    '',
    '> 版本：outline-v2-ultra',
    '> 原則：每筆只保留日期、ID、原因、解法。',
    header,
    '',
    '## 新增模板（4 行）',
    '',
    '- 日期：YYYY-MM-DD',
    '- ID：<唯一識別>',
    '- 原因：<一句話 root cause>',
    '- 解法：<一句話修正>',
    '',
    '## 條目（新→舊）',
    '',
    ...blocks.flatMap((block) => [block, '']),
  ].join('\n');
}

const HEAD_CONTENT = buildLog({
  header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
  entries: [{ id: 'reward-existing-entry' }],
});

describe('parseStrictHeader / parsePreviousTotal', () => {
  it('解析標準檔頭記分行', () => {
    expect(
      parseStrictHeader('> 本次分數變化：+2（reward 3、penalty 1、neutral 0）｜累計總分：+172'),
    ).toEqual({
      line: '> 本次分數變化：+2（reward 3、penalty 1、neutral 0）｜累計總分：+172',
      delta: 2,
      reward: 3,
      penalty: 1,
      neutral: 0,
      total: 172,
    });
  });

  // 文件所定格式為 `+N`／`+T`；省略加號會讓非標準檔頭永久寫進稽核記錄。
  it.each([
    ['分數變化缺正號', '> 本次分數變化：2（reward 3、penalty 1、neutral 0）｜累計總分：+172'],
    ['累計總分缺正號', '> 本次分數變化：+2（reward 3、penalty 1、neutral 0）｜累計總分：172'],
  ])('%s時嚴格檔頭解析失敗', (_label, line) => {
    expect(parseStrictHeader(line)).toBeNull();
  });

  it('負值檔頭仍可解析（負號即為顯式符號）', () => {
    expect(
      parseStrictHeader('> 本次分數變化：-1（reward 0、penalty 1、neutral 0）｜累計總分：-3')
        ?.delta,
    ).toBe(-1);
  });

  it('歷史自由格式檔頭仍可取出累計總分（前版相容）', () => {
    expect(
      parsePreviousTotal(
        '> 本次分數變化：+5（雙線合併：本線 reward 4＋上游 reward 1）｜累計總分：+170',
      ),
    ).toBe(170);
    expect(
      parseStrictHeader(
        '> 本次分數變化：+5（雙線合併：本線 reward 4＋上游 reward 1）｜累計總分：+170',
      ),
    ).toBeNull();
  });
});

describe('parseEntries', () => {
  it('解析四行模板條目與 ID', () => {
    const { entries, globalErrors } = parseEntries(HEAD_CONTENT);
    expect(globalErrors).toEqual([]);
    expect(entries.map((entry) => entry.id)).toEqual(['reward-existing-entry']);
    expect(entries[0]?.errors).toEqual([]);
  });

  it('缺少條目區段時回報全域錯誤', () => {
    const { globalErrors } = parseEntries('# 空文件');
    expect(globalErrors).toEqual(['找不到「## 條目」區段']);
  });

  // 只解析第一個區段，故多個「## 條目」等於替後續區段開一個永久盲區：
  // 前置 decoy 抄齊全部 ID 即可滿足刪除防護，真區段從此不受檢視。
  it('多個「## 條目」區段時回報全域錯誤（decoy 區段盲區）', () => {
    const decoyed = HEAD_CONTENT.replace(
      '## 條目（新→舊）',
      '## 條目（索引）\n\n- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n\n## 條目（新→舊）',
    );
    const { globalErrors } = parseEntries(decoyed);
    expect(globalErrors).toEqual(['「## 條目」區段必須唯一（找到 2 個）']);
  });

  // 歷史檔有數處漏空行使多筆黏成一塊；僅靠空行切分會讓後續條目 ID 隱形。
  it('漏空行黏成一塊時仍以「- 日期：」逐筆切分', () => {
    const glued = HEAD_CONTENT.replace(
      '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法',
      '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n' +
        '- 日期：2026-07-07\n- ID：reward-glued-entry\n- 原因：原因\n- 解法：解法',
    );
    const { entries } = parseEntries(glued);
    expect(entries.map((entry) => entry.id)).toEqual([
      'reward-existing-entry',
      'reward-glued-entry',
    ]);
    expect(entries.every((entry) => entry.errors.length === 0)).toBe(true);
  });
});

describe('validate002', () => {
  it('正確案例：計數、分數變化、總分鏈全部一致', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    expect(validate002({ stagedContent: staged, headContent: HEAD_CONTENT }).errors).toEqual([]);
  });

  it('計數不符：檔頭寫 reward 2 但只新增 1 筆', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('不符'))).toBe(true);
  });

  it('分數變化算式錯誤：reward 1、penalty 1 應為 0', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 1、neutral 0）｜累計總分：+171',
      entries: [
        { id: 'reward-new-entry' },
        { id: 'penalty-new-entry' },
        { id: 'reward-existing-entry' },
      ],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('本次分數變化應為 0'))).toBe(true);
  });

  it('總分斷鏈：前版 +170 加 +1 應為 +171 而非 +175', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+175',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('累計總分斷鏈'))).toBe(true);
  });

  it('ID 重複：新增條目沿用既有 ID', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-existing-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('ID 重複'))).toBe(true);
  });

  it('格式錯行：新增條目缺「解法」行', () => {
    const staged = [
      HEAD_CONTENT.replace(
        '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      ).replace(
        '## 條目（新→舊）\n',
        '## 條目（新→舊）\n\n- 日期：2026-07-07\n- ID：reward-broken-entry\n- 原因：只有三行\n',
      ),
    ].join('');
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('條目行數應為 4 行'))).toBe(true);
  });

  it('日期格式錯誤：非 YYYY-MM-DD', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry', date: '2026/07/07' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('日期格式應為 YYYY-MM-DD'))).toBe(true);
  });

  // 空白 ID 若留成空字串，會被 newEntries 的 truthy 篩選排除，
  // 使該筆同時繞過前綴、唯一性、計數與總分檢查（檔頭不動即全綠）。
  it.each([
    ['空字串', ''],
    ['僅空白', '   '],
  ])('新增條目 ID 為%s時視同缺少 ID 並擋下', (_label, id) => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('條目 ID 不可為空'))).toBe(true);
  });

  // 只檢查行前綴會讓「- 原因：」／「- 解法：」的空值通過，
  // 使缺 root cause 或 resolution 的紀錄同時通過本地與 CI 守門。
  it.each([
    ['原因', { reason: '  ', fix: '解法' }, '- 原因：'],
    ['解法', { reason: '原因', fix: '' }, '- 解法：'],
  ])('新增條目的%s欄位為空時擋下', (_label, fields, prefix) => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry', ...fields }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes(`「${prefix}」不可為空`))).toBe(true);
  });

  it('新增條目 ID 前綴不合法時擋下', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'bonus-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: HEAD_CONTENT });
    expect(errors.some((message) => message.includes('reward-/penalty-/neutral-'))).toBe(true);
  });

  it('初始 commit（無 HEAD 版本）跳過總分鏈但仍驗計數', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
      entries: [{ id: 'reward-first-entry' }],
    });
    expect(validate002({ stagedContent: staged, headContent: null }).errors).toEqual([]);
  });

  it('歷史條目格式問題不回溯擋 commit', () => {
    const headWithLegacy = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-legacy-entry', date: '2026/1/1' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-legacy-entry', date: '2026/1/1' }],
    });
    expect(validate002({ stagedContent: staged, headContent: headWithLegacy }).errors).toEqual([]);
  });

  it('無新增條目且檔頭未動（如 typo 修正）不驗記分', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry', reason: '修正錯字' }],
    });
    expect(validate002({ stagedContent: staged, headContent: HEAD_CONTENT }).errors).toEqual([]);
  });

  it('靜默刪除歷史條目（檔頭未動）必須被擋下', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'penalty-old-incident' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('penalty-old-incident'),
      ),
    ).toBe(true);
  });

  it('刪除非標準前綴的歷史條目同樣被擋下（⊆ 檢查不限標準前綴）', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'legacy-2026-incident-log' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('legacy-2026-incident-log'),
      ),
    ).toBe(true);
  });

  it('刪除黏在同一塊（漏空行）中的歷史條目同樣被擋下', () => {
    const glue = (content: string) =>
      content.replace(
        '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n\n',
        '- 日期：2026-07-07\n- ID：reward-existing-entry\n- 原因：原因\n- 解法：解法\n',
      );
    const head = glue(
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'reward-existing-entry' }, { id: 'penalty-glued-incident' }],
      }),
    );
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes('歷史條目不可刪除') && message.includes('penalty-glued-incident'),
      ),
    ).toBe(true);
  });

  // 掏空既有條目 = 就地刪除，是刪除防護的等效規避路徑（保留檔案與 ID、把內容清空）。
  it.each([
    ['原因', { reason: '' }, '- 原因：'],
    ['解法', { fix: '   ' }, '- 解法：'],
    ['日期', { date: '' }, '- 日期：'],
  ])('掏空既有條目的%s欄位必須被擋下', (_label, emptied, prefix) => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [
        { id: 'penalty-old-incident', reason: '原始原因', fix: '原始解法' },
        { id: 'reward-existing-entry' },
      ],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [
        { id: 'penalty-old-incident', reason: '原始原因', fix: '原始解法', ...emptied },
        { id: 'reward-existing-entry' },
      ],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) =>
          message.includes(`「${prefix}」原有內容不可清空`) &&
          message.includes('penalty-old-incident'),
      ),
    ).toBe(true);
  });

  // 整行刪除（既有四行條目縮成只剩日期與 ID）與留空值同屬掏空，
  // 不得因「歷史條目格式錯誤不回溯」而被略過。
  it('既有條目被刪成只剩日期與 ID 必須被擋下', () => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({
      header,
      entries: [
        { id: 'penalty-old-incident', reason: '真實事故根因', fix: '真實修法' },
        { id: 'reward-existing-entry' },
      ],
    });
    const staged = head.replace('- 原因：真實事故根因\n- 解法：真實修法\n', '');
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(errors.some((message) => message.includes('「- 原因：」原有內容不可清空'))).toBe(true);
    expect(errors.some((message) => message.includes('「- 解法：」原有內容不可清空'))).toBe(true);
  });

  // 正向對照採本 PR 真實發生的精確性修正（002 破口規模數字由 5 處／6 筆更正為 2 處／3 筆）：
  // 判準是「有沒有從有變成無」，內容改動本身不受限。
  it('精確性修正（非空改為另一個非空）不受掏空防護影響', () => {
    const before = {
      id: 'reward-002-log-gate-glued-block-parsing',
      reason:
        '來源版解析器只用空行切分條目，但歷史 002 有 5 處漏空行使多筆黏成一塊——`block.find` 只取首個 ID，使 6 筆條目對唯一性與刪除防護隱形',
      fix: '解析器補「- 日期：」為次要邊界（空行仍為主要邊界），納管條目由 513 升為 518',
    };
    const after = {
      id: before.id,
      reason:
        '來源版解析器只用空行切分條目，但歷史 002 有 2 處漏空行使多筆黏成一塊（8 行 2 筆、12 行 3 筆）——`block.find` 只取首個 ID，使 3 筆條目對唯一性與刪除防護隱形',
      fix: '解析器補「- 日期：」為次要邊界（空行仍為主要邊界），納管條目由 515 升為 518',
    };
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({ header, entries: [before, { id: 'reward-existing-entry' }] });
    const staged = buildLog({ header, entries: [after, { id: 'reward-existing-entry' }] });
    expect(validate002({ stagedContent: staged, headContent: head }).errors).toEqual([]);
  });

  // CASCADE：基準版本身不可解析時 parseEntries 回傳空 entries，會讓刪除檢查落入真空。
  // 攻擊鏈為「先讓 tip 變成不可解析 → 下一個 commit 清空全部歷史 ID」，兩道閘皆綠。
  it.each([
    [
      '多個「## 條目」區段',
      '## 條目（索引）\n\n- 日期：2026-07-07\n- ID：penalty-evidence\n- 原因：原因\n- 解法：解法\n\n## 條目（新→舊）',
      '區段必須唯一',
    ],
    ['區段標題被移除', '（區段標題被移除）', '找不到'],
  ])('基準版因%s而不可解析時，清空歷史必紅（CASCADE）', (_label, poison, expectedReason) => {
    const good = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'penalty-evidence' }, { id: 'reward-existing-entry' }],
    });
    const poisonedHead = good.replace('## 條目（新→舊）', poison);
    const wiped = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [{ id: 'reward-clean-slate' }],
    });

    const { errors } = validate002({ stagedContent: wiped, headContent: poisonedHead });
    // 第一道：基準版不可解析即 fail-closed。
    expect(
      errors.some(
        (message) => message.includes('基準版 002 無法解析') && message.includes(expectedReason),
      ),
    ).toBe(true);
    // 第二道：原始文字掃描仍抓得到被清掉的 ID（不依賴解析成功）。
    expect(
      errors.some(
        (message) => message.includes('歷史條目不可刪除') && message.includes('penalty-evidence'),
      ),
    ).toBe(true);
  });

  // 刪除比對加入原始文字掃描後，被「移出解析範圍」的條目仍會出現在 raw 集合，
  // 若只比對刪除就會讓「插入 `## ` 標題截斷」「搬到區段之前」這兩條路徑復活。
  const EVIDENCE_BLOCK = '- 日期：2026-07-07\n- ID：penalty-evidence\n- 原因：原因\n- 解法：解法';

  it.each([
    // 在目標條目之前插入 `## ` 標題，使解析在該處中止。
    [
      '被「## 」標題截斷',
      (log: string) => log.replace(EVIDENCE_BLOCK, `## 附錄\n\n${EVIDENCE_BLOCK}`),
    ],
    // 搬到「## 條目」區段之前（先移除原位置再插入，避免二次命中）。
    [
      '被搬到「## 條目」之前',
      (log: string) =>
        log
          .replace(`${EVIDENCE_BLOCK}\n`, '')
          .replace('## 條目（新→舊）\n', `${EVIDENCE_BLOCK}\n\n## 條目（新→舊）\n`),
    ],
  ])('既有條目%s而移出解析範圍時必紅', (_label, mutate) => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({
      header,
      entries: [{ id: 'reward-existing-entry' }, { id: 'penalty-evidence' }],
    });
    const staged = mutate(head);
    expect(staged).not.toBe(head);
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(
      errors.some(
        (message) => message.includes('不可移出') && message.includes('penalty-evidence'),
      ),
    ).toBe(true);
  });

  // 區段外的獨立 `- ID：` 行（文件範例等）不是條目；併入刪除比對會誤傷合法的文件改寫。
  it('移除「## 條目」區段外的獨立 ID 行不算刪除歷史條目', () => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const base = buildLog({ header, entries: [{ id: 'reward-existing-entry' }] });
    const head = base.replace(
      '## 條目（新→舊）',
      '範例：\n- ID：penalty-ghost\n\n## 條目（新→舊）',
    );
    expect(validate002({ stagedContent: base, headContent: head }).errors).toEqual([]);
  });

  // 唯一性若無條件掃全檔，歷史一旦出現重複，之後每個 commit 都會被卡死（即使沒動 002）。
  it('歷史上已存在的重複 ID 不回溯擋 commit', () => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const withDuplicate = buildLog({
      header,
      entries: [{ id: 'reward-dup' }, { id: 'reward-dup' }, { id: 'reward-existing-entry' }],
    });
    // 完全不動 002。
    expect(
      validate002({ stagedContent: withDuplicate, headContent: withDuplicate }).errors,
    ).toEqual([]);
    // 正常 append，歷史重複維持原樣。
    const appended = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [
        { id: 'reward-new-entry' },
        { id: 'reward-dup' },
        { id: 'reward-dup' },
        { id: 'reward-existing-entry' },
      ],
    });
    expect(validate002({ stagedContent: appended, headContent: withDuplicate }).errors).toEqual([]);
  });

  it('本次造成的重複 ID 仍必須擋下', () => {
    const header = '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170';
    const head = buildLog({
      header,
      entries: [{ id: 'reward-dup' }, { id: 'reward-dup' }, { id: 'reward-existing-entry' }],
    });
    // 重複度由 2 增為 3。
    const staged = buildLog({
      header,
      entries: [
        { id: 'reward-dup' },
        { id: 'reward-dup' },
        { id: 'reward-dup' },
        { id: 'reward-existing-entry' },
      ],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: head });
    expect(errors.some((message) => message.includes('ID 重複：「reward-dup」'))).toBe(true);
  });

  it('空字串基準版走解析 fail-closed，不得當成「無基準版」', () => {
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+9999',
      entries: [{ id: 'reward-new-entry' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: '' });
    expect(errors.some((message) => message.includes('基準版 002 無法解析'))).toBe(true);
  });

  it('基準版讀不出累計總分時 fail-closed（不得靜默跳過總分鏈）', () => {
    const headWithoutHeader = buildLog({
      header: '> 版本：outline-v2-ultra',
      entries: [{ id: 'penalty-evidence' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+9999',
      entries: [{ id: 'reward-new-entry' }, { id: 'penalty-evidence' }],
    });
    const { errors } = validate002({ stagedContent: staged, headContent: headWithoutHeader });
    expect(errors.some((message) => message.includes('基準版檔頭讀不出累計總分'))).toBe(true);
  });

  it('正常 append（歷史條目完整保留，含非標準前綴）不受刪除防護影響', () => {
    const head = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'reward-existing-entry' }, { id: 'legacy-2026-incident-log' }],
    });
    const staged = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
      entries: [
        { id: 'reward-new-entry' },
        { id: 'reward-existing-entry' },
        { id: 'legacy-2026-incident-log' },
      ],
    });
    expect(validate002({ stagedContent: staged, headContent: head }).errors).toEqual([]);
  });
});

describe('git 整合（pre-commit staged 語意／--base-ref CI 語意 issue #661）', () => {
  const SCRIPT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'verify-002-log.mjs');
  // 隔離全域/系統 git config（gpgsign、hooksPath 等），身分改由環境變數提供。
  // 先剝除繼承的 GIT_* 變數：hook 環境（pre-push 跑 vitest）會注入 GIT_DIR/GIT_INDEX_FILE，
  // 子行程若繼承會把臨時 repo 的 git 操作導向父 repo。
  const GIT_ENV = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_AUTHOR_NAME: 'vitest',
    GIT_AUTHOR_EMAIL: 'vitest@example.com',
    GIT_COMMITTER_NAME: 'vitest',
    GIT_COMMITTER_EMAIL: 'vitest@example.com',
  };
  const repos: string[] = [];

  afterEach(() => {
    for (const repo of repos.splice(0)) {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  function git(cwd: string, ...args: string[]) {
    // stderr 收進 pipe，避免 checkout 等訊息污染測試輸出。
    return execFileSync('git', args, {
      cwd,
      env: GIT_ENV,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  function commitLog(repo: string, content: string, message: string) {
    writeFileSync(join(repo, LOG_PATH), content);
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', message);
  }

  // 建立 main 上有基準 002 的臨時 repo，並切到 pr 分支模擬 PR HEAD。
  function setupRepo() {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    commitLog(repo, HEAD_CONTENT, 'init');
    git(repo, 'checkout', '-b', 'pr');
    return repo;
  }

  function runScript(repo: string, scriptPath: string, ...args: string[]) {
    try {
      const stdout = execFileSync('node', [scriptPath, ...args], {
        cwd: repo,
        env: GIT_ENV,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, output: stdout };
    } catch (error) {
      const failed = error as { status?: number | null; stdout?: string; stderr?: string };
      return {
        status: failed.status ?? 1,
        output: `${failed.stdout ?? ''}${failed.stderr ?? ''}`,
      };
    }
  }

  function runGuard(repo: string, ...args: string[]) {
    return runScript(repo, SCRIPT_PATH, ...args);
  }

  it('構造計數不符的 PR 最終態必紅', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
      'bad count',
    );
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(1);
    expect(output).toContain('不符');
  });

  it('正確 append 的 PR 綠燈', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
      'good append',
    );
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('002 未變更的 PR 跳過（零額外負擔）', () => {
    const repo = setupRepo();
    writeFileSync(join(repo, 'other.txt'), 'unrelated');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'unrelated');
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
    expect(output).toContain('跳過');
  });

  it('多 commit PR 只驗最終態 vs merge-base（中間態不一致不擋）', () => {
    const repo = setupRepo();
    // 中間 commit：新增條目但檔頭未同步（單看此 commit 會紅）。
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'reward-step-one' }, { id: 'reward-existing-entry' }],
      }),
      'step 1',
    );
    // 最終 commit：整體對帳一致（新增 2 筆、+2、總分 172）。
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+2（reward 2、penalty 0、neutral 0）｜累計總分：+172',
        entries: [
          { id: 'reward-step-two' },
          { id: 'reward-step-one' },
          { id: 'reward-existing-entry' },
        ],
      }),
      'step 2',
    );
    const { status } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
  });

  it('base 分支前進後仍以 merge-base 為基準（非 base tip）', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-from-pr' }, { id: 'reward-existing-entry' }],
      }),
      'pr entry',
    );
    git(repo, 'checkout', 'main');
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-from-main' }, { id: 'reward-existing-entry' }],
      }),
      'main entry',
    );
    git(repo, 'checkout', 'pr');
    const { status } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
  });

  // main push 兜底若取 merge-base，force push 時 before 並非 HEAD 的祖先，
  // 基準會退到更早的共同祖先，使被改寫掉的 penalty 條目驗不出來。
  it('--base-commit：force push 改寫掉基準與祖先之間的條目必紅', () => {
    const repo = setupRepo();
    const ancestor = git(repo, 'rev-parse', 'HEAD').trim();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：-1（reward 0、penalty 1、neutral 0）｜累計總分：+169',
        entries: [{ id: 'penalty-evidence' }, { id: 'reward-existing-entry' }],
      }),
      'add penalty evidence',
    );
    const before = git(repo, 'rev-parse', 'HEAD').trim();

    // 改寫歷史：回到 ancestor 後另起一條不含 penalty-evidence 的線。
    git(repo, 'reset', '--hard', ancestor);
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-rewritten' }, { id: 'reward-existing-entry' }],
      }),
      'force-pushed rewrite',
    );

    // merge-base 模式會退回 ancestor 而看不見 penalty-evidence。
    expect(runGuard(repo, '--base-ref', before).status).toBe(0);
    // 直接以 before 為基準才驗得出刪除。
    const { status, output } = runGuard(repo, '--base-commit', before);
    expect(status).toBe(1);
    expect(output).toContain('penalty-evidence');
  });

  // 兩 flag 基準取法不同，靜默取其一會讓誤用得到假綠（原實作 --base-ref 永遠勝出）。
  it('--base-ref 與 --base-commit 同時指定時互斥失敗', () => {
    const repo = setupRepo();
    const { status, output } = runGuard(repo, '--base-ref', 'main', '--base-commit', 'main');
    expect(status).toBe(1);
    expect(output).toContain('互斥');
  });

  // E2E：poison tip 後 wipe，pre-commit（staged vs HEAD）也必須紅。
  it('pre-commit：基準 HEAD 被 poison 後清空歷史必紅（CASCADE E2E）', () => {
    const repo = setupRepo();
    const good = buildLog({
      header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
      entries: [{ id: 'penalty-evidence' }, { id: 'reward-existing-entry' }],
    });
    commitLog(
      repo,
      good.replace('## 條目（新→舊）', '## 條目（索引）\n\n## 條目（新→舊）'),
      'poison',
    );
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-clean-slate' }],
      }),
    );
    git(repo, 'add', '--all');

    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('penalty-evidence');
  });

  function runIsolated(repo: string, env: NodeJS.ProcessEnv) {
    try {
      const stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
        cwd: repo,
        env,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, output: stdout };
    } catch (error) {
      const failed = error as { status?: number | null; stdout?: string; stderr?: string };
      return { status: failed.status ?? 1, output: `${failed.stdout ?? ''}${failed.stderr ?? ''}` };
    }
  }

  // git 對「物件不存在」與「repo 不可用」都回 status 128；若不靠 stderr 區分，
  // 環境失敗會被誤讀成「檔案不存在」而讓整道守門靜默跳過 exit 0。
  it('git 不可執行（PATH 無 git）時 fail-closed', () => {
    const repo = setupRepo();
    const isolated = mkdtempSync(join(tmpdir(), 'verify-002-nogit-'));
    repos.push(isolated);
    mkdirSync(join(isolated, 'bin'));
    symlinkSync(process.execPath, join(isolated, 'bin', 'node'));

    const { status, output } = runIsolated(repo, { ...GIT_ENV, PATH: join(isolated, 'bin') });
    expect(status).toBe(1);
    expect(output).toContain('執行期例外');
  });

  it('git 存在但永遠失敗（壞 stub，status=1）時 fail-closed', () => {
    const repo = setupRepo();
    const isolated = mkdtempSync(join(tmpdir(), 'verify-002-stub-'));
    repos.push(isolated);
    mkdirSync(join(isolated, 'bin'));
    symlinkSync(process.execPath, join(isolated, 'bin', 'node'));
    writeFileSync(join(isolated, 'bin', 'git'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });

    const { status, output } = runIsolated(repo, { ...GIT_ENV, PATH: join(isolated, 'bin') });
    expect(status).toBe(1);
    expect(output).toContain('執行期例外');
  });

  it('GIT_DIR 指向無效路徑（not a git repository）時 fail-closed', () => {
    const repo = setupRepo();
    const { status, output } = runIsolated(repo, {
      ...GIT_ENV,
      GIT_DIR: join(tmpdir(), 'verify-002-no-such-git-dir'),
    });
    expect(status).toBe(1);
    expect(output).toContain('not a git repository');
  });

  it('.git 不可讀（權限）時 fail-closed', () => {
    const repo = setupRepo();
    chmodSync(join(repo, '.git'), 0o000);
    try {
      const { status, output } = runIsolated(repo, GIT_ENV);
      expect(status).toBe(1);
      expect(output).toContain('not a git repository');
    } finally {
      // 還原權限，否則 afterEach 的 rmSync 清不掉臨時 repo。
      chmodSync(join(repo, '.git'), 0o755);
    }
  });

  // stderr 文字判別依賴英文輸出，而 git 內建 gettext 翻譯會跟隨呼叫端 locale。
  // 這條是 CI 上真正有效的回歸鎖：新增第五處 git 呼叫時若忘了帶 env 就會紅。
  // 舊版逐一檢查每個呼叫點是否帶 env，是字串偵測、可用雙引號／spawnSync／間接呼叫繞過。
  // 改為結構收斂：全檔只允許一個子行程呼叫點，且必須在帶 GIT_ENV 的 git() wrapper 內，
  // 讓「忘記帶 env」不可能發生而非事後偵測。
  // 字串偵測可被 `import { execFileSync as run }`、`cp['execFileSync'](` 繞過，
  // 故改走 AST：先限制 child_process 的匯入形式，再確認所有呼叫都落在 git() wrapper 內。
  it('git 子行程呼叫必須收斂在唯一帶 GIT_ENV 的 wrapper（AST 級）', () => {
    const source = readFileSync(SCRIPT_PATH, 'utf-8');
    expect(source).toContain("const GIT_ENV = { ...process.env, LC_ALL: 'C', LANGUAGE: 'C' }");

    const sourceFile = ts.createSourceFile(
      'verify-002-log.mjs',
      source,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS,
    );

    // 1) child_process 只能具名且未改名匯入；namespace／default 匯入一律禁止——
    //    `cp['execFileSync'](…)` 這類存取無法靠名稱追蹤。
    const boundNames = new Set<string>();
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (!/^(node:)?child_process$/.test(statement.moduleSpecifier.text)) continue;

      expect(statement.importClause?.name).toBeUndefined();
      const bindings = statement.importClause?.namedBindings;
      expect(bindings !== undefined && ts.isNamedImports(bindings)).toBe(true);
      for (const element of (bindings as ts.NamedImports).elements) {
        expect(element.propertyName).toBeUndefined();
        boundNames.add(element.name.text);
      }
    }
    expect([...boundNames]).toEqual(['execFileSync']);

    // 2) git() wrapper 的範圍。
    const wrapper = sourceFile.statements.find(
      (statement): statement is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === 'git',
    );
    expect(wrapper).toBeDefined();

    // 3) 所有對該綁定的呼叫都必須落在 wrapper 內。
    const outside: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (boundNames.has(node.expression.text)) {
          const inWrapper = node.pos >= wrapper!.pos && node.end <= wrapper!.end;
          if (!inWrapper) outside.push(source.slice(node.pos, node.end).trim().slice(0, 60));
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    expect(outside).toEqual([]);

    expect(source.slice(wrapper!.pos, wrapper!.end)).toContain('env: GIT_ENV');
  });

  // 訊息比對曾連續三次失敗（漏訊息、依賴英文、又漏一種）；改用 ls-files／ls-tree 後
  // 「不存在」是 exit 0 的空輸出而非例外，不得再退回比對 git 的 fatal 訊息。
  // 禁的是「cat-file -e ＋ fatal 訊息比對」這條路徑；`cat-file --batch-check` 的
  // 結構化輸出（object store 探測）是合法用途，不在禁止之列。
  it('存在性判定不得依賴 git 的 fatal 訊息比對', () => {
    const source = readFileSync(SCRIPT_PATH, 'utf-8');
    expect(source).toContain("git(['ls-files'");
    expect(source).toContain("git(['ls-tree'");
    // 只看可執行行：註解會提到 cat-file -e 等字樣作為「不採用」的反面說明。
    const code = source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*'))
      .join('\n');
    for (const forbidden of [
      "'cat-file', '-e'",
      'cat-file -e',
      'does not exist',
      'invalid object name',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });

  // 行為對照：在有 git 翻譯的機器上這是真測試；沒有翻譯的環境 git 本來就輸出英文，
  // 測試不會誤紅也不會提供額外保證，故與上面的結構鎖搭配使用。
  const TRANSLATED_LOCALE = { LC_ALL: 'zh_CN.UTF-8', LANGUAGE: 'zh_CN' };

  it('非英文 locale 下「尚無 commit」仍正確跳過（不得誤擋初始 commit）', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-locale-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
        entries: [{ id: 'reward-first-entry' }],
      }),
    );
    git(repo, 'add', '--all');

    const { status, output } = runIsolated(repo, { ...GIT_ENV, ...TRANSLATED_LOCALE });
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('非英文 locale 下 staged 刪除仍必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', '--cached', LOG_PATH);
    const { status, output } = runIsolated(repo, { ...GIT_ENV, ...TRANSLATED_LOCALE });
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  // 已有 commit 的 repo 首次引入 002：工作區與 index 有檔、HEAD／基準 tree 無檔。
  // `cat-file -e` 對此回「exists on disk, but not in '<ref>'」，與 index 版訊息不同，
  // 是訊息比對法漏掉的第五種；改用 ls-tree 後直接是 exit 0 空輸出。
  it('pre-commit：repo 已有 commit、首次加入 002 應放行', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-first-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    writeFileSync(join(repo, 'other.txt'), 'x');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'init');

    // 002 只在工作區與 index，不在 HEAD。
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
        entries: [{ id: 'reward-first-entry' }],
      }),
    );
    git(repo, 'add', '--all');

    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('--base-ref：PR 首次加入 002（基準 tree 無檔、工作區有檔）應放行', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-first-ci-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    writeFileSync(join(repo, 'other.txt'), 'x');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'init');
    git(repo, 'checkout', '-b', 'pr');

    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
        entries: [{ id: 'reward-first-entry' }],
      }),
      'introduce 002',
    );

    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  // `git checkout --orphan` 之後 HEAD 指向尚未存在的分支，`rev-parse --verify` 失敗，
  // 但 repo 的歷史 commit 都還在。若把它當成「無基準版」，刪除防護與總分鏈整個跳過——
  // 標準 Git 指令即可觸發，不需劫持環境。
  it('orphan HEAD 下掏空 002 必紅（不得誤判為無基準版）', () => {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'penalty-must-survive' }, { id: 'reward-existing-entry' }],
      }),
      'baseline',
    );
    git(repo, 'checkout', '--orphan', 'evil');
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-clean-slate' }],
      }),
    );
    git(repo, 'add', '--all');

    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可視為無基準版');
  });

  // 更深的繞法：orphan 之後把 named refs 全刪（branch -D＋清 packed-refs），
  // `rev-list --all` 為空但歷史 commit 物件仍在。判準必須逐層兜底：
  // reflog（--reflog）接第一層，reflog 也被 expire 時 object store 接第二層。
  function setupRefsWipedOrphan() {
    const repo = setupRepo();
    commitLog(
      repo,
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+170',
        entries: [{ id: 'penalty-must-survive' }, { id: 'reward-existing-entry' }],
      }),
      'baseline',
    );
    git(repo, 'checkout', '--orphan', 'evil');
    git(repo, 'branch', '-D', 'main');
    git(repo, 'branch', '-D', 'pr');
    rmSync(join(repo, '.git', 'packed-refs'), { force: true });
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-clean-slate' }],
      }),
    );
    git(repo, 'add', '--all');
    return repo;
  }

  it('orphan＋刪光 named refs 後掏空 002 仍必紅（reflog 探測）', () => {
    const repo = setupRefsWipedOrphan();
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可視為無基準版');
  });

  it('orphan＋刪光 named refs＋expire reflog 後掏空 002 仍必紅（object store 探測）', () => {
    const repo = setupRefsWipedOrphan();
    git(repo, 'reflog', 'expire', '--expire=now', '--all');
    rmSync(join(repo, '.git', 'logs'), { recursive: true, force: true });
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可視為無基準版');
  });

  it('真正尚無任何 commit 的 repo 仍放行（初始 commit）', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-empty-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    mkdirSync(join(repo, dirname(LOG_PATH)), { recursive: true });
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+1',
        entries: [{ id: 'reward-first-entry' }],
      }),
    );
    git(repo, 'add', '--all');

    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });

  it('--base-commit：基準 commit 無法解析時明確失敗', () => {
    const repo = setupRepo();
    const { status, output } = runGuard(repo, '--base-commit', 'deadbeefdeadbeefdeadbeef');
    expect(status).toBe(1);
    expect(output).toContain('無法解析基準 commit');
  });

  it('刪除 002 檔案的 PR 必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', LOG_PATH);
    git(repo, 'commit', '-m', 'delete log');
    const { status, output } = runGuard(repo, '--base-ref', 'main');
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  // pre-commit 語意讀 index：staged 刪除會讓 `git show :<path>` 取不到內容，
  // 不得與「與 002 無關的 commit」同樣靜默跳過。
  it('pre-commit：staged 刪除 002（git rm --cached）必紅', () => {
    const repo = setupRepo();
    git(repo, 'rm', '--cached', LOG_PATH);
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  // `git mv` 的 `--name-only` 只列新路徑，舊路徑不出現；腳本層以 index／HEAD 存在性
  // 判定故仍必紅，但 hook 觸發條件不得再依賴 diff 呈現（見「守門觸發面」）。
  it('pre-commit：git mv 改名 002 必紅', () => {
    const repo = setupRepo();
    git(repo, 'mv', LOG_PATH, join(dirname(LOG_PATH), 'renamed.md'));
    const { status, output } = runGuard(repo);
    expect(status).toBe(1);
    expect(output).toContain('不可刪除');
  });

  it('pre-commit：002 不存在於 index 與 HEAD 時跳過', () => {
    const repo = mkdtempSync(join(tmpdir(), 'verify-002-'));
    repos.push(repo);
    git(repo, 'init', '-b', 'main');
    writeFileSync(join(repo, 'other.txt'), 'unrelated');
    git(repo, 'add', '--all');
    git(repo, 'commit', '-m', 'no log file');
    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('跳過');
  });

  // 以 symlink 路徑呼叫時，argv[1] 與 import.meta.url 的字面路徑不等（macOS 的 /tmp
  // 即為 /private/tmp 的 symlink）；未解析 realpath 會讓 main() 不執行卻 exit 0。
  it('經 symlink 路徑呼叫仍執行 main（不得靜默 exit 0）', () => {
    const repo = setupRepo();
    const holder = mkdtempSync(join(tmpdir(), 'verify-002-link-'));
    repos.push(holder);
    mkdirSync(join(holder, 'real'));
    copyFileSync(SCRIPT_PATH, join(holder, 'real', 'guard.mjs'));
    symlinkSync(join(holder, 'real'), join(holder, 'link'), 'dir');

    const { status, output } = runScript(repo, join(holder, 'link', 'guard.mjs'));
    expect(status).toBe(0);
    // 靜默不執行時 stdout 為空；有輸出才證明 main() 真的跑了。
    expect(output).toContain('002 記分守門');
  });

  it('pre-commit：正確 append 綠燈', () => {
    const repo = setupRepo();
    writeFileSync(
      join(repo, LOG_PATH),
      buildLog({
        header: '> 本次分數變化：+1（reward 1、penalty 0、neutral 0）｜累計總分：+171',
        entries: [{ id: 'reward-new-entry' }, { id: 'reward-existing-entry' }],
      }),
    );
    git(repo, 'add', '--all');
    const { status, output } = runGuard(repo);
    expect(status).toBe(0);
    expect(output).toContain('通過');
  });
});

// 守門的兩個「觸發面」——hook 條件與 CI 條件——是實際的破口所在：
// 腳本層判定正確不代表會被叫起來。這組鎖住觸發條件本身。
describe('守門觸發面（hook 條件與 CI 條件）', () => {
  const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const read = (relative: string) => readFileSync(join(REPO_ROOT, relative), 'utf-8');

  it('pre-commit 第 6 步無條件執行守門，不得以 git diff 判斷觸發', () => {
    const hook = read('.husky/pre-commit');
    const markerIndex = hook.indexOf('# 6. 002 記分守門');
    expect(markerIndex).toBeGreaterThan(-1);

    // 只看可執行行；註解本身會提到 git diff 作為反面說明。
    const step = hook
      .slice(markerIndex)
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
    expect(step).toContain('node scripts/verify-002-log.mjs');
    // `git mv` 的 --name-only 只列新路徑，任何 diff-based 觸發條件都會被它繞過。
    expect(step).not.toContain('git diff');
  });

  // `isDirectRun` 的 realpathSync 失敗只在 argv[1] 於載入後失效時發生，執行期無法穩定構造
  // （node 必須先讀到該檔才能執行），故以結構鎖取代行為測試：一旦有人把 catch 加回去，
  // 判不出直跑時就會靜默不執行 main() 而 exit 0（假成功）。
  it('isDirectRun 不得吞掉 realpath 例外', () => {
    const source = read('scripts/verify-002-log.mjs');
    const start = source.indexOf('function isDirectRun()');
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, source.indexOf('\n}', start));
    expect(body).toContain('realpathSync');
    expect(body).not.toContain('catch');
  });

  // 本 PR 內發生過四次「文件／註解與實作漂移」，每次都是靠人記得去掃某個檔案。
  // 這裡把它變成機械檢查：固定範圍 × 固定的已被取代措辭清單，任一命中即紅。
  // 新增／改寫守門行為時，把被取代的舊措辭加進這張表，範圍有新檔案就加進清單。
  const GATE_FILES = [
    'scripts/verify-002-log.mjs',
    'scripts/__tests__/verify-002-log.test.ts',
    '.husky/pre-commit',
    '.github/workflows/ci.yml',
    'AGENTS.md',
    'CLAUDE.md',
  ];
  // 改用 regex 而非字面字串：實測發現同一個主張只要在兩個關鍵詞之間插入不同修飾語，
  // 字面比對就會漏接。改以主張的關鍵骨架比對，可涵蓋自然改寫。
  //
  // 但要誠實看待這個鎖的能力邊界：它只擋得住「已知的舊主張」，擋不住全新的錯誤敘述，
  // 而放寬到能涵蓋所有改寫就會誤傷「刻意描述被否決做法」的正確文字（本守門的註解就
  // 大量這樣寫）。真正的防線是鎖住行為的結構測試（例如下方「不得依賴 fatal 訊息比對」
  // 與 AST 級 wrapper 鎖）；這份清單是補漏用的衛生檢查，不是漂移偵測器。
  const SUPERSEDED_PATTERNS = [
    /約 50ms/, // 開銷已改為相對比較，不記具體數字
    /p50 約 120/, // 同上
    /毫秒級/, // 同上
    /基準版無法解析時跳過/, // 已改 fail-closed
    /不依賴解析是否成功/, // 基準版可解析時只採解析結果
    /僅 002 檔變更時/, // hook 已改無條件執行
    /AGT-LOG-04/, // 殘餘風險已移出控制矩陣、取消編號
    /窮舉[^，。\n]{0,12}(四種|訊息)/, // 存在性判定已改結構化探測
    /(必須|判別[^，。\n]{0,8})靠\s*stderr/, // 同上：不再以 stderr 文字判別
    /rev-parse 失敗只可能是/, // orphan HEAD 下此宣稱為假
  ];

  // 本檔自身也在掃描範圍內，故需剔除上面那份清單的字面值，否則必然自我命中。
  const stripChecklist = (source: string) => {
    const start = source.indexOf('const SUPERSEDED_PATTERNS');
    if (start === -1) return source;
    return source.slice(0, start) + source.slice(source.indexOf('];', start));
  };

  it.each(GATE_FILES)('%s 不得殘留已被取代的措辭', (file) => {
    const source = stripChecklist(read(file));
    const hits = SUPERSEDED_PATTERNS.filter((pattern) => pattern.test(source)).map(String);
    expect(hits).toEqual([]);
  });

  it('ci.yml 對 pull_request 與 main push 都掛守門，且置於 install 之前', () => {
    const workflow = read('.github/workflows/ci.yml');
    const prStep = workflow.indexOf('--base-ref "${{ github.event.pull_request.base.sha }}"');
    const pushStep = workflow.indexOf('--base-commit "${{ github.event.before }}"');
    const install = workflow.indexOf('pnpm install --frozen-lockfile');

    expect(prStep).toBeGreaterThan(-1);
    expect(pushStep).toBeGreaterThan(-1);
    // 零 npm 依賴，必須搶在 install 前紅燈。
    expect(prStep).toBeLessThan(install);
    expect(pushStep).toBeLessThan(install);
    expect(workflow).toContain("if: github.event_name == 'pull_request'");
    expect(workflow).toContain("github.event_name == 'push'");
    // push 必須用 --base-commit：--base-ref 會取 merge-base，force push 時驗不出被改寫的條目。
    expect(workflow).not.toContain('--base-ref "${{ github.event.before }}"');
    // 分支初建／force push 後 before 為全零，須跳過而非誤紅。
    expect(workflow).toContain("github.event.before != '0000000000000000000000000000000000000000'");
  });
});
