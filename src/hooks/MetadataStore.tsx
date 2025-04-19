// src/hooks/useStore.ts
import { MetadataModel } from '@/types/MetadataModel';
import { create } from 'zustand'


interface VideoState {
  metadata: MetadataModel | null;
  isLoading: boolean;
  selectedFile: File | null;
  videoPreviewUrl: string | null;
  
  // Actions
  setMetadata: (metadata: MetadataModel) => void;
  updateMetadata: (partialMetadata: Partial<MetadataModel>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSelectedFile: (file: File | null) => void;
  setVideoPreviewUrl: (url: string | null) => void;
  resetState: () => void;
}

const useVideoStore = create<VideoState>((set) => ({
  metadata: null,
  isLoading: false,
  selectedFile: null,
  videoPreviewUrl: null,
  
  setMetadata: (metadata) => set({ metadata }),
  updateMetadata: (partialMetadata) => set((state) => ({
    metadata: state.metadata ? { ...state.metadata, ...partialMetadata } : null
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setVideoPreviewUrl: (url) => set({ videoPreviewUrl: url }),
  resetState: () => set({
    metadata: null,
    isLoading: false,
    selectedFile: null,
    videoPreviewUrl: null
  })
}));

export default useVideoStore;
