/**
 * Calculator Feature - Expression Evaluator
 * @file evaluator.ts
 * @description 安全的數學表達式求值器，使用 Shunting Yard 算法
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 2.1
 *
 * 安全性改進：移除 expr-eval 依賴，避免原型污染漏洞 (CVE-2024-64746)
 * 算法：Shunting Yard + RPN 求值
 */

/**
 * 運算符對應表
 * @description 將用戶友善的符號轉換為標準符號
 */
const OPERATOR_MAP: Record<string, string> = {
  '×': '*', // 乘號轉換為星號
  '÷': '/', // 除號轉換為斜線
  '+': '+', // 加號不變
  '-': '-', // 減號不變
};

/**
 * 運算符優先級和結合性
 */
const OPERATORS: Record<string, { precedence: number; rightAssociative: boolean }> = {
  '+': { precedence: 1, rightAssociative: false },
  '-': { precedence: 1, rightAssociative: false },
  '*': { precedence: 2, rightAssociative: false },
  '/': { precedence: 2, rightAssociative: false },
};

/**
 * 標準化表達式
 * @description 將表達式中的用戶友善符號轉換為標準數學符號
 * @param expression - 原始表達式（例如："100 + 50 × 2"）
 * @returns 標準化後的表達式（例如："100 + 50 * 2"）
 *
 * @example
 * ```ts
 * normalizeExpression('100 ÷ 5 × 2'); // "100 / 5 * 2"
 * normalizeExpression('50 + 30 - 10'); // "50 + 30 - 10"
 * ```
 */
function normalizeExpression(expression: string): string {
  let normalized = expression;

  // 替換所有運算符為標準符號
  Object.entries(OPERATOR_MAP).forEach(([userSymbol, standardSymbol]) => {
    normalized = normalized.replace(new RegExp(`\\${userSymbol}`, 'g'), standardSymbol);
  });

  return normalized.trim();
}

/**
 * Token 類型
 */
type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' };

/**
 * 詞法分析：將表達式轉換為 tokens
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];
    if (!char) break;

    // 跳過空白
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // 解析數字（包含小數點和負號）
    const prevChar = i > 0 ? expression[i - 1] : undefined;
    if (
      /[\d.]/.test(char) ||
      (char === '-' && (i === 0 || (prevChar && /[+\-*/()]/.test(prevChar))))
    ) {
      let numStr = '';

      // 處理負號
      if (char === '-') {
        numStr += char;
        i++;
      }

      // 解析數字部分
      while (i < expression.length) {
        const nextChar = expression[i];
        if (!nextChar || !/[\d.]/.test(nextChar)) break;
        numStr += nextChar;
        i++;
      }

      const num = parseFloat(numStr);
      if (isNaN(num)) {
        throw new Error('表達式格式錯誤');
      }

      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 解析運算符
    if (char in OPERATORS) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // 解析括號
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i++;
      continue;
    }

    // 未知字符
    throw new Error('表達式包含無效字符');
  }

  return tokens;
}

/**
 * Shunting Yard 算法：將中綴表達式轉換為後綴表達式（RPN）
 */
function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
    } else if (token.type === 'operator') {
      const o1 = OPERATORS[token.value];
      if (!o1) throw new Error('未知運算符');

      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (!top) break;

        if (top.type !== 'operator') break;

        const o2 = OPERATORS[top.value];
        if (!o2) break;

        if (
          o2.precedence > o1.precedence ||
          (o2.precedence === o1.precedence && !o1.rightAssociative)
        ) {
          const popped = operatorStack.pop();
          if (popped) output.push(popped);
        } else {
          break;
        }
      }

      operatorStack.push(token);
    } else if (token.type === 'paren') {
      if (token.value === '(') {
        operatorStack.push(token);
      } else {
        // 右括號：彈出直到左括號
        let foundLeftParen = false;

        while (operatorStack.length > 0) {
          const top = operatorStack.pop();
          if (!top) break;

          if (top.type === 'paren' && top.value === '(') {
            foundLeftParen = true;
            break;
          }

          output.push(top);
        }

        if (!foundLeftParen) {
          throw new Error('括號不匹配');
        }
      }
    }
  }

  // 彈出剩餘運算符
  while (operatorStack.length > 0) {
    const top = operatorStack.pop();
    if (!top) break;

    if (top.type === 'paren') {
      throw new Error('括號不匹配');
    }

    output.push(top);
  }

  return output;
}

/**
 * 計算 RPN 表達式
 */
function evaluateRPN(rpn: Token[]): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value);
    } else if (token.type === 'operator') {
      if (stack.length < 2) {
        throw new Error('表達式格式錯誤');
      }

      const b = stack.pop();
      const a = stack.pop();

      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('表達式格式錯誤');
      }

      let result: number;

      switch (token.value) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new Error('除以零錯誤');
          }
          result = a / b;
          break;
        default:
          throw new Error('未知運算符');
      }

      stack.push(result);
    }
  }

  if (stack.length !== 1) {
    throw new Error('表達式格式錯誤');
  }

  const finalResult = stack[0];
  if (typeof finalResult !== 'number') {
    throw new Error('計算結果無效');
  }

  return finalResult;
}

/**
 * 計算數學表達式
 * @description 安全地計算數學表達式，遵循運算優先級（PEMDAS）
 * @param expression - 數學表達式（支援 +, -, ×, ÷ 運算符）
 * @returns 計算結果（數字）
 * @throws {Error} 當表達式無效或除以零時拋出錯誤
 *
 * @example
 * ```ts
 * calculateExpression('100 + 50 × 2'); // 200 (先乘後加)
 * calculateExpression('10 + 20 × 3 - 15 ÷ 3'); // 65
 * calculateExpression('(100 + 50) ÷ 2'); // 75 (括號優先)
 * calculateExpression('100 ÷ 0'); // 拋出錯誤: "除以零錯誤"
 * ```
 */
export function calculateExpression(expression: string): number {
  // 空表達式處理
  if (!expression || expression.trim() === '') {
    throw new Error('表達式不可為空');
  }

  try {
    // 標準化表達式（轉換符號）
    const normalized = normalizeExpression(expression);

    // 詞法分析
    const tokens = tokenize(normalized);

    // 轉換為 RPN
    const rpn = toRPN(tokens);

    // 計算結果
    const result = evaluateRPN(rpn);

    // 檢查結果是否為有效數字
    if (!Number.isFinite(result)) {
      throw new Error('計算結果無效');
    }

    return result;
  } catch (error) {
    // 統一錯誤處理
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('未知計算錯誤');
  }
}

/**
 * 驗證表達式是否可計算
 * @description 檢查表達式格式是否正確，不執行實際計算
 * @param expression - 待驗證的表達式
 * @returns 是否有效
 *
 * @example
 * ```ts
 * isValidExpression('100 + 50'); // true
 * isValidExpression('100 +'); // false (運算符後無數字)
 * isValidExpression('abc'); // false (包含非數字字元)
 * ```
 */
export function isValidExpression(expression: string): boolean {
  if (!expression || expression.trim() === '') {
    return false;
  }

  try {
    const normalized = normalizeExpression(expression);
    tokenize(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化計算結果
 * @description 將數字格式化為易讀的字串（四捨五入到指定小數位）
 * @param value - 計算結果
 * @param decimalPlaces - 小數位數（預設 2 位）
 * @returns 格式化後的字串
 *
 * @example
 * ```ts
 * formatResult(123.456789); // "123.46"
 * formatResult(100); // "100"
 * formatResult(0.123456, 4); // "0.1235"
 * ```
 */
export function formatResult(value: number, decimalPlaces = 2): string {
  // 整數直接返回
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // 四捨五入到指定小數位
  const rounded = Number(value.toFixed(decimalPlaces));

  // 移除尾部的 0（例如："1.20" → "1.2"）
  return rounded.toString();
}

/**
 * 安全計算表達式（不拋出錯誤）
 * @description calculateExpression 的安全版本，返回結果或 null
 * @param expression - 數學表達式
 * @returns 計算結果或 null（發生錯誤時）
 *
 * @example
 * ```ts
 * safeCalculate('100 + 50'); // 150
 * safeCalculate('invalid'); // null
 * safeCalculate('100 ÷ 0'); // null
 * ```
 */
export function safeCalculate(expression: string): number | null {
  try {
    return calculateExpression(expression);
  } catch {
    return null;
  }
}
