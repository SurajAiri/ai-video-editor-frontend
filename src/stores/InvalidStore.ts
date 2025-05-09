import { getInvalidSegments } from '@/apis/api';
import { InvalidModel } from '@/types/InvalidModel';
import { create } from 'zustand';
import { processFillerAndLongPauses, processInvalidSegments } from '@/utils/processInvalidSegments'; 
import useTranscriptStore from '@/stores/TranscriptStore'; 

interface InvalidStore {
  api_response: InvalidModel[];
  save_checkpoint: InvalidModel[];
  editing: InvalidModel[];
  jobId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // State setters
  setSaveCheckpoint: (invalids: InvalidModel[]) => void;
  setEditing: (invalids: InvalidModel[]) => void;
  setJobId: (jobId: string) => void;
  
  // Actions
  resetToCheckpoint: () => void;
  resetToApiResponse: () => void;
  removeInvalidSegment: (index: number) => void;
  addInvalidSegment: (newSegment: InvalidModel) => void;
  clear: () => void;
  
  // Data fetching
  fetchInvalidSegments: (jobId: string) => Promise<void>;
}

export const useInvalidStore = create<InvalidStore>((set, get) => ({
  api_response: [],
  save_checkpoint: [],
  editing: [],
  jobId: null,
  isLoading: false,
  error: null,
  
  // State setters
  setSaveCheckpoint: (invalids) => set({ save_checkpoint: invalids }),
  setEditing: (invalids) => set({ editing: invalids }),
  setJobId: (jobId) => set({ jobId }),
  
  // Actions
  resetToCheckpoint: () => set((state) => ({
    editing: [...state.save_checkpoint]
  })),
  resetToApiResponse: () => set((state) => ({
    editing: [...state.api_response],
    save_checkpoint: [...state.api_response]
  })),
  removeInvalidSegment: (index) => set((state) => {
    const updatedEditing = [...state.editing];
    updatedEditing.splice(index, 1);
    return { editing: updatedEditing };
  }),
  addInvalidSegment: (newSegment) => set((state) => ({
    editing: [...state.editing, newSegment]
  })),
  clear: () => set({
    api_response: [],
    save_checkpoint: [],
    editing: [],
    error: null
  }),
  
  // Data fetching function
  fetchInvalidSegments: async (jobId: string) => {
    if (!jobId) {
      set({ error: 'No job ID provided' });
      return;
    }
    
    if(jobId === get().jobId) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await getInvalidSegments(jobId);
      
      if (response.status === 'success' && response.data && response.data.invalids) {
        // Get transcript from the transcript store
        const { transcript } = useTranscriptStore.getState();
        
        // Process invalid segments to add indices
        let processedInvalids = processInvalidSegments(response.data.invalids, transcript);
        
        processedInvalids = processFillerAndLongPauses(transcript, processedInvalids);
        
        set({
          api_response: processedInvalids,
          save_checkpoint: processedInvalids,
          editing: processedInvalids,
          jobId: response.job_id,
          isLoading: false
        });
      } else {
        set({
          error: 'Invalid response format',
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch invalid segments',
        isLoading: false
      });
    }
  }
}));