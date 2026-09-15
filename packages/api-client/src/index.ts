import { Goal, CreateGoal, UpdateGoal, Task, CreateTask, UpdateTask, TaskRanking, PaginatedResponse } from '@nexus/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? 'Request failed');
  }

  return response.json();
}

export const api = {
  goals: {
    list: (userId: string) => request<Goal[]>(`/users/${userId}/goals`),
    get: (id: string) => request<Goal>(`/goals/${id}`),
    create: (userId: string, data: Omit<CreateGoal, 'userId' | 'status' | 'priority'> & { status?: CreateGoal['status']; priority?: CreateGoal['priority'] }) => request<Goal>(`/users/${userId}/goals`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userId,
        status: data.status ?? 'ACTIVE',
        priority: data.priority ?? 5,
      }),
    }),
    update: (id: string, data: UpdateGoal) => request<Goal>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (userId: string, statuses?: string[]) => {
      const params = new URLSearchParams();
      if (statuses?.length) params.set('statuses', statuses.join(','));
      return request<Task[]>(`/users/${userId}/tasks?${params}`);
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (userId: string, data: Omit<CreateTask, 'userId' | 'status' | 'priority'> & { status?: CreateTask['status']; priority?: CreateTask['priority'] }) => request<Task>(`/users/${userId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userId,
        status: data.status ?? 'PENDING',
        priority: data.priority ?? 5,
      }),
    }),
    update: (id: string, data: UpdateTask) => request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: Task['status'], actualMinutes?: number) => 
      request<Task>(`/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, actualMinutes }),
      }),
    rank: (userId: string) => request<TaskRanking[]>(`/users/${userId}/tasks/rank`, {
      method: 'POST',
    }),
  },
};