// src/lib/api.ts
import axios from 'axios';
import { ResponseModel } from '../hooks/MetadataStore';

const API_BASE_URL = 'http://0.0.0.0:8000';

export const uploadFile = async (filePath: string): Promise<ResponseModel> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload?file_path=${encodeURIComponent(filePath)}`);
    console.log('File uploaded successfully:', response);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const processAll = async (jobId: string): Promise<ResponseModel> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/process_all`, {
      job_id: jobId
    });
    return response.data;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
};

export const getStatus = async (jobId: string): Promise<ResponseModel> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting status:', error);
    throw error;
  }
};
