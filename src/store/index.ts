import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { ChildProfile, ToothRecord, RecheckReminder, RecheckHistory, RecheckChoice, ParentFeedback, ClinicRecheckRecord, ProcessStatus, AppRole } from '@/types';
import { mockChild, mockTeethRecords, mockRecheckReminders, mockRecheckHistory } from '@/data/mock';

const STORAGE_KEY = 'dental_seal_app_state_v2';

const VALID_REGISTER_CODES = [
  'CLINIC-2026-88521', 'CLINIC-2026-88522', 'CLINIC-2026-88523',
  'CLINIC-2026-88524', 'CLINIC-2026-88525', 'CLINIC-2026-88526',
  'CLINIC-2026-88527', 'CLINIC-2026-88528', 'CLINIC-2026-88529',
  'CLINIC-2026-88530', 'CLINIC-2025-66521', 'CLINIC-2025-66522',
  'CLINIC-2026-99001', 'CLINIC-2026-99002'
];

const CLINIC_ENTRY_CODE = 'CLINIC2026';

interface PersistState {
  role: AppRole;
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
  switchRole: (role: AppRole, entryCode?: string) => boolean;
  bindChildByCode: (code: string) => Promise<boolean>;
  unbindChild: () => void;
  saveFeedbackPhoto: (tempFilePath: string, toothId: string) => Promise<string>;
  updateTeethFeedback: (toothId: string, feedback: ParentFeedback, oldPhotoUrl?: string) => void;
  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => void;
  processClinicRecord: (recordId: string, processStatus: ProcessStatus, remark?: string, operator?: string) => void;
  getClinicRecordsByFilter: (filter: { status?: ProcessStatus | 'all'; choice?: RecheckChoice | 'all'; keyword?: string }) => ClinicRecheckRecord[];
  getRecordByReminderId: (reminderId: string) => ClinicRecheckRecord | undefined;
}

const loadFromStorage = (): PersistState | null => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistState;
      if (!parsed.clinicRecords) parsed.clinicRecords = [];
      if (!parsed.role) parsed.role = 'parent';
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

const nowISO = () => new Date().toISOString();

export const processStatusMap: Record<ProcessStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F97316' },
  contacted: { label: '已联系', color: '#3B82F6' },
  scheduled: { label: '已预约', color: '#10B981' },
  completed: { label: '已完成', color: '#6B7280' }
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  role: 'parent',
  isBound: false,
  child: null,
  teethRecords: [],
  recheckReminders: [],
  recheckHistory: [],
  clinicRecords: [],

  initFromStorage: () => {
    if (get().initialized) return;
    const saved = loadFromStorage();
    if (saved) {
      console.log('[Store] 从本地存储恢复，角色:', saved.role, '已绑定:', saved.isBound);
      set({
        initialized: true,
        role: saved.role,
        isBound: saved.isBound,
        child: saved.child,
        teethRecords: saved.teethRecords,
        recheckReminders: saved.recheckReminders,
        recheckHistory: saved.recheckHistory,
        clinicRecords: saved.clinicRecords
      });
    } else {
      set({ initialized: true });
    }
  },

  switchRole: (role: AppRole, entryCode?: string) => {
    if (role === 'clinic') {
      if (entryCode !== CLINIC_ENTRY_CODE) {
        console.log('[Store] 前台入口码错误');
        return false;
      }
    }
    const state = get();
    const newState: PersistState = {
      role,
      isBound: state.isBound,
      child: state.child,
      teethRecords: state.teethRecords,
      recheckReminders: state.recheckReminders,
      recheckHistory: state.recheckHistory,
      clinicRecords: state.clinicRecords
    };
    set(newState);
    saveToStorage(newState);
    console.log('[Store] 切换角色为:', role);
    return true;
  },

  bindChildByCode: async (code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const isInWhitelist = VALID_REGISTER_CODES.includes(code.trim().toUpperCase());
    if (!isInWhitelist) {
      console.log('[Store] 登记码不在白名单中，绑定失败:', code);
      return false;
    }
    const newState: PersistState = {
      role: 'parent',
      isBound: true,
      child: { ...mockChild, registerCode: code.trim().toUpperCase() },
      teethRecords: mockTeethRecords,
      recheckReminders: mockRecheckReminders,
      recheckHistory: mockRecheckHistory,
      clinicRecords: get().clinicRecords
    };
    set(newState);
    saveToStorage(newState);
    console.log('[Store] 绑定成功，登记码:', code);
    return true;
  },

  unbindChild: () => {
    const current = get();
    current.teethRecords.forEach((t) => {
      if (t.parentFeedback?.photoUrl) deleteSavedFile(t.parentFeedback.photoUrl);
    });
    const emptyState: PersistState = {
      role: 'parent',
      isBound: false,
      child: null,
      teethRecords: [],
      recheckReminders: [],
      recheckHistory: [],
      clinicRecords: current.clinicRecords
    };
    set(emptyState);
    saveToStorage(emptyState);
    try { Taro.removeStorageSync(STORAGE_KEY); } catch (e) {}
    console.log('[Store] 已解绑');
  },

  saveFeedbackPhoto: async (tempFilePath: string, _toothId: string) => {
    try {
      const saveRes = await Taro.saveFile({ tempFilePath });
      console.log('[Store] 照片已保存:', saveRes.savedFilePath);
      return saveRes.savedFilePath;
    } catch (e) {
      console.error('[Store] 保存照片失败', e);
      throw e;
    }
  },

  updateTeethFeedback: (toothId: string, feedback: ParentFeedback, oldPhotoUrl?: string) => {
    set((state) => {
      if (oldPhotoUrl && oldPhotoUrl !== feedback.photoUrl) deleteSavedFile(oldPhotoUrl);
      const newTeeth = state.teethRecords.map((t) =>
        t.id === toothId ? { ...t, parentFeedback: feedback } : t
      );
      const newState: PersistState = {
        role: state.role,
        isBound: state.isBound,
        child: state.child,
        teethRecords: newTeeth,
        recheckReminders: state.recheckReminders,
        recheckHistory: state.recheckHistory,
        clinicRecords: state.clinicRecords
      };
      saveToStorage(newState);
      console.log('[Store] 牙齿反馈已更新:', toothId);
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
          ? { ...r, status: 'handled' as const, choice, appointmentDate, handleDate: nowISO().split('T')[0] }
          : r
      );

      const teethDetails = state.teethRecords
        .filter((t) => reminder.toothIds.includes(t.id))
        .map((t) => ({ toothId: t.id, toothNumber: t.toothNumber, toothName: t.toothName }));

      const clinicRecord: ClinicRecheckRecord = {
        id: `CR-${Date.now()}`,
        submittedAt: nowISO(),
        reminderId: reminder.id,
        child: {
          id: child.id, name: child.name, gender: child.gender,
          age: child.age, registerCode: child.registerCode, contactPhone: '138****1234'
        },
        clinicName: child.clinicName,
        teeth: teethDetails,
        recheckWeek: reminder.recheckWeek,
        parentChoice: choice,
        appointmentDate: appointmentDate,
        isUrgent: reminder.isUrgent,
        processStatus: 'pending'
      };

      const newClinicRecords = [clinicRecord, ...state.clinicRecords];
      const newState: PersistState = {
        role: state.role,
        isBound: state.isBound,
        child: state.child,
        teethRecords: state.teethRecords,
        recheckReminders: newReminders,
        recheckHistory: state.recheckHistory,
        clinicRecords: newClinicRecords
      };
      saveToStorage(newState);
      console.log('[Store] 复查选择已提交,生成诊所记录ID:', clinicRecord.id);
      console.log('[Store] 诊所记录详情:', JSON.stringify(clinicRecord, null, 2));
      return { recheckReminders: newReminders, clinicRecords: newClinicRecords };
    });
  },

  processClinicRecord: (recordId: string, processStatus: ProcessStatus, remark?: string, operator: string = '前台') => {
    set((state) => {
      const record = state.clinicRecords.find((r) => r.id === recordId);
      if (!record) return state;

      const newClinicRecords = state.clinicRecords.map((r) =>
        r.id === recordId
          ? { ...r, processStatus, processRemark: remark, processTime: nowISO(), processOperator: operator }
          : r
      );

      const newState: PersistState = {
        role: state.role,
        isBound: state.isBound,
        child: state.child,
        teethRecords: state.teethRecords,
        recheckReminders: state.recheckReminders,
        recheckHistory: state.recheckHistory,
        clinicRecords: newClinicRecords
      };
      saveToStorage(newState);
      console.log(`[Store] 前台处理记录: ${recordId} -> ${processStatus}, 备注: ${remark || '(无)'}`);
      return { clinicRecords: newClinicRecords };
    });
  },

  getClinicRecordsByFilter: (filter) => {
    const { status, choice, keyword } = filter;
    return get().clinicRecords.filter((r) => {
      if (status && status !== 'all' && r.processStatus !== status) return false;
      if (choice && choice !== 'all' && r.parentChoice !== choice) return false;
      if (keyword) {
        const kw = keyword.toLowerCase().trim();
        if (!kw) return true;
        const matchName = r.child.name.toLowerCase().includes(kw);
        const matchCode = r.child.registerCode.toLowerCase().includes(kw);
        const matchPhone = (r.child.contactPhone || '').includes(kw);
        return matchName || matchCode || matchPhone;
      }
      return true;
    });
  },

  getRecordByReminderId: (reminderId: string) => {
    return get().clinicRecords.find((r) => r.reminderId === reminderId);
  }
}));
