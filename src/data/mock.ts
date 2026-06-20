import type { ChildProfile, ToothRecord, RecheckReminder, RecheckHistory } from '@/types';

export const mockChild: ChildProfile = {
  id: 'C001',
  name: '小明',
  gender: '男',
  age: 7,
  clinicName: '悦齿儿童口腔诊所',
  doctorName: '李医生',
  bindDate: '2026-03-15',
  registerCode: 'CLINIC-2026-88521',
  avatarId: 64
};

export const mockTeethRecords: ToothRecord[] = [
  {
    id: 'T001',
    toothNumber: '16',
    toothName: '右上第一恒磨牙',
    position: 'upper',
    status: 'sealed',
    operationDate: '2026-03-15',
    material: '光固化树脂封闭剂',
    materialDesc: '美观耐磨，与牙齿颜色接近，粘结力强，保护期约3-5年',
    doctorNotes: '窝沟较深，封闭完整，边缘密合良好',
    precautions: [
      '封闭后2小时内请勿进食',
      '24小时内避免用患侧咀嚼硬物',
      '建议每3-6个月定期复查',
      '日常注意正确刷牙，使用牙线清洁牙缝'
    ],
    nextRecheckDate: '2026-09-15',
    parentFeedback: {
      hasDiscomfort: false,
      isSuspectedFalling: false,
      submitDate: '2026-03-16'
    }
  },
  {
    id: 'T002',
    toothNumber: '26',
    toothName: '左上第一恒磨牙',
    position: 'upper',
    status: 'sealed',
    operationDate: '2026-03-15',
    material: '光固化树脂封闭剂',
    materialDesc: '美观耐磨，与牙齿颜色接近，粘结力强，保护期约3-5年',
    doctorNotes: '窝沟较深，封闭完整',
    precautions: [
      '封闭后2小时内请勿进食',
      '24小时内避免用患侧咀嚼硬物',
      '如发现明显脱落请及时复诊'
    ],
    nextRecheckDate: '2026-09-15'
  },
  {
    id: 'T003',
    toothNumber: '36',
    toothName: '左下第一恒磨牙',
    position: 'lower',
    status: 'observing',
    operationDate: '2026-03-15',
    material: '玻璃离子封闭剂',
    materialDesc: '释放氟化物，可预防继发龋，适合刚萌出的恒牙，保护期约1-2年',
    doctorNotes: '牙齿正在萌出中，部分窝沟暴露，先做暂时性封闭，待完全萌出后复查',
    precautions: [
      '避免进食粘性食物如口香糖、奶糖',
      '每周自查封闭剂是否完整',
      '3个月后务必复查，可能需要重新封闭'
    ],
    nextRecheckDate: '2026-06-22',
    parentFeedback: {
      hasDiscomfort: true,
      discomfortDesc: '吃饭偶尔会觉得酸，过一会儿就好了',
      isSuspectedFalling: false,
      submitDate: '2026-05-10'
    }
  },
  {
    id: 'T004',
    toothNumber: '46',
    toothName: '右下第一恒磨牙',
    position: 'lower',
    status: 'recheck',
    operationDate: '2026-01-10',
    material: '光固化树脂封闭剂',
    materialDesc: '美观耐磨，与牙齿颜色接近，粘结力强',
    doctorNotes: '上次复查发现封闭剂边缘有磨损迹象，建议近期复查评估是否需补充',
    precautions: [
      '减少食用过硬食物',
      '注意观察是否有敏感或疼痛',
      '尽快安排复查时间'
    ],
    nextRecheckDate: '2026-06-22'
  },
  {
    id: 'T005',
    toothNumber: '55',
    toothName: '右上第二乳磨牙',
    position: 'upper',
    status: 'sealed',
    operationDate: '2026-03-15',
    material: '玻璃离子封闭剂',
    materialDesc: '释放氟化物保护乳牙，适合儿童配合度一般的情况',
    doctorNotes: '窝沟深，乳牙体积小，操作配合良好',
    precautions: [
      '勿用患侧咬硬物',
      '若脱落及时联系诊所',
      '6-12个月内该乳牙将逐渐替换'
    ],
    nextRecheckDate: '2026-09-15'
  },
  {
    id: 'T006',
    toothNumber: '75',
    toothName: '左下第二乳磨牙',
    position: 'lower',
    status: 'observing',
    operationDate: '2026-02-20',
    material: '玻璃离子封闭剂',
    materialDesc: '释放氟化物保护乳牙',
    doctorNotes: '该乳牙预计1-2年内替换，封闭剂边缘轻微不密合，建议观察',
    precautions: [
      '加强该区域刷牙',
      '若出现疼痛或牙龈肿胀请及时就诊'
    ],
    nextRecheckDate: '2026-08-20'
  }
];

export const mockRecheckReminders: RecheckReminder[] = [
  {
    id: 'R001',
    childId: 'C001',
    toothIds: ['T003', 'T004'],
    toothNames: '左下第一恒磨牙、右下第一恒磨牙',
    recheckWeek: '2026年6月第4周',
    isUrgent: true,
    status: 'pending'
  },
  {
    id: 'R002',
    childId: 'C001',
    toothIds: ['T006'],
    toothNames: '左下第二乳磨牙',
    recheckWeek: '2026年8月第3周',
    isUrgent: false,
    status: 'pending'
  }
];

export const mockRecheckHistory: RecheckHistory[] = [
  {
    id: 'H001',
    childId: 'C001',
    toothNames: '四颗第一恒磨牙',
    recheckDate: '2026-04-20',
    result: '封闭完整，窝沟清洁，继续保持',
    doctor: '李医生'
  },
  {
    id: 'H002',
    childId: 'C001',
    toothNames: '右上第一恒磨牙、左上第一恒磨牙',
    recheckDate: '2026-02-10',
    result: '封闭剂边缘良好，牙面无继发龋',
    doctor: '王医生'
  }
];
