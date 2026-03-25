type Operator = '+' | '-' | '*' | '/' | 'u-' | '%';

const PRECEDENCE: Record<Operator, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  'u-': 3,
  '%': 4,
};

function isOperator(token: string): token is Operator {
  return (
    token === '+' ||
    token === '-' ||
    token === '*' ||
    token === '/' ||
    token === 'u-' ||
    token === '%'
  );
}

function tokenize(input: string): string[] {
  const s = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  const tokens: string[] = [];

  let i = 0;
  while (i < s.length) {
    const ch = s.charAt(i);

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i + 1;
      while (j < s.length) {
        const c = s.charAt(j);
        if ((c >= '0' && c <= '9') || c === '.') j += 1;
        else break;
      }
      tokens.push(s.slice(i, j));
      i = j;
      continue;
    }

    if (
      ch === '+' ||
      ch === '-' ||
      ch === '*' ||
      ch === '/' ||
      ch === '(' ||
      ch === ')' ||
      ch === '%'
    ) {
      tokens.push(ch);
      i += 1;
      continue;
    }

    // 不接受任何其他字元
    return [];
  }

  return tokens;
}

function toRpn(tokens: string[]): string[] {
  const output: string[] = [];
  const ops: string[] = [];

  let prev: string | null = null;

  for (const token of tokens) {
    if (token === '') return [];

    const isNumber = !Number.isNaN(Number(token));
    if (isNumber) {
      output.push(token);
      prev = token;
      continue;
    }

    if (token === '(') {
      ops.push(token);
      prev = token;
      continue;
    }

    if (token === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        const popped = ops.pop();
        if (!popped) return [];
        output.push(popped);
      }
      if (ops.pop() !== '(') return [];
      prev = token;
      continue;
    }

    // operator
    let op: Operator | null = null;
    if (token === '-') {
      const isUnary =
        prev === null || (prev !== ')' && !Number.isNaN(Number(prev)) === false && prev !== '%');
      op = isUnary ? 'u-' : '-';
    } else if (token === '+') {
      // 一元 + 直接忽略
      const isUnary =
        prev === null || (prev !== ')' && !Number.isNaN(Number(prev)) === false && prev !== '%');
      if (isUnary) {
        prev = token;
        continue;
      }
      op = '+';
    } else if (token === '*') op = '*';
    else if (token === '/') op = '/';
    else if (token === '%') op = '%';

    if (!op) return [];

    while (ops.length > 0) {
      const top = ops[ops.length - 1];
      if (!top) break;
      if (!isOperator(top)) break;
      if (PRECEDENCE[top] >= PRECEDENCE[op]) {
        const popped = ops.pop();
        if (!popped) return [];
        output.push(popped);
      } else break;
    }

    ops.push(op);
    prev = token;
  }

  while (ops.length > 0) {
    const op = ops.pop();
    if (!op) return [];
    if (op === '(' || op === ')') return [];
    output.push(op);
  }

  return output;
}

export function evaluateExpression(expr: string): number {
  if (!expr.trim()) return 0;
  if (expr.length > 200) return 0;

  const tokens = tokenize(expr);
  if (tokens.length === 0) return 0;

  const rpn = toRpn(tokens);
  if (rpn.length === 0) return 0;

  const stack: number[] = [];
  for (const token of rpn) {
    if (!isOperator(token)) {
      const n = Number(token);
      if (Number.isNaN(n)) return 0;
      stack.push(n);
      continue;
    }

    if (token === 'u-') {
      const a = stack.pop();
      if (a === undefined) return 0;
      stack.push(-a);
      continue;
    }

    if (token === '%') {
      const a = stack.pop();
      if (a === undefined) return 0;
      stack.push(a / 100);
      continue;
    }

    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) return 0;

    let res = 0;
    if (token === '+') res = a + b;
    else if (token === '-') res = a - b;
    else if (token === '*') res = a * b;
    else if (token === '/') res = b === 0 ? 0 : a / b;

    if (!Number.isFinite(res)) return 0;
    stack.push(res);
  }

  const result = stack.pop() ?? 0;
  return Number.isFinite(result) ? result : 0;
}
