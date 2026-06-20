import React, { useState } from 'react';
import { View, Text, Image, Button, ScrollView, Input, Textarea, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import type { ToothRecord, ParentFeedback } from '@/types';
import { useAppStore } from '@/store';

interface ToothCardProps {
  record: ToothRecord;
}

const positionMap: Record<string, string> = {
  upper: '上颌',
  lower: '下颌'
};

const ToothCard: React.FC<ToothCardProps> = ({ record }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasDiscomfort, setHasDiscomfort] = useState(record.parentFeedback?.hasDiscomfort ?? false);
  const [isSuspectedFalling, setIsSuspectedFalling] = useState(record.parentFeedback?.isSuspectedFalling ?? false);
  const [discomfortDesc, setDiscomfortDesc] = useState(record.parentFeedback?.discomfortDesc ?? '');
  const [photoUrl, setPhotoUrl] = useState(record.parentFeedback?.photoUrl ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateTeethFeedback = useAppStore((s) => s.updateTeethFeedback);

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setPhotoUrl(res.tempFilePaths[0]);
    } catch (e) {
      console.error('[ToothCard] 选择图片失败', e);
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      const feedback: ParentFeedback = {
        hasDiscomfort,
        isSuspectedFalling,
        discomfortDesc: hasDiscomfort ? discomfortDesc : undefined,
        photoUrl: photoUrl || undefined,
        submitDate: new Date().toISOString().split('T')[0]
      };
      updateTeethFeedback(record.id, feedback);
      setShowFeedback(false);
      Taro.showToast({ title: '反馈已提交', icon: 'success' });
    } catch (e) {
      console.error('[ToothCard] 提交反馈失败', e);
      Taro.showToast({ title: '提交失败', icon: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className={classnames(styles.card, expanded && styles.expanded)}>
      <View className={styles.cardHeader} onClick={() => setExpanded(!expanded)}>
        <View className={styles.headerLeft}>
          <View className={styles.toothIcon}>
            <Text className={styles.toothIconText}>🦷</Text>
          </View>
          <View className={styles.toothInfo}>
            <Text className={styles.toothName}>{record.toothName}</Text>
            <Text className={styles.toothNumber}>
              #{record.toothNumber} · {positionMap[record.position]}
            </Text>
          </View>
        </View>
        <View className={styles.headerRight}>
          <StatusBadge status={record.status} size="sm" />
          <Text className={classnames(styles.arrow, expanded && styles.arrowUp)}>›</Text>
        </View>
      </View>

      <View className={styles.summary}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>操作日期</Text>
          <Text className={styles.summaryValue}>{record.operationDate}</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>下次复查</Text>
          <Text className={classnames(styles.summaryValue, record.status === 'recheck' && styles.urgentText)}>
            {record.nextRecheckDate}
          </Text>
        </View>
      </View>

      {expanded && (
        <View className={styles.detail}>
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🔬 封闭材料</Text>
            <View className={styles.materialBox}>
              <Text className={styles.materialName}>{record.material}</Text>
              <Text className={styles.materialDesc}>{record.materialDesc}</Text>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>👩‍⚕️ 医生说明</Text>
            <View className={styles.notesBox}>
              <Text className={styles.notesText}>{record.doctorNotes}</Text>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📋 注意事项</Text>
            <View className={styles.precautionsList}>
              {record.precautions.map((item, idx) => (
                <View className={styles.precautionItem} key={idx}>
                  <Text className={styles.precautionBullet}>•</Text>
                  <Text className={styles.precautionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {record.parentFeedback && !showFeedback && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>💬 我的反馈</Text>
              <View className={styles.feedbackBox}>
                <View className={styles.feedbackRow}>
                  <Text className={styles.feedbackLabel}>咬合不适：</Text>
                  <Text className={classnames(styles.feedbackValue, record.parentFeedback.hasDiscomfort && styles.warningText)}>
                    {record.parentFeedback.hasDiscomfort ? '是' : '否'}
                  </Text>
                </View>
                {record.parentFeedback.hasDiscomfort && record.parentFeedback.discomfortDesc && (
                  <View className={styles.feedbackRow}>
                    <Text className={styles.feedbackLabel}>详细描述：</Text>
                    <Text className={styles.feedbackDesc}>{record.parentFeedback.discomfortDesc}</Text>
                  </View>
                )}
                <View className={styles.feedbackRow}>
                  <Text className={styles.feedbackLabel}>疑似脱落：</Text>
                  <Text className={classnames(styles.feedbackValue, record.parentFeedback.isSuspectedFalling && styles.warningText)}>
                    {record.parentFeedback.isSuspectedFalling ? '是' : '否'}
                  </Text>
                </View>
                {record.parentFeedback.photoUrl && (
                  <View className={styles.feedbackPhoto}>
                    <Image src={record.parentFeedback.photoUrl} className={styles.photoImg} mode="aspectFill" />
                  </View>
                )}
                <Text className={styles.feedbackDate}>提交于 {record.parentFeedback.submitDate}</Text>
              </View>
              <View className={styles.feedbackActions}>
                <Button className={styles.editFeedbackBtn} onClick={() => setShowFeedback(true)}>
                  更新反馈
                </Button>
              </View>
            </View>
          )}

          {!record.parentFeedback && !showFeedback && (
            <View className={styles.section}>
              <Button className={styles.feedbackBtn} onClick={() => setShowFeedback(true)}>
                ✏️ 提交情况反馈
              </Button>
            </View>
          )}

          {showFeedback && (
            <View className={styles.feedbackForm}>
              <Text className={styles.formTitle}>填写情况反馈</Text>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>咬合不适</Text>
                <Switch
                  checked={hasDiscomfort}
                  onChange={(e) => setHasDiscomfort(e.detail.value)}
                  color="#10B981"
                />
              </View>

              {hasDiscomfort && (
                <View className={styles.formRowCol}>
                  <Text className={styles.formLabel}>请描述不适情况</Text>
                  <Textarea
                    className={styles.textarea}
                    value={discomfortDesc}
                    onInput={(e) => setDiscomfortDesc(e.detail.value)}
                    placeholder="例如：吃东西时会酸痛，咬硬物不舒服等"
                    maxlength={200}
                  />
                </View>
              )}

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>封闭剂疑似脱落</Text>
                <Switch
                  checked={isSuspectedFalling}
                  onChange={(e) => setIsSuspectedFalling(e.detail.value)}
                  color="#10B981"
                />
              </View>

              <View className={styles.formRowCol}>
                <Text className={styles.formLabel}>上传口内照片（可选）</Text>
                <View className={styles.photoUploader}>
                  {photoUrl ? (
                    <View className={styles.previewWrap}>
                      <Image src={photoUrl} className={styles.previewImg} mode="aspectFill" />
                      <View className={styles.removePhoto} onClick={() => setPhotoUrl('')}>
                        <Text className={styles.removePhotoText}>×</Text>
                      </View>
                    </View>
                  ) : (
                    <View className={styles.uploadBtn} onClick={handleChooseImage}>
                      <Text className={styles.uploadIcon}>📷</Text>
                      <Text className={styles.uploadText}>点击上传</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.formActions}>
                <Button className={styles.cancelBtn} onClick={() => setShowFeedback(false)}>
                  取消
                </Button>
                <Button className={styles.submitBtn} loading={isSubmitting} onClick={handleSubmitFeedback}>
                  提交反馈
                </Button>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ToothCard;
