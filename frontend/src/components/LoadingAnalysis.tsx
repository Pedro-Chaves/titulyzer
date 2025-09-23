import React from 'react';
import './LoadingAnalysis.css';

interface LoadingAnalysisProps {
  filename: string;
}

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ filename }) => {
  return (
    <div className="loading-analysis-container">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        
        <h2>Analisando seu vídeo...</h2>
        <p className="filename">📹 {filename}</p>
        
        <div className="loading-steps">
          <div className="step active">
            <div className="step-icon">🎬</div>
            <span>Processando vídeo</span>
          </div>
          <div className="step active">
            <div className="step-icon">🎵</div>
            <span>Extraindo áudio</span>
          </div>
          <div className="step processing">
            <div className="step-icon">📝</div>
            <span>Transcrevendo conteúdo</span>
          </div>
          <div className="step">
            <div className="step-icon">🤖</div>
            <span>Analisando com IA</span>
          </div>
        </div>
        
        <div className="loading-message">
          <p>Este processo pode levar alguns minutos dependendo do tamanho do arquivo...</p>
          <p>Por favor, não feche esta janela.</p>
        </div>
      </div>
    </div>
  );
};
