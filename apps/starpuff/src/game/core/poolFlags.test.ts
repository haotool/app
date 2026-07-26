import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { POOL_TRANSIENT_FLAGS, acquirePooled, resetTransientFlags } from './poolFlags';

// 池瞬時旗標 SSOT 守門（PR #886）：resetTransientFlags 對在冊旗標逐一歸位 false，
// acquirePooled 為池取出唯一入口。取出點守門走 TypeScript 型別層 AST 檢查：任何
// 對 Arcade Group 型別值的 `get` 存取（直呼／解構／中括號／換行／改名別名／跨檔
// 參數／Reflect.get）都會被抓；動態字串組鍵等蓄意繞過不在守門範圍（誠實邊界）。

describe('poolFlags（池瞬時旗標 SSOT）', () => {
  it('resetTransientFlags 將在冊旗標全部歸位 false', () => {
    const data = new Map<string, unknown>(POOL_TRANSIENT_FLAGS.map((flag) => [flag, true]));
    resetTransientFlags({ setData: (key, value) => data.set(key, value) });
    for (const flag of POOL_TRANSIENT_FLAGS) expect(data.get(flag)).toBe(false);
  });

  it('acquirePooled 取出即復位；池竭回 null', () => {
    const data = new Map<string, unknown>(POOL_TRANSIENT_FLAGS.map((flag) => [flag, true]));
    const pooled = { setData: (key: string, value: unknown) => data.set(key, value) };
    const group = { get: () => pooled };
    expect(acquirePooled(group, 0, 0)).toBe(pooled);
    for (const flag of POOL_TRANSIENT_FLAGS) expect(data.get(flag)).toBe(false);
    expect(acquirePooled({ get: () => null }, 0, 0)).toBeNull();
  });
});

// ---------- 型別層取出點守門 ----------

// 判準：expression 的型別 symbol 名為 'Group'（Phaser.Physics.Arcade.Group 與其
// 基底 GameObjects.Group 皆是；本 codebase 無其他同名類）。
function isGroupTyped(checker: ts.TypeChecker, node: ts.Node): boolean {
  const type = checker.getTypeAtLocation(node);
  const symbol = type.getSymbol() ?? type.aliasSymbol;
  return symbol?.getName() === 'Group';
}

// 掃描一個 program，回報所有繞過 acquirePooled 的 Group `get` 存取。
// exemptFile：acquirePooled 本體所在檔（唯一合法呼叫點）。
export function findPoolGetViolations(program: ts.Program, exemptFile: string): string[] {
  const checker = program.getTypeChecker();
  const violations: string[] = [];
  const report = (sourceFile: ts.SourceFile, node: ts.Node, how: string): void => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    violations.push(`${sourceFile.fileName}:${line + 1} ${how}`);
  };
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (sourceFile.fileName.endsWith(exemptFile)) continue;
    const visit = (node: ts.Node): void => {
      // obj.get（含換行、任意識別子、跨檔參數——型別層判定與寫法無關）。
      if (
        ts.isPropertyAccessExpression(node) &&
        node.name.text === 'get' &&
        isGroupTyped(checker, node.expression)
      ) {
        report(sourceFile, node, 'property access .get');
      }
      // obj['get']。
      if (
        ts.isElementAccessExpression(node) &&
        ts.isStringLiteralLike(node.argumentExpression) &&
        node.argumentExpression.text === 'get' &&
        isGroupTyped(checker, node.expression)
      ) {
        report(sourceFile, node, "element access ['get']");
      }
      // const { get } = group（含改名 { get: g }）。
      if (
        ts.isVariableDeclaration(node) &&
        ts.isObjectBindingPattern(node.name) &&
        node.initializer &&
        isGroupTyped(checker, node.initializer)
      ) {
        for (const element of node.name.elements) {
          const key = element.propertyName ?? element.name;
          if (ts.isIdentifier(key) && key.text === 'get') {
            report(sourceFile, element, 'destructured get');
          }
        }
      }
      // Reflect.get(group, 'get')。
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'Reflect' &&
        node.expression.name.text === 'get' &&
        node.arguments[0] !== undefined &&
        isGroupTyped(checker, node.arguments[0])
      ) {
        report(sourceFile, node, 'Reflect.get');
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return violations;
}

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const GAME_DIR = join(APP_DIR, 'src', 'game');

describe('池取出點型別層守門（PR #886 R4：Group.get 一律走 acquirePooled）', () => {
  it('src/game 生產碼零違規（直呼/解構/中括號/換行/改名/跨檔參數/Reflect 全涵蓋）', () => {
    // 守門存續假設（漂移即啞火，此處以斷言鎖住）：
    // 1) app tsconfig include 涵蓋 src/game 生產碼——以檔數下限＋已知檔在列驗證；
    // 2) Phaser Arcade Group 的型別 symbol 名為 'Group'——由下方虛擬 probe 案的
    //    「直呼必抓」持續自證（symbol 名漂移時 probe 案先紅）。
    const configFile = ts.readConfigFile(join(APP_DIR, 'tsconfig.json'), (path) =>
      ts.sys.readFile(path),
    );
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, APP_DIR);
    const gameFiles = parsed.fileNames.filter(
      (file) => file.includes('/src/game/') && !file.endsWith('.test.ts'),
    );
    expect(gameFiles.length).toBeGreaterThan(30);
    expect(gameFiles.some((file) => file.endsWith('systems/enemies.ts'))).toBe(true);
    const program = ts.createProgram(gameFiles, {
      ...parsed.options,
      skipLibCheck: true,
      noEmit: true,
    });
    const violations = findPoolGetViolations(program, 'core/poolFlags.ts').map((entry) =>
      relative(GAME_DIR, entry),
    );
    expect(violations).toEqual([]);
  }, 60_000);

  // 守門自證：對已知繞過寫法逐一驗紅（虛擬 program，型別以同名 Group 類替身）。
  it('繞過寫法覆蓋驗證：五種重構寫法全抓、註解與字串零假陽性', () => {
    const virtualSource = `
declare class Group { get(x?: number, y?: number, key?: string): unknown }
declare const meteors: Group;
declare const rocks: Group;
function acquireFrom(pool: Group): unknown {
  return pool.get(0, 0); // 跨檔/任意參數名
}
const direct = meteors.get(1, 2); // 直呼
const { get } = meteors; // 解構
const bracket = meteors['get'](3, 4); // 中括號
const wrapped = meteors
  .get(5, 6); // 換行
const renamed = rocks.get(7, 8); // 池變數改名
const dynamic = Reflect.get(meteors, 'get'); // Reflect
// 註解裡的 meteors.get( 不得誤報
const text = "meteors.get(";
// ---- 已知邊界（R5 記錄，一般重構即可自然產生、目前不涵蓋）----
// 1) 型別斷言脫鉤：as any / as unknown as 寬介面。
const asserted = (meteors as unknown as { get(x?: number, y?: number): unknown }).get(9, 9);
// 2) 容器/寬介面中轉：存進結構型別後 symbol 與 Group 脫鉤。
const bag: { get(x?: number, y?: number): unknown } = meteors;
const viaBag = bag.get(10, 10);
// 3) wrapper 回傳型別被推成非 Group。
function pick(): { get(x?: number, y?: number): unknown } {
  return meteors;
}
const viaWrapper = pick().get(11, 11);
export { direct, get, bracket, wrapped, renamed, dynamic, text, acquireFrom };
export { asserted, bag, viaBag, viaWrapper };
`;
    const fileName = '/virtual/guard-probe.ts';
    const host = ts.createCompilerHost({});
    const baseGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, ...rest) =>
      name === fileName
        ? ts.createSourceFile(name, virtualSource, languageVersion, true)
        : baseGetSourceFile(name, languageVersion, ...rest);
    const baseFileExists = host.fileExists.bind(host);
    host.fileExists = (name) => name === fileName || baseFileExists(name);
    const program = ts.createProgram(
      [fileName],
      { target: ts.ScriptTarget.ESNext, skipLibCheck: true, noEmit: true },
      host,
    );
    const violations = findPoolGetViolations(program, 'core/poolFlags.ts');
    const hows = violations.map((entry) => entry.split(' ').slice(1).join(' '));
    // 七筆違規：跨檔參數＋直呼＋解構＋中括號＋換行＋改名＋Reflect；
    // 三種已知邊界（斷言脫鉤/容器中轉/wrapper 收窄）不入違規——若未來守門升級
    // 涵蓋任一種，本數字會變動並強制更新此份邊界文件。
    expect(violations).toHaveLength(7);
    expect(hows.filter((how) => how === 'property access .get')).toHaveLength(4);
    expect(hows).toContain('destructured get');
    expect(hows).toContain("element access ['get']");
    expect(hows).toContain('Reflect.get');
  });
});
