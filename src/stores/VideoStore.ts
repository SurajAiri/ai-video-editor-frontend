// src/stores/videoStore.ts
import { create } from 'zustand';

type VideoSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  hasFillerWords: boolean;
  hasPause: boolean;
  isSelected: boolean;
};

type VideoStore = {
  // Video data
  videoFile: File | null;
  videoUrl: string | null;
  duration: number;
  transcript: string;
  
  // Segments analysis
  segments: VideoSegment[];
  
  // Current state/screen
  currentStep: 'upload' | 'transcribe' | 'analyze' | 'review' | 'export';
  
  // Actions
  setVideoFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setDuration: (duration: number) => void;
  setTranscript: (transcript: string) => void;
  setSegments: (segments: VideoSegment[]) => void;
  updateSegment: (id: string, updates: Partial<VideoSegment>) => void;
  setCurrentStep: (step: VideoStore['currentStep']) => void;
  
  // Reset store
  reset: () => void;
};

export const useVideoStore = create<VideoStore>((set) => ({
  // Initial state
  videoFile: null,
  videoUrl: null,
  duration: 0,
  transcript: '',
  segments: [],
  currentStep: 'upload',
  
  // Actions
  setVideoFile: (file) => set({ videoFile: file }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setDuration: (duration) => set({ duration }),
  setTranscript: (transcript) => set({ transcript }),
  setSegments: (segments) => set({ segments }),
  updateSegment: (id, updates) => set((state) => ({
    segments: state.segments.map((segment) =>
      segment.id === id ? { ...segment, ...updates } : segment
    ),
  })),
  setCurrentStep: (currentStep) => set({ currentStep }),
  
  // Reset all state
  reset: () => set({
    videoFile: null,
    videoUrl: null,
    duration: 0,
    transcript: '',
    segments: [],
    currentStep: 'upload',
  }),
}));