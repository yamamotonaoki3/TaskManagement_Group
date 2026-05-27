import { useEffect, useState } from 'react';

import { useGroups } from '../../hooks/useGroups';
import type { GroupMemberResponse, TaskCreateRequest } from '../../types/task';
import styles from './TaskCreateModal.module.css';

interface TaskCreateModalProps {
  listId: number;
  groupId: number | null;
  onClose: () => void;
  onCreate: (data: TaskCreateRequest) => Promise<void>;
}

export function TaskCreateModal({ listId, groupId, onClose, onCreate }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [assigneeUserId, setAssigneeUserId] = useState<number | null>(null);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { getMembers } = useGroups();

  useEffect(() => {
    if (groupId != null) {
      getMembers(groupId).then(setMembers).catch(() => {});
    }
  }, [groupId, getMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({
        listId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        priority,
        assigneeUserId: groupId != null ? assigneeUserId : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>タスクを追加</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            タイトル <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスク名を入力"
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
              placeholder="説明（任意）"
              maxLength={2000}
              rows={3}
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
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          {groupId != null && (
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
          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              キャンセル
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || submitting}
            >
              {submitting ? '追加中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
