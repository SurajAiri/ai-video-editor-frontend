import { InvalidModel } from "@/types/InvalidModel";
import { TranscriptWordModel } from "@/types/TranscriptWordModel";

/**
 * Processes invalid segments from API by adding startIndex and endIndex 
 * based on the transcript word timestamps
 * 
 * @param invalidSegments - Invalid segments from API response
 * @param transcript - Full transcript with word timestamps
 * @returns InvalidModel[] with added index information
 */
export const processInvalidSegments = (
    invalidSegments: InvalidModel[],
    transcript: TranscriptWordModel[]
  ): InvalidModel[] => {
    if (!invalidSegments?.length || !transcript?.length) {
      return invalidSegments;
    }
  
    return invalidSegments.map(segment => {
      // Find the first word that starts at or after the segment start time
      // or is already ongoing when the segment starts
      const startWordIndex = transcript.findIndex(word => 
        (word.start >= segment.start_time && word.start < segment.end_time) || 
        (word.start < segment.start_time && word.end > segment.start_time)
      );
      
      // If no matching start word, return segment as is
      if (startWordIndex === -1) {
        return segment;
      }
  
      // Find the last word that ends before or at the segment end time
      // We search from the startWordIndex to improve performance
      let endWordIndex = startWordIndex;
      for (let i = startWordIndex; i < transcript.length; i++) {
        const word = transcript[i];
        
        // If this word starts after segment ends, break
        if (word.start > segment.end_time) {
          break;
        }
        
        // Update endWordIndex if the word overlaps with or is within the segment
        if (
          (word.start <= segment.end_time && word.end > segment.start_time) ||
          (word.start >= segment.start_time && word.start < segment.end_time)
        ) {
          endWordIndex = i;
        }
      }
  
      // Extract the text from the segment
      const segmentText = transcript
        .slice(startWordIndex, endWordIndex + 1)
        .map(item => item.word)
        .join(' ');
  
      // Return the segment with added index information
      return {
        ...segment,
        startIndex: startWordIndex,
        endIndex: endWordIndex,
        text: segmentText
      };
    });
  };


  // Function to detect filler words in transcript
const detectFillerWords = (transcript: TranscriptWordModel[]) => {
  // Common single word fillers to detect
  const fillerWords = ['um', 'uh', 'like', 'so', 'basically', 'actually', 
                       'literally', 'right', 'okay', 'well', 'hmm', 'er', 'ah'];
                       
  const newInvalidSegments: InvalidModel[] = [];
  
  // Scan through transcript to find individual filler words
  transcript.forEach((wordObj, index) => {
    const wordLower = wordObj.word.toLowerCase().trim();
    
    // Check if the word exactly matches a filler word
    if (fillerWords.includes(wordLower)) {
      // Create a segment for this single filler word
      const fillerSegment: InvalidModel = {
        start_time: wordObj.start,
        end_time: wordObj.end,
        type: "filler_words",
        is_entire: false,
        text: wordObj.word,
        startIndex: index,
        endIndex: index
      };
      
      newInvalidSegments.push(fillerSegment);
    }
  });
  
  return newInvalidSegments;
};

// Function to detect long pauses in transcript
const detectLongPauses = (transcript: TranscriptWordModel[], pauseThresholdSeconds = 1.5) => {
  const newInvalidSegments: InvalidModel[] = [];
  
  // Loop through transcript to find gaps between words
  for (let i = 1; i < transcript.length; i++) {
    const prevWord = transcript[i - 1];
    const currentWord = transcript[i];
    
    const timeDiff = currentWord.start - prevWord.end;
    
    // Check if gap exceeds threshold
    if (timeDiff >= pauseThresholdSeconds) {
      // Create invalid segment for the long pause
      const pauseSegment = {
        start_time: prevWord.end,
        end_time: currentWord.start,
        type: 'long_pause',
        is_entire: false,
        text: `[Pause: ${timeDiff.toFixed(1)}s]`,
        startIndex: i - 1,  // End of previous word
        endIndex: i         // Start of next word
      };
      
      newInvalidSegments.push(pauseSegment as InvalidModel);
    }
  }
  
  return newInvalidSegments;
};

// Inside TranscriptEditor component:

// Function to process transcript and apply automated detection
export const processFillerAndLongPauses = (transcript: TranscriptWordModel[], invalidSegments: InvalidModel[]) => {
  // Detect filler words
  const fillerSegments = detectFillerWords(transcript);
  
  // Detect long pauses
  const pauseSegments = detectLongPauses(transcript);
  
  // Combine with existing segments (avoid duplicates)
  const newSegments = [...invalidSegments];
  
  // Add new segments, avoiding overlaps with existing ones
  [...fillerSegments, ...pauseSegments].forEach(segment => {
    // Check if segment overlaps with existing segments
    const hasOverlap = invalidSegments.some(existing => 
      (segment.start_time >= existing.start_time && segment.start_time <= existing.end_time) ||
      (segment.end_time >= existing.start_time && segment.end_time <= existing.end_time) ||
      (segment.start_time <= existing.start_time && segment.end_time >= existing.end_time)
    );
    
    if (!hasOverlap) {
      newSegments.push(segment);
    }
  });
  
  // // Update invalid segments in store
  // setEditing(newSegments);
  return newSegments;
};