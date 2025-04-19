// src/hooks/useStore.ts
import { create } from 'zustand'

export enum ProjectStatus {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  TRANSCRIBING = 'transcribing',
  TRANSCRIBED = 'transcribed',
  TRIMMING = 'trimming',
  TRIMMED = 'trimmed',
  EXPORTED = 'exported',
  ERROR = 'error'
}

export interface MetadataModel {
  input_path: string;
  job_id: string;
  is_processing: boolean;
  file_extension: string;
  output_name: string;
  status: ProjectStatus;
}

export interface ResponseModel {
  status: string;
  message: string;
  job_id: string;
  project_status: string | null;
  data: Record<string, any> | null;
}

interface VideoState {
  jobId: string | null;
  metadata: MetadataModel | null;
  isLoading: boolean;
  selectedFile: File | null;
  projectStatus: ProjectStatus | null;
  videoPreviewUrl: string | null;
  
  // Actions
  setJobId: (jobId: string) => void;
  setMetadata: (metadata: MetadataModel) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSelectedFile: (file: File | null) => void;
  setProjectStatus: (status: ProjectStatus | null) => void;
  setVideoPreviewUrl: (url: string | null) => void;
  resetState: () => void;
}

const useVideoStore = create<VideoState>((set) => ({
  jobId: null,
  metadata: null,
  isLoading: false,
  selectedFile: null,
  projectStatus: null,
  videoPreviewUrl: null,
  
  setJobId: (jobId) => set({ jobId }),
  setMetadata: (metadata) => set({ metadata }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setProjectStatus: (status) => set({ projectStatus: status }),
  setVideoPreviewUrl: (url) => set({ videoPreviewUrl: url }),
  resetState: () => set({
    jobId: null,
    metadata: null,
    isLoading: false,
    selectedFile: null,
    projectStatus: null,
    videoPreviewUrl: null
  })
}));

export default useVideoStore;