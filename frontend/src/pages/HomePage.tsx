import React, { useState } from 'react';
import { VideoUpload } from '../components/VideoUpload';
import { LoadingAnalysis } from '../components/LoadingAnalysis';
import { videoService } from '../services/api';
import { UploadResponse } from '../types';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      setIsUploading(true);
      setCurrentFile(file.name);
      setUploadProgress(0);

      // Simular progresso de upload
      const response = await videoService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      setIsUploading(false);
      setIsAnalyzing(true);

      // A análise já foi feita no backend, então podemos mostrar o resultado
      setAnalysisResult(response);
      setIsAnalyzing(false);

    } catch (err: any) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError(err.response?.data?.message || 'Erro ao processar o vídeo. Tente novamente.');
      console.error('Erro no upload:', err);
    }
  };

  const handleStartOver = () => {
    setAnalysisResult(null);
    setError('');
    setCurrentFile('');
    setUploadProgress(0);
  };

  if (isAnalyzing) {
    return <LoadingAnalysis filename={currentFile} />;
  }

  if (analysisResult) {
    return (
      <div className="homepage-container">
        <div className="result-container">
          <div className="result-header">
            <h1>✅ Análise Concluída!</h1>
            <p className="filename">📹 {analysisResult.filename}</p>
          </div>

          <div className="result-content">
            <div className="result-section">
              <h2>📝 Transcrição</h2>
              <div className="transcription-box">
                <p>{analysisResult.transcription || 'Nenhuma transcrição encontrada.'}</p>
              </div>
            </div>

            <div className="result-section">
              <h2>🤖 Análise de IA</h2>
              <div className="analysis-box">
                <p>{analysisResult.analysis || 'Nenhuma análise disponível.'}</p>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button className="primary-button" onClick={handleStartOver}>
              Analisar Novo Vídeo
            </button>
            <button className="secondary-button" onClick={() => window.print()}>
              Imprimir Resultado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <h1>🎬 Titulyzer</h1>
        <p>Análise inteligente de vídeos com transcrição automática e insights de IA</p>
      </div>

      <VideoUpload
        onFileSelect={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {error && (
        <div className="error-message">
          <h3>❌ Erro</h3>
          <p>{error}</p>
          <button onClick={() => setError('')} className="error-dismiss">
            Tentar Novamente
          </button>
        </div>
      )}

      <div className="homepage-info">
        <h3>Como funciona?</h3>
        <div className="info-steps">
          <div className="info-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Upload do Vídeo</h4>
              <p>Faça upload do seu vídeo em formatos MP4, AVI, MOV, WMV ou MKV</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Processamento</h4>
              <p>Extraímos o áudio e fazemos a transcrição automática</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Análise IA</h4>
              <p>Nossa IA analisa o conteúdo e gera insights valiosos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
