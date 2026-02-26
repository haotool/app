/**
 * Commitlint 規則（由 .example/config/commitlint.config.js 升級移植）
 * - 保留 Conventional Commits
 * - 強化繁體中文提交規範
 * - 保留 bot / release 提交豁免，避免自動化流程被阻塞
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message = '') => message === 'Version Packages',
    (message = '') => /^chore\(release\):\s/i.test(message),
    (message = '') => /^chore\(deps\):\s/i.test(message),
    (message = '') => /^build\(deps\):\s/i.test(message),
  ],
  plugins: [
    {
      rules: {
        'subject-has-cjk': (parsed = {}) => {
          const subject = parsed.subject || '';
          const hasCjk = /[\u3400-\u9FFF]/.test(subject);
          return [hasCjk, '標題需包含中文'];
        },
        'body-bullets': (parsed = {}) => {
          const body = (parsed.body || '').trim();
          if (!body) {
            return [false, '主體需以條列描述變更'];
          }

          const firstLine = body.split('\n').find((line) => line.trim().length > 0) || '';
          return [firstLine.startsWith('- '), '主體需以「- 」條列開頭'];
        },
        'footer-has-test': (parsed = {}) => {
          const content = [parsed.body, parsed.footer].filter(Boolean).join('\n');
          const hasTest = /^測試：.+/m.test(content);
          return [hasTest, '需包含「測試：...」說明'];
        },
        'no-simplified-chars': (parsed = {}) => {
          const content = [parsed.subject, parsed.body, parsed.footer].filter(Boolean).join('\n');
          const simplifiedPattern = /[后发国车书网软设术类项库卫备测显环续并统线开关数为动]/;
          const hasSimplified = simplifiedPattern.test(content);
          return [!hasSimplified, '提交內容需使用繁體中文，請避免簡體字'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-has-cjk': [2, 'always'],
    'type-empty': [2, 'never'],
    'type-case': [2, 'always', 'lower-case'],
    'body-leading-blank': [1, 'always'],
    'body-bullets': [2, 'always'],
    'footer-leading-blank': [1, 'always'],
    'footer-has-test': [2, 'always'],
    'no-simplified-chars': [2, 'always'],
  },
};
