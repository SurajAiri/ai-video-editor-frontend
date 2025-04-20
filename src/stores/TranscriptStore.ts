import { TranscriptWordModel } from '@/types/TranscriptWordModel';
import { create } from 'zustand'

// Interface for the transcript store state
interface TranscriptState {
    transcript: TranscriptWordModel[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setTranscript: (transcript: TranscriptWordModel[]) => void;
    addWord: (word: TranscriptWordModel) => void;
    updateWord: (index: number, updatedWord: Partial<TranscriptWordModel>) => void;
    removeWord: (index: number) => void;
    clearTranscript: () => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

// Create the store
const useTranscriptStore = create<TranscriptState>((set) => ({
    transcript: [],
    isLoading: false,
    error: null,
    
    // Set the entire transcript
    setTranscript: (transcript) => set({ transcript }),
    
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
    clearTranscript: () => set({ transcript: [] }),
    
    // Set loading state
    setLoading: (isLoading) => set({ isLoading }),
    
    // Set error state
    setError: (error) => set({ error })
}));

export default useTranscriptStore;