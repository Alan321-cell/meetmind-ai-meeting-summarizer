import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileAudio, AlertCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { MeetingDetail } from '../api/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: MeetingDetail) => void;
}

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg', '.flac', '.aac'];
const MAX_FILE_SIZE_MB = 100;

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFile = (file: File): boolean => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes). Please upload a valid audio recording.');
      return false;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setError(`File size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed limit of ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }

    return true;
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);

    try {
      setUploadStep('Uploading audio file to backend...');
      const uploadRes = await api.uploadAudio(selectedFile);

      setUploadStep('Transcribing speech with Whisper & extracting AI insights...');
      const processedMeeting = await api.processMeeting(uploadRes.id);

      onSuccess(processedMeeting);
      onClose();
    } catch (err: any) {
      console.error('Upload/processing error:', err);
      setError(err.message || 'Failed to upload and process meeting. Please check backend connection.');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Meeting Audio</h2>
              <p className="text-xs text-slate-400">Transcribe voice and generate executive AI summaries</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-brand-400 bg-brand-500/10 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
                  <FileAudio className="w-7 h-7" />
                </div>
                <span className="text-sm font-semibold text-white max-w-sm truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                </span>
                <span className="mt-3 text-xs text-brand-400 hover:underline">
                  Click to replace audio file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7 text-brand-400" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your audio file here, or{' '}
                  <span className="text-brand-400 hover:text-brand-300 font-semibold">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Supports MP3, WAV, M4A, WebM, MP4, FLAC up to 100MB
                </p>
              </div>
            )}
          </div>

          {/* Supported format tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {['MP3', 'WAV', 'M4A', 'WebM', 'MP4 Audio', 'FLAC', 'OGG'].map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/50"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Uploading progress status text */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
              <span className="font-medium">{uploadStep}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 shadow-lg shadow-brand-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Audio...</span>
              </>
            ) : (
              <>
                <span>Start AI Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
