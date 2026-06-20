import React, { useState } from 'react';
import { View, Text, Input, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';

const ProfilePage: React.FC = () => {
  const { isBound, child, teethRecords, bindChildByCode, unbindChild } = useAppStore();
  const [code, setCode] = useState('');
  const [isBinding, setIsBinding] = useState(false);

  const handleBind = async () => {
    if (!code.trim()) {
      Taro.showToast({ title: '请输入登记码', icon: 'none' });
      return;
    }
    setIsBinding(true);
    try {
      const success = await bindChildByCode(code.trim().toUpperCase());
      if (success) {
        Taro.showToast({ title: '绑定成功', icon: 'success' });
      } else {
        Taro.showToast({ title: '登记码无效，请核对', icon: 'none' });
      }
    } catch (e) {
      console.error('[Profile] 绑定失败', e);
      Taro.showToast({ title: '绑定失败，请重试', icon: 'error' });
    } finally {
      setIsBinding(false);
    }
  };

  const handleUnbind = () => {
    Taro.showModal({
      title: '确认解绑',
      content: '解绑后将无法查看封闭记录和复查提醒，确定要解绑吗？',
      success: (res) => {
        if (res.confirm) {
          unbindChild();
          setCode('');
          Taro.showToast({ title: '已解绑', icon: 'success' });
        }
      }
    });
  };

  const sealedCount = teethRecords.filter((t) => t.status === 'sealed').length;
  const observingCount = teethRecords.filter((t) => t.status === 'observing').length;
  const recheckCount = teethRecords.filter((t) => t.status === 'recheck').length;

  return (
    <View className={styles.page}>
      {!isBound ? (
        <View className={styles.bindSection}>
          <View className={styles.bindHeader}>
            <View className={styles.bindIcon}>
              <Text className={styles.bindIconText}>🔐</Text>
            </View>
            <Text className={styles.bindTitle}>绑定孩子档案</Text>
            <Text className={styles.bindSubtitle}>输入诊所提供的登记码，查看封闭记录</Text>
          </View>

          <View className={styles.bindCard}>
            <View>
              <Text className={styles.inputLabel}>诊所登记码</Text>
              <View className={styles.inputWrap}>
                <Text className={styles.codeIcon}>📋</Text>
                <Input
                  className={styles.codeInput}
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                  placeholder="如：CLINIC-2026-88521"
                  placeholderClass={styles.inputPlaceholder}
                  maxlength={20}
                />
              </View>
            </View>

            <Text className={styles.tipText}>
              💡 <Text className={styles.tipHighlight}>每个孩子的登记码是唯一的</Text>，由诊所通过微信/短信发送，格式为：
              <Text className={styles.tipHighlight}>CLINIC-年份-5位数字</Text>
              {'\n'}示例：CLINIC-2026-88521、CLINIC-2026-99001
              {'\n'}请使用诊所发给您的真实登记码，自编号码将无法绑定。
              {'\n'}如未收到请联系诊所前台索取。
            </Text>

            <Button
              className={classnames(styles.bindButton, !code.trim() && styles.disabledBtn)}
              loading={isBinding}
              disabled={!code.trim()}
              onClick={handleBind}
            >
              {isBinding ? '绑定中...' : '立即绑定'}
            </Button>
          </View>
        </View>
      ) : (
        <View className={styles.profileSection}>
          <View className={styles.profileCard}>
            <View className={styles.profileHeader}>
              <View className={styles.avatar}>
                <Image
                  className={styles.avatarImg}
                  src={`https://picsum.photos/id/${child?.avatarId || 64}/200/200`}
                  mode="aspectFill"
                />
              </View>
              <View className={styles.childInfo}>
                <Text className={styles.childName}>{child?.name}</Text>
                <Text className={styles.childMeta}>
                  {child?.gender} · {child?.age}岁
                </Text>
                <View className={styles.codeTag}>{child?.registerCode}</View>
              </View>
            </View>

            <View className={styles.infoGrid}>
              <View className={styles.infoItem}>
                <Text className={styles.infoIcon}>🏥</Text>
                <Text className={styles.infoLabel}>就诊诊所</Text>
                <Text className={styles.infoValue}>{child?.clinicName}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoIcon}>👩‍⚕️</Text>
                <Text className={styles.infoLabel}>主治医生</Text>
                <Text className={styles.infoValue}>{child?.doctorName}</Text>
              </View>
            </View>
          </View>

          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={styles.statNum}>{sealedCount}</Text>
              <Text className={styles.statLabel}>已封闭</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNum, styles.orangeNum)}>{observingCount}</Text>
              <Text className={styles.statLabel}>待观察</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNum, styles.orangeRedNum)}>{recheckCount}</Text>
              <Text className={styles.statLabel}>需复查</Text>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📌 档案信息</Text>
            </View>
            <View className={styles.infoCard}>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>孩子姓名</Text>
                <Text className={styles.rowValue}>{child?.name}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>性别 / 年龄</Text>
                <Text className={styles.rowValue}>{child?.gender} / {child?.age}岁</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>诊所名称</Text>
                <Text className={styles.rowValue}>{child?.clinicName}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>主治医生</Text>
                <Text className={styles.rowValue}>{child?.doctorName}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>绑定日期</Text>
                <Text className={styles.rowValue}>{child?.bindDate}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.rowLabel}>封闭牙齿数</Text>
                <Text className={styles.rowValue}>共 {teethRecords.length} 颗牙齿</Text>
              </View>
            </View>
          </View>

          <Button className={styles.unbindBtn} onClick={handleUnbind}>
            解除绑定
          </Button>
        </View>
      )}
    </View>
  );
};

export default ProfilePage;
