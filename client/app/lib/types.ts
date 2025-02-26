export interface JobPosting {
  id: string;
  title: string;
  description: string;
  pdf_url?: string;
  questions: SurveyQuestion[];
  created_at: string;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  category: string;
}

export interface SurveyResponse {
  id: string;
  job_posting_id: string;
  question_id: number;
  audio_url: string;
  transcript?: string;
  created_at: string;
}