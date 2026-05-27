import { useEffect, useState } from 'react';

import { useGroups } from '../../hooks/useGroups';
import type { GroupMemberResponse, TaskResponse, TaskUpdateRequest } from '../../types/task';
import styles from './TaskDetailModal.module.css';

interface TaskDetailModalProps {
  task: TaskResponse;
  onClose: () => void;
  onUpdate: (id: number, data: TaskUpdateRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TaskDetailModal({ task, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [priority, setPriority] = useState(task.priority ?? 'medium');
  const [assigneeUserId, setAssigneeUserId] = useState<number | null>(task.assigneeUserId);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getMembers } = useGroups();

  useEffect(() => {
    if (task.groupId != null) {
      getMembers(task.groupId).then(setMembers).catch(() => {});
    }
  }, [task.groupId, getMembers]);

  const handleDelete = async () => {
    if (!window.confirm('このカードを削除してもよろしいですか？')) return;
    try {
      await onDelete(task.id);
      onClose();
    } catch {
      setError('データの保存に失敗しました。時間をおいて再度お試しください');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
      setError('期限に過去の日付は指定できません');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updateData: TaskUpdateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || null,
        priority: priority as 'high' | 'medium' | 'low',
      };
      if (task.groupId != null) {
        if (assigneeUserId === null) {
          updateData.clearAssignee = true;
        } else {
          updateData.assigneeUserId = assigneeUserId;
        }
      }
      await onUpdate(task.id, updateData);
      onClose();
    } catch {
      setError('データの保存に失敗しました。時間をおいて再度お試しください');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>タスクを編集</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            タイトル <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </label>
          <label className={styles.label}>
            説明
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </label>
          <label className={styles.label}>
            期限
            <input
              className={styles.input}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            優先度
            <select
              className={styles.select}
              value={priority ?? 'medium'}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          {task.groupId != null && (
            <label className={styles.label}>
              担当者
              <select
                className={styles.select}
                value={assigneeUserId ?? ''}
                onChange={(e) => setAssigneeUserId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">未割り当て</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.nickname}</option>
                ))}
              </select>
            </label>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.deleteButton} onClick={handleDelete}>
              削除する
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              キャンセル
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || submitting}
            >
              {submitting ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
