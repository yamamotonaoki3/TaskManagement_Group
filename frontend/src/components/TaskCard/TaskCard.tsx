import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSProperties, useState } from 'react';

import type { TaskResponse, TaskUpdateRequest } from '../../types/task';
import MemberAvatar from '../MemberAvatar/MemberAvatar';
import { TaskDetailModal } from '../TaskDetailModal/TaskDetailModal';
import styles from './TaskCard.module.css';

const PRIORITY_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

function getDueDateStyle(
  dueDate: string | null | undefined,
  status: string,
): { cardStyle: CSSProperties; dueTextStyle: CSSProperties } | undefined {
  if (status === 'done' || !dueDate) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft >= 8) return undefined;

  const intensity = Math.min(Math.max((7 - daysLeft) / 7, 0), 1);
  const saturation = intensity * 80;
  const lightness = 100 - intensity * 30;
  const textLightness = 50 - intensity * 10;

  return {
    cardStyle: { background: `hsl(0, ${saturation}%, ${lightness}%)` },
    dueTextStyle: { color: `hsl(0, ${intensity * 90}%, ${textLightness}%)` },
  };
}

interface TaskCardProps {
  task: TaskResponse;
  onUpdate: (id: number, data: TaskUpdateRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    attributes: { roleDescription: 'draggable task card' },
  });
  const dueDateStyle = getDueDateStyle(task.dueDate, task.status);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...dueDateStyle?.cardStyle,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
        onClick={() => !isDragging && setIsDetailOpen(true)}
      >
        <div className={styles.cardTop}>
          {task.priority && (
            <span className={styles.badge} data-priority={task.priority}>
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('このタスクを削除しますか？')) {
                onDelete(task.id);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="タスクを削除"
          >
            ×
          </button>
        </div>
        <p className={styles.title}>{task.title}</p>
        {task.dueDate && (
          <p className={styles.due} style={dueDateStyle?.dueTextStyle}>期限: {task.dueDate}</p>
        )}
        {task.assigneeNickname != null && task.assigneeUserId != null && (
          <div className={styles.assignee}>
            <MemberAvatar nickname={task.assigneeNickname} userId={task.assigneeUserId} size="sm" />
          </div>
        )}
      </div>
      {isDetailOpen && (
        <TaskDetailModal
          task={task}
          onClose={() => setIsDetailOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
