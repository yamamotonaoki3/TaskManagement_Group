import { closestCenter, type CollisionDetection, DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, PointerSensor, rectIntersection, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { GroupResponse, ListResponse, TaskCreateRequest, TaskResponse, TaskUpdateRequest } from '../../types/task';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import modalStyles from '../TaskCreateModal/TaskCreateModal.module.css';
import styles from './GroupSection.module.css';

const LIST_NAME_TO_STATUS: Record<string, 'todo' | 'in_progress' | 'done'> = {
  'やること': 'todo',
  '進行中': 'in_progress',
  '完了': 'done',
};

interface Props {
  group: GroupResponse;
  currentUserId: number;
  lists: ListResponse[];
  columns: Record<string, TaskResponse[]>;
  columnOrder: string[];
  isSearching: boolean;
  onCreate: (data: TaskCreateRequest) => Promise<void>;
  onUpdate: (id: number, data: TaskUpdateRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDeleteList: (id: number) => Promise<void>;
  onReorder: (listId: number, taskIds: number[]) => Promise<void>;
  onReorderColumns: (ids: number[]) => void;
  onAddList: (name: string, groupId: number) => Promise<void>;
  patchStatus: (id: number, data: { status: 'todo' | 'in_progress' | 'done'; listId: number; position: number }) => Promise<void>;
}

export function GroupSection({
  group,
  currentUserId,
  lists,
  columns,
  columnOrder,
  isSearching,
  onCreate,
  onUpdate,
  onDelete,
  onDeleteList,
  onReorder,
  onReorderColumns,
  onAddList,
  patchStatus,
}: Props) {
  const navigate = useNavigate();
  const [overColumnId, setOverColumnId] = useState<number | null>(null);
  const activeTypeRef = useRef<'column' | 'task' | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);
  const isOwner = group.ownerUserId === currentUserId;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === 'column') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => String(c.id).startsWith('list-'),
        ),
      });
    }
    return rectIntersection(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    activeTypeRef.current = event.active.data.current?.type ?? 'task';
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (activeTypeRef.current === 'column') return;
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const overId = String(over.id);
    if (overId.startsWith('col-')) {
      setOverColumnId(Number(overId.replace('col-', '')));
    } else {
      const allTasks = Object.values(columns).flat();
      const overTask = allTasks.find((t) => t.id === Number(overId));
      setOverColumnId(overTask ? overTask.listId : null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) { activeTypeRef.current = null; setOverColumnId(null); return; }

    if (activeTypeRef.current === 'column') {
      const activeListId = Number(String(active.id).replace('list-', ''));
      const overIdStr = String(over.id);
      let overListId: number;
      if (overIdStr.startsWith('col-')) {
        overListId = Number(overIdStr.replace('col-', ''));
      } else if (overIdStr.startsWith('list-')) {
        overListId = Number(overIdStr.replace('list-', ''));
      } else {
        const allTasks = Object.values(columns).flat();
        const overTask = allTasks.find((t) => t.id === Number(overIdStr));
        if (!overTask) { activeTypeRef.current = null; return; }
        overListId = overTask.listId;
      }
      if (activeListId !== overListId) {
        const currentOrder = columnOrder.map((id) => Number(id));
        const fromIndex = currentOrder.indexOf(activeListId);
        const toIndex = currentOrder.indexOf(overListId);
        onReorderColumns(arrayMove(currentOrder, fromIndex, toIndex));
      }
      activeTypeRef.current = null;
      return;
    }

    const taskId = Number(active.id);
    const overId = String(over.id);
    const allTasks = Object.values(columns).flat();
    const activeTask = allTasks.find((t) => t.id === taskId);
    if (!activeTask) { setOverColumnId(null); return; }

    if (overId.startsWith('col-')) {
      const targetListId = Number(overId.replace('col-', ''));
      if (activeTask.listId !== targetListId) {
        const targetListName = lists.find((l) => l.id === targetListId)?.name ?? '';
        const targetStatus = LIST_NAME_TO_STATUS[targetListName] ?? activeTask.status;
        const targetTasks = allTasks.filter((t) => t.listId === targetListId);
        patchStatus(taskId, { status: targetStatus, listId: targetListId, position: targetTasks.length });
      }
    } else {
      const overTaskId = Number(overId);
      if (taskId !== overTaskId) {
        const overTask = allTasks.find((t) => t.id === overTaskId);
        if (overTask) {
          if (activeTask.listId === overTask.listId) {
            const columnTasks = columns[String(activeTask.listId)] ?? [];
            const overIndex = columnTasks.findIndex((t) => t.id === overTaskId);
            patchStatus(taskId, { status: activeTask.status, listId: activeTask.listId, position: overIndex });
          } else {
            const targetListName = lists.find((l) => l.id === overTask.listId)?.name ?? '';
            const targetStatus = LIST_NAME_TO_STATUS[targetListName] ?? activeTask.status;
            const targetTasks = columns[String(overTask.listId)] ?? [];
            const overIndex = targetTasks.findIndex((t) => t.id === overTaskId);
            const activeCenterY = active.rect.current.translated
              ? (active.rect.current.translated.top + active.rect.current.translated.bottom) / 2
              : 0;
            const overMidY = (over.rect.top + over.rect.bottom) / 2;
            const position = activeCenterY > overMidY ? overIndex + 1 : overIndex;
            patchStatus(taskId, { status: targetStatus, listId: overTask.listId, position });
          }
        }
      }
    }
    activeTypeRef.current = null;
    setOverColumnId(null);
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    setAddingList(true);
    await onAddList(newListName.trim(), group.id);
    setNewListName('');
    setShowAddList(false);
    setAddingList(false);
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.groupName}>{group.name}</span>
        <button
          className={styles.manageButton}
          disabled={!isOwner}
          onClick={() => navigate(`/groups/${group.id}/manage`)}
        >
          メンバー管理
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnOrder.map((id) => `list-${id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className={styles.columns}>
            {columnOrder.map((listId, index) => {
              const list = lists.find((l) => String(l.id) === listId);
              if (!list) return null;
              const tasks = columns[listId] ?? [];
              return (
                <KanbanColumn
                  key={listId}
                  listId={list.id}
                  listName={list.name}
                  groupId={group.id}
                  tasks={tasks}
                  isSearching={isSearching}
                  isOver={overColumnId === list.id}
                  showAddButton={index === 0}
                  isDefault={list.isDefault}
                  onCreate={onCreate}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDeleteList={onDeleteList}
                  onReorder={onReorder}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className={styles.addListRow}>
        <button className={styles.addListButton} onClick={() => setShowAddList(true)}>
          ＋ カラム追加
        </button>
      </div>

      {showAddList && (
        <div className={modalStyles.overlay} onClick={() => setShowAddList(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={modalStyles.title}>カラムを追加</h3>
            <div className={modalStyles.form}>
              <label className={modalStyles.label}>
                カラム名 <span className={modalStyles.required}>*</span>
                <input
                  className={modalStyles.input}
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="カラム名を入力"
                  maxLength={30}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); }}
                />
              </label>
              <div className={modalStyles.actions}>
                <button
                  type="button"
                  className={modalStyles.cancelButton}
                  onClick={() => { setShowAddList(false); setNewListName(''); }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className={modalStyles.submitButton}
                  disabled={!newListName.trim() || addingList}
                  onClick={handleAddList}
                >
                  {addingList ? '追加中...' : '追加する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
