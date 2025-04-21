import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getStatus } from "@/apis/api";
import { ProjectStatus } from "@/types/MetadataModel";
import { useInvalidStore } from "@/stores/InvalidStore";
import useTranscriptStore from "@/stores/TranscriptStore";
import { ResponseModel } from "@/types/ResponseModel";
import { useParams } from "react-router-dom";
import SegmentReview from "@/components/video/SegmentReviewComponent";
import TranscriptEditor from "@/components/video/TranscriptEditorComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, Edit, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const VideoEditor = () => {
  const { job_id: jobId } = useParams();
  const [statusState, setStatusState] = useState<{
    isLoading: boolean;
    error: string | null;
    data: ResponseModel | null;
  }>({
    isLoading: false,
    error: null,
    data: null,
  });
  const [activeTab, setActiveTab] = useState("segment-review");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get invalid segments store actions and state
  const {
    fetchInvalidSegments,
    editing: invalidSegments,
    isLoading: invalidSegmentsLoading,
    error: invalidSegmentsError,
  } = useInvalidStore();

  // Get transcript store actions and state
  const {
    fetchTranscript,
    transcript,
    isLoading: transcriptLoading,
    error: transcriptError,
  } = useTranscriptStore();

  // Check if status is before PROCESSED_INVALID_SEGMENT
  const isStatusBeforeProcessedInvalidSegment = (status: string): boolean => {
    const statusOrder = Object.values(ProjectStatus);
    const currentStatusIndex = statusOrder.indexOf(status as ProjectStatus);
    const processedInvalidSegmentIndex = statusOrder.indexOf(
      ProjectStatus.PROCESSED_INVALID_SEGMENT
    );

    return currentStatusIndex < processedInvalidSegmentIndex;
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Check project status
  const checkProjectStatus = async () => {
    if (!jobId) return;

    setStatusState({
      isLoading: true,
      error: null,
      data: null,
    });

    try {
      const response = await getStatus(jobId);
      console.log("Project status response:", response);

      setStatusState({
        isLoading: false,
        error: null,
        data: response,
      });

      // Check if the status is valid to proceed
      if (response.project_status) {
        if (isStatusBeforeProcessedInvalidSegment(response.project_status)) {
          setStatusState((prev) => ({
            ...prev,
            error: `Project is still processing. Current status: ${response.project_status}`,
          }));
        } else {
          // Status is valid, fetch transcript and invalid segments
          fetchTranscript(jobId);
          fetchInvalidSegments(jobId);
        }
      }
    } catch (error) {
      setStatusState({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error checking project status",
        data: null,
      });
    }
  };

  // Initial check when component mounts
  useEffect(() => {
    if (jobId) {
      checkProjectStatus();
    }
  }, [jobId]);

  // Effect to handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullScreen]);

  // Show loading state if anything is loading
  const isLoading =
    statusState.isLoading || transcriptLoading || invalidSegmentsLoading;

  // Collect all errors
  const errors = [
    statusState.error,
    transcriptError,
    invalidSegmentsError,
  ].filter(Boolean);

  return (
    <div className={`${isFullScreen ? "fixed inset-0 z-50 bg-white overflow-hidden flex flex-col" : "min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100"}`}>
      <div className={`${isFullScreen ? "p-4 flex flex-col flex-grow" : "container mx-auto p-6"} space-y-6 ${isFullScreen ? "h-full" : ""}`}>
        {!isFullScreen && (
          <header className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h1 className="text-2xl font-bold text-gray-800">Video Editor</h1>
            <p className="text-gray-500 mt-1">
              Split and refine your video segments
            </p>
          </header>
        )}

        {/* Display any errors */}
        {errors.length > 0 && (
          <div className="space-y-3">
            {errors.map((error, index) => (
              <Alert
                key={index}
                variant="destructive"
                className="bg-red-50 border border-red-200 text-red-800"
              >
                <AlertTitle className="font-bold">Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
              <p className="text-blue-600 font-medium">
                Loading your project data...
              </p>
            </div>
          </div>
        )}

        {/* Project Status Information */}
        {!isFullScreen && statusState.data && !isLoading && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 4a1 1 0 100 2 1 1 0 000-2zm0 7a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm0-5a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Project Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Job ID</p>
                <p className="font-medium text-gray-800">
                  {statusState.data.job_id}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-2 ${
                      statusState.data.project_status ===
                      ProjectStatus.COMPLETED
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  ></span>
                  <p className="font-medium text-gray-800">
                    {statusState.data.project_status}
                  </p>
                </div>
              </div>
              {statusState.data.data?.input_path && (
                <div className="bg-blue-50 p-4 rounded-lg md:col-span-2">
                  <p className="text-sm text-gray-500">Input File</p>
                  <p className="font-medium text-gray-800 truncate">
                    {statusState.data.data.input_path}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content when data is successfully loaded */}
        {!isLoading &&
          !errors.length &&
          transcript.length > 0 && (
            <div className={`bg-white ${isFullScreen ? "border-0 h-full flex flex-col overflow-hidden" : "rounded-xl shadow-md border border-blue-100"} p-6`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-blue-50 p-1 rounded-lg">
                    <TabsTrigger 
                      value="segment-review"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
                    >
                      <Film className="h-4 w-4 mr-2" />
                      Segment Review
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transcript-editor"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Transcript Editor
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    onClick={toggleFullScreen}
                    variant="outline"
                    size="sm"
                    className="ml-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    {isFullScreen ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-1" />
                        Exit Full Screen
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-1" />
                        Full Screen
                      </>
                    )}
                  </Button>
                </div>

                <TabsContent 
                  value="segment-review" 
                  className={`bg-white rounded-lg h-full ${isFullScreen ? "overflow-auto" : "border border-blue-100 shadow-sm p-4"}`}
                >
                  <div className={`h-full ${isFullScreen ? "p-4" : ""}`}>
                    <SegmentReview jobId={jobId} />
                  </div>
                </TabsContent>

                <TabsContent 
                  value="transcript-editor"
                  className={`bg-white rounded-lg h-full ${isFullScreen ? "overflow-auto" : "border border-blue-100 shadow-sm p-4"}`}
                >
                  <div className={`h-full ${isFullScreen ? "p-4" : ""}`}>
                    <TranscriptEditor />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
      </div>
    </div>
  );
};

export default VideoEditor;
