import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, FileVideo } from "lucide-react";
import { processAll, getStatus } from "@/apis/api";

// Map project status to progress percentage
const statusToProgress = {
  created: 5,
  uploaded: 10,
  transcript_start: 20,
  transcript_complete: 35,
  sent_analysis_start: 45,
  sent_analysis_end: 60,
  word_analysis_start: 70,
  word_analysis_end: 80,
  processed_invalid_segment: 90,
  trim_start: 95,
  completed: 100,
};

// Status steps with icons and descriptions
const processingSteps = [
  { key: "created", label: "Project Creation", description: "Initializing project resources" },
  { key: "uploaded", label: "Upload Processing", description: "Verifying video file" },
  { key: "transcript_start", label: "Transcription", description: "Converting speech to text" },
  { key: "transcript_complete", label: "Transcript Analysis", description: "Processing transcript data" },
  { key: "sent_analysis_start", label: "Sentence Analysis", description: "Processing language structures" },
  { key: "sent_analysis_end", label: "Semantic Processing", description: "Analyzing contextual meaning" },
  { key: "word_analysis_start", label: "Word Analysis", description: "Processing individual words" },
  { key: "word_analysis_end", label: "Language Processing", description: "Finalizing text analysis" },
  { key: "processed_invalid_segment", label: "Content Processing", description: "Identifying and processing segments" },
  { key: "trim_start", label: "Video Processing", description: "Optimizing video content" },
  { key: "completed", label: "Completion", description: "Analysis successfully completed" },
];

export default function VideoAnalysisLoading() {
  const { job_id } = useParams();
  const navigate = useNavigate();
  const [projectStatus, setProjectStatus] = useState<string>("created");
  const [progress, setProgress] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    // Call the process_all API when the component loads
    const startProcessing = async () => {
      try {
        if (!job_id) return;
        await processAll(job_id);
      } catch (err) {
        setError("Failed to start processing. Please try again.");
      }
    };

    startProcessing();
  }, [job_id]);

  useEffect(() => {
    if (!job_id) return;
    
    // Poll the status API every second
    const intervalId = setInterval(async () => {
      try {
        const response = await getStatus(job_id);
        console.log(response.project_status);
        
        // Get the current status and update progress
        const status = response.project_status;
        setProjectStatus(status);
        setProgress(statusToProgress[status] || 0);
        
        // Find the current step index
        const stepIndex = processingSteps.findIndex(step => step.key === status);
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex);
        }
        
        // Check if processing is complete or at processed_invalid_segment
        if (status === "processed_invalid_segment" || status === "completed") {
          setLoadingComplete(true);
          clearInterval(intervalId);
          
          // Navigate to next screen after a brief delay
          setTimeout(() => {
            navigate(`/editor/${job_id}`);
          }, 2000);
        }
      } catch (err) {
        setError("Failed to fetch status. Please refresh the page.");
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [job_id, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 mr-4 rounded-full">
            <FileVideo className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Analyzing Your Video</h2>
            <p className="text-gray-500 text-sm">Processing video content</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {processingSteps[currentStep]?.label || "Initializing..."}
            </span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-blue-100" />
          <p className="text-gray-500 text-xs mt-2">{processingSteps[currentStep]?.description}</p>
        </div>
        
        {/* Processing Steps Timeline */}
        <div className="space-y-6 mb-8">
          {processingSteps.slice(0, currentStep + 2).map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;
            
            return (
              <div key={step.key} className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {isCompleted ? (
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="bg-gray-200 rounded-full p-1">
                      <div className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className={`flex-1 ${isPending ? 'opacity-50' : ''}`}>
                  <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Processing Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
        
        {/* Completion State */}
        {loadingComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Analysis Complete</p>
              <p className="text-xs text-green-700 mt-1">
                Redirecting you to the editor...
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading Animation at the bottom */}
      <div className="mt-8">
        <div className="flex justify-center items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "450ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "600ms" }}></div>
        </div>
      </div>
    </div>
  );
}