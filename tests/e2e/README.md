# E2E 測試規格

- 使用 Puppeteer MCP 作為驅動。
- 測試檔命名：`<feature>.smoke.spec.ts`。
- 基礎腳本範例（待實作）：

  ```ts
  import { test, expect } from '@playwright/test';

  test('ratewise converts currencies', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await page.fill('[data-testid="from-amount"]', '1000');
    await page.getByTestId('convert').click();
    await expect(page.getByTestId('result')).toBeVisible();
  });
  ```

- CI 需提供 `PUPPETEER_EXECUTABLE_PATH`（由部署環境指定）。
