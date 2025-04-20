
export enum ProjectStatus {
  ERROR = 'error',
  CREATED = 'created',
  UPLOADED = 'uploaded',
  TRANSCRIPT_START = 'transcript_start',
  TRANSCRIPT_COMPLETE = 'transcript_complete',
  SENT_ANALYSIS_START = 'sent_analysis_start',
  SENT_ANALYSIS_END = 'sent_analysis_end',
  WORD_ANALYSIS_START = 'word_analysis_start',
  WORD_ANALYSIS_END = 'word_analysis_end',
  PROCESSED_INVALID_SEGMENT = 'processed_invalid_segment',
  TRIM_START = 'trim_start',
  COMPLETED = 'completed',
}

export interface MetadataModel {
  input_path: string;
  job_id: string;
  is_processing: boolean;
  file_extension: string;
  output_name: string;
  status: ProjectStatus;
}
