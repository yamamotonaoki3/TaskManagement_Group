import { closestCenter, type CollisionDetection, DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent,PointerSensor, rectIntersection, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove,horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useCallback,useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTasks } from '../../hooks/useTasks';
import { Header } from '../Header/Header';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import modalStyles from '../TaskCreateModal/TaskCreateModal.module.css';
import styles from './KanbanBoard.module.css';

const LIST_NAME_TO_STATUS: Record<string, 'todo' | 'in_progress' | 'done'> = {
  'やること': 'todo',
  '進行中': 'in_progress',
  '完了': 'done',
};

export function KanbanBoard() {
  const navigate = useNavigate();
  const { lists, columns, columnOrder, loading, error, query, setQuery, create, patchStatus, patchTask, addList, reorder, reorderColumns, deleteTask, removeList } = useTasks();
  const [overColumnId, setOverColumnId] = useState<number | null>(null);
  const activeTypeRef = useRef<'column' | 'task' | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setAddingList(true);
    await addList({ name: newListName.trim() });
    setNewListName('');
    setShowAddList(false);
    setAddingList(false);
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === 'column') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          c => String(c.id).startsWith('list-')
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
      const overTask = allTasks.find(t => t.id === Number(overId));
      setOverColumnId(overTask ? overTask.listId : null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      activeTypeRef.current = null;
      setOverColumnId(null);
      return;
    }

    if (activeTypeRef.current === 'column') {
      const activeListId = Number(String(active.id).replace('list-', ''));
      const overIdStr = String(over.id);
      let overListId: number;
      if (overIdStr.startsWith('col-')) {
        overListId = Number(overIdStr.replace('col-', ''));
      } else if (overIdStr.startsWith('list-')) {
        overListId = Number(overIdStr.replace('list-', ''));
      } else {
        // over.id がタスクID → そのタスクが属するリストIDを取得
        const allTasks = Object.values(columns).flat();
        const overTask = allTasks.find(t => t.id === Number(overIdStr));
        if (!overTask) { activeTypeRef.current = null; return; }
        overListId = overTask.listId;
      }
      if (activeListId !== overListId) {
        const currentOrder = columnOrder.map(id => Number(id));
        const fromIndex = currentOrder.indexOf(activeListId);
        const toIndex = currentOrder.indexOf(overListId);
        const reorderedIds = arrayMove(currentOrder, fromIndex, toIndex);
        reorderColumns(reorderedIds);
      }
      activeTypeRef.current = null;
      return;
    }

    const taskId = Number(active.id);
    const overId = String(over.id);
    const allTasks = Object.values(columns).flat();
    const activeTask = allTasks.find(t => t.id === taskId);
    if (!activeTask) { setOverColumnId(null); return; }

    if (overId.startsWith('col-')) {
      // カラムの空き領域にドロップ: カラム間移動
      const targetListId = Number(overId.replace('col-', ''));
      if (activeTask.listId !== targetListId) {
        const targetListName = lists.find(l => l.id === targetListId)?.name ?? '';
        const targetStatus = LIST_NAME_TO_STATUS[targetListName] ?? activeTask.status;
        const targetTasks = allTasks.filter(t => t.listId === targetListId);
        patchStatus(taskId, { status: targetStatus, listId: targetListId, position: targetTasks.length });
      }
    } else {
      // タスク上にドロップ
      const overTaskId = Number(overId);
      if (taskId !== overTaskId) {
        const overTask = allTasks.find(t => t.id === overTaskId);
        if (overTask) {
          if (activeTask.listId === overTask.listId) {
            // 同一カラム内: 並べ替え
            const columnTasks = columns[String(activeTask.listId)] ?? [];
            const overIndex = columnTasks.findIndex(t => t.id === overTaskId);
            patchStatus(taskId, { status: activeTask.status, listId: activeTask.listId, position: overIndex });
          } else {
            // 別カラムのタスク上にドロップ: カラム間移動（上/下半分で挿入位置を決定）
            const targetListName = lists.find(l => l.id === overTask.listId)?.name ?? '';
            const targetStatus = LIST_NAME_TO_STATUS[targetListName] ?? activeTask.status;
            const targetTasks = columns[String(overTask.listId)] ?? [];
            const overIndex = targetTasks.findIndex(t => t.id === overTaskId);
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

  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.board}>
        {loading && <p className={styles.status}>読み込み中...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && (
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <SortableContext
              items={columnOrder.map(id => `list-${id}`)}
              strategy={horizontalListSortingStrategy}
            >
            <div className={styles.columns}>
              {columnOrder.map((listId, index) => {
                const list = lists.find(l => String(l.id) === listId);
                if (!list) return null;
                const tasks = columns[listId] ?? [];
                return (
                  <KanbanColumn
                    key={listId}
                    listId={list.id}
                    listName={list.name}
                    tasks={tasks}
                    isSearching={query.trim() !== ''}
                    isOver={overColumnId === list.id}
                    showAddButton={index === 0}
                    isDefault={list.isDefault}
                    onCreate={create}
                    onUpdate={patchTask}
                    onDelete={deleteTask}
                    onDeleteList={removeList}
                    onReorder={reorder}
                  />
                );
              })}
            </div>
            </SortableContext>
          </DndContext>
        )}
      </main>
      <footer className={styles.footer}>
        <input
          type="search"
          className={styles.search}
          placeholder="タスクを検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={styles.addListButton} onClick={() => setShowAddList(true)}>
          ＋ タスクリスト追加
        </button>
        <button className={styles.completedButton} onClick={() => navigate('/completed')}>
          完了タスク一覧
        </button>
      </footer>
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(); }}
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
                  onClick={handleCreateList}
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
