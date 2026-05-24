import { useCallback,useEffect, useState } from 'react';

import { archiveTask, createList as createListApi, createTask, deleteList,fetchAllLists, fetchAllTasks, permanentlyDeleteTask, reorderLists as reorderListsApi, reorderTasks, searchTasks, updateTask, updateTaskStatus } from '../api/taskApi';
import type { KanbanColumns, ListCreateRequest, ListResponse, TaskCreateRequest, TaskResponse, TaskStatusUpdateRequest, TaskUpdateRequest } from '../types/task';

export function useTasks() {
  const [query, setQuery] = useState('');
  const [lists, setLists] = useState<ListResponse[]>([]);
  const [columns, setColumns] = useState<KanbanColumns>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const tasksCall = query.trim() === '' ? fetchAllTasks() : searchTasks(query.trim());
    return Promise.all([fetchAllLists(), tasksCall])
      .then(([fetchedLists, tasks]) => {
        setLists(fetchedLists);
        const map = new Map<string, TaskResponse[]>();
        for (const list of fetchedLists) {
          map.set(String(list.id), []);
        }
        for (const task of tasks) {
          map.get(String(task.listId))?.push(task);
        }
        setColumns(Object.fromEntries(map));
        setColumnOrder(fetchedLists.map(l => String(l.id)));
        setError(null);
      })
      .catch(() => setError('データの取得に失敗しました。バックエンドが起動しているか確認してください。'))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => { refresh(); }, 300);
    return () => clearTimeout(timer);
  }, [refresh]);

  const create = async (data: TaskCreateRequest) => {
    await createTask(data);
    await refresh();
  };

  const patchStatus = async (id: number, data: TaskStatusUpdateRequest) => {
    await updateTaskStatus(id, data);
    await refresh();
  };

  const patchTask = async (id: number, data: TaskUpdateRequest) => {
    await updateTask(id, data);
    await refresh();
  };

  const addList = async (data: ListCreateRequest) => {
    await createListApi(data);
    await refresh();
  };

  const reorder = async (listId: number, taskIds: number[]) => {
    await reorderTasks(listId, taskIds);
    await refresh();
  };

  const deleteTask = async (id: number) => {
    const allTasks = Object.values(columns).flat();
    const task = allTasks.find((t) => t.id === id);
    if (task?.status === 'done') {
      await archiveTask(id);
    } else {
      await permanentlyDeleteTask(id);
    }
    await refresh();
  };

  const removeList = async (id: number) => {
    await deleteList(id);
    await refresh();
  };

  const reorderColumns = async (listIds: number[]) => {
    setLists(listIds.map(id => lists.find(l => l.id === id)!).filter(Boolean));
    setColumnOrder(listIds.map(id => String(id)));
    await reorderListsApi(listIds);
    await refresh();
  };

  return { lists, columns, columnOrder, loading, error, query, setQuery, create, patchStatus, patchTask, addList, reorder, reorderColumns, deleteTask, removeList };
}
