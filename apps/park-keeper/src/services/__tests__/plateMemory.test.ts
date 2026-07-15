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
  });
});
