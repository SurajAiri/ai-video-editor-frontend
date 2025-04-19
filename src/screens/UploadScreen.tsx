// src/pages/Upload.tsx
import { useEffect } from 'react';
import VideoUploader from '@/components/video/VideoUpload';
import useVideoStore, { ProjectStatus } from '@/hooks/MetadataStore';

const UploadScreen = () => {
  const { resetState } = useVideoStore();
  
  // Reset state when landing on the upload page
  useEffect(() => {
    resetState();
  }, [resetState]);
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        AI Video Editor
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Upload your video to automatically detect and remove repeated phrases, filler words, and long pauses.
      </p>
      <VideoUploader />
    </div>
  );
};

export default UploadScreen;