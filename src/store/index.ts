import { create } from 'zustand';
import type { ChildProfile, ToothRecord, RecheckReminder, RecheckHistory, RecheckChoice, ParentFeedback } from '@/types';
import { mockChild, mockTeethRecords, mockRecheckReminders, mockRecheckHistory } from '@/data/mock';

interface AppState {
  isBound: boolean;
  child: ChildProfile | null;
  teethRecords: ToothRecord[];
  recheckReminders: RecheckReminder[];
  recheckHistory: RecheckHistory[];
  bindChildByCode: (code: string) => Promise<boolean>;
  unbindChild: () => void;
  updateTeethFeedback: (toothId: string, feedback: ParentFeedback) => void;
  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isBound: true,
  child: mockChild,
  teethRecords: mockTeethRecords,
  recheckReminders: mockRecheckReminders,
  recheckHistory: mockRecheckHistory,

  bindChildByCode: async (code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const valid = /^CLINIC-\d{4}-\d{5}$/.test(code);
    if (valid) {
      set({
        isBound: true,
        child: { ...mockChild, registerCode: code },
        teethRecords: mockTeethRecords,
        recheckReminders: mockRecheckReminders,
        recheckHistory: mockRecheckHistory
      });
      return true;
    }
    return false;
  },

  unbindChild: () => {
    set({
      isBound: false,
      child: null,
      teethRecords: [],
      recheckReminders: [],
      recheckHistory: []
    });
  },

  updateTeethFeedback: (toothId: string, feedback: ParentFeedback) => {
    set((state) => ({
      teethRecords: state.teethRecords.map((t) =>
        t.id === toothId ? { ...t, parentFeedback: feedback } : t
      )
    }));
  },

  handleRecheckChoice: (reminderId: string, choice: RecheckChoice, appointmentDate?: string) => {
    set((state) => ({
      recheckReminders: state.recheckReminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'handled', choice, appointmentDate, handleDate: new Date().toISOString().split('T')[0] }
          : r
      )
    }));
  }
}));
