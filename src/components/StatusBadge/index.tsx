import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ToothStatus } from '@/types';

interface StatusBadgeProps {
  status: ToothStatus;
  size?: 'sm' | 'md';
}

const statusMap: Record<ToothStatus, { label: string; className: string }> = {
  sealed: { label: '已封闭', className: 'sealed' },
  observing: { label: '待观察', className: 'observing' },
  recheck: { label: '建议复查', className: 'recheck' }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusMap[status];
  return (
    <View className={classnames(styles.badge, styles[config.className], size === 'sm' && styles.sm)}>
      <Text className={styles.dot} />
      <Text className={styles.text}>{config.label}</Text>    </View>
  );
};

export default StatusBadge;
