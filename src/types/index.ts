export type ToothStatus = 'sealed' | 'observing' | 'recheck';

export type RecheckChoice = 'appointment' | 'call' | 'later';

export interface ChildProfile {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  clinicName: string;
  doctorName: string;
  bindDate: string;
  registerCode: string;
  avatarId?: number;
}

export interface ToothRecord {
  id: string;
  toothNumber: string;
  toothName: string;
  position: 'upper' | 'lower' | 'left' | 'right';
  status: ToothStatus;
  operationDate: string;
  material: string;
  materialDesc: string;
  doctorNotes: string;
  precautions: string[];
  nextRecheckDate: string;
  parentFeedback?: ParentFeedback;
}

export interface ParentFeedback {
  hasDiscomfort: boolean;
  discomfortDesc?: string;
  isSuspectedFalling: boolean;
  photoUrl?: string;
  submitDate: string;
}

export interface RecheckReminder {
  id: string;
  childId: string;
  toothIds: string[];
  toothNames: string;
  recheckWeek: string;
  isUrgent: boolean;
  status: 'pending' | 'handled';
  choice?: RecheckChoice;
  appointmentDate?: string;
  handleDate?: string;
}

export interface RecheckHistory {
  id: string;
  childId: string;
  toothNames: string;
  recheckDate: string;
  result: string;
  doctor: string;
}

export type ProcessStatus = 'pending' | 'contacted' | 'scheduled' | 'completed';

export interface ClinicRecheckRecord {
  id: string;
  submittedAt: string;
  reminderId?: string;
  child: {
    id: string;
    name: string;
    gender: '男' | '女';
    age: number;
    registerCode: string;
    contactPhone?: string;
  };
  clinicName: string;
  teeth: {
    toothId: string;
    toothNumber: string;
    toothName: string;
  }[];
  recheckWeek: string;
  parentChoice: RecheckChoice;
  appointmentDate?: string;
  isUrgent: boolean;
  processStatus: ProcessStatus;
  processRemark?: string;
  processTime?: string;
  processOperator?: string;
}

export type AppRole = 'parent' | 'clinic';
