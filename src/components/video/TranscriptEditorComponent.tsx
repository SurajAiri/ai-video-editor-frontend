import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Keyboard } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useTranscriptStore from '@/stores/TranscriptStore';
import { useInvalidStore } from '@/stores/InvalidStore';

interface SelectedRange {
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

interface WordGroup {
  words: any[];
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

interface TranscriptEditorProps {
  jobId: string | undefined;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ jobId }) => {
  // Get transcript data from store
  const { transcript, isLoading: transcriptLoading } = useTranscriptStore();
  
  // Get invalid segments from store
  const { editing: invalidSegments, addInvalidSegment: storeAddInvalidSegment } = useInvalidStore();
  
  // Local component state
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Group words into sensible chunks when transcript changes
  useEffect(() => {
    if (!transcript.length) return;
    
    // Group words with continuous timestamps
    const groups: WordGroup[] = [];
    let currentGroup: WordGroup | null = null;
    
    transcript.forEach((wordObj, index) => {
      if (!currentGroup) {
        // Start a new group
        currentGroup = {
          words: [wordObj],
          startIndex: index,
          endIndex: index,
          start_time: wordObj.start_time,
          end_time: wordObj.end_time
        };
      } else {
        // Check if this word is continuous with the current group
        // Consider words continuous if the gap is less than 0.3 seconds
        const timeDiff = wordObj.start_time - currentGroup.end_time;
        
        if (timeDiff <= 0.3) {
          // Add to current group
          currentGroup.words.push(wordObj);
          currentGroup.endIndex = index;
          currentGroup.end_time = wordObj.end_time;
        } else {
          // Save the current group and start a new one
          groups.push(currentGroup);
          currentGroup = {
            words: [wordObj],
            startIndex: index,
            endIndex: index,
            start_time: wordObj.start_time,
            end_time: wordObj.end_time
          };
        }
      }
    });
    
    // Add the last group if it exists
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    setWordGroups(groups);
  }, [transcript]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts if we have a selection
      if (!selectedRange) return;
      
      // Prevent default for our shortcut keys
      if (['r', 'f', 'p', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'r':
          addInvalidSegment("repetition");
          break;
        case 'f':
          addInvalidSegment("filler_words");
          break;
        case 'p':
          addInvalidSegment("long_pause");
          break;
        case 'Escape':
          setSelectedRange(null);
          break;
        case '?':
          setShowShortcutHelp(prev => !prev);
          break;
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRange]);
  
  // Word selection in transcript (individual word level)
  const handleWordClick = (globalIndex: number) => {
    if (!selectedRange) {
      // Start new selection
      setSelectedRange({
        startIndex: globalIndex,
        endIndex: globalIndex,
        start_time: transcript[globalIndex].start_time,
        end_time: transcript[globalIndex].end_time
      });
    } else if (selectedRange.startIndex === globalIndex && selectedRange.endIndex === globalIndex) {
      // Deselect if clicking on a single word selection
      setSelectedRange(null);
    } else {
      // Expand or adjust selection
      const newStartIndex = Math.min(selectedRange.startIndex, globalIndex);
      const newEndIndex = Math.max(selectedRange.startIndex, globalIndex);
      
      setSelectedRange({
        startIndex: newStartIndex,
        endIndex: newEndIndex,
        start_time: transcript[newStartIndex].start_time,
        end_time: transcript[newEndIndex].end_time
      });
    }
  };
  
  // Check if word is part of an invalid segment
  const isWordInInvalidSegment = (wordIndex: number) => {
    return invalidSegments.some(segment => {
      const segmentStartTime = parseFloat(segment.start_time);
      const segmentEndTime = parseFloat(segment.end_time);
      
      if (wordIndex >= transcript.length) return false;
      
      const wordStartTime = transcript[wordIndex].start_time;
      const wordEndTime = transcript[wordIndex].end_time;
      
      return (
        (wordStartTime >= segmentStartTime && wordStartTime <= segmentEndTime) ||
        (wordEndTime >= segmentStartTime && wordEndTime <= segmentEndTime) ||
        (segmentStartTime >= wordStartTime && segmentStartTime <= wordEndTime)
      );
    });
  };
  
  // Get the invalid segment type for a word
  const getInvalidSegmentTypeForWord = (wordIndex: number) => {
    for (const segment of invalidSegments) {
      const segmentStartTime = parseFloat(segment.start_time);
      const segmentEndTime = parseFloat(segment.end_time);
      
      if (wordIndex >= transcript.length) return null;
      
      const wordStartTime = transcript[wordIndex].start_time;
      const wordEndTime = transcript[wordIndex].end_time;
      
      if (
        (wordStartTime >= segmentStartTime && wordStartTime <= segmentEndTime) ||
        (wordEndTime >= segmentStartTime && wordEndTime <= segmentEndTime) ||
        (segmentStartTime >= wordStartTime && segmentStartTime <= wordEndTime)
      ) {
        return segment.type;
      }
    }
    return null;
  };
  
  // Add new invalid segment from transcript selection
  const addInvalidSegment = (type: string) => {
    if (!selectedRange || !jobId) return;
    
    const newInvalidSegment = {
      start_time: selectedRange.start_time.toString(),
      end_time: selectedRange.end_time.toString(),
      type,
      is_entire: false
    };
    
    // Call the store action to add this invalid segment
    storeAddInvalidSegment(newInvalidSegment, jobId);
    
    // Clear the selection after adding
    setSelectedRange(null);
  };
  
  // Toggle keyboard shortcuts help
  const toggleShortcutHelp = () => {
    setShowShortcutHelp(!showShortcutHelp);
  };
  
  return (
    <div ref={containerRef}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transcript Editor</CardTitle>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleShortcutHelp}
                >
                  <Keyboard className="h-4 w-4 mr-1" />
                  Shortcuts
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Press ? to show/hide shortcut help
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {transcriptLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
                <p className="text-sm text-gray-500">Loading transcript...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-muted-foreground flex flex-wrap gap-2">
                <span>Keyboard shortcuts:</span>
                <Badge variant="outline">R: Repetition</Badge>
                <Badge variant="outline">F: Filler Words</Badge>
                <Badge variant="outline">P: Long Pause</Badge>
                <Badge variant="outline">Esc: Clear Selection</Badge>
              </div>
              
              <ScrollArea className="h-[300px] mb-4">
                <div className="space-y-2 p-2">
                  {wordGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex flex-wrap gap-x-1 mb-2 border-b pb-1">
                      {/* Group timestamp indicator */}
                      <div className="w-full text-xs text-muted-foreground mb-1">
                        {group.start_time}s - {group.end_time}s
                        {/* {group.start_time.toFixed(1)}s - {group.end_time.toFixed(1)}s */}
                      </div>
                      
                      {/* Words within the group */}
                      <div className="flex flex-wrap gap-1">
                        {group.words.map((wordObj, wordIndex) => {
                          const globalIndex = group.startIndex + wordIndex;
                          
                          const isSelected = selectedRange && 
                            globalIndex >= selectedRange.startIndex && 
                            globalIndex <= selectedRange.endIndex;
                          
                          const isInvalid = isWordInInvalidSegment(globalIndex);
                          const invalidType = getInvalidSegmentTypeForWord(globalIndex);
                          
                          // Determine styling based on selection and invalid status
                          let bgClass = "hover:bg-muted";
                          if (isSelected) {
                            bgClass = "bg-primary text-primary-foreground";
                          } else if (isInvalid) {
                            switch(invalidType) {
                              case "repetition":
                                bgClass = "bg-red-100 hover:bg-red-200";
                                break;
                              case "filler_words":
                                bgClass = "bg-yellow-100 hover:bg-yellow-200";
                                break;
                              case "long_pause":
                                bgClass = "bg-blue-100 hover:bg-blue-200";
                                break;
                              default:
                                bgClass = "bg-gray-100 hover:bg-gray-200";
                            }
                          }
                          
                          return (
                            <span
                              key={wordIndex}
                              className={`inline-block px-1 py-0.5 rounded cursor-pointer transition-colors ${bgClass}`}
                              onClick={() => handleWordClick(globalIndex)}
                            >
                              {wordObj.word}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {selectedRange && (
                <div className="border rounded-md p-3 mb-4">
                  <div className="font-medium mb-2">Selected Range:</div>
                  <div className="text-sm mb-2">
                    Time: {selectedRange.start_time.toFixed(2)}s - {selectedRange.end_time.toFixed(2)}s
                  </div>
                  <div className="text-sm mb-3">
                    Text: {transcript.slice(selectedRange.startIndex, selectedRange.endIndex + 1).map(item => item.word).join(' ')}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={() => addInvalidSegment("repetition")}>
                            Mark as Repetition
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Shortcut: R
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={() => addInvalidSegment("filler_words")}>
                            Mark as Filler Words
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Shortcut: F
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={() => addInvalidSegment("long_pause")}>
                            Mark as Long Pause
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Shortcut: P
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRange(null)}>
                            Clear Selection
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Shortcut: Esc
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => {
              console.log("Saving transcript changes", invalidSegments);
            }}
            className="w-full"
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Keyboard shortcut help modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={toggleShortcutHelp}>
          <Card className="w-96" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">r</span>
                  <span>Mark as Repetition</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">f</span>
                  <span>Mark as Filler Words</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">p</span>
                  <span>Mark as Long Pause</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Esc</span>
                  <span>Clear Selection</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">?</span>
                  <span>Show/Hide Shortcuts</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={toggleShortcutHelp}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TranscriptEditor;