const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || json.error.code || 'Request failed');
  }
  return json.data ?? json;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: { id: string; email: string; name: string }; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    register: (email: string, name: string, password: string) =>
      request<{ user: { id: string; email: string; name: string }; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, name, password }) }
      ),
    me: () => request<{ user: { id: string; email: string; name: string; avatarUrl?: string } }>('/auth/me'),
  },

  users: {
    getSettings: (userId: string) => request<any>(`/users/${userId}/settings`),
    updateSettings: (userId: string, data: any) =>
      request<any>(`/users/${userId}/settings`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  tasks: {
    list: (userId: string, statuses?: string[]) => {
      const params = statuses ? `?statuses=${statuses.join(',')}` : '';
      return request<any[]>(`/users/${userId}/tasks${params}`);
    },
    get: (id: string) => request<any>(`/tasks/${id}`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/tasks/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string, actualMinutes?: number) =>
      request<any>(`/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, actualMinutes }),
      }),
    rank: (userId: string) =>
      request<any[]>(`/users/${userId}/tasks/rank`, { method: 'POST' }),
  },

  goals: {
    list: (userId: string) => request<any[]>(`/users/${userId}/goals`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/goals`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/goals/${id}`, { method: 'DELETE' }),
  },

  habits: {
    list: (userId: string) => request<any>(`/users/${userId}/habits`),
    get: (id: string) => request<any>(`/habits/${id}`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/habits`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/habits/${id}`, { method: 'DELETE' }),
    log: (id: string, data: any) =>
      request<any>(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify(data) }),
    stats: (id: string) => request<any>(`/habits/${id}/stats`),
  },

  memories: {
    list: (userId: string, type?: string) => {
      const params = type ? `?type=${type}` : '';
      return request<any>(`/users/${userId}/memories${params}`);
    },
    search: (userId: string, q: string) =>
      request<any>(`/users/${userId}/memories/search?q=${encodeURIComponent(q)}`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/memories`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/memories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/memories/${id}`, { method: 'DELETE' }),
  },

  knowledge: {
    getGraph: (userId: string) => request<any>(`/users/${userId}/knowledge`),
    createNode: (userId: string, data: any) =>
      request<any>(`/users/${userId}/knowledge/nodes`, { method: 'POST', body: JSON.stringify(data) }),
    createEdge: (userId: string, data: any) =>
      request<any>(`/users/${userId}/knowledge/edges`, { method: 'POST', body: JSON.stringify(data) }),
  },

  agents: {
    list: (userId: string) => request<any>(`/users/${userId}/agents`),
    get: (id: string) => request<any>(`/agents/${id}`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/agents`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/agents/${id}`, { method: 'DELETE' }),
    run: (id: string) =>
      request<any>(`/agents/${id}/run`, { method: 'POST' }),
    runs: (id: string, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return request<any>(`/agents/${id}/runs${params}`);
    },
  },

  briefing: {
    generate: (date?: string) =>
      request<any>('/agents/briefing', {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),
  },

  autoSchedule: {
    generate: (data: any) =>
      request<any>('/agents/auto-schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    get: (userId: string) => request<any>(`/users/${userId}/analytics`),
    weekly: (userId: string) => request<any>(`/users/${userId}/analytics/weekly`),
  },

  insights: {
    list: (userId: string, unread?: boolean) => {
      const params = unread ? '?unread=true' : '';
      return request<any>(`/users/${userId}/insights${params}`);
    },
  },

  timeblocks: {
    list: (userId: string, startDate: string, endDate: string) =>
      request<any>(`/users/${userId}/timeblocks?startDate=${startDate}&endDate=${endDate}`),
    create: (userId: string, data: any) =>
      request<any>(`/users/${userId}/timeblocks`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/timeblocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/timeblocks/${id}`, { method: 'DELETE' }),
  },

  calendar: {
    get: (userId: string, date: string) =>
      request<any>(`/users/${userId}/calendar?date=${date}`),
  },
};
