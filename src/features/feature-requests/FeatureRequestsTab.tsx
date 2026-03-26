'use client';

import { useState, useRef } from 'react';

const PRIORITY_OPTIONS = [
  { value: '', label: 'Select priority...' },
  { value: 'Critical', label: 'Critical' },
  { value: 'Important', label: 'Important' },
  { value: 'Nice to have', label: 'Nice to have' },
];

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface FeatureRequestsTabProps {
  testerId: number | null;
}

export default function FeatureRequestsTab({ testerId }: FeatureRequestsTabProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [useCase, setUseCase] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 30 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 30MB.`);
        return false;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`File ${file.name} is not a supported format.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((file) => {
      if (file.size > 30 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 30MB.`);
        return false;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`File ${file.name} is not a supported format.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return uploadedFiles.map((f) => f.url);

    setUploading(true);
    const urls: string[] = [...uploadedFiles.map((f) => f.url)];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'feature-requests');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          urls.push(data.url);
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, url: data.url, type: file.type },
          ]);
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }

    setFiles([]);
    setUploading(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerId) {
      setMessage({ type: 'error', text: 'Session expired. Please refresh the page.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Upload files first
      const mediaUrls = await uploadFiles();

      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerId,
          title,
          description,
          priority,
          useCase,
          mediaUrls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Feature request submitted successfully!' });
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('');
        setUseCase('');
        setFiles([]);
        setUploadedFiles([]);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit feature request' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = title && description && priority && useCase;

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
            Feature Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title for the feature request"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the feature in detail..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent bg-white"
            required
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Use Case */}
        <div>
          <label htmlFor="useCase" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
            Why do you need this? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="useCase"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Explain your use case and why this feature would be valuable..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent resize-none"
            required
          />
        </div>

        {/* File Upload (Optional) */}
        <div>
          <label className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
            Attachments (Optional - Images/Videos up to 30MB)
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[var(--procore-orange)] transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-[var(--procore-gray)]">
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm">Drag and drop files here, or click to select</p>
            </div>
          </div>

          {/* File List */}
          {(files.length > 0 || uploadedFiles.length > 0) && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`uploaded-${index}`}
                  className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-green-700 truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    x
                  </button>
                </div>
              ))}
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-[var(--procore-gray)] truncate flex-1">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || uploading || !isFormValid}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading files...' : submitting ? 'Submitting...' : 'Submit Feature Request'}
        </button>
      </form>
    </div>
  );
}
