import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Play, ClipboardList, FileText } from "lucide-react";
import { useInvalidStore } from '@/stores/InvalidStore';
import useTranscriptStore from '@/stores/TranscriptStore';
import { TranscriptWordModel } from '@/types/TranscriptWordModel';

interface SegmentReviewProps {
  jobId?: string;
  onPlaySegment?: (startTime: number) => void;
}

const SegmentReview: React.FC<SegmentReviewProps> = ({ jobId, onPlaySegment }) => {
  // Get invalid segments data from store
  const {
    editing: invalidSegments,
    isLoading: invalidSegmentsLoading,
    error: invalidSegmentsError,
    removeInvalidSegment,
  } = useInvalidStore();

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get transcript data from store
  const {
    transcript,
    isLoading: transcriptLoading
  } = useTranscriptStore();

  // Check fullscreen status
  useEffect(() => {
    const checkFullscreen = () => {
      const container = containerRef.current;
      if (container) {
        const isInFullscreenTab = container.closest('[data-state="active"]')?.classList.contains('flex-grow');
        setIsFullscreen(!!isInFullscreenTab);
      }
    };

    // Initial check
    checkFullscreen();

    // Setup a mutation observer to detect DOM changes (when switching tabs)
    const observer = new MutationObserver(checkFullscreen);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement, { 
        attributes: true, 
        subtree: true, 
        attributeFilter: ['class', 'data-state']
      });
    }

    return () => observer.disconnect();
  }, []);

  // Find transcript text for a given time range
  const getTranscriptTextForSegment = (startTime: number, endTime: number) => {
    const start = startTime;
    const end = endTime;
    
    if (!transcript.length) return "No transcript available";

    const words: TranscriptWordModel[] = transcript.filter(
      word => word.start >= start && word.end <= end
    );
    
    return words.length > 0 
      ? words.map(item => item.word).join(' ')
      : "No text in this segment";
  };

  // Handle play segment action
  const handlePlaySegment = (startTime: number) => {
    if (onPlaySegment) {
      onPlaySegment(startTime);
    }
  };

  // Handle segment removal action
  const handleRemoveSegment = (index: number) => {
    removeInvalidSegment(index);
  };

  // Loading state
  const isLoading = transcriptLoading || invalidSegmentsLoading;

  return (
    <div className="w-full h-full flex flex-col" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-2 text-gray-800 flex items-center flex-shrink-0">
        <ClipboardList className="h-5 w-5 mr-2 text-blue-500" />
        Invalid Segments
      </h2>
      
      <Card className="bg-white shadow-md border border-blue-100 rounded-xl overflow-hidden flex-grow flex flex-col w-full">
        <CardContent className="p-4 flex-grow flex flex-col">
          <ScrollArea className={`${isFullscreen ? "h-[calc(100vh-180px)]" : "h-[350px]"} flex-grow`}>
            {invalidSegments.length > 0 ? (
              <div className="space-y-3">
                {invalidSegments.map((segment, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg shadow-sm transition-all duration-200 
                      ${currentSegmentIndex === index 
                        ? "bg-blue-50 border-l-4 border-blue-500" 
                        : "bg-white border-l-4 border-gray-200 hover:border-blue-300"}`}
                    onClick={() => setCurrentSegmentIndex(index)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge 
                            variant="outline" 
                            className="mb-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 border-blue-200 font-medium">
                            {segment.type.replace('_', ' ')}
                          </Badge>
                          <div className="text-sm font-medium text-gray-600">
                            {segment.start_time.toFixed(2)}s - {segment.end_time.toFixed(2)}s
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaySegment(segment.start_time);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSegment(index);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      {/* Transcript text display */}
                      <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="font-medium mb-1 text-xs text-gray-500">Transcript:</div>
                        <div className="text-gray-800 italic">
                          "{getTranscriptTextForSegment(segment.start_time, segment.end_time)}"
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <span className="font-medium">No invalid segments found or all have been processed.</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentReview;