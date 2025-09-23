import React, { useState, useRef, DragEvent } from 'react';
import './VideoUpload.css';

interface VideoUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onFileSelect,
  isUploading,
  uploadProgress,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'];
  const maxFileSize = 500 * 1024 * 1024; // 500MB

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validar formato
    if (!acceptedFormats.includes(file.type)) {
      alert('Formato de arquivo não suportado. Use: MP4, AVI, MOV, WMV ou MKV');
      return;
    }

    // Validar tamanho
    if (file.size > maxFileSize) {
      alert('Arquivo muito grande. Tamanho máximo: 500MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="video-upload-container">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${selectedFile ? 'file-selected' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <div className="upload-content">
            <div className="upload-icon">📹</div>
            <h3>Arraste e solte seu vídeo aqui</h3>
            <p>ou</p>
            <button
              className="browse-button"
              onClick={handleBrowseClick}
              disabled={isUploading}
            >
              Selecionar Arquivo
            </button>
            <div className="upload-info">
              <p>Formatos aceitos: MP4, AVI, MOV, WMV, MKV</p>
              <p>Tamanho máximo: 500MB</p>
            </div>
          </div>
        ) : (
          <div className="file-info">
            <div className="file-icon">🎬</div>
            <div className="file-details">
              <h4>{selectedFile.name}</h4>
              <p>{formatFileSize(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <div className="file-actions">
                <button
                  className="upload-button"
                  onClick={handleUpload}
                >
                  Iniciar Análise
                </button>
                <button
                  className="remove-button"
                  onClick={() => setSelectedFile(null)}
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        )}

        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Enviando... {uploadProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
