// Noctra 難度驗收 bot（§54 難度根修）：雙水準（普通/熟練）各 5 場實測 L7 勝率與
// 有效 hit window 佔比。驗證工具（untracked），與 v8 稽核同方法論：週期 grantStar
// 模擬吸彈成功（純標準星 jelly 保底 build、不用變身/混合），操作走真實鍵盤事件。
// 用法：node scripts/noctra-bot-audit.mjs <ordinary|skilled> [runs]
import { chromium, devices } from '@playwright/test';

const PROFILES = {
  ordinary: { reactionMinMs: 250, reactionMaxMs: 400, dodgeSkill: 0.65, grantEveryMs: 2400 },
  skilled: { reactionMinMs: 150, reactionMaxMs: 150, dodgeSkill: 0.9, grantEveryMs: 1500 },
};
const RUN_TIMEOUT_MS = 240_000;
const profileName = process.argv[2] ?? 'ordinary';
const runs = Number(process.argv[3] ?? 5);
const profile = PROFILES[profileName];
if (!profile) throw new Error(`未知 profile：${profileName}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);

async function runFight(browser, index) {
  const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
  const page = await ctx.newPage();
  const sp = (fn, arg) => page.evaluate(fn, arg).catch(() => null);
  try {
    await page.goto('http://localhost:3007/');
    await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
    await page
      .locator('[data-menu="start"]')
      .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
    await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
    await page.evaluate(() => window.__sp.gotoLevel(7));
    await page.waitForFunction(() => window.__sp.stage() === 7, null, { timeout: 15000 });
    // 前室直走（§86 retrofit；不拾增益＝純標準星紀律）→ 入場運鏡完成（血條就緒）。
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 });
    await page.keyboard.up('ArrowRight');
    const maxHp = await page.evaluate(() => window.__sp.bossHp());

    const held = new Set();
    const press = async (key) => {
      if (held.has(key)) return;
      held.add(key);
      await page.keyboard.down(key).catch(() => {});
    };
    const release = async (key) => {
      if (!held.has(key)) return;
      held.delete(key);
      await page.keyboard.up(key).catch(() => {});
    };

    const startedAt = Date.now();
    let lastGrantAt = 0;
    let samples = 0;
    let hittableSamples = 0;
    let lastSampleAt = 0;
    let lastHp = 5;
    // 風箏圈方向：沿場地連續行走拉開慢速補給怪，靠牆或威脅在前時折返。
    let kiteDir = 1;
    let prevBossX = null;
    let frozenStreak = 0;
    const fireLog = {};
    let lastMercyCount = 0;
    let heartSweepUntil = 0;

    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const scene = await sp(() => window.__sp.scene());
      if (scene === 'Result') break;
      if (scene !== 'Game') {
        await sleep(300);
        continue;
      }
      const state = await sp(() => ({
        hp: window.__sp.playerHp(),
        bossHp: window.__sp.bossHp(),
        px: window.__sp.probe().x,
        boss: window.__sp.bossPos(),
        ammo: window.__sp.ammo().ammo,
        view: window.__sp.view().width,
        enemies: window.__sp.enemies(),
        shots: window.__sp.bossShots(),
        mercy: window.__sp.mercyCount(),
      }));
      if (!state) {
        await sleep(200);
        continue;
      }
      if (process.env.BOT_DEBUG && state.hp < lastHp) {
        console.log(
          `  [dbg] hp ${lastHp}->${state.hp} t=${Math.round((Date.now() - startedAt) / 100) / 10}s bossY=${state.boss.y} adx=${Math.abs(state.boss.x - state.px)} nearest=${Math.round(
            Math.min(...state.enemies.map((e) => Math.hypot(e.x - state.px, 0)), 9999),
          )}`,
        );
      }
      lastHp = state.hp;
      // hit window 取樣（每 ≥200ms 一筆）：體底（碰撞半高 47）進單跳星彈可打帶（≥270）。
      if (Date.now() - lastSampleAt >= 200) {
        lastSampleAt = Date.now();
        samples += 1;
        if (state.boss.y + 47 >= 270) hittableSamples += 1;
      }
      // 週期吸彈模擬（稽核同方法）：空匣才補一發標準星——保持單槽節奏，
      // 避免與真吸入疊槽觸發混合（純標準星保底 build 紀律）。
      if (Date.now() - lastGrantAt >= profile.grantEveryMs && state.ammo === 0) {
        lastGrantAt = Date.now();
        await sp(() => window.__sp.grantStar('jelly'));
      }
      const dx = state.boss.x - state.px;
      const adx = Math.abs(dx);
      const clearHeld = async () => {
        for (const key of ['ArrowLeft', 'ArrowRight']) await release(key);
      };
      const keyOf = (dir) => (dir > 0 ? 'ArrowRight' : 'ArrowLeft');
      void kiteDir;

      // 錨點打法（§54 難度根修的設計解）：駐守左牆喘息帶（盤旋掃幅之外），
      // 面右對全場點射；俯衝壓境才短程折竄再回錨。
      const ANCHOR_X = 84;

      // -1) 慈悲愛心掃拾（玩家看見生成閃光去撿）：生成後 7s 內左右掃走蒐集帶
      //     （落點必在玩家 ±240 內），無精確座標亦可掃到。
      if (state.mercy > lastMercyCount) {
        lastMercyCount = state.mercy;
        heartSweepUntil = Date.now() + 7000;
      }
      if (Date.now() < heartSweepUntil && state.hp <= 2 && state.boss.y <= 290) {
        const phaseLeft = Math.floor((heartSweepUntil - Date.now()) / 1800) % 2 === 0;
        const dir = phaseLeft && state.px > 150 ? -1 : 1;
        await clearHeld();
        await press(keyOf(dir));
        await sleep(360);
        await release(keyOf(dir));
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }

      // 0) 俯衝讀招（對應遊戲內白閃＋落點 telegraph 720ms）：盤旋掃動連續凍結＝前搖
      //    （單次凍結可能只是掃掠折返點），立即逃離鎖定落點（落點＝當下玩家位置）。
      const frozenNow = prevBossX !== null && Math.abs(state.boss.x - prevBossX) < 2;
      prevBossX = state.boss.x;
      frozenStreak = frozenNow ? frozenStreak + 1 : 0;
      const bossFrozen = frozenStreak >= 2;
      if (bossFrozen && state.boss.y <= 290 && Math.random() < profile.dodgeSkill) {
        const escDir = state.px < state.view / 2 ? 1 : -1;
        await clearHeld();
        await press(keyOf(escDir));
        await sleep(rand(420, 560));
        await release(keyOf(escDir));
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }

      // 1) 俯衝壓境（魔王壓低且逼近）：向遠離側折竄脫離落點（貼牆時強制朝場中）。
      if (state.boss.y > 285 && adx < 260 && Math.random() < profile.dodgeSkill) {
        const escDir = state.px < 170 ? 1 : state.px > state.view - 170 ? -1 : dx >= 0 ? -1 : 1;
        await clearHeld();
        await press(keyOf(escDir));
        await sleep(rand(380, 520));
        await release(keyOf(escDir));
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }
      // 2) 彈幕迴避：正上/正面近彈（落彈直落）一律側移離開彈道；僅遠側低彈道
      //    （P3 放射水平彈貼地逼近）用跳越。
      const shot = state.shots
        .filter((s) => Math.abs(s.x - state.px) < 90 && s.y > 80 && s.y < 400)
        .sort((a, b) => Math.abs(a.x - state.px) - Math.abs(b.x - state.px))[0];
      if (shot && Math.random() < profile.dodgeSkill) {
        const escDir = shot.x >= state.px && state.px > 150 ? -1 : 1;
        await clearHeld();
        await press(keyOf(escDir));
        await sleep(rand(260, 360));
        await release(keyOf(escDir));
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }
      const lowShot = state.shots.some(
        (s) => Math.abs(s.x - state.px) >= 90 && Math.abs(s.x - state.px) < 190 && s.y > 330,
      );
      if (lowShot && Math.random() < profile.dodgeSkill) {
        await press('Z');
        await sleep(140);
        await release('Z');
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }
      // 3) 歸位錨點。
      if (Math.abs(state.px - ANCHOR_X) > 60) {
        const dir = ANCHOR_X > state.px ? 1 : -1;
        await clearHeld();
        await press(keyOf(dir));
        await sleep(Math.min(500, (Math.abs(state.px - ANCHOR_X) / 220) * 1000));
        await release(keyOf(dir));
      }
      // 4) 補給怪＝食物（人類核心循環）：走近的補給怪「原地面向長按吸入」吞掉
      //    （不追身杜絕接觸傷）；有彈時貼身者改點射清除。
      const nearMinion = state.enemies
        .map((e) => ({ ...e, dist: Math.abs(e.x - state.px) }))
        .filter((e) => e.dist < 130)
        .sort((a, b) => a.dist - b.dist)[0];
      if (nearMinion && !bossFrozen && state.boss.y <= 290) {
        const dir = Math.sign(nearMinion.x - state.px || 1);
        await clearHeld();
        await press(keyOf(dir));
        await sleep(60);
        await release(keyOf(dir));
        if (state.ammo === 0) {
          if (nearMinion.y < 300) {
            await press('Z');
            await sleep(120);
            await release('Z');
          }
          await press('X');
          await sleep(rand(500, 700));
          await release('X');
        } else if (nearMinion.dist < 100) {
          await page.keyboard.press('X', { delay: 110 }).catch(() => {});
        }
        await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
        continue;
      }

      // 5) 出手：低位（俯衝落地/滯留窗）地面點射；高位單跳點射（星彈橫穿全場，
      //    錨點遠距即可命中）；跳射前確認頭頂帶無小怪防擦撞。
      if (state.ammo > 0) {
        const airBlocked = state.enemies.some((e) => Math.abs(e.x - state.px) < 110 && e.y < 300);
        const hpBefore = state.bossHp;
        let fired = null;
        if (state.boss.y > 290 || adx >= 200) {
          // 低位窗或遠距：地面點射（魔王房準星輔助使水平彈上彎入盤旋帶）。
          fired = 'ground';
          await clearHeld();
          await press(keyOf(Math.sign(dx || 1)));
          await sleep(60);
          await release(keyOf(Math.sign(dx || 1)));
          await page.keyboard.press('X', { delay: 110 }).catch(() => {});
        } else if (adx >= 90 && !airBlocked && state.boss.y <= 262) {
          // 近距且魔王確實在高位盤旋才跳射；260-290 帶（俯掠/壓低）跳起必撞，改等窗。
          fired = 'jump';
          await clearHeld();
          await press(keyOf(Math.sign(dx || 1)));
          await sleep(60);
          await release(keyOf(Math.sign(dx || 1)));
          await press('Z');
          await sleep(130);
          await release('Z');
          await sleep(140);
          await page.keyboard.press('X', { delay: 110 }).catch(() => {});
        } else if (adx < 200) {
          // 帶內壓迫：拉開到彎射距離。
          const escDir =
            state.px < 170 ? 1 : state.px > state.view - 170 ? -1 : -Math.sign(dx || 1);
          await clearHeld();
          await press(keyOf(escDir));
          await sleep(260);
          await release(keyOf(escDir));
        }
        if (fired && process.env.BOT_DEBUG) {
          await sleep(900);
          const hpAfter = (await sp(() => window.__sp.bossHp())) ?? hpBefore;
          fireLog[fired] = fireLog[fired] ?? { shots: 0, hits: 0 };
          fireLog[fired].shots += 1;
          if (hpAfter < hpBefore) fireLog[fired].hits += 1;
        }
      }
      await sleep(rand(profile.reactionMinMs, profile.reactionMaxMs));
    }
    for (const key of [...held]) await release(key);
    const bossHp = (await sp(() => window.__sp.bossHp())) ?? maxHp;
    const won = bossHp <= 0;
    const dmgPct = Math.round(((maxHp - Math.max(0, bossHp)) / maxHp) * 100);
    const hw = samples > 0 ? Math.round((hittableSamples / samples) * 100) : 0;
    const durS = Math.round((Date.now() - startedAt) / 1000);
    const fireInfo = Object.entries(fireLog)
      .map(([kind, v]) => `${kind}=${v.hits}/${v.shots}`)
      .join(' ');
    console.log(
      `[${profileName} #${index}] ${won ? 'WIN' : 'LOSE'} dmg=${dmgPct}% hitWindow=${hw}% dur=${durS}s maxHp=${maxHp}${fireInfo ? ' ' + fireInfo : ''}`,
    );
    return { won, dmgPct, hw };
  } finally {
    await ctx.close();
  }
}

// 序列執行：並行多瀏覽器互搶資源會使遊戲幀率下滑、bot 牆鐘節奏與遊戲時間錯拍，
// 量測失真（人類也是一次打一場）。
const browser = await chromium.launch();
const results = [];
for (let i = 0; i < runs; i += 1) results.push(await runFight(browser, i + 1));
await browser.close();
const wins = results.filter((r) => r.won).length;
const avgDmg = Math.round(results.reduce((s, r) => s + r.dmgPct, 0) / results.length);
const avgHw = Math.round(results.reduce((s, r) => s + r.hw, 0) / results.length);
console.log(
  `SUMMARY ${profileName}: winRate=${wins}/${runs} (${Math.round((wins / runs) * 100)}%) avgDmg=${avgDmg}% avgHitWindow=${avgHw}%`,
);
