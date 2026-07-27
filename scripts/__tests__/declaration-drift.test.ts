// 宣告檔漂移守門（#903）：scripts/tsconfig.json 只 include **/*.ts，tsc 僅驗
// 「呼叫端 vs 手寫宣告」，從不驗「宣告 vs 實作」——實作改 export 名稱或簽章時
// typecheck 仍 0 錯誤（#901 審查實測坐實）。本檔以結構比對補上守門：
// 1) export 名單雙向一致（宣告缺漏或實作偷加皆紅）；
// 2) 函式必填參數數（arity）一致（fn.length vs 宣告非可選參數數）。
// 維護契約：新增 scripts 手寫宣告檔（.d.ts/.d.mts）時必須同步登記 MODULES 表；
// 深層回傳物件欄位漂移不在本檔守備範圍，由各模組行為測試承擔。
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as fetchMoneyboxRates from '../fetch-moneybox-rates.js';
import * as fetchTaiwanBankRates from '../fetch-taiwan-bank-rates.js';
import * as lighthouseDrift from '../lighthouse-drift.mjs';
import * as monitorScheduleDrift from '../monitor-schedule-drift.mjs';
import * as verify002Log from '../verify-002-log.mjs';
import * as verifyProductionResources from '../verify-production-resources.mjs';

const MODULES = [
  { declaration: '../fetch-moneybox-rates.d.ts', runtime: fetchMoneyboxRates },
  { declaration: '../fetch-taiwan-bank-rates.d.ts', runtime: fetchTaiwanBankRates },
  { declaration: '../lighthouse-drift.d.mts', runtime: lighthouseDrift },
  { declaration: '../monitor-schedule-drift.d.mts', runtime: monitorScheduleDrift },
  { declaration: '../verify-002-log.d.mts', runtime: verify002Log },
  { declaration: '../verify-production-resources.d.mts', runtime: verifyProductionResources },
] as const;

interface DeclaredValueExports {
  // 具 runtime 存在性的 export 名單（function + const）；interface/type 為型別專屬故排除。
  names: Set<string>;
  // 函式名 → 必填參數數（第一個可選或 rest 參數之前的參數數，對齊 fn.length 語意）。
  functionArity: Map<string, number>;
}

function parseDeclaredValueExports(declarationRelativePath: string): DeclaredValueExports {
  const url = new URL(declarationRelativePath, import.meta.url);
  const source = ts.createSourceFile(
    declarationRelativePath,
    readFileSync(url, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = new Set<string>();
  const functionArity = new Map<string, number>();
  for (const statement of source.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    if (!modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const firstOptional = statement.parameters.findIndex(
        (parameter) =>
          parameter.questionToken !== undefined || parameter.dotDotDotToken !== undefined,
      );
      names.add(statement.name.text);
      functionArity.set(
        statement.name.text,
        firstOptional === -1 ? statement.parameters.length : firstOptional,
      );
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
  }
  return { names, functionArity };
}

describe('scripts 宣告檔 ↔ 實作無漂移（#903）', () => {
  for (const { declaration, runtime } of MODULES) {
    // 顯示名去除固定 '../' 前綴：MODULES 為常數字面值非外部輸入，用 slice 而非
    // replace 以避開 CodeQL js/incomplete-sanitization 對 replace 首匹配語意的誤判。
    describe(declaration.slice('../'.length), () => {
      const declared = parseDeclaredValueExports(declaration);
      const runtimeExports = runtime as Record<string, unknown>;

      it('export 名單雙向一致（改名、刪除、未登記新增皆必紅）', () => {
        // ESM namespace 無 default 時 filter 為 no-op；防未來 CJS interop 噪音。
        const runtimeNames = Object.keys(runtimeExports)
          .filter((name) => name !== 'default')
          .sort();
        expect(runtimeNames).toEqual([...declared.names].sort());
      });

      it('函式必填參數數與宣告一致（簽章 arity 漂移必紅）', () => {
        for (const [name, requiredParams] of declared.functionArity) {
          const value = runtimeExports[name];
          expect(typeof value, `${name} 宣告為 function`).toBe('function');
          expect(
            (value as (...args: unknown[]) => unknown).length,
            `${name} 必填參數數（fn.length）`,
          ).toBe(requiredParams);
        }
      });
    });
  }
});
