import { getStatus, processAll } from '@/apis/api';
import React from 'react';

const TestScreen: React.FC = () => {
  
    const handleApiCall = async () => {
      const jobId = "57132490-36a6-4f4a-97b2-15b5fd78767e";
      const response = await processAll(jobId);
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