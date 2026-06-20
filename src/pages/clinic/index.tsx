import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore, processStatusMap } from '@/store';
import type { ClinicRecheckRecord, ProcessStatus, RecheckChoice } from '@/types';

type StatusFilter = 'all' | ProcessStatus | 'handled';
type ChoiceFilter = 'all' | RecheckChoice;
type GroupFilter = 'all' | 'today' | 'tomorrow' | 'none';

const statusFilters: Array<{ key: StatusFilter; label: string; color?: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理', color: '#F97316' },
  { key: 'handled', label: '已处理', color: '#8B5CF6' },
  { key: 'contacted', label: '已联系', color: '#3B82F6' },
  { key: 'scheduled', label: '已预约', color: '#10B981' },
  { key: 'completed', label: '已完成', color: '#6B7280' }
];

const groupFilters: Array<{ key: GroupFilter; label: string; icon: string }> = [
  { key: 'all', label: '全部预约', icon: '📋' },
  { key: 'today', label: '今天到店', icon: '☀️' },
  { key: 'tomorrow', label: '明天到店', icon: '🌅' },
  { key: 'none', label: '未定日期', icon: '❓' }
];

const choiceFilters: Array<{ key: ChoiceFilter; label: string; icon: string }> = [
  { key: 'all', label: '全部方式', icon: '🔍' },
  { key: 'appointment', label: '预约到店', icon: '📅' },
  { key: 'call', label: '电话咨询', icon: '📞' },
  { key: 'later', label: '暂不方便', icon: '⏰' }
];

const statusOptions: Array<{ key: ProcessStatus; label: string; desc: string; color: string }> = [
  { key: 'contacted', label: '已联系', desc: '电话已沟通', color: '#3B82F6' },
  { key: 'scheduled', label: '已预约', desc: '确定到店时间', color: '#10B981' },
  { key: 'completed', label: '已完成', desc: '已到店复查', color: '#6B7280' }
];

const choiceMeta: Record<RecheckChoice, { label: string; icon: string }> = {
  appointment: { label: '预约到店', icon: '📅' },
  call: { label: '电话咨询', icon: '📞' },
  later: { label: '暂不方便', icon: '⏰' }
};

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const date = d.toISOString().split('T')[0];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { date, time: `${hh}:${mm}` };
  } catch (e) {
    return { date: '-', time: '-' };
  }
};

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};
const isFollowUpDue = (followUpDate?: string) => {
  if (!followUpDate) return false;
  return followUpDate <= getTodayStr();
};
const getDateGroup = (appointmentDate?: string): GroupFilter => {
  if (!appointmentDate) return 'none';
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  if (appointmentDate === today) return 'today';
  if (appointmentDate === tomorrow) return 'tomorrow';
  return 'all';
};

const ClinicPage: React.FC = () => {
  const {
    role, clinicRecords, switchRole, processClinicRecord, getClinicRecordsByFilter
  } = useAppStore();

  const [entryCode, setEntryCode] = useState('');
  const [isEntering, setIsEntering] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [choiceFilter, setChoiceFilter] = useState<ChoiceFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicRecheckRecord | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus>('contacted');
  const [processRemark, setProcessRemark] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isClinic = role === 'clinic';

  const handleEnter = () => {
    if (!entryCode.trim()) {
      Taro.showToast({ title: '请输入前台入口码', icon: 'none' });
      return;
    }
    setIsEntering(true);
    const ok = switchRole('clinic', entryCode.trim().toUpperCase());
    setTimeout(() => {
      setIsEntering(false);
      if (ok) {
        Taro.showToast({ title: '进入前台管理', icon: 'success' });
      } else {
        Taro.showToast({ title: '入口码错误', icon: 'error' });
      }
    }, 600);
  };

  const handleExit = () => {
    Taro.showModal({
      title: '退出前台管理',
      content: '确定要退出前台管理模式，返回家长端吗？',
      success: (res) => {
        if (res.confirm) {
          switchRole('parent');
          Taro.switchTab({ url: '/pages/profile/index' });
        }
      }
    });
  };

  const stats = useMemo(() => ({
    total: clinicRecords.length,
    pending: clinicRecords.filter((r) => r.processStatus === 'pending').length,
    contacted: clinicRecords.filter((r) => r.processStatus === 'contacted').length,
    scheduled: clinicRecords.filter((r) => r.processStatus === 'scheduled').length,
    completed: clinicRecords.filter((r) => r.processStatus === 'completed').length,
    handled: clinicRecords.filter((r) => r.processStatus !== 'pending').length,
    followUpDue: clinicRecords.filter((r) => r.processStatus !== 'completed' && isFollowUpDue(r.nextFollowUpDate)).length
  }), [clinicRecords]);

  const filteredRecords = useMemo(() => {
    const baseFiltered = getClinicRecordsByFilter({
      status: statusFilter,
      choice: choiceFilter,
      keyword
    });

    if (groupFilter === 'all') return baseFiltered;

    const today = getTodayStr();
    const tomorrow = getTomorrowStr();

    return baseFiltered.filter((r) => {
      if (groupFilter === 'today') return r.appointmentDate === today;
      if (groupFilter === 'tomorrow') return r.appointmentDate === tomorrow;
      if (groupFilter === 'none') return !r.appointmentDate;
      return true;
    });
  }, [statusFilter, choiceFilter, groupFilter, keyword, getClinicRecordsByFilter]);

  const groupedRecords = useMemo(() => {
    if (groupFilter !== 'all') return { all: filteredRecords };

    const today = getTodayStr();
    const tomorrow = getTomorrowStr();

    const groups: Record<string, ClinicRecheckRecord[]> = {
      today: [],
      tomorrow: [],
      later: [],
      none: []
    };

    filteredRecords.forEach((r) => {
      if (!r.appointmentDate) {
        groups.none.push(r);
      } else if (r.appointmentDate === today) {
        groups.today.push(r);
      } else if (r.appointmentDate === tomorrow) {
        groups.tomorrow.push(r);
      } else {
        groups.later.push(r);
      }
    });

    return groups;
  }, [filteredRecords, groupFilter]);

  const openProcessModal = (record: ClinicRecheckRecord) => {
    setSelectedRecord(record);
    setSelectedStatus('contacted');
    setProcessRemark(record.processRemark || '');
    setNextFollowUpDate(record.nextFollowUpDate || '');
    setShowProcessModal(true);
  };

  const handleQuickAction = (record: ClinicRecheckRecord, status: ProcessStatus) => {
    const defaultRemark = status === 'contacted'
      ? '已电话联系家长确认'
      : status === 'scheduled'
        ? `已预约${record.appointmentDate || '复查时间'}`
        : '已到店完成复查，情况良好';
    processClinicRecord(record.id, status, defaultRemark);
    Taro.showToast({ title: '操作成功', icon: 'success' });
  };

  const handleConfirmProcess = async () => {
    if (!selectedRecord) return;
    if (!selectedStatus) {
      Taro.showToast({ title: '请选择处理状态', icon: 'none' });
      return;
    }
    setIsProcessing(true);
    try {
      processClinicRecord(
        selectedRecord.id,
        selectedStatus,
        processRemark || undefined,
        undefined,
        nextFollowUpDate || undefined
      );
      setShowProcessModal(false);
      Taro.showToast({ title: '处理结果已保存', icon: 'success' });
    } catch (e) {
      Taro.showToast({ title: '保存失败', icon: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRecordCard = (record: ClinicRecheckRecord) => {
    const submitted = formatDateTime(record.submittedAt);
    const processed = record.processTime ? formatDateTime(record.processTime) : null;
    const statusMeta = processStatusMap[record.processStatus];
    const isCompleted = record.processStatus === 'completed';
    const followUpDue = isFollowUpDue(record.nextFollowUpDate);

    return (
      <View
        key={record.id}
        className={classnames(
          styles.recordCard,
          record.isUrgent && record.processStatus === 'pending' && styles.urgentCard,
          isCompleted && styles.completedCard,
          followUpDue && !isCompleted && styles.followUpDueCard
        )}
      >
        <View className={styles.cardHeader}>
          <View className={styles.headerLeft}>
            <Text className={styles.childName}>
              👶 {record.child.name}
              {record.isUrgent && record.processStatus === 'pending' && (
                <Text style={{ color: '#F97316', fontSize: '24rpx', marginLeft: '12rpx' }}>🔥紧急</Text>
              )}
              {followUpDue && !isCompleted && (
                <Text style={{ color: '#EF4444', fontSize: '24rpx', marginLeft: '12rpx' }}>⏰待跟进</Text>
              )}
            </Text>
            <Text className={styles.childMeta}>
              {record.child.gender} · {record.child.age}岁 · {record.child.registerCode}
            </Text>
            {record.child.contactPhone && (
              <Text className={styles.childMeta}>📞 {record.child.contactPhone}</Text>
            )}
          </View>
          <View
            className={styles.statusTag}
            style={{ backgroundColor: `${statusMeta.color}15`, color: statusMeta.color }}
          >
            {statusMeta.label}
          </View>
        </View>

        <View className={styles.choiceRow}>
          <View className={styles.choiceItem}>
            <Text className={styles.choiceIcon}>{choiceMeta[record.parentChoice].icon}</Text>
            <Text className={styles.choiceText}>{choiceMeta[record.parentChoice].label}</Text>
          </View>
          {record.appointmentDate && (
            <View className={styles.choiceItem}>
              <Text className={styles.choiceIcon}>🗓️</Text>
              <Text className={styles.choiceText}>约 {record.appointmentDate}</Text>
            </View>
          )}
          <View className={styles.choiceItem}>
            <Text className={styles.choiceIcon}>📆</Text>
            <Text className={styles.choiceText}>{record.recheckWeek}</Text>
          </View>
        </View>

        <View className={styles.teethRow}>
          {record.teeth.map((t) => (
            <View key={t.toothId} className={styles.toothTag}>
              {t.toothNumber} {t.toothName}
            </View>
          ))}
        </View>

        <View className={styles.timeRow}>
          <View className={styles.timeItem}>
            <Text>🕒</Text>
            <Text>提交 {submitted.date} {submitted.time}</Text>
          </View>
          {processed && (
            <View className={styles.timeItem}>
              <Text>✅</Text>
              <Text>处理 {processed.date} {processed.time}</Text>
            </View>
          )}
        </View>

        {record.nextFollowUpDate && !isCompleted && (
          <View
            className={classnames(styles.followUpRow, followUpDue && styles.followUpRowDue)}
          >
            <Text className={styles.followUpIcon}>⏰</Text>
            <Text className={styles.followUpLabel}>下次跟进：{record.nextFollowUpDate}

            {followUpDue && <Text className={styles.followUpBadge}>已到期</Text>}

          </View>
        )}

        {record.processStatus !== 'pending' && (
          <View className={styles.processInfo}>
            <View className={styles.processRow}>
              <Text className={styles.processLabel}>处理人：</Text>
              <Text className={styles.processValue}>{record.processOperator || '前台'}</Text>
            </View>
            {record.processRemark && (
              <View className={styles.processRow}>
                <Text className={styles.processLabel}>处理备注：</Text>
                <Text className={styles.processValue}>{record.processRemark}</Text>
              </View>
            )}
          </View>
        )}

        {!isCompleted && (
          <View className={styles.actionRow}>
            {record.processStatus === 'pending' && (
              <Button
                className={classnames(styles.actionBtn, styles.actionContact)}
                onClick={() => handleQuickAction(record, 'contacted')}
              >
                📞 标记已联系
              </Button>
            )}
            {(record.processStatus === 'pending' || record.processStatus === 'contacted') && (
              <Button
                className={classnames(styles.actionBtn, styles.actionSchedule)}
                onClick={() => handleQuickAction(record, 'scheduled')}
              >
                ✅ 标记已预约
              </Button>
            )}
            <Button
              className={classnames(styles.actionBtn, styles.actionComplete)}
              onClick={() => openProcessModal(record)}
            >
              ⚙️ 详细处理
            </Button>
          </View>
        )}

        {isCompleted && (
          <View className={styles.processedHint}>
            ✓ 该记录已完成处理
          </View>
        )}
      </View>
    );
  };

  const openDatePicker = (type: 'appointment' | 'followup') => {
    const today = getTodayStr();
    Taro.showActionSheet({
      itemList: [`今天 (${today})`, `明天 (${getTomorrowStr()})`, '后天', '3天后', '1周后', '不设置'],
      success: (res) => {
        const d = new Date();
        let dateStr = '';
        if (res.tapIndex === 0) dateStr = today;
        else if (res.tapIndex === 1) dateStr = getTomorrowStr();
        else if (res.tapIndex === 2) {
          d.setDate(d.getDate() + 2);
          dateStr = d.toISOString().split('T')[0];
        } else if (res.tapIndex === 3) {
          d.setDate(d.getDate() + 3);
          dateStr = d.toISOString().split('T')[0];
        } else if (res.tapIndex === 4) {
          d.setDate(d.getDate() + 7);
          dateStr = d.toISOString().split('T')[0];
        } else if (res.tapIndex === 5) {
          dateStr = '';
        }
        if (type === 'followup') {
          setNextFollowUpDate(dateStr);
        }
      }
    });
  };

  if (!isClinic) {
    return (
      <View className={styles.page}>
        <View className={styles.entrySection}>
          <View className={styles.entryHeader}>
            <View className={styles.entryIcon}>
              <Text className={styles.entryIconText}>🏥</Text>
            </View>
            <Text className={styles.entryTitle}>诊所前台管理</Text>
            <Text className={styles.entrySubtitle}>
              此入口供诊所前台人员使用{'\n'}
              可查看家长提交的复查请求并处理跟进
            </Text>
          </View>

          <View className={styles.entryCard}>
            <View>
              <Text className={styles.inputLabel}>前台入口码</Text>
              <View className={styles.inputWrap}>
                <Text className={styles.codeIcon}>🔑</Text>
                <Input
                  className={styles.codeInput}
                  value={entryCode}
                  onInput={(e) => setEntryCode(e.detail.value)}
                  placeholder="请输入前台入口码"
                  password
                  maxlength={20}
                />
              </View>
            </View>

            <Text className={styles.tipText}>
              💡 入口码由诊所管理员保管。{'\n'}
              示例入口码：<Text style={{ color: '#1E40AF', fontWeight: 'bold' }}>CLINIC2026</Text>
              {'\n'}如您是家长，请返回「孩子档案」页面输入孩子登记码。
            </Text>

            <Button
              className={classnames(styles.enterBtn, !entryCode.trim() && styles.disabledBtn)}
              loading={isEntering}
              disabled={!entryCode.trim()}
              onClick={handleEnter}
            >
              进入前台管理
            </Button>
          </View>

          <Button
            className={styles.backParentBtn}
            onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
          >
            ← 返回家长端
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page}>
      <View className={styles.topBar}>
        <Text className={styles.topTitle}>🏥 复查管理</Text>
        <Button className={styles.exitBtn} onClick={handleExit}>
          退出前台
        </Button>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.orangeNum)}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.purpleNum)}>{stats.handled}</Text>
          <Text className={styles.statLabel}>已处理</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.blueNum)}>{stats.contacted}</Text>
          <Text className={styles.statLabel}>已联系</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.greenNum)}>{stats.scheduled}</Text>
          <Text className={styles.statLabel}>已预约</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.grayNum)}>{stats.completed}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        {stats.followUpDue > 0 && (
          <View className={classnames(styles.statCard, styles.followUpCard)}>
            <Text className={classnames(styles.statNum, styles.redNum)}>{stats.followUpDue}</Text>
            <Text className={styles.statLabel}>待跟进⚠️</Text>
          </View>
        )}
      </View>

      <View className={styles.searchRow}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            placeholder="搜索孩子姓名 / 登记码 / 电话"
          />
        </View>
      </View>

      <View className={styles.tabsRow}>
        {statusFilters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.tab, statusFilter === f.key && styles.activeTab)}
            style={statusFilter === f.key && f.color ? { background: f.color } : undefined}
            onClick={() => setStatusFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.tabsRow}>
        {choiceFilters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.tab, choiceFilter === f.key && styles.activeTab)}
            onClick={() => setChoiceFilter(f.key)}
          >
            <Text>{f.icon} {f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.tabsRow}>
        {groupFilters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.tab, groupFilter === f.key && styles.activeTab)}
            style={groupFilter === f.key && f.key !== 'all' ? { background: '#0EA5E9' } : undefined}
            onClick={() => setGroupFilter(f.key)}
          >
            <Text>{f.icon} {f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>📋 复查记录列表</Text>
        <Text className={styles.sectionCount}>
          共 {filteredRecords.length} 条 / 总计 {stats.total}
        </Text>
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyTitle}>暂无匹配的记录</Text>
          <Text className={styles.emptyDesc}>
            {keyword ? '试试更换搜索关键词' : '家长提交复查请求后会在这里显示'}
          </Text>
        </View>
      ) : (
        (groupFilter === 'all' ? (
          <>
            {groupedRecords.today.length > 0 && (
              <View className={styles.groupSection}>
                <View className={styles.groupHeader}>
                  <Text className={styles.groupTitle}>☀️ 今天到店 ({groupedRecords.today.length})</Text>
                </View>
                {groupedRecords.today.map(renderRecordCard)}
              </View>
            )}
            {groupedRecords.tomorrow.length > 0 && (
              <View className={styles.groupSection}>
                <View className={styles.groupHeader}>
                  <Text className={styles.groupTitle}>🌅 明天到店 ({groupedRecords.tomorrow.length})</Text>
                </View>
                {groupedRecords.tomorrow.map(renderRecordCard)}
              </View>
            )}
            {groupedRecords.later.length > 0 && (
              <View className={styles.groupSection}>
                <View className={styles.groupHeader}>
                  <Text className={styles.groupTitle}>� 稍后到店 ({groupedRecords.later.length})</Text>
                </View>
                {groupedRecords.later.map(renderRecordCard)}
              </View>
            )}
            {groupedRecords.none.length > 0 && (
              <View className={styles.groupSection}>
                <View className={styles.groupHeader}>
                  <Text className={styles.groupTitle}>❓ 未定日期 ({groupedRecords.none.length})</Text>
                </View>
                {groupedRecords.none.map(renderRecordCard)}
              </View>
            )}
          </>
        ) : (
          filteredRecords.map(renderRecordCard)
        ))
      )}

      {showProcessModal && selectedRecord && (
        <View className={styles.modalOverlay} onClick={() => setShowProcessModal(false)}>
          <View className={classnames(styles.modalCard, styles.modalCardLarge)} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>处理复查记录</Text>
            <Text className={styles.modalSubtitle}>
              👶 {selectedRecord.child.name} · {choiceMeta[selectedRecord.parentChoice].label}
            </Text>

            <View className={styles.detailSection}>
              <Text className={styles.detailTitle}>📌 记录详情</Text>
              <View className={styles.detailGrid}>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>孩子姓名</Text>
                  <Text className={styles.detailValue}>
                    {selectedRecord.child.name} ({selectedRecord.child.gender}，{selectedRecord.child.age}岁)
                  </Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>登记码</Text>
                  <Text className={styles.detailValue}>{selectedRecord.child.registerCode}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>联系电话</Text>
                  <Text className={styles.detailValue}>{selectedRecord.child.contactPhone || '-'}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>提交时间</Text>
                  <Text className={styles.detailValue}>
                    {(() => {
                      const s = formatDateTime(selectedRecord.submittedAt);
                      return `${s.date} ${s.time}`;
                    })()}
                  </Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>家长选择</Text>
                  <Text className={styles.detailValue}>
                    {choiceMeta[selectedRecord.parentChoice].icon} {choiceMeta[selectedRecord.parentChoice].label}
                  </Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>预约日期</Text>
                  <Text className={styles.detailValue}>{selectedRecord.appointmentDate || '未选择'}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>复查周期</Text>
                  <Text className={styles.detailValue}>{selectedRecord.recheckWeek}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>紧急程度</Text>
                  <Text className={styles.detailValue}>
                    {selectedRecord.isUrgent ? '🔥 紧急' : '普通'}
                  </Text>
                </View>
              </View>

              <View className={styles.detailTeethSection}>
                <Text className={styles.detailLabel}>具体牙齿（{selectedRecord.teeth.length} 颗）</Text>
                <View className={styles.detailTeethRow}>
                  {selectedRecord.teeth.map((t) => (
                    <View key={t.toothId} className={styles.detailToothTag}>
                      {t.toothNumber} {t.toothName}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <Text className={styles.formLabel}>选择处理状态</Text>
            <View className={styles.statusOptions}>
              {statusOptions.map((opt) => {
                const isActive = selectedStatus === opt.key;
                return (
                  <View
                    key={opt.key}
                    className={classnames(styles.statusOpt, isActive && styles.statusOptActive)}
                    style={{
                      borderColor: isActive ? opt.color : undefined,
                      backgroundColor: isActive ? `${opt.color}08` : undefined
                    }}
                    onClick={() => setSelectedStatus(opt.key)}
                  >
                    <Text
                      className={styles.statusOptLabel}
                      style={{ color: opt.color }}
                    >
                      {opt.label}
                    </Text>
                    <Text className={styles.statusOptDesc}>{opt.desc}</Text>
                  </View>
                );
              })}
            </View>

            <Text className={styles.formLabel}>下次跟进时间（可选）</Text>
            <View
              className={styles.datePickerRow}
              onClick={() => openDatePicker('followup')}
            >
              <Text className={styles.dateLabel}>⏰ 下次跟进日期</Text>
              <Text className={classnames(styles.dateValue, !nextFollowUpDate && styles.datePlaceholder)}>
                {nextFollowUpDate || '👆 点击选择下次跟进日期'}
              </Text>
              <Text className={styles.arrowIcon}>›</Text>
            </View>

            <Text className={styles.formLabel}>处理备注（可选）</Text>
            <Textarea
              className={styles.textarea}
              value={processRemark}
              onInput={(e) => setProcessRemark(e.detail.value)}
              placeholder="例如：家长表示周六上午9点可以到店；孩子近期感冒，延后一周..."
              maxlength={200}
            />

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowProcessModal(false)}>
                取消
              </Button>
              <Button
                className={classnames(
                  styles.confirmBtn,
                  !selectedStatus && styles.confirmBtnDisabled
                )}
                loading={isProcessing}
                disabled={!selectedStatus || isProcessing}
                onClick={handleConfirmProcess}
              >
                确认保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ClinicPage;
