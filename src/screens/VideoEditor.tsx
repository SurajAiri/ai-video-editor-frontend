// src/components/VideoEditor.tsx


import { VideoUpload } from '@/components/video/VideoUpload';
import { useVideoStore } from '@/stores/VideoStore';

// These components will be implemented later
// import { Transcription } from '@/components/Transcription';
// import { Analysis } from '@/components/Analysis';
// import { Review } from '@/components/Review';
// import { Export } from '@/components/Export';

const steps = [
  { id: 'upload', title: 'Upload Video' },
  { id: 'transcribe', title: 'Transcribe' },
  { id: 'analyze', title: 'AI Analysis' },
  { id: 'review', title: 'Manual Review' },
  { id: 'export', title: 'Export' },
];

export function VideoEditor() {
  const { currentStep, setCurrentStep } = useVideoStore();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Video Editor</h1>
      
    <div className="mb-12">
      <nav aria-label="Progress">
        <ol role="list" className="flex space-x-2 md:space-x-4">
        {steps.map((step, stepIdx) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > stepIdx;
          
          return (
            <li key={step.id} className="flex-1">
            <button
              onClick={() => {
                const stepId = step.id as typeof currentStep;
                setCurrentStep(stepId);
              }}
              className={`relative flex flex-col items-center w-full text-sm font-medium ${
                isActive 
                ? 'text-blue-600' 
                : isCompleted 
                  ? 'text-green-600' 
                  : 'text-gray-500'
              }`}
            >
              <span className={`w-8 h-8 flex items-center justify-center rounded-full mb-2 ${
                isActive 
                ? 'bg-blue-100 border-2 border-blue-600' 
                : isCompleted 
                  ? 'bg-green-100 border-2 border-green-600' 
                  : 'border-2 border-gray-300'
              }`}>
                {isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ) : (
                stepIdx + 1
                )}
              </span>
              <span className="text-xs md:text-sm">{step.title}</span>
            </button>
            </li>
          );
        })}
        </ol>
      </nav>
    </div>
      
      {currentStep === 'upload' && <VideoUpload/>}
      {/* 
      {currentStep === 'transcribe' && <Transcription onComplete={() => setCurrentStep('analyze')} />}
      {currentStep === 'analyze' && <Analysis onComplete={() => setCurrentStep('review')} />}
      {currentStep === 'review' && <Review onComplete={() => setCurrentStep('export')} />}
      {currentStep === 'export' && <Export />}
      */}
    </div>
  );
}