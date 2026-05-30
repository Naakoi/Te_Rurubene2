import { useState, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import axios from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadOptions {
  file: File;
  title: string;
  mediaType: 'audio' | 'video';
  isPremium: boolean;
  price: string;
}

export function useResumableUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const uploadIdRef = useRef<string | null>(null);
  const keyRef = useRef<string | null>(null);
  const partsRef = useRef<{ PartNumber: number; ETag: string }[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentChunkIndexRef = useRef(0);
  const optionsRef = useRef<UploadOptions | null>(null);

  const startUpload = async (options: UploadOptions) => {
    try {
      setStatus('uploading');
      setErrorMessage('');
      setProgress(0);
      optionsRef.current = options;
      partsRef.current = [];
      currentChunkIndexRef.current = 0;

      // 1. Init
      const { data: initData } = await api.post('/api/upload/multipart/init', {
        file_name: options.file.name,
        media_type: options.mediaType,
        file_type: options.file.type,
        is_premium: options.isPremium,
        price: options.price
      });

      uploadIdRef.current = initData.upload_id;
      keyRef.current = initData.key;

      await processChunks();
    } catch (err: any) {
      handleError(err);
    }
  };

  const processChunks = async () => {
    if (!optionsRef.current || !uploadIdRef.current || !keyRef.current) return;
    
    const file = optionsRef.current.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      while (currentChunkIndexRef.current < totalChunks) {
        if (status === 'paused') return;

        abortControllerRef.current = new AbortController();
        const chunkIndex = currentChunkIndexRef.current;
        const partNumber = chunkIndex + 1;
        
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // 2. Get Presigned URL
        const { data: presignData } = await api.post('/api/upload/multipart/presign', {
          upload_id: uploadIdRef.current,
          key: keyRef.current,
          part_number: partNumber
        });

        // 3. Upload Chunk directly to R2
        const response = await axios.put(presignData.url, chunk, {
          headers: {
            'Content-Type': file.type
          },
          signal: abortControllerRef.current.signal,
          onUploadProgress: (progressEvent) => {
            const uploadedSoFar = start + (progressEvent.loaded || 0);
            const percent = Math.round((uploadedSoFar * 100) / file.size);
            setProgress(percent);
          }
        });

        // Save ETag
        const eTag = response.headers.etag;
        partsRef.current.push({ PartNumber: partNumber, ETag: eTag });

        currentChunkIndexRef.current++;
      }

      // 4. Complete Upload
      if (currentChunkIndexRef.current === totalChunks) {
        setStatus('uploading'); // Ensure we show uploading during finalization
        setProgress(100);
        
        await api.post('/api/upload/multipart/complete', {
          upload_id: uploadIdRef.current,
          key: keyRef.current,
          parts: partsRef.current,
          title: optionsRef.current.title
        });

        setStatus('success');
      }

    } catch (err: any) {
      if (axios.isCancel(err)) {
        setStatus('paused');
      } else {
        handleError(err);
      }
    }
  };

  const pauseUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('paused');
  };

  const resumeUpload = () => {
    setStatus('uploading');
    processChunks();
  };

  const resetUpload = () => {
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    uploadIdRef.current = null;
    keyRef.current = null;
    partsRef.current = [];
    currentChunkIndexRef.current = 0;
    optionsRef.current = null;
  };

  const handleError = (err: any) => {
    console.error(err);
    setStatus('error');
    setErrorMessage(err.response?.data?.message || err.message || 'An error occurred during upload.');
  };

  return {
    progress,
    status,
    errorMessage,
    startUpload,
    pauseUpload,
    resumeUpload,
    resetUpload
  };
}
