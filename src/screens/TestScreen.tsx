import { getInvalidSegments, getStatus, getTranscriptWord, processAll } from '@/apis/api';
import React from 'react';

const TestScreen: React.FC = () => {
  
    const handleApiCall = async () => {
      const jobId = "d22c4d7c-f4e8-4c13-b2a6-805cd1c1696f";
      const response = await getStatus(jobId);
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