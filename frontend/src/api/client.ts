import {
  MeetingListItem,
  MeetingDetail,
  MeetingUploadResponse,
  HealthResponse,
  StatsResponse,
  ActionItem,
  ActionItemStatus,
  PriorityLevel
} from './types';

const API_BASE_URL = '/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // Ignore text decoding errors
    }
    throw new ApiError(errorDetail, response.status);
  }

  // If 204 or empty content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // System Health
  getHealth: (): Promise<HealthResponse> => {
    return request<HealthResponse>('/health');
  },

  // Stats
  getStats: (): Promise<StatsResponse> => {
    return request<StatsResponse>('/meetings/stats');
  },

  // Meeting Management
  listMeetings: (params?: { search?: string; status?: string; skip?: number; limit?: number }): Promise<MeetingListItem[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));

    const queryString = query.toString();
    return request<MeetingListItem[]>(`/meetings${queryString ? `?${queryString}` : ''}`);
  },

  getMeeting: (id: string): Promise<MeetingDetail> => {
    return request<MeetingDetail>(`/meetings/${id}`);
  },

  uploadAudio: async (file: File): Promise<MeetingUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return request<MeetingUploadResponse>('/meetings/upload', {
      method: 'POST',
      body: formData,
    });
  },

  processMeeting: (id: string): Promise<MeetingDetail> => {
    return request<MeetingDetail>(`/meetings/${id}/process`, {
      method: 'POST',
    });
  },

  createDemoMeeting: (): Promise<MeetingDetail> => {
    return request<MeetingDetail>('/meetings/demo', {
      method: 'POST',
    });
  },

  deleteMeeting: (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/meetings/${id}`, {
      method: 'DELETE',
    });
  },

  updateActionItem: (
    meetingId: string,
    itemId: string,
    data: { status?: ActionItemStatus; priority?: PriorityLevel; task?: string; assignee?: string; deadline?: string }
  ): Promise<ActionItem> => {
    return request<ActionItem>(`/meetings/${meetingId}/action-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getAudioUrl: (meetingId: string): string => {
    return `${API_BASE_URL}/meetings/${meetingId}/audio`;
  }
};
