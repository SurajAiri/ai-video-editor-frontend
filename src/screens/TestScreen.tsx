import { getInvalidSegments, getStatus, getTranscriptWord, processAll } from '@/apis/api';
import React from 'react';

const TestScreen: React.FC = () => {
  
    const handleApiCall = async () => {
      const jobId = "76a4497e-d16a-44c6-a5ff-b45dd82d8f52";
      const response = await getInvalidSegments(jobId);
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