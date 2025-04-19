// src/components/video/VideoUploader.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Video, X } from 'lucide-react';
import useVideoStore from '@/hooks/MetadataStore';
import { uploadFile } from '@/apis/api';
import { MetadataModel } from '@/types/MetadataModel';
import { useNavigate } from 'react-router-dom';

const VideoUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const navigate = useNavigate();
  
  const { 
    selectedFile, 
    videoPreviewUrl, 
    isLoading,
    setSelectedFile, 
    setVideoPreviewUrl, 
    setIsLoading,
    setMetadata,
  } = useVideoStore();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      return;
    }
    
    setUploadError(null);
    setSelectedFile(file);
    
    // Create object URL for video preview
    const fileUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(fileUrl);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      setUploadError(null);
      
      // In a real scenario, you would upload the actual file
      // For now, we'll simulate by using the file path as is
      // Note: In a real app, you'd need to handle file uploads differently
      const fileDir = "/Users/suraj/Movies/";
      const filePath = `${fileDir}${selectedFile.name}`;
      const response = await uploadFile(filePath);
      
      if (response.status === 'success' && response.data) {
      
        setMetadata(response.data as MetadataModel);
        
        // In a real application, this would navigate to the processing screen
        console.log('Upload successful:', response);
        // go to analysis creen
        navigate(`/analysis/${response.data.job_id}`);
      } else {
        setUploadError('Upload failed: ' + response.message);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upload Video</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="video/*"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <Upload size={40} className="text-gray-400" />
              <p className="text-lg font-medium">Drag and drop a video file here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              src={videoPreviewUrl || undefined}
              controls
              className="w-full rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
              onClick={handleRemoveFile}
            >
              <X size={18} />
            </Button>
          </div>
        )}
        
        {uploadError && (
          <p className="text-red-500 mt-2 text-center">{uploadError}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleRemoveFile}
          disabled={!selectedFile || isLoading}
        >
          Clear
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isLoading}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Uploading...
            </>
          ) : (
            <>
              <Video size={18} />
              Process Video
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VideoUploader;