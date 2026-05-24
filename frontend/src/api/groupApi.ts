import axios from 'axios';

import type { GroupMemberResponse, GroupResponse } from '../types/task';
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

export const fetchMyGroups = (): Promise<GroupResponse[]> =>
  api.get<GroupResponse[]>('/groups').then((r) => r.data);

export const createGroup = (name: string): Promise<GroupResponse> =>
  api.post<GroupResponse>('/groups', { name }).then((r) => r.data);

export const fetchGroupMembers = (groupId: number): Promise<GroupMemberResponse[]> =>
  api.get<GroupMemberResponse[]>(`/groups/${groupId}/members`).then((r) => r.data);

export const inviteMember = (groupId: number, email: string): Promise<GroupMemberResponse> =>
  api.post<GroupMemberResponse>(`/groups/${groupId}/members`, { email }).then((r) => r.data);
