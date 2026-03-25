import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { evaluateExpression } from '../lib/evaluateExpression';

export type SplitMode = 'split_evenly' | 'itemized';

export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  isActive: boolean;
}

export interface ExpenseRecord {
  id: string;
  tripId: string;
  type: SplitMode;
  participantIds: string[];
  paidBy: string;
  totalAmount: number;
  perPersonAmounts: Record<string, number>;
  note: string;
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
}

interface AppState {
  trips: Trip[];
  currentTripId: string | null;
  members: Member[];
  expenses: ExpenseRecord[];
  activeTab: 'home' | 'history' | 'settings';
  splitMode: SplitMode;
  calculatorValue: string;
  focusedMemberId: string | null;
  itemizedValues: Record<string, string>;
  payerId: string | null;

  // Actions
  addTrip: (name: string) => void;
  setCurrentTrip: (id: string) => void;
  addMember: () => void;
  toggleMemberActive: (id: string) => void;
  updateMember: (id: string, name: string) => void;
  randomizeAvatar: (id: string) => void;
  setSplitMode: (mode: SplitMode) => void;
  setCalculatorValue: (val: string) => void;
  setFocusedMemberId: (id: string | null) => void;
  setItemizedValue: (memberId: string, val: string) => void;
  setPayerId: (id: string) => void;
  saveExpense: () => void;
  deleteExpense: (id: string) => void;
  setActiveTab: (tab: 'home' | 'history' | 'settings') => void;
  clearCalculator: () => void;
}

const AVATARS = [
  `${import.meta.env.BASE_URL || '/'}avatars/cat-1.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-2.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-3.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-4.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-5.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-6.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-7.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-8.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-9.svg`,
  `${import.meta.env.BASE_URL || '/'}avatars/cat-10.svg`,
];

const getAvatarOrFallback = (index: number) => AVATARS[index] ?? AVATARS[0] ?? '';

const PREFIXES = ['奶油', '布丁', '麻糬', '棉花', '糰子', '可可', '芝麻', '蜜桃', '焦糖', '雲朵'];
const SUFFIXES = ['貓', '兔', '熊', '鴨', '狐', '鵝', '豹', '球', '丸', '寶'];

const generateRandomName = () => {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${p}${s}`;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      trips: [{ id: 'default-trip', name: '今天聚餐', createdAt: Date.now() }],
      currentTripId: 'default-trip',
      members: [
        { id: 'me', name: '我', avatarUrl: getAvatarOrFallback(4), isActive: true },
        { id: 'm1', name: 'Oliver', avatarUrl: getAvatarOrFallback(0), isActive: true },
        { id: 'm2', name: 'Luna', avatarUrl: getAvatarOrFallback(1), isActive: true },
      ],
      expenses: [],
      activeTab: 'home',
      splitMode: 'split_evenly',
      calculatorValue: '',
      focusedMemberId: null,
      itemizedValues: {},
      payerId: 'me',

      addTrip: (name) =>
        set((state) => {
          const newTrip = { id: Date.now().toString(), name, createdAt: Date.now() };
          return { trips: [...state.trips, newTrip], currentTripId: newTrip.id };
        }),

      setCurrentTrip: (id) => set({ currentTripId: id }),

      addMember: () =>
        set((state) => {
          const newMember: Member = {
            id: Date.now().toString(),
            name: generateRandomName(),
            avatarUrl: getAvatarOrFallback(Math.floor(Math.random() * AVATARS.length)),
            isActive: true,
          };
          return { members: [...state.members, newMember] };
        }),

      toggleMemberActive: (id) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)),
        })),

      updateMember: (id, name) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, name } : m)),
        })),

      randomizeAvatar: (id) =>
        set((state) => {
          const currentAvatar = state.members.find((m) => m.id === id)?.avatarUrl;
          const availableAvatars = AVATARS.filter((a) => a !== currentAvatar);
          const newAvatar =
            availableAvatars[Math.floor(Math.random() * availableAvatars.length)] ??
            AVATARS[0] ??
            '';
          return {
            members: state.members.map((m) => (m.id === id ? { ...m, avatarUrl: newAvatar } : m)),
          };
        }),

      setSplitMode: (mode) => set({ splitMode: mode, calculatorValue: '', itemizedValues: {} }),

      setCalculatorValue: (val) => set({ calculatorValue: val }),

      setFocusedMemberId: (id) => set({ focusedMemberId: id }),

      setItemizedValue: (memberId, val) =>
        set((state) => ({
          itemizedValues: { ...state.itemizedValues, [memberId]: val },
        })),

      setPayerId: (id) => set({ payerId: id }),

      clearCalculator: () => set({ calculatorValue: '', itemizedValues: {} }),

      saveExpense: () =>
        set((state) => {
          if (!state.currentTripId) return state;

          const activeMembers = state.members.filter((m) => m.isActive);
          if (activeMembers.length === 0) return state;

          let totalAmount = 0;
          const perPersonAmounts: Record<string, number> = {};

          if (state.splitMode === 'split_evenly') {
            totalAmount = evaluateExpression(state.calculatorValue);
            if (totalAmount <= 0) return state;

            const splitAmount = totalAmount / activeMembers.length;
            activeMembers.forEach((m) => {
              perPersonAmounts[m.id] = splitAmount;
            });
          } else {
            activeMembers.forEach((m) => {
              const val = evaluateExpression(state.itemizedValues[m.id] || '0');
              perPersonAmounts[m.id] = val;
              totalAmount += val;
            });
            if (totalAmount <= 0) return state;
          }

          const newExpense: ExpenseRecord = {
            id: Date.now().toString(),
            tripId: state.currentTripId,
            type: state.splitMode,
            participantIds: activeMembers.map((m) => m.id),
            paidBy: state.payerId || 'me',
            totalAmount,
            perPersonAmounts,
            note: '',
            createdAt: Date.now(),
          };

          return {
            expenses: [newExpense, ...state.expenses],
            calculatorValue: '',
            itemizedValues: {},
            activeTab: 'history', // Switch to history tab after saving
          };
        }),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'split-meow-storage',
    },
  ),
);
