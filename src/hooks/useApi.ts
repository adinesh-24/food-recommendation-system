import { useState, useRef } from 'react';
import { getNextAvailableApiConfig, incrementApiUsage } from '@/config/api';
import { toast } from 'sonner';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
    details: Array<{
      '@type': string;
      violations?: Array<{
        quotaMetric: string;
        quotaId: string;
        quotaDimensions: {
          location: string;
          model: string;
        };
      }>;
      retryDelay?: string;
    }>;
  };
}

interface QueuedRequest {
  endpoint: string;
  options: RequestInit;
  resolve: (value: ApiResponse<any>) => void;
  reject: (reason: any) => void;
  retryCount: number;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const requestQueue = useRef<QueuedRequest[]>([]);
  const isProcessing = useRef(false);
  const lastRequestTime = useRef<number>(0);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processQueue = async () => {
    if (isProcessing.current || requestQueue.current.length === 0) return;

    isProcessing.current = true;
    const request = requestQueue.current[0];

    try {
      // Ensure minimum delay between requests (2 seconds)
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      if (timeSinceLastRequest < 2000) {
        await sleep(2000 - timeSinceLastRequest);
      }

      const result = await makeRequest(request.endpoint, request.options);
      lastRequestTime.current = Date.now();
      request.resolve(result);
    } catch (error: any) {
      if (error.message.includes('Rate limit exceeded') && request.retryCount < 3) {
        // Exponential backoff: 2^retryCount seconds
        const backoffTime = Math.pow(2, request.retryCount) * 1000;
        request.retryCount++;
        await sleep(backoffTime);
        requestQueue.current.push(request);
      } else {
        request.reject(error);
      }
    } finally {
      requestQueue.current.shift();
      isProcessing.current = false;
      if (requestQueue.current.length > 0) {
        setTimeout(processQueue, 2000); // Wait 2 seconds between requests
      }
    }
  };

  const makeRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const apiConfig = getNextAvailableApiConfig();
    
    if (!apiConfig) {
      return {
        data: null,
        error: 'All API keys have reached their quota limits. Please try again later.',
        loading: false
      };
    }

    try {
      // Merge the model parameters with the request body
      const requestBody = options.body ? JSON.parse(options.body as string) : {};
      const finalBody = {
        ...requestBody,
        generationConfig: {
          ...apiConfig.parameters,
          ...requestBody.generationConfig
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${apiConfig.model}:generateContent?key=${apiConfig.key}`, {
        ...options,
        body: JSON.stringify(finalBody),
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        const errorData: GeminiError = await response.json();
        const retryInfo = errorData.error.details.find(d => d['@type']?.includes('RetryInfo'));
        const retryDelay = retryInfo?.retryDelay || '60s';
        
        // Extract quota violation details
        const quotaViolations = errorData.error.details
          .find(d => d['@type']?.includes('QuotaFailure'))
          ?.violations || [];

        const quotaMessage = quotaViolations.map(v => {
          const metric = v.quotaMetric.split('/').pop() || '';
          const limit = v.quotaId.split('-').pop() || '';
          return `${metric} (${limit})`;
        }).join(', ');

        throw new Error(`Rate limit exceeded (${quotaMessage}). Try again after ${retryDelay}.`);
      }

      if (!response.ok) {
        const errorData: GeminiError = await response.json();
        throw new Error(errorData.error.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Estimate token count (rough estimation)
      const tokenCount = Math.ceil((JSON.stringify(finalBody).length + JSON.stringify(data).length) / 4);
      incrementApiUsage(apiConfig.key, tokenCount);
      
      return { data, error: null, loading: false };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'An error occurred while making the API request',
        loading: false
      };
    }
  };

  const callApi = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      requestQueue.current.push({
        endpoint,
        options,
        resolve: (result) => {
          setLoading(false);
          resolve(result);
        },
        reject: (error) => {
          setLoading(false);
          reject(error);
        },
        retryCount: 0
      });

      processQueue();
    });
  };

  return {
    callApi,
    loading
  };
}; 