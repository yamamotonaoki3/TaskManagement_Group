import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import type { TaskCreateRequest, TaskResponse, TaskUpdateRequest } from '../../types/task';
import { TaskCard } from '../TaskCard/TaskCard';
import { TaskCreateModal } from '../TaskCreateModal/TaskCreateModal';
import styles from './KanbanColumn.module.css';

type SortKey = 'priority' | 'dueDate' | null;

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface KanbanColumnProps {
  listId: number;
  listName: string;
  tasks: TaskResponse[];
  isSearching: boolean;
  isOver: boolean;
  showAddButton: boolean;
  isDefault?: boolean;
  onCreate: (data: TaskCreateRequest) => Promise<void>;
  onUpdate: (id: number, data: TaskUpdateRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDeleteList: (id: number) => Promise<void>;
  onReorder: (listId: number, taskIds: number[]) => Promise<void>;
}

export function KanbanColumn({ listId, listName, tasks, isSearching, isOver, showAddButton, isDefault, onCreate, onUpdate, onDelete, onDeleteList, onReorder }: KanbanColumnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `col-${listId}` });
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${listId}`, data: { type: 'column' } });

  const handleDeleteList = async () => {
    if (!window.confirm('このカラムを削除してもよろしいですか？')) return;
    setDeleteError(null);
    try {
      await onDeleteList(listId);
    } catch (e: unknown) {
      const msg = isAxiosError(e) ? e.response?.data?.message : undefined;
      setDeleteError(msg ?? 'カラムの削除に失敗しました。');
    }
  };

  const handleSort = async (key: 'priority' | 'dueDate') => {
    const nextKey = sortKey === key ? null : key;
    setSortKey(nextKey);
    if (nextKey === null) return;
    const sorted = [...tasks].sort((a, b) => {
      if (nextKey === 'priority') {
        const pa = a.priority != null ? PRIORITY_ORDER[a.priority] : 3;
        const pb = b.priority != null ? PRIORITY_ORDER[b.priority] : 3;
        return pa - pb;
      }
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    await onReorder(listId, sorted.map(t => t.id));
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setSortableRef} className={styles.column} style={style}>
      <div className={styles.header}>
        <div className={styles.dragHandle} {...attributes} {...listeners}>⠿</div>
        <h2 className={styles.heading}>{listName}</h2>
        <div className={styles.headerRight}>
          <button
            className={`${styles.sortButton} ${sortKey === 'priority' ? styles.sortActive : ''}`}
            onClick={() => handleSort('priority')}
          >
            優先度順
          </button>
          <button
            className={`${styles.sortButton} ${sortKey === 'dueDate' ? styles.sortActive : ''}`}
            onClick={() => handleSort('dueDate')}
          >
            期限順
          </button>
          {showAddButton && (
            <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>+ 追加</button>
          )}
          {!isDefault && (
            <button className={styles.deleteListButton} onClick={handleDeleteList} title="カラムを削除">✕</button>
          )}
        </div>
      </div>
      {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
      <div ref={setDroppableRef} className={`${styles.cards} ${isOver ? styles.over : ''}`}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className={styles.empty}>
              {isSearching ? '一致するタスクはありません' : 'カードはありません'}
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
      {isModalOpen && (
        <TaskCreateModal
          listId={listId}
          onClose={() => setIsModalOpen(false)}
          onCreate={onCreate}
        />
      )}
    </div>
  );
}
