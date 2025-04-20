import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Play } from "lucide-react";
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
    removeInvalidSegment
  } = useInvalidStore();

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);

  // Get transcript data from store
  const {
    transcript,
    isLoading: transcriptLoading
  } = useTranscriptStore();

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
    removeInvalidSegment(index, jobId);
  };

  // Loading state
  const isLoading = transcriptLoading || invalidSegmentsLoading;

  return (
    <Card>
            <CardHeader>
              <CardTitle>Invalid Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                {invalidSegments.length > 0 ? (
                  <div className="space-y-2">
                    {invalidSegments.map((segment, index) => (
                      <div
                        key={index}
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
                                {segment.start_time.toFixed(2)}s - {segment.end_time.toFixed(2)}s
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePlaySegment(segment.start_time)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              {/* <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSegmentDecision(index, true)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Accept
                              </Button> */}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveSegment(index)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                          
                          {/* Transcript text display */}
                          <div className="text-sm bg-muted p-2 rounded">
                            <div className="font-medium mb-1 text-xs text-muted-foreground">Transcript:</div>
                            <div>"{getTranscriptTextForSegment(segment.start_time, segment.end_time)}</div>
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
          </Card>
  );
};

export default SegmentReview;