import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, Check, X, Keyboard, Save, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInvalidStore } from '@/stores/InvalidStore';
import useTranscriptStore from '@/stores/TranscriptStore';
import { getStatus, getTranscriptWord, getInvalidSegments } from '@/apis/api';
import { InvalidModel } from '@/types/InvalidModel';
import { TranscriptWordModel } from '@/types/TranscriptWordModel';
import { ProjectStatus } from '@/types/MetadataModel';
import { useNavigate, useParams } from 'react-router-dom';

interface SelectedRange {
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

interface WordGroup {
  words: TranscriptWordModel[];
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

const VideoScriptReview: React.FC = () => {
    const navigator = useNavigate();
    const {job_id} = useParams();
  
  // Get stores
  const {
    editing: invalidSegments,
    setApiResponse,
    setEditing,
    setSaveCheckpoint,
    resetToCheckpoint,
    resetToApiResponse
  } = useInvalidStore();
  
  const {
    transcript,
    setTranscript,
    isLoading: transcriptLoading,
    setLoading: setTranscriptLoading,
    error: transcriptError,
    setError: setTranscriptError
  } = useTranscriptStore();
  
  // Component state
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);
  const [activeTab, setActiveTab] = useState("segment-review");
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveInProgress, setSaveInProgress] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check project status and redirect if needed
  useEffect(() => {
    const checkStatus = async () => {
      if (!job_id) return;
      
      try {
        const response = await getStatus(job_id as string);
        const status = response.data?.status as ProjectStatus;
        
        if (status === ProjectStatus.CREATED || status === ProjectStatus.UPLOADED) {
            // pop all history and redirect to upload page
            navigator('/upload');
        } else if (status && 
          (status === ProjectStatus.TRANSCRIPT_START ||
          status < ProjectStatus.PROCESSED_INVALID_SEGMENT)) {
          navigator(`/analysis/${job_id}`);
        } else {
          // Status is valid for this page, load data
          loadData();
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };
    
    checkStatus();
  }, [job_id, navigator,]);
  
  // Load transcript and invalid segments data
  const loadData = async () => {
    if (!job_id) return;
    
    setIsLoading(true);
    
    try {
      // Load transcript
      setTranscriptLoading(true);
      const transcriptResponse = await getTranscriptWord(job_id as string);
      if (transcriptResponse.data && transcriptResponse.data.transcript) {
        setTranscript(transcriptResponse.data.transcript);
      }
      setTranscriptLoading(false);
      
      // Load invalid segments
      const invalidResponse = await getInvalidSegments(job_id as string);
      if (invalidResponse.data && invalidResponse.data.invalid_segments) {
        const invalids = invalidResponse.data.invalid_segments as InvalidModel[];
        setApiResponse(invalids);
      }
      
      // Also load video if there's a video path
      if (transcriptResponse.data && transcriptResponse.data.video_path) {
        setVideoUrl(transcriptResponse.data.video_path);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setTranscriptError('Failed to load transcript data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group words with continuous timestamps when transcript changes
  useEffect(() => {
    if (transcript.length === 0) return;
    
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
        // Words are continuous if the gap is less than 0.2 seconds
        const timeDiff = wordObj.start_time - currentGroup.end_time;
        
        if (timeDiff <= 0.2) {
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
      // Only process shortcuts if we're on the transcript editor tab and have a selection
      if (activeTab !== "transcript-editor" || !selectedRange) return;
      
      // Prevent default for our shortcut keys
      if (['r', 'f', 'p', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'r':
        case 'z':
          addInvalidSegment("repetition");
          break;
        case 'f':
        case 'x':
          addInvalidSegment("filler_words");
          break;
        case 'p':
        case 'c':
          addInvalidSegment("long_pause");
          break;
        case 'Escape':
        case 'v':
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
  }, [activeTab, selectedRange]);
  
  // Find transcript text for a segment
  const getTranscriptTextForSegment = (segment: InvalidModel) => {
    if (segment.startIndex !== undefined && segment.endIndex !== undefined) {
      return transcript
        .slice(segment.startIndex, segment.endIndex + 1)
        .map(item => item.word)
        .join(' ');
    }
    
    // Fallback if indices are not available
    const startTime = parseFloat(segment.start_time);
    const endTime = parseFloat(segment.end_time);
    
    const words = transcript.filter(
      word => word.start_time >= startTime && word.end_time <= endTime
    );
    
    return words.map(item => item.word).join(' ');
  };
  
  // Handle file selection for local video upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };
  
  // Play/pause video
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Jump to segment
  const playSegment = (segmentIndex: number) => {
    if (videoRef.current && invalidSegments[segmentIndex]) {
      const startTime = parseFloat(invalidSegments[segmentIndex].start_time);
      videoRef.current.currentTime = startTime;
      setCurrentSegmentIndex(segmentIndex);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Accept or reject segment
  const handleSegmentDecision = (segmentIndex: number, isAccepted: boolean) => {
    // Remove the segment from our editing list
    const updatedSegments = [...invalidSegments];
    updatedSegments.splice(segmentIndex, 1);
    setEditing(updatedSegments);
    
    // Create a checkpoint after removing the segment
    setSaveCheckpoint(updatedSegments);
    
    // Move to next segment if available
    if (segmentIndex < updatedSegments.length) {
      playSegment(segmentIndex);
    } else if (updatedSegments.length > 0) {
      playSegment(0);
    } else {
      setCurrentSegmentIndex(-1);
    }
  };
  
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
      if (segment.startIndex !== undefined && segment.endIndex !== undefined) {
        return wordIndex >= segment.startIndex && wordIndex <= segment.endIndex;
      }
      
      // Fallback to time-based check
      const segmentStartTime = parseFloat(segment.start_time);
      const segmentEndTime = parseFloat(segment.end_time);
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
      if (segment.startIndex !== undefined && segment.endIndex !== undefined) {
        if (wordIndex >= segment.startIndex && wordIndex <= segment.endIndex) {
          return segment.type;
        }
      }
      
      // Fallback to time-based check
      const segmentStartTime = parseFloat(segment.start_time);
      const segmentEndTime = parseFloat(segment.end_time);
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
    if (selectedRange) {
      const newSegment: InvalidModel = {
        start_time: selectedRange.start_time.toString(),
        end_time: selectedRange.end_time.toString(),
        type,
        is_entire: false,
        startIndex: selectedRange.startIndex,
        endIndex: selectedRange.endIndex,
        id: `manual-${Date.now()}`
      };
      
      const updatedSegments = [...invalidSegments, newSegment];
      setEditing(updatedSegments);
      setSaveCheckpoint(updatedSegments);
      setSelectedRange(null);
    }
  };
  
  // Toggle keyboard shortcuts help
  const toggleShortcutHelp = () => {
    setShowShortcutHelp(!showShortcutHelp);
  };
  
  // Save changes to the server
  const saveChanges = async () => {
    if (!job_id) return;
    
    setSaveInProgress(true);
    
    try {
      // Here you would send the updated invalid segments to your API
      // Example:
      // await updateInvalidSegments(job_id as string, invalidSegments);
      
      // For now, just update the checkpoint
      setSaveCheckpoint(invalidSegments);
      
      // Show success message or handle accordingly
      console.log("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      // Handle error
    } finally {
      setSaveInProgress(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading transcript and analysis...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4" ref={containerRef}>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Video Script Automation</CardTitle>
          
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
          <div className="flex flex-col gap-4">
            {!videoUrl && (
              <div className="flex gap-4">
                <Button
                  onClick={() => document.getElementById('videoFileInput')?.click()}
                  variant="outline"
                >
                  Select Video
                </Button>
                <input
                  id="videoFileInput"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
            
            {videoUrl && (
              <div className="mt-4">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full max-h-96 rounded-md"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <div className="flex gap-2 mt-2">
                  <Button onClick={togglePlayPause} variant="outline" size="sm">
                    {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  {invalidSegments.length > 0 && (
                    <Button onClick={() => playSegment(currentSegmentIndex)} variant="outline" size="sm">
                      <SkipForward className="h-4 w-4 mr-1" />
                      Current Segment
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="segment-review">Segment Review</TabsTrigger>
          <TabsTrigger value="transcript-editor">Transcript Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="segment-review">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invalid Segments</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetToCheckpoint}
                  disabled={saveInProgress}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset to Checkpoint
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetToApiResponse}
                  disabled={saveInProgress}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset to Original
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                {invalidSegments.length > 0 ? (
                  <div className="space-y-2">
                    {invalidSegments.map((segment, index) => (
                      <div
                        key={segment.id || index}
                        className={`p-3 rounded-md border ${
                          currentSegmentIndex === index ? "bg-muted border-primary" : "border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {segment.type.replace('_', ' ')}
                              </Badge>
                              <div className="text-sm">
                                {parseFloat(segment.start_time).toFixed(2)}s - {parseFloat(segment.end_time).toFixed(2)}s
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => playSegment(index)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSegmentDecision(index, true)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleSegmentDecision(index, false)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                          
                          {/* Transcript text display */}
                          <div className="text-sm bg-muted p-2 rounded">
                            <div className="font-medium mb-1 text-xs text-muted-foreground">Transcript:</div>
                            <div>"{getTranscriptTextForSegment(segment)}"</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No invalid segments found or all have been processed.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveChanges}
                className="w-full"
                disabled={saveInProgress}
              >
                {saveInProgress ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="transcript-editor">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transcript Editor</CardTitle>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="mr-1">Shortcuts:</span>
                <Badge variant="outline" className="mr-1">R</Badge>
                <Badge variant="outline" className="mr-1">F</Badge>
                <Badge variant="outline" className="mr-1">P</Badge>
                <Badge variant="outline">Esc</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60 mb-4">
                {transcriptLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : transcriptError ? (
                  <div className="text-center py-8 text-destructive">
                    {transcriptError}
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {wordGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="flex flex-wrap gap-x-1 mb-2 border-b pb-1">
                        {/* Group timestamp indicator */}
                        <div className="w-full text-xs text-muted-foreground mb-1">
                          {group.start_time.toFixed(1)}s - {group.end_time.toFixed(1)}s
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
                )}
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
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveChanges}
                className="w-full"
                disabled={saveInProgress}
              >
                {saveInProgress ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>  
</CardFooter>
  </Card>
</TabsContent>
  </Tabs>
</div>
  );
};

export default VideoScriptReview;
