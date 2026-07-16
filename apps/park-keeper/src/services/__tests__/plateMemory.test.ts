import { plateMemory } from '../plateMemory';

describe('plateMemory', () => {
  describe('車號記憶', () => {
    it('should return null when nothing committed', () => {
      expect(plateMemory.get()).toBeNull();
    });

    it('should return committed plate', () => {
      plateMemory.commit('ABC-1234');
      expect(plateMemory.get()).toBe('ABC-1234');
    });

    it('should treat empty/whitespace commit as no-op and keep existing memory', () => {
      plateMemory.commit('ABC-1234');
      plateMemory.commit('');
      plateMemory.commit('   ');
      expect(plateMemory.get()).toBe('ABC-1234');
    });

    it('should clear memory via clear()', () => {
      plateMemory.commit('ABC-1234');
      plateMemory.clear();
      expect(plateMemory.get()).toBeNull();
    });
  });

  describe('樓層記憶', () => {
    it('should return null when nothing committed', () => {
      expect(plateMemory.getFloor()).toBeNull();
    });

    it('should return committed floor', () => {
      plateMemory.commitFloor('B2');
      expect(plateMemory.getFloor()).toBe('B2');
    });

    it('should be cleared together with plate via clear()', () => {
      plateMemory.commit('ABC-1234');
      plateMemory.commitFloor('B2');
      plateMemory.clear();
      expect(plateMemory.get()).toBeNull();
      expect(plateMemory.getFloor()).toBeNull();
    });
  });

  describe('localStorage 不可用時靜默降級', () => {
    const throwingStorage: Storage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
      clear: () => {
        throw new Error('SecurityError');
      },
      key: () => null,
      length: 0,
    };

    it('get() should return null instead of throwing', () => {
      vi.stubGlobal('localStorage', throwingStorage);
      expect(() => plateMemory.get()).not.toThrow();
      expect(plateMemory.get()).toBeNull();
      vi.unstubAllGlobals();
    });

    it('commit() should not throw', () => {
      vi.stubGlobal('localStorage', throwingStorage);
      expect(() => plateMemory.commit('ABC-1234')).not.toThrow();
      vi.unstubAllGlobals();
    });

    it('clear() should not throw', () => {
      vi.stubGlobal('localStorage', throwingStorage);
      expect(() => plateMemory.clear()).not.toThrow();
      vi.unstubAllGlobals();
    });

    it('getFloor()/commitFloor() should not throw', () => {
      vi.stubGlobal('localStorage', throwingStorage);
      expect(() => plateMemory.getFloor()).not.toThrow();
      expect(() => plateMemory.commitFloor('B2')).not.toThrow();
      vi.unstubAllGlobals();
    });

    it('getHistory() should return [] instead of throwing', () => {
      vi.stubGlobal('localStorage', throwingStorage);
      expect(plateMemory.getHistory()).toEqual([]);
      vi.unstubAllGlobals();
    });
  });

  describe('歷史車號（issue #725 一鍵切換）', () => {
    it('commit 依序累積歷史，最新在前且去重', () => {
      plateMemory.commit('AAA-1111');
      plateMemory.commit('BBB-2222');
      plateMemory.commit('AAA-1111');
      expect(plateMemory.getHistory()).toEqual(['AAA-1111', 'BBB-2222']);
    });

    it('歷史上限 3 筆，超出淘汰最舊', () => {
      for (const p of ['A-1', 'B-2', 'C-3', 'D-4']) plateMemory.commit(p);
      expect(plateMemory.getHistory()).toEqual(['D-4', 'C-3', 'B-2']);
    });

    it('clear() 一併清除歷史；壞資料回退空陣列', () => {
      plateMemory.commit('AAA-1111');
      plateMemory.clear();
      expect(plateMemory.getHistory()).toEqual([]);

      localStorage.setItem('park-keeper:plate-history', '{not-json');
      expect(plateMemory.getHistory()).toEqual([]);
    });
  });
});
