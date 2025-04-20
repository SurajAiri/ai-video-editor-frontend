import { getInvalidSegments } from '@/apis/api';
import { InvalidModel } from '@/types/InvalidModel';
import { create } from 'zustand';

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
        set({ 
          api_response: response.data.invalids,
          save_checkpoint: response.data.invalids,
          editing: response.data.invalids,
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