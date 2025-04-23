// src/apis/api.ts
import { InvalidModel } from '@/types/InvalidModel';
import { ResponseModel } from '@/types/ResponseModel';
import axios from 'axios';


const API_BASE_URL = 'http://0.0.0.0:8000';

export const uploadFile = async (filePath: string): Promise<ResponseModel> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, {
      file_path: filePath
    });
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


export const getTranscriptWord = async (jobId: string): Promise<ResponseModel> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transcript/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting transcript word:', error);
    throw error;
  }
}

export const getInvalidSegments = async (jobId: string): Promise<ResponseModel> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invalids/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invalid segments:', error);
    throw error;
  }
}

export const simplifyInvalidModels = (invalids: InvalidModel[]): Pick<InvalidModel, 'start_time' | 'end_time' | 'type' | 'is_entire'>[] => {
  return invalids.map(invalid => ({
    start_time: invalid.start_time,
    end_time: invalid.end_time,
    type: invalid.type,
    is_entire: invalid.is_entire
  }));
};

export const saveInvalidSegments = async (jobId: string, segments: InvalidModel[]): Promise<ResponseModel> => {

  try {
    // const response = await axios.post(`${API_BASE_URL}/override_invalids/${jobId}`);
    const response = await axios.post(`${API_BASE_URL}/override_invalids/${jobId}`, { data: simplifyInvalidModels(segments) });
    return response.data;
  } catch (error) {
    console.error('Error saving invalid segments:', error);
    throw error;
  }
}