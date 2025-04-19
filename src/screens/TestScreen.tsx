// VideoTrimmer.tsx
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, PlayCircle, PauseCircle, Scissors, Download, Upload, FileText, Edit3, CheckCircle } from 'lucide-react';

// Types for our application
type Segment = {
  id: string;
  start: number;
  end: number;
  text: string;
  keep: boolean;
  reason?: string; // Why this segment might be flagged (filler words, pause, etc.)
};

type TranscriptData = {
  segments: Segment[];
  duration: number;
};

const VideoTrimmer = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'transcribe' | 'analyze' | 'review' | 'export'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setCurrentStep('transcribe');
    }
  };

  // Simulate transcription process
  const startTranscription = () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Mock transcript data
          const mockTranscriptData: TranscriptData = {
            duration: 120, // 2 minutes video
            segments: [
              { id: '1', start: 0, end: 10, text: "Hello everyone, welcome to this presentation about our new product.", keep: true },
              { id: '2', start: 10, end: 20, text: "Umm, so like, we're really excited about this, you know?", keep: false, reason: "Filler words detected: 'umm', 'like', 'you know'" },
              { id: '3', start: 20, end: 30, text: "Our product solves a critical problem in the market.", keep: true },
              { id: '4', start: 30, end: 45, text: "...", keep: false, reason: "Long pause detected (5 seconds)" },
              { id: '5', start: 45, end: 60, text: "The main features include real-time analytics and user-friendly interface.", keep: true },
              { id: '6', start: 60, end: 75, text: "We have, uhh, implemented several, mmm, innovative solutions.", keep: false, reason: "Filler words detected: 'uhh', 'mmm'" },
              { id: '7', start: 75, end: 90, text: "Our team has worked tirelessly to ensure top quality.", keep: true },
              { id: '8', start: 90, end: 120, text: "Thank you for your attention. Any questions?", keep: true },
            ]
          };
          
          setTranscriptData(mockTranscriptData);
          setIsProcessing(false);
          setCurrentStep('analyze');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  // Simulate analysis process
  const startAnalysis = () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setCurrentStep('review');
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // Toggle segment keep status
  const toggleSegmentKeep = (id: string) => {
    if (transcriptData) {
      setTranscriptData({
        ...transcriptData,
        segments: transcriptData.segments.map(segment => 
          segment.id === id ? { ...segment, keep: !segment.keep } : segment
        )
      });
    }
  };

  // Update segment text
  const updateSegmentText = (id: string, newText: string) => {
    if (transcriptData) {
      setTranscriptData({
        ...transcriptData,
        segments: transcriptData.segments.map(segment => 
          segment.id === id ? { ...segment, text: newText } : segment
        )
      });
    }
  };

  // Export video
  const exportVideo = () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          alert("Video exported successfully! Download would start in a real implementation.");
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  // Play/pause current segment
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

  // Jump to specific segment
  const jumpToSegment = (index: number) => {
    if (videoRef.current && transcriptData) {
      const segment = transcriptData.segments[index];
      videoRef.current.currentTime = segment.start;
      setCurrentSegmentIndex(index);
      setCurrentTime(segment.start);
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current && transcriptData) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);
      
      // Find current segment based on time
      const index = transcriptData.segments.findIndex(
        segment => currentTime >= segment.start && currentTime < segment.end
      );
      
      if (index !== -1 && index !== currentSegmentIndex) {
        setCurrentSegmentIndex(index);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>
            1. Upload
          </TabsTrigger>
          <TabsTrigger value="transcribe" disabled={currentStep !== 'transcribe'}>
            2. Transcribe
          </TabsTrigger>
          <TabsTrigger value="analyze" disabled={currentStep !== 'analyze'}>
            3. Analyze
          </TabsTrigger>
          <TabsTrigger value="review" disabled={currentStep !== 'review'}>
            4. Review
          </TabsTrigger>
          <TabsTrigger value="export" disabled={currentStep !== 'export'}>
            5. Export
          </TabsTrigger>
        </TabsList>

        {/* Upload Step */}
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>
                Select a video file to begin the automatic trimming process
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to browse or drag and drop your video file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supports MP4, MOV, AVI, and other common formats
                </p>
              </div>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcribe Step */}
        <TabsContent value="transcribe" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transcribe Video</CardTitle>
              <CardDescription>
                We'll generate a transcript of your video content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videoUrl && (
                <div className="mb-6">
                  <video
                    src={videoUrl}
                    className="w-full rounded-lg"
                    controls
                  />
                </div>
              )}
              
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                    <span>Transcribing video...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-gray-500">This may take a few minutes depending on video length</p>
                </div>
              ) : (
                <Button onClick={startTranscription} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Start Transcription
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyze Step */}
        <TabsContent value="analyze" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Content</CardTitle>
              <CardDescription>
                We'll analyze the transcript for filler words, pauses, and other issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transcriptData && (
                <div className="mb-6 space-y-4">
                  <p className="text-sm">Transcript generated successfully! Preview:</p>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 text-sm">
                    {transcriptData.segments.map((segment) => (
                      <p key={segment.id} className="mb-2">{segment.text}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-blue-500" />
                    <span>Analyzing content...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">Checking for filler words</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">Identifying pauses</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">Analyzing speech clarity</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">Detecting repetitions</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Button onClick={startAnalysis} className="w-full">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Step */}
        <TabsContent value="review" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Review and Edit</CardTitle>
              <CardDescription>
                Review the analyzed segments and customize which parts to keep or remove
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videoUrl && transcriptData && (
                <div className="space-y-6">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full rounded-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="bg-white rounded-full"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? 
                          <PauseCircle className="h-6 w-6 text-blue-500" /> : 
                          <PlayCircle className="h-6 w-6 text-blue-500" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Timeline</span>
                      <span className="text-sm">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(transcriptData.duration / 60)}:{Math.floor(transcriptData.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg">
                      {transcriptData.segments.map((segment) => (
                        <div 
                          key={segment.id}
                          className={`absolute h-full cursor-pointer ${segment.keep ? 'bg-green-200' : 'bg-red-200'}`}
                          style={{
                            left: `${(segment.start / transcriptData.duration) * 100}%`,
                            width: `${((segment.end - segment.start) / transcriptData.duration) * 100}%`
                          }}
                          onClick={() => jumpToSegment(transcriptData.segments.findIndex(s => s.id === segment.id))}
                        />
                      ))}
                      <div 
                        className="absolute h-full w-0.5 bg-blue-500 z-10"
                        style={{ left: `${(currentTime / transcriptData.duration) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-medium">Segments</h3>
                    
                    {transcriptData.segments.map((segment, index) => (
                      <div 
                        key={segment.id} 
                        className={`p-4 rounded-lg border ${currentSegmentIndex === index ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">Segment {index + 1}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              {Math.floor(segment.start / 60)}:{Math.floor(segment.start % 60).toString().padStart(2, '0')} - {Math.floor(segment.end / 60)}:{Math.floor(segment.end % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => jumpToSegment(index)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Play
                            </Button>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={segment.keep} 
                                onCheckedChange={() => toggleSegmentKeep(segment.id)}
                                id={`keep-${segment.id}`}
                              />
                              <Label htmlFor={`keep-${segment.id}`}>
                                {segment.keep ? 'Keep' : 'Remove'}
                              </Label>
                            </div>
                          </div>
                        </div>
                        
                        <Textarea 
                          value={segment.text} 
                          onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                          className="w-full mt-2"
                          rows={2}
                        />
                        
                        {segment.reason && !segment.keep && (
                          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm flex items-start">
                            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{segment.reason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('analyze')}>
                Back to Analysis
              </Button>
              <Button onClick={() => setCurrentStep('export')}>
                Continue to Export
                <Scissors className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Export Step */}
        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Trimmed Video</CardTitle>
              <CardDescription>
                Generate your final video with unwanted segments removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transcriptData && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Export Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Original Length</p>
                        <p className="font-medium">{Math.floor(transcriptData.duration / 60)}:{Math.floor(transcriptData.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trimmed Length</p>
                        <p className="font-medium">
                          {(() => {
                            const keptDuration = transcriptData.segments
                              .filter(segment => segment.keep)
                              .reduce((total, segment) => total + (segment.end - segment.start), 0);
                            return `${Math.floor(keptDuration / 60)}:${Math.floor(keptDuration % 60).toString().padStart(2, '0')}`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Segments Kept</p>
                        <p className="font-medium">{transcriptData.segments.filter(segment => segment.keep).length} of {transcriptData.segments.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reduction</p>
                        <p className="font-medium">
                          {(() => {
                            const keptDuration = transcriptData.segments
                              .filter(segment => segment.keep)
                              .reduce((total, segment) => total + (segment.end - segment.start), 0);
                            const reduction = Math.round((1 - (keptDuration / transcriptData.duration)) * 100);
                            return `${reduction}%`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Export Options</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="format">Format</Label>
                        <select id="format" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="mp4">MP4</option>
                          <option value="mov">MOV</option>
                          <option value="webm">WEBM</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quality">Quality</Label>
                        <select id="quality" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="high">High (Original)</option>
                          <option value="medium">Medium (720p)</option>
                          <option value="low">Low (480p)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="transcript" />
                      <Label htmlFor="transcript">Include transcript file</Label>
                    </div>
                  </div>
                  
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Scissors className="mr-2 h-5 w-5 text-blue-500" />
                        <span>Processing video...</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-gray-500">This may take a few minutes depending on video length</p>
                    </div>
                  ) : (
                    <Button onClick={exportVideo} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Export Trimmed Video
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('review')}>
                Back to Review
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoTrimmer;