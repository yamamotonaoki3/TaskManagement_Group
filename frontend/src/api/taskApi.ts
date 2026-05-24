import axios from 'axios';

import type { ListCreateRequest, ListResponse, TaskCreateRequest, TaskResponse, TaskStatusUpdateRequest, TaskUpdateRequest } from '../types/task';
import { getToken, removeToken } from './authApi';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const fetchAllLists = (): Promise<ListResponse[]> =>
  api.get<ListResponse[]>('/lists').then((r) => r.data);

export const createList = (data: ListCreateRequest): Promise<ListResponse> =>
  api.post<ListResponse>('/lists', data).then((r) => r.data);

export const fetchAllTasks = (): Promise<TaskResponse[]> =>
  api.get<TaskResponse[]>('/tasks').then((r) => r.data);

export const searchTasks = (q: string): Promise<TaskResponse[]> =>
  api.get<TaskResponse[]>('/tasks/search', { params: { q } }).then((r) => r.data);

export const fetchCompletedTasks = (titleQ: string, descQ: string): Promise<TaskResponse[]> =>
  api.get<TaskResponse[]>('/tasks/completed', { params: { titleQ, descQ } }).then((r) => r.data);

export const createTask = (data: TaskCreateRequest): Promise<TaskResponse> =>
  api.post<TaskResponse>('/tasks', data).then((r) => r.data);

export const updateTaskStatus = (id: number, data: TaskStatusUpdateRequest): Promise<TaskResponse> =>
  api.patch<TaskResponse>(`/tasks/${id}/status`, data).then((r) => r.data);

export const updateTask = (id: number, data: TaskUpdateRequest): Promise<TaskResponse> =>
  api.patch<TaskResponse>(`/tasks/${id}`, data).then((r) => r.data);

export const reorderTasks = (listId: number, taskIds: number[]): Promise<void> =>
  api.patch(`/lists/${listId}/tasks/reorder`, { taskIds }).then(() => {});

export const reorderLists = (listIds: number[]): Promise<void> =>
  api.patch('/lists/reorder', { listIds }).then(() => {});

export const archiveTask = (id: number): Promise<void> =>
  api.patch(`/tasks/${id}/archive`).then(() => {});

export const permanentlyDeleteTask = (id: number): Promise<void> =>
  api.delete(`/tasks/${id}`).then(() => {});

export const deleteList = (id: number): Promise<void> =>
  api.delete(`/lists/${id}`).then(() => {});
