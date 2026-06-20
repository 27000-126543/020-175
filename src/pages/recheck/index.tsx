import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import type { RecheckReminder, RecheckChoice } from '@/types';

interface ChoiceOption {
  key: RecheckChoice;
  icon: string;
  name: string;
  desc: string;
  color: string;
}

const choiceOptions: ChoiceOption[] = [
  { key: 'appointment', icon: '📅', name: '预约到店', desc: '选择合适的时间，到诊所复查', color: '#10B981' },
  { key: 'call', icon: '📞', name: '电话咨询', desc: '先和医生沟通了解情况', color: '#3B82F6' },
  { key: 'later', icon: '⏰', name: '暂不方便', desc: '过段时间再安排复查', color: '#F59E0B' }
];

const RecheckPage: React.FC = () => {
  const { isBound, child, recheckReminders, recheckHistory, handleRecheckChoice } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<RecheckReminder | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<RecheckChoice | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingReminders = useMemo(() => recheckReminders.filter((r) => r.status === 'pending'), [recheckReminders]);
  const handledReminders = useMemo(() => recheckReminders.filter((r) => r.status === 'handled'), [recheckReminders]);
  const urgentCount = useMemo(() => pendingReminders.filter((r) => r.isUrgent).length, [pendingReminders]);

  const goToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' });
  };

  const openModal = (reminder: RecheckReminder) => {
    setCurrentReminder(reminder);
    setSelectedChoice(null);
    setSelectedDate('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentReminder(null);
    setSelectedChoice(null);
    setSelectedDate('');
  };

  const handleChoiceSelect = (choice: RecheckChoice) => {
    setSelectedChoice(choice);
    if (choice === 'appointment') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      const mondayOffset = today.getDay() === 0 ? 1 : 8 - today.getDay();
      const nextMonday = addDays(mondayOffset > 7 ? 8 : mondayOffset);
      Taro.showActionSheet({
        itemList: [
          `明天 (${addDays(1)})`,
          `后天 (${addDays(2)})`,
          `本周六 (${getSaturday()})`,
          `下周一 (${nextMonday})`,
          `下周六 (${getNextSaturday()})`
        ]
      }).then((res) => {
        const dates = [addDays(1), addDays(2), getSaturday(), nextMonday, getNextSaturday()];
        setSelectedDate(dates[res.tapIndex]);
      }).catch(() => {});
    }
  };

  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getSaturday = () => {
    const d = new Date();
    const diff = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return d.toISOString().split('T')[0];
  };

  const getNextSaturday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7) + 7);
    return d.toISOString().split('T')[0];
  };

  const handleConfirmChoice = async () => {
    if (!selectedChoice || !currentReminder) return;
    setIsSubmitting(true);
    try {
      handleRecheckChoice(currentReminder.id, selectedChoice, selectedChoice === 'appointment' ? selectedDate : undefined);

      const choiceConfig = choiceOptions.find((c) => c.key === selectedChoice);

      if (selectedChoice === 'call') {
        Taro.showModal({
          title: '联系诊所',
          content: `是否拨打诊所电话？\n${child?.clinicName || '悦齿儿童口腔诊所'}`,
          confirmText: '拨打',
          success: (res) => {
            if (res.confirm) {
              console.log('[Recheck] 拨打电话模拟');
            }
          }
        });
      } else {
        Taro.showToast({
          title: `${choiceConfig?.name}已通知诊所`,
          icon: 'success'
        });
      }

      closeModal();
    } catch (e) {
      console.error('[Recheck] 提交失败', e);
      Taro.showToast({ title: '提交失败', icon: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const choiceTextMap: Record<RecheckChoice, string> = {
    appointment: '已预约到店',
    call: '已电话咨询',
    later: '已延后复查'
  };

  if (!isBound) {
    return (
      <View className={styles.page}>
        <View className={styles.bindHint}>
          <Text className={styles.bindHintIcon}>📅</Text>
          <Text className={styles.bindHintTitle}>还没有绑定孩子档案</Text>
          <Text className={styles.bindHintDesc}>
            绑定后即可收到复查提醒，及时安排复查时间，不错过每一次检查！
          </Text>
          <Button className={styles.bindHintBtn} onClick={goToProfile}>
            去绑定孩子
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>🔔 {child?.name}的复查提醒</Text>
        <Text className={styles.headerSubtitle}>
          按时复查可以及时发现封闭剂是否完整情况，确保持续保护孩子的牙齿健康。
        </Text>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={classnames(styles.statNum, styles.orangeNum)}>{urgentCount}</Text>
            <Text className={styles.statLabel}>本周需复查</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{pendingReminders.length}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{recheckHistory.length}</Text>
            <Text className={styles.statLabel}>已复查</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>⏰ 待复查</Text>
          {urgentCount > 0 && (
            <View className={styles.urgentTag}>
              <Text>🔥 {urgentCount} 项紧急</Text>
            </View>
          )}
        </View>

        {pendingReminders.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyTitle}>太棒了！暂无待复查</Text>
            <Text className={styles.emptyDesc}>
              目前没有需要处理的复查提醒。{'\n'}保持良好的口腔卫生习惯，定期检查哦~
            </Text>
          </View>
        ) : (
          pendingReminders.map((reminder) => (
            <View
              key={reminder.id}
              className={classnames(
                styles.reminderCard,
                reminder.isUrgent && styles.urgentBorderCard
              )}
            >
              <View className={styles.reminderHeader}>
                <View className={styles.reminderLeft}>
                  <Text className={styles.reminderWeek}>{reminder.recheckWeek}</Text>
                  <Text className={styles.reminderTeeth}>
                    需要复查：{reminder.toothNames}
                  </Text>
                </View>
                <View className={styles.statusBadgeRow}>
                  {reminder.isUrgent && (
                    <View className={styles.urgentBadge}>紧急</View>
                  )}
                </View>
              </View>

              <View className={styles.reminderInfo}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoIcon}>👶</Text>
                  <Text className={styles.infoText}>{child?.name}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoIcon}>🏥</Text>
                  <Text className={styles.infoText}>{child?.clinicName}</Text>
                </View>
              </View>

              <View className={styles.actionRow}>
                <Button
                  className={classnames(styles.actionBtn, styles.primaryBtn)}
                  onClick={() => openModal(reminder)}
                >
                  立即处理
                </Button>
                {reminder.isUrgent && (
                  <Button
                    className={classnames(styles.actionBtn, styles.warningBtn)}
                    onClick={() => {
                      Taro.showModal({
                        title: '联系诊所',
                        content: `是否直接联系${child?.clinicName}安排复查？`,
                        confirmText: '确定',
                        success: (res) => {
                          if (res.confirm) {
                            console.log('[Recheck] 联系诊所');
                            Taro.showToast({ title: '已通知诊所联系您', icon: 'success' });
                          }
                        }
                      });
                    }}
                  >
                    联系诊所
                  </Button>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {handledReminders.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>✅ 已处理</Text>
            <Text className={styles.sectionMore}>{handledReminders.length} 项</Text>
          </View>
          {handledReminders.map((reminder) => (
            <View
              key={reminder.id}
              className={classnames(styles.reminderCard, styles.handledCard)}
            >
              <View className={styles.reminderHeader}>
                <View className={styles.reminderLeft}>
                  <Text className={styles.reminderWeek}>{reminder.recheckWeek}</Text>
                  <Text className={styles.reminderTeeth}>
                    复查：{reminder.toothNames}
                  </Text>
                </View>
                <View className={styles.statusBadgeRow}>
                  <View className={styles.handledBadge}>已处理</View>
                </View>
              </View>

              <View className={styles.handledInfo}>
                <View className={styles.handledRow}>
                  <Text className={styles.handledIcon}>
                    {choiceOptions.find((c) => c.key === reminder.choice)?.icon || '✅'}
                  </Text>
                  <Text className={styles.handledText}>
                    {reminder.choice ? choiceTextMap[reminder.choice] : '已处理'}
                    {reminder.appointmentDate && ` · 预约${reminder.appointmentDate}`}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className={classnames(styles.section, styles.historySection)}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📜 复查历史</Text>
          <Text className={styles.sectionMore}>共 {recheckHistory.length} 次</Text>
        </View>

        {recheckHistory.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyTitle}>暂无复查历史</Text>
            <Text className={styles.emptyDesc}>完成复查后这里会显示历史记录</Text>
          </View>
        ) : (
          recheckHistory.map((history) => (
            <View key={history.id} className={styles.historyItem}>
              <View className={styles.historyHeader}>
                <Text className={styles.historyDate}>
                  🗓️ {history.recheckDate}
                </Text>
                <View className={styles.historyDoctor}>👩‍⚕️ {history.doctor}</View>
              </View>
              <Text className={styles.historyTeeth}>🦷 {history.toothNames}</Text>
              <View className={styles.historyResult}>
                <Text>{history.result}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {showModal && currentReminder && (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择复查方式</Text>
            <Text className={styles.modalSubtitle}>
              {currentReminder.recheckWeek} · {currentReminder.toothNames}
            </Text>

            {selectedChoice === 'appointment' && (
              <View className={styles.datePickerRow}>
                <Text className={styles.dateLabel}>预约日期</Text>
                <Text className={styles.dateValue}>
                  {selectedDate || '请选择日期'}
                </Text>
                <Text className={styles.arrowIcon}>›</Text>
              </View>
            )}

            <View className={styles.choiceList}>
              {choiceOptions.map((option) => (
                <View
                  key={option.key}
                  className={styles.choiceItem}
                  onClick={() => handleChoiceSelect(option.key)}
                >
                  <View
                    className={styles.choiceIcon}
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <Text>{option.icon}</Text>
                  </View>
                  <View className={styles.choiceText}>
                    <Text className={styles.choiceName} style={{ color: option.color }}>
                      {option.name}
                    </Text>
                    <Text className={styles.choiceDesc}>{option.desc}</Text>
                  </View>
                  <Text className={styles.arrowIcon}>
                    {selectedChoice === option.key ? '✓' : '›'}
                  </Text>
                </View>
              ))}
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={closeModal}>
                取消
              </Button>
              <Button
                className={styles.confirmBtn}
                loading={isSubmitting}
                disabled={!selectedChoice || (selectedChoice === 'appointment' && !selectedDate)}
                onClick={handleConfirmChoice}
              >
                确认
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RecheckPage;
