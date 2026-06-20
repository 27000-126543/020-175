import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import ToothCard from '@/components/ToothCard';
import { useAppStore } from '@/store';
import type { ToothStatus } from '@/types';

type FilterType = 'all' | ToothStatus;

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'sealed', label: '已封闭' },
  { key: 'observing', label: '待观察' },
  { key: 'recheck', label: '建议复查' }
];

const RecordsPage: React.FC = () => {
  const { isBound, child, teethRecords } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return teethRecords;
    return teethRecords.filter((t) => t.status === activeFilter);
  }, [teethRecords, activeFilter]);

  const counts = useMemo(() => ({
    all: teethRecords.length,
    sealed: teethRecords.filter((t) => t.status === 'sealed').length,
    observing: teethRecords.filter((t) => t.status === 'observing').length,
    recheck: teethRecords.filter((t) => t.status === 'recheck').length
  }), [teethRecords]);

  const goToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' });
  };

  if (!isBound) {
    return (
      <View className={styles.page}>
        <View className={styles.bindHint}>
          <Text className={styles.bindHintIcon}>🦷</Text>
          <Text className={styles.bindHintTitle}>还没有绑定孩子档案</Text>
          <Text className={styles.bindHintDesc}>
            绑定后即可查看窝沟封闭的详细记录，包括封闭的牙位、操作时间、注意事项等。
          </Text>
          <Button className={styles.bindHintBtn} onClick={goToProfile}>
            去绑定孩子
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>{child?.name}的窝沟封闭记录</Text>
        <Text className={styles.headerSubtitle}>
          每一颗做了封闭的牙齿都有详细记录，点击卡片可以查看封闭材料、医生说明和注意事项，还可以上传照片反馈情况哦。
        </Text>
        <View className={styles.totalBadge}>
          <Text>📝 共 {teethRecords.length} 颗牙齿记录</Text>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.filterTab, activeFilter === f.key && styles.activeTab)}
            onClick={() => setActiveFilter(f.key)}
          >
            <Text className={styles.filterLabel}>{f.label}</Text>
            <Text className={styles.filterCount}>{counts[f.key]}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>📋 牙齿记录</Text>
        <Text className={styles.sectionCount}>{filteredRecords.length} 颗</Text>
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🦷</Text>
          <Text className={styles.emptyTitle}>暂无该类型的记录</Text>
          <Text className={styles.emptyDesc}>可以切换其他筛选条件查看牙齿记录</Text>
        </View>
      ) : (
        <View className={styles.toothGrid}>
          {filteredRecords.map((record) => (
            <ToothCard key={record.id} record={record} />
          ))}
        </View>
      )}

      <View className={styles.legend}>
        <Text className={styles.legendTitle}>🔍 状态说明</Text>
        <View className={styles.legendItems}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.sealedDot)} />
            <Text className={styles.legendText}>已封闭 - 保护中，定期复查即可</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.observingDot)} />
            <Text className={styles.legendText}>待观察 - 需留意，按时复查</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.recheckDot)} />
            <Text className={styles.legendText}>建议复查 - 尽快联系诊所预约</Text>
          </View>
        </View>
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>💡 家长小贴士</Text>
        <Text className={styles.tipContent}>
          1. 窝沟封闭只是预防手段，仍需注意日常刷牙{'\n'}
          2. 建议每3-6个月带孩子进行口腔检查{'\n'}
          3. 如发现封闭剂脱落或孩子说咬合不适，请及时反馈或复诊
        </Text>
      </View>
    </View>
  );
};

export default RecordsPage;
