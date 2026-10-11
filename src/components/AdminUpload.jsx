import { useParams, useNavigate } from 'react-router';
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../config/axios';
import { 
  Upload, Video, X, CheckCircle, AlertCircle, 
  Loader2, ArrowLeft, FileVideo, Clock, HardDrive,
  Play
} from 'lucide-react';

function AdminUpload() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);  //upload ho raha h ya nhi
  const [uploadProgress, setUploadProgress] = useState(0); // kitna video upload ho gya
  const [uploadedVideo, setUploadedVideo] = useState(null); // // when video is uploaded metadata is stored inside it 
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors
  } = useForm();

  const selectedFile = watch('videoFile')?.[0];

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

  // Separate ref from register so we can use both react-hook-form ref and our own ref
  const { ref: registerRef, ...registerRest } = register('videoFile', {
    required: 'Please select a video file',
    validate: {
      isVideo: (files) => {
        if (!files?.[0]) return 'Please select a video file';
        const file = files[0];
        if (file.type.startsWith('video/')) return true;
        if (ACCEPTED_TYPES.includes(file.type)) return true;
        return 'Please select a valid video file';
      },
      fileSize: (files) => {
        if (!files?.[0]) return true;
        return files[0].size <= MAX_FILE_SIZE || 'File size must be less than 100MB';
      }
    }
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Manually set file to input so react-hook-form picks it up
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      // Trigger change event manually so react-hook-form updates
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
      clearErrors('videoFile');
    }
  };

  const clearFile = () => {
    reset();
    setUploadedVideo(null);
    clearErrors();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    const file = data.videoFile?.[0];

    if (!file) {
      return;
    }

    setUploading(true);  //uploading shuru hogyi
    setUploadProgress(0);  // abhi 0% upload hoi hai
    clearErrors();
    setUploadedVideo(null);

    try {
      const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
      const { signature, timestamp, public_id, api_key, upload_url } = signatureResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      const uploadResponse = await axios.post(upload_url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      const cloudinaryResult = uploadResponse.data;

      const metadataResponse = await axiosClient.post('/video/save', {
        problemId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
      });

      setUploadedVideo(metadataResponse.data.videoSolution);
      reset();  //form ko reset kardega
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('root', {
        type: 'manual',
        message: err.response?.data?.message || err.message || 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Admin
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Video Solution</h1>
          <p className="text-gray-400 text-sm">
            Add a video explanation for problem ID: <span className="text-purple-400 font-mono">{problemId?.slice(-8)}</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">

            {/* Single hidden input — registered with react-hook-form + our own ref */}
            <input
              type="file"
              accept="video/*"
              {...registerRest}
              ref={(e) => {
                registerRef(e);              // react-hook-form ref
                fileInputRef.current = e;    // our ref
              }}
              className="hidden"
              disabled={uploading}
            />

            {/* Drop Zone */}
            {!selectedFile && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                    : 'border-slate-600 hover:border-purple-500/50 hover:bg-slate-700/30'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    dragActive ? 'bg-purple-500' : 'bg-slate-700'
                  }`}>
                    <Upload className={`w-6 h-6 ${dragActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      {dragActive ? 'Drop video here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-gray-400">
                      MP4, WebM, OGG, MOV • Max 100MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected File Info */}
            {selectedFile && !uploading && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileVideo className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(selectedFile.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {selectedFile.type.split('/')[1]?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-sm text-white font-medium">Uploading video...</span>
                  </div>
                  <span className="text-sm text-purple-400 font-mono font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Please don't close this page while uploading
                </p>
              </div>
            )}

            {/* Validation Error */}
            {errors.videoFile && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{errors.videoFile.message}</p>
              </div>
            )}

            {/* Root Error */}
            {errors.root && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Success Message */}
            {uploadedVideo && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-semibold">Video uploaded successfully!</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/50 rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">Duration</p>
                    <p className="text-white font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(uploadedVideo.duration)}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">Uploaded at</p>
                    <p className="text-white">
                      {new Date(uploadedVideo.uploadedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {uploadedVideo.secureUrl && (
                  <a
                    href={uploadedVideo.secureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    Preview video
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={clearFile}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl font-medium text-gray-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadedVideo ? 'Upload Another' : 'Clear'}
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  uploading || !selectedFile
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Supported formats: MP4, WebM, OGG, MOV • Maximum size: 100MB</p>
        </div>
      </div>
    </div>
  );
}

export default AdminUpload;