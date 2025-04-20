import { InvalidModel } from '@/types/InvalidModel';
import { create } from 'zustand';

// --- invalid segments to store ---
// saved checkpoint
// api value
// editing 

interface InvalidStore {
    api_response: InvalidModel[];
    save_checkpoint: InvalidModel[];
    editing: InvalidModel[];
    setApiResponse: (invalids: InvalidModel[]) => void;
    setSaveCheckpoint: (invalids: InvalidModel[]) => void;
    setEditing: (invalids: InvalidModel[]) => void;
    resetToCheckpoint: () => void;
    resetToApiResponse: () => void;
}

export const useInvalidStore = create<InvalidStore>((set) => ({
    api_response: [],
    save_checkpoint: [],
    editing: [],
    setApiResponse: (invalids) => set({ api_response: invalids, save_checkpoint: invalids, editing: invalids }),
    setSaveCheckpoint: (invalids) => set({ save_checkpoint: invalids }),
    setEditing: (invalids) => set({ editing: invalids }),
    resetToCheckpoint: () => set((state) => ({ editing: [...state.save_checkpoint] })),
    resetToApiResponse: () => set((state) => ({ editing: [...state.api_response], save_checkpoint: [...state.api_response] }))
}));