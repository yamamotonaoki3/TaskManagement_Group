export type Priority = 'high' | 'medium' | 'low' | null;

export interface ListResponse {
  id: number;
  userId: number | null;
  groupId: number | null;
  name: string;
  position: number;
  isDefault: boolean;
}

export interface GroupResponse {
  id: number;
  name: string;
  ownerUserId: number;
  createdAt: string;
}

export interface GroupMemberResponse {
  id: number;
  groupId: number;
  userId: number;
  email: string;
  nickname: string;
  joinedAt: string;
}

export interface TaskResponse {
  id: number;
  listId: number;
  listName: string;
  groupId: number | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority;
  status: 'todo' | 'in_progress' | 'done';
  completedAt: string | null;
  archived: boolean;
  position: number;
  createdAt: string;
  assigneeUserId: number | null;
  assigneeNickname: string | null;
}

export type KanbanColumns = Record<string, TaskResponse[]>;

export interface TaskCreateRequest {
  listId: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  assigneeUserId?: number | null;
}

export interface TaskStatusUpdateRequest {
  status: 'todo' | 'in_progress' | 'done';
  listId?: number;
  position?: number;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: 'high' | 'medium' | 'low';
  assigneeUserId?: number | null;
  clearAssignee?: boolean;
}

export interface ListCreateRequest {
  name: string;
  groupId?: number;
}
