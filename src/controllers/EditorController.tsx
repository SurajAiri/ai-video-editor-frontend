// src/controllers/ProjectController.ts

import { 
    uploadFile,
    processAll,
    getStatus,
    getTranscriptWord,
    getInvalidSegments
  } from '@/apis/api';
  import { ProjectStatus } from '@/types/MetadataModel';
  import useTranscriptStore from '@/stores/TranscriptStore';
  import { useInvalidStore } from '@/stores/InvalidStore';
  import { ResponseModel } from '@/types/ResponseModel';
  
  class ProjectController {
    private jobId: string | null = null;
    private pollStatusInterval: NodeJS.Timeout | null = null;
    private transcriptStore = useTranscriptStore;
    private invalidStore = useInvalidStore;
  
    /**
     * Start uploading a file to the server
     * @param filePath Path to the file to upload
     * @returns Promise with the response data
     */
    public async startUpload(filePath: string): Promise<ResponseModel> {
      try {
        this.transcriptStore.getState().setLoading(true);
        const response = await uploadFile(filePath);
        if (response.job_id) {
          this.jobId = response.job_id;
          this.startStatusPolling();
        }
        return response;
      } catch (error) {
        this.handleError('Failed to upload file', error);
        throw error;
      } finally {
        this.transcriptStore.getState().setLoading(false);
      }
    }
  
    /**
     * Process all data for the current job
     * @returns Promise with the response data
     */
    public async runProcessAll(): Promise<ResponseModel | null> {
      if (!this.jobId) {
        this.transcriptStore.getState().setError('No active job to process');
        return null;
      }
  
      try {
        this.transcriptStore.getState().setLoading(true);
        const response = await processAll(this.jobId);
        return response;
      } catch (error) {
        this.handleError('Failed to process job', error);
        throw error;
      } finally {
        this.transcriptStore.getState().setLoading(false);
      }
    }
  
    /**
     * Check the current job status and update state accordingly
     * @returns Promise with the response data
     */
    public async checkStatus(): Promise<ResponseModel | null> {
      if (!this.jobId) {
        this.transcriptStore.getState().setError('No active job to check status');
        return null;
      }
  
      try {
        const response = await getStatus(this.jobId);
        return response;
      } catch (error) {
        this.handleError('Failed to get status', error);
        throw error;
      }
    }
  
    /**
     * Check if the project status has reached the required level to show transcript and invalid segments
     * @param status Current project status
     * @returns Boolean indicating if project is ready
     */
    public isProjectReadyForData(status: string): boolean {
      const statusOrder = Object.values(ProjectStatus);
      const requiredStatus = ProjectStatus.PROCESSED_INVALID_SEGMENT;
      
      const currentStatusIndex = statusOrder.indexOf(status as ProjectStatus);
      const requiredStatusIndex = statusOrder.indexOf(requiredStatus);
      
      return currentStatusIndex >= requiredStatusIndex;
    }
  
    /**
     * Load transcript data from the server
     * @returns Promise with the transcript data
     */
    public async loadTranscript(): Promise<ResponseModel | null> {
      if (!this.jobId) {
        this.transcriptStore.getState().setError('No active job to load transcript');
        return null;
      }
  
      try {
        this.transcriptStore.getState().setLoading(true);
        const response = await getTranscriptWord(this.jobId);
        if (response && response.transcript) {
          this.transcriptStore.getState().setTranscript(response.transcript);
        }
        return response;
      } catch (error) {
        this.handleError('Failed to load transcript', error);
        throw error;
      } finally {
        this.transcriptStore.getState().setLoading(false);
      }
    }
  
    /**
     * Load invalid segments from the server
     * @returns Promise with the invalid segments data
     */
    public async loadInvalidSegments(): Promise<ResponseModel | null> {
      if (!this.jobId) {
        this.transcriptStore.getState().setError('No active job to load invalid segments');
        return null;
      }
  
      try {
        const response = await getInvalidSegments(this.jobId);
        if (response && response.invalids) {
          this.invalidStore.getState().setApiResponse(response.invalids);
        }
        return response;
      } catch (error) {
        this.handleError('Failed to load invalid segments', error);
        throw error;
      }
    }
  
    /**
     * Load all required data for the project (transcript and invalid segments)
     * @returns Promise with the loaded data status
     */
    public async loadAllProjectData(): Promise<boolean> {
      try {
        await this.loadTranscript();
        await this.loadInvalidSegments();
        return true;
      } catch (error) {
        this.handleError('Failed to load project data', error);
        return false;
      }
    }
  
    /**
     * Start polling for project status
     */
    private startStatusPolling(): void {
      if (this.pollStatusInterval) {
        clearInterval(this.pollStatusInterval);
      }
  
      this.pollStatusInterval = setInterval(async () => {
        try {
          const statusResponse = await this.checkStatus();
          
          if (!statusResponse) return;
          
          const projectStatus = statusResponse.project_status as ProjectStatus;
          
          // Check if we've reached the required status to load data
          if (this.isProjectReadyForData(projectStatus)) {
            await this.loadAllProjectData();
            this.stopStatusPolling();
          }
          
          // Handle completion or error
          if (projectStatus === ProjectStatus.COMPLETED) {
            this.stopStatusPolling();
          } else if (projectStatus === ProjectStatus.ERROR) {
            this.stopStatusPolling();
            this.transcriptStore.getState().setError('Project processing failed');
          }
        } catch (error) {
          this.stopStatusPolling();
          this.handleError('Status polling failed', error);
        }
      }, 3000);
    }
  
    /**
     * Stop polling for project status
     */
    public stopStatusPolling(): void {
      if (this.pollStatusInterval) {
        clearInterval(this.pollStatusInterval);
        this.pollStatusInterval = null;
      }
    }
  
    /**
     * Set the job ID manually
     * @param id Job ID to set
     */
    public setJobId(id: string): void {
      this.jobId = id;
    }
  
    /**
     * Get the current job ID
     * @returns Current job ID or null
     */
    public getJobId(): string | null {
      return this.jobId;
    }
  
    /**
     * Reset the controller state
     */
    public reset(): void {
      this.stopStatusPolling();
      this.jobId = null;
      this.transcriptStore.getState().clearTranscript();
      this.transcriptStore.getState().setError(null);
      this.invalidStore.getState().resetToApiResponse();
    }
  
    /**
     * Handle errors and update state
     * @param message Error message
     * @param error Error object
     */
    private handleError(message: string, error: any): void {
      console.error(message, error);
      const errorMessage = error?.response?.data?.message || error?.message || message;
      this.transcriptStore.getState().setError(errorMessage);
    }
  }
  
  // Export as singleton
  export const projectController = new ProjectController();
  export default projectController;