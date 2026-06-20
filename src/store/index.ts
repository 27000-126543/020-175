import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { ChildProfile, ToothRecord, RecheckReminder, RecheckHistory, RecheckChoice, ParentFeedback, ClinicRecheckRecord } from '@/types';
import { mockChild, mockTeethRecords, mockRecheckReminders, mockRecheckHistory } from '@/data/mock';

const STORAGE_KEY = 'dental_seal_app_state_v1';

const VALID_REGISTER_CODES = [
  'CLINIC-2026-88521',
  'CLINIC-2026-88522',
  'CLINIC-2026-88523',
  'CLINIC-2026-88524',
  'CLINIC-2026-88525',
  'CLINIC-2026-88526',
  'CLINIC-2026-88527',
  'CLINIC-2026-88528',
  'CLINIC-2026-88529',
  'CLINIC-2026-88530',
  'CLINIC-2025-66521',
  'CLINIC-2025-66522',
  'CLINIC-2026-99001',
  'CLINIC-2026-99002'
];

interface PersistState {
  isBound: boolean;
  child: ChildProfile | null;
  teethRecords: ToothRecord[];
  recheckReminders: RecheckReminder[];
  recheckHistory: RecheckHistory[];
  clinicRecords: ClinicRecheckRecord[];
}

interface AppState extends PersistState {
  initialized: boolean;
  initFromStorage: () => void;
  bindChildByCode: (code: string) => Promise<boolean>;
  unbindChild: () => void;
  saveFeedbackPhoto: (tempFilePath: string, toothId: string) => Promise<string>;
  updateTeethFeedback: (toothId: string, feedback: ParentFeedback, oldPhotoUrl?: string) => void;
  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => void;
  getClinicRecords: () => ClinicRecheckRecord[];
}

const loadFromStorage = (): PersistState | null => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistState;
      if (!parsed.clinicRecords) {
        parsed.clinicRecords = [];
      }
      return parsed;
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

const deleteSavedFile = async (filePath: string) => {
  try {
    if (filePath.startsWith('http') || filePath.startsWith('blob')) return;
    await Taro.removeSavedFile({ filePath });
    console.log('[Store] 已删除旧照片文件:', filePath);
  } catch (e) {
    console.warn('[Store] 删除旧照片失败:', e);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  isBound: false,
  child: null,
  teethRecords: [],
  recheckReminders: [],
  recheckHistory: [],
  clinicRecords: [],

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
        recheckHistory: saved.recheckHistory,
        clinicRecords: saved.clinicRecords || []
      });
    } else {
      set({ initialized: true });
    }
  },

  bindChildByCode: async (code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const isInWhitelist = VALID_REGISTER_CODES.includes(code.trim().toUpperCase());

    if (!isInWhitelist) {
      console.log('[Store] 登记码不在白名单中，绑定失败:', code);
      return false;
    }

    const newState: PersistState = {
      isBound: true,
      child: { ...mockChild, registerCode: code.trim().toUpperCase() },
      teethRecords: mockTeethRecords,
      recheckReminders: mockRecheckReminders,
      recheckHistory: mockRecheckHistory,
      clinicRecords: []
    };
    set(newState);
    saveToStorage(newState);
    console.log('[Store] 绑定成功，已持久化到本地，登记码:', code);
    return true;
  },

  unbindChild: () => {
    const current = get();
    current.teethRecords.forEach((t) => {
      if (t.parentFeedback?.photoUrl) {
        deleteSavedFile(t.parentFeedback.photoUrl);
      }
    });

    const emptyState: PersistState = {
      isBound: false,
      child: null,
      teethRecords: [],
      recheckReminders: [],
      recheckHistory: [],
      clinicRecords: []
    };
    set(emptyState);
    saveToStorage(emptyState);
    try {
      Taro.removeStorageSync(STORAGE_KEY);
    } catch (e) {}
    console.log('[Store] 已解绑，已清除本地存储和照片');
  },

  saveFeedbackPhoto: async (tempFilePath: string, toothId: string) => {
    try {
      const saveRes = await Taro.saveFile({
        tempFilePath
      });
      console.log('[Store] 照片已保存为永久文件:', saveRes.savedFilePath);
      return saveRes.savedFilePath;
    } catch (e) {
      console.error('[Store] 保存照片失败', e);
      throw e;
    }
  },

  updateTeethFeedback: (toothId: string, feedback: ParentFeedback, oldPhotoUrl?: string) => {
    set((state) => {
      if (oldPhotoUrl && oldPhotoUrl !== feedback.photoUrl) {
        deleteSavedFile(oldPhotoUrl);
      }

      const newTeeth = state.teethRecords.map((t) =>
        t.id === toothId ? { ...t, parentFeedback: feedback } : t
      );
      const newState: PersistState = {
        isBound: state.isBound,
        child: state.child,
        teethRecords: newTeeth,
        recheckReminders: state.recheckReminders,
        recheckHistory: state.recheckHistory,
        clinicRecords: state.clinicRecords
      };
      saveToStorage(newState);
      console.log('[Store] 牙齿反馈已更新并持久化', toothId, '照片:', feedback.photoUrl || '(无照片)');
      return { teethRecords: newTeeth };
    });
  },

  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => {
    set((state) => {
      const reminder = state.recheckReminders.find((r) => r.id === reminderId);
      const child = state.child;

      if (!reminder || !child) return state;

      const newReminders = state.recheckReminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'handled' as const, choice, appointmentDate, handleDate: new Date().toISOString().split('T')[0] }
          : r
      );

      const teethDetails = state.teethRecords
        .filter((t) => reminder.toothIds.includes(t.id))
        .map((t) => ({
          toothId: t.id,
          toothNumber: t.toothNumber,
          toothName: t.toothName
        }));

      const clinicRecord: ClinicRecheckRecord = {
        id: `CR-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        child: {
          id: child.id,
          name: child.name,
          gender: child.gender,
          age: child.age,
          registerCode: child.registerCode
        },
        clinicName: child.clinicName,
        teeth: teethDetails,
        recheckWeek: reminder.recheckWeek,
        parentChoice: choice,
        appointmentDate: appointmentDate,
        isUrgent: reminder.isUrgent,
        status: 'pending'
      };

      const newClinicRecords = [clinicRecord, ...state.clinicRecords];

      const newState: PersistState = {
        isBound: state.isBound,
        child: state.child,
        teethRecords: state.teethRecords,
        recheckReminders: newReminders,
        recheckHistory: state.recheckHistory,
        clinicRecords: newClinicRecords
      };
      saveToStorage(newState);
      console.log('[Store] 复查选择已更新并持久化', reminderId, choice);
      console.log('[Store] ========== 诊所前台新记录 ==========', JSON.stringify(clinicRecord, null, 2));
      return { recheckReminders: newReminders, clinicRecords: newClinicRecords };
    });
  },

  getClinicRecords: () => {
    return get().clinicRecords;
  }
}));
