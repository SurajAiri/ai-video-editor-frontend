import { useEffect, useMemo } from 'react';
import useTranscriptStore from '@/stores/TranscriptStore';

interface ContinuousSegment {
  text: string;
  start_time: string;
  end_time: string;
  words: string[];
}

const ContinuousTranscriptViewer = ({ jobId }: { jobId: string }) => {
  const {
    fetchTranscript,
    transcript,
    isLoading,
    error
  } = useTranscriptStore();

  useEffect(() => {
    if (jobId) {
      fetchTranscript(jobId);
    }
  }, [jobId, fetchTranscript]);

  // Group words with continuous timestamps into segments
  const continuousSegments = useMemo(() => {
    if (!transcript.length) return [];

    const segments: ContinuousSegment[] = [];
    let currentSegment: ContinuousSegment = {
      text: '',
      start_time: transcript[0].start_time,
      end_time: transcript[0].end_time,
      words: [transcript[0].word]
    };

    // Time gap threshold in seconds to determine a new segment (adjust as needed)
    const timeGapThreshold = 0.3;

    for (let i = 1; i < transcript.length; i++) {
      const currentWord = transcript[i];
      const previousEndTime = parseFloat(transcript[i-1].end_time);
      const currentStartTime = parseFloat(currentWord.start_time);
      
      // Check if there's a time gap larger than threshold
      if (currentStartTime - previousEndTime > timeGapThreshold) {
        // Finalize current segment
        currentSegment.text = currentSegment.words.join(' ');
        segments.push(currentSegment);
        
        // Start a new segment
        currentSegment = {
          text: '',
          start_time: currentWord.start_time,
          end_time: currentWord.end_time,
          words: [currentWord.word]
        };
      } else {
        // Continue current segment
        currentSegment.words.push(currentWord.word);
        currentSegment.end_time = currentWord.end_time;
      }
    }
    
    // Add the last segment
    if (currentSegment.words.length > 0) {
      currentSegment.text = currentSegment.words.join(' ');
      segments.push(currentSegment);
    }
    
    return segments;
  }, [transcript]);

  // Format time (helper function)
  const formatTime = (timeStr: string) => {
    const time = parseFloat(timeStr);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Continuous Transcript</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {continuousSegments.map((segment, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
              <div className="mb-1">{segment.text}</div>
              <div className="text-gray-500 text-xs">
                {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
              </div>
            </div>
          ))}
          
          {continuousSegments.length === 0 && transcript.length === 0 && (
            <div className="text-center text-gray-500 p-4">
              No transcript data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContinuousTranscriptViewer;