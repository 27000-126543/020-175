import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { ChildProfile, ToothRecord, RecheckReminder, RecheckHistory, RecheckChoice, ParentFeedback } from '@/types';
import { mockChild, mockTeethRecords, mockRecheckReminders, mockRecheckHistory } from '@/data/mock';

const STORAGE_KEY = 'dental_seal_app_state_v1';

interface PersistState {
  isBound: boolean;
  child: ChildProfile | null;
  teethRecords: ToothRecord[];
  recheckReminders: RecheckReminder[];
  recheckHistory: RecheckHistory[];
}

interface AppState extends PersistState {
  initialized: boolean;
  initFromStorage: () => void;
  persist: () => void;
  bindChildByCode: (code: string) => Promise<boolean>;
  unbindChild: () => void;
  updateTeethFeedback: (toothId: string, feedback: ParentFeedback) => void;
  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => void;
}

const loadFromStorage = (): PersistState | null => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistState;
    }
  } catch (e) {
    console.error('[Store] 读取本地存储失败', e);
  }
  return null;
};

const saveToStorage = (state: PersistState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Store] 写入本地存储失败', e);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  isBound: false,
  child: null,
  teethRecords: [],
  recheckReminders: [],
  recheckHistory: [],

  initFromStorage: () => {
    if (get().initialized) return;
    const saved = loadFromStorage();
    if (saved && saved.isBound) {
      console.log('[Store] 从本地存储恢复已绑定状态');
      set({
        initialized: true,
        isBound: saved.isBound,
        child: saved.child,
        teethRecords: saved.teethRecords,
        recheckReminders: saved.recheckReminders,
        recheckHistory: saved.recheckHistory
      });
    } else {
      set({ initialized: true });
    }
  },

  persist: () => {
    const { isBound, child, teethRecords, recheckReminders, recheckHistory } = get();
    saveToStorage({ isBound, child, teethRecords, recheckReminders, recheckHistory });
  },

  bindChildByCode: async (code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const valid = /^CLINIC-\d{4}-\d{5}$/.test(code);
    if (valid) {
      const newState: PersistState = {
        isBound: true,
        child: { ...mockChild, registerCode: code },
        teethRecords: mockTeethRecords,
        recheckReminders: mockRecheckReminders,
        recheckHistory: mockRecheckHistory
      };
      set(newState);
      saveToStorage(newState);
      console.log('[Store] 绑定成功，已持久化到本地');
      return true;
    }
    return false;
  },

  unbindChild: () => {
    const emptyState: PersistState = {
      isBound: false,
      child: null,
      teethRecords: [],
      recheckReminders: [],
      recheckHistory: []
    };
    set(emptyState);
    saveToStorage(emptyState);
    console.log('[Store] 已解绑，已清除本地存储');
  },

  updateTeethFeedback: (toothId: string, feedback: ParentFeedback) => {
    set((state) => {
      const newTeeth = state.teethRecords.map((t) =>
        t.id === toothId ? { ...t, parentFeedback: feedback } : t
      );
      const newState: PersistState = {
        isBound: state.isBound,
        child: state.child,
        teethRecords: newTeeth,
        recheckReminders: state.recheckReminders,
        recheckHistory: state.recheckHistory
      };
      saveToStorage(newState);
      console.log('[Store] 牙齿反馈已更新并持久化', toothId);
      return { teethRecords: newTeeth };
    });
  },

  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => {
    set((state) => {
      const newReminders = state.recheckReminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'handled' as const, choice, appointmentDate, handleDate: new Date().toISOString().split('T')[0] }
          : r
      );
      const newState: PersistState = {
        isBound: state.isBound,
        child: state.child,
        teethRecords: state.teethRecords,
        recheckReminders: newReminders,
        recheckHistory: state.recheckHistory
      };
      saveToStorage(newState);
      console.log('[Store] 复查选择已更新并持久化', reminderId, choice);
      return { recheckReminders: newReminders };
    });
  }
}));
