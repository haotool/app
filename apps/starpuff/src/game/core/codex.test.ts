import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';
import { CODEX_MONSTERS, CODEX_SKILLS, FLAVOR_HINTS, MIX_HINTS } from './codex';

describe('CODEX_MONSTERS', () => {
  it('收錄全部十二種小怪與雙魔王（v8 spora/gusty/boomy/noctra 入鑑）', () => {
    expect(CODEX_MONSTERS.map((m) => m.kind)).toEqual([
      'jelly',
      'floaty',
      'spiky',
      'puffy',
      'chompy',
      'shelly',
      'zappy',
      'drilly',
      'glowy',
      'spora',
      'gusty',
      'boomy',
      'boss',
      'noctra',
    ]);
  });

  it('立繪鍵一律對應既有資產註冊表（禁止新美術）', () => {
    const registered = new Set(ASSETS.map((asset) => asset.key));
    for (const monster of CODEX_MONSTERS) {
      expect(registered.has(monster.textureKey)).toBe(true);
    }
  });

  it('可吸標記與戰鬥規則一致（§5/§16/§30/§47/§52），殼殼與鑽鑽鼴標條件可吸', () => {
    const inhalable = new Set(
      CODEX_MONSTERS.filter((m) => m.inhalable).map((m) => m.kind as string),
    );
    expect(inhalable).toEqual(
      new Set(['jelly', 'floaty', 'puffy', 'zappy', 'glowy', 'spora', 'gusty', 'boomy']),
    );
    expect(CODEX_MONSTERS.find((m) => m.kind === 'shelly')?.conditional).toBe(true);
    expect(CODEX_MONSTERS.find((m) => m.kind === 'drilly')?.conditional).toBe(true);
    expect(CODEX_MONSTERS.filter((m) => m.conditional)).toHaveLength(2);
  });

  it('名稱與行為描述皆非空', () => {
    for (const monster of CODEX_MONSTERS) {
      expect(monster.nameZh.length).toBeGreaterThan(0);
      expect(monster.behavior.length).toBeGreaterThan(0);
    }
  });
});

describe('CODEX_SKILLS', () => {
  it('技能名稱唯一且欄位齊備', () => {
    const names = CODEX_SKILLS.map((skill) => skill.nameZh);
    expect(new Set(names).size).toBe(names.length);
    for (const skill of CODEX_SKILLS) {
      expect(skill.howTo.length).toBeGreaterThan(0);
      expect(skill.detail.length).toBeGreaterThan(0);
    }
  });

  it('涵蓋核心操作：吸入／星彈九系／混合星彈／星暴／下衝擊／殼盾／雷鏈', () => {
    const names = new Set(CODEX_SKILLS.map((skill) => skill.nameZh));
    for (const required of ['吸入', '星彈九系', '混合星彈', '星暴', '下衝擊', '殼盾', '雷鏈']) {
      expect(names.has(required)).toBe(true);
    }
  });

  it('首遇提示（§46/§47/§53）：九味與九式配方文案齊備非空', () => {
    expect(Object.keys(FLAVOR_HINTS)).toHaveLength(9);
    expect(Object.keys(MIX_HINTS)).toHaveLength(9);
    for (const hint of [...Object.values(FLAVOR_HINTS), ...Object.values(MIX_HINTS)]) {
      expect(hint.length).toBeGreaterThan(0);
    }
  });

  it('v7 下衝擊操作說明對齊輸入矩陣（§44）：下＋跳躍鍵、吞含可觸發', () => {
    const slam = CODEX_SKILLS.find((skill) => skill.nameZh === '下衝擊');
    expect(slam?.howTo).toContain('跳躍鍵');
    expect(slam?.detail).toContain('腹中含怪');
  });

  it('v6 新技能標注來源怪物（§40）：殼盾對應殼殼、雷鏈對應雷雷', () => {
    expect(CODEX_SKILLS.find((skill) => skill.nameZh === '殼盾')?.detail).toContain('護盾');
    expect(CODEX_SKILLS.find((skill) => skill.nameZh === '殼盾')?.howTo).toContain('殼盾星');
    expect(CODEX_SKILLS.find((skill) => skill.nameZh === '雷鏈')?.howTo).toContain('雷雷');
  });
});
