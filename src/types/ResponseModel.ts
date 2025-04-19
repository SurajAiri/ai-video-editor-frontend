export interface ResponseModel {
  status: string;
  message: string;
  job_id: string;
  project_status: string | null;
  data: Record<string, any> | null;
}