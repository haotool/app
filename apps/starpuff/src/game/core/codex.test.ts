import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';
import { CODEX_MONSTERS, CODEX_SKILLS } from './codex';

describe('CODEX_MONSTERS', () => {
  it('收錄全部七種小怪與魔王', () => {
    expect(CODEX_MONSTERS.map((m) => m.kind)).toEqual([
      'jelly',
      'floaty',
      'spiky',
      'puffy',
      'chompy',
      'shelly',
      'zappy',
      'boss',
    ]);
  });

  it('立繪鍵一律對應既有資產註冊表（禁止新美術）', () => {
    const registered = new Set(ASSETS.map((asset) => asset.key));
    for (const monster of CODEX_MONSTERS) {
      expect(registered.has(monster.textureKey)).toBe(true);
    }
  });

  it('可吸標記與戰鬥規則一致（§5/§16/§30），殼殼標條件可吸', () => {
    const inhalable = new Set(
      CODEX_MONSTERS.filter((m) => m.inhalable).map((m) => m.kind as string),
    );
    expect(inhalable).toEqual(new Set(['jelly', 'floaty', 'puffy', 'zappy']));
    expect(CODEX_MONSTERS.find((m) => m.kind === 'shelly')?.conditional).toBe(true);
    expect(CODEX_MONSTERS.filter((m) => m.conditional)).toHaveLength(1);
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

  it('涵蓋核心操作：吸入／星彈三系／星暴／下衝擊／空中疾衝', () => {
    const names = new Set(CODEX_SKILLS.map((skill) => skill.nameZh));
    for (const required of ['吸入', '星彈三系', '星暴', '下衝擊', '空中疾衝']) {
      expect(names.has(required)).toBe(true);
    }
  });
});
