import { getTranscriptWord } from '@/apis/api';
import { TranscriptWordModel } from '@/types/TranscriptWordModel';
import { create } from 'zustand';



// Interface for the transcript store state
interface TranscriptState {
  transcript: TranscriptWordModel[];
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
  
  // State setters
  addWord: (word: TranscriptWordModel) => void;
  updateWord: (index: number, updatedWord: Partial<TranscriptWordModel>) => void;
  removeWord: (index: number) => void;
  
  // Actions
  clearTranscript: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data fetching
  fetchTranscript: (jobId: string) => Promise<void>;
}

// Create the store
const useTranscriptStore = create<TranscriptState>((set, get) => ({
  transcript: [],
  isLoading: false,
  error: null,
  jobId: null,
  
  
  // Add a word to the transcript
  addWord: (word) => set((state) => ({ 
    transcript: [...state.transcript, word] 
  })),
  
  // Update a word at the specified index
  updateWord: (index, updatedWord) => set((state) => {
    const newTranscript = [...state.transcript];
    newTranscript[index] = { ...newTranscript[index], ...updatedWord };
    return { transcript: newTranscript };
  }),
  
  // Remove a word at the specified index
  removeWord: (index) => set((state) => ({
    transcript: state.transcript.filter((_, i) => i !== index)
  })),
  
  // Clear the transcript
  clearTranscript: () => set({ transcript: [], error: null }),
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Set error state
  setError: (error) => set({ error }),
  
  // Data fetching function
  fetchTranscript: async (jobId: string) => {
    if(jobId === get().jobId)return;
    
    // Clear any existing transcript before fetching a new one
    get().clearTranscript();

    set({ isLoading: true, error: null });
    
    try {
      const response = await getTranscriptWord(jobId);
      
      if (response.status === 'success' && response.data && response.data.transcript) {
        set({ 
          transcript: response.data.transcript,
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
        error: error instanceof Error ? error.message : 'Failed to fetch transcript',
        isLoading: false 
      });
    }
  }
}));

export default useTranscriptStore;