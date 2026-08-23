export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MeetingStatus = 'PENDING' | 'UPLOADING' | 'TRANSCRIBING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface ActionItem {
  id: string;
  meeting_id: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
  priority: PriorityLevel;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface DiscussionPoint {
  topic: string;
  highlights: string[];
}

export interface MeetingListItem {
  id: string;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  duration_seconds: number;
  status: MeetingStatus;
  current_step?: string;
  executive_summary?: string;
  action_items_count: number;
  decisions_count: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingDetail {
  id: string;
  title: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  duration_seconds: number;
  status: MeetingStatus;
  current_step?: string;
  error_message?: string | null;
  transcript_text?: string | null;
  transcript_segments?: TranscriptSegment[] | null;
  executive_summary?: string | null;
  summary_markdown?: string | null;
  decisions?: string[] | null;
  discussion_points?: DiscussionPoint[] | null;
  key_metrics?: Record<string, any> | null;
  action_items: ActionItem[];
  created_at: string;
  updated_at: string;
}

export interface MeetingUploadResponse {
  id: string;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  status: MeetingStatus;
  message: string;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  database: string;
  asr_provider: string;
  llm_provider: string;
  openai_configured: boolean;
  groq_configured: boolean;
  timestamp: string;
}

export interface StatsResponse {
  total_meetings: number;
  completed_meetings: number;
  failed_meetings: number;
  total_duration_seconds: number;
  total_action_items: number;
  completed_action_items: number;
  pending_action_items: number;
}
