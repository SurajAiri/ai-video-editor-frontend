import { getInvalidSegments, getStatus, getTranscriptWord, processAll, saveInvalidSegments, trimVideo } from '@/apis/api';
import React from 'react';

const TestScreen: React.FC = () => {
  
    const handleApiCall = async () => {
      const jobId = "0c69355d-94a6-4910-b2e9-67f8dc786296";
      const response = await trimVideo(jobId);
      console.log(response);

    }

  return (
    <div className="flex items-center justify-center h-screen">
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={handleApiCall}
      >
        Test
      </button>
    </div>
  );
};

export default TestScreen;